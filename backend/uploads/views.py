from rest_framework import parsers, permissions, viewsets

from .models import UploadedReport
from .serializers import UploadedReportSerializer


class UploadedReportViewSet(viewsets.ModelViewSet):
    queryset = UploadedReport.objects.select_related(
        'patient_profile', 'uploaded_by_user', 'appointment'
    ).all()
    serializer_class = UploadedReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    filterset_fields = ['patient_profile', 'validation_status', 'appointment']
    search_fields = ['file_name']
