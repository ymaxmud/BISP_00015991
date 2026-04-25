from rest_framework import permissions, viewsets

from avicenna.access import doctor_profile_id, is_superadmin, organization_ids_for_user, patient_profile_id

from .models import Reminder
from .serializers import ReminderSerializer


class ReminderViewSet(viewsets.ModelViewSet):
    queryset = Reminder.objects.select_related(
        'patient_profile', 'prescription'
    ).all()
    serializer_class = ReminderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['patient_profile', 'reminder_type', 'status']
    ordering_fields = ['scheduled_time', 'created_at']

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
            return qs.filter(prescription__encounter__doctor_profile_id=own_doctor_id)
        org_ids = organization_ids_for_user(user)
        if org_ids:
            return qs.filter(
                prescription__encounter__appointment__organization_id__in=org_ids
            ).distinct()
        return qs.none()
