import cron from 'node-cron';
import { logger } from '../utils/logger';

export function startCrons() {
  // Trial reminders daily at 9am Dhaka ~ 3am UTC
  cron.schedule('0 3 * * *', async () => {
    logger.info('Running trial reminder cron (stub)');
    // TODO: check trial_ends_at = 10,13,15 days
  });
  // Cleanup soft-deleted accounts after 7 days
  cron.schedule('0 4 * * *', async () => {
    logger.info('Running cleanup cron (stub)');
  });
  logger.info('⏰ Crons scheduled');
}
