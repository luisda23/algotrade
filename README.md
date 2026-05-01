# Trading Bot App - Guía General

Plataforma completa para crear, comprar y sincronizar bots de trading con brokers. Incluye:
- 🔐 Sistema de autenticación seguro
- 💳 Pagos con Stripe
- 📊 Dashboard de bots
- 🤖 Marketplace de plantillas
- 🔌 Integración con brokers

## 📁 Estructura

```
.
├── index.html                  # Frontend React (UI principal)
├── lib/
│   ├── screens/               # Pantallas principales
│   │   ├── auth.jsx           # Login / Signup
│   │   ├── dashboard.jsx      # Dashboard de bots
│   │   ├── marketplace.jsx    # Marketplace
│   │   ├── bot-detail.jsx     # Detalle del bot
│   │   └── account.jsx        # Perfil del usuario
│   ├── api.jsx                # Cliente HTTP para backend
│   └── ...
├── backend/                   # Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── routes/            # APIs REST
│   │   ├── middleware/        # Autenticación JWT
│   │   ├── server.ts          # Server principal
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma      # Esquema base de datos
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── QUICKSTART.md              # Guía rápida de setup
├── INTEGRATION_GUIDE.md       # Guía de integración
└── README.md                  # Este archivo
```

## 🚀 Quick Start (5 minutos)

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run dev
```

Deberías ver: `✅ Server ejecutándose en http://localhost:5000`

### 2. Frontend

Abre `index.html` en tu navegador o sirve con:

```bash
python -m http.server 3000
# Luego abre http://localhost:3000
```

### 3. Testing

Crea un usuario:
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test User"}'
```

## 📋 Requisitos Previos

- **Node.js** 18+
- **PostgreSQL** 14+ (instala desde https://www.postgresql.org)
- **npm** o **yarn**
- **Stripe account** (opcional, para pagos)

## 🔗 APIs Principales

### Autenticación
```
POST   /api/auth/signup        Create user
POST   /api/auth/login         Login
GET    /api/auth/me            Get current user
```

### Bots
```
GET    /api/bots               List user bots
POST   /api/bots               Create bot
GET    /api/bots/:id           Get bot details
PUT    /api/bots/:id           Update bot
DELETE /api/bots/:id           Delete bot
```

### Brokers
```
POST   /api/brokers/connect    Connect broker
GET    /api/brokers            List connections
DELETE /api/brokers/:id        Disconnect
```

### Marketplace
```
GET    /api/marketplace/templates       List templates
GET    /api/marketplace/templates/:id   Get template
POST   /api/marketplace/buy             Buy bot
```

### Payments
```
POST   /api/payments/checkout   Create Stripe session
POST   /api/payments/webhook    Stripe webhook
```

## 🗄️ Base de Datos

Esquema automático con **Prisma**:

```prisma
- User (id, email, password, name)
  - Bots (id, name, strategy, status)
    - BrokerConnection (id, brokerName, apiKey)
    - Trade (id, symbol, type, price, profit)
- BotTemplate (id, name, strategy, price)
- Subscription (id, botTemplateId, status)
```

Ver y editar datos:
```bash
npm run prisma:studio
```

## 🔐 Seguridad

✅ Contraseñas hasheadas (bcryptjs)
✅ JWT para autenticación
⚠️ TODO: Encriptar API keys de brokers
⚠️ TODO: HTTPS en producción
⚠️ TODO: Rate limiting

## 📖 Documentación

- **[QUICKSTART.md](./QUICKSTART.md)** - Setup paso a paso
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Integración frontend-backend
- **[backend/README.md](./backend/README.md)** - Documentación del backend

## 🛠️ Próximos Pasos

1. ✅ Setup base (hecho)
2. ✅ APIs básicas (hecho)
3. 📝 Integración de brokers (Binance, MetaTrader, etc.)
4. 🔔 Sistema de notificaciones
5. 📊 Dashboard de estadísticas real-time
6. 🧪 Testing automatizado
7. 🚀 Deployment (Railway, Vercel, Heroku)

## 💡 Consejos

- Usa `npm run prisma:studio` para debugging de datos
- Logs detallados en console del backend
- Guarda el JWT en localStorage (ya lo hace `api.jsx`)
- En producción, usa cookies HTTPOnly en lugar de localStorage

## 📞 Support

Para problemas comunes, revisar:
- [QUICKSTART.md - Problemas Comunes](./QUICKSTART.md#-problemas-comunes)
- Logs del servidor: `npm run dev`
- [Prisma Error Messages](https://www.prisma.io/docs/reference/error-reference)

---

**Versión:** 1.0.0  
**Última actualización:** 2024-01-15  
**Estado:** ✅ Backend funcional · 🟡 Frontend en desarrollo
