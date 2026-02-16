const productsContainer = document.getElementById('products');
const counter = document.getElementById('counter');
const cartItemsContainer = document.getElementById('cartItems');
const cartBadge = document.getElementById('cartBadge');
const cartTotal = document.getElementById('cartTotal');
const clearCartBtn = document.getElementById('clearCartBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const commentForm = document.getElementById('commentForm');
const commentList = document.getElementById('commentList');

const fallbackProducts = [
  {
    id: 101,
    name: 'Google Pixel 8',
    brand: 'Google',
    price: 699,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
    description: 'Cámara inteligente y Android puro para máxima fluidez.'
  }
];

function formatPrice(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(value);
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

function productCardTemplate(product) {
  return `
    <article class="col-sm-6 col-lg-4">
      <div class="card h-100 border-0 shadow-sm">
        <img src="${product.image}" class="card-img-top product-image" alt="${product.name}" />
        <div class="card-body d-flex flex-column">
          <span class="badge rounded-pill text-bg-light border mb-2 align-self-start">${product.brand}</span>
          <h3 class="h5">${product.name}</h3>
          <p class="text-secondary small flex-grow-1">${product.description}</p>
          <p class="fw-semibold fs-5 mb-1">${formatPrice(product.price)}</p>
          <p class="small text-secondary mb-3">Stock: ${product.stock}</p>
          <button class="btn btn-primary w-100" data-add-cart="${product.id}">Agregar al carrito</button>
        </div>
      </div>
    </article>`;
}

function renderProducts(products) {
  counter.textContent = `${products.length} productos`;
  productsContainer.innerHTML = products.map(productCardTemplate).join('');

  productsContainer.querySelectorAll('[data-add-cart]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await addToCart(Number(button.dataset.addCart));
        await loadCart();
      } catch (error) {
        alert(error.message);
      }
    });
  });
}

function cartItemTemplate(item) {
  return `
    <div class="cart-item mb-3 p-2 border rounded-3">
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div>
          <h3 class="h6 mb-1">${item.name}</h3>
          <p class="small text-secondary mb-1">${formatPrice(item.price)} c/u</p>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-outline-secondary" data-cart-decrease="${item.id}">-</button>
            <span>${item.quantity}</span>
            <button class="btn btn-sm btn-outline-secondary" data-cart-increase="${item.id}">+</button>
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
  const totalQuantity = cart.items.reduce((acc, item) => acc + item.quantity, 0);
  cartBadge.textContent = totalQuantity;
  cartTotal.textContent = formatPrice(cart.total);

  if (!cart.items.length) {
    cartItemsContainer.innerHTML = '<p class="text-secondary">Tu carrito está vacío.</p>';
    return;
  }

  cartItemsContainer.innerHTML = cart.items.map(cartItemTemplate).join('');
  bindCartActions();
}

async function loadProducts() {
  try {
    const products = await apiRequest('/api/products');
    renderProducts(products);
  } catch (_error) {
    renderProducts(fallbackProducts);
  }
}

async function loadCart() {
  const cart = await apiRequest('/api/cart');
  renderCart(cart);
}

async function addToCart(productId) {
  await apiRequest('/api/cart/items', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity: 1 })
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
});

checkoutBtn.addEventListener('click', async () => {
  const result = await apiRequest('/api/cart/checkout', { method: 'POST' });
  await loadCart();
  alert(`Compra confirmada. Número de orden: ${result.orderId}`);
});

commentForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(commentForm));

  const li = document.createElement('li');
  li.className = 'list-group-item px-0';
  li.innerHTML = `<strong>${data.name}:</strong> <span class="text-secondary">${data.message}</span>`;
  commentList.prepend(li);
  commentForm.reset();
});

Promise.all([loadProducts(), loadCart()]).catch((error) => {
  console.error(error);
});
