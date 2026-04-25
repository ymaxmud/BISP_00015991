from __future__ import annotations

from accounts.models import User


def is_superadmin(user) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (user.is_superuser or user.role == User.Role.SUPERADMIN)
    )


def is_org_admin(user) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (user.is_staff or user.role in (User.Role.ADMIN, User.Role.SUPERADMIN))
    )


def patient_profile_id(user) -> int | None:
    profile = getattr(user, 'patient_profile', None)
    return getattr(profile, 'id', None)


def doctor_profile_id(user) -> int | None:
    profile = getattr(user, 'doctor_profile', None)
    return getattr(profile, 'id', None)


def organization_ids_for_user(user) -> list[int]:
    """
    Keep org lookup in one place so every viewset uses the same tenant rules.

    Admins come through staff roles, while doctors may only have their linked
    doctor profile organization.
    """

    if not user or not user.is_authenticated:
        return []

    org_ids = set(user.staff_roles.values_list('organization_id', flat=True))
    doctor_profile = getattr(user, 'doctor_profile', None)
    doctor_org_id = getattr(doctor_profile, 'organization_id', None)
    if doctor_org_id:
        org_ids.add(doctor_org_id)
    return sorted(org_ids)


def has_organization_access(user, organization_id: int | None) -> bool:
    if organization_id is None:
        return False
    if is_superadmin(user):
        return True
    return organization_id in organization_ids_for_user(user)
