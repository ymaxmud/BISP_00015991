from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import User
from appointments.models import Appointment
from doctors.models import DoctorProfile
from organizations.models import Organization
from patients.models import PatientProfile


class AppointmentScopeTests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(
            name='Avicenna Central Clinic',
            slug='avicenna-central',
            city='Tashkent',
        )
        self.doctor_user = User.objects.create_user(
            username='doctor1',
            email='doctor1@example.com',
            password='verysecure123',
            role=User.Role.DOCTOR,
        )
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor_user,
            organization=self.organization,
            full_name='Dr. Scope',
            public_slug='dr-scope',
        )

        self.patient_one_user = User.objects.create_user(
            username='patient1',
            email='patient1@example.com',
            password='verysecure123',
            role=User.Role.PATIENT,
        )
        self.patient_one = PatientProfile.objects.create(
            user=self.patient_one_user,
            first_name='Patient',
            last_name='One',
        )

        self.patient_two_user = User.objects.create_user(
            username='patient2',
            email='patient2@example.com',
            password='verysecure123',
            role=User.Role.PATIENT,
        )
        self.patient_two = PatientProfile.objects.create(
            user=self.patient_two_user,
            first_name='Patient',
            last_name='Two',
        )

        Appointment.objects.create(
            organization=self.organization,
            patient_profile=self.patient_one,
            doctor_profile=self.doctor_profile,
            appointment_time=timezone.now() + timedelta(days=1),
            reason='Patient one visit',
        )
        Appointment.objects.create(
            organization=self.organization,
            patient_profile=self.patient_two,
            doctor_profile=self.doctor_profile,
            appointment_time=timezone.now() + timedelta(days=2),
            reason='Patient two visit',
        )

    def test_patient_only_sees_their_own_appointments(self):
        self.client.force_authenticate(self.patient_one_user)
        response = self.client.get('/api/v1/appointments/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['patient_profile'], self.patient_one.id)

    def test_workload_endpoint_uses_correct_reverse_names(self):
        self.client.force_authenticate(self.doctor_user)
        response = self.client.get('/api/v1/analytics/workload/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.doctor_profile.id)
