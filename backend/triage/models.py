from django.db import models


class TriageDecision(models.Model):
    class UrgencyLevel(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        CRITICAL = 'critical', 'Critical'

    intake_form = models.ForeignKey(
        'queueing.IntakeForm', on_delete=models.CASCADE, related_name='triage_decisions'
    )
    specialty = models.ForeignKey(
        'organizations.Specialty', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='triage_decisions'
    )
    urgency_level = models.CharField(
        max_length=10, choices=UrgencyLevel.choices, default=UrgencyLevel.LOW
    )
    rationale = models.TextField(blank=True)
    suggested_doctors = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Triage for IntakeForm #{self.intake_form_id} - {self.urgency_level}'


class AIRun(models.Model):
    class RunType(models.TextChoices):
        CASE_ANALYSIS = 'case_analysis', 'Case Analysis'
        REPORT_ANALYSIS = 'report_analysis', 'Report Analysis'
        TRIAGE = 'triage', 'Triage'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        RUNNING = 'running', 'Running'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    appointment = models.ForeignKey(
        'appointments.Appointment', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='ai_runs'
    )
    patient_profile = models.ForeignKey(
        'patients.PatientProfile', on_delete=models.CASCADE, related_name='ai_runs'
    )
    doctor_profile = models.ForeignKey(
        'doctors.DoctorProfile', on_delete=models.CASCADE, related_name='ai_runs'
    )
    run_type = models.CharField(max_length=20, choices=RunType.choices)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'AIRun #{self.pk} ({self.run_type}) - {self.status}'


class AIOutput(models.Model):
    class RiskLevel(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        CRITICAL = 'critical', 'Critical'

    ai_run = models.OneToOneField(
        AIRun, on_delete=models.CASCADE, related_name='output'
    )
    summary_text = models.TextField(blank=True)
    extracted_facts = models.JSONField(default=list, blank=True)
    risk_level = models.CharField(
        max_length=10, choices=RiskLevel.choices, default=RiskLevel.LOW
    )
    safety_alerts = models.JSONField(default=list, blank=True)
    suggestions = models.JSONField(default=list, blank=True)
    draft_text = models.TextField(blank=True)
    raw_trace = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f'Output for AIRun #{self.ai_run_id}'


class ReportChatSession(models.Model):
    uploaded_report = models.ForeignKey(
        'uploads.UploadedReport', on_delete=models.CASCADE, related_name='chat_sessions'
    )
    doctor_profile = models.ForeignKey(
        'doctors.DoctorProfile', on_delete=models.CASCADE, related_name='report_chat_sessions'
    )
    title = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title or f'Chat session #{self.pk}'


class ReportChatMessage(models.Model):
    class SenderType(models.TextChoices):
        DOCTOR = 'doctor', 'Doctor'
        ASSISTANT = 'assistant', 'Assistant'

    session = models.ForeignKey(
        ReportChatSession, on_delete=models.CASCADE, related_name='messages'
    )
    sender_type = models.CharField(max_length=10, choices=SenderType.choices)
    message_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender_type}: {self.message_text[:50]}'
