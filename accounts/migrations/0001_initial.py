import os
from django.db import migrations
from django.contrib.auth import get_user_model
from django.contrib.sites.models import Site
from decouple import config

def create_superuser_and_update_site(apps, schema_editor):
    User = get_user_model()
    
    ADMIN_USERNAME = config('ADMIN_USERNAME', default=None)
    ADMIN_PASSWORD = config('ADMIN_PASSWORD', default=None)

    if ADMIN_USERNAME and ADMIN_PASSWORD:
        if not User.objects.filter(username=ADMIN_USERNAME).exists():
            print(f"Creating superuser: {ADMIN_USERNAME}")
            User.objects.create_superuser(
                username=ADMIN_USERNAME,
                password=ADMIN_PASSWORD
            )
        else:
            print(f"Superuser {ADMIN_USERNAME} already exists.")

    try:
        site = Site.objects.get(pk=1)
        render_hostname = config('RENDER_EXTERNAL_HOSTNAME', default=None)
        if render_hostname and site.domain == 'example.com':
            print(f"Updating site domain to: {render_hostname}")
            site.domain = render_hostname
            site.name = render_hostname
            site.save()
        else:
            print("Site domain already configured or RENDER_EXTERNAL_HOSTNAME not set.")
    except Site.DoesNotExist:
        print("Default site not found. Skipping domain update.")


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('sites', '0002_alter_domain_unique'),
    ]

    operations = [
        migrations.RunPython(create_superuser_and_update_site),
    ]
