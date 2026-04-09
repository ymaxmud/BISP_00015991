from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views
from .registration import (
    ClinicAdminRegistrationView,
    DoctorRegistrationView,
    PatientRegistrationView,
)

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('register/patient/', PatientRegistrationView.as_view(), name='register-patient'),
    path('register/doctor/', DoctorRegistrationView.as_view(), name='register-doctor'),
    path('register/clinic/', ClinicAdminRegistrationView.as_view(), name='register-clinic'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('me/', views.MeView.as_view(), name='me'),
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
