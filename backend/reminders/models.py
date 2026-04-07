from django.db import models


class Reminder(models.Model):
    class ReminderType(models.TextChoices):
        MEDICATION = 'medication', 'Medication'
        FOLLOW_UP = 'follow_up', 'Follow Up'
        APPOINTMENT = 'appointment', 'Appointment'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SENT = 'sent', 'Sent'
        COMPLETED = 'completed', 'Completed'

    patient_profile = models.ForeignKey(
        'patients.PatientProfile', on_delete=models.CASCADE, related_name='reminders'
    )
    prescription = models.ForeignKey(
        'prescriptions.Prescription', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reminders'
    )
    title = models.CharField(max_length=255)
    reminder_type = models.CharField(
        max_length=15, choices=ReminderType.choices, default=ReminderType.MEDICATION
    )
    scheduled_time = models.DateTimeField()
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['scheduled_time']

    def __str__(self):
        return f'{self.title} ({self.get_reminder_type_display()})'
