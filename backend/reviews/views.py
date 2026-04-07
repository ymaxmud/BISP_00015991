from django.db.models import Avg
from rest_framework import permissions, viewsets

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
        doctor_id = self.request.query_params.get('doctor_profile')
        if doctor_id:
            qs = qs.filter(doctor_profile_id=doctor_id)
        return qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        qs = self.filter_queryset(self.get_queryset())
        avg = qs.aggregate(avg_rating=Avg('rating'))
        response.data['avg_rating'] = avg['avg_rating']
        return response
