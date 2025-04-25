document.addEventListener('DOMContentLoaded', function() {
    // Демо продуктов
    const products = [
        { id: 1, name: 'НАЗВАНИЕ', price: 1000, category: 'top' },
        { id: 2, name: 'НАЗВАНИЕ', price: 1000, category: 'top' },
        { id: 3, name: 'НАЗВАНИЕ', price: 1000, category: 'bottom' },
        { id: 4, name: 'НАЗВАНИЕ', price: 1000, category: 'headwear' },
        { id: 5, name: 'НАЗВАНИЕ', price: 1000, category: 'accessories' },
        { id: 6, name: 'НАЗВАНИЕ', price: 1000, category: 'top' },
        { id: 7, name: 'НАЗВАНИЕ', price: 1000, category: 'bottom' },
        { id: 8, name: 'НАЗВАНИЕ', price: 1000, category: 'headwear' },
        { id: 9, name: 'НАЗВАНИЕ', price: 1000, category: 'accessories' },
        { id: 10, name: 'НАЗВАНИЕ', price: 1000, category: 'top' },
        { id: 11, name: 'НАЗВАНИЕ', price: 1000, category: 'bottom' },
        { id: 12, name: 'НАЗВАНИЕ', price: 1000, category: 'headwear' }
    ];

    // Состояние корзины
    let cart = [];

    // DOM элементы
    const productElements = document.querySelectorAll('.product');
    const categoryLinks = document.querySelectorAll('.categories a');
    const openCartButton = document.getElementById('openCart');
    const closeButtons = document.querySelectorAll('.close-popup');
    const productPopup = document.getElementById('productPopup');
    const cartPopup = document.getElementById('cartPopup');
    const checkoutPopup = document.getElementById('checkoutPopup');
    const checkoutButton = document.getElementById('checkoutButton');
    const checkoutForm = document.getElementById('checkoutForm');
    const addToCartButton = document.querySelector('.add-to-cart');
    const closeOrderButton = document.querySelector('.close-order');

    // Фильтрация категорий
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Удалить активный класс у всех ссылок
            categoryLinks.forEach(cat => cat.classList.remove('active'));
            
            // Добавить активный класс к кликнутой ссылке
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            
            // Показать/скрыть продукты в зависимости от категории
            productElements.forEach(product => {
                const productCategory = product.getAttribute('data-category');
                
                if (category === 'all' || category === productCategory) {
                    product.style.display = 'block';
                } else {
                    product.style.display = 'none';
                }
            });
        });
    });

    // Открыть попап продукта при клике на продукт
    productElements.forEach((product, index) => {
        product.addEventListener('click', function() {
            // Установить текущие данные продукта (в реальном приложении, берём из сервера)
            const productIndex = index % products.length;
            const currentProduct = products[productIndex];
            
            // Обновить содержимое попапа с данными продукта
            document.querySelector('.product-purchase h3').textContent = currentProduct.name;
            document.querySelector('.product-purchase p').textContent = currentProduct.price + ' РУБ.';
            
            // Установить разные цвета фона для каждого продукта, чтобы их можно было отличить
            const hue = (index * 30) % 360;
            document.querySelector('.product-image-large').style.backgroundColor = `hsl(${hue}, 20%, 85%)`;
            
            // Хранит ID продукта для функционала добавления в корзину
            addToCartButton.setAttribute('data-product-id', currentProduct.id);
            
            // Показать попап
            openPopup(productPopup);
        });
    });

    // Функционал кнопки добавления в корзину
    if (addToCartButton) {
        addToCartButton.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-product-id'));
            const product = products.find(p => p.id === productId);
            
            if (product) {
                // Проверяет, есть ли продукт в корзине
                const existingItem = cart.find(item => item.product.id === productId);
                
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    cart.push({
                        product: product,
                        quantity: 1,
                        size: 'размер' // Размер по умолчанию, в реальном приложении выбирается пользователем
                    });
                }
                
                // Закрыть попап продукта и показать попап корзины
                closePopup(productPopup);
                updateCartDisplay();
                openPopup(cartPopup);
            }
        });
    }

    // Открыть попап корзины при клике на кнопку корзины
    if (openCartButton) {
        openCartButton.addEventListener('click', function(e) {
            e.preventDefault();
            updateCartDisplay();
            openPopup(cartPopup);
        });
    }

    // Закрыть попап при клике на кнопку X
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const popup = this.closest('.popup-overlay');
            closePopup(popup);
        });
    });

    // Закрыть попап при клике вне контента
    document.querySelectorAll('.popup-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closePopup(this);
            }
        });
    });
    
    // Открыть форму оформления заказа при клике на кнопку оформления
    if (checkoutButton) {
        checkoutButton.addEventListener('click', function() {
            closePopup(cartPopup);
            updateCheckoutItems();
            openPopup(checkoutPopup);
        });
    }
    
    // Обработка отправки формы оформления заказа
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // В реальном приложении, отправляем данные на сервер здесь
            // На данный момент, перенаправляем на страницу подтверждения заказа
            window.location.href = 'order.html';
        });
    }
    
    // Закрыть страницу с деталями заказа при клике на X (на order.html)
    if (closeOrderButton) {
        closeOrderButton.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
    
    // Вспомогательные функции
    function openPopup(popup) {
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Запретить прокрутку за попапом
    }
    
    function closePopup(popup) {
        popup.style.display = 'none';
        document.body.style.overflow = ''; // Восстановить прокрутку
    }
    
    function updateCartDisplay() {
        const cartItemsContainer = document.querySelector('.cart-items');
        
        if (cartItemsContainer) {
            // Очистить текущие товары
            cartItemsContainer.innerHTML = '';
            
            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<p>Ваша корзина пуста</p>';
                return;
            }
            
            // Добавить товары в корзину для отображения
            cart.forEach(item => {
                const cartItemElement = document.createElement('div');
                cartItemElement.className = 'cart-item';
                
                cartItemElement.innerHTML = `
                    <div class="cart-item-image"></div>
                    <div class="cart-item-details">
                        <h3>${item.product.name}</h3>
                        <div class="size">${item.size}</div>
                    </div>
                    <div class="cart-item-price">${item.product.price} РУБ.</div>
                    <div class="cart-item-quantity">
                        <button class="decrease-quantity" data-product-id="${item.product.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="increase-quantity" data-product-id="${item.product.id}">+</button>
                    </div>
                `;
                
                cartItemsContainer.appendChild(cartItemElement);
            });
            
            // Добавить обработчики событий для кнопок количества
            document.querySelectorAll('.decrease-quantity').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = parseInt(this.getAttribute('data-product-id'));
                    const itemIndex = cart.findIndex(item => item.product.id === productId);
                    
                    if (itemIndex !== -1) {
                        cart[itemIndex].quantity -= 1;
                        
                        if (cart[itemIndex].quantity <= 0) {
                            cart.splice(itemIndex, 1);
                        }
                        
                        updateCartDisplay();
                    }
                });
            });
            
            document.querySelectorAll('.increase-quantity').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = parseInt(this.getAttribute('data-product-id'));
                    const itemIndex = cart.findIndex(item => item.product.id === productId);
                    
                    if (itemIndex !== -1) {
                        cart[itemIndex].quantity += 1;
                        updateCartDisplay();
                    }
                });
            });
        }
    }
    
    function updateCheckoutItems() {
        const checkoutItemsContainer = document.querySelector('.checkout-items');
        
        if (checkoutItemsContainer) {
            // Очистить текущие товары
            checkoutItemsContainer.innerHTML = '';
            
            // Добавить товары в корзину для отображения
            cart.forEach(item => {
                const checkoutItemElement = document.createElement('div');
                checkoutItemElement.className = 'checkout-item';
                
                checkoutItemElement.innerHTML = `
                    <div class="checkout-item-image"></div>
                    <div class="checkout-item-details">
                        <h4>${item.product.name}</h4>
                        <div class="size">${item.size}</div>
                    </div>
                    <div class="checkout-item-price">${item.product.price} РУБ.</div>
                    <div class="checkout-item-quantity">
                        <button class="decrease-quantity" data-product-id="${item.product.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="increase-quantity" data-product-id="${item.product.id}">+</button>
                    </div>
                `;
                
                checkoutItemsContainer.appendChild(checkoutItemElement);
            });
            
            // Добавить обработчики событий для кнопок количества
            document.querySelectorAll('.checkout-item .decrease-quantity').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = parseInt(this.getAttribute('data-product-id'));
                    const itemIndex = cart.findIndex(item => item.product.id === productId);
                    
                    if (itemIndex !== -1) {
                        cart[itemIndex].quantity -= 1;
                        
                        if (cart[itemIndex].quantity <= 0) {
                            cart.splice(itemIndex, 1);
                        }
                        
                        updateCheckoutItems();
                    }
                });
            });
            
            document.querySelectorAll('.checkout-item .increase-quantity').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = parseInt(this.getAttribute('data-product-id'));
                    const itemIndex = cart.findIndex(item => item.product.id === productId);
                    
                    if (itemIndex !== -1) {
                        cart[itemIndex].quantity += 1;
                        updateCheckoutItems();
                    }
                });
            });
        }
    }

    // Интерактивные элементы UI (наведение и клик)
    const interactiveElements = document.querySelectorAll('a, button, .product');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.opacity = '0.7';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
        
        element.addEventListener('mousedown', function() {
            this.style.border = '2px solid #000';
        });
        
        element.addEventListener('mouseup', function() {
            this.style.border = '';
        });
    });
}); 