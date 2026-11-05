import type { Request, Response, NextFunction } from '../platform/express-compat';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { unauthorized, forbidden } from '../utils/errors';
import { resolveActor, type Actor, type Role } from '../core/tenancy';

export interface AuthUser {
  userId: string;
  role: string;
  email?: string;
  childId?: string; // for child scope
  type?: string; // access | child
  /**
   * The resolved tenancy scope for this request.
   *
   * Set by the `auth` middleware after the account was looked up. Handlers should read
   * `ownerId`/`childId` from here rather than re-deriving them from the token.
   */
  actor?: Actor;
}

/**
 * Authenticate a request.
 *
 * There used to be a fallback here that accepted any token starting with `demo-parent`,
 * and any token merely *containing* `tasnim` / `rahim` / `fahim` / `parent`, and turned it
 * into a session for the seeded demo family. That was an unauthenticated login bypass in
 * production. It is gone.
 *
 * The demo account does not need it: `parent@demo.com` logs in with a real password and
 * receives a real signed JWT, exactly like any other account. A token that fails
 * verification is simply not authenticated.
 *
 * The role check is made against the **database**, not against the JWT claim. A JWT stays
 * valid for its whole lifetime (7 days by default), so a token minted before an account
 * was demoted would otherwise keep its old powers for days. `resolveActor` re-reads the
 * account row and rejects unknown or deleted accounts outright.
 */
export function auth(requiredRole?: Role | Role[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next(unauthorized('Missing token'));

    const token = header.slice(7);

    let payload: AuthUser & { exp: number };
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUser & { exp: number };
    } catch {
      return next(unauthorized('Invalid or expired token'));
    }
    if (!payload?.userId) return next(unauthorized('Invalid token'));

    try {
      const actor = await resolveActor({
        userId: payload.userId,
        childId: payload.childId,
        role: payload.role,
        email: payload.email,
      });

      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(actor.role)) return next(forbidden('Forbidden role'));
      }

      req.user = { ...payload, role: actor.role, childId: actor.childId || payload.childId, actor };
      return next();
    } catch (e: any) {
      return next(e);
    }
  };
}

/**
 * Attach the caller when a valid token is present, otherwise leave the request anonymous.
 *
 * Used by endpoints that are public but can personalise their response. It never invents
 * an identity — an invalid token simply means "anonymous".
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUser;
    if (payload?.userId) req.user = payload;
  } catch {
    // Not authenticated — continue as an anonymous caller.
  }
  return next();
}
