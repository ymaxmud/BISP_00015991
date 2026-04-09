from rest_framework import serializers

from organizations.models import Specialty
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
        queryset=Specialty.objects.all(),
        source='_specialty_ids',
    )

    class Meta:
        model = DoctorProfile
        fields = [
            'id', 'user', 'organization',
            'full_name', 'gender', 'position', 'avatar',
            'years_experience', 'education', 'license_number', 'license_document',
            'working_history',
            'bio', 'languages', 'services',
            'consultation_fee', 'consultation_duration_minutes',
            'working_hours', 'accepts_new_patients',
            'id_document', 'agreed_to_terms', 'is_verified',
            'ai_enabled', 'ai_feature_flags',
            'public_slug', 'is_active', 'is_public',
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
