from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.DashboardStatsView.as_view(), name='analytics-dashboard'),
    path('trends/', views.AppointmentTrendsView.as_view(), name='analytics-trends'),
    path('workload/', views.DoctorWorkloadView.as_view(), name='analytics-workload'),
    path('queue/', views.QueueAnalyticsView.as_view(), name='analytics-queue'),
]
