from django.db import models


class Prescription(models.Model):
    class Source(models.TextChoices):
        DOCTOR = 'doctor', 'Doctor'
        AI_DRAFT = 'ai_draft', 'AI Draft'

    encounter = models.ForeignKey(
        'encounters.Encounter', on_delete=models.CASCADE, related_name='prescriptions'
    )
    medication_name = models.CharField(max_length=255)
    dosage = models.CharField(max_length=100)
    schedule = models.CharField(max_length=255)
    duration_days = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    source = models.CharField(max_length=10, choices=Source.choices, default=Source.DOCTOR)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.medication_name} ({self.dosage})'
