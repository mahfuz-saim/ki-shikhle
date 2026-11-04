import { create as createNotification } from '../notifications/notifications.service';
import { prisma } from '../../db/client';
import { hashPassword, hashPin, verifyPin } from '../../services/password';
import { getPlanLimits, canCreateChild } from '../../services/entitlements';
import { badRequest, conflict, forbidden, notFound } from '../../utils/errors';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { memUsers } from '../auth/auth.service';

// In-memory fallback for dev without DB
export const memChildren: any[] = [
  {
    id: 'demo-child-1',
    parentId: 'parent-demo',
    name: 'Rahim Ahmed',
    nickname: 'Rahim',
    email: 'rahim@demo.com',
    password: 'Password123!',
    grade: 'Class 8',
    curriculum: 'NCTB',
    medium: 'Bangla',
    avatar: '/avatars/boy-1.png',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'demo-child-2',
    parentId: 'parent-demo',
    name: 'Tasnim Islam',
    nickname: 'Tasnim',
    email: 'tasnim@demo.com',
    password: 'Password123!',
    grade: 'Class 5',
    curriculum: 'NCTB',
    medium: 'Bangla',
    avatar: '/avatars/girl-1.png',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'demo-child-3',
    parentId: 'parent-demo',
    name: 'Fahim Islam',
    nickname: 'Fahim',
    email: 'fahim@demo.com',
    password: 'Password123!',
    grade: 'Class 11',
    curriculum: 'NCTB',
    medium: 'Bangla',
    avatar: '/avatars/boy-2.png',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

async function resolveParentContext(parentId: string, parentEmail?: string) {
  const isDemo =
    parentId === 'parent-demo' ||
    parentId === 'parent@demo.com' ||
    parentEmail?.toLowerCase() === 'parent@demo.com';

  let resolvedParentId = parentId;
  let foundDbParent = false;

  try {
    const dbParent = await prisma.user.findFirst({
      where: {
        OR: [
          { id: parentId },
          { email: 'parent@demo.com' },
          ...(isDemo ? [{ id: 'parent-demo' }] : []),
        ],
        deletedAt: null,
      },
    });
    if (dbParent) {
      resolvedParentId = dbParent.id;
      foundDbParent = true;
    }
  } catch {}

  const allPossibleParentIds = Array.from(
    new Set([resolvedParentId, parentId, ...(isDemo ? ['parent-demo', 'parent@demo.com'] : [])].filter(Boolean))
  );

  return {
    isDemo,
    resolvedParentId,
    foundDbParent,
    allPossibleParentIds,
  };
}

export async function listChildren(parentId: string, parentEmail?: string) {
  const { isDemo, resolvedParentId, allPossibleParentIds } = await resolveParentContext(parentId, parentEmail);

  try {
    const list = await prisma.child.findMany({
      where: { parentId: { in: allPossibleParentIds }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (list && list.length > 0) return list;
  } catch {}

  if (isDemo) {
    return memChildren.filter(
      (c: any) =>
        (allPossibleParentIds.includes(c.parentId) || c.parentId === 'parent-demo' || c.parentId === 'parent@demo.com') &&
        !c.deletedAt
    );
  }
  return memChildren.filter(
    (c: any) =>
      (allPossibleParentIds.includes(c.parentId) || c.parentId === resolvedParentId || c.parentId === parentId) &&
      !c.deletedAt
  );
}

export async function createChild(parentId: string, data: any, parentEmail?: string) {
  const normEmail =
    data.email && typeof data.email === 'string' && data.email.trim() ? data.email.trim().toLowerCase() : null;

  // Check if student email is already in use in memory or database
  if (normEmail) {
    const existingMemChild = (memChildren || []).find(
      (c: any) => c.email && c.email.toLowerCase() === normEmail && !c.deletedAt
    );
    if (existingMemChild) {
      throw conflict('An account with this student email already exists');
    }
    const existingMemUser = (memUsers || []).find(
      (u: any) => u.email && u.email.toLowerCase() === normEmail && !u.deletedAt
    );
    if (existingMemUser) {
      throw conflict('An account with this student email already exists');
    }
    try {
      const existingDbChild = await prisma.child.findFirst({
        where: { email: normEmail, deletedAt: null },
      });
      if (existingDbChild) {
        throw conflict('An account with this student email already exists');
      }
      const existingDbUser = await prisma.user.findFirst({
        where: { email: normEmail, deletedAt: null },
      });
      if (existingDbUser) {
        throw conflict('An account with this student email already exists');
      }
    } catch (e: any) {
      if (e.statusCode === 409 || e.code === 'P2002') throw e;
    }
  }

  const { isDemo, resolvedParentId, allPossibleParentIds } = await resolveParentContext(parentId, parentEmail);

  // Entitlement check
  let count = 0;
  let planCode = isDemo ? 'pro' : 'free';

  try {
    count = await prisma.child.count({
      where: {
        parentId: { in: allPossibleParentIds },
        deletedAt: null,
      },
    });

    const sub = await prisma.subscription.findFirst({
      where: {
        userId: { in: allPossibleParentIds },
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    if (sub?.plan?.code) {
      planCode = sub.plan.code;
    } else if (isDemo) {
      planCode = 'pro';
    }
  } catch {}

  // Ensure in-memory count is factored in for mock/dev fallback
  const memCount = (memChildren || []).filter(
    (c: any) => allPossibleParentIds.includes(c.parentId) && !c.deletedAt
  ).length;

  const effectiveCount = Math.max(count, memCount);

  if (!canCreateChild(effectiveCount, planCode)) {
    throw forbidden(`Plan ${planCode} allows max ${getPlanLimits(planCode).maxChildren} children`);
  }

  let passwordHash = null;
  if (data.password) {
    passwordHash = await hashPassword(data.password);
  }

  // Create child user account if email and password are provided
  if (normEmail && data.password) {
    try {
      const existing = await prisma.user.findUnique({ where: { email: normEmail } });
      if (existing && !existing.deletedAt) {
        throw conflict('An account with this student email already exists');
      }
      await prisma.user.create({
        data: {
          name: data.name,
          email: normEmail,
          passwordHash: passwordHash!,
          role: 'child',
          language: data.medium === 'English' ? 'en' : 'bn',
        },
      });
    } catch (e: any) {
      if (e.statusCode === 409 || e.code === 'P2002') {
        throw conflict('An account with this student email already exists');
      }
    }

    // Keep in-memory user updated so student can login immediately in offline/mock mode
    const existingInMem = (memUsers || []).find((u: any) => u.email?.toLowerCase() === normEmail);
    if (!existingInMem && Array.isArray(memUsers)) {
      memUsers.push({
        id: 'user-child-' + Date.now(),
        name: data.name,
        email: normEmail,
        password: data.password,
        role: 'child',
        language: data.medium === 'English' ? 'en' : 'bn',
        createdAt: new Date().toISOString(),
      });
    }
  }

  const pinHash = data.pin ? await hashPin(data.pin) : null;
  const payload: any = {
    parentId: resolvedParentId || 'parent-demo',
    name: data.name,
    nickname: data.nickname || '',
    grade: data.grade,
    curriculum: data.curriculum || 'NCTB',
    medium: data.medium || 'Bangla',
    avatar: data.avatar || null,
    email: normEmail,
    passwordHash,
    pinHash,
  };

  let child: any = null;

  try {
    child = await prisma.child.create({ data: payload });
  } catch (err: any) {
    if (err?.code === 'P2002' || err?.statusCode === 409) {
      throw conflict('An account with this student email already exists');
    }
    // If DB parent ID differs from parentId or FK constraint fails, attempt fallback
    try {
      if (resolvedParentId !== parentId && parentId) {
        child = await prisma.child.create({ data: { ...payload, parentId } });
      }
    } catch (fallbackErr: any) {
      if (fallbackErr?.code === 'P2002' || fallbackErr?.statusCode === 409) {
        throw conflict('An account with this student email already exists');
      }
    }
  }

  if (!child) {
    child = {
      id: 'child-' + Date.now(),
      ...payload,
      password: data.password, // for in-memory dev mock login
      createdAt: new Date().toISOString(),
    };
  }

  // Always keep in-memory children synced so student login & list work seamlessly
  const existingInMemChild = (memChildren || []).find(
    (c: any) => c.id === child.id || (normEmail && c.email === normEmail)
  );
  if (!existingInMemChild && Array.isArray(memChildren)) {
    memChildren.push({
      ...child,
      parentId: isDemo ? 'parent-demo' : (child.parentId || resolvedParentId),
      password: data.password,
    });
  }

  return child;
}

export async function getChild(parentId: string, id: string, parentEmail?: string) {
  const { isDemo, resolvedParentId, allPossibleParentIds } = await resolveParentContext(parentId, parentEmail);

  try {
    const c = await prisma.child.findFirst({
      where: {
        id,
        parentId: { in: allPossibleParentIds },
        deletedAt: null,
      },
    });
    if (c) return c;
  } catch {}

  const c = memChildren.find(
    (x: any) =>
      x.id === id &&
      (allPossibleParentIds.includes(x.parentId) ||
        x.parentId === parentId ||
        x.parentId === resolvedParentId ||
        (isDemo && (x.parentId === 'parent-demo' || x.parentId === 'parent@demo.com'))) &&
      !x.deletedAt
  );
  if (!c) throw notFound('Child not found');
  return c;
}

export async function updateChild(parentId: string, id: string, data: any, parentEmail?: string) {
  await getChild(parentId, id, parentEmail);
  const updateData: any = { ...data };
  if (data.pin) updateData.pinHash = await hashPin(data.pin);
  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
  }
  delete updateData.pin;

  try {
    const updated = await prisma.child.update({ where: { id }, data: updateData });
    return updated;
  } catch {
    const idx = memChildren.findIndex((c: any) => c.id === id);
    if (idx >= 0) {
      Object.assign(memChildren[idx], updateData);
      if (data.password) memChildren[idx].password = data.password;
      return memChildren[idx];
    }
    throw notFound('Child not found');
  }
}

export async function deleteChild(parentId: string, id: string, parentEmail?: string) {
  await getChild(parentId, id, parentEmail);
  try {
    await prisma.child.update({ where: { id }, data: { deletedAt: new Date() } });
  } catch {
    const idx = memChildren.findIndex((c: any) => c.id === id);
    if (idx >= 0) memChildren[idx].deletedAt = new Date();
  }
  return { message: 'Child deleted (soft)' };
}

export async function setPin(parentId: string, id: string, pin: string, parentEmail?: string) {
  const hash = await hashPin(pin);
  return updateChild(parentId, id, { pinHash: hash } as any, parentEmail);
}

export async function enterChildMode(parentId: string, childId: string, pin: string, parentEmail?: string) {
  const child: any = await getChild(parentId, childId, parentEmail);
  if (child.pinHash) {
    const ok = await verifyPin(child.pinHash, pin);
    if (!ok) throw badRequest('Invalid PIN');
  }

  // child scoped token (limited routes, 8h)
  const token = jwt.sign(
    { userId: parentId || 'parent-demo', childId, role: 'child', type: 'child' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '8h' }
  );
  return { token, child: { id: child.id, name: child.name, grade: child.grade } };
}

export interface UnloggedStudyAlertConfig {
  childId: string;
  enabled: boolean;
  time: string; // e.g. "21:00"
  channel: 'in_app' | 'email' | 'all';
  daysOfWeek: number[];
  updatedAt?: string;
}

export const memUnloggedAlertConfigs: Record<string, UnloggedStudyAlertConfig> = {
  'demo-child-1': {
    childId: 'demo-child-1',
    enabled: true,
    time: '21:00',
    channel: 'all',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  'demo-child-2': {
    childId: 'demo-child-2',
    enabled: true,
    time: '20:30',
    channel: 'all',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  'demo-child-3': {
    childId: 'demo-child-3',
    enabled: true,
    time: '22:00',
    channel: 'all',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
};

export async function getUnloggedAlertConfig(parentId: string, childId: string, parentEmail?: string): Promise<UnloggedStudyAlertConfig> {
  await getChild(parentId, childId, parentEmail);
  const existing = memUnloggedAlertConfigs[childId];
  if (existing) return existing;

  const defaultCfg: UnloggedStudyAlertConfig = {
    childId,
    enabled: true,
    time: '21:00',
    channel: 'all',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  };
  memUnloggedAlertConfigs[childId] = defaultCfg;
  return defaultCfg;
}

export async function saveUnloggedAlertConfig(
  parentId: string,
  childId: string,
  config: Partial<UnloggedStudyAlertConfig>,
  parentEmail?: string
): Promise<UnloggedStudyAlertConfig> {
  await getChild(parentId, childId, parentEmail);
  const current = await getUnloggedAlertConfig(parentId, childId, parentEmail);
  const updated: UnloggedStudyAlertConfig = {
    ...current,
    ...config,
    childId,
    updatedAt: new Date().toISOString(),
  };
  memUnloggedAlertConfigs[childId] = updated;
  return updated;
}

export async function triggerTestUnloggedAlert(parentId: string, childId: string, parentEmail?: string) {
  const child: any = await getChild(parentId, childId, parentEmail);
  const cfg = await getUnloggedAlertConfig(parentId, childId, parentEmail);

  const notif = await createNotification(parentId, 'missed_sessions', {
    childId,
    childName: child.name,
    time: cfg.time,
    title: 'দৈনিক পড়ার বিবরণ অ্যালার্ট (Unlogged Study Alert)',
    message: `${child.name}-এর আজকের কোনো পড়ার বিবরণ এখনও লিপিবদ্ধ করা হয়নি। নির্ধারিত সময়: ${cfg.time}। শিক্ষার্থীকে পোর্টাল থেকে পড়ার বিবরণ যুক্ত করতে বলুন।`,
  });

  return { success: true, notification: notif };
}
