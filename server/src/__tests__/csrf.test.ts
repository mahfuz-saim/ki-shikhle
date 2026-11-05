/**
 * CSRF protection for the cookie-authenticated endpoints.
 *
 * The refresh token lives in an `httpOnly` cookie that is `SameSite=None` in
 * production, because the web app (Vercel) and the API (Cloudflare) are on
 * different domains. A `SameSite=None` cookie IS attached to cross-site requests,
 * so the server has to check the `Origin` itself.
 *
 * The security checklist claimed "CSRF for cookie" was in place. It was not.
 */

import { describe, it, expect } from 'vitest';
import { requireSameOrigin, isAllowedOrigin } from '../middleware/csrf';
import type { Request, Response, NextFunction } from '../platform/express-compat';

function runGuard(method: string, origin?: string): any {
  const req: any = { method, headers: origin ? { origin } : {} };
  let captured: any = null;
  const next: NextFunction = (err?: any) => {
    captured = err ?? null;
  };
  requireSameOrigin(req as Request, {} as Response, next);
  return captured;
}

describe('origin allowlist', () => {
  it('accepts a localhost origin', () => {
    expect(isAllowedOrigin('http://localhost:3000')).toBe(true);
    expect(isAllowedOrigin('http://localhost:3001')).toBe(true);
  });

  it('accepts a vercel preview origin', () => {
    expect(isAllowedOrigin('https://ki-shikhle-git-main.vercel.app')).toBe(true);
  });

  it('rejects an unrelated origin', () => {
    expect(isAllowedOrigin('https://evil.example.com')).toBe(false);
    expect(isAllowedOrigin('https://kishikhle.com.evil.example')).toBe(false);
  });

  it('rejects an empty origin', () => {
    expect(isAllowedOrigin('')).toBe(false);
  });
});

describe('requireSameOrigin', () => {
  it('rejects a cross-site POST', () => {
    const err = runGuard('POST', 'https://evil.example.com');
    expect(err).toBeTruthy();
    expect(err.message).toMatch(/cross-origin/i);
  });

  it('allows a POST from our own origin', () => {
    expect(runGuard('POST', 'http://localhost:3000')).toBeNull();
  });

  it('allows a POST with no Origin header (not a browser form post)', () => {
    // curl and native apps send no Origin. There is nothing for a cross-site
    // attacker to forge, and rejecting these would break the API's own clients.
    expect(runGuard('POST')).toBeNull();
  });

  it('allows a safe method regardless of origin', () => {
    expect(runGuard('GET', 'https://evil.example.com')).toBeNull();
    expect(runGuard('HEAD', 'https://evil.example.com')).toBeNull();
    expect(runGuard('OPTIONS', 'https://evil.example.com')).toBeNull();
  });

  it('rejects a cross-site DELETE', () => {
    const err = runGuard('DELETE', 'https://evil.example.com');
    expect(err).toBeTruthy();
  });
});
