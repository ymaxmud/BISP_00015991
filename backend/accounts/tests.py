from rest_framework.test import APITestCase


class RegisterViewTests(APITestCase):
    def test_public_register_cannot_create_admin(self):
        response = self.client.post(
            '/api/v1/auth/register/',
            {
                'email': 'admin@example.com',
                'password': 'verysecure123',
                'role': 'admin',
                'first_name': 'Fake',
                'last_name': 'Admin',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('role', response.data)
