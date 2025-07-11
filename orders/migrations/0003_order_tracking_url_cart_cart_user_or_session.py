# Generated by Django 5.2 on 2025-05-15 16:13

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_alter_order_total_amount'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='tracking_url',
            field=models.CharField(blank=True, editable=False, max_length=250, null=True),
        ),
        migrations.AddConstraint(
            model_name='cart',
            constraint=models.CheckConstraint(condition=models.Q(('user__isnull', False), ('session_id__isnull', False), _connector='OR'), name='cart_user_or_session'),
        ),
    ]
