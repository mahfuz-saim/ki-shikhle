import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './quizzes.service';

export const generate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.generateQuiz(req.params.id, (req.user as any).userId, req.body, (req.user as any).userId);
    res.status(201).json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.listQuizzes(req.params.id, (req.user as any).userId);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getQuiz(req.params.id, (req.user as any).userId);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const patchQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.updateQuestion(req.params.id, req.params.qid, (req.user as any).userId, req.body);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const regenQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.regenerateQuestion(req.params.id, req.params.qid, (req.user as any).userId);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const assign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.assignQuiz(req.params.id, (req.user as any).userId);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const createAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.createAttempt(req.params.id, req.body.childId || (req.params as any).childId, (req.user as any).userId);
    res.status(201).json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const saveAnswers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.saveAnswers(req.params.id, (req.user as any).userId, req.body.answers);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const submit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.submitAttempt(req.params.id, (req.user as any).userId);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const getAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getAttempt(req.params.id, (req.user as any).userId);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const report = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.reportQuestion(req.params.id, (req.user as any).userId);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const getAutoSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getAutoQuizSchedule(req.params.id, (req.user as any).userId);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const saveAutoSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.saveAutoQuizSchedule(req.params.id, (req.user as any).userId, req.body);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const runAutoSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.runAutoQuizSchedule(req.params.id, (req.user as any).userId);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};
