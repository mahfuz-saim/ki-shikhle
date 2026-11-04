import type { Context } from 'hono';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import type { Request, Response } from '../platform/express-compat';

/** Express-style handler kept for compatibility with `router.use(errorHandler)`. */
export function errorHandler(err: Error, _req: Request, res: Response, _next?: (e?: any) => void) {
  const isAppErr =
    err instanceof AppError ||
    (err as any)?.name === 'AppError' ||
    Boolean((err as any)?.statusCode && (err as any)?.code) ||
    Boolean((err as any)?.statusCode && (err as any)?.statusCode < 500);
  if (isAppErr) {
    const appErr = err as any;
    return res.status(appErr.statusCode || 400).json({
      success: false,
      data: null,
      error: { code: appErr.code || 'BAD_REQUEST', message: appErr.message, details: appErr.details },
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
  const isAppErr =
    err instanceof AppError ||
    (err as any)?.name === 'AppError' ||
    Boolean((err as any)?.statusCode && (err as any)?.code) ||
    Boolean((err as any)?.statusCode && (err as any)?.statusCode < 500);
  if (isAppErr) {
    const appErr = err as any;
    return c.json(
      {
        success: false,
        data: null,
        error: { code: appErr.code || 'BAD_REQUEST', message: appErr.message, details: appErr.details },
      },
      (appErr.statusCode || 400) as any
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
        code: (err as any)?.code || 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      },
    },
    status as any
  );
}

export const notFound = (c: Context) =>
  c.json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
