from django.db import models


class Appointment(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', 'Scheduled'
        CHECKED_IN = 'checked_in', 'Checked In'
        IN_QUEUE = 'in_queue', 'In Queue'
        IN_CONSULTATION = 'in_consultation', 'In Consultation'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        NO_SHOW = 'no_show', 'No Show'

    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.CASCADE, related_name='appointments'
    )
    patient_profile = models.ForeignKey(
        'patients.PatientProfile', on_delete=models.CASCADE, related_name='appointments'
    )
    doctor_profile = models.ForeignKey(
        'doctors.DoctorProfile', on_delete=models.CASCADE, related_name='appointments'
    )
    department = models.ForeignKey(
        'organizations.Department', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='appointments'
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.SCHEDULED
    )
    appointment_type = models.CharField(max_length=50, blank=True)
    appointment_time = models.DateTimeField()
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-appointment_time']

    def __str__(self):
        return f'Appt #{self.pk} - {self.patient_profile} with {self.doctor_profile}'
