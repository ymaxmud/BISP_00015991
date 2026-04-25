from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=False, allow_blank=True, default='')
    last_name = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'role', 'phone',
                  'preferred_language', 'first_name', 'last_name']
        extra_kwargs = {
            'username': {'required': False},
        }

    def validate_role(self, value):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated and request.user.is_superuser:
            return value
        if value != User.Role.PATIENT:
            raise serializers.ValidationError(
                'Public registration can only create patient accounts.'
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        # Auto-generate username from email if not provided
        if not validated_data.get('username'):
            validated_data['username'] = validated_data['email'].split('@')[0]
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        user = authenticate(username=attrs['email'], password=attrs['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'phone', 'preferred_language', 'is_active', 'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']
