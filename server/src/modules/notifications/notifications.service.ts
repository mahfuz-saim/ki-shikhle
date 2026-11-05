import { prisma } from '../../db/client';
import { store } from '../../core/store';
import { assertEntityAccess, type Actor } from '../../core/tenancy';

/**
 * Notifications belong to the **account**, not to a child.
 *
 * `markRead` used to ignore the caller entirely and update whatever row matched the id,
 * so any authenticated user could mark (and therefore read) another tenant's notification.
 */

/**
 * The account whose notifications the actor may read.
 *
 * For a parent this is their own account. For a **child** it is the child's own
 * login identity — not the parent. `actor.ownerId` is the parent's id for a child
 * actor, so filtering on it handed the child their parent's inbox: siblings' scores,
 * trial reminders and billing alerts. The child's own `users` row is the account
 * their notifications belong to.
 */
function notificationAccountId(actor: Actor): string {
  return actor.role === 'child' ? actor.userId || actor.childId || actor.ownerId : actor.ownerId;
}

export async function list(actor: Actor) {
  const accountId = notificationAccountId(actor);
  let items: any[] = [];
  try {
    items = await prisma.notification.findMany({
      where: { userId: accountId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch {
    items = store.notifications.forOwner(accountId);
  }

  // Pre-fetch children for lookup
  let children: any[] = [];
  try {
    children = await prisma.child.findMany({
      where: { parentId: actor.ownerId },
      select: { id: true, name: true },
    });
  } catch {}

  return items.map((n) => {
    let payload = n.payloadJson;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {}
    }
    if (!payload || typeof payload !== 'object') payload = {};

    let childName = payload.childName;
    if (!childName && payload.childId) {
      const c = children.find((ch) => ch.id === payload.childId);
      if (c) childName = c.name;
    }

    let title = n.title;
    let message = n.message;
    let link = n.link;

    if (n.type === 'quiz_completed' || n.type === 'results_ready') {
      title = 'Quiz Completed';
      const score = payload.score ?? 0;
      const maxScore = payload.maxScore ?? 0;
      const cName = childName || 'Student';
      message = `${cName} completed the quiz with score ${score}/${maxScore}.`;
      link = payload.attemptId ? `/attempts/${payload.attemptId}/results` : '/quizzes';
    } else if (n.type === 'trial_reminder') {
      title = 'Trial Reminder';
      message = 'Your 15-day free trial is currently active.';
      link = '/billing';
    } else if (n.type === 'missed_sessions' || n.type === 'missed_session') {
      title = 'Missed Routine Session';
      message = 'A scheduled study session was missed without a learning log.';
      link = '/schedule';
    }

    return {
      ...n,
      title: title || n.type,
      message,
      link,
      payloadJson: {
        ...payload,
        childName,
      },
    };
  });
}

export async function markRead(actor: Actor, id: string) {
  // Ownership first: a notification id from another tenant must be a 404, not a silent update.
  await assertEntityAccess(actor, { kind: 'notification', id });
  const accountId = notificationAccountId(actor);
  try {
    return await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  } catch {
    const n = store.notifications.find(accountId, id);
    if (n) n.readAt = new Date();
    return n;
  }
}

export async function markAllRead(actor: Actor) {
  const accountId = notificationAccountId(actor);
  try {
    await prisma.notification.updateMany({ where: { userId: accountId, readAt: null }, data: { readAt: new Date() } });
  } catch {
    for (const n of store.notifications.forOwner(accountId)) {
      if (!n.readAt) n.readAt = new Date();
    }
  }
  return { message: 'All read' };
}

export async function create(userId: string, type: string, payload: any) {
  try {
    return await prisma.notification.create({ data: { userId, type: type as any, payloadJson: payload } });
  } catch {
    const n = {
      id: 'notif-' + Date.now(),
      ownerId: userId,
      userId,
      type,
      payloadJson: payload,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    store.notifications.add(n as any);
    return n;
  }
}
