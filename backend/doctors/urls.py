from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'', views.DoctorProfileViewSet, basename='doctor')

urlpatterns = [
    # Admin-facing endpoint must come before the router include so the router
    # doesn't interpret "admin" as a doctor public_slug.
    path('admin/add/', views.AdminAddDoctorView.as_view(), name='admin-add-doctor'),
    path('', include(router.urls)),
]
