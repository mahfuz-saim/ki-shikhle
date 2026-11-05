import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './dashboard.service';
import { resolveActor, type Actor } from '../../core/tenancy';

/**
 * Resolve the caller's tenancy scope.
 *
 * The scope comes from the token (via `core/tenancy`), never from a request body.
 */
const actor = async (req: Request): Promise<Actor> => resolveActor(req.user as any);

export const summary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.summary(await actor(req), req.params.id);
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const studyTime = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.studyTime(await actor(req), req.params.id, req.query.range as string);
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const subjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.subjectDistribution(await actor(req), req.params.id);
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const scores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.scoreTrend(await actor(req), req.params.id);
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const topics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.weakestStrongest(await actor(req), req.params.id);
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const mastery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.subjectMastery(await actor(req), req.params.id);
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const consistency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.consistency(await actor(req), req.params.id);
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const overview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.overview(await actor(req));
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};
