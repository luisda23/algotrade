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

  const allowedKeys = ['avatar','market','pair','leverage','indicators','risk','news','funded'];
  const cleanParams: Record<string, any> = {};
  for (const k of allowedKeys) if (k in params) cleanParams[k] = params[k];

  return { error: null, data: { name, strategy, description, parameters: cleanParams } };
}

// ───── Verificar pago con la API de Lemon y crear bot ─────
router.post('/verify', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { orderNumber, botConfig } = req.body;
    if (!orderNumber || (typeof orderNumber !== 'string' && typeof orderNumber !== 'number')) {
      return res.status(400).json({ error: 'orderNumber requerido' });
    }
    if (!LEMON_API_KEY || !LEMON_STORE_ID) {
      return res.status(500).json({ error: 'Pasarela de pago no configurada' });
    }

    // Buscar orden por order_number en nuestro store
    const list = await lemonApi(
      `/orders?filter[store_id]=${encodeURIComponent(LEMON_STORE_ID)}&filter[order_number]=${encodeURIComponent(String(orderNumber))}`
    );
    const order = Array.isArray(list?.data) ? list.data[0] : null;
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const attrs = order.attributes || {};
    const status = attrs.status; // 'paid' | 'pending' | 'failed' | 'refunded'
    if (status !== 'paid') {
      return res.status(400).json({ error: 'Pago no confirmado', status });
    }

    // Validar que la orden pertenece a este usuario (custom data o email)
    const customUserId = attrs?.first_order_item?.custom_data?.user_id
      || attrs?.custom_data?.user_id;
    const orderEmail = (attrs.user_email || '').toLowerCase();

    const reqUser = await prisma.user.findUnique({ where: { id: req.userId } });
    const myEmail = (reqUser?.email || '').toLowerCase();

    const matchById = customUserId && customUserId === req.userId;
    const matchByEmail = orderEmail && myEmail && orderEmail === myEmail;
    if (!matchById && !matchByEmail) {
      return res.status(403).json({ error: 'La orden no pertenece a este usuario' });
    }

    // Idempotencia: si ya existe un bot creado con este order_id, devolverlo
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
        parameters: { ...data.parameters, lemonOrderId: orderKey, lemonOrderNumber: String(orderNumber) },
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
