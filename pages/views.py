from django.shortcuts import render, get_object_or_404
from orders.models import Order
from products.models import Category

def home_view(request):
    """
    Отображение главной страницы с товарами
    """
    # Получаем категории для отображения в шаблоне
    categories = Category.objects.all()
    return render(request, 'store/index.html', {'categories': categories})

def order_view(request, order_number):
    """
    Отображение страницы с деталями заказа
    """
    order = get_object_or_404(Order, order_number=order_number)

    # Преобразуем текстовый код способа доставки в читаемый текст
    delivery_method_map = {
        'pickup': 'Самовывоз СДЭК',
        'courier': 'Курьером СДЭК'
    }
    
    # Если delivery_method не указан, используем значение по умолчанию
    order.delivery_method_display = delivery_method_map.get(order.delivery_method, 'Не указано')
    
    return render(request, 'store/order.html', {'order': order})
