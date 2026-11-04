import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './children.service';

const getParentId = (req: Request): string => {
  return (req.user as any)?.userId || (req.user as any)?.id || 'parent-demo';
};

const getParentEmail = (req: Request): string | undefined => {
  return (req.user as any)?.email;
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.listChildren(getParentId(req), getParentEmail(req));
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.createChild(getParentId(req), req.body, getParentEmail(req));
    res.status(201).json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getChild(getParentId(req), req.params.id, getParentEmail(req));
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.updateChild(getParentId(req), req.params.id, req.body, getParentEmail(req));
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.deleteChild(getParentId(req), req.params.id, getParentEmail(req));
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const setPin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.setPin(getParentId(req), req.params.id, req.body.pin, getParentEmail(req));
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const enter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.enterChildMode(getParentId(req), req.params.id, req.body.pin, getParentEmail(req));
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
    const data = await svc.getUnloggedAlertConfig(getParentId(req), req.params.id, getParentEmail(req));
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const saveUnloggedAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.saveUnloggedAlertConfig(getParentId(req), req.params.id, req.body, getParentEmail(req));
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const testUnloggedAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.triggerTestUnloggedAlert(getParentId(req), req.params.id, getParentEmail(req));
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};
