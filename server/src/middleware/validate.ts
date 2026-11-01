import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { badRequest } from '../utils/errors';

type Shapes = { body?: z.ZodTypeAny; query?: z.ZodTypeAny; params?: z.ZodTypeAny };

/**
 * Validates a request with zod schemas, e.g. `validate({ body: schema, params: schema })`.
 * Typed loosely on the outside (routes pass `z.object({ body: …, params: … })`) and
 * narrowed inside, so the route files stay untouched and `tsc` stays happy.
 */
export function validate<S extends object>(schema: S) {
  const shapes = schema as unknown as Shapes;
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (shapes.body) req.body = shapes.body.parse(req.body);
      if (shapes.query) req.query = shapes.query.parse(req.query) as any;
      if (shapes.params) req.params = shapes.params.parse(req.params) as any;
      next();
    } catch (e: any) {
      next(badRequest('Validation failed', e.errors ?? e.message));
    }
  };
}
