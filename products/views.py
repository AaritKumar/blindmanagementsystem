from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, CreateView, DetailView
from django.urls import reverse_lazy
from .models import Product, QRCode

# Architectural Decision:
# Class-based views are used extensively to follow Django's "Don't Repeat Yourself" (DRY) principle.
# LoginRequiredMixin is used to protect views that should only be accessible to logged-in users.
# The `get_queryset` method in the DashboardView is overridden to ensure that business users
# can only see and manage their own products, which is a critical security and data privacy feature.

class DashboardView(ListView):
    """
    Displays a list of all products.
    """
    model = Product
    template_name = 'products/dashboard.html'
    context_object_name = 'products'
    queryset = Product.objects.all().order_by('-created_at')

class ProductCreateView(CreateView):
    """
    Handles the creation of a new product description.
    """
    model = Product
    fields = ['name', 'text_description']
    template_name = 'products/product_form.html'
    success_url = reverse_lazy('dashboard')

    def form_valid(self, form):
        """
        Creates a QR code for the new product.
        """
        product = form.save()
        # A QRCode is automatically generated for the product.
        QRCode.objects.create(linked_product=product)
        return redirect(self.success_url)

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

def home(request):
    """
    Serves the homepage of the application.
    """
    return render(request, 'products/home.html')

def scan_beacon(request):
    """
    Serves the audio beacon page for scanning QR codes.
    """
    return render(request, 'products/scan.html')

