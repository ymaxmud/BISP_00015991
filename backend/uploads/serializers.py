from rest_framework import serializers

from .models import UploadedReport


class UploadedReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedReport
        fields = '__all__'
        read_only_fields = ['uploaded_at', 'file_name', 'mime_type']

    def create(self, validated_data):
        uploaded_file = validated_data.get('file')
        if uploaded_file:
            validated_data['file_name'] = uploaded_file.name
            validated_data['mime_type'] = getattr(uploaded_file, 'content_type', '')
        return super().create(validated_data)
