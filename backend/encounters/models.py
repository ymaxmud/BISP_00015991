from django.db import models


class Encounter(models.Model):
    appointment = models.OneToOneField(
        'appointments.Appointment', on_delete=models.CASCADE, related_name='encounter'
    )
    doctor_profile = models.ForeignKey(
        'doctors.DoctorProfile', on_delete=models.CASCADE, related_name='encounters'
    )
    summary_notes = models.TextField(blank=True)
    assessment_notes = models.TextField(blank=True)
    plan_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Encounter for Appt #{self.appointment_id}'
