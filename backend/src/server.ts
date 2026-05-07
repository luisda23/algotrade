// IMPORTANTE: ./instrument debe ser el PRIMER import. Sentry v8+ usa
// auto-instrumentation de OpenTelemetry para Express y Prisma; si se
// importa después de los módulos que va a instrumentar, el hook llega
// tarde y no captura nada.
import "./instrument";
import * as Sentry from "@sentry/node";

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { prisma } from "./db";

import authRoutes from "./routes/auth";
import botsRoutes from "./routes/bots";
import brokerRoutes from "./routes/brokers";
import marketplaceRoutes from "./routes/marketplace";
import paymentRoutes, { purgeExpiredPendingBots } from "./routes/payments";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Railway / Vercel viven detrás de un proxy, hay que confiar en X-Forwarded-For
// para que express-rate-limit pueda identificar IPs reales. 1 = trust 1 hop.
app.set("trust proxy", 1);

// Headers de seguridad. Desactivamos CSP porque el frontend está en otro dominio
// (Vercel) y la API solo devuelve JSON; el resto de defaults de helmet aplican.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
// Quita el header X-Powered-By: Express que dice al atacante el stack que usamos
app.disable("x-powered-by");

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
    limit: "100kb", // límite de payload — frena POSTs gigantes que abusan recursos
  }),
);
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// CORS — frontend local + producción + previews de Vercel del proyecto
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "https://yudbot.com",
  "https://www.yudbot.com",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Slug del team Vercel — sin esto, "algotrade-*.vercel.app" matchearía
// también deploys de un atacante que cree un proyecto llamado "algotrade-evil"
// en otro team. La URL de preview real tiene el formato
// {project}-{git-hash}-{team-slug}.vercel.app, así que exigimos el team slug.
const VERCEL_TEAM_SLUG = process.env.VERCEL_TEAM_SLUG || ""; // ej. 'luisda23s-projects'
const VERCEL_PREVIEW_RE = VERCEL_TEAM_SLUG
  ? // algotrade-<git-hash>-<team-slug>.vercel.app
    new RegExp(
      `^algotrade(?:-[a-z0-9]+)?-${VERCEL_TEAM_SLUG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.vercel\\.app$`,
      "i",
    )
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman, curl, server-to-server

      // Whitelist explícita
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Solo previews de NUESTRO proyecto Vercel restringidos al team configurado.
      // Si no hay VERCEL_TEAM_SLUG en env, deshabilitamos previews para no abrir
      // un agujero CSRF al permitir cualquier algotrade-*.vercel.app.
      if (VERCEL_PREVIEW_RE) {
        try {
          const u = new URL(origin);
          if (VERCEL_PREVIEW_RE.test(u.hostname)) return callback(null, true);
        } catch {}
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/bots", botsRoutes);
app.use("/api/brokers", brokerRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/payments", paymentRoutes);

// Health check completo. Verifica las 3 dependencias críticas en paralelo
// con un timeout corto. Devuelve 200 si TODAS responden, 503 si alguna
// falla — así un monitoring (UptimeRobot, BetterStack, Railway healthcheck)
// puede alertar de inmediato y no enmascarar fallos parciales.
app.get("/health", async (_req: Request, res: Response) => {
  const checks = await Promise.all([
    // 1. Postgres vía Prisma — query trivial.
    timed(() => prisma.$queryRaw`SELECT 1`, "db"),
    // 2. Resend API. Solo chequeamos conectividad: las API keys de Resend
    //    pueden ser "sending-only" (sin permiso para listar dominios), así
    //    que un 401 en /domains NO es síntoma de outage real. Nos basta
    //    con saber que el host responde algo (DNS + network OK). Los 5xx
    //    o timeout sí indican caída de Resend.
    timed(async () => {
      if (!process.env.RESEND_API_KEY) return;
      const r = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        signal: AbortSignal.timeout(3000),
      });
      if (r.status >= 500) throw new Error(`HTTP ${r.status}`);
    }, "resend"),
    // 3. Lemon Squeezy API. /v1/stores requiere auth; mismo razonamiento.
    timed(async () => {
      if (!process.env.LEMON_API_KEY) return;
      const r = await fetch("https://api.lemonsqueezy.com/v1/stores", {
        headers: {
          Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
          Accept: "application/vnd.api+json",
        },
        signal: AbortSignal.timeout(3000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    }, "lemon"),
  ]);

  const allOk = checks.every((c) => c.ok);
  res.status(allOk ? 200 : 503).json({
    status: allOk ? "OK" : "DEGRADED",
    timestamp: new Date(),
    checks: checks.reduce(
      (acc, c) => {
        acc[c.name] = c.ok
          ? { ok: true, ms: c.ms }
          : { ok: false, ms: c.ms, error: c.error };
        return acc;
      },
      {} as Record<string, unknown>,
    ),
  });
});

// Helper: ejecuta una promesa, mide latencia y captura errores en una
// estructura serializable. Nunca tira — el caller agrega el resultado.
async function timed(
  fn: () => Promise<unknown>,
  name: string,
): Promise<{ name: string; ok: boolean; ms: number; error?: string }> {
  const start = Date.now();
  try {
    await fn();
    return { name, ok: true, ms: Date.now() - start };
  } catch (err: any) {
    return {
      name,
      ok: false,
      ms: Date.now() - start,
      error: err?.message?.slice(0, 200) || "unknown",
    };
  }
}

// Sentry error handler: tiene que ir DESPUÉS de las rutas y ANTES de
// cualquier otro middleware de error custom. Captura cualquier excepción
// no manejada, la asocia con el contexto del request (URL, método, user
// si lo hay) y la envía a Sentry. El cliente sigue recibiendo su 500
// igual que antes — Sentry solo observa.
Sentry.setupExpressErrorHandler(app);

// Fallback final: si nada antes ha manejado el error, devolver 500 con
// código bilingüe genérico para que el frontend pueda traducirlo.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return;
  res.status(500).json({ code: "common.server_error", error: "Server error" });
});

app.listen(PORT, () => {
  console.log(`✅ Server ejecutándose en http://localhost:${PORT}`);
});

// Limpieza periódica de PendingBots caducados (TTL 24h). El primer barrido
// corre a los 30s tras boot (margen para que la conexión a Prisma esté
// caliente), después cada 6h. La purga oportunista en /checkout-custom
// hace la mayor parte del trabajo; este timer cubre instancias con poco
// tráfico. unref() permite que el proceso pueda salir sin esperar al timer.
if (process.env.NODE_ENV !== "test") {
  setTimeout(() => {
    void purgeExpiredPendingBots();
    setInterval(
      () => void purgeExpiredPendingBots(),
      6 * 60 * 60 * 1000,
    ).unref();
  }, 30_000).unref();
}

// Re-exportamos prisma para retrocompatibilidad: routes/* siguen importando
// desde '../server'. La fuente real es './db' — ahí vive el cliente único.
export { prisma };
export { app };
