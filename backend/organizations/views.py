from rest_framework import permissions, viewsets

from .models import Department, Organization, Specialty, StaffRole
from .serializers import (
    DepartmentSerializer,
    OrganizationSerializer,
    SpecialtySerializer,
    StaffRoleSerializer,
)


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    filterset_fields = ['type', 'city']
    search_fields = ['name', 'city']


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.select_related('organization').all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ['organization']


class SpecialtyViewSet(viewsets.ModelViewSet):
    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    search_fields = ['name']


class StaffRoleViewSet(viewsets.ModelViewSet):
    queryset = StaffRole.objects.select_related('organization', 'user').all()
    serializer_class = StaffRoleSerializer
    filterset_fields = ['organization', 'user']
