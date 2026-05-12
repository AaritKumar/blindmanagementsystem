import json
from django.test import TestCase
from django.contrib.auth.models import User
from .models import Product, QRCode


class ProductModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='u', password='p')

    def test_product_generates_unique_slug_on_save(self):
        product = Product.objects.create(
            owner=self.user, name='Test', text_description='desc'
        )
        self.assertNotEqual(product.unique_slug, '')

    def test_qrcode_auto_created_with_image_data(self):
        product = Product.objects.create(
            owner=self.user, name='Test', text_description='desc'
        )
        qr = QRCode.objects.create(linked_product=product)
        self.assertTrue(qr.image_data.startswith('data:image/png;base64,'))

    def test_listen_view_returns_200_for_valid_slug(self):
        product = Product.objects.create(
            owner=self.user, name='Test', text_description='desc'
        )
        response = self.client.get(f'/listen/{product.unique_slug}/')
        self.assertEqual(response.status_code, 200)

    def test_dashboard_requires_login(self):
        response = self.client.get('/dashboard/')
        self.assertRedirects(response, '/accounts/login/?next=/dashboard/')

    def test_update_product_folder_rejects_wrong_owner(self):
        other = User.objects.create_user(username='other', password='p')
        product = Product.objects.create(
            owner=other, name='Other product', text_description='desc'
        )
        self.client.login(username='u', password='p')
        response = self.client.post(
            '/api/update_product_folder/',
            data=json.dumps({'product_id': product.id, 'folder_id': None}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)