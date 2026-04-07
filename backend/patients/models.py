from django.conf import settings
from django.db import models


class PatientProfile(models.Model):
    class Gender(models.TextChoices):
        MALE = 'male', 'Male'
        FEMALE = 'female', 'Female'
        OTHER = 'other', 'Other'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_profile'
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    national_id = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.first_name} {self.last_name}'


class MedicalHistory(models.Model):
    patient_profile = models.OneToOneField(
        PatientProfile, on_delete=models.CASCADE, related_name='medical_history'
    )
    chronic_conditions = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    current_medications = models.TextField(blank=True)
    previous_conditions = models.TextField(blank=True)
    last_updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'medical histories'

    def __str__(self):
        return f'Medical history for {self.patient_profile}'


class FamilyMember(models.Model):
    class Gender(models.TextChoices):
        MALE = 'male', 'Male'
        FEMALE = 'female', 'Female'
        OTHER = 'other', 'Other'

    patient_profile = models.ForeignKey(
        PatientProfile, on_delete=models.CASCADE, related_name='family_members'
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    relationship = models.CharField(max_length=50)

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.relationship})'
