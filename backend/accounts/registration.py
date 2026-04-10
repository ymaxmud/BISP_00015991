"""
Multi-step registration endpoints for patient, doctor, and clinic-admin roles.

Each endpoint:
 1. validates the payload with a nested serializer,
 2. creates the user + profile + related records inside a single transaction,
 3. returns JWT tokens so the frontend can log the user in immediately.

These endpoints live in the accounts app because registration touches a lot of
different models at once. Keeping that logic in one place makes the workflow
easier to follow and helps us avoid half-created accounts.
"""
from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from django.utils.text import slugify
from rest_framework import permissions, serializers, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from billing.models import Payment, Subscription, SubscriptionPlan
from doctors.models import DoctorProfile, DoctorSpecialty
from organizations.models import Organization, Specialty, StaffRole
from patients.models import (
    ChronicCondition,
    FamilyMember,
    IntakeSymptom,
    Medication,
    MedicalHistory,
    PatientProfile,
)

from .models import User
from .serializers import UserSerializer


def _tokens_for(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        'user': UserSerializer(user).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


def _unique_username(base: str) -> str:
    base = slugify(base) or 'user'
    candidate = base
    n = 1
    while User.objects.filter(username=candidate).exists():
        n += 1
        candidate = f'{base}{n}'
    return candidate


def _unique_slug(base: str, model, field: str = 'public_slug') -> str:
    base = slugify(base) or 'item'
    candidate = base
    n = 1
    while model.objects.filter(**{field: candidate}).exists():
        n += 1
        candidate = f'{base}-{n}'
    return candidate


# Patient registration is split into nested serializer pieces so each step of
# the frontend wizard maps cleanly to one part of the backend payload.
class _FamilyMemberInput(serializers.Serializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField(required=False, allow_blank=True)
    relationship = serializers.CharField()
    dob = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(required=False, allow_blank=True)


class _ChronicConditionInput(serializers.Serializer):
    code = serializers.ChoiceField(choices=ChronicCondition.Code.choices)
    label = serializers.CharField(required=False, allow_blank=True)


class _MedicationInput(serializers.Serializer):
    name = serializers.CharField()
    dosage = serializers.CharField(required=False, allow_blank=True)


class _SymptomInput(serializers.Serializer):
    description = serializers.CharField()
    duration = serializers.CharField(required=False, allow_blank=True)
    severity = serializers.ChoiceField(
        choices=IntakeSymptom.Severity.choices, required=False, allow_blank=True
    )


class PatientRegistrationSerializer(serializers.Serializer):
    # Step 1: basic account data the person types first.
    first_name = serializers.CharField()
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    dob = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(
        choices=PatientProfile.Gender.choices, required=False, allow_blank=True
    )

    # Step 2: household / family details.
    family_members = _FamilyMemberInput(many=True, required=False)

    # Step 3: body measurements.
    height_cm = serializers.IntegerField(required=False, allow_null=True, min_value=30, max_value=300)
    weight_kg = serializers.DecimalField(
        required=False, allow_null=True, max_digits=5, decimal_places=2, min_value=Decimal('1')
    )

    # Step 4: day-to-day lifestyle answers.
    smoking = serializers.CharField(required=False, allow_blank=True)
    alcohol = serializers.CharField(required=False, allow_blank=True)
    physical_activity = serializers.CharField(required=False, allow_blank=True)

    # Step 5: existing conditions, allergies, and medication list.
    chronic_conditions = _ChronicConditionInput(many=True, required=False)
    allergies = serializers.CharField(required=False, allow_blank=True)
    medications = _MedicationInput(many=True, required=False)

    # Step 6: symptoms we can use later for intake / triage features.
    symptoms = _SymptomInput(many=True, required=False)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        family = validated_data.pop('family_members', [])
        conditions = validated_data.pop('chronic_conditions', [])
        medications = validated_data.pop('medications', [])
        symptoms = validated_data.pop('symptoms', [])
        allergies = validated_data.pop('allergies', '')

        user = User.objects.create(
            email=validated_data['email'],
            username=_unique_username(validated_data['email'].split('@')[0]),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            role=User.Role.PATIENT,
        )
        user.set_password(validated_data['password'])
        user.save()

        profile = PatientProfile.objects.create(
            user=user,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            dob=validated_data.get('dob'),
            gender=validated_data.get('gender') or '',
            height_cm=validated_data.get('height_cm'),
            weight_kg=validated_data.get('weight_kg'),
            smoking=validated_data.get('smoking') or '',
            alcohol=validated_data.get('alcohol') or '',
            physical_activity=validated_data.get('physical_activity') or '',
        )

        for fm in family:
            FamilyMember.objects.create(patient_profile=profile, **fm)

        for cond in conditions:
            ChronicCondition.objects.create(patient_profile=profile, **cond)

        for med in medications:
            Medication.objects.create(patient_profile=profile, **med)

        for sym in symptoms:
            IntakeSymptom.objects.create(patient_profile=profile, **sym)

        # Some older parts of the product still expect one flat
        # `MedicalHistory` row, so we keep creating it even though the newer
        # structured models are the real source of truth now.
        MedicalHistory.objects.create(
            patient_profile=profile,
            chronic_conditions=', '.join(
                (c.get('label') or dict(ChronicCondition.Code.choices).get(c['code'], c['code']))
                for c in conditions
            ),
            allergies=allergies,
            current_medications=', '.join(
                f"{m['name']} {m.get('dosage', '')}".strip() for m in medications
            ),
        )

        return user


class PatientRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        serializer = PatientRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(_tokens_for(user), status=status.HTTP_201_CREATED)


# This doctor flow is for a doctor registering themselves directly.
# The separate admin-add-doctor flow is for clinics creating doctor accounts.
class DoctorRegistrationSerializer(serializers.Serializer):
    # Step 1 — Account
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True)

    # Step 2 — Professional identity
    full_name = serializers.CharField(required=False, allow_blank=True)
    specialty_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )
    years_experience = serializers.IntegerField(required=False, default=0)
    education = serializers.CharField(required=False, allow_blank=True)
    license_number = serializers.CharField(required=False, allow_blank=True)
    position = serializers.CharField(required=False, allow_blank=True)

    # Step 3 — Workplace (may link to existing clinic or independent)
    organization_id = serializers.IntegerField(required=False, allow_null=True)
    workplace_name = serializers.CharField(required=False, allow_blank=True)
    workplace_city = serializers.CharField(required=False, allow_blank=True)
    workplace_address = serializers.CharField(required=False, allow_blank=True)

    # Step 4 — Availability
    consultation_duration_minutes = serializers.IntegerField(required=False, default=30)
    working_hours = serializers.JSONField(required=False, default=dict)
    consultation_fee = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, default=0
    )
    accepts_new_patients = serializers.BooleanField(required=False, default=True)

    # Step 5 — Public profile
    bio = serializers.CharField(required=False, allow_blank=True)
    languages = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    services = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    # Step 6 — AI feature flags
    ai_feature_flags = serializers.JSONField(required=False, default=dict)

    # Step 7 — Verification / trust
    agreed_to_terms = serializers.BooleanField(required=False, default=False)

    # Step 8 — Subscription
    plan_code = serializers.ChoiceField(
        choices=[SubscriptionPlan.Code.FREE_DOCTOR, SubscriptionPlan.Code.INDIVIDUAL_DOCTOR],
        required=False,
        default=SubscriptionPlan.Code.FREE_DOCTOR,
    )
    payment_card_last4 = serializers.CharField(required=False, allow_blank=True, max_length=4)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate(self, attrs):
        if not attrs.get('agreed_to_terms'):
            raise serializers.ValidationError({'agreed_to_terms': 'You must accept the terms to continue.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        specialty_ids = validated_data.pop('specialty_ids', [])
        org_id = validated_data.pop('organization_id', None)
        workplace_name = validated_data.pop('workplace_name', '')
        workplace_city = validated_data.pop('workplace_city', '')
        workplace_address = validated_data.pop('workplace_address', '')
        plan_code = validated_data.pop('plan_code', SubscriptionPlan.Code.FREE_DOCTOR)
        card_last4 = validated_data.pop('payment_card_last4', '')

        email = validated_data['email']
        first_name = validated_data['first_name']
        last_name = validated_data['last_name']
        full_name = validated_data.get('full_name') or f'{first_name} {last_name}'.strip()

        user = User.objects.create(
            email=email,
            username=_unique_username(email.split('@')[0]),
            first_name=first_name,
            last_name=last_name,
            phone=validated_data.get('phone', ''),
            role=User.Role.DOCTOR,
        )
        user.set_password(validated_data['password'])
        user.save()

        organization = None
        if org_id:
            organization = Organization.objects.filter(id=org_id).first()
        elif workplace_name:
            organization = Organization.objects.create(
                name=workplace_name,
                slug=_unique_slug(workplace_name, Organization, field='slug'),
                city=workplace_city,
                address=workplace_address,
            )

        profile = DoctorProfile.objects.create(
            user=user,
            organization=organization,
            full_name=full_name,
            position=validated_data.get('position', ''),
            years_experience=validated_data.get('years_experience', 0),
            education=validated_data.get('education', ''),
            license_number=validated_data.get('license_number', ''),
            bio=validated_data.get('bio', ''),
            languages=validated_data.get('languages', []),
            services=validated_data.get('services', []),
            consultation_fee=validated_data.get('consultation_fee', 0),
            consultation_duration_minutes=validated_data.get('consultation_duration_minutes', 30),
            working_hours=validated_data.get('working_hours', {}),
            accepts_new_patients=validated_data.get('accepts_new_patients', True),
            ai_feature_flags=validated_data.get('ai_feature_flags', {}),
            agreed_to_terms=validated_data.get('agreed_to_terms', False),
            public_slug=_unique_slug(full_name, DoctorProfile),
            is_active=True,
            is_public=True,
        )

        # Link specialties if the IDs are valid
        for spec_id in specialty_ids:
            spec = Specialty.objects.filter(id=spec_id).first()
            if spec:
                DoctorSpecialty.objects.get_or_create(doctor_profile=profile, specialty=spec)

        # Subscription: individual plan = paid + AI on; free plan = profile visible but no AI
        plan = SubscriptionPlan.objects.filter(code=plan_code, is_active=True).first()
        if plan is None:
            plan, _ = SubscriptionPlan.objects.get_or_create(
                code=plan_code,
                defaults={
                    'name': 'Individual doctor' if plan_code == SubscriptionPlan.Code.INDIVIDUAL_DOCTOR else 'Free doctor',
                    'price_monthly': Decimal('15.00') if plan_code == SubscriptionPlan.Code.INDIVIDUAL_DOCTOR else Decimal('0.00'),
                    'max_doctors': 1,
                    'ai_enabled': plan_code == SubscriptionPlan.Code.INDIVIDUAL_DOCTOR,
                },
            )
        sub = Subscription.objects.create(user=user, plan=plan)
        profile.ai_enabled = plan.ai_enabled
        profile.save(update_fields=['ai_enabled'])

        if plan.price_monthly > 0:
            Payment.objects.create(
                subscription=sub,
                amount=plan.price_monthly,
                currency=plan.currency,
                status=Payment.Status.SUCCEEDED,
                card_last4=card_last4,
            )

        return user


class DoctorRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        serializer = DoctorRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(_tokens_for(user), status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Clinic-admin registration
# ---------------------------------------------------------------------------
class ClinicAdminRegistrationSerializer(serializers.Serializer):
    # Step 1 — Account
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True)

    # Step 2 — Clinic information
    clinic_name = serializers.CharField()
    clinic_type = serializers.ChoiceField(
        choices=Organization.OrgType.choices, default=Organization.OrgType.CLINIC
    )
    clinic_city = serializers.CharField()
    clinic_address = serializers.CharField(required=False, allow_blank=True)
    clinic_phone = serializers.CharField(required=False, allow_blank=True)
    clinic_email = serializers.EmailField(required=False, allow_blank=True)
    clinic_description = serializers.CharField(required=False, allow_blank=True)

    # Step 3 — Operational setup
    departments = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    working_hours = serializers.JSONField(required=False, default=dict)

    # Step 4 — Doctor management: initial doctor seats
    initial_doctor_emails = serializers.ListField(
        child=serializers.EmailField(), required=False, default=list
    )

    # Step 5 — Subscription
    plan_code = serializers.ChoiceField(
        choices=[SubscriptionPlan.Code.INDIVIDUAL_DOCTOR, SubscriptionPlan.Code.CLINIC],
        default=SubscriptionPlan.Code.CLINIC,
    )
    payment_card_last4 = serializers.CharField(required=False, allow_blank=True, max_length=4)

    # Step 7 — Admin permissions
    admin_permissions = serializers.JSONField(required=False, default=dict)

    # Step 8 — Agreements
    agreed_to_terms = serializers.BooleanField(required=False, default=False)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate(self, attrs):
        if not attrs.get('agreed_to_terms'):
            raise serializers.ValidationError({'agreed_to_terms': 'You must accept the terms to continue.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        plan_code = validated_data.pop('plan_code')
        card_last4 = validated_data.pop('payment_card_last4', '')
        initial_doctor_emails = validated_data.pop('initial_doctor_emails', [])
        departments = validated_data.pop('departments', [])

        email = validated_data['email']
        user = User.objects.create(
            email=email,
            username=_unique_username(email.split('@')[0]),
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data.get('phone', ''),
            role=User.Role.ADMIN,
        )
        user.set_password(validated_data['password'])
        user.save()

        organization = Organization.objects.create(
            type=validated_data.get('clinic_type', Organization.OrgType.CLINIC),
            name=validated_data['clinic_name'],
            slug=_unique_slug(validated_data['clinic_name'], Organization, field='slug'),
            city=validated_data['clinic_city'],
            address=validated_data.get('clinic_address', ''),
            description=validated_data.get('clinic_description', ''),
            phone=validated_data.get('clinic_phone', ''),
            email=validated_data.get('clinic_email', ''),
        )

        # Register departments
        for dept in departments:
            from organizations.models import Department
            Department.objects.get_or_create(
                organization=organization,
                slug=slugify(dept),
                defaults={'name': dept},
            )

        StaffRole.objects.create(
            organization=organization,
            user=user,
            role_name='Clinic Admin',
            permissions=validated_data.get('admin_permissions', {}),
        )

        plan = SubscriptionPlan.objects.filter(code=plan_code, is_active=True).first()
        if plan is None:
            plan, _ = SubscriptionPlan.objects.get_or_create(
                code=plan_code,
                defaults={
                    'name': 'Clinic' if plan_code == SubscriptionPlan.Code.CLINIC else 'Individual doctor',
                    'price_monthly': Decimal('99.00') if plan_code == SubscriptionPlan.Code.CLINIC else Decimal('15.00'),
                    'max_doctors': 10 if plan_code == SubscriptionPlan.Code.CLINIC else 1,
                    'ai_enabled': True,
                },
            )
        sub = Subscription.objects.create(organization=organization, plan=plan)

        if plan.price_monthly > 0:
            Payment.objects.create(
                subscription=sub,
                amount=plan.price_monthly,
                currency=plan.currency,
                status=Payment.Status.SUCCEEDED,
                card_last4=card_last4,
            )

        # Note: seats for initial doctors are *reserved* but we don't create
        # doctor profiles yet — clinic admins add them via the admin UI.
        user._pending_doctor_invites = initial_doctor_emails  # pyright: ignore
        return user


class ClinicAdminRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        serializer = ClinicAdminRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(_tokens_for(user), status=status.HTTP_201_CREATED)
