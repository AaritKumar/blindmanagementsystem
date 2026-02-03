import codecs
import json

from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.urls import reverse_lazy
from django.views.decorators.http import require_POST
from django.views.generic import (CreateView, DeleteView, DetailView, ListView,
                                UpdateView)

from .models import Folder, Product, QRCode, Template


def home(request):
    return render(request, 'products/home.html')


def scan_beacon(request):
    return render(request, 'products/scan.html')


class DashboardView(LoginRequiredMixin, ListView):
    model = Product
    template_name = 'products/dashboard.html'
    context_object_name = 'products'

    def get_queryset(self):
        return Product.objects.filter(owner=self.request.user).order_by('-created_at')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update({
            'folders': Folder.objects.filter(owner=self.request.user).order_by('name'),
            'templates': Template.objects.all().order_by('name')
        })
        return context


class ProductCreateView(LoginRequiredMixin, CreateView):
    model = Product
    fields = ['name', 'text_description']
    template_name = 'products/product_form.html'
    success_url = reverse_lazy('dashboard')

    def form_valid(self, form):
        raw_description = self.request.POST.get('text_description', '')
        try:
            decoded_text = codecs.decode(raw_description, 'unicode_escape')
        except (UnicodeDecodeError, TypeError):
            decoded_text = raw_description
        form.instance.text_description = decoded_text

        form.instance.owner = self.request.user
        response = super().form_valid(form)
        QRCode.objects.create(linked_product=self.object)
        return response


class ProductUpdateView(LoginRequiredMixin, UpdateView):
    model = Product
    fields = ['name', 'text_description']
    template_name = 'products/product_edit_form.html'
    success_url = reverse_lazy('dashboard')


class ProductDeleteView(LoginRequiredMixin, DeleteView):
    model = Product
    success_url = reverse_lazy('dashboard')


class ProductListenView(DetailView):
    model = Product
    template_name = 'products/listen.html'
    context_object_name = 'product'
    slug_field = 'unique_slug'
    slug_url_kwarg = 'unique_slug'


class FolderCreateView(LoginRequiredMixin, CreateView):
    model = Folder
    fields = ['name']
    success_url = reverse_lazy('dashboard')

    def form_valid(self, form):
        form.instance.owner = self.request.user
        return super().form_valid(form)


class FolderUpdateView(LoginRequiredMixin, UpdateView):
    model = Folder
    fields = ['name']
    template_name = 'products/folder_edit_form.html'
    success_url = reverse_lazy('dashboard')


class FolderDeleteView(LoginRequiredMixin, DeleteView):
    model = Folder
    success_url = reverse_lazy('dashboard')

    def form_valid(self, form):
        Product.objects.filter(folder=self.object).update(folder=None)
        return super().form_valid(form)


class TemplateCreateView(LoginRequiredMixin, CreateView):
    model = Template
    fields = ['name', 'content']
    
    def get_success_url(self):
        return f"{reverse_lazy('dashboard')}?tab=create"


def use_template(request, template_id):
    template = get_object_or_404(Template, pk=template_id)
    return render(request, 'products/use_template.html', {'template': template})


@login_required
@require_POST
def update_product_folder(request):
    try:
        data = json.loads(request.body)
        product_id = data.get('product_id')
        folder_id = data.get('folder_id')
        
        product = Product.objects.get(id=product_id, owner=request.user)
        
        product.folder = None
        if folder_id:
            product.folder = Folder.objects.get(id=folder_id, owner=request.user)
            
        product.save()
        return JsonResponse({'status': 'ok'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
