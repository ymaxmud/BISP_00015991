from django.urls import include, path
from rest_framework.routers import SimpleRouter

from . import views

# Use SimpleRouter (no auto api-root) to avoid shadowing the org list
router = SimpleRouter()
router.register(r'specialties', views.SpecialtyViewSet, basename='specialty')
router.register(r'departments', views.DepartmentViewSet, basename='department')
router.register(r'staff-roles', views.StaffRoleViewSet, basename='staffrole')

# Combine: router URLs first (specialties/, departments/, etc.)
# then manual org patterns so <slug>/ doesn't shadow them
urlpatterns = router.urls + [
    path(
        '',
        views.OrganizationViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='organization-list',
    ),
    path(
        '<slug:slug>/',
        views.OrganizationViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy',
        }),
        name='organization-detail',
    ),
]
