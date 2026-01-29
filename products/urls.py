from django.urls import path
from .views import DashboardView, ProductCreateView, ProductListenView, home, scan_beacon

urlpatterns = [
    path('', home, name='home'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('products/new/', ProductCreateView.as_view(), name='product_create'),
    path('listen/<slug:unique_slug>/', ProductListenView.as_view(), name='product_listen'),
    path('scan/', scan_beacon, name='scan_beacon'),
]
