from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from avicenna.access import doctor_profile_id, is_superadmin, organization_ids_for_user, patient_profile_id

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

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_superadmin(user):
            return qs
        own_patient_id = patient_profile_id(user)
        if own_patient_id:
            return qs.filter(id=own_patient_id)
        own_doctor_id = doctor_profile_id(user)
        if own_doctor_id:
            return qs.filter(appointments__doctor_profile_id=own_doctor_id).distinct()
        org_ids = organization_ids_for_user(user)
        if org_ids:
            return qs.filter(appointments__organization_id__in=org_ids).distinct()
        return qs.none()


class MedicalHistoryViewSet(viewsets.ModelViewSet):
    queryset = MedicalHistory.objects.select_related('patient_profile').all()
    serializer_class = MedicalHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['patient_profile']

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
            return qs.filter(patient_profile__appointments__doctor_profile_id=own_doctor_id).distinct()
        org_ids = organization_ids_for_user(user)
        if org_ids:
            return qs.filter(patient_profile__appointments__organization_id__in=org_ids).distinct()
        return qs.none()

    def perform_create(self, serializer):
        if not is_superadmin(self.request.user):
            raise PermissionDenied('Medical history records are created through registration.')
        serializer.save()


class FamilyMemberViewSet(viewsets.ModelViewSet):
    queryset = FamilyMember.objects.select_related('patient_profile').all()
    serializer_class = FamilyMemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['patient_profile']

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
            return qs.filter(patient_profile__appointments__doctor_profile_id=own_doctor_id).distinct()
        org_ids = organization_ids_for_user(user)
        if org_ids:
            return qs.filter(patient_profile__appointments__organization_id__in=org_ids).distinct()
        return qs.none()

    def perform_create(self, serializer):
        own_patient_id = patient_profile_id(self.request.user)
        if own_patient_id:
            serializer.save(patient_profile=self.request.user.patient_profile)
            return
        serializer.save()
