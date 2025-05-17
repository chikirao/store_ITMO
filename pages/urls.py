from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('order/<uuid:order_number>/', views.order_view, name='order'),
] 