from rest_framework import permissions, viewsets

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
