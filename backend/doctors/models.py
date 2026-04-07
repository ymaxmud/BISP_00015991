from django.conf import settings
from django.db import models


class DoctorProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_profile'
    )
    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='doctors'
    )
    full_name = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    years_experience = models.PositiveIntegerField(default=0)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    public_slug = models.SlugField(unique=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    avatar = models.ImageField(upload_to='doctors/avatars/', blank=True, null=True)
    languages = models.JSONField(default=list, blank=True)
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
