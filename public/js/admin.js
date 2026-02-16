const loginForm = document.getElementById('loginForm');
const authCard = document.getElementById('authCard');
const adminSection = document.getElementById('adminSection');
const productForm = document.getElementById('productForm');
const adminProducts = document.getElementById('adminProducts');
const cancelEdit = document.getElementById('cancelEdit');
const logoutBtn = document.getElementById('logoutBtn');

function resetForm() {
  productForm.reset();
  productForm.id.value = '';
  cancelEdit.classList.add('d-none');
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
        <td>${product.id}</td>
        <td>
          <div class="fw-semibold">${product.name}</div>
          <small class="text-secondary">${product.brand}</small>
        </td>
        <td>$${product.price}</td>
        <td>${product.stock}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-2" data-action="edit" data-id="${product.id}">Editar</button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${product.id}">Eliminar</button>
        </td>
      </tr>`
    )
    .join('');

  adminProducts.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => handleActions(button.dataset.action, Number(button.dataset.id), products));
  });
}

async function loadProducts() {
  const products = await request('/api/products');
  renderTable(products);
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
    return;
  }

  if (action === 'delete') {
    const confirmDelete = window.confirm('¿Seguro que deseas eliminar este producto?');
    if (!confirmDelete) return;

    await request(`/api/products/${id}`, { method: 'DELETE' });
    await loadProducts();
  }
}

async function checkSession() {
  const data = await request('/api/admin/session');

  if (data.isAdmin) {
    authCard.classList.add('d-none');
    adminSection.classList.remove('d-none');
    await loadProducts();
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(loginForm));

  try {
    await request('/api/admin/login', { method: 'POST', body: JSON.stringify(formData) });
    authCard.classList.add('d-none');
    adminSection.classList.remove('d-none');
    await loadProducts();
  } catch (error) {
    alert(error.message);
  }
});

productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(productForm));
  const id = formData.id;

  try {
    if (id) {
      await request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(formData) });
    } else {
      await request('/api/products', { method: 'POST', body: JSON.stringify(formData) });
    }

    resetForm();
    await loadProducts();
  } catch (error) {
    alert(error.message);
  }
});

cancelEdit.addEventListener('click', resetForm);

logoutBtn.addEventListener('click', async () => {
  await request('/api/admin/logout', { method: 'POST' });
  window.location.reload();
});

checkSession().catch((error) => {
  console.error(error);
});
