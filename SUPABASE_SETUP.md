# 🔐 Setup Supabase - Instrucciones Exactas

## ⚠️ PRIMERO: Invalida tus claves comprometidas

### Stripe
1. Ve a https://dashboard.stripe.com/apikeys
2. Encuentra tus claves `sk_live_...` y `pk_live_...`
3. Haz click en los 3 puntos → "Revoke this key"
4. Genera nuevas claves (aparecerán en la misma página)

### Supabase
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Izquierda → "Project Settings"
4. Tab "Database"
5. Click en "Reset Database Password"
6. Confirma la nueva contraseña (cópiala)

---

## ✅ Obtener la CONNECTION STRING correcta de Supabase

### Paso 1: Dashboard Supabase
Abre https://supabase.com/dashboard

### Paso 2: Selecciona tu proyecto
Click en el proyecto `trading-bot-db` (o el que creaste)

### Paso 3: Project Settings
- Lado izquierdo
- Baja hasta "Project Settings"
- Click en "Database"

### Paso 4: Connection String
- Busca la sección "Connection string"
- Hay un dropdown que dice "URI", "psql", "JDBC", etc.
- **Selecciona "URI"** (es el que necesitamos)

### Paso 5: Copiar URL
- Verás algo así:
```
postgresql://postgres:[PASSWORD]@db.rxfqlxpntzlkamrsooab.supabase.co:5432/postgres
```

- Copia TODO el texto

### Paso 6: Reemplazar PASSWORD
- En la URL hay `[PASSWORD]` - reemplazalo con tu nueva contraseña
- Debe quedar:
```
postgresql://postgres:TU_PASSWORD_AQUI@db.rxfqlxpntzlkamrsooab.supabase.co:5432/postgres
```

---

## 📝 Actualizar .env

Abre `backend/.env` y actualiza esta línea:

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@db.rxfqlxpntzlkamrsooab.supabase.co:5432/postgres"
```

⚠️ **IMPORTANTE:**
- Reemplaza `TU_PASSWORD` con tu password real
- NO uses `[PASSWORD]`, eso es solo un placeholder
- La URL debe ser accesible desde tu máquina

---

## 🔐 Obtener nuevas claves de Stripe

### Paso 1: Stripe Dashboard
Ve a https://dashboard.stripe.com/apikeys

### Paso 2: Seleccionar modo de TEST
- Asegúrate estar en **Test mode** (no Live)
- Verás el toggle arriba a la derecha

### Paso 3: Copiar claves
- **Publishable key (starts with `pk_test_`)** → Copia en STRIPE_PUBLISHABLE_KEY
- **Secret key (starts with `sk_test_`)** → Copia en STRIPE_SECRET_KEY

### Paso 4: Webhook Secret
- Lado izquierdo → "Webhooks"
- Click en el webhook que creaste
- Busca "Signing secret"
- Haz click "Reveal" 
- Copia el texto que comienza con `whsec_`
- Pega en STRIPE_WEBHOOK_SECRET

---

## ✅ Tu .env debe verse así (con valores reales)

```env
DATABASE_URL="postgresql://postgres:tu_password_aqui@db.rxfqlxpntzlkamrsooab.supabase.co:5432/postgres"

JWT_SECRET="un_string_largo_y_aleatorio_de_mas_de_32_caracteres"
JWT_EXPIRATION="7d"

STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxx"
STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxx"

FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
PORT=5000
```

---

## 🧪 Verificar que funciona

Una vez actualizado `.env`, ejecuta:

```bash
cd backend
npm run prisma:migrate
```

Si todo está bien, verás:
```
✔ Created migration file ./prisma/migrations/...
Database synced, 0 warnings.
```

¡Listo! 🚀
