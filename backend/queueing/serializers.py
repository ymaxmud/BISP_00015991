from rest_framework import serializers

from .models import IntakeForm, QueueTicket


class IntakeFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntakeForm
        fields = '__all__'
        read_only_fields = ['submitted_at']


class QueueTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = QueueTicket
        fields = '__all__'
        read_only_fields = ['assigned_at', 'updated_at']
