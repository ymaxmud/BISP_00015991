from rest_framework import permissions, viewsets
from rest_framework import serializers

from avicenna.access import doctor_profile_id, has_organization_access, is_superadmin, organization_ids_for_user, patient_profile_id

from .models import Prescription
from .serializers import PrescriptionSerializer


class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.select_related('encounter').all()
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['encounter', 'source']
    search_fields = ['medication_name']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_superadmin(user):
            return qs
        own_patient_id = patient_profile_id(user)
        if own_patient_id:
            return qs.filter(encounter__appointment__patient_profile_id=own_patient_id)
        own_doctor_id = doctor_profile_id(user)
        if own_doctor_id:
            return qs.filter(encounter__doctor_profile_id=own_doctor_id)
        org_ids = organization_ids_for_user(user)
        if org_ids:
            return qs.filter(encounter__appointment__organization_id__in=org_ids)
        return qs.none()

    def perform_create(self, serializer):
        encounter = serializer.validated_data['encounter']
        user = self.request.user
        if not is_superadmin(user):
            own_doctor_id = doctor_profile_id(user)
            if own_doctor_id:
                if encounter.doctor_profile_id != own_doctor_id:
                    raise serializers.ValidationError(
                        {'encounter': 'Doctors can only write prescriptions for their own encounters.'}
                    )
            elif not has_organization_access(user, encounter.appointment.organization_id):
                raise serializers.ValidationError(
                    {'encounter': 'You can only work with encounters inside your own organization.'}
                )
        serializer.save()
