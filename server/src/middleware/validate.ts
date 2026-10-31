import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { badRequest } from '../utils/errors';

export const validate = (schema: { body?: z.ZodSchema; query?: z.ZodSchema; params?: z.ZodSchema }) => (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (schema.body) req.body = schema.body.parse(req.body);
    if (schema.query) req.query = schema.query.parse(req.query) as any;
    if (schema.params) req.params = schema.params.parse(req.params) as any;
    next();
  } catch (e: any) {
    next(badRequest('Validation failed', e.errors ?? e.message));
  }
};
