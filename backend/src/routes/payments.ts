import { Router, Response, Request } from 'express';
import crypto from 'crypto';
import { prisma } from '../server';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const LEMON_API_KEY = process.env.LEMON_API_KEY || '';
const LEMON_STORE_ID = process.env.LEMON_STORE_ID || '';
const LEMON_BUY_URL = process.env.LEMON_BUY_URL || '';
const LEMON_WEBHOOK_SECRET = process.env.LEMON_WEBHOOK_SECRET || '';

async function lemonApi(path: string): Promise<any> {
  const res = await fetch(`https://api.lemonsqueezy.com/v1${path}`, {
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${LEMON_API_KEY}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lemon Squeezy API ${res.status}: ${text}`);
  }
  return res.json();
}

// ───── Crear sesión de checkout (devuelve URL de Lemon Squeezy) ─────
router.post('/checkout-custom', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!LEMON_BUY_URL) {
      return res.status(500).json({ error: 'Pasarela de pago no configurada' });
    }

    const { botName } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const params = new URLSearchParams();
    params.set('checkout[email]', user.email);
    if (user.name) params.set('checkout[name]', user.name);
    params.set('checkout[custom][user_id]', String(req.userId || ''));
    if (botName) params.set('checkout[custom][bot_name]', String(botName).slice(0, 60));

    const url = `${LEMON_BUY_URL}?${params.toString()}`;
    res.json({ url });
  } catch (error: any) {
    console.error('Lemon checkout error:', error);
    res.status(500).json({ error: error.message || 'Error al crear sesión de pago' });
  }
});

// Validación + saneado del payload del wizard
interface SanitizedBot {
  name: string;
  strategy: string;
  description: string;
  parameters: Record<string, any>;
}
function sanitizeBotConfig(raw: any): { error: string; data: null } | { error: null; data: SanitizedBot } {
  if (!raw || typeof raw !== 'object') return { error: 'Configuración del bot requerida', data: null };

  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (name.length === 0 || name.length > 60) {
    return { error: 'Nombre de bot inválido (1-60 caracteres)', data: null };
  }
  const strategy = typeof raw.strategy === 'string' ? raw.strategy : '';
  const allowedStrategies = ['scalping','swing','momentum','mean','breakout','grid','trend','dca','hedge','reversal'];
  if (!allowedStrategies.includes(strategy)) {
    return { error: 'Estrategia no válida', data: null };
  }

  const description = typeof raw.description === 'string' ? raw.description.slice(0, 200) : '';
  const params = (raw.parameters && typeof raw.parameters === 'object') ? raw.parameters : {};

  const allowedKeys = ['avatar','market','pair','leverage','indicators','risk','news','funded','timeframe','lot'];
  const cleanParams: Record<string, any> = {};
  for (const k of allowedKeys) if (k in params) cleanParams[k] = params[k];

  // Sanity bounds en timeframe
  const ALLOWED_TF = ['M1','M5','M15','M30','H1','H4','D1'];
  if (cleanParams.timeframe && !ALLOWED_TF.includes(cleanParams.timeframe)) {
    delete cleanParams.timeframe;
  }
  // Sanity bounds en lot
  if (cleanParams.lot && typeof cleanParams.lot === 'object') {
    const lot: any = {};
    if (cleanParams.lot.mode === 'auto' || cleanParams.lot.mode === 'fixed') {
      lot.mode = cleanParams.lot.mode;
    }
    if (typeof cleanParams.lot.fixedLot === 'number' && isFinite(cleanParams.lot.fixedLot)) {
      lot.fixedLot = Math.min(100, Math.max(0.01, cleanParams.lot.fixedLot));
    }
    cleanParams.lot = lot;
  }

  return { error: null, data: { name, strategy, description, parameters: cleanParams } };
}

// ───── Verificar pago con la API de Lemon y crear bot ─────
// Estrategia robusta: si tenemos orderNumber lo usamos; si no, buscamos
// la orden pagada más reciente del email del usuario (últimos 60 min)
// y aún no asociada a un bot. Esto cubre el caso en que Lemon Squeezy
// no añada `order_number` al redirect URL.
router.post('/verify', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { orderNumber, botConfig } = req.body;
    if (!LEMON_API_KEY || !LEMON_STORE_ID) {
      return res.status(500).json({ error: 'Pasarela de pago no configurada' });
    }

    const reqUser = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!reqUser) return res.status(404).json({ error: 'Usuario no encontrado' });
    const myEmail = (reqUser.email || '').toLowerCase();

    let order: any = null;
    let foundOrderNumber: string | undefined;

    if (orderNumber) {
      const list = await lemonApi(
        `/orders?filter[store_id]=${encodeURIComponent(LEMON_STORE_ID)}&filter[order_number]=${encodeURIComponent(String(orderNumber))}`
      );
      order = Array.isArray(list?.data) ? list.data[0] : null;
      if (order) foundOrderNumber = String(orderNumber);
    } else {
      // Sin orderNumber: traemos órdenes del store y filtramos por email
      // y status='paid' en código (la API de Lemon no acepta filter[status]
      // ni sort=-created_at en /orders).
      const list = await lemonApi(
        `/orders?filter[store_id]=${encodeURIComponent(LEMON_STORE_ID)}&page[size]=50`
      );
      const all = Array.isArray(list?.data) ? list.data : [];
      const candidates = all
        .filter((o: any) => o?.attributes?.status === 'paid')
        .sort((a: any, b: any) => {
          const at = new Date(a?.attributes?.created_at || 0).getTime();
          const bt = new Date(b?.attributes?.created_at || 0).getTime();
          return bt - at;
        });

      for (const c of candidates) {
        const cAttrs = c.attributes || {};
        const cEmail = (cAttrs.user_email || '').toLowerCase();
        const cUserId = cAttrs?.first_order_item?.custom_data?.user_id || cAttrs?.custom_data?.user_id;

        const matchById = cUserId && cUserId === req.userId;
        const matchByEmail = cEmail && myEmail && cEmail === myEmail;
        if (!matchById && !matchByEmail) continue;

        // Limita a órdenes recientes (60 min) para no asociar compras viejas
        const created = new Date(cAttrs.created_at || 0).getTime();
        const ageMin = (Date.now() - created) / 60000;
        if (ageMin > 60 || ageMin < 0) continue;

        // Skip si ya hay un bot con esta orden
        const orderId = String(c.id);
        const already = await prisma.bot.findFirst({
          where: { userId: req.userId, parameters: { path: ['lemonOrderId'], equals: orderId } as any },
        });
        if (already) continue;

        order = c;
        foundOrderNumber = String(cAttrs.order_number || '');
        break;
      }
    }

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada o ya procesada' });
    }

    const attrs = order.attributes || {};
    const status = attrs.status;
    if (status !== 'paid') {
      return res.status(400).json({ error: 'Pago no confirmado', status });
    }

    // Validación final de propietario
    const customUserId = attrs?.first_order_item?.custom_data?.user_id || attrs?.custom_data?.user_id;
    const orderEmail = (attrs.user_email || '').toLowerCase();
    const matchById = customUserId && customUserId === req.userId;
    const matchByEmail = orderEmail && myEmail && orderEmail === myEmail;
    if (!matchById && !matchByEmail) {
      return res.status(403).json({ error: 'La orden no pertenece a este usuario' });
    }

    // Idempotencia
    const orderKey = String(order.id);
    const existing = await prisma.bot.findFirst({
      where: {
        userId: req.userId,
        parameters: { path: ['lemonOrderId'], equals: orderKey } as any,
      },
    });
    if (existing) {
      return res.json({ message: 'Pago ya verificado', bot: existing });
    }

    const sanitized = sanitizeBotConfig(botConfig);
    if (sanitized.error) {
      return res.status(400).json({ error: sanitized.error });
    }
    const data = sanitized.data!;

    const bot = await prisma.bot.create({
      data: {
        userId: req.userId!,
        name: data.name,
        description: data.description,
        strategy: data.strategy,
        parameters: { ...data.parameters, lemonOrderId: orderKey, lemonOrderNumber: foundOrderNumber || '' },
      },
    });

    res.json({ message: 'Pago verificado y bot creado', bot });
  } catch (error: any) {
    console.error('Verify error:', error);
    res.status(500).json({ error: error.message || 'Error al verificar el pago' });
  }
});

// ───── Webhook de Lemon Squeezy (auditoría / fallback) ─────
router.post('/lemon-webhook', async (req: Request, res: Response) => {
  try {
    if (!LEMON_WEBHOOK_SECRET) {
      console.error('LEMON_WEBHOOK_SECRET no configurado');
      return res.status(500).send('Webhook no configurado');
    }

    const signature = (req.headers['x-signature'] || '') as string;
    const rawBody: Buffer | undefined = (req as any).rawBody;
    if (!rawBody || !signature) return res.status(401).send('Firma faltante');

    const expected = crypto
      .createHmac('sha256', LEMON_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return res.status(401).send('Firma inválida');
    }

    const event = (req.body?.meta?.event_name || '').toString();
    const orderId = req.body?.data?.id;
    console.log(`[lemon-webhook] event=${event} order_id=${orderId}`);

    // Solo registramos. La creación del bot se hace en /verify desde el frontend
    // (necesita el botConfig que vive en localStorage del usuario).
    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).send('Error procesando webhook');
  }
});

export default router;
