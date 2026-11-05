import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './results.service';
import { resolveActor, type Actor } from '../../core/tenancy';

/**
 * Resolve the caller's tenancy scope.
 *
 * The scope comes from the token (via `core/tenancy`), never from a request body.
 */
const actor = async (req: Request): Promise<Actor> => resolveActor(req.user as any);

export const getResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getAttemptResults(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const createExplanation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const language = req.body?.language || (req.query.language as string) || 'en';
    const data = await svc.generateExplanation(await actor(req), req.params.id, language);
    res.status(201).json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};
