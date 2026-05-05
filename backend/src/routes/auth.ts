import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { prisma } from '../server';
import { authenticateToken, AuthRequest, JWT_SECRET } from '../middleware/auth';
import { sendWelcomeEmail, sendLoginCodeEmail, sendEmailChangeCode, sendPasswordResetEmail, generateVerificationCode, generateResetToken } from '../utils/email';

const router = Router();

// ───── Rate limits ─────
// Cada IP solo puede hacer N intentos dentro de la ventana. Mensajes en JSON
// para que el frontend pueda mostrarlos.
const jsonRateMessage = (msg: string) => ({ error: msg });

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8, // 8 intentos / 15 min / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonRateMessage('Demasiados intentos de login. Espera 15 minutos antes de volver a intentarlo.'),
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5, // 5 cuentas/hora/IP
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonRateMessage('Demasiadas cuentas creadas desde esta IP. Espera una hora.'),
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3, // 3 solicitudes de reset/hora/IP
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonRateMessage('Demasiadas solicitudes. Espera una hora.'),
});

const codeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 verificaciones de código / 15 min / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonRateMessage('Demasiados intentos de código. Espera unos minutos.'),
});

// ───── Password policy unificada ─────
function validatePassword(pw: string): string | null {
  if (typeof pw !== 'string') return 'Contraseña requerida';
  if (pw.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (pw.length > 128) return 'La contraseña es demasiado larga';
  if (!/[A-Z]/.test(pw)) return 'La contraseña necesita al menos una mayúscula';
  if (!/[a-z]/.test(pw)) return 'La contraseña necesita al menos una minúscula';
  if (!/\d/.test(pw)) return 'La contraseña necesita al menos un número';
  return null;
}

// Oculta el email para mostrarlo en la UI (juan@gmail.com → j***n@gmail.com)
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return local[0] + '***@' + domain;
  return local[0] + '***' + local[local.length - 1] + '@' + domain;
}

interface SignupBody {
  email: string;
  password: string;
  name: string;
  referralCode?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

router.post('/signup', signupLimiter, async (req: Request, res: Response) => {
  // Respuesta ÚNICA para evitar enumeración de emails: el atacante no puede
  // distinguir entre "email nuevo creado" y "email ya existe".
  const SAFE_OK = {
    message: 'Cuenta creada. Inicia sesión para verificar tu email.',
    requiresLogin: true,
  };

  try {
    const raw: SignupBody = req.body || {};
    const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
    const password = typeof raw.password === 'string' ? raw.password : '';
    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    const referralCode = typeof raw.referralCode === 'string' ? raw.referralCode.trim() : undefined;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, contraseña y nombre requeridos' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email no válido' });
    }
    if (email.length > 254) {
      return res.status(400).json({ error: 'Email demasiado largo' });
    }
    const pwError = validatePassword(password);
    if (pwError) return res.status(400).json({ error: pwError });
    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: 'Nombre inválido (2-80 caracteres)' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // No revelamos al atacante que el email ya existe.
      // Tampoco enviamos email para no quemar cuota de Resend con spam.
      return res.status(201).json(SAFE_OK);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        referredBy: referralCode || null,
        emailVerified: false,  // Se verifica en el primer login con un código
      },
    });

    // Email de bienvenida (no bloqueante — si falla seguimos)
    try {
      await sendWelcomeEmail(email, name);
    } catch (mailErr: any) {
      console.error('Welcome email send error:', mailErr);
    }

    return res.status(201).json(SAFE_OK);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const raw: LoginBody = req.body || {};
    const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
    const password = typeof raw.password === 'string' ? raw.password : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Si el email aún no está verificado, mandamos código y pedimos verificación
    // (esto solo ocurre en el primer login tras crear la cuenta)
    if (!user.emailVerified) {
      const code = generateVerificationCode();
      const codeHash = await bcrypt.hash(code, 10);
      const expires = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationCode: codeHash,
          verificationCodeExpires: expires,
          verificationAttempts: 0,
        },
      });

      try {
        await sendLoginCodeEmail(user.email, user.name, code);
      } catch (mailErr: any) {
        console.error('Login code email error:', mailErr);
        return res.status(500).json({ error: 'No se pudo enviar el código. Intenta de nuevo.' });
      }

      const pendingToken = jwt.sign(
        { type: 'pending-login', userId: user.id },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      return res.json({
        requiresMFA: true,
        pendingToken,
        emailHint: maskEmail(user.email),
      });
    }

    // Email ya verificado: login normal, token directo
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' } as any
    );

    res.json({
      message: 'Login exitoso',
      user: { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, emailVerified: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Actualizar perfil. Solo el nombre cambia inmediatamente; el email exige
// confirmar con un código enviado al NUEVO email antes de aplicarse.
router.put('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const raw = req.body || {};

    // Nombre: cambio directo si llega
    let nameUpdated = false;
    if (typeof raw.name === 'string') {
      const name = raw.name.trim();
      if (name.length < 2 || name.length > 80) {
        return res.status(400).json({ error: 'Nombre inválido (2-80 caracteres)' });
      }
      await prisma.user.update({ where: { id: req.userId }, data: { name } });
      nameUpdated = true;
    }

    // Email: NO se cambia aún, se envía código al nuevo email para confirmar
    let emailChangeRequested = false;
    let emailHint: string | undefined;
    if (typeof raw.email === 'string') {
      const newEmail = raw.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return res.status(400).json({ error: 'Email no válido' });
      }

      const me = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!me) return res.status(404).json({ error: 'Usuario no encontrado' });

      // Si el usuario "cambia" al mismo que ya tiene, no hacemos nada
      if (newEmail === me.email) {
        // No es error pero no toca el email
      } else {
        const existing = await prisma.user.findUnique({ where: { email: newEmail } });
        if (existing && existing.id !== req.userId) {
          return res.status(409).json({ error: 'Ese email ya está en uso' });
        }

        const code = generateVerificationCode();
        const codeHash = await bcrypt.hash(code, 10);
        const expires = new Date(Date.now() + 15 * 60 * 1000);

        await prisma.user.update({
          where: { id: req.userId },
          data: {
            pendingEmail: newEmail,
            verificationCode: codeHash,
            verificationCodeExpires: expires,
            verificationAttempts: 0,
          },
        });

        try {
          await sendEmailChangeCode(newEmail, me.name, code, me.email);
        } catch (mailErr: any) {
          console.error('Email change code send error:', mailErr);
          // Limpiamos para no dejar estado inconsistente
          await prisma.user.update({
            where: { id: req.userId },
            data: { pendingEmail: null, verificationCode: null, verificationCodeExpires: null },
          });
          return res.status(500).json({ error: 'No se pudo enviar el código al nuevo email' });
        }

        emailChangeRequested = true;
        emailHint = maskEmail(newEmail);
      }
    }

    if (!nameUpdated && !emailChangeRequested) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, emailVerified: true, createdAt: true },
    });

    res.json({
      message: emailChangeRequested ? 'Te hemos enviado un código al nuevo email' : 'Perfil actualizado',
      user,
      emailChangeRequested,
      emailHint,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Confirmar cambio de email con el código enviado al nuevo
router.post('/verify-email-change', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Código inválido (6 dígitos)' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (!user.pendingEmail || !user.verificationCode || !user.verificationCodeExpires) {
      return res.status(400).json({ error: 'No hay cambio de email pendiente' });
    }
    if (user.verificationCodeExpires.getTime() < Date.now()) {
      return res.status(400).json({ error: 'El código ha caducado. Vuelve a pedir el cambio.' });
    }
    if ((user.verificationAttempts || 0) >= 5) {
      return res.status(429).json({ error: 'Demasiados intentos. Vuelve a pedir el cambio.' });
    }

    const match = await bcrypt.compare(code, user.verificationCode);
    if (!match) {
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationAttempts: { increment: 1 } },
      });
      return res.status(401).json({ error: 'Código incorrecto' });
    }

    // Verificar de nuevo que el email no haya sido tomado mientras tanto
    const taken = await prisma.user.findUnique({ where: { email: user.pendingEmail } });
    if (taken && taken.id !== user.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { pendingEmail: null, verificationCode: null, verificationCodeExpires: null, verificationAttempts: 0 },
      });
      return res.status(409).json({ error: 'Ese email se ha registrado mientras esperabas. Prueba con otro.' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.pendingEmail,
        pendingEmail: null,
        verificationCode: null,
        verificationCodeExpires: null,
        verificationAttempts: 0,
      },
      select: { id: true, email: true, name: true, emailVerified: true, createdAt: true },
    });

    res.json({ message: 'Email actualizado', user: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Verificar el código del login (MFA) y devolver el token de sesión real
router.post('/verify-login', codeLimiter, async (req: Request, res: Response) => {
  try {
    const pendingToken = typeof req.body?.pendingToken === 'string' ? req.body.pendingToken : '';
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';

    if (!pendingToken) return res.status(400).json({ error: 'Token de login requerido' });
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Código inválido (debe tener 6 dígitos)' });
    }

    let payload: any;
    try {
      payload = jwt.verify(pendingToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'El intento de login ha caducado. Vuelve a iniciar sesión.' });
    }
    if (payload?.type !== 'pending-login' || !payload.userId) {
      return res.status(401).json({ error: 'Token de login inválido' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (!user.verificationCode || !user.verificationCodeExpires) {
      return res.status(400).json({ error: 'No hay código pendiente. Vuelve a iniciar sesión.' });
    }
    if (user.verificationCodeExpires.getTime() < Date.now()) {
      return res.status(400).json({ error: 'El código ha caducado. Vuelve a iniciar sesión.' });
    }
    if ((user.verificationAttempts || 0) >= 5) {
      return res.status(429).json({ error: 'Demasiados intentos. Vuelve a iniciar sesión.' });
    }

    const match = await bcrypt.compare(code, user.verificationCode);
    if (!match) {
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationAttempts: { increment: 1 } },
      });
      return res.status(401).json({ error: 'Código incorrecto' });
    }

    // Marca el email como verificado, limpia el código y emite el token real
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
        verificationAttempts: 0,
      },
    });

    const token = jwt.sign(
      { userId: updated.id, email: updated.email },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' } as any
    );

    res.json({
      message: 'Login completado',
      user: { id: updated.id, email: updated.email, name: updated.name, emailVerified: updated.emailVerified },
      token,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Reenviar el código del login
router.post('/resend-login-code', codeLimiter, async (req: Request, res: Response) => {
  try {
    const pendingToken = typeof req.body?.pendingToken === 'string' ? req.body.pendingToken : '';
    if (!pendingToken) return res.status(400).json({ error: 'Token de login requerido' });

    let payload: any;
    try {
      payload = jwt.verify(pendingToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'El intento de login ha caducado. Vuelve a iniciar sesión.' });
    }
    if (payload?.type !== 'pending-login' || !payload.userId) {
      return res.status(401).json({ error: 'Token de login inválido' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Rate limit: si el código se emitió hace < 60s, bloquea reenvío
    if (user.verificationCodeExpires) {
      const issuedAt = user.verificationCodeExpires.getTime() - 10 * 60 * 1000;
      const sinceIssued = Date.now() - issuedAt;
      if (sinceIssued < 60 * 1000) {
        return res.status(429).json({ error: 'Espera un minuto antes de pedir otro código' });
      }
    }

    const code = generateVerificationCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: codeHash,
        verificationCodeExpires: expires,
        verificationAttempts: 0,
      },
    });

    try {
      await sendLoginCodeEmail(user.email, user.name, code);
    } catch (mailErr: any) {
      console.error('Login code resend error:', mailErr);
      return res.status(500).json({ error: 'No se pudo enviar el email. Intenta de nuevo.' });
    }

    res.json({ message: 'Código enviado' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Solicitar reset de contraseña — envía email con enlace
router.post('/forgot-password', forgotLimiter, async (req: Request, res: Response) => {
  // Respuesta SIEMPRE igual (haya o no usuario) para evitar enumeración de emails
  const SAFE_OK = { message: 'Si ese email está registrado, te llegará un enlace en breve.' };

  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.json(SAFE_OK);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json(SAFE_OK);

    // Rate limit: si hay un token vivo emitido hace < 60s, no reenviamos
    if (user.resetTokenExpires) {
      const issuedAt = user.resetTokenExpires.getTime() - 60 * 60 * 1000;
      if (Date.now() - issuedAt < 60 * 1000) {
        return res.json(SAFE_OK);
      }
    }

    const token = generateResetToken();
    const tokenHash = await bcrypt.hash(token, 10);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: tokenHash, resetTokenExpires: expires },
    });

    const frontendBase = process.env.FRONTEND_URL || 'https://yudbot.com';
    const resetUrl = `${frontendBase}/app?reset=${token}&id=${user.id}`;

    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (mailErr: any) {
      console.error('Reset email send error:', mailErr);
      // Limpiar token para no dejar estado inconsistente
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpires: null },
      });
      return res.status(500).json({ error: 'No se pudo enviar el email' });
    }

    return res.json(SAFE_OK);
  } catch (error: any) {
    console.error(error);
    // Mismo mensaje seguro
    return res.json(SAFE_OK);
  }
});

// Aplicar nueva contraseña usando el token del email
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const userId = typeof req.body?.userId === 'string' ? req.body.userId : '';
    const token = typeof req.body?.token === 'string' ? req.body.token : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!userId || !token) {
      return res.status(400).json({ error: 'Enlace inválido' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }
    if (!/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.status(400).json({ error: 'La contraseña necesita una mayúscula y un número' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.resetToken || !user.resetTokenExpires) {
      return res.status(400).json({ error: 'Enlace inválido o ya usado. Pide uno nuevo.' });
    }
    if (user.resetTokenExpires.getTime() < Date.now()) {
      return res.status(400).json({ error: 'El enlace ha caducado. Pide uno nuevo.' });
    }

    const match = await bcrypt.compare(token, user.resetToken);
    if (!match) {
      return res.status(400).json({ error: 'Enlace inválido o ya usado. Pide uno nuevo.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpires: null,
        // Invalidar también cualquier MFA pendiente para forzar login limpio
        verificationCode: null,
        verificationCodeExpires: null,
        verificationAttempts: 0,
      },
    });

    res.json({ message: 'Contraseña restablecida. Ya puedes iniciar sesión.' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Cambiar contraseña
router.post('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }
    if (!/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.status(400).json({ error: 'La nueva contraseña necesita una mayúscula y un número' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'La nueva contraseña debe ser distinta de la actual' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: 'La contraseña actual no es correcta' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });

    res.json({ message: 'Contraseña actualizada' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
