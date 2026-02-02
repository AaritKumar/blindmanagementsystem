from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView, DetailView, DeleteView, UpdateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
import json

from .models import Product, QRCode, Folder, Template

# --- Main Page Views ---

def home(request):
    """ Renders the main landing page with 'Blind' and 'Business' choices. """
    return render(request, 'products/home.html')

def scan_beacon(request):
    """ Renders the QR code scanning page for visually impaired users. """
    return render(request, 'products/scan.html')

# --- Business Dashboard Views ---

class DashboardView(LoginRequiredMixin, ListView):
    """
    Main dashboard for business users. Displays their product catalog,
    folders, and the creation tools.
    """
    model = Product
    template_name = 'products/dashboard.html'
    context_object_name = 'products'

    def get_queryset(self):
        # Users should only see their own products.
        return Product.objects.filter(owner=self.request.user).order_by('-created_at')

    def get_context_data(self, **kwargs):
        # Add folders and templates to the context for display in the dashboard.
        context = super().get_context_data(**kwargs)
        context['folders'] = Folder.objects.filter(owner=self.request.user)
        context['templates'] = Template.objects.all().order_by('name')
        return context

# --- Product CRUD Views ---

import codecs

# ... (other imports)

class ProductCreateView(LoginRequiredMixin, CreateView):
    """ Handles the creation of a new product. """
    model = Product
    fields = ['name', 'text_description']
    template_name = 'products/product_form.html'
    success_url = reverse_lazy('dashboard')

    def form_valid(self, form):
        """
        This method is called when valid form data has been POSTed.
        It sanitizes the input before saving.
        """
        # --- Belt-and-Suspenders Sanitization ---
        # We clean the data here to ensure it's in good shape before the model's
        # final, definitive cleanup.
        raw_description = self.request.POST.get('text_description', '')
        try:
            # This handles strings that have been escaped for JavaScript.
            decoded_text = codecs.decode(raw_description, 'unicode_escape')
        except (UnicodeDecodeError, TypeError):
            # This handles cases where the string is already clean.
            decoded_text = raw_description
        
        form.instance.text_description = decoded_text

        # Assign the owner to the product.
        form.instance.owner = self.request.user
        
        # Call the parent class's form_valid() method.
        response = super().form_valid(form)
        
        # Create the related QRCode.
        QRCode.objects.create(linked_product=self.object)
        
        return response

class ProductUpdateView(LoginRequiredMixin, UpdateView):
    """ Handles editing an existing product. """
    model = Product
    fields = ['name', 'text_description']
    template_name = 'products/product_edit_form.html'
    success_url = reverse_lazy('dashboard')

class ProductDeleteView(LoginRequiredMixin, DeleteView):
    """ Handles deleting a product. """
    model = Product
    success_url = reverse_lazy('dashboard')

class ProductListenView(DetailView):
    """ Public-facing page that reads a product's description out loud. """
    model = Product
    template_name = 'products/listen.html'
    context_object_name = 'product'
    slug_field = 'unique_slug'
    slug_url_kwarg = 'unique_slug'

# --- Folder CRUD Views ---

class FolderCreateView(LoginRequiredMixin, CreateView):
    """ Handles the creation of a new folder. """
    model = Folder
    fields = ['name']
    success_url = reverse_lazy('dashboard')

    def form_valid(self, form):
        form.instance.owner = self.request.user
        return super().form_valid(form)

class FolderUpdateView(LoginRequiredMixin, UpdateView):
    """ Handles editing an existing folder. """
    model = Folder
    fields = ['name']
    template_name = 'products/folder_edit_form.html'
    success_url = reverse_lazy('dashboard')

class FolderDeleteView(LoginRequiredMixin, DeleteView):
    """ Handles deleting a folder and moves its contents to 'Uncategorized'. """
    model = Folder
    success_url = reverse_lazy('dashboard')

    def form_valid(self, form):
        # Don't orphan the products; move them to the main catalog.
        Product.objects.filter(folder=self.object).update(folder=None)
        return super().form_valid(form)

# --- Template CRUD Views ---

class TemplateCreateView(LoginRequiredMixin, CreateView):
    """ Handles the creation of a new template. """
    model = Template
    fields = ['name', 'content']
    
    def get_success_url(self):
        # Redirect back to the 'Create' tab to show the new template.
        return reverse_lazy('dashboard') + '?tab=create'

def use_template(request, template_id):
    """ Renders a page to create a product from a template. """
    template = get_object_or_404(Template, pk=template_id)
    return render(request, 'products/use_template.html', {'template': template})

# --- API Endpoints ---

@login_required
@require_POST
def update_product_folder(request):
    """
    API endpoint for the drag-and-drop functionality. Updates a product's
    folder when it's moved in the catalog.
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

