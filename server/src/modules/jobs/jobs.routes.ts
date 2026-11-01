import { Router, type Request, type Response, type NextFunction } from '../../platform/express-compat';
import { env } from '../../config/env';
import { runAllJobs } from '../../jobs/cron';
import { unauthorized } from '../../utils/errors';

/**
 * HTTP trigger for scheduled jobs.
 *
 * Needed on platforms without a long-lived process (Cloudflare Workers) and useful
 * anywhere else as a manual/on-demand run. Protect it with CRON_SECRET and call it
 * from a Cloudflare Cron Trigger:
 *   curl -X POST https://<api>/api/v1/jobs/run -H "x-cron-secret: $CRON_SECRET"
 * When CRON_SECRET is unset the endpoint is disabled outside development.
 */
const router = Router();

router.post('/jobs/run', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provided = String(req.header('x-cron-secret') || req.header('authorization') || '').replace(/^Bearer /, '');
    if (!env.CRON_SECRET) {
      if (env.NODE_ENV === 'production') throw unauthorized('Jobs endpoint disabled: set CRON_SECRET');
    } else if (provided !== env.CRON_SECRET) {
      throw unauthorized('Invalid cron secret');
    }
    const results = await runAllJobs();
    res.json({ success: true, data: { ranAt: new Date().toISOString(), results }, error: null });
  } catch (e) {
    next(e);
  }
});

export default router;
