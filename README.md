# CELULEX - Ecommerce de celulares

Aplicación web hecha con **Node.js + Express**, **HTML5**, **Bootstrap 5**, JavaScript y CSS ligero.

## Características
- Landing profesional y responsive.
- Catálogo dinámico con filtros por marca, búsqueda y ordenamiento.
- Vista de detalle de producto en modal.
- Carrito funcional: agregar items, cambiar cantidad, eliminar, vaciar y ver total.
- Checkout para usuarios finales con datos de cliente y método de pago.
- Control de stock real al comprar.
- Historial de pedidos recientes por sesión de usuario.
- Panel de administración con login y CRUD de productos.

## Instalación
```bash
npm install
npm start
```

Abrir en el navegador: `http://localhost:3000`

## Acceso administrador (por defecto)
- Usuario: `admin`
- Contraseña: `celulex123`

Variables de entorno soportadas:
- `ADMIN_USER`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
