import type { Request, Response, NextFunction } from '../platform/express-compat';

/**
 * Small in-memory rate limiter (Express-style middleware).
 *
 * express-rate-limit depends on Node's `http` server stack, which does not exist on
 * Cloudflare Workers. Counters live in instance memory: good enough to blunt credential
 * stuffing on a single container/isolate. Put Cloudflare WAF/Rate Limiting rules in front
 * for a globally-enforced limit.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function limiter({ windowMs, max }: { windowMs: number; max: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip || 'unknown'}:${req.path}`;
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({
        success: false,
        data: null,
        error: { code: 'RATE_LIMITED', message: 'Too many requests, try again later' },
      });
    }
    // keep the map from growing without bound
    if (buckets.size > 10000) for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    return next();
  };
}

export const authLimiter = limiter({ windowMs: 15 * 60 * 1000, max: 100 });
export const generalLimiter = limiter({ windowMs: 60 * 1000, max: 200 });
