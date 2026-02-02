from django.core.management.base import BaseCommand
from django.template.loader import render_to_string
from django.conf import settings
import os
import shutil
from products.models import Product

class Command(BaseCommand):
    help = 'Builds a static version of the site for Netlify.'

    def handle(self, *args, **options):
        self.stdout.write('Starting to build static pages...')
        
        # Define the final output directory that Netlify will publish.
        output_dir = settings.STATIC_ROOT
        os.makedirs(output_dir, exist_ok=True)

        # --- Build the home page (index.html) ---
        home_html = render_to_string('products/home.html', {'is_static_build': True})
        with open(os.path.join(output_dir, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(home_html)
        self.stdout.write(self.style.SUCCESS('Successfully built index.html'))

        # --- Build the scan page (scan/index.html) ---
        scan_dir = os.path.join(output_dir, 'scan')
        os.makedirs(scan_dir, exist_ok=True)
        scan_html = render_to_string('products/scan.html')
        with open(os.path.join(scan_dir, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(scan_html)
        self.stdout.write(self.style.SUCCESS('Successfully built scan/index.html'))

        # --- Build the listen pages ---
        products = Product.objects.all()
        if not products:
            self.stdout.write(self.style.WARNING('No products found; skipping listen pages.'))
        else:
            listen_base_dir = os.path.join(output_dir, 'listen')
            for product in products:
                # Render the listen page to a string
                html_content = render_to_string('products/listen.html', {'product': product})
                
                # Create the necessary subdirectory
                product_dir = os.path.join(listen_base_dir, product.unique_slug)
                os.makedirs(product_dir, exist_ok=True)
                
                # Write the static file
                file_path = os.path.join(product_dir, 'index.html')
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(html_content)
                
                self.stdout.write(self.style.SUCCESS(f'Successfully built page for {product.name}'))

        self.stdout.write(self.style.SUCCESS('Static site build complete.'))

