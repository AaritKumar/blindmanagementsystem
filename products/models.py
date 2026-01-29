import qrcode
from io import BytesIO
from django.core.files import File
from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
import shortuuid

# Architectural Decision:
# The Product and QRCode models are central to the application.
# A unique slug is used for the public URL to provide a clean, human-readable identifier.
# The QR code image is generated and saved programmatically upon saving a QRCode instance,
# ensuring data integrity and automating a core business process.

class Template(models.Model):
    """
    Represents a pre-defined template for product descriptions.
    """
    name = models.CharField(max_length=100)
    content = models.TextField()

    def __str__(self):
        return self.name

class Folder(models.Model):
    """
    Represents a folder to organize products.
    """
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='folders')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    """
    Represents a product with its audio description.
    """
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    folder = models.ForeignKey(Folder, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    name = models.CharField(max_length=200, help_text="A name for your product for easy identification.")
    text_description = models.TextField(help_text="The full text description that will be read aloud.")
    created_at = models.DateTimeField(auto_now_add=True)
    unique_slug = models.SlugField(unique=True, max_length=100, blank=True)

    def save(self, *args, **kwargs):
        """
        Generate a unique slug before saving the product.
        """
        if not self.unique_slug:
            # Using shortuuid for a concise, URL-friendly unique identifier.
            self.unique_slug = shortuuid.uuid()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class QRCode(models.Model):
    """
    Represents a QR code linked to a specific product.
    The QR code image is generated automatically.
    """
    linked_product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='qr_code')
    # The QR code image will be stored in the 'qr_codes' subdirectory of MEDIA_ROOT.
    image = models.ImageField(upload_to='qr_codes/', blank=True)
    public_url = models.URLField(blank=True)

    def save(self, *args, **kwargs):
        """
        Generate the public URL and the QR code image before saving.
        """
        # Architectural Decision: The public URL is constructed here to ensure it's always in sync
        # with the product's slug. This logic could be placed in a view, but putting it in the model
        # ensures that a QR code object *always* has a correct URL. A fixed domain is used here,
        # but in a production environment, this should be dynamically sourced from settings or the request.
        self.public_url = f"http://127.0.0.1:8000/listen/{self.linked_product.unique_slug}/"
        
        # Generate the QR code if it hasn't been created yet.
        if not self.image:
            qr_image = qrcode.make(self.public_url)
            canvas = qr_image.get_image()
            
            # Use BytesIO to handle the image in memory without saving to a temporary file.
            fname = f'qr_code-{self.linked_product.unique_slug}.png'
            buffer = BytesIO()
            canvas.save(buffer, 'PNG')
            self.image.save(fname, File(buffer), save=False)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"QR Code for {self.linked_product.name}"
