import json
import os
import urllib.error
import urllib.request

from rest_framework import filters, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """Old simple register endpoint.

    We still keep this because some older frontend flows may call it. The
    newer multi-step registration endpoints live elsewhere, but removing this
    right away would break any code still using the old route.
    """

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class SupabaseSyncView(APIView):
    """
    This endpoint is the bridge between Supabase auth and Django auth.

    The frontend sends us a Supabase access token. We ask Supabase who that
    token belongs to, then we find or create the matching Django user and
    return our normal Django JWT tokens back to the frontend.

    Request body: { "access_token": "<supabase access token>" }
    Response:     { "user": {...}, "access": "...", "refresh": "..." }
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        access_token = request.data.get('access_token')
        if not access_token:
            return Response(
                {'detail': 'access_token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        supabase_url = os.getenv('SUPABASE_URL', '').rstrip('/')
        supabase_anon = os.getenv('SUPABASE_ANON_KEY', '')
        if not supabase_url or not supabase_anon:
            return Response(
                {'detail': 'Supabase is not configured on the server.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # We do not trust the frontend's word about the token. We send the
        # token back to Supabase and let Supabase tell us which user it belongs
        # to.
        req = urllib.request.Request(
            f'{supabase_url}/auth/v1/user',
            headers={
                'Authorization': f'Bearer {access_token}',
                'apikey': supabase_anon,
            },
            method='GET',
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                payload = json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as exc:
            return Response(
                {'detail': f'Supabase rejected the token ({exc.code}).'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            return Response(
                {'detail': f'Could not reach Supabase: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        email = (payload.get('email') or '').strip().lower()
        if not email:
            return Response(
                {'detail': 'Supabase user has no email.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        metadata = payload.get('user_metadata') or {}
        full_name = metadata.get('full_name') or metadata.get('name') or ''
        first_name, _, last_name = full_name.partition(' ')

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': first_name or metadata.get('given_name', ''),
                'last_name': last_name or metadata.get('family_name', ''),
                'role': User.Role.PATIENT,
            },
        )
        if created:
            user.set_unusable_password()
            user.save()
        else:
            # If the account already existed without profile names, fill in
            # whatever we can from Supabase so the user record gets nicer over time.
            updated = False
            if not user.first_name and (first_name or metadata.get('given_name')):
                user.first_name = first_name or metadata.get('given_name', '')
                updated = True
            if not user.last_name and (last_name or metadata.get('family_name')):
                user.last_name = last_name or metadata.get('family_name', '')
                updated = True
            if updated:
                user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'created': created,
        })


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class IsStaffOrAdmin(permissions.BasePermission):
    """
    Only trusted staff-level users should be able to browse the user list.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_staff or user.is_superuser:
            return True
        return user.role in (User.Role.ADMIN, User.Role.SUPERADMIN)


class UserListView(generics.ListAPIView):
    """
    This powers the admin users screen.

    The query params are intentionally simple so the frontend can filter by
    role and search by name/email without extra backend-specific logic.
    """

    serializer_class = UserSerializer
    permission_classes = [IsStaffOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name', 'username']
    ordering_fields = ['date_joined', 'email', 'role']
    ordering = ['-date_joined']

    def get_queryset(self):
        qs = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        active = self.request.query_params.get('is_active')
        if active is not None:
            qs = qs.filter(is_active=active.lower() in ('1', 'true', 'yes'))
        return qs
