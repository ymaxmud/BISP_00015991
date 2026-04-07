from rest_framework import permissions, viewsets

from .models import Encounter
from .serializers import EncounterSerializer


class EncounterViewSet(viewsets.ModelViewSet):
    queryset = Encounter.objects.select_related(
        'appointment', 'doctor_profile'
    ).all()
    serializer_class = EncounterSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['appointment', 'doctor_profile']
