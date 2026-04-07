from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        PATIENT = 'patient', 'Patient'
        DOCTOR = 'doctor', 'Doctor'
        ADMIN = 'admin', 'Admin'
        SUPERADMIN = 'superadmin', 'Super Admin'

    class Language(models.TextChoices):
        UZ = 'uz', 'Uzbek'
        RU = 'ru', 'Russian'
        EN = 'en', 'English'

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PATIENT)
    phone = models.CharField(max_length=20, blank=True)
    preferred_language = models.CharField(
        max_length=2,
        choices=Language.choices,
        default=Language.UZ,
    )
    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return self.email
