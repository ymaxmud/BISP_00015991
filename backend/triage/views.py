from rest_framework import permissions, viewsets

from .models import AIOutput, AIRun, ReportChatMessage, ReportChatSession, TriageDecision
from .serializers import (
    AIOutputSerializer,
    AIRunSerializer,
    ReportChatMessageSerializer,
    ReportChatSessionSerializer,
    TriageDecisionSerializer,
)


class TriageDecisionViewSet(viewsets.ModelViewSet):
    queryset = TriageDecision.objects.select_related(
        'intake_form', 'specialty'
    ).all()
    serializer_class = TriageDecisionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['urgency_level', 'specialty', 'intake_form']


class AIRunViewSet(viewsets.ModelViewSet):
    queryset = AIRun.objects.select_related(
        'appointment', 'patient_profile', 'doctor_profile', 'output'
    ).all()
    serializer_class = AIRunSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['run_type', 'status', 'patient_profile', 'doctor_profile']


class AIOutputViewSet(viewsets.ModelViewSet):
    queryset = AIOutput.objects.select_related('ai_run').all()
    serializer_class = AIOutputSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['risk_level', 'ai_run']


class ReportChatSessionViewSet(viewsets.ModelViewSet):
    queryset = ReportChatSession.objects.select_related(
        'uploaded_report', 'doctor_profile'
    ).prefetch_related('messages').all()
    serializer_class = ReportChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['uploaded_report', 'doctor_profile']


class ReportChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ReportChatMessage.objects.select_related('session').all()
    serializer_class = ReportChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['session', 'sender_type']
