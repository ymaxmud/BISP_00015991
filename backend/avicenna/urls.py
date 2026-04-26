"""
Project-wide URL routing.

The whole API lives under /api/v1/. Each Django app owns its own
sub-router and is mounted here. The frontend hits these via the
Next.js proxy at /api/v1/* (see frontend/src/app/api/v1/[...path]).

If you add a new app, register it here AND make sure its `urls.py`
exists, otherwise Django will fail to start.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Django admin (separate from the API — staff-only)
    path('admin/', admin.site.urls),

    # API v1 — accounts is mounted at two paths because some endpoints
    # are auth-flow ("auth/login") and others are user management
    # ("accounts/users"); they happen to live in the same app.
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/accounts/', include('accounts.urls')),

    # Core domain: clinics, the people in them, what they do.
    path('api/v1/organizations/', include('organizations.urls')),
    path('api/v1/doctors/', include('doctors.urls')),
    path('api/v1/patients/', include('patients.urls')),

    # Clinical workflow.
    path('api/v1/appointments/', include('appointments.urls')),
    path('api/v1/queue/', include('queueing.urls')),
    path('api/v1/encounters/', include('encounters.urls')),
    path('api/v1/prescriptions/', include('prescriptions.urls')),
    path('api/v1/reminders/', include('reminders.urls')),
    path('api/v1/reviews/', include('reviews.urls')),
    path('api/v1/uploads/', include('uploads.urls')),

    # Triage / analytics / billing.
    path('api/v1/triage/', include('triage.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
    path('api/v1/billing/', include('billing.urls')),
]

# In dev we serve uploaded media (avatars, lab reports) directly through
# Django's static handler. In production this should be fronted by a CDN
# or object store, not Django.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
