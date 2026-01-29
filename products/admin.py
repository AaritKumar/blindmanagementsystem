from django.contrib import admin
from .models import Product, QRCode, Folder, Template

# Architectural Decision:
# The Django admin is a powerful tool for internal data management. By registering the models,
# we get a full-featured CRUD interface for free. The `QRCodeInline` allows for the management
# of QR codes directly within the product admin page, which is a more intuitive workflow.

class QRCodeInline(admin.StackedInline):
    model = QRCode
    can_delete = False
    verbose_name_plural = 'QR Code'
    fk_name = 'linked_product'
    readonly_fields = ('image_tag',)

    def image_tag(self, instance):
        from django.utils.html import mark_safe
        if instance.image:
            return mark_safe(f'<img src="{instance.image.url}" width="150" height="150" />')
        return ""
    image_tag.short_description = 'QR Code Image'

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'folder', 'created_at')
    search_fields = ('name', 'text_description')
    list_filter = ('created_at', 'owner', 'folder')
    inlines = (QRCodeInline,)
    readonly_fields = ('unique_slug',)

@admin.register(QRCode)
class QRCodeAdmin(admin.ModelAdmin):
    list_display = ('linked_product', 'public_url')
    readonly_fields = ('image_tag',)

    def image_tag(self, instance):
        from django.utils.html import mark_safe
        if instance.image:
            return mark_safe(f'<img src="{instance.image.url}" width="150" height="150" />')
        return ""
    image_tag.short_description = 'QR Code Image'

@admin.register(Folder)
class FolderAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner')
    search_fields = ('name',)
    list_filter = ('owner',)

@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name', 'content')
