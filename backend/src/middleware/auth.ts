import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  userId?: string;
}

export const JWT_SECRET = (() => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    // Fail loud at boot — no silent 'secret' fallback that lets anyone forge tokens.
    throw new Error('JWT_SECRET environment variable is required and must be at least 16 chars long');
  }
  return s;
})();

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }

    // Rechaza tokens pre-MFA: el pendingToken solo sirve para /verify-login
    // y /resend-login-code, no para autenticarse en el resto de la API.
    if (decoded?.type === 'pending-login') {
      return res.status(403).json({ error: 'Token de login pendiente. Completa la verificación primero.' });
    }

    if (!decoded?.userId) {
      return res.status(403).json({ error: 'Token inválido' });
    }

    req.userId = decoded.userId;
    next();
  });
};

export { AuthRequest };
