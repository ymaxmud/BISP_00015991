from django.conf import settings
from django.db import models


class Organization(models.Model):
    class OrgType(models.TextChoices):
        CLINIC = 'clinic', 'Clinic'
        HOSPITAL = 'hospital', 'Hospital'

    type = models.CharField(max_length=20, choices=OrgType.choices, default=OrgType.CLINIC)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    city = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    description = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    logo = models.ImageField(upload_to='organizations/logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Department(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name='departments'
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField()

    class Meta:
        unique_together = ['organization', 'slug']
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.organization.name})'


class Specialty(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True)
    symptom_keywords = models.JSONField(default=list, blank=True)

    class Meta:
        verbose_name_plural = 'specialties'
        ordering = ['name']

    def __str__(self):
        return self.name


class StaffRole(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name='staff_roles'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='staff_roles'
    )
    role_name = models.CharField(max_length=100)
    permissions = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = ['organization', 'user']

    def __str__(self):
        return f'{self.user} - {self.role_name} @ {self.organization}'
