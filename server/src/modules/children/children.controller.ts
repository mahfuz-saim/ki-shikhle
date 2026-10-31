import { Request, Response, NextFunction } from 'express';
import * as svc from './children.service';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await svc.listChildren((req.user as any).userId); res.json({ success: true, data, error: null }); } catch (e) { next(e); }
};
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await svc.createChild((req.user as any).userId, req.body); res.status(201).json({ success: true, data, error: null }); } catch (e) { next(e); }
};
export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await svc.getChild((req.user as any).userId, req.params.id); res.json({ success: true, data, error: null }); } catch (e) { next(e); }
};
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await svc.updateChild((req.user as any).userId, req.params.id, req.body); res.json({ success: true, data, error: null }); } catch (e) { next(e); }
};
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await svc.deleteChild((req.user as any).userId, req.params.id); res.json({ success: true, data, error: null }); } catch (e) { next(e); }
};
export const setPin = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await svc.setPin((req.user as any).userId, req.params.id, req.body.pin); res.json({ success: true, data, error: null }); } catch (e) { next(e); }
};
export const enter = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await svc.enterChildMode((req.user as any).userId, req.params.id, req.body.pin); res.json({ success: true, data, error: null }); } catch (e) { next(e); }
};
export const exit = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ success: true, data: { message: 'Exited child mode — use parent token again' }, error: null });
};
