from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'profiles', views.PatientProfileViewSet, basename='patient-profile')
router.register(r'medical-history', views.MedicalHistoryViewSet, basename='medical-history')
router.register(r'family-members', views.FamilyMemberViewSet, basename='family-member')

urlpatterns = [
    path('', include(router.urls)),
]
