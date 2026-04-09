from django.conf import settings
from django.db import models


class LifestyleLevel(models.TextChoices):
    NEVER = 'never', 'Never'
    OCCASIONALLY = 'occasionally', 'Occasionally'
    REGULARLY = 'regularly', 'Regularly'


class ActivityLevel(models.TextChoices):
    LOW = 'low', 'Low'
    MODERATE = 'moderate', 'Moderate'
    HIGH = 'high', 'High'


class PatientProfile(models.Model):
    class Gender(models.TextChoices):
        MALE = 'male', 'Male'
        FEMALE = 'female', 'Female'
        OTHER = 'other', 'Other'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_profile'
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    national_id = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=255, blank=True)

    # Vitals / body
    height_cm = models.PositiveIntegerField(null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Lifestyle
    smoking = models.CharField(
        max_length=16, choices=LifestyleLevel.choices, blank=True
    )
    alcohol = models.CharField(
        max_length=16, choices=LifestyleLevel.choices, blank=True
    )
    physical_activity = models.CharField(
        max_length=16, choices=ActivityLevel.choices, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.first_name} {self.last_name}'.strip()


class ChronicCondition(models.Model):
    """
    Structured chronic conditions pulled from the patient intake form.
    Using a list of text codes lets the AI service match keywords reliably.
    """

    class Code(models.TextChoices):
        DIABETES = 'diabetes', 'Diabetes'
        HYPERTENSION = 'hypertension', 'Hypertension'
        HEART_DISEASE = 'heart_disease', 'Heart disease'
        ASTHMA = 'asthma', 'Asthma'
        OTHER = 'other', 'Other'

    patient_profile = models.ForeignKey(
        'PatientProfile', on_delete=models.CASCADE, related_name='chronic_conditions'
    )
    code = models.CharField(max_length=32, choices=Code.choices)
    label = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['patient_profile', 'code', 'label']

    def __str__(self):
        return self.label or self.get_code_display()


class Medication(models.Model):
    patient_profile = models.ForeignKey(
        'PatientProfile', on_delete=models.CASCADE, related_name='medications'
    )
    name = models.CharField(max_length=255)
    dosage = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f'{self.name} ({self.dosage})' if self.dosage else self.name


class IntakeSymptom(models.Model):
    """
    Symptoms from the new-patient pre-triage step of registration.
    These are passed to the AI service for the initial risk score.
    """

    class Severity(models.TextChoices):
        MILD = 'mild', 'Mild'
        MODERATE = 'moderate', 'Moderate'
        SEVERE = 'severe', 'Severe'

    patient_profile = models.ForeignKey(
        'PatientProfile', on_delete=models.CASCADE, related_name='intake_symptoms'
    )
    description = models.TextField()
    duration = models.CharField(max_length=100, blank=True)
    severity = models.CharField(max_length=16, choices=Severity.choices, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class MedicalHistory(models.Model):
    """
    Free-form medical history. Kept for backwards compatibility — structured
    data lives on ChronicCondition / Medication / IntakeSymptom now.
    """

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
    last_name = models.CharField(max_length=100, blank=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    relationship = models.CharField(max_length=50)

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.relationship})'
