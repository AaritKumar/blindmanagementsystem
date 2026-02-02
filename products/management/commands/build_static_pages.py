from django.core.management.base import BaseCommand
from django.template.loader import render_to_string
from django.conf import settings
import os
from products.models import Product

class Command(BaseCommand):
    help = 'Builds static HTML pages for each product listen page.'

    def handle(self, *args, **options):
        self.stdout.write('Starting to build static pages...')
        
        # Ensure the output directory exists
        output_dir = settings.BASE_DIR / 'static_pages'
        os.makedirs(output_dir, exist_ok=True)

        products = Product.objects.all()
        if not products:
            self.stdout.write(self.style.WARNING('No products found in the database.'))
            return

        for product in products:
            # Render the listen page to a string
            html_content = render_to_string('products/listen.html', {'product': product})
            
            # Create the necessary subdirectory
            product_dir = output_dir / 'listen' / product.unique_slug
            os.makedirs(product_dir, exist_ok=True)
            
            # Write the static file
            file_path = product_dir / 'index.html'
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            self.stdout.write(self.style.SUCCESS(f'Successfully built page for {product.name} at {file_path}'))

        self.stdout.write(self.style.SUCCESS('Static page build complete.'))
