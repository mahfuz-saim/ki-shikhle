/**
 * In-process scheduler for Node hosts (local dev, Docker, VPS).
 *
 * Cloudflare Workers have no long-lived process — use Cron Triggers instead, which call
 * the `scheduled` handler in `src/worker.ts`. That is why this file is imported only by
 * `src/index.ts` and never by `src/worker.ts`.
 */
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { runAllJobs, runCleanup, runTrialReminders } from './jobs';

export function startCrons() {
  if (!env.ENABLE_CRON) {
    logger.info('⏰ In-process cron disabled (ENABLE_CRON=false) — use POST /api/v1/jobs/run');
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cron = require('node-cron');
  cron.schedule('0 3 * * *', async () => {
    try {
      logger.info(await runTrialReminders(), 'trial reminder cron');
    } catch (e) {
      logger.warn({ err: (e as Error).message }, 'trial cron failed');
    }
  });
  cron.schedule('0 4 * * *', async () => {
    try {
      logger.info(await runCleanup(), 'cleanup cron');
    } catch {
      /* no DB in dev */
    }
  });
  logger.info('⏰ Crons scheduled: trial reminders (3am), purge (4am)');
}

export { runAllJobs };
