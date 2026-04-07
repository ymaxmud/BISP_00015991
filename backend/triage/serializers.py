from rest_framework import serializers

from .models import AIOutput, AIRun, ReportChatMessage, ReportChatSession, TriageDecision


class TriageDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TriageDecision
        fields = '__all__'
        read_only_fields = ['created_at']


class AIOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIOutput
        fields = '__all__'


class AIRunSerializer(serializers.ModelSerializer):
    output = AIOutputSerializer(read_only=True)

    class Meta:
        model = AIRun
        fields = '__all__'
        read_only_fields = ['created_at', 'completed_at']


class ReportChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportChatMessage
        fields = '__all__'
        read_only_fields = ['created_at']


class ReportChatSessionSerializer(serializers.ModelSerializer):
    messages = ReportChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ReportChatSession
        fields = '__all__'
        read_only_fields = ['created_at']
