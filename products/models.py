import base64
import codecs
from io import BytesIO

import qrcode
import shortuuid
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
from django.core.files import File
from django.db import models
from django.utils.text import slugify


class Template(models.Model):
    name = models.CharField(max_length=100)
    content = models.TextField(help_text="Use [placeholder] to create dynamic fields.")

    def __str__(self):
        return self.name


class Folder(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='folders')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    folder = models.ForeignKey(Folder, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    
    name = models.CharField(max_length=200, help_text="A descriptive name for the product.")
    text_description = models.TextField(help_text="The text that will be read aloud when the QR code is scanned.")
    
    created_at = models.DateTimeField(auto_now_add=True)
    unique_slug = models.SlugField(unique=True, max_length=100, blank=True)

    def save(self, *args, **kwargs):
        if self.text_description:
            try:
                decoded_text = codecs.decode(self.text_description, 'unicode_escape')
                self.text_description = decoded_text.replace('\r\n', '\n').replace('\r', '\n')
            except (UnicodeDecodeError, TypeError):
                self.text_description = self.text_description.replace('\r\n', '\n').replace('\r', '\n')
            
        if not self.unique_slug:
            self.unique_slug = shortuuid.uuid()
            
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class QRCode(models.Model):
    linked_product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='qr_code')
    image_data = models.TextField(blank=True, help_text="Base64 encoded image data of the QR code.")
    public_url = models.URLField(blank=True)

    def get_filename(self):
        return f"{slugify(self.linked_product.name)}.png"

    def save(self, *args, **kwargs):
        protocol = 'https' if not settings.DEBUG else 'http'
        domain = Site.objects.get_current().domain
        self.public_url = f"{protocol}://{domain}/listen/{self.linked_product.unique_slug}/"
        
        if not self.image_data:
            qr_image = qrcode.make(self.public_url)
            canvas = qr_image.get_image()
            
            buffer = BytesIO()
            canvas.save(buffer, 'PNG')
            
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            self.image_data = f"data:image/png;base64,{image_base64}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"QR Code for {self.linked_product.name}"
