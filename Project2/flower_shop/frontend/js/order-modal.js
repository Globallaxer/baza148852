// order-modal.js - исправленная версия

// модальное окно для заказа
const modal = document.getElementById('order-modal');
const closeBtn = modal?.querySelector('.modal-close');
const orderForm = document.getElementById('order-form');

// Убираем ошибку, просто логируем предупреждение, если элементов нет
if (!modal) {
    console.warn('Модальное окно order-modal не найдено на этой странице');
}
if (!closeBtn && modal) {
    console.warn('Кнопка закрытия не найдена');
}
if (!orderForm) {
    console.warn('Форма заказа не найдена');
}

// остальной код оберните в проверку
if (modal && closeBtn && orderForm) {
    // текущий выбранный товар (для одиночного заказа) или массив товаров
    let currentProduct = null;
    let currentCartItems = null;

    function isLoggedIn() {
        return !!localStorage.getItem('auth_token');
    }

    function getToken() {
        return localStorage.getItem('auth_token');
    }

    function getUserId() {
        const userStr = localStorage.getItem('user_data');
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                if (userData && userData.id) {
                    return userData.id;
                }
            } catch(e) {
                console.error('Error parsing user_data:', e);
            }
        }
        
        const token = getToken();
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.userId || payload.user_id;
        } catch {
            return null;
        }
    }

    function getUserData() {
        const userStr = localStorage.getItem('user_data');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
        return null;
    }

    function getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        };
    }

    function showToast(message) {
        const existingToasts = document.querySelectorAll('.toast-notification');
        if (existingToasts.length >= 3) {
            existingToasts[0].remove();
        }
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('hide');
                setTimeout(() => {
                    if (toast.parentNode) toast.remove();
                }, 300);
            }
        }, 3000);
    }

    function showAuthAlert() {
        showToast(`Для оформления заказа необходимо войти в аккаунт`);
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Функция для получения товара из глобального хранилища
    function findProductById(productId) {
        // Сначала пробуем через window.allProducts
        if (window.allProducts && Array.isArray(window.allProducts)) {
            const product = window.allProducts.find(p => p.id === productId);
            if (product) {
                console.log('Товар найден в window.allProducts:', product.name);
                return product;
            }
        }
        
        // Пробуем через window.products
        if (window.products && Array.isArray(window.products)) {
            const product = window.products.find(p => p.id === productId);
            if (product) {
                console.log('Товар найден в window.products:', product.name);
                return product;
            }
        }
        
        // Пробуем через window.bouquetsData
        if (window.bouquetsData) {
            for (const cat in window.bouquetsData) {
                if (window.bouquetsData[cat] && window.bouquetsData[cat].products) {
                    const product = window.bouquetsData[cat].products.find(p => p.id === productId);
                    if (product) {
                        console.log('Товар найден в bouquetsData категории:', cat);
                        return product;
                    }
                }
            }
        }
        
        return null;
    }

    // открытие модального окна для одного товара
    function openOrderModal(productId) {
        console.log('openOrderModal вызван с productId:', productId);
        
        if (!isLoggedIn()) {
            showAuthAlert();
            return;
        }
        
        // Ищем товар
        let product = findProductById(productId);
        
        // Если товар не найден, пробуем загрузить товары заново
        if (!product && window.loadProductsFromDB) {
            console.log('Товар не найден, пробуем загрузить товары...');
            window.loadProductsFromDB().then(() => {
                product = findProductById(productId);
                if (product) {
                    console.log('Товар найден после перезагрузки:', product.name);
                    openOrderModalWithProduct(product);
                } else {
                    console.error('Товар не найден даже после перезагрузки, productId:', productId);
                    showToast('Товар не найден');
                }
            });
        } else if (product) {
            openOrderModalWithProduct(product);
        } else {
            console.error('Товар не найден, productId:', productId);
            showToast('Товар не найден');
        }
    }
    
    function openOrderModalWithProduct(product) {
        console.log('Открытие модального окна для товара:', product.name);
        
        // Сохраняем текущий товар
        currentProduct = product;
        currentCartItems = null;
        
        // Показываем блок для одного товара, скрываем для нескольких
        const singleProductDiv = document.querySelector('.order-single-product');
        const multipleProductsDiv = document.querySelector('.order-multiple-products');
        
        if (singleProductDiv) {
            singleProductDiv.style.display = 'block';
        }
        if (multipleProductsDiv) {
            multipleProductsDiv.style.display = 'none';
        }
        
        // Заполняем данные товара в модальном окне
        const nameEl = document.getElementById('order-product-name');
        const priceEl = document.getElementById('order-product-price');
        const imageEl = document.getElementById('order-product-image');
        const dateEl = document.getElementById('order-date');
        
        if (nameEl) {
            nameEl.textContent = product.name;
        }
        if (priceEl) {
            priceEl.textContent = `${(product.price || 0).toLocaleString()} ₽`;
        }
        if (imageEl) {
            imageEl.src = product.image || 'https://i.pinimg.com/736x/97/78/33/9778339cf8a1e1e1851e6b6ed4ce81c6.jpg';
        }
        
        // Устанавливаем дату доставки на завтра
        if (dateEl) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateEl.value = tomorrow.toISOString().split('T')[0];
        }
        
        // Открываем модальное окно
        if (modal) {
            modal.classList.add('active');
        }
    }

    // открытие модального окна для нескольких товаров (из корзины)
    function openOrderModalForCart(items) {
        console.log('openOrderModalForCart вызван с items:', items);
        
        if (!isLoggedIn()) {
            showAuthAlert();
            return;
        }
        
        if (!items || items.length === 0) {
            showToast(`Нет товаров для оформления заказа`);
            return;
        }
        
        currentCartItems = items;
        currentProduct = null;
        
        // Показываем список товаров
        const singleProductDiv = document.querySelector('.order-single-product');
        const multipleProductsDiv = document.querySelector('.order-multiple-products');
        if (singleProductDiv) singleProductDiv.style.display = 'none';
        if (multipleProductsDiv) multipleProductsDiv.style.display = 'block';
        
        // Заполняем список товаров
        const itemsContainer = document.getElementById('order-items-list');
        let totalAmount = 0;
        
        if (itemsContainer) {
            itemsContainer.innerHTML = '';
            
            items.forEach(item => {
                const quantity = item.quantity || 1;
                const itemTotal = (item.price || 0) * quantity;
                totalAmount += itemTotal;
                const imageUrl = item.image || 'https://i.pinimg.com/736x/97/78/33/9778339cf8a1e1e1851e6b6ed4ce81c6.jpg';
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'order-cart-item';
                itemDiv.innerHTML = `
                    <img class="order-cart-item-image" src="${imageUrl}" alt="${escapeHTML(item.name)}">
                    <div class="order-cart-item-info">
                        <div class="order-cart-item-name">${escapeHTML(item.name)}</div>
                        <div class="order-cart-item-price">${(item.price || 0).toLocaleString()} ₽ × ${quantity}</div>
                    </div>
                    <div class="order-cart-item-total">${itemTotal.toLocaleString()} ₽</div>
                `;
                itemsContainer.appendChild(itemDiv);
            });
        }
        
        const totalEl = document.getElementById('order-cart-total');
        if (totalEl) totalEl.textContent = totalAmount.toLocaleString();
        
        // Устанавливаем дату доставки на завтра
        const dateEl = document.getElementById('order-date');
        if (dateEl) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateEl.value = tomorrow.toISOString().split('T')[0];
        }
        
        modal.classList.add('active');
    }

    function closeOrderModal() {
        modal.classList.remove('active');
        if (orderForm) orderForm.reset();
        currentProduct = null;
        currentCartItems = null;
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeOrderModal);
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeOrderModal();
            }
        });
    }

    // отправка формы
    if (orderForm) {
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!isLoggedIn()) {
                showAuthAlert();
                closeOrderModal();
                return;
            }
            
            const name = document.getElementById('order-name')?.value;
            const phone = document.getElementById('order-phone')?.value;
            const address = document.getElementById('order-address')?.value;
            
            if (!name || !phone || !address) {
                showToast(`Заполните все обязательные поля`);
                return;
            }
            
            let items = [];
            let totalAmount = 0;
            
            if (currentCartItems && currentCartItems.length > 0) {
                items = currentCartItems.map(item => ({
                    productId: item.id,
                    productName: item.name,
                    productImage: item.image,
                    price: item.price,
                    quantity: item.quantity || 1
                }));
                totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            } else if (currentProduct) {
                items = [{
                    productId: currentProduct.id,
                    productName: currentProduct.name,
                    productImage: currentProduct.image,
                    price: currentProduct.price,
                    quantity: 1
                }];
                totalAmount = currentProduct.price;
            } else {
                showToast(`Нет товаров для оформления`);
                return;
            }
            
            const userId = getUserId();
            if (!userId) {
                showToast(`Ошибка: пользователь не найден`);
                return;
            }
            
            const orderData = {
                userId: userId,
                items: items,
                customerName: name,
                phone: phone,
                email: document.getElementById('order-email')?.value || '',
                address: address,
                deliveryDate: document.getElementById('order-date')?.value || new Date(Date.now() + 86400000).toISOString().split('T')[0],
                comment: document.getElementById('order-comment')?.value || '',
                orderDate: new Date().toISOString(),
                totalAmount: totalAmount
            };
            
            console.log('Отправка заказа:', orderData);
            
            try {
                const response = await fetch(`${API_BASE_URL}/orders/create/`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(orderData)
                });
                
                console.log('Response status:', response.status);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('Заказ создан:', result);
                    
                    if (currentCartItems && currentCartItems.length > 0) {
                        for (const item of currentCartItems) {
                            try {
                                await fetch(`${API_BASE_URL}/cart/remove/`, {
                                    method: 'POST',
                                    headers: getHeaders(),
                                    body: JSON.stringify({
                                        userId: userId,
                                        productId: item.id
                                    })
                                });
                            } catch(e) {
                                console.error('Ошибка удаления из корзины:', e);
                            }
                        }
                    }
                    
                    const itemsText = items.map(i => `${i.productName} x${i.quantity}`).join(', ');
                    showToast(`Спасибо, ${name}! Заказ №${result.order_id || 'создан'} принят. Наш менеджер свяжется с вами.`);
                    closeOrderModal();
                    
                    if (typeof window.loadCart === 'function') {
                        await window.loadCart();
                    }
                    
                    if (window.location.pathname.includes('profile.html')) {
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    }
                } else {
                    const errorText = await response.text();
                    console.error('Ошибка сервера:', errorText);
                    try {
                        const error = JSON.parse(errorText);
                        showToast(`Ошибка: ${error.error || error.message || 'Попробуйте позже'}`);
                    } catch(e) {
                        showToast(`Ошибка: ${response.status} - ${response.statusText}`);
                    }
                }
            } catch(error) {
                console.error('Ошибка при отправке заказа:', error);
                showToast(`Произошла ошибка: ${error.message}`);
            }
        });
    }

    // делаем функции глобальными
    window.openOrderModal = openOrderModal;
    window.openOrderModalForCart = openOrderModalForCart;
    
    console.log('order-modal.js загружен');
} else {
    // Если модального окна нет, создаём заглушки
    window.openOrderModal = function(productId) {
        console.warn('Модальное окно заказа не найдено на этой странице');
        alert('Форма заказа доступна на странице каталога или в корзине');
    };
    window.openOrderModalForCart = function(items) {
        console.warn('Модальное окно заказа не найдено на этой странице');
        alert('Форма заказа доступна на странице каталога или в корзине');
    };
    console.log('order-modal.js загружен (режим заглушки)');
}