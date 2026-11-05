import { Router, type Request, type Response, type NextFunction } from '../../platform/express-compat';
import { env } from '../../config/env';
import { runAllJobs } from '../../jobs/jobs';
import { unauthorized } from '../../utils/errors';

/**
 * HTTP trigger for scheduled jobs.
 *
 * Needed on platforms without a long-lived process (Cloudflare Workers) and useful
 * anywhere else as a manual/on-demand run. Call it from a Cloudflare Cron Trigger:
 *   curl -X POST https://<api>/api/v1/jobs/run -H "x-cron-secret: $CRON_SECRET"
 *
 * The secret is required **unconditionally**. It used to be skipped in development,
 * which left the endpoint wide open on every dev machine — and because the endpoint
 * purges expired accounts and spends AI quota, an unauthenticated caller could trigger
 * both. When CRON_SECRET is unset the endpoint is simply disabled.
 */
const router = Router();

router.post('/jobs/run', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!env.CRON_SECRET) throw unauthorized('Jobs endpoint disabled: set CRON_SECRET');
    const provided = String(req.header('x-cron-secret') || req.header('authorization') || '').replace(/^Bearer /, '');
    if (provided !== env.CRON_SECRET) throw unauthorized('Invalid cron secret');
    const results = await runAllJobs();
    res.json({ success: true, data: { ranAt: new Date().toISOString(), results }, error: null });
  } catch (e) {
    next(e);
  }
});

export default router;
