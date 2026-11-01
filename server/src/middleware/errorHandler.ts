import type { Context } from 'hono';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import type { Request, Response } from '../platform/express-compat';

/** Express-style handler kept for compatibility with `router.use(errorHandler)`. */
export function errorHandler(err: Error, _req: Request, res: Response, _next?: (e?: any) => void) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      data: null,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }
  logger.error({ err: err.message }, 'unhandled error');
  return res.status(500).json({
    success: false,
    data: null,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

/** Hono error hook — the single place every thrown error ends up. */
export function onError(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json(
      { success: false, data: null, error: { code: err.code, message: err.message, details: err.details } },
      err.statusCode as any
    );
  }
  // CORS rejections and thrown strings still need a JSON envelope
  const status = (err as any)?.statusCode || 500;
  logger.error({ err: err.message, stack: err.stack }, 'unhandled error');
  return c.json(
    {
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      },
    },
    status as any
  );
}

export const notFound = (c: Context) =>
  c.json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
