# E-commerce Backend API

Backend completo de e-commerce construido con **TypeScript + Express + Firebase Firestore + Algolia + MercadoPago + SendGrid**, siguiendo el patrón **MVC**.

## 📋 Colección Postman

> 🔗 **[Ver colección Postman completa](https://grisjaa-9628505.postman.co/workspace/Jorge-Ariel-ALTAMIRANO's-Worksp~37644488-eb2b-4e69-8e1b-cb39d3e3c387/collection/49147880-144aad03-9f47-4327-bc1b-d8853f9e325a?action=share&source=copy-link&creator=49147880)**

> 📦 También podés importar el archivo `E-commerce-API.postman_collection.json` incluido en el repo

> 🐙 **[Repositorio GitHub](https://github.com/JorgeAA78/e-comerce-be)**

---

## 🚀 Stack técnico

| Tecnología | Uso |
|---|---|
| TypeScript + Node.js | Runtime y tipado |
| Express 4 | Framework HTTP |
| Firebase Firestore | Base de datos |
| Algolia | Búsqueda de productos |
| MercadoPago SDK v2 | Procesamiento de pagos |
| SendGrid | Envío de emails |
| JWT | Autenticación passwordless |
| AVA + esbuild | Tests |

---

## 📁 Estructura del proyecto

```
E-commerce-Backend/
├── src/
│   ├── config/          # Firebase, Algolia, MercadoPago
│   ├── controllers/     # Lógica de negocio (MVC)
│   ├── middleware/      # Autenticación JWT
│   ├── routes/          # Definición de endpoints
│   ├── services/        # Email (SendGrid), MercadoPago
│   ├── seeds/           # Script para poblar datos
│   └── index.ts         # Entry point
├── test/
│   ├── auth.test.ts
│   └── products.test.ts
├── .env.template        # Variables de entorno (template)
└── package.json
```

---

## ⚙️ Instalación y configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.template .env
```

Completar el `.env` con tus credenciales:

```env
PORT=3000
JWT_SECRET=tu_secreto

# Firebase
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=tu@email.com

# Algolia
ALGOLIA_APP_ID=xxx
ALGOLIA_API_KEY=xxx      # Admin API Key
ALGOLIA_SEARCH_KEY=xxx   # Search-Only Key
ALGOLIA_INDEX_NAME=products

# MercadoPago (Access Token del vendedor de PRUEBA)
MP_ACCESS_TOKEN=TEST-xxx

# Admin
ADMIN_EMAIL=admin@tutienda.com
BASE_URL=http://localhost:3000
```

### 3. Seedear productos (Firestore + Algolia)

```bash
npm run seed
```

### 4. Correr en desarrollo

```bash
npm run dev
```

---

## 📡 Endpoints de la API

### 🔐 Autenticación

| Método | Ruta | Body | Auth | Descripción |
|--------|------|------|------|-------------|
| POST | `/auth` | `{"email":"..."}` | No | Envía código al email |
| POST | `/auth/token` | `{"email":"...","code":"123456"}` | No | Valida código → devuelve JWT |

### 👤 Usuario

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/me` | ✅ | Info del usuario autenticado |
| PATCH | `/me` | ✅ | Modifica nombre/teléfono/avatar |
| PATCH | `/me/address` | ✅ | Modifica dirección del usuario |

**Ejemplo PATCH /me/address:**
```json
{
  "street": "Av. Corrientes 1234",
  "city": "Buenos Aires",
  "state": "CABA",
  "zip": "1043"
}
```

### 🛍️ Productos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/search?q=remera&offset=0&limit=10` | Búsqueda con Algolia (filtra stock > 0) |
| GET | `/products/:id` | Detalle de un producto |

### 📦 Órdenes

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/order?productId={id}` | ✅ | Crea orden + genera link de pago MP |
| GET | `/me/orders` | ✅ | Lista todas mis órdenes |
| GET | `/order/:orderId` | ✅ | Detalle de una orden |

**Respuesta de POST /order:**
```json
{
  "orderId": "abc123",
  "initPoint": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
}
```

### 💳 Webhook MercadoPago

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/ipn/mercadopago` | Recibe confirmación de pago de MP |

---

## 🔄 Flujo de pago completo

```
1. Usuario hace POST /auth → recibe código por email
2. POST /auth/token → obtiene JWT
3. POST /order?productId=xxx → obtiene {orderId, initPoint}
4. Usuario abre initPoint en el navegador
5. Paga con usuario de prueba COMPRADOR de MercadoPago
6. MercadoPago envía POST /ipn/mercadopago → API confirma pago
7. GET /me/orders → orden aparece con status "paid"
8. Usuario y admin reciben emails de confirmación
```

### Usuarios de prueba MercadoPago

Para testear el flujo completo:
1. En [developers.mercadopago.com](https://developers.mercadopago.com) crear **dos usuarios de prueba**
2. El **vendedor** es el que tiene el `MP_ACCESS_TOKEN` en tu `.env`
3. El **comprador** es con el que vas a completar el checkout

---

## 🧪 Tests

```bash
# Correr tests con AVA + esbuild-node-loader
npm test
```

Los tests verifican:
- Validación de inputs (email, código)
- Protección de rutas con JWT
- Respuestas correctas del servidor
- Health check

---

## 📊 Modelo de datos (Firestore)

### `users`
```json
{
  "email": "user@example.com",
  "name": "Jorge",
  "phone": "+5491112345678",
  "address": { "street": "...", "city": "...", "zip": "..." },
  "createdAt": "Timestamp"
}
```

### `products`
```json
{
  "name": "Remera Oversize",
  "description": "...",
  "price": 15000,
  "stock": 50,
  "category": "ropa",
  "imageUrl": "https://..."
}
```

### `orders`
```json
{
  "userId": "...",
  "userEmail": "...",
  "productId": "...",
  "productName": "...",
  "price": 15000,
  "status": "pending | paid | failed",
  "mpPreferenceId": "...",
  "mpPaymentId": "...",
  "mpInitPoint": "https://...",
  "createdAt": "Timestamp"
}
```

---

## 🏗️ Diagrama de arquitectura

```
Cliente (Postman/Frontend)
        │
        ▼
   Express Router
        │
   ┌────┴────┐
   │Middleware│ (JWT Auth)
   └────┬────┘
        │
   Controller (MVC)
   ┌────┼────────────┐
   │    │            │
Firebase Algolia  MercadoPago
        │
     SendGrid
```
