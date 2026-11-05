import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './children.service';
import { resolveActor, type Actor } from '../../core/tenancy';

/**
 * Resolve the caller's tenancy scope.
 *
 * This replaces the old `getParentId` helper, which fell back to the literal
 * `'parent-demo'` when `req.user` was missing — silently attributing an
 * unauthenticated request to the demo tenant.
 */
const actor = async (req: Request): Promise<Actor> => resolveActor(req.user as any);

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.listChildren(await actor(req));
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.createChild(await actor(req), req.body);
    res.status(201).json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getChild(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.updateChild(await actor(req), req.params.id, req.body);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.deleteChild(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const setPin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.setPin(await actor(req), req.params.id, req.body.pin);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const enter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.enterChildMode(await actor(req), req.params.id, req.body.pin);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const exit = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ success: true, data: { message: 'Exited child mode — use parent token again' }, error: null });
};

export const getUnloggedAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getUnloggedAlertConfig(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const saveUnloggedAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.saveUnloggedAlertConfig(await actor(req), req.params.id, req.body);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const testUnloggedAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.triggerTestUnloggedAlert(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};
