document.addEventListener('DOMContentLoaded', function() {
    // API URL
    const API_BASE_URL = '/api';
    const PRODUCTS_API = `${API_BASE_URL}/products/products/`;
    const CATEGORIES_API = `${API_BASE_URL}/products/categories/`;
    const ORDERS_API = `${API_BASE_URL}/orders/orders/`;
    
    console.log('Debug - API URLs:', { PRODUCTS_API, CATEGORIES_API });

    // Состояние корзины и localStorage
    let cart = [];
    const CART_STORAGE_KEY = 'bomj_cart';

    // DOM элементы
    const productsContainer = document.querySelector('.products');
    const categoriesContainer = document.querySelector('.categories ul');
    const openCartButton = document.getElementById('openCart');
    const closeButtons = document.querySelectorAll('.close-popup');
    const productPopup = document.getElementById('productPopup');
    const cartPopup = document.getElementById('cartPopup');
    const checkoutPopup = document.getElementById('checkoutPopup');
    const checkoutButton = document.getElementById('checkoutButton');
    const clearCartButton = document.getElementById('clearCartButton');
    const checkoutForm = document.getElementById('checkoutForm');
    const addToCartButton = document.querySelector('.add-to-cart');
    const closeOrderButton = document.querySelector('.close-order');

    // Загрузка корзины из localStorage
    function loadCartFromStorage() {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
            try {
                cart = JSON.parse(savedCart);
            } catch (e) {
                console.error('Ошибка при загрузке корзины:', e);
                cart = [];
            }
        }
    }

    // Сохранение корзины в localStorage
    function saveCartToStorage() {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }

    // Загружаем корзину при старте
    loadCartFromStorage();

    // Загрузка категорий с API
    async function fetchCategories() {
        try {
            console.log('Debug - Fetching categories from:', CATEGORIES_API);
            const response = await fetch(CATEGORIES_API);
            console.log('Debug - Categories response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            const data = await response.json();
            console.log('Debug - Categories data:', data);
            
            // Проверяем, является ли ответ пагинированным (содержит поле results)
            return data.results ? data.results : data;
        } catch (error) {
            console.error('Ошибка при загрузке категорий:', error);
            // Возвращаем демо-категории в случае ошибки
            const demoCategories = getDemoCategories();
            console.log('Debug - Using demo categories:', demoCategories);
            return demoCategories;
        }
    }

    // Демо-категории для случая, если API недоступно
    function getDemoCategories() {
        return [
            { id: 1, name: 'top', description: 'Верхняя одежда' },
            { id: 2, name: 'bottom', description: 'Нижняя одежда' },
            { id: 3, name: 'accessories', description: 'Аксессуары' },
            { id: 4, name: 'headwear', description: 'Головные уборы' }
        ];
    }

    // Загрузка продуктов с API
    async function fetchProducts() {
        try {
            console.log('Debug - Fetching products from:', PRODUCTS_API);
            const response = await fetch(PRODUCTS_API);
            console.log('Debug - Products response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            const data = await response.json();
            console.log('Debug - Products data:', data);
            
            // Проверяем, является ли ответ пагинированным (содержит поле results)
            return data.results ? data.results : data;
        } catch (error) {
            console.error('Ошибка при загрузке продуктов:', error);
            // Возвращаем демо-продукты в случае ошибки
            const demoProducts = getDemoProducts();
            console.log('Debug - Using demo products:', demoProducts);
            return demoProducts;
        }
    }

    // Демо-продукты для случая, если API недоступно
    function getDemoProducts() {
        return [
            { id: 1, name: 'НАЗВАНИЕ', price: 1000, category: { id: 1, name: 'top' } },
            { id: 2, name: 'НАЗВАНИЕ', price: 1000, category: { id: 1, name: 'top' } },
            { id: 3, name: 'НАЗВАНИЕ2', price: 1090, category: { id: 2, name: 'bottom' } },
            { id: 4, name: 'НАЗВАНИЕ', price: 1000, category: { id: 4, name: 'headwear' } },
            { id: 5, name: 'НАЗВАНИЕ', price: 1000, category: { id: 3, name: 'accessories' } },
            { id: 6, name: 'НАЗВАНИЕ', price: 1000, category: { id: 1, name: 'top' } },
            { id: 7, name: 'НАЗВАНИЕ', price: 1000, category: { id: 2, name: 'bottom' } },
            { id: 8, name: 'НАЗВАНИЕ', price: 1000, category: { id: 4, name: 'headwear' } },
            { id: 9, name: 'НАЗВАНИЕ', price: 1000, category: { id: 3, name: 'accessories' } },
            { id: 10, name: 'НАЗВАНИЕ', price: 1000, category: { id: 1, name: 'top' } },
            { id: 11, name: 'НАЗВАНИЕ', price: 1000, category: { id: 2, name: 'bottom' } },
            { id: 12, name: 'НАЗВАНИЕ', price: 1000, category: { id: 4, name: 'headwear' } }
        ];
    }

    // Генерация категорий в меню
    async function generateCategories() {
        if (!categoriesContainer) return;
        
        console.log('Debug - Categories container found:', categoriesContainer);
        
        // Получаем категории из API
        let categories = await fetchCategories();
        console.log('Debug - Categories after fetch:', categories);

        // Очищаем контейнер категорий
        categoriesContainer.innerHTML = '';
        
        // Добавляем первой категорию "ВСЕ"
        const allCategoryLi = document.createElement('li');
        allCategoryLi.innerHTML = `<a href="#" class="active" data-category="all">ВСЕ</a>`;
        categoriesContainer.appendChild(allCategoryLi);
        
        // Добавляем остальные категории из API
        categories.forEach(category => {
            const categoryElement = document.createElement('li');
            let categoryDisplayName = '';
            
            // Определяем название для отображения в зависимости от имени категории
            switch(category.name) {
                case 'top':
                    categoryDisplayName = 'ВЕРХ';
                    break;
                case 'bottom':
                    categoryDisplayName = 'НИЗ';
                    break;
                case 'accessories':
                    categoryDisplayName = 'АКСЕССУАРЫ';
                    break;
                case 'headwear':
                    categoryDisplayName = 'ГОЛОВНЫЕ УБОРЫ';
                    break;
                default:
                    categoryDisplayName = category.name.toUpperCase();
            }
            
            categoryElement.innerHTML = `<a href="#" data-category="${category.name}">${categoryDisplayName}</a>`;
            categoriesContainer.appendChild(categoryElement);
        });
        
        // Добавляем обработчики событий для категорий
        addCategoryEventListeners();
    }

    // Генерация продуктов на странице
    async function generateProducts() {
        if (!productsContainer) return;
        
        console.log('Debug - Products container found:', productsContainer);
        
        productsContainer.innerHTML = '';
        
        const products = await fetchProducts();
        console.log('Debug - Products after fetch:', products);
        
        if (products.length === 0) {
            console.log('Debug - No products found to display');
            productsContainer.innerHTML = '<div class="no-products">Нет доступных продуктов</div>';
            return;
        }
        
        products.forEach((product, index) => {
            console.log('Debug - Processing product:', product);
            
            const productElement = document.createElement('div');
            productElement.className = 'product';
            productElement.setAttribute('data-category', product.category ? product.category.name : 'unknown');
            productElement.setAttribute('data-id', product.id);
            
            // Установка уникального цвета фона для каждого продукта
            const hue = (index * 30) % 360;
            
            // Получаем URL изображения товара
            const imageUrl = product.image || '';
            
            productElement.innerHTML = `
                <div class="product-image" style="${imageUrl ? `background-image: url(${imageUrl}); background-size: cover;` : `background-color: hsl(${hue}, 20%, 85%)`}"></div>
                <h3>${product.name}</h3>
                <p>${product.price} РУБ.</p>
            `;
            
            productsContainer.appendChild(productElement);
        });
        
        // Добавляем обработчики событий для новых элементов продуктов
        addProductEventListeners(products);
    }

    // Добавление обработчиков событий для категорий
    function addCategoryEventListeners() {
        const categoryLinks = document.querySelectorAll('.categories a');
        
        categoryLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Удалить активный класс у всех ссылок
                categoryLinks.forEach(cat => cat.classList.remove('active'));
                
                // Добавить активный класс к кликнутой ссылке
                this.classList.add('active');
                
                const category = this.getAttribute('data-category');
                
                // Показать/скрыть продукты в зависимости от категории
                const productElements = document.querySelectorAll('.product');
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
    }

    // Добавление обработчиков событий для продуктов
    function addProductEventListeners(products) {
        const productElements = document.querySelectorAll('.product');
        
        productElements.forEach((productElement) => {
            productElement.addEventListener('click', function() {
                const productId = parseInt(this.getAttribute('data-id'));
                const currentProduct = products.find(p => p.id === productId);
                
                if (!currentProduct) return;
                
                // Получаем полную информацию о продукте с сервера
                fetchProductById(productId).then(product => {
                    // Обновление содержимого попапа
                    document.querySelector('.product-purchase h3').textContent = product.name;
                    document.querySelector('.product-purchase p').textContent = product.price + ' РУБ.';
                    
                    // Установка изображения в попапе
                    const productImageEl = document.querySelector('.product-image-large');
                    if (product.image) {
                        productImageEl.style.backgroundImage = `url(${product.image})`;
                        productImageEl.style.backgroundSize = 'cover';
                    } else {
                        // Если изображение отсутствует, используем цветовой фон
                        const index = products.indexOf(currentProduct);
                        const hue = (index * 30) % 360;
                        productImageEl.style.backgroundColor = `hsl(${hue}, 20%, 85%)`;
                        productImageEl.style.backgroundImage = '';
                    }
                    
                    // Установка ID продукта для кнопки добавления в корзину
                    addToCartButton.setAttribute('data-product-id', product.id);
                    
                    // Добавляем выбор размера, если он есть
                    if (product.sizes && product.sizes.length > 0) {
                        // Создание и добавление селекта с размерами
                        const sizeContainer = document.createElement('div');
                        sizeContainer.className = 'size-selection';
                        sizeContainer.innerHTML = `
                            <p>Выберите размер:</p>
                            <select id="product-size-select">
                                ${product.sizes.map(size => `<option value="${size.id}">${size.size}</option>`).join('')}
                            </select>
                        `;
                        
                        // Находим место для вставки селекта с размерами
                        const priceElement = document.querySelector('.product-purchase p');
                        if (priceElement.nextElementSibling && priceElement.nextElementSibling.classList.contains('size-selection')) {
                            priceElement.nextElementSibling.remove();
                        }
                        priceElement.after(sizeContainer);
                    }
                    
                    // Открытие попапа
                    openPopup(productPopup);
                });
            });
        });
    }

    // Инициализация страницы
    async function initializePage() {
        console.log('Debug - Initializing page');
        await generateCategories(); // Сначала загружаем категории
        await generateProducts();  // Затем загружаем продукты
        console.log('Debug - Page initialization complete');
    }

    // Запускаем инициализацию
    initializePage();

    // Функционал кнопки добавления в корзину
    if (addToCartButton) {
        addToCartButton.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-product-id'));
            
            // Получаем продукт с сервера или из локального кэша
            fetchProductById(productId).then(product => {
                if (product) {
                    // Получаем выбранный размер (если есть)
                    let sizeId, sizeName;
                    const sizeSelect = document.getElementById('product-size-select');
                    
                    if (sizeSelect) {
                        sizeId = parseInt(sizeSelect.value);
                        sizeName = sizeSelect.options[sizeSelect.selectedIndex].text;
                    } else {
                        // По умолчанию берем первый доступный размер или используем "ONE SIZE"
                        if (product.sizes && product.sizes.length > 0) {
                            sizeId = product.sizes[0].id;
                            sizeName = product.sizes[0].size;
                        } else {
                            sizeId = null;
                            sizeName = "ONE SIZE";
                        }
                    }
                    
                    // Проверяем, есть ли продукт в корзине с таким же размером
                    const existingItem = cart.find(item => 
                        item.product.id === productId && item.size.name === sizeName
                    );
                    
                    if (existingItem) {
                        existingItem.quantity += 1;
                    } else {
                        cart.push({
                            product: {
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image: product.image
                            },
                            size: {
                                id: sizeId,
                                name: sizeName
                            },
                            quantity: 1
                        });
                    }
                    
                    // Сохраняем корзину в localStorage
                    saveCartToStorage();
                    
                    // Закрыть попап продукта и показать попап корзины
                    closePopup(productPopup);
                    updateCartDisplay();
                    openPopup(cartPopup);
                }
            });
        });
    }

    // Получить продукт по ID
    async function fetchProductById(id) {
        try {
            const response = await fetch(`${PRODUCTS_API}${id}/`);
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Ошибка при загрузке продукта с ID ${id}:`, error);
            // В случае ошибки ищем продукт в демо-данных
            const demoProducts = getDemoProducts();
            return demoProducts.find(p => p.id === id);
        }
    }

    // Открыть попап корзины при клике на кнопку корзины
    if (openCartButton) {
        openCartButton.addEventListener('click', function(e) {
            e.preventDefault();
            updateCartDisplay();
            openPopup(cartPopup);
        });
    }

    // Очистить корзину при клике на кнопку очистки
    if (clearCartButton) {
        clearCartButton.addEventListener('click', function() {
            cart = [];
            saveCartToStorage();
            updateCartDisplay();
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
        checkoutForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (cart.length === 0) {
                alert('Ваша корзина пуста. Добавьте товары перед оформлением заказа.');
                return;
            }
            
            // Собираем данные формы
            const formData = new FormData(checkoutForm);
            const orderData = {
                email: formData.get('email') || '',
                first_name: formData.get('first_name') || '',
                last_name: '',
                phone: formData.get('phone') || '',
                address: '',
                city: formData.get('city') || '',
                postal_code: '',
                delivery_method: formData.get('delivery') || 'pickup',
                items: cart.map(item => ({
                    product_id: item.product.id,
                    size_id: item.size.id || 1, // Используем id размера или 1 по умолчанию, если размер null
                    quantity: item.quantity,
                    price: item.product.price
                }))
            };
            
            try {
                // Отправляем заказ на сервер
                const response = await fetch(ORDERS_API, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify(orderData)
                });
                
                if (!response.ok) {
                    throw new Error(`Ошибка HTTP: ${response.status}`);
                }
                
                const order = await response.json();
                
                // Очищаем корзину после успешного оформления заказа
                cart = [];
                saveCartToStorage();
                
                // Перенаправляем на страницу заказа
                window.location.href = `/order/${order.order_number}/`;
            } catch (error) {
                console.error('Ошибка при оформлении заказа:', error);
                alert('Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз.');
            }
        });
    }
    
    // Закрыть страницу с деталями заказа при клике на X (на order.html)
    if (closeOrderButton) {
        closeOrderButton.addEventListener('click', function() {
            window.location.href = '/';
        });
    }
    
    // Получение CSRF-токена из куки
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
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
                    <div class="cart-item-image" ${item.product.image ? `style="background-image: url(${item.product.image}); background-size: cover;"` : ''}></div>
                    <div class="cart-item-details">
                        <h3>${item.product.name}</h3>
                        <div class="size">${item.size.name}</div>
                    </div>
                    <div class="cart-item-price">${item.product.price} РУБ.</div>
                    <div class="cart-item-quantity">
                        <button class="decrease-quantity" data-product-id="${item.product.id}" data-size="${item.size.name}">-</button>
                        <span>${item.quantity}</span>
                        <button class="increase-quantity" data-product-id="${item.product.id}" data-size="${item.size.name}">+</button>
                    </div>
                `;
                
                cartItemsContainer.appendChild(cartItemElement);
            });
            
            // Добавить обработчики событий для кнопок количества
            document.querySelectorAll('.decrease-quantity').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = parseInt(this.getAttribute('data-product-id'));
                    const size = this.getAttribute('data-size');
                    const itemIndex = cart.findIndex(item => 
                        item.product.id === productId && item.size.name === size
                    );
                    
                    if (itemIndex !== -1) {
                        cart[itemIndex].quantity -= 1;
                        
                        if (cart[itemIndex].quantity <= 0) {
                            cart.splice(itemIndex, 1);
                        }
                        
                        saveCartToStorage();
                        updateCartDisplay();
                    }
                });
            });
            
            document.querySelectorAll('.increase-quantity').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = parseInt(this.getAttribute('data-product-id'));
                    const size = this.getAttribute('data-size');
                    const itemIndex = cart.findIndex(item => 
                        item.product.id === productId && item.size.name === size
                    );
                    
                    if (itemIndex !== -1) {
                        cart[itemIndex].quantity += 1;
                        saveCartToStorage();
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
            
            if (cart.length === 0) {
                checkoutItemsContainer.innerHTML = '<p>Ваша корзина пуста</p>';
                return;
            }
            
            // Добавить товары в корзину для отображения
            cart.forEach(item => {
                const checkoutItemElement = document.createElement('div');
                checkoutItemElement.className = 'checkout-item';
                
                checkoutItemElement.innerHTML = `
                    <div class="checkout-item-image" ${item.product.image ? `style="background-image: url(${item.product.image}); background-size: cover;"` : ''}></div>
                    <div class="checkout-item-details">
                        <h4>${item.product.name}</h4>
                        <div class="size">${item.size.name}</div>
                    </div>
                    <div class="checkout-item-price">${item.product.price} РУБ.</div>
                    <div class="checkout-item-quantity">
                        <button class="decrease-quantity" data-product-id="${item.product.id}" data-size="${item.size.name}">-</button>
                        <span>${item.quantity}</span>
                        <button class="increase-quantity" data-product-id="${item.product.id}" data-size="${item.size.name}">+</button>
                    </div>
                `;
                
                checkoutItemsContainer.appendChild(checkoutItemElement);
            });
            
            // Добавить обработчики событий для кнопок количества
            document.querySelectorAll('.checkout-item .decrease-quantity').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = parseInt(this.getAttribute('data-product-id'));
                    const size = this.getAttribute('data-size');
                    const itemIndex = cart.findIndex(item => 
                        item.product.id === productId && item.size.name === size
                    );
                    
                    if (itemIndex !== -1) {
                        cart[itemIndex].quantity -= 1;
                        
                        if (cart[itemIndex].quantity <= 0) {
                            cart.splice(itemIndex, 1);
                        }
                        
                        saveCartToStorage();
                        updateCheckoutItems();
                    }
                });
            });
            
            document.querySelectorAll('.checkout-item .increase-quantity').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = parseInt(this.getAttribute('data-product-id'));
                    const size = this.getAttribute('data-size');
                    const itemIndex = cart.findIndex(item => 
                        item.product.id === productId && item.size.name === size
                    );
                    
                    if (itemIndex !== -1) {
                        cart[itemIndex].quantity += 1;
                        saveCartToStorage();
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