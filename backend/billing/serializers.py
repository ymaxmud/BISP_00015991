from rest_framework import serializers

from .models import Payment, Subscription, SubscriptionPlan


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'code', 'name', 'description', 'price_monthly',
            'currency', 'max_doctors', 'ai_enabled', 'features',
        ]


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    current_doctor_count = serializers.IntegerField(read_only=True)
    max_doctors = serializers.IntegerField(read_only=True)
    ai_enabled = serializers.BooleanField(read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'plan', 'organization', 'user', 'status', 'started_at',
            'current_period_end', 'current_doctor_count', 'max_doctors',
            'ai_enabled',
        ]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'subscription', 'amount', 'currency',
            'status', 'method', 'card_last4', 'created_at',
        ]
