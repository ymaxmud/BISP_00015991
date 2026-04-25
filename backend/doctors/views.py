from __future__ import annotations

import secrets

from django.db import transaction
from django.db.models import Q
from django.utils.text import slugify
from rest_framework import generics, permissions, serializers, status, viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from avicenna.access import (
    doctor_profile_id,
    has_organization_access,
    is_org_admin,
    is_superadmin,
    organization_ids_for_user,
)

class OptionalJWTAuthentication(JWTAuthentication):
    """
    This works like normal JWT auth, but it is more forgiving.

    The public doctors pages should still load even if the browser happens to
    send an expired token from an old session. Instead of hard-failing with
    401, we ignore the bad token and continue as a public request.
    """

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except (InvalidToken, TokenError):
            return None

from accounts.models import User
from organizations.models import Organization, Specialty, StaffRole

from .models import DoctorProfile, DoctorSpecialty
from .serializers import DoctorProfileSerializer


class DoctorProfileViewSet(viewsets.ModelViewSet):
    queryset = DoctorProfile.objects.select_related(
        'user', 'organization'
    ).prefetch_related('specialties__specialty').all()
    serializer_class = DoctorProfileSerializer
    authentication_classes = [OptionalJWTAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    http_method_names = ['get', 'head', 'options', 'patch', 'put']
    lookup_field = 'public_slug'
    filterset_fields = ['organization', 'is_verified', 'is_active', 'is_public']
    search_fields = ['full_name', 'bio']
    ordering_fields = ['full_name', 'years_experience', 'consultation_fee', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            qs = qs.filter(is_public=True, is_active=True)
        elif is_superadmin(user):
            pass
        elif is_org_admin(user):
            qs = qs.filter(organization_id__in=organization_ids_for_user(user))
        else:
            own_doctor_id = doctor_profile_id(user)
            qs = qs.filter(
                Q(is_public=True, is_active=True) | Q(id=own_doctor_id)
            )
        specialty = self.request.query_params.get('specialty')
        if specialty:
            qs = qs.filter(specialties__specialty__slug=specialty)
        city = self.request.query_params.get('city')
        if city:
            qs = qs.filter(organization__city__icontains=city)
        return qs.distinct()

    def update(self, request, *args, **kwargs):
        obj = self.get_object()
        user = request.user
        if is_superadmin(user):
            return super().update(request, *args, **kwargs)
        if is_org_admin(user) and has_organization_access(user, obj.organization_id):
            return super().update(request, *args, **kwargs)
        if doctor_profile_id(user) == obj.id:
            return super().update(request, *args, **kwargs)
        raise PermissionDenied('You can only edit your own doctor profile.')

    @action(
        detail=False,
        methods=['get', 'patch', 'put'],
        url_path='me',
        permission_classes=[permissions.IsAuthenticated],
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def me(self, request):
        """Return or update the doctor profile that belongs to the current user."""
        user = request.user
        own_id = doctor_profile_id(user)
        if not own_id:
            return Response(
                {'detail': 'No doctor profile is linked to this account.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        profile = DoctorProfile.objects.select_related(
            'user', 'organization'
        ).prefetch_related('specialties__specialty').get(id=own_id)
        if request.method == 'GET':
            return Response(self.get_serializer(profile).data)
        # PATCH / PUT
        partial = request.method == 'PATCH'
        serializer = self.get_serializer(profile, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# Everything below is for the clinic-admin flow where an organization creates
# a doctor account on behalf of a doctor.
def _clinic_admin_org(user) -> Organization | None:
    """Find the organization this admin belongs to, if there is one."""
    if not user.is_authenticated:
        return None
    staff = user.staff_roles.select_related('organization').first()
    return staff.organization if staff else None


def _unique_slug(base: str) -> str:
    base = slugify(base) or 'doctor'
    candidate = base
    n = 1
    while DoctorProfile.objects.filter(public_slug=candidate).exists():
        n += 1
        candidate = f'{base}-{n}'
    return candidate


class AdminAddDoctorSerializer(serializers.Serializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField(required=False, allow_blank=True)

    avatar = serializers.ImageField(required=False, allow_null=True)
    gender = serializers.CharField(required=False, allow_blank=True)
    position = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    years_experience = serializers.IntegerField(required=False, default=0)
    education = serializers.CharField(required=False, allow_blank=True)
    license_number = serializers.CharField(required=False, allow_blank=True)
    specialty_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )
    languages = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    services = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    working_history = serializers.JSONField(required=False, default=list)
    working_hours = serializers.JSONField(required=False, default=dict)
    consultation_fee = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, default=0
    )
    consultation_duration_minutes = serializers.IntegerField(required=False, default=30)
    is_public = serializers.BooleanField(required=False, default=True)


class AdminAddDoctorView(generics.CreateAPIView):
    """
    This endpoint lets a clinic admin create a doctor inside their own
    organization.

    The important extra rule here is the seat limit check. If the clinic's
    subscription does not allow another doctor, we stop the flow early.
    """

    serializer_class = AdminAddDoctorSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role not in (User.Role.ADMIN, User.Role.SUPERADMIN):
            return Response({'detail': 'Only clinic admins can add doctors.'}, status=403)
        organization = _clinic_admin_org(user)
        if organization is None:
            return Response({'detail': 'No organization linked to this admin.'}, status=400)

        # Before we create anything, make sure the clinic is actually allowed
        # to add one more doctor on its current plan.
        subscription = getattr(organization, 'subscription', None)
        if subscription and not subscription.can_add_doctor():
            return Response(
                {
                    'detail': (
                        f'Your current plan supports at most {subscription.max_doctors} '
                        f'doctors. Upgrade your subscription to add more.'
                    )
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            # We create both the auth user and the doctor profile in one
            # transaction so we do not end up with half-finished accounts.
            email = data['email']
            if User.objects.filter(email__iexact=email).exists():
                return Response({'email': ['A user with this email already exists.']}, status=400)

            temp_password = secrets.token_urlsafe(12)
            doctor_user = User.objects.create(
                email=email,
                username=email.split('@')[0],
                first_name=data['first_name'],
                last_name=data['last_name'],
                phone=data.get('phone', ''),
                role=User.Role.DOCTOR,
            )
            doctor_user.set_password(temp_password)
            doctor_user.save()

            full_name = f'{data["first_name"]} {data["last_name"]}'.strip()
            profile = DoctorProfile.objects.create(
                user=doctor_user,
                organization=organization,
                full_name=full_name,
                gender=data.get('gender', ''),
                position=data.get('position', ''),
                avatar=data.get('avatar'),
                bio=data.get('bio', ''),
                years_experience=data.get('years_experience', 0),
                education=data.get('education', ''),
                license_number=data.get('license_number', ''),
                languages=data.get('languages', []),
                services=data.get('services', []),
                working_history=data.get('working_history', []),
                working_hours=data.get('working_hours', {}),
                consultation_fee=data.get('consultation_fee', 0),
                consultation_duration_minutes=data.get('consultation_duration_minutes', 30),
                public_slug=_unique_slug(full_name),
                is_public=data.get('is_public', True),
                is_active=True,
                ai_enabled=bool(subscription and subscription.ai_enabled),
            )

            for spec_id in data.get('specialty_ids', []):
                spec = Specialty.objects.filter(id=spec_id).first()
                if spec:
                    DoctorSpecialty.objects.get_or_create(
                        doctor_profile=profile, specialty=spec
                    )

            # This staff-role row is what actually ties the doctor to the
            # clinic for permission checks elsewhere in the app.
            StaffRole.objects.get_or_create(
                organization=organization,
                user=doctor_user,
                defaults={'role_name': 'Doctor'},
            )

        return Response(
            {
                'doctor': DoctorProfileSerializer(profile).data,
                'temporary_password': temp_password,
            },
            status=status.HTTP_201_CREATED,
        )
