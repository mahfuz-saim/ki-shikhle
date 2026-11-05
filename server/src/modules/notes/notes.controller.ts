import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './notes.service';
import { resolveActor, type Actor } from '../../core/tenancy';

/**
 * Resolve the caller's tenancy scope.
 *
 * The scope comes from the token (via `core/tenancy`), never from a request body.
 */
const actor = async (req: Request): Promise<Actor> => resolveActor(req.user as any);

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const childId = (req.params as any).id || req.body?.childId;
    const data = await svc.createNote(await actor(req), childId, (req as any).file, req.body || {});
    res.status(201).json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const childId = (req.params as any).id || (req.params as any).childId || (req.query?.childId as string);
    const data = await svc.listNotes(await actor(req), childId);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.updateNote(await actor(req), req.params.id, req.body || {});
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.deleteNote(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const aiOcr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.aiOcrFallback(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const aiMake = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const childId = (req.params as any).id || req.body?.childId;
    const data = await svc.makeAINote(await actor(req), childId, {
      ...(req.body || {}),
      file: (req as any).file,
    });
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};
