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

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'tracking_url', 'user', 'email', 'first_name', 'last_name',
            'phone', 'address', 'city', 'postal_code', 'status', 'total_amount',
            'payment_status', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['order_number', 'tracking_url', 'user', 'payment_status'] 