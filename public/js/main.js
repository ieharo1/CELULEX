const productsContainer = document.getElementById('products');
const counter = document.getElementById('counter');
const brandFilter = document.getElementById('brandFilter');
const searchInput = document.getElementById('searchInput');
const sortFilter = document.getElementById('sortFilter');
const clearFilters = document.getElementById('clearFilters');

const cartItemsContainer = document.getElementById('cartItems');
const cartBadge = document.getElementById('cartBadge');
const cartTotal = document.getElementById('cartTotal');
const clearCartBtn = document.getElementById('clearCartBtn');
const checkoutOpenBtn = document.getElementById('checkoutOpenBtn');
const shippingProgress = document.getElementById('shippingProgress');

const checkoutForm = document.getElementById('checkoutForm');
const ordersList = document.getElementById('ordersList');
const productModalContent = document.getElementById('productModalContent');

const toastElement = document.getElementById('mainToast');
const toastBody = document.getElementById('mainToastBody');
const toast = new bootstrap.Toast(toastElement);
const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
const productModal = new bootstrap.Modal(document.getElementById('productModal'));

let allProducts = [];

function formatPrice(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(value);
}

function notify(message) {
  toastBody.textContent = message;
  toast.show();
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Error en petición' }));
    throw new Error(payload.message);
  }

  return response.json();
}

function getFilteredProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const brand = brandFilter.value;
  const sort = sortFilter.value;

  let products = [...allProducts].filter((p) => {
    const matchesBrand = brand ? p.brand === brand : true;
    const matchesQuery = `${p.name} ${p.brand}`.toLowerCase().includes(query);
    return matchesBrand && matchesQuery;
  });

  if (sort === 'price_asc') products.sort((a, b) => a.price - b.price);
  if (sort === 'price_desc') products.sort((a, b) => b.price - a.price);
  if (sort === 'stock_desc') products.sort((a, b) => b.stock - a.stock);

  return products;
}

function productCardTemplate(product) {
  return `
    <article class="col-sm-6 col-lg-4">
      <div class="card h-100 border-0 shadow-sm product-card">
        <img src="${product.image}" class="card-img-top product-image" alt="${product.name}" />
        <div class="card-body d-flex flex-column">
          <span class="badge rounded-pill text-bg-light border mb-2 align-self-start">${product.brand}</span>
          <h3 class="h5">${product.name}</h3>
          <p class="text-secondary small flex-grow-1">${product.description}</p>
          <p class="fw-semibold fs-5 mb-1">${formatPrice(product.price)}</p>
          <p class="small text-secondary mb-3">Stock: ${product.stock}</p>
          <div class="d-flex gap-2 mt-auto">
            <button class="btn btn-outline-dark w-50" data-open-product="${product.id}">Detalle</button>
            <button class="btn btn-primary w-50" data-add-cart="${product.id}">Agregar</button>
          </div>
        </div>
      </div>
    </article>`;
}

function renderProducts() {
  const products = getFilteredProducts();
  counter.textContent = `${products.length} productos`;
  productsContainer.innerHTML = products.map(productCardTemplate).join('');

  productsContainer.querySelectorAll('[data-add-cart]').forEach((button) => {
    button.addEventListener('click', async () => {
      const product = allProducts.find((p) => p.id === Number(button.dataset.addCart));
      if (!product || product.stock < 1) return notify('Producto sin stock disponible');
      await addToCart(product.id, 1);
      await loadCart();
      notify(`${product.name} agregado al carrito`);
    });
  });

  productsContainer.querySelectorAll('[data-open-product]').forEach((button) => {
    button.addEventListener('click', () => {
      const product = allProducts.find((p) => p.id === Number(button.dataset.openProduct));
      if (!product) return;

      productModalContent.innerHTML = `
        <div class="modal-header">
          <h2 class="h5 mb-0">${product.name}</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="row g-3 align-items-center">
            <div class="col-md-5"><img src="${product.image}" alt="${product.name}" class="img-fluid rounded-3" /></div>
            <div class="col-md-7">
              <span class="badge text-bg-light border mb-2">${product.brand}</span>
              <p class="text-secondary">${product.description}</p>
              <p class="mb-2"><strong>Precio:</strong> ${formatPrice(product.price)}</p>
              <p class="mb-3"><strong>Stock:</strong> ${product.stock}</p>
              <div class="d-flex gap-2 align-items-center">
                <input type="number" id="detailQuantity" min="1" max="${Math.max(1, product.stock)}" value="1" class="form-control form-control-sm" style="width: 90px" />
                <button class="btn btn-primary" id="detailAddBtn">Agregar al carrito</button>
              </div>
            </div>
          </div>
        </div>`;

      productModal.show();

      document.getElementById('detailAddBtn').addEventListener('click', async () => {
        const quantity = Number(document.getElementById('detailQuantity').value) || 1;
        await addToCart(product.id, quantity);
        await loadCart();
        productModal.hide();
        notify('Producto agregado desde detalle');
      });
    });
  });
}

function cartItemTemplate(item) {
  return `
    <div class="cart-item mb-3 p-2 border rounded-3">
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div class="d-flex gap-2">
          <img src="${item.image}" alt="${item.name}" class="cart-thumb rounded-2" />
          <div>
            <h3 class="h6 mb-1">${item.name}</h3>
            <p class="small text-secondary mb-1">${formatPrice(item.price)} c/u</p>
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-sm btn-outline-secondary" data-cart-decrease="${item.id}">-</button>
              <span>${item.quantity}</span>
              <button class="btn btn-sm btn-outline-secondary" data-cart-increase="${item.id}">+</button>
            </div>
          </div>
        </div>
        <div class="text-end">
          <div class="fw-semibold mb-2">${formatPrice(item.subtotal)}</div>
          <button class="btn btn-sm btn-outline-danger" data-cart-remove="${item.id}">Quitar</button>
        </div>
      </div>
    </div>`;
}

function bindCartActions() {
  cartItemsContainer.querySelectorAll('[data-cart-increase]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await updateCartItem(Number(btn.dataset.cartIncrease), 1);
      await loadCart();
    });
  });

  cartItemsContainer.querySelectorAll('[data-cart-decrease]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await updateCartItem(Number(btn.dataset.cartDecrease), -1);
      await loadCart();
    });
  });

  cartItemsContainer.querySelectorAll('[data-cart-remove]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await removeCartItem(Number(btn.dataset.cartRemove));
      await loadCart();
    });
  });
}

function renderCart(cart) {
  cartBadge.textContent = cart.totalQuantity;
  cartTotal.textContent = formatPrice(cart.total);

  const percent = Math.min(100, Math.round((cart.total / 1200) * 100));
  shippingProgress.style.width = `${percent}%`;

  if (!cart.items.length) {
    cartItemsContainer.innerHTML = '<p class="text-secondary">Tu carrito está vacío.</p>';
    return;
  }

  cartItemsContainer.innerHTML = cart.items.map(cartItemTemplate).join('');
  bindCartActions();
}

function renderOrders(orders) {
  if (!orders.length) {
    ordersList.innerHTML = '<p class="small text-secondary mb-0">Aún no tienes pedidos en esta sesión.</p>';
    return;
  }

  ordersList.innerHTML = orders
    .map(
      (order) => `
      <article class="order-item border rounded-3 p-3">
        <div class="d-flex flex-wrap justify-content-between gap-2">
          <strong>${order.id}</strong>
          <span class="badge text-bg-success">${order.status}</span>
        </div>
        <div class="small text-secondary">${new Date(order.createdAt).toLocaleString('es-ES')}</div>
        <div class="small">Items: ${order.totalQuantity} · Total: ${formatPrice(order.total)}</div>
      </article>`
    )
    .join('');
}

async function loadProducts() {
  allProducts = await apiRequest('/api/products');
  const uniqueBrands = [...new Set(allProducts.map((item) => item.brand))].sort();
  brandFilter.innerHTML = ['<option value="">Todas las marcas</option>', ...uniqueBrands.map((brand) => `<option value="${brand}">${brand}</option>`)].join('');
  renderProducts();
}

async function loadCart() {
  const cart = await apiRequest('/api/cart');
  renderCart(cart);
}

async function loadOrders() {
  const orders = await apiRequest('/api/orders/my');
  renderOrders(orders);
}

async function addToCart(productId, quantity = 1) {
  await apiRequest('/api/cart/items', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity })
  });
}

async function updateCartItem(productId, change) {
  await apiRequest('/api/cart/items', {
    method: 'PATCH',
    body: JSON.stringify({ productId, change })
  });
}

async function removeCartItem(productId) {
  await apiRequest(`/api/cart/items/${productId}`, { method: 'DELETE' });
}

clearCartBtn.addEventListener('click', async () => {
  await apiRequest('/api/cart', { method: 'DELETE' });
  await loadCart();
  notify('Carrito vaciado');
});

checkoutOpenBtn.addEventListener('click', () => checkoutModal.show());

checkoutForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const customer = Object.fromEntries(new FormData(checkoutForm));

  try {
    const result = await apiRequest('/api/cart/checkout', {
      method: 'POST',
      body: JSON.stringify({ customer })
    });

    checkoutForm.reset();
    checkoutModal.hide();
    await Promise.all([loadCart(), loadOrders(), loadProducts()]);
    notify(`Compra confirmada: ${result.orderId}`);
  } catch (error) {
    notify(error.message);
  }
});

[searchInput, brandFilter, sortFilter].forEach((input) => {
  input.addEventListener('input', renderProducts);
  input.addEventListener('change', renderProducts);
});

clearFilters.addEventListener('click', () => {
  searchInput.value = '';
  brandFilter.value = '';
  sortFilter.value = 'popular';
  renderProducts();
});

Promise.all([loadProducts(), loadCart(), loadOrders()]).catch((error) => {
  notify(error.message);
});
