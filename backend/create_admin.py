"""
One-shot helper to create a superuser on first deploy.
Safe to run multiple times — it's a no-op if the user already exists.
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "avicenna.settings")
django.setup()

from accounts.models import User  # noqa: E402

EMAIL = os.getenv("ADMIN_EMAIL", "maxmudyusupov11@gmail.com")
PASSWORD = os.getenv("ADMIN_PASSWORD", "avicenna7517500")
USERNAME = os.getenv("ADMIN_USERNAME", EMAIL.split("@")[0])

user = User.objects.filter(email=EMAIL).first()
if user:
    user.set_password(PASSWORD)
    user.is_staff = True
    user.is_superuser = True
    user.is_active = True
    user.role = "superadmin"
    if not user.username:
        user.username = USERNAME
    user.save()
    print(f"Superuser {EMAIL} updated.")
else:
    User.objects.create_superuser(
        username=USERNAME,
        email=EMAIL,
        password=PASSWORD,
        role="superadmin",
    )
    print(f"Superuser {EMAIL} created.")
