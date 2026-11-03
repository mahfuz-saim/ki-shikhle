import { prisma } from '../../db/client';

const memNotifs: any[] = [];

export async function list(userId: string) {
  let items: any[] = [];
  try {
    items = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch {
    items = memNotifs.filter((n: any) => n.userId === userId);
  }

  // Pre-fetch children for lookup
  let children: any[] = [];
  try {
    children = await prisma.child.findMany({ where: { parentId: userId } });
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
      else if (payload.childId === 'demo-child-1') childName = 'Rahim Ahmed';
      else if (payload.childId === 'demo-child-2') childName = 'Tasnim Islam';
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

export async function markRead(userId: string, id: string) {
  try {
    return await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  } catch {
    const n = memNotifs.find((x: any) => x.id === id);
    if (n) n.readAt = new Date();
    return n;
  }
}

export async function markAllRead(userId: string) {
  try {
    await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  } catch {}
  return { message: 'All read' };
}

export async function create(userId: string, type: string, payload: any) {
  try {
    return await prisma.notification.create({ data: { userId, type: type as any, payloadJson: payload } });
  } catch {
    const n = {
      id: 'notif-' + Date.now(),
      userId,
      type,
      payloadJson: payload,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    memNotifs.push(n);
    return n;
  }
}
