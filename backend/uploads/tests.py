from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from accounts.models import User
from patients.models import PatientProfile
from uploads.models import UploadedReport


class UploadedReportTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='patient1',
            email='patient1@example.com',
            password='verysecure123',
            role=User.Role.PATIENT,
        )
        self.profile = PatientProfile.objects.create(
            user=self.user,
            first_name='Patient',
            last_name='One',
        )

    def test_patient_upload_is_attached_to_authenticated_patient(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            '/api/v1/uploads/',
            {'file': SimpleUploadedFile('report.txt', b'lab results')},
            format='multipart',
        )

        self.assertEqual(response.status_code, 201)
        report = UploadedReport.objects.get()
        self.assertEqual(report.patient_profile_id, self.profile.id)
        self.assertEqual(report.uploaded_by_user_id, self.user.id)
