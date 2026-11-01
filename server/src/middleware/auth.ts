import type { Request, Response, NextFunction } from '../platform/express-compat';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { unauthorized } from '../utils/errors';

export interface AuthUser {
  userId: string;
  role: string;
  email?: string;
  childId?: string; // for child scope
  type?: string; // access | child
}

export function auth(requiredRole?: string | string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next(unauthorized('Missing token'));
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUser & { exp: number };
      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(payload.role)) return next(unauthorized('Forbidden role'));
      }
      req.user = payload;
      next();
    } catch {
      next(unauthorized('Invalid or expired token'));
    }
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUser;
    req.user = payload;
  } catch {}
  next();
}
