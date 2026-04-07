from rest_framework import permissions, viewsets

from .models import DoctorProfile
from .serializers import DoctorProfileSerializer


class DoctorProfileViewSet(viewsets.ModelViewSet):
    queryset = DoctorProfile.objects.select_related(
        'user', 'organization'
    ).prefetch_related('specialties__specialty').all()
    serializer_class = DoctorProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'public_slug'
    filterset_fields = ['organization', 'is_verified', 'is_active']
    search_fields = ['full_name', 'bio']
    ordering_fields = ['full_name', 'years_experience', 'consultation_fee', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        specialty = self.request.query_params.get('specialty')
        if specialty:
            qs = qs.filter(specialties__specialty__slug=specialty)
        city = self.request.query_params.get('city')
        if city:
            qs = qs.filter(organization__city__icontains=city)
        return qs.distinct()
