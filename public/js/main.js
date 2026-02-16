const productsContainer = document.getElementById('products');
const counter = document.getElementById('counter');
const cartBtn = document.getElementById('cart-btn');
const cartModal = document.getElementById('cart-modal');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartCount = document.getElementById('cart-count');
const closeCart = document.getElementById('close-cart');
const clearCartBtn = document.getElementById('clear-cart');
const checkoutBtn = document.getElementById('checkout-btn');

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function formatPrice(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(value);
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCartItems();
}

function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
}

function addToCart(product) {
  addToCartProduct(product.id, product.name, product.brand, product.price, product.stock, product.image, product.description);
}

function addToCartProduct(id, name, brand, price, stock, image, description) {
  const existingItem = cart.find((item) => item.id === id);
  if (existingItem) {
    if (existingItem.quantity < stock) {
      existingItem.quantity++;
    } else {
      showToast('Stock máximo alcanzado', 'error');
      return;
    }
  } else {
    cart.push({ id, name, brand, price, stock, image, description, quantity: 1 });
  }
  saveCart();
  showToast(`${name} agregado al carrito`, 'success');
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
}

function updateQuantity(productId, change) {
  const item = cart.find((item) => item.id === productId);
  if (item) {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0 && newQuantity <= item.stock) {
      item.quantity = newQuantity;
      saveCart();
    } else if (newQuantity <= 0) {
      removeFromCart(productId);
    }
  }
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function renderCartItems() {
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-cart-x fs-1 text-muted mb-3 d-block"></i>
        <p class="text-muted mb-0">El carrito está vacío</p>
        <button class="btn btn-link" onclick="closeCartModal(); document.querySelector('#celulares').scrollIntoView({behavior: 'smooth'})">Ver productos</button>
      </div>
    `;
    cartTotal.textContent = formatPrice(0);
    return;
  }

  cartItemsContainer.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
      <div class="cart-item-details">
        <h6 class="mb-1">${item.name}</h6>
        <p class="text-muted small mb-2">${item.brand}</p>
        <div class="d-flex align-items-center justify-content-between">
          <div class="quantity-controls">
            <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${item.id}, -1)">-</button>
            <span class="mx-2 fw-semibold">${item.quantity}</span>
            <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${item.id}, 1)">+</button>
          </div>
          <span class="fw-bold text-primary">${formatPrice(item.price * item.quantity)}</span>
        </div>
      </div>
      <button class="btn btn-sm text-muted remove-btn" onclick="removeFromCart(${item.id})">
        <i class="bi bi-trash"></i>
      </button>
    </div>
  `
    )
    .join('');

  cartTotal.textContent = formatPrice(getCartTotal());
}

function openCart() {
  renderCartItems();
  cartModal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeCartModal() {
  cartModal.classList.remove('show');
  document.body.style.overflow = '';
}

function clearCart() {
  cart = [];
  saveCart();
  showToast('Carrito vaciado', 'info');
}

function checkout() {
  if (cart.length === 0) {
    showToast('El carrito está vacío', 'error');
    return;
  }
  const total = getCartTotal();
  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const confirmMsg = `¿Confirmar compra?\n\nTotal: ${formatPrice(total)}\nProductos: ${itemsCount}\n\n¡Gracias por tu preferencia!`;
  
  if (confirm(confirmMsg)) {
    showToast('¡Compra realizada con éxito!', 'success');
    clearCart();
    closeCartModal();
  }
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast-container');
  if (existing) existing.remove();

  const icons = {
    success: 'bi-check-circle-fill',
    error: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill'
  };

  const colors = {
    success: 'text-success',
    error: 'text-danger',
    info: 'text-primary'
  };

  const toast = document.createElement('div');
  toast.className = 'toast-container';
  toast.innerHTML = `
    <div class="toast show" role="alert">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi ${icons[type]} ${colors[type]}"></i>
        ${message}
      </div>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function renderProducts(products) {
  counter.textContent = `${products.length} productos`;

  productsContainer.innerHTML = products
    .map(
      (product) => `
      <div class="col-md-6 col-lg-4">
        <div class="product-card-modern">
          ${product.stock <= 3 ? `<div class="product-badge bg-danger">¡Últimas!</div>` : ''}
          <div class="product-img-wrapper">
            <img src="${product.image}" alt="${product.name}" />
            <div class="product-actions">
              <button class="btn btn-light" title="Ver detalles"><i class="bi bi-eye"></i></button>
              <button class="btn btn-light" title="Agregar a favoritos"><i class="bi bi-heart"></i></button>
            </div>
          </div>
          <div class="product-info">
            <span class="product-brand">${product.brand}</span>
            <h5 class="product-name">${product.name}</h5>
            <p class="product-desc">${product.description}</p>
            <div class="product-footer">
              <div class="product-price">${formatPrice(product.price)}</div>
              <div class="product-stock small ${product.stock <= 3 ? 'text-danger' : 'text-muted'}">
                <i class="bi bi-box-seam me-1"></i>${product.stock} disponibles
              </div>
            </div>
            <button class="btn btn-primary w-100 mt-3" onclick='addToCart(${JSON.stringify(product)})'>
              <i class="bi bi-cart-plus me-2"></i>Agregar al Carrito
            </button>
          </div>
        </div>
      </div>`
    )
    .join('');
}

async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    const products = await response.json();
    renderProducts(products);
  } catch (error) {
    productsContainer.innerHTML = '<p class="text-danger text-center">No se pudieron cargar los productos.</p>';
  }
}

cartBtn?.addEventListener('click', openCart);
closeCart?.addEventListener('click', closeCartModal);
clearCartBtn?.addEventListener('click', clearCart);
checkoutBtn?.addEventListener('click', checkout);

cartModal?.addEventListener('click', (e) => {
  if (e.target === cartModal) closeCartModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCartModal();
});

document.querySelectorAll('a.nav-link').forEach(link => {
  link.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

window.addToCartProduct = addToCartProduct;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.closeCartModal = closeCartModal;

updateCartCount();
loadProducts();
