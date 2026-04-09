"""
One-shot helper to create a superuser on first deploy.
Safe to run multiple times — it's a no-op if the user already exists.
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "avicenna.settings")
django.setup()

from accounts.models import User  # noqa: E402

EMAIL = os.getenv("ADMIN_EMAIL", "admin@avicenna.com")
PASSWORD = os.getenv("ADMIN_PASSWORD", "ChangeMe123!")

if User.objects.filter(email=EMAIL).exists():
    print(f"Superuser {EMAIL} already exists — skipping.")
else:
    User.objects.create_superuser(
        email=EMAIL,
        password=PASSWORD,
        role="superadmin",
    )
    print(f"Superuser {EMAIL} created.")
