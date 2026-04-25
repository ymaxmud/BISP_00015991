from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from avicenna.access import has_organization_access, is_org_admin, is_superadmin, organization_ids_for_user

from .models import Department, Organization, Specialty, StaffRole
from .serializers import (
    DepartmentSerializer,
    OrganizationSerializer,
    SpecialtySerializer,
    StaffRoleSerializer,
)


class ReadOnlyUnlessOrgAdmin(permissions.BasePermission):
    """
    Public directory reads are fine, but changing org metadata must stay limited
    to trusted admin users.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and is_org_admin(request.user))


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [ReadOnlyUnlessOrgAdmin]
    lookup_field = 'slug'
    filterset_fields = ['type', 'city']
    search_fields = ['name', 'city']

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.method in permissions.SAFE_METHODS or is_superadmin(self.request.user):
            return qs
        org_ids = organization_ids_for_user(self.request.user)
        return qs.filter(id__in=org_ids)


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.select_related('organization').all()
    serializer_class = DepartmentSerializer
    permission_classes = [ReadOnlyUnlessOrgAdmin]
    filterset_fields = ['organization']

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.method in permissions.SAFE_METHODS or is_superadmin(self.request.user):
            return qs
        org_ids = organization_ids_for_user(self.request.user)
        return qs.filter(organization_id__in=org_ids)


class SpecialtyViewSet(viewsets.ModelViewSet):
    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer
    permission_classes = [ReadOnlyUnlessOrgAdmin]
    lookup_field = 'slug'
    search_fields = ['name']


class StaffRoleViewSet(viewsets.ModelViewSet):
    queryset = StaffRole.objects.select_related('organization', 'user').all()
    serializer_class = StaffRoleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['organization', 'user']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_superadmin(user):
            return qs
        org_ids = organization_ids_for_user(user)
        if not org_ids:
            return qs.none()
        return qs.filter(organization_id__in=org_ids)

    def perform_create(self, serializer):
        organization = serializer.validated_data['organization']
        if not is_superadmin(self.request.user) and not has_organization_access(
            self.request.user, organization.id
        ):
            raise PermissionDenied(
                'You can only manage staff roles inside your own organization.'
            )
        serializer.save()

    def perform_update(self, serializer):
        organization = serializer.validated_data.get(
            'organization', serializer.instance.organization
        )
        if not is_superadmin(self.request.user) and not has_organization_access(
            self.request.user, organization.id
        ):
            raise PermissionDenied(
                'You can only manage staff roles inside your own organization.'
            )
        serializer.save()
