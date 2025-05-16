from django.db import models
from django.utils.text import slugify
import uuid
from PIL import Image
import os
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import InMemoryUploadedFile

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0, editable=False)
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    image_thumbnail = models.ImageField(upload_to='products/thumbnails/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Обработка slug
        if not self.slug or '-' not in self.slug:
            base_slug = slugify(self.name)
            unique_id = str(uuid.uuid4())[:8]
            self.slug = f"{base_slug}-{unique_id}"
        
        # Определяем, новый ли это объект
        is_new = self.pk is None
        
        # Обработка изображения перед сохранением
        if self.image and hasattr(self.image, 'url') and not self.image_thumbnail:
            # Оптимизация и изменение размера основного изображения
            img = Image.open(self.image)
            
            # Не обрабатываем изображение, если оно уже было обработано
            if hasattr(img, 'is_animated') and img.is_animated:
                # Если это GIF-анимация, сохраняем как есть
                pass
            else:
                # Обработка обычного изображения
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Изменяем размер основного изображения, если оно слишком большое
                max_size = (1200, 1200)
                if img.width > max_size[0] or img.height > max_size[1]:
                    img.thumbnail(max_size, Image.LANCZOS)
                    
                    # Сохраняем оптимизированное изображение
                    output = BytesIO()
                    img.save(output, format='JPEG', quality=85, optimize=True)
                    output.seek(0)
                    
                    # Заменяем оригинальное изображение оптимизированным
                    filename = os.path.basename(self.image.name)
                    name, ext = os.path.splitext(filename)
                    self.image = InMemoryUploadedFile(
                        output, 'ImageField', f"{name}.jpg", 'image/jpeg',
                        output.getbuffer().nbytes, None
                    )
                
                # Создаем миниатюру
                thumb_size = (300, 300)
                thumbnail = img.copy()
                thumbnail.thumbnail(thumb_size, Image.LANCZOS)
                
                # Сохраняем миниатюру
                thumb_output = BytesIO()
                thumbnail.save(thumb_output, format='JPEG', quality=85, optimize=True)
                thumb_output.seek(0)
                
                # Сохраняем миниатюру в отдельное поле
                thumb_filename = os.path.basename(self.image.name)
                thumb_name, thumb_ext = os.path.splitext(thumb_filename)
                self.image_thumbnail = InMemoryUploadedFile(
                    thumb_output, 'ImageField', f"{thumb_name}_thumb.jpg", 'image/jpeg',
                    thumb_output.getbuffer().nbytes, None
                )
        
        # Сохраняем объект
        super().save(*args, **kwargs)
        
        # Обновляем общее количество для существующих объектов
        if not is_new:
            self.update_stock()

    def __str__(self):
        return self.name

    def update_stock(self):
        """Обновляет общее количество товара как сумму всех размеров"""
        total_stock = sum(size.stock for size in self.sizes.all())
        if self.stock != total_stock:
            self.stock = total_stock
            # Используем update для избежания рекурсии
            Product.objects.filter(pk=self.pk).update(stock=total_stock)

class ProductSize(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sizes')
    size = models.CharField(max_length=10)
    stock = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('product', 'size')

    def __str__(self):
        return f"{self.product.name} - {self.size}"
        
    def save(self, *args, **kwargs):
        """При сохранении размера обновляем общее количество товара"""
        super().save(*args, **kwargs)
        self.product.update_stock()
        
    def delete(self, *args, **kwargs):
        """При удалении размера обновляем общее количество товара"""
        product = self.product
        super().delete(*args, **kwargs)
        product.update_stock()
