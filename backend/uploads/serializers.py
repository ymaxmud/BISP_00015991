from rest_framework import serializers

from avicenna.access import patient_profile_id

from .models import UploadedReport


class UploadedReportSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    appointment_time = serializers.DateTimeField(
        source='appointment.appointment_time', read_only=True
    )

    class Meta:
        model = UploadedReport
        fields = [
            'id',
            'patient_profile',
            'patient_name',
            'uploaded_by_user',
            'appointment',
            'appointment_time',
            'file',
            'file_name',
            'mime_type',
            'extracted_text',
            'validation_status',
            'uploaded_at',
        ]
        read_only_fields = [
            'uploaded_at',
            'file_name',
            'mime_type',
            'uploaded_by_user',
            'patient_name',
            'appointment_time',
        ]
        extra_kwargs = {
            'patient_profile': {'required': False},
            'appointment': {'required': False, 'allow_null': True},
            'extracted_text': {'required': False},
            'validation_status': {'required': False},
        }

    def create(self, validated_data):
        uploaded_file = validated_data.get('file')
        if uploaded_file:
            validated_data['file_name'] = uploaded_file.name
            validated_data['mime_type'] = getattr(uploaded_file, 'content_type', '')
        return super().create(validated_data)

    def get_patient_name(self, obj):
        return str(obj.patient_profile)

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated or not self.instance:
            return attrs

        if patient_profile_id(user):
            forbidden = {'patient_profile', 'uploaded_by_user', 'validation_status'} & set(attrs)
            if forbidden:
                raise serializers.ValidationError(
                    'Patients cannot rewrite ownership or validation fields on an uploaded report.'
                )

        return attrs
