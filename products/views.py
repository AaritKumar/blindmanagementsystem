from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, CreateView, DetailView, DeleteView, UpdateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from .models import Product, QRCode, Folder, Template

# Architectural Decision:
# Class-based views are used extensively to follow Django's "Don't Repeat Yourself" (DRY) principle.
# LoginRequiredMixin is used to protect views that should only be accessible to logged-in users.
# The `get_queryset` method in the DashboardView is overridden to ensure that business users
# can only see and manage their own products, which is a critical security and data privacy feature.

class DashboardView(LoginRequiredMixin, ListView):
    """
    Displays the business user's dashboard with Catalog and Create tabs.
    """
    model = Product
    template_name = 'products/dashboard.html'
    context_object_name = 'products'

    def get_queryset(self):
        return Product.objects.filter(owner=self.request.user).order_by('-created_at')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['folders'] = Folder.objects.filter(owner=self.request.user)
        context['templates'] = Template.objects.all().order_by('name')
        return context

class ProductCreateView(LoginRequiredMixin, CreateView):
    """
    Handles the creation of a new product description from the 'Create' tab.
    """
    model = Product
    fields = ['name', 'text_description']
    template_name = 'products/product_form.html'
    success_url = reverse_lazy('dashboard')

    def form_valid(self, form):
        form.instance.owner = self.request.user
        product = form.save()
        QRCode.objects.create(linked_product=product)
        return redirect(self.success_url)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['templates'] = Template.objects.all()
        return context

class ProductListenView(DetailView):
    """
    Public page that displays the product description and plays the audio.
    This is the page the QR code will link to.
    """
    model = Product
    template_name = 'products/listen.html'
    context_object_name = 'product'
    slug_field = 'unique_slug'
    slug_url_kwarg = 'unique_slug'

from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
import json

def home(request):
    """
    Serves the new landing page with 'Blind' and 'Business' options.
    """
    return render(request, 'products/home.html')

@login_required
@require_POST
def update_product_folder(request):
    """
    API endpoint to update a product's folder.
    """
    try:
        data = json.loads(request.body)
        product_id = data.get('product_id')
        folder_id = data.get('folder_id')
        
        product = Product.objects.get(id=product_id, owner=request.user)
        
        if folder_id is None:
            product.folder = None
        else:
            folder = Folder.objects.get(id=folder_id, owner=request.user)
            product.folder = folder
            
        product.save()
        return JsonResponse({'status': 'ok'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


def scan_beacon(request):
    """
    Serves the audio beacon page for scanning QR codes.
    """
    return render(request, 'products/scan.html')

class ProductDeleteView(LoginRequiredMixin, DeleteView):
    """
    Handles the deletion of a product.
    """
    model = Product
    success_url = reverse_lazy('dashboard')

class ProductUpdateView(LoginRequiredMixin, UpdateView):
    """
    Handles the editing of a product.
    """
    model = Product
    fields = ['name', 'text_description']
    template_name = 'products/product_edit_form.html'
    success_url = reverse_lazy('dashboard')


class FolderCreateView(LoginRequiredMixin, CreateView):
    """
    Handles the creation of a new folder.
    """
    model = Folder
    fields = ['name']
    success_url = reverse_lazy('dashboard')

    def form_valid(self, form):
        form.instance.owner = self.request.user
        return super().form_valid(form)

class FolderUpdateView(LoginRequiredMixin, UpdateView):
    """
    Handles the editing of a folder.
    """
    model = Folder
    fields = ['name']
    template_name = 'products/folder_edit_form.html'
    success_url = reverse_lazy('dashboard')

class FolderDeleteView(LoginRequiredMixin, DeleteView):
    """
    Handles the deletion of a folder. Products inside are moved to uncategorized.
    """
    model = Folder
    success_url = reverse_lazy('dashboard')

    def form_valid(self, form):
        # Move products to uncategorized before deleting the folder
        Product.objects.filter(folder=self.object).update(folder=None)
        return super().form_valid(form)

class TemplateCreateView(LoginRequiredMixin, CreateView):
    model = Template
    fields = ['name', 'content']
    
    def get_success_url(self):
        return reverse_lazy('dashboard') + '?tab=create'

def use_template(request, template_id):
    template = get_object_or_404(Template, pk=template_id)
    return render(request, 'products/use_template.html', {'template': template})


