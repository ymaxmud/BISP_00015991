from rest_framework import serializers

from avicenna.access import patient_profile_id

from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor_profile.full_name', read_only=True)
    patient_name = serializers.SerializerMethodField()
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    doctor_specialties = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id',
            'organization',
            'organization_name',
            'patient_profile',
            'patient_name',
            'doctor_profile',
            'doctor_name',
            'doctor_specialties',
            'department',
            'department_name',
            'status',
            'appointment_type',
            'appointment_time',
            'reason',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'created_at',
            'updated_at',
            'doctor_name',
            'doctor_specialties',
            'organization_name',
            'patient_name',
            'department_name',
        ]
        extra_kwargs = {
            'organization': {'required': False},
            'patient_profile': {'required': False},
            'department': {'required': False, 'allow_null': True},
            'status': {'required': False},
            'appointment_type': {'required': False},
            'reason': {'required': False},
        }

    def get_patient_name(self, obj):
        return str(obj.patient_profile)

    def get_doctor_specialties(self, obj):
        return [
            item.specialty.name
            for item in obj.doctor_profile.specialties.select_related('specialty').all()
        ]

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated or not self.instance:
            return attrs

        if patient_profile_id(user):
            forbidden = {'patient_profile', 'doctor_profile', 'organization', 'department'} & set(attrs)
            if forbidden:
                raise serializers.ValidationError(
                    'Patients cannot reassign doctors, clinics, or patient records on an existing appointment.'
                )
            next_status = attrs.get('status')
            if next_status and next_status != Appointment.Status.CANCELLED:
                raise serializers.ValidationError(
                    {'status': 'Patients can only cancel their own appointments.'}
                )

        return attrs
