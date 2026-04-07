from rest_framework import serializers

from .models import Encounter


class EncounterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encounter
        fields = '__all__'
        read_only_fields = ['created_at']
