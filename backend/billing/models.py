"""
Subscription / billing models.

We model three kinds of plans:
 - `free_doctor`       — free tier for individual doctors (profile visible but no AI)
 - `individual_doctor` — $15/month for one doctor with AI access
 - `clinic`            — $99/month for a clinic with up to N doctors

One small but important detail: ownership works in two different ways.
- an individual doctor subscription belongs to a user
- a clinic subscription belongs to an organization

That is why the models below support both user-linked and organization-linked
subscriptions.
"""
from decimal import Decimal

from django.conf import settings
from django.db import models


class SubscriptionPlan(models.Model):
    class Code(models.TextChoices):
        FREE_DOCTOR = 'free_doctor', 'Free doctor'
        INDIVIDUAL_DOCTOR = 'individual_doctor', 'Individual doctor'
        CLINIC = 'clinic', 'Clinic'

    code = models.CharField(max_length=32, unique=True, choices=Code.choices)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price_monthly = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0'))
    currency = models.CharField(max_length=3, default='USD')
    max_doctors = models.PositiveIntegerField(default=1)
    ai_enabled = models.BooleanField(default=True)
    features = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['price_monthly']

    def __str__(self):
        return f'{self.name} (${self.price_monthly}/mo)'


class Subscription(models.Model):
    """
    A subscription always belongs to exactly one owner:
    either an organization or a user, never both at the same time.
    """

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        PAST_DUE = 'past_due', 'Past due'
        CANCELED = 'canceled', 'Canceled'

    plan = models.ForeignKey(
        SubscriptionPlan, on_delete=models.PROTECT, related_name='subscriptions'
    )
    organization = models.OneToOneField(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='subscription',
        null=True,
        blank=True,
    )
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='individual_subscription',
        null=True,
        blank=True,
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    started_at = models.DateTimeField(auto_now_add=True)
    current_period_end = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                name='billing_subscription_owner_xor',
                check=(
                    models.Q(organization__isnull=False, user__isnull=True)
                    | models.Q(organization__isnull=True, user__isnull=False)
                ),
            )
        ]

    def __str__(self):
        owner = self.organization or self.user
        return f'{owner} → {self.plan.code}'

    @property
    def max_doctors(self) -> int:
        return self.plan.max_doctors

    @property
    def ai_enabled(self) -> bool:
        return self.plan.ai_enabled

    def current_doctor_count(self) -> int:
        """
        Figure out how many active doctor seats this subscription is currently using.

        For clinics we count active doctors inside the organization.
        For an individual doctor plan, the answer is basically 0 or 1 depending
        on whether that user has a doctor profile.
        """
        if self.organization_id:
            return self.organization.doctors.filter(is_active=True).count()
        if self.user_id:
            return int(hasattr(self.user, 'doctor_profile'))
        return 0

    def can_add_doctor(self) -> bool:
        return self.current_doctor_count() < self.max_doctors


class Payment(models.Model):
    """
    Stores a payment record.

    This is intentionally simple for now. We are not doing a full payment
    gateway integration here yet, so these rows act more like billing history
    than a full financial ledger.
    """

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SUCCEEDED = 'succeeded', 'Succeeded'
        FAILED = 'failed', 'Failed'

    subscription = models.ForeignKey(
        Subscription, on_delete=models.CASCADE, related_name='payments'
    )
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.SUCCEEDED)
    method = models.CharField(max_length=32, default='mock_card')
    card_last4 = models.CharField(max_length=4, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.amount} {self.currency} — {self.status}'
