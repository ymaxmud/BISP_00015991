from django.conf import settings
from django.db import models


class UploadedReport(models.Model):
    class ValidationStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        VALID = 'valid', 'Valid'
        INVALID = 'invalid', 'Invalid'

    patient_profile = models.ForeignKey(
        'patients.PatientProfile', on_delete=models.CASCADE, related_name='uploaded_reports'
    )
    uploaded_by_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='uploaded_reports'
    )
    appointment = models.ForeignKey(
        'appointments.Appointment', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='uploaded_reports'
    )
    file = models.FileField(upload_to='reports/%Y/%m/')
    file_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100, blank=True)
    extracted_text = models.TextField(blank=True)
    validation_status = models.CharField(
        max_length=10, choices=ValidationStatus.choices, default=ValidationStatus.PENDING
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.file_name
