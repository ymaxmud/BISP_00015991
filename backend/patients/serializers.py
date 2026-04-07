from rest_framework import serializers

from .models import FamilyMember, MedicalHistory, PatientProfile


class MedicalHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalHistory
        fields = '__all__'
        read_only_fields = ['last_updated_at']


class FamilyMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = '__all__'


class PatientProfileSerializer(serializers.ModelSerializer):
    medical_history = MedicalHistorySerializer(read_only=True)
    family_members = FamilyMemberSerializer(many=True, read_only=True)

    class Meta:
        model = PatientProfile
        fields = [
            'id', 'user', 'first_name', 'last_name', 'dob', 'gender',
            'national_id', 'address', 'emergency_contact', 'created_at',
            'medical_history', 'family_members',
        ]
        read_only_fields = ['created_at']
