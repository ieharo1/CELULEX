const loginForm = document.getElementById('loginForm');
const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');
const productForm = document.getElementById('productForm');
const adminProducts = document.getElementById('adminProducts');
const cancelEdit = document.getElementById('cancelEdit');
const logoutBtn = document.getElementById('logoutBtn');
const totalProducts = document.getElementById('totalProducts');
const totalStock = document.getElementById('totalStock');
const productCount = document.getElementById('productCount');

function formatPrice(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(value);
}

function getStockClass(stock) {
  if (stock <= 3) return 'low';
  if (stock <= 10) return 'medium';
  return 'high';
}

function getStockText(stock) {
  if (stock === 0) return 'Sin stock';
  if (stock <= 3) return `${stock} unidades`;
  return `${stock} unidades`;
}

function resetForm() {
  productForm.reset();
  productForm.id.value = '';
  cancelEdit.classList.add('d-none');
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast-container');
  if (existing) existing.remove();

  const colors = {
    success: '#16a34a',
    error: '#dc2626',
    info: '#2563eb'
  };

  const icons = {
    success: 'bi-check-circle-fill',
    error: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill'
  };

  const toast = document.createElement('div');
  toast.className = 'toast-container';
  toast.innerHTML = `
    <div class="toast show" role="alert" style="border-left: 4px solid ${colors[type]}">
      <div class="d-flex align-items-center gap-2">
        <i class="bi ${icons[type]}" style="color: ${colors[type]}"></i>
        ${message}
      </div>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message);
  }

  return response.json();
}

function renderTable(products) {
  adminProducts.innerHTML = products
    .map(
      (product) => `
      <tr>
        <td><span class="badge bg-light text-dark">#${product.id}</span></td>
        <td>
          <div class="d-flex align-items-center gap-3">
            <img src="${product.image}" alt="${product.name}" class="product-thumb" />
            <div class="product-info">
              <h6>${product.name}</h6>
              <span>${product.brand}</span>
            </div>
          </div>
        </td>
        <td><span class="price-tag">${formatPrice(product.price)}</span></td>
        <td><span class="stock-badge ${getStockClass(product.stock)}">${getStockText(product.stock)}</span></td>
        <td class="text-end">
          <button class="btn action-btn btn-warning" data-action="edit" data-id="${product.id}" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn action-btn btn-danger" data-action="delete" data-id="${product.id}" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`
    )
    .join('');

  adminProducts.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => handleActions(button.dataset.action, Number(button.dataset.id), products));
  });

  productCount.textContent = `${products.length} productos`;
}

function updateStats(products) {
  totalProducts.textContent = products.length;
  const stockTotal = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  totalStock.textContent = stockTotal;
}

async function loadProducts() {
  const products = await request('/api/products');
  renderTable(products);
  updateStats(products);
}

async function handleActions(action, id, products) {
  const selected = products.find((p) => p.id === id);

  if (action === 'edit' && selected) {
    productForm.id.value = selected.id;
    productForm.name.value = selected.name;
    productForm.brand.value = selected.brand;
    productForm.price.value = selected.price;
    productForm.stock.value = selected.stock;
    productForm.image.value = selected.image;
    productForm.description.value = selected.description;
    cancelEdit.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Editando producto: ' + selected.name, 'info');
    return;
  }

  if (action === 'delete') {
    const confirmDelete = window.confirm('¿Seguro que deseas eliminar este producto?');
    if (!confirmDelete) return;

    try {
      await request(`/api/products/${id}`, { method: 'DELETE' });
      showToast('Producto eliminado correctamente', 'success');
      await loadProducts();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
}

async function checkSession() {
  const data = await request('/api/admin/session');

  if (data.isAdmin) {
    loginSection.classList.add('d-none');
    adminSection.classList.remove('d-none');
    await loadProducts();
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(loginForm));

  try {
    await request('/api/admin/login', { method: 'POST', body: JSON.stringify(formData) });
    loginSection.classList.add('d-none');
    adminSection.classList.remove('d-none');
    await loadProducts();
    showToast('Bienvenido al panel de administración', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
});

productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(productForm));
  const id = formData.id;

  try {
    if (id) {
      await request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(formData) });
      showToast('Producto actualizado correctamente', 'success');
    } else {
      await request('/api/products', { method: 'POST', body: JSON.stringify(formData) });
      showToast('Producto agregado correctamente', 'success');
    }

    resetForm();
    await loadProducts();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

cancelEdit.addEventListener('click', () => {
  resetForm();
  showToast('Edición cancelada', 'info');
});

logoutBtn.addEventListener('click', async () => {
  await request('/api/admin/logout', { method: 'POST' });
  window.location.reload();
});

checkSession().catch((error) => {
  console.error(error);
});
