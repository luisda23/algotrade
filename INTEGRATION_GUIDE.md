# Trading Bot App - Guía de Integración Frontend-Backend

## 📋 Estructura del Proyecto

```
App/
├── index.html (Frontend React)
├── lib/ (Componentes React)
│   ├── screens/
│   │   ├── auth.jsx
│   │   ├── dashboard.jsx
│   │   ├── bot-detail.jsx
│   │   ├── marketplace.jsx
│   │   └── account.jsx
│   ├── app.jsx (App principal)
│   └── ...
└── backend/ (Node.js + Express + PostgreSQL)
    ├── src/
    │   ├── routes/ (APIs)
    │   │   ├── auth.ts
    │   │   ├── bots.ts
    │   │   ├── brokers.ts
    │   │   ├── marketplace.ts
    │   │   └── payments.ts
    │   ├── middleware/
    │   │   └── auth.ts
    │   └── server.ts
    ├── prisma/
    │   └── schema.prisma (Base de datos)
    └── package.json
```

## 🔗 Integración Frontend

### 1. Instalar cliente HTTP
En el frontend, necesitas agregar axios o fetch para comunicarte con el backend:

```bash
npm install axios
```

### 2. Crear un archivo de configuración de API

Crea `lib/api.jsx`:

```jsx
const API_BASE = 'http://localhost:5000/api';

const api = {
  // Auth
  signup: (email, password, name) =>
    fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    }).then(r => r.json()),

  login: (email, password) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(r => r.json()),

  // Bots
  getBots: () =>
    fetch(`${API_BASE}/bots`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    }).then(r => r.json()),

  createBot: (bot) =>
    fetch(`${API_BASE}/bots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(bot),
    }).then(r => r.json()),

  // Brokers
  connectBroker: (broker) =>
    fetch(`${API_BASE}/brokers/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(broker),
    }).then(r => r.json()),

  // Marketplace
  getTemplates: () =>
    fetch(`${API_BASE}/marketplace/templates`).then(r => r.json()),

  // Pagos
  startCheckout: (botTemplateId) =>
    fetch(`${API_BASE}/payments/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ botTemplateId }),
    }).then(r => r.json()),
};

export default api;
```

### 3. Conectar Auth con el backend

En `lib/screens/auth.jsx`, reemplaza el login/signup simulado:

```jsx
import api from '../api';

const handleLogin = async (email, password) => {
  const response = await api.login(email, password);
  if (response.token) {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setAppState({ ...appState, user: response.user });
    navigateTo('dashboard');
  }
};

const handleSignup = async (email, password, name, referralCode) => {
  const response = await api.signup(email, password, name, referralCode);
  if (response.token) {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setAppState({ ...appState, user: response.user });
    navigateTo('dashboard');
  }
};
```

### 4. Conectar Dashboard

En `lib/screens/dashboard.jsx`:

```jsx
const [bots, setBots] = React.useState([]);

React.useEffect(() => {
  api.getBots().then(setBots);
}, []);
```

### 5. Conectar Marketplace

En `lib/screens/marketplace.jsx`:

```jsx
const handleBuyBot = async (botTemplateId) => {
  const { sessionId } = await api.startCheckout(botTemplateId);
  // Redirigir a Stripe Checkout
  window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
};
```

## 🗄️ Base de Datos - Setup

### Requisitos
- PostgreSQL 14+

### Pasos

1. **Crear base de datos:**
```bash
createdb trading_bot_db
```

2. **Configurar .env:**
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/trading_bot_db"
JWT_SECRET="tu_secret_super_seguro_aqui"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
FRONTEND_URL="http://localhost:3000"
```

3. **Ejecutar migraciones:**
```bash
cd backend
npm run prisma:migrate
```

## 🚀 Iniciar Todo

### Terminal 1 - Backend
```bash
cd backend
npm install
npm run dev
```

### Terminal 2 - Frontend
```bash
# Si usas un servidor local (python -m http.server, etc)
```

## 🔐 Seguridad Importante

1. **Nunca guardes tokens en localStorage en producción** → Usar cookies HTTPOnly
2. **Encriptar API keys de brokers** en la base de datos
3. **Rate limiting** en endpoints de pago
4. **Validación de entrada** en todas las APIs
5. **HTTPS obligatorio** en producción

## 📝 Variables de Entorno Necesarias

```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/trading_bot_db

# JWT
JWT_SECRET=tu_secret_muy_seguro_y_largo
JWT_EXPIRATION=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend
FRONTEND_URL=http://localhost:3000

# Node
NODE_ENV=development
PORT=5000
```

## 🧪 Testing Endpoints

### Crear Usuario
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "Juan Pérez"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Obtener Bots (con token)
```bash
curl -X GET http://localhost:5000/api/bots \
  -H "Authorization: Bearer <tu_token>"
```

## ✅ Checklist de Integración

- [ ] Instalar dependencias backend
- [ ] Crear base de datos PostgreSQL
- [ ] Configurar .env
- [ ] Ejecutar migraciones
- [ ] Iniciar servidor backend
- [ ] Crear archivo api.jsx en frontend
- [ ] Conectar Login/Signup
- [ ] Conectar Dashboard para obtener bots
- [ ] Conectar Marketplace
- [ ] Integrar Stripe
- [ ] Testing end-to-end

## 🎯 Próximos Pasos

1. **Integración de brokers**: Conectar APIs de Binance, MetaTrader, etc.
2. **WebSockets**: Para actualización de datos en tiempo real
3. **Notificaciones**: Email, push, in-app
4. **Testing**: Unit tests y E2E tests
5. **Deployment**: Railway, Render, Heroku, etc.
