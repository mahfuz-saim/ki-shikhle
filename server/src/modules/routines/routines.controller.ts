import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './routines.service';
import { resolveActor, type Actor } from '../../core/tenancy';

/**
 * Resolve the caller's tenancy scope.
 *
 * The scope comes from the token (via `core/tenancy`), never from a request body.
 */
const actor = async (req: Request): Promise<Actor> => resolveActor(req.user as any);

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.listRoutines(await actor(req), req.params.id);
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.createRoutine(await actor(req), req.params.id, req.body);
    res.status(201).json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.updateRoutine(await actor(req), req.params.id, req.body);
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.deleteRoutine(await actor(req), req.params.id);
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const addException = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.addException(await actor(req), req.params.id, req.body);
    res.status(201).json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const deleteException = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.deleteException(await actor(req), req.params.id);
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const schedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query as any;
    const d = await svc.getSchedule(await actor(req), req.params.id, from, to);
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const listCompletions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query as any;
    const d = await svc.listCompletions(await actor(req), req.params.id, from, to);
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const setCompletion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.setCompletion(await actor(req), req.params.id, req.body);
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};
