from rest_framework import serializers

from organizations.serializers import SpecialtySerializer

from .models import DoctorProfile, DoctorSpecialty


class DoctorSpecialtySerializer(serializers.ModelSerializer):
    specialty_detail = SpecialtySerializer(source='specialty', read_only=True)

    class Meta:
        model = DoctorSpecialty
        fields = ['id', 'specialty', 'specialty_detail']


class DoctorProfileSerializer(serializers.ModelSerializer):
    specialties = DoctorSpecialtySerializer(many=True, read_only=True)
    specialty_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, required=False,
        queryset=__import__('organizations.models', fromlist=['Specialty']).Specialty.objects.all(),
        source='_specialty_ids',
    )

    class Meta:
        model = DoctorProfile
        fields = [
            'id', 'user', 'organization', 'full_name', 'bio',
            'years_experience', 'consultation_fee', 'public_slug',
            'is_verified', 'is_active', 'avatar', 'languages',
            'created_at', 'specialties', 'specialty_ids',
        ]
        read_only_fields = ['created_at']

    def create(self, validated_data):
        specialty_ids = validated_data.pop('_specialty_ids', [])
        profile = DoctorProfile.objects.create(**validated_data)
        for spec in specialty_ids:
            DoctorSpecialty.objects.create(doctor_profile=profile, specialty=spec)
        return profile

    def update(self, instance, validated_data):
        specialty_ids = validated_data.pop('_specialty_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if specialty_ids is not None:
            instance.specialties.all().delete()
            for spec in specialty_ids:
                DoctorSpecialty.objects.create(doctor_profile=instance, specialty=spec)
        return instance
