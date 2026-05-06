// Sentry instrumentation. Tiene que importarse PRIMERO en server.ts (antes
// que cualquier otro módulo de la app o de Express) para que el auto-
// instrumentation del SDK v8 enganche correctamente Express, Prisma y
// http.
//
// Si SENTRY_DSN no está configurado (dev local sin cuenta), Sentry no se
// inicializa y los métodos como Sentry.captureException son no-ops.

import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    release: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
    // Sample 10% de transacciones (performance monitoring) — suficiente
    // para detectar regresiones sin saturar la cuota free.
    tracesSampleRate: 0.1,
    // No enviamos datos personales por defecto: PII solo si ip_address /
    // username pasan por captureRequestSession. La res.json() con campos
    // como email queda anonimizada por el sanitizer del SDK.
    sendDefaultPii: false,
    // Ignorar errores ya capturados como respuestas válidas (4xx esperados)
    ignoreErrors: [
      // Express 404
      /NotFoundError/,
      // Token-related (esperados, ya respondidos al cliente)
      /JsonWebTokenError/,
      /TokenExpiredError/,
    ],
  });
  console.log('✅ Sentry inicializado · env=' + (process.env.NODE_ENV || 'production'));
} else {
  console.log('⚠️ SENTRY_DSN no configurado — observability desactivada');
}

export { Sentry };
