// index.js - исправленная версия (без кнопок в корзину и заказать)

async function loadPopularProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/flowers/`);
        if (response.ok) {
            const allProducts = await response.json();
            // Фильтруем товары, где is_popular = true
            const popularProducts = allProducts.filter(product => product.is_popular === true).slice(0, 3);
            displayPopularProducts(popularProducts);
        } else {
            console.error('Ошибка загрузки товаров:', response.status);
            displayPopularProducts([]);
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        displayPopularProducts([]);
    }
}

function displayPopularProducts(products) {
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) return;
    
    if (!products.length) {
        productGrid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">Популярные товары не найдены</p>';
        return;
    }
    
    productGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        const hasOldPrice = product.old_price ? `<span class="old-price">${product.old_price.toLocaleString()} ₽</span>` : '';
        const rating = product.rating || 5;
        const reviews = product.reviews || 0;
        
        let badges = '';
        if (product.is_popular) badges += '<span class="product-badge">Хит продаж</span>';
        if (product.is_new) badges += '<span class="product-badge new">Новинка</span>';
        
        const imageUrl = product.image || 'https://i.pinimg.com/736x/97/78/33/9778339cf8a1e1e1851e6b6ed4ce81c6.jpg';
        
        productCard.innerHTML = `
            <div class="product-img" style="background-image: url('${imageUrl}');">
                ${badges}
            </div>
            <div class="product-info">
                <h3>${escapeHTML(product.name)}</h3>
                <p>${escapeHTML(product.description)}</p>
                <div class="product-rating">
                    ${'<i class="fas fa-star"></i>'.repeat(Math.floor(rating))}
                    ${rating % 1 ? '<i class="fas fa-star-half-alt"></i>' : ''}
                    ${'<i class="far fa-star"></i>'.repeat(5 - Math.ceil(rating))}
                    <span>(${reviews})</span>
                </div>
                <div class="product-price">
                    <span class="current-price">${product.price.toLocaleString()} ₽</span>
                    ${hasOldPrice}
                </div>
            </div>
        `;
        productGrid.appendChild(productCard);
    });
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

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    loadPopularProducts();
});