from rest_framework import generics, permissions
from rest_framework.response import Response

from .models import SubscriptionPlan
from .serializers import SubscriptionPlanSerializer, SubscriptionSerializer


class SubscriptionPlanListView(generics.ListAPIView):
    """Public catalogue of subscription plans."""

    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]


class MySubscriptionView(generics.RetrieveAPIView):
    """
    Returns the currently authenticated user's active subscription.
    Looks at individual (user-linked) and clinic (staff-linked) subscriptions.
    """

    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        # Individual doctor plan?
        individual = getattr(user, 'individual_subscription', None)
        if individual:
            data = SubscriptionSerializer(individual).data
            data['current_doctor_count'] = individual.current_doctor_count()
            data['max_doctors'] = individual.max_doctors
            data['ai_enabled'] = individual.ai_enabled
            return Response(data)
        # Clinic plan via staff role?
        staff = user.staff_roles.select_related('organization__subscription__plan').first()
        if staff and getattr(staff.organization, 'subscription', None):
            sub = staff.organization.subscription
            data = SubscriptionSerializer(sub).data
            data['current_doctor_count'] = sub.current_doctor_count()
            data['max_doctors'] = sub.max_doctors
            data['ai_enabled'] = sub.ai_enabled
            return Response(data)
        return Response({'detail': 'No active subscription.'}, status=404)
