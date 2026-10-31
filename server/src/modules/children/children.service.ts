import { prisma } from '../../db/client';
import { hashPin, verifyPin } from '../../services/password';
import { getPlanLimits, canCreateChild } from '../../services/entitlements';
import { badRequest, forbidden, notFound } from '../../utils/errors';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

// In-memory fallback for dev without DB
const memChildren: any[] = [];

export async function listChildren(parentId: string) {
  try {
    const list = await prisma.child.findMany({ where: { parentId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
    return list;
  } catch { return memChildren.filter((c: any) => c.parentId === parentId); }
}

export async function createChild(parentId: string, data: any) {
  // entitlement check
  try {
    const count = await prisma.child.count({ where: { parentId, deletedAt: null } });
    const sub = await prisma.subscription.findFirst({ where: { userId: parentId }, include: { plan: true }, orderBy: { createdAt: 'desc' } });
    const planCode = sub?.plan?.code || 'trial';
    if (!canCreateChild(count, planCode)) throw forbidden(`Plan ${planCode} allows max ${getPlanLimits(planCode).maxChildren} children`);
  } catch (e: any) { if (e.statusCode === 403) throw e; }

  const pinHash = data.pin ? await hashPin(data.pin) : null;
  const payload = { parentId, name: data.name, nickname: data.nickname, grade: data.grade, curriculum: data.curriculum || 'NCTB', medium: data.medium || 'Bangla', avatar: data.avatar, pinHash };

  try {
    const child = await prisma.child.create({ data: payload });
    return child;
  } catch {
    const child = { id: 'child-' + Date.now(), ...payload, createdAt: new Date().toISOString() };
    memChildren.push(child);
    return child;
  }
}

export async function getChild(parentId: string, id: string) {
  try {
    const c = await prisma.child.findFirst({ where: { id, parentId, deletedAt: null } });
    if (!c) throw notFound('Child not found');
    return c;
  } catch (e: any) { if (e.statusCode===404) throw e;
    const c = memChildren.find((x: any) => x.id===id && x.parentId===parentId);
    if (!c) throw notFound('Child not found'); return c; }
}

export async function updateChild(parentId: string, id: string, data: any) {
  await getChild(parentId, id);
  const updateData: any = { ...data };
  if (data.pin) updateData.pinHash = await hashPin(data.pin);
  delete updateData.pin;
  try {
    const updated = await prisma.child.update({ where: { id }, data: updateData });
    return updated;
  } catch {
    const idx = memChildren.findIndex((c: any) => c.id===id);
    if (idx>=0) { Object.assign(memChildren[idx], updateData); return memChildren[idx]; }
    throw notFound('Child not found');
  }
}

export async function deleteChild(parentId: string, id: string) {
  await getChild(parentId, id);
  try { await prisma.child.update({ where: { id }, data: { deletedAt: new Date() } }); } catch {
    const idx = memChildren.findIndex((c: any) => c.id===id); if (idx>=0) memChildren[idx].deletedAt = new Date();
  }
  return { message: 'Child deleted (soft)' };
}

export async function setPin(parentId: string, id: string, pin: string) {
  const hash = await hashPin(pin);
  return updateChild(parentId, id, { pinHash: hash } as any);
}

export async function enterChildMode(parentId: string, childId: string, pin: string) {
  const child: any = await getChild(parentId, childId);
  if (!child.pinHash) throw badRequest('No PIN set for this child — set PIN first');
  const ok = await verifyPin(child.pinHash, pin);
  if (!ok) throw badRequest('Invalid PIN');

  // child scoped token (limited routes, 8h)
  const token = jwt.sign({ userId: parentId, childId, role: 'child', type: 'child' }, env.JWT_ACCESS_SECRET, { expiresIn: '8h' });
  return { token, child: { id: child.id, name: child.name, grade: child.grade } };
}
