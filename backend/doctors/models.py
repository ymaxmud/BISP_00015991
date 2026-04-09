from django.conf import settings
from django.db import models


class DoctorProfile(models.Model):
    class Gender(models.TextChoices):
        MALE = 'male', 'Male'
        FEMALE = 'female', 'Female'
        OTHER = 'other', 'Other'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_profile'
    )
    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='doctors'
    )

    # Identity
    full_name = models.CharField(max_length=255)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    position = models.CharField(max_length=255, blank=True, help_text='Title/role inside the clinic')
    avatar = models.ImageField(upload_to='doctors/avatars/', blank=True, null=True)

    # Professional
    years_experience = models.PositiveIntegerField(default=0)
    education = models.TextField(blank=True, help_text='Education history — free text or JSON')
    license_number = models.CharField(max_length=100, blank=True)
    license_document = models.FileField(upload_to='doctors/licenses/', blank=True, null=True)
    working_history = models.JSONField(default=list, blank=True, help_text='List of prior positions')

    # Public profile
    bio = models.TextField(blank=True)
    languages = models.JSONField(default=list, blank=True)
    services = models.JSONField(default=list, blank=True, help_text='Services offered — e.g. checkups, surgeries')

    # Workplace / booking
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    consultation_duration_minutes = models.PositiveIntegerField(default=30)
    working_hours = models.JSONField(default=dict, blank=True, help_text='{ "mon": ["09:00", "17:00"], ... }')
    accepts_new_patients = models.BooleanField(default=True)

    # Verification / trust
    id_document = models.FileField(upload_to='doctors/id_docs/', blank=True, null=True)
    agreed_to_terms = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    # AI assistant
    ai_enabled = models.BooleanField(default=True)
    ai_feature_flags = models.JSONField(
        default=dict, blank=True,
        help_text='Per-feature AI toggles: {"case_analysis": true, "report_analysis": true, ...}'
    )

    # Status
    public_slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True, help_text='Visible on the public doctors page')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.full_name


class DoctorSpecialty(models.Model):
    doctor_profile = models.ForeignKey(
        DoctorProfile, on_delete=models.CASCADE, related_name='specialties'
    )
    specialty = models.ForeignKey(
        'organizations.Specialty', on_delete=models.CASCADE, related_name='doctor_specialties'
    )

    class Meta:
        unique_together = ['doctor_profile', 'specialty']
        verbose_name_plural = 'doctor specialties'

    def __str__(self):
        return f'{self.doctor_profile.full_name} - {self.specialty.name}'
