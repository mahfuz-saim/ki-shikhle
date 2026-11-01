import cron from 'node-cron';
import { logger } from '../utils/logger';
import { prisma } from '../db/client';
import { emailService } from '../services/email';
import { env } from '../config/env';

/** Trial reminders (day 10/13/15) + expiry → read-only. Safe to run repeatedly. */
export async function runTrialReminders() {
  const now = new Date();
  const users = await prisma.user.findMany({ where: { trialEndsAt: { not: null }, deletedAt: null } });
  let reminded = 0;
  let expired = 0;
  for (const u of users) {
    const daysLeft = Math.ceil((new Date(u.trialEndsAt!).getTime() - now.getTime()) / 86400000);
    if ([5, 2, 0].includes(daysLeft)) {
      await emailService.send(
        u.email,
        `Trial reminder — ${daysLeft} days left`,
        `<p>Hi ${u.name}, your trial ends in ${daysLeft} days. Upgrade to keep data.</p>`
      );
      await prisma.notification
        .create({ data: { userId: u.id, type: 'trial_reminder', payloadJson: { daysLeft } } })
        .catch(() => {});
      reminded++;
    }
    if (daysLeft <= 0) {
      const subs = await prisma.subscription.findMany({ where: { userId: u.id } });
      for (const s of subs) {
        await prisma.subscription.update({ where: { id: s.id }, data: { status: 'expired' } }).catch(() => {});
      }
      expired++;
    }
  }
  return { reminded, expired };
}

/** Hard-purge accounts soft-deleted more than 7 days ago. */
export async function runCleanup() {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const toPurge = await prisma.user.findMany({ where: { deletedAt: { lt: weekAgo } } });
  let purged = 0;
  for (const u of toPurge) {
    await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
    purged++;
  }
  return { purged };
}

/** Run every scheduled job once — used by the HTTP trigger (Cloudflare Cron Triggers etc.). */
export async function runAllJobs() {
  const results: Record<string, any> = {};
  try {
    results.trialReminders = await runTrialReminders();
  } catch (e) {
    logger.warn({ err: (e as Error).message }, 'trial reminder job failed');
    results.trialReminders = { error: (e as Error).message };
  }
  try {
    results.cleanup = await runCleanup();
  } catch (e) {
    logger.warn({ err: (e as Error).message }, 'cleanup job failed');
    results.cleanup = { error: (e as Error).message };
  }
  return results;
}

export function startCrons() {
  if (!env.ENABLE_CRON) {
    logger.info('⏰ In-process cron disabled (ENABLE_CRON=false) — use POST /api/v1/jobs/run');
    return;
  }
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
