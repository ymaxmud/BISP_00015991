from rest_framework import serializers

from .models import (
    ChronicCondition,
    FamilyMember,
    IntakeSymptom,
    Medication,
    MedicalHistory,
    PatientProfile,
)


class MedicalHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalHistory
        fields = '__all__'
        read_only_fields = ['patient_profile', 'last_updated_at']


class FamilyMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = '__all__'
        read_only_fields = ['patient_profile']


class ChronicConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChronicCondition
        fields = ['id', 'code', 'label', 'notes']


class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = ['id', 'name', 'dosage', 'notes']


class IntakeSymptomSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntakeSymptom
        fields = ['id', 'description', 'duration', 'severity', 'created_at']
        read_only_fields = ['created_at']


class PatientProfileSerializer(serializers.ModelSerializer):
    medical_history = MedicalHistorySerializer(read_only=True)
    family_members = FamilyMemberSerializer(many=True, read_only=True)
    chronic_conditions = ChronicConditionSerializer(many=True, read_only=True)
    medications = MedicationSerializer(many=True, read_only=True)
    intake_symptoms = IntakeSymptomSerializer(many=True, read_only=True)

    class Meta:
        model = PatientProfile
        fields = [
            'id', 'user', 'first_name', 'last_name', 'dob', 'gender',
            'national_id', 'address', 'emergency_contact',
            'height_cm', 'weight_kg',
            'smoking', 'alcohol', 'physical_activity',
            'created_at',
            'medical_history', 'family_members',
            'chronic_conditions', 'medications', 'intake_symptoms',
        ]
        read_only_fields = ['user', 'created_at']
