"""Seed the three subscription plans the pricing page expects.

The frontend renders Free / Individual / Clinic side-by-side. Without
this seed the table can be empty (or only contain the legacy individual
plan), which makes the public pricing page look broken.

Re-running the migration is safe — get_or_create only creates rows that
do not already exist.
"""
from decimal import Decimal

from django.db import migrations


PLANS = [
    {
        "code": "free_doctor",
        "name": "Free doctor",
        "description": "For individual doctors who just want a public profile.",
        "price_monthly": Decimal("0.00"),
        "currency": "USD",
        "max_doctors": 1,
        "ai_enabled": False,
        "features": [
            "Public directory listing",
            "Patient intake forms",
            "Community support",
        ],
        "is_active": True,
    },
    {
        "code": "individual_doctor",
        "name": "Individual doctor",
        "description": "For solo practitioners who want the full AI assistant.",
        "price_monthly": Decimal("15.00"),
        "currency": "USD",
        "max_doctors": 1,
        "ai_enabled": True,
        "features": [
            "Public directory listing",
            "Patient intake forms",
            "AI clinical assistant",
            "Medication safety checks",
            "Lab report analysis",
        ],
        "is_active": True,
    },
    {
        "code": "clinic",
        "name": "Clinic",
        "description": "For growing clinics with multiple doctors.",
        "price_monthly": Decimal("99.00"),
        "currency": "USD",
        "max_doctors": 10,
        "ai_enabled": True,
        "features": [
            "Smart queue management",
            "AI clinical assistant for all doctors",
            "Analytics dashboard",
            "Admin tools & user management",
            "Priority support",
        ],
        "is_active": True,
    },
]


def seed(apps, schema_editor):
    SubscriptionPlan = apps.get_model("billing", "SubscriptionPlan")
    for cfg in PLANS:
        SubscriptionPlan.objects.update_or_create(
            code=cfg["code"],
            defaults={
                "name": cfg["name"],
                "description": cfg["description"],
                "price_monthly": cfg["price_monthly"],
                "currency": cfg["currency"],
                "max_doctors": cfg["max_doctors"],
                "ai_enabled": cfg["ai_enabled"],
                "features": cfg["features"],
                "is_active": cfg["is_active"],
            },
        )


def unseed(apps, schema_editor):
    SubscriptionPlan = apps.get_model("billing", "SubscriptionPlan")
    SubscriptionPlan.objects.filter(
        code__in=[p["code"] for p in PLANS]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0001_initial"),
    ]
    operations = [
        migrations.RunPython(seed, unseed),
    ]
