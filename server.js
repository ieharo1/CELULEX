const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'products.json');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'celulex123';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'celulex_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 4 }
  })
);

app.use(express.static(path.join(__dirname, 'public')));

async function readProducts() {
  const data = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(data);
}

async function writeProducts(products) {
  await fs.writeFile(DATA_FILE, JSON.stringify(products, null, 2));
}

function adminOnly(req, res, next) {
  if (!req.session.isAdmin) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  next();
}

function getCart(req) {
  if (!Array.isArray(req.session.cart)) {
    req.session.cart = [];
  }
  return req.session.cart;
}

async function buildCartSummary(req) {
  const products = await readProducts();
  const cart = getCart(req);

  const items = cart
    .map((entry) => {
      const product = products.find((item) => item.id === entry.productId);
      if (!product) return null;

      const quantity = Math.max(0, Number(entry.quantity) || 0);
      const subtotal = product.price * quantity;

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        subtotal
      };
    })
    .filter(Boolean)
    .filter((item) => item.quantity > 0);

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);
  return { items, total };
}

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/api/products', async (_req, res) => {
  try {
    const products = await readProducts();
    res.json(products);
  } catch (_error) {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

app.get('/api/cart', async (req, res) => {
  try {
    const cart = await buildCartSummary(req);
    res.json(cart);
  } catch (_error) {
    res.status(500).json({ message: 'Error al obtener carrito' });
  }
});

app.post('/api/cart/items', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const products = await readProducts();
    const product = products.find((item) => item.id === Number(productId));

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const qty = Number(quantity) || 1;
    const cart = getCart(req);
    const index = cart.findIndex((item) => item.productId === Number(productId));

    if (index >= 0) {
      cart[index].quantity += qty;
    } else {
      cart.push({ productId: Number(productId), quantity: qty });
    }

    const summary = await buildCartSummary(req);
    res.status(201).json(summary);
  } catch (_error) {
    res.status(500).json({ message: 'No se pudo agregar al carrito' });
  }
});

app.patch('/api/cart/items', async (req, res) => {
  try {
    const { productId, change } = req.body;
    const cart = getCart(req);
    const index = cart.findIndex((item) => item.productId === Number(productId));

    if (index === -1) {
      return res.status(404).json({ message: 'Producto no está en el carrito' });
    }

    cart[index].quantity += Number(change) || 0;

    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }

    const summary = await buildCartSummary(req);
    res.json(summary);
  } catch (_error) {
    res.status(500).json({ message: 'No se pudo actualizar el carrito' });
  }
});

app.delete('/api/cart/items/:id', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const cart = getCart(req);
    req.session.cart = cart.filter((item) => item.productId !== productId);

    const summary = await buildCartSummary(req);
    res.json(summary);
  } catch (_error) {
    res.status(500).json({ message: 'No se pudo quitar el producto' });
  }
});

app.delete('/api/cart', (req, res) => {
  req.session.cart = [];
  res.json({ items: [], total: 0 });
});

app.post('/api/cart/checkout', async (req, res) => {
  try {
    const summary = await buildCartSummary(req);

    if (!summary.items.length) {
      return res.status(400).json({ message: 'Tu carrito está vacío' });
    }

    req.session.cart = [];

    return res.json({
      message: 'Compra realizada con éxito',
      orderId: `CLX-${Date.now()}`,
      total: summary.total
    });
  } catch (_error) {
    return res.status(500).json({ message: 'No se pudo procesar la compra' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ message: 'Sesión iniciada correctamente' });
  }

  return res.status(401).json({ message: 'Credenciales inválidas' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Sesión cerrada' });
  });
});

app.get('/api/admin/session', (req, res) => {
  res.json({ isAdmin: Boolean(req.session.isAdmin) });
});

app.post('/api/products', adminOnly, async (req, res) => {
  try {
    const products = await readProducts();
    const nextId = products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1;

    const newProduct = {
      id: nextId,
      name: req.body.name,
      brand: req.body.brand,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
      image: req.body.image,
      description: req.body.description
    };

    products.push(newProduct);
    await writeProducts(products);

    res.status(201).json(newProduct);
  } catch (_error) {
    res.status(500).json({ message: 'No se pudo crear el producto' });
  }
});

app.put('/api/products/:id', adminOnly, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const products = await readProducts();
    const index = products.findIndex((p) => p.id === productId);

    if (index === -1) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    products[index] = {
      ...products[index],
      name: req.body.name,
      brand: req.body.brand,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
      image: req.body.image,
      description: req.body.description
    };

    await writeProducts(products);
    res.json(products[index]);
  } catch (_error) {
    res.status(500).json({ message: 'No se pudo actualizar el producto' });
  }
});

app.delete('/api/products/:id', adminOnly, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const products = await readProducts();
    const filtered = products.filter((p) => p.id !== productId);

    if (filtered.length === products.length) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    await writeProducts(filtered);
    res.json({ message: 'Producto eliminado' });
  } catch (_error) {
    res.status(500).json({ message: 'No se pudo eliminar el producto' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
