from rest_framework import permissions, viewsets
from rest_framework import serializers

from avicenna.access import doctor_profile_id, has_organization_access, is_superadmin, organization_ids_for_user, patient_profile_id

from .models import Encounter
from .serializers import EncounterSerializer


class EncounterViewSet(viewsets.ModelViewSet):
    queryset = Encounter.objects.select_related(
        'appointment', 'doctor_profile'
    ).all()
    serializer_class = EncounterSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['appointment', 'doctor_profile']

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
            return qs.filter(doctor_profile_id=own_doctor_id)
        org_ids = organization_ids_for_user(user)
        if org_ids:
            return qs.filter(appointment__organization_id__in=org_ids)
        return qs.none()

    def perform_create(self, serializer):
        appointment = serializer.validated_data['appointment']
        doctor = serializer.validated_data['doctor_profile']
        user = self.request.user
        if not is_superadmin(user):
            own_doctor_id = doctor_profile_id(user)
            if own_doctor_id:
                if doctor.id != own_doctor_id or appointment.doctor_profile_id != own_doctor_id:
                    raise serializers.ValidationError(
                        {'doctor_profile': 'Doctors can only create encounters for themselves.'}
                    )
            elif not has_organization_access(user, appointment.organization_id):
                raise serializers.ValidationError(
                    {'appointment': 'You can only create encounters inside your own organization.'}
                )
        if appointment.doctor_profile_id != doctor.id:
            raise serializers.ValidationError(
                {'doctor_profile': 'Encounter doctor must match the appointment doctor.'}
            )
        serializer.save()
