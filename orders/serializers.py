from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem
from products.models import Product, ProductSize
from products.serializers import ProductSerializer, ProductSizeSerializer

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        write_only=True,
        source='product'
    )
    size = ProductSizeSerializer(read_only=True)
    size_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductSize.objects.all(),
        write_only=True,
        source='size'
    )

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'size', 'size_id', 'quantity']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'user', 'session_id', 'items', 'created_at', 'updated_at', 'total']
        read_only_fields = ['user', 'session_id']

    def get_total(self, obj):
        total = sum(item.product.price * item.quantity for item in obj.items.all())
        return total

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    size = ProductSizeSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'size', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES, default='pending')
    email = serializers.EmailField(help_text="Email для связи и отправки информации о заказе")
    first_name = serializers.CharField(help_text="Имя заказчика")
    last_name = serializers.CharField(help_text="Фамилия заказчика")
    phone = serializers.CharField(help_text="Телефон для связи")
    address = serializers.CharField(help_text="Адрес доставки")
    city = serializers.CharField(help_text="Город доставки")
    postal_code = serializers.CharField(help_text="Почтовый индекс")

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'tracking_url', 'user', 'email', 'first_name', 'last_name',
            'phone', 'address', 'city', 'postal_code', 'status', 'total_amount',
            'payment_status', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['order_number', 'tracking_url', 'user', 'payment_status']

class CartItemCreateSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        write_only=True
    )
    size_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductSize.objects.all(),
        write_only=True
    )
    quantity = serializers.IntegerField(min_value=1, default=1)

    def create(self, validated_data):
        request = self.context.get('request')
        
        # Получаем или создаем корзину
        if request.user.is_authenticated:
            # Удаляем старые корзины для этого пользователя, оставляем только последнюю
            carts = Cart.objects.filter(user=request.user).order_by('-created_at')
            if carts.count() > 1:
                # Сохраняем самую новую корзину
                latest_cart = carts.first()
                # Удаляем все остальные
                carts.exclude(id=latest_cart.id).delete()
                cart = latest_cart
            else:
                cart, created = Cart.objects.get_or_create(
                    user=request.user,
                    defaults={'user': request.user}
                )
        else:
            session_id = request.session.session_key
            if not session_id:
                request.session.save()
                session_id = request.session.session_key
                
            # Удаляем старые корзины для этой сессии, оставляем только последнюю
            carts = Cart.objects.filter(session_id=session_id).order_by('-created_at')
            if carts.count() > 1:
                # Сохраняем самую новую корзину
                latest_cart = carts.first()
                # Удаляем все остальные
                carts.exclude(id=latest_cart.id).delete()
                cart = latest_cart
            else:
                cart, created = Cart.objects.get_or_create(
                    session_id=session_id,
                    defaults={'session_id': session_id}
                )
        
        # Создаем или обновляем товар в корзине
        product = validated_data.get('product_id')
        size = validated_data.get('size_id')
        quantity = validated_data.get('quantity', 1)
        
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            size=size,
            defaults={
                'quantity': quantity
            }
        )
        
        if not created:
            # Если товар уже был в корзине, увеличиваем количество
            cart_item.quantity += quantity
            cart_item.save()
            
        return cart 