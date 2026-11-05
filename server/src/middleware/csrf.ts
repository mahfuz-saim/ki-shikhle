import type { Request, Response, NextFunction } from '../platform/express-compat';
import { forbidden } from '../utils/errors';
import { clientOrigins } from '../config/env';

/**
 * CSRF protection for the cookie-authenticated endpoints.
 *
 * The refresh token is stored in an `httpOnly` cookie. In production that cookie is
 * `SameSite=None` — the web app (Vercel) and the API (Cloudflare) are on different
 * domains, so a `SameSite=Lax` cookie would never be sent on the cross-site
 * `POST /auth/refresh` the client relies on.
 *
 * `SameSite=None` means the cookie **is** attached to cross-site requests, so the
 * usual "same-site cookie protects you" argument does not hold. The protection has to
 * come from somewhere else: the server must check that a state-changing request
 * actually came from one of our own front ends.
 *
 * The check is an **origin check**:
 *
 *  - If the request carries an `Origin` header (every browser sends one on a
 *    cross-origin `POST`), it must name one of the configured `CLIENT_ORIGIN`s.
 *  - If it carries no `Origin` at all, the request is not from a browser form
 *    (curl, a native app, a server-to-server call), and there is nothing for a
 *    cross-site attacker to forge — so it passes.
 *
 * This is the standard mitigation for `SameSite=None` cookies. It is deliberately
 * **not** applied to requests that authenticate with an `Authorization` header,
 * because a cross-site attacker cannot make a browser attach a custom header.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Is this origin one of our own front ends? */
export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (clientOrigins.includes('*')) return true;
  if (clientOrigins.includes(origin)) return true;
  // The CORS layer already allows these, so CSRF must agree with it — otherwise a
  // request the browser was willing to make would be rejected by the API.
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/[a-zA-Z0-9._-]+\.pages\.dev$/.test(origin)) return true;
  return false;
}

/**
 * Reject a state-changing request whose `Origin` is not one of ours.
 *
 * Applied to the routes that authenticate with the refresh **cookie**. Routes that
 * require a bearer token are not vulnerable and are left alone.
 */
export function requireSameOrigin(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = String(req.headers.origin || '').trim();
  // No Origin header — not a browser form post. Nothing to forge.
  if (!origin) return next();

  if (!isAllowedOrigin(origin)) {
    return next(forbidden('Cross-origin request rejected'));
  }
  return next();
}
