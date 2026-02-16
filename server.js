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
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos' });
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ message: 'No se pudo eliminar el producto' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
