import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './entries.service';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await svc.listEntries(req.params.id, (req.user as any).userId, req.query as any); res.json({ success: true, data, error: null }); } catch (e) { next(e); }
};
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await svc.createEntry(req.params.id, (req.user as any).userId, req.body, (req.user as any).role); res.status(201).json({ success: true, data, error: null }); } catch (e) { next(e); }
};
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await svc.updateEntry(req.params.id, (req.user as any).userId, req.body, (req.user as any).role); res.json({ success: true, data, error: null }); } catch (e) { next(e); }
};
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await svc.deleteEntry(req.params.id, (req.user as any).userId); res.json({ success: true, data, error: null }); } catch (e) { next(e); }
};
export const verify = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await svc.verifyEntry(req.params.id, (req.user as any).userId); res.json({ success: true, data, error: null }); } catch (e) { next(e); }
};
export const structureVoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.structureVoiceLog(
      req.body.speechText || '',
      req.params.id,
      (req.user as any).userId
    );
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};
