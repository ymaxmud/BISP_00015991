from rest_framework import permissions, viewsets

from .models import IntakeForm, QueueTicket
from .serializers import IntakeFormSerializer, QueueTicketSerializer


class IntakeFormViewSet(viewsets.ModelViewSet):
    queryset = IntakeForm.objects.select_related('appointment').all()
    serializer_class = IntakeFormSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['appointment', 'severity']


class QueueTicketViewSet(viewsets.ModelViewSet):
    queryset = QueueTicket.objects.select_related('appointment').all()
    serializer_class = QueueTicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['triage_level', 'queue_status', 'appointment']
    ordering_fields = ['queue_number', 'assigned_at', 'triage_level']
