"""
Review serializer.

We expose `patient_first_name` as a read-only computed field so the
public doctor profile can show "Kamola S." style author names without
leaking the rest of the patient's identity. The full patient FK is
still in `patient_profile` for admins who need it.
"""
from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    # Author display name — first name only, falls back to "Anonymous".
    patient_first_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id',
            'patient_profile',
            'patient_first_name',
            'doctor_profile',
            'appointment',
            'rating',
            'comment',
            'is_verified',
            'created_at',
        ]
        read_only_fields = ['created_at', 'patient_first_name']

    def get_patient_first_name(self, obj) -> str:
        try:
            user = obj.patient_profile.user
            return user.first_name or "Anonymous"
        except Exception:
            return "Anonymous"
