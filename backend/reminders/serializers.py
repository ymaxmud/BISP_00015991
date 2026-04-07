from rest_framework import serializers

from .models import Reminder


class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = '__all__'
        read_only_fields = ['created_at']
