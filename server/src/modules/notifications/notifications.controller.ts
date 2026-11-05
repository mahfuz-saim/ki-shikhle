import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './notifications.service';
import { resolveActor, type Actor } from '../../core/tenancy';

/**
 * Resolve the caller's tenancy scope.
 *
 * The scope comes from the token (via `core/tenancy`), never from a request body.
 */
const actor = async (req: Request): Promise<Actor> => resolveActor(req.user as any);

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.list(await actor(req));
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const read = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.markRead(await actor(req), req.params.id);
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const readAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.markAllRead(await actor(req));
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};
