from django.db.models import Avg
from rest_framework import permissions, serializers, viewsets

from avicenna.access import doctor_profile_id, is_superadmin, organization_ids_for_user, patient_profile_id

from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related(
        'patient_profile', 'doctor_profile', 'appointment'
    ).all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ['doctor_profile', 'patient_profile', 'is_verified']
    ordering_fields = ['rating', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            qs = qs.filter(is_verified=True)
        elif is_superadmin(user):
            pass
        else:
            own_patient_id = patient_profile_id(user)
            if own_patient_id:
                qs = qs.filter(patient_profile_id=own_patient_id)
            else:
                own_doctor_id = doctor_profile_id(user)
                if own_doctor_id:
                    qs = qs.filter(doctor_profile_id=own_doctor_id)
                else:
                    org_ids = organization_ids_for_user(user)
                    if org_ids:
                        qs = qs.filter(doctor_profile__organization_id__in=org_ids)
                    else:
                        qs = qs.none()
        doctor_id = self.request.query_params.get('doctor_profile')
        if doctor_id:
            qs = qs.filter(doctor_profile_id=doctor_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        own_patient_id = patient_profile_id(user)
        appointment = serializer.validated_data['appointment']
        patient = serializer.validated_data.get('patient_profile')
        if own_patient_id:
            patient = user.patient_profile
            if appointment.patient_profile_id != own_patient_id:
                raise serializers.ValidationError(
                    {'appointment': 'You can only review your own appointment.'}
                )
        elif not is_superadmin(user):
            raise serializers.ValidationError(
                {'detail': 'Only patients can create reviews through this endpoint.'}
            )
        if patient.id != appointment.patient_profile_id:
            raise serializers.ValidationError(
                {'patient_profile': 'Patient must match the selected appointment.'}
            )
        if serializer.validated_data['doctor_profile'].id != appointment.doctor_profile_id:
            raise serializers.ValidationError(
                {'doctor_profile': 'Doctor must match the selected appointment.'}
            )
        serializer.save(patient_profile=patient)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        qs = self.filter_queryset(self.get_queryset())
        avg = qs.aggregate(avg_rating=Avg('rating'))
        response.data['avg_rating'] = avg['avg_rating']
        return response
