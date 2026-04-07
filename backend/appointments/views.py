from django_filters import rest_framework as df_filters
from rest_framework import permissions, viewsets

from .models import Appointment
from .serializers import AppointmentSerializer


class AppointmentFilter(df_filters.FilterSet):
    date_from = df_filters.DateTimeFilter(field_name='appointment_time', lookup_expr='gte')
    date_to = df_filters.DateTimeFilter(field_name='appointment_time', lookup_expr='lte')

    class Meta:
        model = Appointment
        fields = ['doctor_profile', 'patient_profile', 'status', 'organization', 'department']


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.select_related(
        'organization', 'patient_profile', 'doctor_profile', 'department'
    ).all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = AppointmentFilter
    search_fields = ['reason', 'appointment_type']
    ordering_fields = ['appointment_time', 'created_at', 'status']
