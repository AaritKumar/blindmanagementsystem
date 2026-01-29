from django.urls import path
from .views import (
    DashboardView, ProductCreateView, ProductListenView, home, scan_beacon, 
    ProductDeleteView, FolderCreateView, ProductUpdateView, update_product_folder, 
    FolderUpdateView, FolderDeleteView, TemplateCreateView, use_template
)

urlpatterns = [
    path('', home, name='home'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('products/new/', ProductCreateView.as_view(), name='product_create'),
    path('products/<int:pk>/edit/', ProductUpdateView.as_view(), name='product_edit'),
    path('products/<int:pk>/delete/', ProductDeleteView.as_view(), name='product_delete'),
    path('folders/new/', FolderCreateView.as_view(), name='folder_create'),
    path('folders/<int:pk>/edit/', FolderUpdateView.as_view(), name='folder_edit'),
    path('folders/<int:pk>/delete/', FolderDeleteView.as_view(), name='folder_delete'),
    path('templates/new/', TemplateCreateView.as_view(), name='template_create'),
    path('templates/<int:template_id>/use/', use_template, name='use_template'),
    path('listen/<slug:unique_slug>/', ProductListenView.as_view(), name='product_listen'),
    path('api/update_product_folder/', update_product_folder, name='update_product_folder'),
    path('scan/', scan_beacon, name='scan_beacon'),
]
