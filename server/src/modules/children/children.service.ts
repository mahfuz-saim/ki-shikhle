import { prisma } from '../../db/client';
import { hashPassword, hashPin, verifyPin } from '../../services/password';
import { getPlanLimits, canCreateChild } from '../../services/entitlements';
import { badRequest, conflict, forbidden, notFound } from '../../utils/errors';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

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

export async function listChildren(parentId: string) {
  try {
    const list = await prisma.child.findMany({ where: { parentId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
    if (list && list.length > 0) return list;
  } catch {}

  if (parentId === 'parent-demo' || parentId === 'parent@demo.com') {
    return memChildren.filter((c: any) => c.parentId === 'parent-demo' && !c.deletedAt);
  }
  return memChildren.filter((c: any) => c.parentId === parentId && !c.deletedAt);
}

export async function createChild(parentId: string, data: any) {
  // entitlement check
  try {
    const count = await prisma.child.count({ where: { parentId, deletedAt: null } });
    const sub = await prisma.subscription.findFirst({ where: { userId: parentId }, include: { plan: true }, orderBy: { createdAt: 'desc' } });
    const planCode = sub?.plan?.code || 'free';
    if (!canCreateChild(count, planCode)) throw forbidden(`Plan ${planCode} allows max ${getPlanLimits(planCode).maxChildren} children`);
  } catch (e: any) {
    if (e.statusCode === 403) throw e;
  }

  let passwordHash = null;
  if (data.password) {
    passwordHash = await hashPassword(data.password);
  }

  // Create child user account if email and password are provided
  if (data.email && data.password) {
    try {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing && !existing.deletedAt) {
        throw conflict('An account with this student email already exists');
      }
      await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: passwordHash!,
          role: 'child',
          language: data.medium === 'English' ? 'en' : 'bn',
        },
      });
    } catch (e: any) {
      if (e.statusCode === 409) throw e;
    }
  }

  const pinHash = data.pin ? await hashPin(data.pin) : null;
  const payload: any = {
    parentId,
    name: data.name,
    nickname: data.nickname,
    grade: data.grade,
    curriculum: data.curriculum || 'NCTB',
    medium: data.medium || 'Bangla',
    avatar: data.avatar,
    email: data.email || null,
    passwordHash,
    pinHash,
  };

  try {
    const child = await prisma.child.create({ data: payload });
    return child;
  } catch {
    const child = {
      id: 'child-' + Date.now(),
      ...payload,
      password: data.password, // for in-memory dev mock login
      createdAt: new Date().toISOString(),
    };
    memChildren.push(child);
    return child;
  }
}

export async function getChild(parentId: string, id: string) {
  try {
    const c = await prisma.child.findFirst({ where: { id, parentId, deletedAt: null } });
    if (!c) throw notFound('Child not found');
    return c;
  } catch (e: any) {
    if (e.statusCode === 404) throw e;
    const c = memChildren.find(
      (x: any) =>
        x.id === id &&
        (x.parentId === parentId || parentId === 'parent-demo' || parentId === 'parent@demo.com') &&
        !x.deletedAt
    );
    if (!c) throw notFound('Child not found');
    return c;
  }
}

export async function updateChild(parentId: string, id: string, data: any) {
  await getChild(parentId, id);
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

export async function deleteChild(parentId: string, id: string) {
  await getChild(parentId, id);
  try {
    await prisma.child.update({ where: { id }, data: { deletedAt: new Date() } });
  } catch {
    const idx = memChildren.findIndex((c: any) => c.id === id);
    if (idx >= 0) memChildren[idx].deletedAt = new Date();
  }
  return { message: 'Child deleted (soft)' };
}

export async function setPin(parentId: string, id: string, pin: string) {
  const hash = await hashPin(pin);
  return updateChild(parentId, id, { pinHash: hash } as any);
}

export async function enterChildMode(parentId: string, childId: string, pin: string) {
  const child: any = await getChild(parentId, childId);
  if (child.pinHash) {
    const ok = await verifyPin(child.pinHash, pin);
    if (!ok) throw badRequest('Invalid PIN');
  }

  // child scoped token (limited routes, 8h)
  const token = jwt.sign({ userId: parentId, childId, role: 'child', type: 'child' }, env.JWT_ACCESS_SECRET, { expiresIn: '8h' });
  return { token, child: { id: child.id, name: child.name, grade: child.grade } };
}
