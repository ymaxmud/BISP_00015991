from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Review(models.Model):
    patient_profile = models.ForeignKey(
        'patients.PatientProfile', on_delete=models.CASCADE, related_name='reviews'
    )
    doctor_profile = models.ForeignKey(
        'doctors.DoctorProfile', on_delete=models.CASCADE, related_name='reviews'
    )
    appointment = models.ForeignKey(
        'appointments.Appointment', on_delete=models.CASCADE, related_name='reviews'
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Review by {self.patient_profile} for {self.doctor_profile} ({self.rating}/5)'
