import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as svc from './billing.service';
import { resolveActor, type Actor } from '../../core/tenancy';

/**
 * Resolve the caller's tenancy scope.
 *
 * The scope comes from the token (via `core/tenancy`), never from a request body.
 */
const actor = async (req: Request): Promise<Actor> => resolveActor(req.user as any);

export const plans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.getPlans();
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const subscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.getSubscription(await actor(req));
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const checkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.demoCheckout(await actor(req), req.body);
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const cancel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.cancelSubscription(await actor(req));
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};

export const invoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await svc.getInvoices(await actor(req));
    res.json({ success: true, data: d, error: null });
  } catch (e) {
    next(e);
  }
};
