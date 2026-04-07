from django.db import models


class IntakeForm(models.Model):
    class Severity(models.TextChoices):
        MILD = 'mild', 'Mild'
        MODERATE = 'moderate', 'Moderate'
        SEVERE = 'severe', 'Severe'
        CRITICAL = 'critical', 'Critical'

    appointment = models.OneToOneField(
        'appointments.Appointment', on_delete=models.CASCADE, related_name='intake_form'
    )
    symptoms = models.TextField()
    duration = models.CharField(max_length=100, blank=True)
    severity = models.CharField(
        max_length=10, choices=Severity.choices, default=Severity.MILD
    )
    history_text = models.TextField(blank=True)
    allergies_text = models.TextField(blank=True)
    medications_text = models.TextField(blank=True)
    urgency_inputs = models.JSONField(default=dict, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Intake for Appt #{self.appointment_id}'


class QueueTicket(models.Model):
    class TriageLevel(models.TextChoices):
        NORMAL = 'normal', 'Normal'
        PRIORITY = 'priority', 'Priority'
        URGENT = 'urgent', 'Urgent'

    class QueueStatus(models.TextChoices):
        WAITING = 'waiting', 'Waiting'
        CALLED = 'called', 'Called'
        IN_PROGRESS = 'in_progress', 'In Progress'
        DONE = 'done', 'Done'

    appointment = models.OneToOneField(
        'appointments.Appointment', on_delete=models.CASCADE, related_name='queue_ticket'
    )
    queue_number = models.PositiveIntegerField()
    triage_level = models.CharField(
        max_length=10, choices=TriageLevel.choices, default=TriageLevel.NORMAL
    )
    queue_status = models.CharField(
        max_length=15, choices=QueueStatus.choices, default=QueueStatus.WAITING
    )
    estimated_wait_minutes = models.PositiveIntegerField(default=0)
    assigned_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['triage_level', 'queue_number']

    def __str__(self):
        return f'Ticket #{self.queue_number} (Appt #{self.appointment_id})'
