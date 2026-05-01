# Quick Start - Trading Bot App

## ⚡ Setup en 10 minutos

### Paso 1: Instalar PostgreSQL

**Windows:**
Descarga e instala desde: https://www.postgresql.org/download/windows/

Durante la instalación:
- Usuario: `postgres`
- Contraseña: `postgres`
- Puerto: `5432`

**Mac:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Paso 2: Crear la base de datos

```bash
# Conectarse a PostgreSQL
psql -U postgres

# En la terminal de psql:
CREATE DATABASE trading_bot_db;
\q
```

### Paso 3: Configurar Backend

```bash
cd backend

# Copiar variables de entorno
cp .env.example .env

# Editar .env y agregar:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trading_bot_db"
# JWT_SECRET="tu_secret_largo_y_seguro_aqui"
# STRIPE_SECRET_KEY="sk_test_..." (obtener de https://stripe.com)
```

### Paso 4: Instalar dependencias backend

```bash
npm install

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate
```

Si todo está bien, verás:
```
✓ Created migration file ./prisma/migrations/...
✓ Run prisma db push to apply migrations
```

### Paso 5: Iniciar servidor backend

```bash
npm run dev
```

Deberías ver:
```
✅ Server ejecutándose en http://localhost:5000
```

### Paso 6: Frontend

El frontend está listo en `index.html`. Abre en navegador:

```
file:///C:/Users/user/Downloads/App/index.html
```

## 🔗 Verificar Integración

### Test 1: Health Check
```bash
curl http://localhost:5000/health
```

Respuesta esperada:
```json
{"status":"OK","timestamp":"2024-01-15T..."}
```

### Test 2: Crear usuario
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'
```

Respuesta:
```json
{
  "message": "Usuario creado exitosamente",
  "user": {"id":"...", "email":"test@example.com", "name":"Test User"},
  "token": "eyJ..."
}
```

### Test 3: Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

Guardá el token de la respuesta.

### Test 4: Obtener perfil
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <tu_token_aqui>"
```

## 🎨 Próximos pasos

1. **Integrar Stripe:**
   - Crear cuenta en https://stripe.com
   - Obtener `STRIPE_SECRET_KEY` y `STRIPE_PUBLISHABLE_KEY`
   - Agregar a `.env`

2. **Agregar plantillas de bots:**
   - Acceder a Prisma Studio: `npm run prisma:studio`
   - Crear bots template manualmente
   - O usar script de seed (crear `seed.ts`)

3. **Conectar Frontend:**
   - El archivo `lib/api.jsx` ya está listo
   - Actualizar componentes para usar `api.login()`, `api.getBots()`, etc.

4. **Integración con brokers:**
   - Binance API
   - MetaTrader 5
   - Interactive Brokers
   - Etc.

## 🚨 Problemas Comunes

### Error: "database "trading_bot_db" does not exist"
```bash
createdb -U postgres trading_bot_db
```

### Error: "Cannot find module '@prisma/client'"
```bash
npm install @prisma/client prisma
npm run prisma:generate
```

### Error: "ECONNREFUSED" en Prisma migrate
Asegurate de que PostgreSQL está corriendo:
```bash
# Windows
pg_ctl -D "C:\Program Files\PostgreSQL\16\data" status

# Mac
brew services list | grep postgresql

# Linux
systemctl status postgresql
```

### Error: "JWT_SECRET not defined"
Revisar que `.env` existe y tiene `JWT_SECRET` configurado.

## 📚 Documentación

- Backend: `backend/README.md`
- Integración: `INTEGRATION_GUIDE.md`
- API: `backend/src/routes/*.ts`

## 💡 Tips

- Usa `npm run prisma:studio` para ver/editar datos en GUI
- Los logs del servidor muestran errores detallados
- En desarrollo, recomendamos usar VSCode + Rest Client extension para testear APIs
- Guarda el token en localStorage cuando logueas (ya hace `api.jsx`)

¡Listo para empezar! 🚀
