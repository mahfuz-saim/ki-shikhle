import rateLimit from 'express-rate-limit';

// The API runs behind a proxy (Cloudflare in production), so `trust proxy` is on.
// express-rate-limit v7 rejects a permissive trust-proxy setting by default; we keep
// trust proxy (needed for correct req.ip/protocol) and opt out of that validation.
const validate = { trustProxy: false } as const;

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  validate,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: { code: 'RATE_LIMITED', message: 'Too many requests, try again later' } },
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  validate,
  standardHeaders: true,
  legacyHeaders: false,
});
