import cron from 'node-cron';
import { logger } from '../utils/logger';
import { prisma } from '../db/client';
import { emailService } from '../services/email';

export function startCrons() {
  // Trial reminders at day 10,13,15 — daily check 3am UTC
  cron.schedule('0 3 * * *', async () => {
    logger.info('Trial reminder cron');
    try {
      const now = new Date();
      const users = await prisma.user.findMany({ where: { trialEndsAt: { not: null }, deletedAt: null } });
      for (const u of users) {
        const daysLeft = Math.ceil((new Date(u.trialEndsAt!).getTime() - now.getTime()) / 86400000);
        if ([5,2,0].includes(daysLeft)) { // ~ day 10,13,15 of 15
          await emailService.send(u.email, `Trial reminder — ${daysLeft} days left`, `<p>Hi ${u.name}, your trial ends in ${daysLeft} days. Upgrade to keep data.</p>`);
          await prisma.notification.create({ data: { userId: u.id, type: 'trial_reminder', payloadJson: { daysLeft } } }).catch(()=>{});
        }
        if (daysLeft <= 0) {
          // expiry read-only: keep data, lock AI
          const subs = await prisma.subscription.findMany({ where: { userId: u.id } });
          for (const s of subs) await prisma.subscription.update({ where: { id: s.id }, data: { status: 'expired' } }).catch(()=>{});
          logger.info({ userId: u.id }, 'Trial expired → expired status');
        }
      }
    } catch (e) { logger.warn('Trial cron failed (no DB)', e); }
  });

  // 3-day grace + cleanup soft-deleted after 7 days — daily 4am
  cron.schedule('0 4 * * *', async () => {
    logger.info('Cleanup cron');
    try {
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      const toPurge = await prisma.user.findMany({ where: { deletedAt: { lt: weekAgo } } });
      for (const u of toPurge) {
        // hard purge personal data + files
        await prisma.user.delete({ where: { id: u.id } }).catch(()=>{});
        logger.info({ userId: u.id }, 'Hard purged');
      }
    } catch {}
  });

  logger.info('⏰ Crons scheduled: trial reminders, expiry read-only, 7-day purge');
}
