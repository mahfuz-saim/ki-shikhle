import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './entries.service';
import { resolveActor, type Actor } from '../../core/tenancy';

/**
 * Resolve the caller's tenancy scope.
 *
 * The scope comes from the token (via `core/tenancy`), never from a request body or a
 * hardcoded fallback.
 */
const actor = async (req: Request): Promise<Actor> => resolveActor(req.user as any);

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.listEntries(await actor(req), req.params.id, req.query as any);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const a = await actor(req);
    const data = await svc.createEntry(a, req.params.id, req.body);
    res.status(201).json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const a = await actor(req);
    const data = await svc.updateEntry(a, req.params.id, req.body, a.role);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.deleteEntry(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const verify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.verifyEntry(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const structureVoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.structureVoiceLog(await actor(req), req.body.speechText || '', req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};
