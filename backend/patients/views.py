from rest_framework import permissions, viewsets

from .models import FamilyMember, MedicalHistory, PatientProfile
from .serializers import (
    FamilyMemberSerializer,
    MedicalHistorySerializer,
    PatientProfileSerializer,
)


class PatientProfileViewSet(viewsets.ModelViewSet):
    queryset = PatientProfile.objects.select_related(
        'user', 'medical_history'
    ).prefetch_related('family_members').all()
    serializer_class = PatientProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['gender']
    search_fields = ['first_name', 'last_name', 'national_id']


class MedicalHistoryViewSet(viewsets.ModelViewSet):
    queryset = MedicalHistory.objects.select_related('patient_profile').all()
    serializer_class = MedicalHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['patient_profile']


class FamilyMemberViewSet(viewsets.ModelViewSet):
    queryset = FamilyMember.objects.select_related('patient_profile').all()
    serializer_class = FamilyMemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['patient_profile']
