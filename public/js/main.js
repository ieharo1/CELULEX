const productsContainer = document.getElementById('products');
const counter = document.getElementById('counter');

function formatPrice(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(value);
}

function renderProducts(products) {
  counter.textContent = `${products.length} productos`;

  productsContainer.innerHTML = products
    .map(
      (product) => `
      <article class="col-sm-6 col-lg-4">
        <div class="card h-100 border-0 shadow-sm">
          <img src="${product.image}" class="card-img-top product-image" alt="${product.name}" />
          <div class="card-body d-flex flex-column">
            <span class="badge rounded-pill text-bg-light border mb-2 align-self-start">${product.brand}</span>
            <h3 class="h5">${product.name}</h3>
            <p class="text-secondary small flex-grow-1">${product.description}</p>
            <p class="fw-semibold fs-5 mb-3">${formatPrice(product.price)}</p>
            <button class="btn btn-primary w-100">Comprar</button>
          </div>
        </div>
      </article>`
    )
    .join('');
}

async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    const products = await response.json();
    renderProducts(products);
  } catch (error) {
    productsContainer.innerHTML = '<p class="text-danger">No se pudieron cargar los productos.</p>';
  }
}

loadProducts();
