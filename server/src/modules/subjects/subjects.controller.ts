import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './subjects.service';
export const list = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await svc.listSubjects((req.user as any).userId, req.query.childId as string); res.json({ success: true, data, error: null }); } catch (e) { next(e); }
};
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await svc.createCustom((req.user as any).userId, req.body); res.status(201).json({ success: true, data, error: null }); } catch (e) { next(e); }
};
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await svc.updateSubject((req.user as any).userId, req.params.id, req.body); res.json({ success: true, data, error: null }); } catch (e) { next(e); }
};
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await svc.deleteSubject((req.user as any).userId, req.params.id); res.json({ success: true, data, error: null }); } catch (e) { next(e); }
};
