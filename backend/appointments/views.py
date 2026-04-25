from django_filters import rest_framework as df_filters
from rest_framework import permissions, serializers, viewsets

from avicenna.access import (
    doctor_profile_id,
    has_organization_access,
    is_superadmin,
    organization_ids_for_user,
    patient_profile_id,
)

from .models import Appointment
from .serializers import AppointmentSerializer


class AppointmentFilter(df_filters.FilterSet):
    date_from = df_filters.DateTimeFilter(field_name='appointment_time', lookup_expr='gte')
    date_to = df_filters.DateTimeFilter(field_name='appointment_time', lookup_expr='lte')

    class Meta:
        model = Appointment
        fields = ['doctor_profile', 'patient_profile', 'status', 'organization', 'department']


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.select_related(
        'organization', 'patient_profile', 'doctor_profile', 'department'
    ).all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = AppointmentFilter
    search_fields = ['reason', 'appointment_type']
    ordering_fields = ['appointment_time', 'created_at', 'status']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_superadmin(user):
            return qs
        own_patient_id = patient_profile_id(user)
        if own_patient_id:
            return qs.filter(patient_profile_id=own_patient_id)
        own_doctor_id = doctor_profile_id(user)
        if own_doctor_id:
            return qs.filter(doctor_profile_id=own_doctor_id)
        org_ids = organization_ids_for_user(user)
        if org_ids:
            return qs.filter(organization_id__in=org_ids)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        doctor = serializer.validated_data.get('doctor_profile')
        patient = serializer.validated_data.get('patient_profile')
        department = serializer.validated_data.get('department')

        if doctor is None:
            raise serializers.ValidationError({'doctor_profile': 'This field is required.'})
        if doctor.organization_id is None:
            raise serializers.ValidationError(
                {'doctor_profile': 'Doctor must belong to an organization before booking.'}
            )

        own_patient_id = patient_profile_id(user)
        own_doctor_id = doctor_profile_id(user)
        if own_patient_id:
            patient = user.patient_profile
        elif own_doctor_id:
            if doctor.id != own_doctor_id:
                raise serializers.ValidationError(
                    {'doctor_profile': 'Doctors can only create appointments for themselves.'}
                )
            if patient is None:
                raise serializers.ValidationError(
                    {'patient_profile': 'This field is required.'}
                )
        elif not is_superadmin(user):
            if not has_organization_access(user, doctor.organization_id):
                raise serializers.ValidationError(
                    {'doctor_profile': 'You can only book inside your own organization.'}
                )
            if patient is None:
                raise serializers.ValidationError(
                    {'patient_profile': 'This field is required.'}
                )

        if department and department.organization_id != doctor.organization_id:
            raise serializers.ValidationError(
                {'department': 'Department must belong to the same organization as the doctor.'}
            )

        serializer.save(
            patient_profile=patient,
            organization=doctor.organization,
            status=(
                serializer.validated_data.get('status', Appointment.Status.SCHEDULED)
                if is_superadmin(user)
                else Appointment.Status.SCHEDULED
            ),
        )
