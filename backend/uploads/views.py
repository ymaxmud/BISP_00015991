from rest_framework import parsers, permissions, viewsets
from rest_framework import serializers

from avicenna.access import (
    doctor_profile_id,
    has_organization_access,
    is_superadmin,
    organization_ids_for_user,
    patient_profile_id,
)
from .models import UploadedReport
from .serializers import UploadedReportSerializer


class UploadedReportViewSet(viewsets.ModelViewSet):
    queryset = UploadedReport.objects.select_related(
        'patient_profile', 'uploaded_by_user', 'appointment'
    ).all()
    serializer_class = UploadedReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    filterset_fields = ['patient_profile', 'validation_status', 'appointment']
    search_fields = ['file_name']

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
            return qs.filter(appointment__doctor_profile_id=own_doctor_id)
        org_ids = organization_ids_for_user(user)
        if org_ids:
            return qs.filter(appointment__organization_id__in=org_ids)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        appointment = serializer.validated_data.get('appointment')
        patient = serializer.validated_data.get('patient_profile')

        own_patient_id = patient_profile_id(user)
        own_doctor_id = doctor_profile_id(user)

        if own_patient_id:
            patient = user.patient_profile
            if appointment and appointment.patient_profile_id != patient.id:
                raise serializers.ValidationError(
                    {'appointment': 'This appointment does not belong to the logged-in patient.'}
                )
        elif is_superadmin(user):
            if patient is None:
                raise serializers.ValidationError(
                    {'patient_profile': 'This field is required.'}
                )
        elif own_doctor_id:
            if patient is None or appointment is None:
                raise serializers.ValidationError(
                    {'appointment': 'Doctors must attach uploads to an accessible appointment.'}
                )
            if appointment.doctor_profile_id != own_doctor_id:
                raise serializers.ValidationError(
                    {'appointment': 'You can only upload reports for your own appointments.'}
                )
            if appointment.patient_profile_id != patient.id:
                raise serializers.ValidationError(
                    {'patient_profile': 'Patient must match the selected appointment.'}
                )
        else:
            if patient is None or appointment is None:
                raise serializers.ValidationError(
                    {'appointment': 'Staff uploads must be linked to a patient appointment.'}
                )
            if not has_organization_access(user, appointment.organization_id):
                raise serializers.ValidationError(
                    {'appointment': 'You can only upload reports inside your own organization.'}
                )
            if appointment.patient_profile_id != patient.id:
                raise serializers.ValidationError(
                    {'patient_profile': 'Patient must match the selected appointment.'}
                )

        serializer.save(patient_profile=patient, uploaded_by_user=user)
