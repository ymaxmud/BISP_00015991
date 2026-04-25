from rest_framework import permissions, viewsets

from avicenna.access import doctor_profile_id, is_superadmin, organization_ids_for_user, patient_profile_id

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

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_superadmin(user):
            return qs
        own_patient_id = patient_profile_id(user)
        if own_patient_id:
            return qs.filter(intake_form__appointment__patient_profile_id=own_patient_id)
        own_doctor_id = doctor_profile_id(user)
        if own_doctor_id:
            return qs.filter(intake_form__appointment__doctor_profile_id=own_doctor_id)
        org_ids = organization_ids_for_user(user)
        if org_ids:
            return qs.filter(intake_form__appointment__organization_id__in=org_ids)
        return qs.none()


class AIRunViewSet(viewsets.ModelViewSet):
    queryset = AIRun.objects.select_related(
        'appointment', 'patient_profile', 'doctor_profile', 'output'
    ).all()
    serializer_class = AIRunSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['run_type', 'status', 'patient_profile', 'doctor_profile']

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
            return qs.filter(appointment__organization_id__in=org_ids)
        return qs.none()


class AIOutputViewSet(viewsets.ModelViewSet):
    queryset = AIOutput.objects.select_related('ai_run').all()
    serializer_class = AIOutputSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['risk_level', 'ai_run']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_superadmin(user):
            return qs
        own_patient_id = patient_profile_id(user)
        if own_patient_id:
            return qs.filter(ai_run__patient_profile_id=own_patient_id)
        own_doctor_id = doctor_profile_id(user)
        if own_doctor_id:
            return qs.filter(ai_run__doctor_profile_id=own_doctor_id)
        org_ids = organization_ids_for_user(user)
        if org_ids:
            return qs.filter(ai_run__appointment__organization_id__in=org_ids)
        return qs.none()


class ReportChatSessionViewSet(viewsets.ModelViewSet):
    queryset = ReportChatSession.objects.select_related(
        'uploaded_report', 'doctor_profile'
    ).prefetch_related('messages').all()
    serializer_class = ReportChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['uploaded_report', 'doctor_profile']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_superadmin(user):
            return qs
        own_patient_id = patient_profile_id(user)
        if own_patient_id:
            return qs.filter(uploaded_report__patient_profile_id=own_patient_id)
        own_doctor_id = doctor_profile_id(user)
        if own_doctor_id:
            return qs.filter(doctor_profile_id=own_doctor_id)
        org_ids = organization_ids_for_user(user)
        if org_ids:
            return qs.filter(uploaded_report__appointment__organization_id__in=org_ids)
        return qs.none()


class ReportChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ReportChatMessage.objects.select_related('session').all()
    serializer_class = ReportChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['session', 'sender_type']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_superadmin(user):
            return qs
        own_patient_id = patient_profile_id(user)
        if own_patient_id:
            return qs.filter(session__uploaded_report__patient_profile_id=own_patient_id)
        own_doctor_id = doctor_profile_id(user)
        if own_doctor_id:
            return qs.filter(session__doctor_profile_id=own_doctor_id)
        org_ids = organization_ids_for_user(user)
        if org_ids:
            return qs.filter(session__uploaded_report__appointment__organization_id__in=org_ids)
        return qs.none()
