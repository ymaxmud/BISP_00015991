from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    # API v1
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/accounts/', include('accounts.urls')),
    path('api/v1/organizations/', include('organizations.urls')),
    path('api/v1/doctors/', include('doctors.urls')),
    path('api/v1/patients/', include('patients.urls')),
    path('api/v1/appointments/', include('appointments.urls')),
    path('api/v1/queue/', include('queueing.urls')),
    path('api/v1/encounters/', include('encounters.urls')),
    path('api/v1/prescriptions/', include('prescriptions.urls')),
    path('api/v1/reminders/', include('reminders.urls')),
    path('api/v1/reviews/', include('reviews.urls')),
    path('api/v1/uploads/', include('uploads.urls')),
    path('api/v1/triage/', include('triage.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
