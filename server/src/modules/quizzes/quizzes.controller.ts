import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './quizzes.service';
import { resolveActor, type Actor } from '../../core/tenancy';

/**
 * Resolve the caller's tenancy scope.
 *
 * The scope comes from the token (via `core/tenancy`), never from a request body.
 */
const actor = async (req: Request): Promise<Actor> => resolveActor(req.user as any);

export const generate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const a = await actor(req);
    const data = await svc.generateQuiz(a, req.params.id, req.body, a.ownerId);
    res.status(201).json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.listQuizzes(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getQuiz(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const patchQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.updateQuestion(await actor(req), req.params.id, req.params.qid, req.body);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const regenQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.regenerateQuestion(await actor(req), req.params.id, req.params.qid);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const assign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.assignQuiz(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const createAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.createAttempt(await actor(req), req.params.id, req.body.childId || (req.params as any).childId);
    res.status(201).json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const saveAnswers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.saveAnswers(await actor(req), req.params.id, req.body.answers);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const submit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.submitAttempt(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const report = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.reportQuestion(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const getAutoSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getAutoQuizSchedule(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const saveAutoSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.saveAutoQuizSchedule(await actor(req), req.params.id, req.body);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};

export const runAutoSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.runAutoQuizSchedule(await actor(req), req.params.id);
    res.json({ success: true, data, error: null });
  } catch (e) {
    next(e);
  }
};
