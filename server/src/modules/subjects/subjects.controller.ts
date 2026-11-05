import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './subjects.service';
import { resolveActor, type Actor } from '../../core/tenancy';

/**
 * Resolve the caller's tenancy scope.
 *
 * The scope comes from the token (via `core/tenancy`), never from a request body.
 */
const actor = async (req: Request): Promise<Actor> => resolveActor(req.user as any);

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.listSubjects(await actor(req));
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

/**
 * The subjects one child studies.
 *
 * The child id is scoped by `assertChildAccess`, so a caller cannot read another
 * account's child's subject list by guessing the id.
 */
export const listForChild = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.listSubjectsForChild(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

/** Assign a subject to a child. Both sides must belong to the caller's account. */
export const assign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subjectId = (req.body?.subjectId || req.params.subjectId) as string;
    const data = await svc.assignToChild(await actor(req), req.params.id, subjectId);
    res.status(201).json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

/** Remove a subject assignment from a child. */
export const unassign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.unassignFromChild(await actor(req), req.params.id, req.params.subjectId);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.createCustom(await actor(req), req.body);
    res.status(201).json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.updateSubject(await actor(req), req.params.id, req.body);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.deleteSubject(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};
