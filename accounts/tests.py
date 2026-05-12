from django.test import TestCase
from django.contrib.auth.models import User


class SignupViewTest(TestCase):
    def test_signup_creates_user_and_redirects(self):
        response = self.client.post('/accounts/signup/', {
            'username': 'testuser', 'password': 'testpass123'
        })
        self.assertRedirects(response, '/dashboard/')
        self.assertTrue(User.objects.filter(username='testuser').exists())