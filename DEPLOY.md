# 🚀 Deploy a producción

Esta guía te lleva de localhost a internet en ~15 minutos.

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │  HTTPS  │   Backend   │  HTTPS  │  Supabase   │
│   (Vercel)  │────────▶│  (Railway)  │────────▶│ (ya activo) │
└─────────────┘         └─────────────┘         └─────────────┘
```

---

## 📋 Requisitos

- ✅ Cuenta GitHub (ya la tienes)
- ✅ Cuenta Vercel (ya la tienes)
- ⚠️ Cuenta Railway → Crear en https://railway.app/new (login con GitHub, $5/mes gratis)
- ✅ Supabase ya configurado

---

## 🔥 PASO 1 — Subir código a GitHub

### 1.1 Crear repo en GitHub
1. Ve a https://github.com/new
2. Repository name: `algotrade` (o el que prefieras)
3. **Private** (recomendado)
4. NO inicializar con README
5. Click "Create repository"

### 1.2 Hacer push
Abre PowerShell en `c:\Users\user\Downloads\App` y ejecuta:

```bash
git init
git add .
git commit -m "Initial commit - AlgoTrade app"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/algotrade.git
git push -u origin main
```

---

## 🚂 PASO 2 — Backend en Railway

### 2.1 Crear proyecto
1. Ve a https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Selecciona el repo `algotrade`
4. **IMPORTANTE**: En settings, configura:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 2.2 Configurar variables de entorno
En Railway → tu proyecto → tab "Variables" → agregar (copia los valores de tu `backend/.env` local):

```
DATABASE_URL = (tu URL de Supabase)
JWT_SECRET = (tu secret)
JWT_EXPIRATION = 7d
STRIPE_SECRET_KEY = (tu clave secreta de Stripe)
STRIPE_PUBLISHABLE_KEY = (tu clave pública de Stripe)
STRIPE_WEBHOOK_SECRET = whsec_dummy_for_now
NODE_ENV = production
PORT = 5000
```

⚠️ **FRONTEND_URL** la añades después (paso 3.3).
⚠️ **Las claves reales están en `backend/.env` (archivo local, NO subido a Git).**

### 2.3 Generar dominio público
1. En Railway → Settings → Networking → "Generate Domain"
2. Copia la URL generada (ej: `algotrade-backend-production.up.railway.app`)

### 2.4 Verificar que funciona
Abre en navegador: `https://TU-URL.railway.app/health`

Debe responder:
```json
{"status":"OK","timestamp":"..."}
```

---

## ▲ PASO 3 — Frontend en Vercel

### 3.1 Importar repo
1. Ve a https://vercel.com/new
2. Importa el repo `algotrade`
3. Configuración:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (raíz del repo)
   - **Build Command**: vacío (no hay build)
   - **Output Directory**: `./`
4. Click **"Deploy"**

### 3.2 Actualizar URL del backend
Después del primer deploy:

1. Edita el archivo `index.html`
2. Encuentra la línea:
   ```javascript
   const BACKEND_URL = '';
   ```
3. Cámbiala por:
   ```javascript
   const BACKEND_URL = 'https://TU-URL.railway.app';
   ```
4. Commit y push:
   ```bash
   git add index.html
   git commit -m "Conectar frontend con backend producción"
   git push
   ```
5. Vercel re-deploya automáticamente

### 3.3 Conectar Vercel con Railway (CORS)
1. Copia la URL de Vercel (ej: `algotrade-xyz.vercel.app`)
2. Ve a Railway → tu proyecto → Variables
3. Añade: `FRONTEND_URL = https://algotrade-xyz.vercel.app`
4. Railway re-deploya automáticamente

---

## ✅ Verificar que funciona

1. Abre `https://TU-URL.vercel.app`
2. Crea cuenta nueva
3. Crea un bot
4. Paga (con tarjeta test `4242 4242 4242 4242`)
5. Descarga el archivo .mq5

---

## 🔧 Variables de entorno necesarias

### Backend (Railway)
| Variable | Ejemplo |
|----------|---------|
| `DATABASE_URL` | postgresql://... (Supabase) |
| `JWT_SECRET` | string largo aleatorio |
| `STRIPE_SECRET_KEY` | sk_test_... o sk_live_... |
| `STRIPE_PUBLISHABLE_KEY` | pk_test_... o pk_live_... |
| `STRIPE_WEBHOOK_SECRET` | whsec_... (opcional) |
| `FRONTEND_URL` | https://tu-app.vercel.app |
| `NODE_ENV` | production |
| `PORT` | 5000 (Railway lo override) |

### Frontend (Vercel)
No hay variables. La URL del backend está en `index.html` (constante `BACKEND_URL`).

---

## 🧪 Modo TEST vs LIVE de Stripe

Por defecto está en TEST. Para empezar a cobrar dinero real:

1. Cambia las claves Stripe en Railway:
   - `STRIPE_SECRET_KEY` → `sk_live_...`
   - `STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
2. Configura webhook en https://dashboard.stripe.com/webhooks
   - URL: `https://TU-URL.railway.app/api/payments/webhook`
   - Eventos: `checkout.session.completed`
3. Copia el "Signing secret" → variable `STRIPE_WEBHOOK_SECRET`

---

## 📝 Custom Domain (opcional)

Si tienes un dominio (ej: `algotrade.app`):

1. **Vercel**: Settings → Domains → Add domain
2. **Railway**: Settings → Networking → Add custom domain
3. Configura DNS según instrucciones de cada plataforma

---

## 🐛 Troubleshooting

### "Application failed to respond"
Backend tarda en arrancar (~30s primera vez). Espera y refresca.

### CORS error en frontend
Verifica que `FRONTEND_URL` en Railway coincida con la URL de Vercel.

### Database connection error
Verifica `DATABASE_URL` en Railway. Supabase puede pausar la BD si está inactiva — reactívala desde el dashboard.

### Stripe checkout no abre
Verifica que `STRIPE_SECRET_KEY` esté configurada en Railway.

---

¡Listo! Tu app ahora está accesible globalmente. 🎉
