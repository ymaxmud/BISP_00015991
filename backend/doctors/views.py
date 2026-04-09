from __future__ import annotations

import secrets

from django.db import transaction
from django.utils.text import slugify
from rest_framework import generics, permissions, serializers, status, viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class OptionalJWTAuthentication(JWTAuthentication):
    """
    Like JWTAuthentication but silently ignores invalid / expired tokens
    instead of raising 401. This lets public endpoints work even when the
    browser sends a stale token from a previous session.
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
    lookup_field = 'public_slug'
    filterset_fields = ['organization', 'is_verified', 'is_active', 'is_public']
    search_fields = ['full_name', 'bio']
    ordering_fields = ['full_name', 'years_experience', 'consultation_fee', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        # Public/unauth requests only see published, active doctors
        if not self.request.user.is_authenticated:
            qs = qs.filter(is_public=True, is_active=True)
        specialty = self.request.query_params.get('specialty')
        if specialty:
            qs = qs.filter(specialties__specialty__slug=specialty)
        city = self.request.query_params.get('city')
        if city:
            qs = qs.filter(organization__city__icontains=city)
        return qs.distinct()


# ---------------------------------------------------------------------------
# Admin-managed doctor creation
# ---------------------------------------------------------------------------
def _clinic_admin_org(user) -> Organization | None:
    """Returns the organization this user admins, if any."""
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
    Lets a clinic admin add a doctor to their organization. Enforces the
    org's subscription seat limit.
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

        # Enforce seat limit
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
            # Create a user account for the new doctor with a temporary password
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

            # Staff role links the doctor to the clinic org for permissions
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
