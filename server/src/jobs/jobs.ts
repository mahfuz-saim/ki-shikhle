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

/** Auto Quiz Scheduler: generates scheduled quizzes for children based on daily routine and config. */
export async function runAutoQuizSchedulerJob() {
  const { runAutoQuizSchedule, getAutoQuizSchedule } = await import('../modules/quizzes/quizzes.service');
  const { memChildren } = await import('../modules/children/children.service');

  let children: any[] = [];
  try {
    children = await prisma.child.findMany({ where: { deletedAt: null } });
  } catch {}
  if (!children || children.length === 0) {
    children = memChildren.filter((c: any) => !c.deletedAt);
  }

  const now = new Date();
  const currentDayOfWeek = now.getDay();
  let generatedCount = 0;
  const details: any[] = [];

  for (const child of children) {
    try {
      const schedule = await getAutoQuizSchedule(child.id, child.parentId);
      if (!schedule || !schedule.enabled) continue;
      if (schedule.daysOfWeek && !schedule.daysOfWeek.includes(currentDayOfWeek)) continue;

      if (schedule.lastGeneratedAt) {
        const lastGen = new Date(schedule.lastGeneratedAt).getTime();
        if (now.getTime() - lastGen < 16 * 3600000) {
          continue;
        }
      }

      const res = await runAutoQuizSchedule(child.id, child.parentId);
      generatedCount++;
      details.push({
        childId: child.id,
        quizId: res.quiz?.id,
        title: res.quiz?.title,
        questionsCount: res.quiz?.questions?.length,
        timeLimitMin: res.quiz?.timeLimitMin,
      });
    } catch (err: any) {
      logger.warn({ err: (err as Error).message, childId: child.id }, 'Auto quiz scheduler failed for child');
    }
  }

  return { generatedCount, details };
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
  try {
    results.autoQuizScheduler = await runAutoQuizSchedulerJob();
  } catch (e) {
    logger.warn({ err: (e as Error).message }, 'auto quiz scheduler job failed');
    results.autoQuizScheduler = { error: (e as Error).message };
  }
  return results;
}
