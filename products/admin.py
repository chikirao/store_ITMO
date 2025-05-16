from django.contrib import admin
from .models import Category, Product, ProductSize

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']

class ProductSizeInline(admin.TabularInline):
    model = ProductSize
    extra = 1  # Количество пустых форм для добавления новых размеров

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'stock', 'created_at']
    list_filter = ['category', 'created_at']
    readonly_fields = ['stock']  # Поле stock теперь только для чтения
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductSizeInline]  # Добавляем инлайн для размеров
    
    def get_readonly_fields(self, request, obj=None):
        """Делаем stock нередактируемым, так как он рассчитывается автоматически"""
        if obj:  # если это существующий объект
            return self.readonly_fields + ['stock']
        return self.readonly_fields

# Убираем ProductSize из админки, так как теперь он редактируется внутри Product
# @admin.register(ProductSize)
# class ProductSizeAdmin(admin.ModelAdmin):
#     list_display = ['product', 'size', 'stock']
#     list_filter = ['size']
#     list_editable = ['stock']
#     search_fields = ['product__name']
