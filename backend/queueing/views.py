from rest_framework import permissions, viewsets
from rest_framework import serializers

from avicenna.access import doctor_profile_id, is_superadmin, organization_ids_for_user, patient_profile_id

from .models import IntakeForm, QueueTicket
from .serializers import IntakeFormSerializer, QueueTicketSerializer


class IntakeFormViewSet(viewsets.ModelViewSet):
    queryset = IntakeForm.objects.select_related('appointment').all()
    serializer_class = IntakeFormSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['appointment', 'severity']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_superadmin(user):
            return qs
        own_patient_id = patient_profile_id(user)
        if own_patient_id:
            return qs.filter(appointment__patient_profile_id=own_patient_id)
        own_doctor_id = doctor_profile_id(user)
        if own_doctor_id:
            return qs.filter(appointment__doctor_profile_id=own_doctor_id)
        org_ids = organization_ids_for_user(user)
        if org_ids:
            return qs.filter(appointment__organization_id__in=org_ids)
        return qs.none()

    def perform_create(self, serializer):
        appointment = serializer.validated_data['appointment']
        own_patient_id = patient_profile_id(self.request.user)
        own_doctor_id = doctor_profile_id(self.request.user)
        org_ids = organization_ids_for_user(self.request.user)
        if not is_superadmin(self.request.user):
            if own_patient_id and appointment.patient_profile_id != own_patient_id:
                raise serializers.ValidationError(
                    {'appointment': 'You can only submit intake forms for your own appointments.'}
                )
            if own_doctor_id and appointment.doctor_profile_id != own_doctor_id:
                raise serializers.ValidationError(
                    {'appointment': 'You can only work with your own appointments.'}
                )
            if org_ids and appointment.organization_id not in org_ids and not own_patient_id and not own_doctor_id:
                raise serializers.ValidationError(
                    {'appointment': 'You can only work with appointments inside your own organization.'}
                )
        serializer.save()


class QueueTicketViewSet(viewsets.ModelViewSet):
    queryset = QueueTicket.objects.select_related('appointment').all()
    serializer_class = QueueTicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['triage_level', 'queue_status', 'appointment']
    ordering_fields = ['queue_number', 'assigned_at', 'triage_level']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_superadmin(user):
            return qs
        own_patient_id = patient_profile_id(user)
        if own_patient_id:
            return qs.filter(appointment__patient_profile_id=own_patient_id)
        own_doctor_id = doctor_profile_id(user)
        if own_doctor_id:
            return qs.filter(appointment__doctor_profile_id=own_doctor_id)
        org_ids = organization_ids_for_user(user)
        if org_ids:
            return qs.filter(appointment__organization_id__in=org_ids)
        return qs.none()
