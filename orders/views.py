from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from products.models import Product, ProductSize
from .models import Cart, CartItem, Order, OrderItem
from .serializers import CartSerializer, CartItemSerializer, OrderSerializer, OrderItemSerializer, CartItemCreateSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers
from rest_framework.views import APIView
from django.http import Http404

# Создаем представления для корзины и заказов

class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            # Очищаем старые корзины - оставляем только одну последнюю
            carts = Cart.objects.filter(user=self.request.user).order_by('-created_at')
            if carts.count() > 1:
                carts.exclude(id=carts.first().id).delete()
            return Cart.objects.filter(user=self.request.user)
        
        # Для неавторизованных пользователей используем сессии
        session_id = self.request.session.session_key
        if not session_id:
            self.request.session.save()
            session_id = self.request.session.session_key
            
        # Очищаем старые корзины для сессии
        carts = Cart.objects.filter(session_id=session_id).order_by('-created_at')
        if carts.count() > 1:
            carts.exclude(id=carts.first().id).delete()
        
        # Получаем или создаем корзину для текущей сессии
        cart, created = Cart.objects.get_or_create(
            session_id=session_id,
            defaults={'session_id': session_id}
        )
        return Cart.objects.filter(session_id=session_id)
    
    def get_object(self):
        if self.request.user.is_authenticated:
            return get_object_or_404(Cart, user=self.request.user)
        
        # Для неавторизованных пользователей
        session_id = self.request.session.session_key
        if not session_id:
            self.request.session.save()
            session_id = self.request.session.session_key
            
        cart, created = Cart.objects.get_or_create(
            session_id=session_id,
            defaults={'session_id': session_id}
        )
        return cart

    def perform_create(self, serializer):
        # Этот метод не будет вызван при использовании CartItemCreateSerializer,
        # так как он определяет свой метод create
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            session_id = self.request.session.session_key
            if not session_id:
                self.request.session.save()
                session_id = self.request.session.session_key
            serializer.save(session_id=session_id)

    def update(self, request, *args, **kwargs):
        cart = self.get_object()
        items_data = request.data.get('items', [])
        
        # Очищаем корзину, если передан пустой список
        if not items_data:
            cart.items.all().delete()
            return Response(self.get_serializer(cart).data)
        
        # Обновляем существующие товары
        for item_data in items_data:
            item_id = item_data.get('id')
            quantity = item_data.get('quantity')
            if item_id and quantity:
                try:
                    cart_item = cart.items.get(id=item_id)
                    cart_item.quantity = quantity
                    cart_item.save()
                except CartItem.DoesNotExist:
                    continue
        
        return Response(self.get_serializer(cart).data)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['include_total'] = True
        return context

    @action(detail=False, methods=['get'])
    def current(self, request):
        cart = self.get_object()
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        cart = self.get_object()
        serializer = CartItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(cart=cart)
            cart_serializer = self.get_serializer(cart)
            return Response(cart_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        cart = self.get_object()
        try:
            item = cart.items.get(id=request.data.get('item_id'))
            item.delete()
            cart_serializer = self.get_serializer(cart)
            return Response(cart_serializer.data)
        except CartItem.DoesNotExist:
            return Response(
                {"error": "Item not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    # Добавляем пример запроса для документации API
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CartItemCreateSerializer
        return self.serializer_class

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Order.objects.filter(user=self.request.user)
        return Order.objects.none()

    @action(detail=False, methods=['get'], url_path='by-number/(?P<order_number>[^/.]+)')
    def retrieve_by_number(self, request, order_number=None):
        """Получение заказа по его номеру (UUID)"""
        try:
            order = Order.objects.get(order_number=order_number)
            serializer = self.get_serializer(order)
            return Response(serializer.data)
        except Order.DoesNotExist:
            return Response(
                {"error": "Заказ с таким номером не найден"},
                status=status.HTTP_404_NOT_FOUND
            )

    def perform_create(self, serializer):
        cart = None
        
        # Получаем корзину в зависимости от того, авторизован пользователь или нет
        if self.request.user.is_authenticated:
            try:
                # Берем последнюю корзину пользователя
                cart = Cart.objects.filter(user=self.request.user).order_by('-created_at').first()
                if not cart:
                    raise Cart.DoesNotExist
            except Cart.DoesNotExist:
                raise serializers.ValidationError("Корзина не найдена")
        else:
            session_id = self.request.session.session_key
            if not session_id:
                raise serializers.ValidationError("Сессия не найдена")
            
            try:
                # Берем последнюю корзину для сессии
                cart = Cart.objects.filter(session_id=session_id).order_by('-created_at').first()
                if not cart:
                    raise Cart.DoesNotExist
            except Cart.DoesNotExist:
                raise serializers.ValidationError("Корзина не найдена")
        
        cart_items = cart.items.all()
        if not cart_items:
            raise serializers.ValidationError("Корзина пуста")

        # Проверяем наличие товаров
        out_of_stock_items = []
        for cart_item in cart_items:
            # Проверка наличия товара по размеру
            if cart_item.size.stock < cart_item.quantity:
                out_of_stock_items.append(f"{cart_item.product.name} (размер {cart_item.size.size})")
            # Также проверяем общее количество товара
            if cart_item.product.stock < cart_item.quantity:
                out_of_stock_items.append(f"{cart_item.product.name} (общий запас)")
        
        if out_of_stock_items:
            raise serializers.ValidationError(f"Некоторые товары отсутствуют на складе: {', '.join(out_of_stock_items)}")

        # Создаем заказ с или без привязки к пользователю
        if self.request.user.is_authenticated:
            order = serializer.save(
                user=self.request.user,
                total_amount=sum(item.product.price * item.quantity for item in cart_items)
            )
        else:
            order = serializer.save(
                total_amount=sum(item.product.price * item.quantity for item in cart_items)
            )

        # Создаем элементы заказа из корзины и обновляем запасы
        for cart_item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                size=cart_item.size,
                quantity=cart_item.quantity,
                price=cart_item.product.price
            )
            
            # Обновляем запасы - уменьшаем количество доступных товаров
            product = cart_item.product
            size = cart_item.size
            
            product.stock -= cart_item.quantity
            product.save(update_fields=['stock'])
            
            size.stock -= cart_item.quantity
            size.save(update_fields=['stock'])
            
        # Очищаем корзину после создания заказа
        cart.items.all().delete()

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

class OrderTrackingView(APIView):
    """
    Представление для публичного отслеживания заказа по номеру
    """
    permission_classes = [AllowAny]
    
    def get(self, request, order_number):
        try:
            order = Order.objects.get(order_number=order_number)
            serializer = OrderSerializer(order)
            return Response(serializer.data)
        except Order.DoesNotExist:
            return Response(
                {"error": "Заказ с таким номером не найден"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Ошибка при получении данных заказа: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
