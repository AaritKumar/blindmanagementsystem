import qrcode
from io import BytesIO
from django.core.files import File
from django.db import models
from django.contrib.auth.models import User
import shortuuid

class Template(models.Model):
    """ A reusable template for creating product descriptions. """
    name = models.CharField(max_length=100)
    content = models.TextField(help_text="Use [blank][placeholder] to create dynamic fields.")

    def __str__(self):
        return self.name

class Folder(models.Model):
    """ A folder for organizing products, owned by a user. """
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='folders')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    """ Represents a single product with an audio description. """
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    folder = models.ForeignKey(Folder, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    
    name = models.CharField(max_length=200, help_text="A name for your product for easy identification.")
    text_description = models.TextField(help_text="The full text description that will be read aloud.")
    
    created_at = models.DateTimeField(auto_now_add=True)
    unique_slug = models.SlugField(unique=True, max_length=100, blank=True)

    def save(self, *args, **kwargs):
        """ Automatically generate a unique slug on the first save. """
        if not self.unique_slug:
            self.unique_slug = shortuuid.uuid()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class QRCode(models.Model):
    """
    A QR code linked to a product. The image is generated automatically
    when the model is saved.
    """
    linked_product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='qr_code')
    image = models.ImageField(upload_to='qr_codes/', blank=True)
    public_url = models.URLField(blank=True)

    def save(self, *args, **kwargs):
        """
        Constructs the public URL and generates the QR code image before saving.
        Placing this logic in the model ensures that a QR code is always valid
        and points to the correct place.
        """
        # In production, this domain should come from the Site framework or settings.
        self.public_url = f"http://127.0.0.1:8000/listen/{self.linked_product.unique_slug}/"
        
        # Only generate the image if it doesn't already exist.
        if not self.image:
            qr_image = qrcode.make(self.public_url)
            canvas = qr_image.get_image()
            
            # In-memory file to avoid hitting the disk.
            fname = f'qr_code-{self.linked_product.unique_slug}.png'
            buffer = BytesIO()
            canvas.save(buffer, 'PNG')
            self.image.save(fname, File(buffer), save=False)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"QR Code for {self.linked_product.name}"
