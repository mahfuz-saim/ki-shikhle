import { create as createNotification } from '../notifications/notifications.service';
import { prisma } from '../../db/client';
import { hashPassword, hashPin, verifyPin } from '../../services/password';
import { getPlanLimits, canCreateChild } from '../../services/entitlements';
import { badRequest, conflict, forbidden, notFound } from '../../utils/errors';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { store, sanitizeChild, DEMO_PARENT_ID, DEMO_CHILD_IDS } from '../../core/store';
import { assertChildAccess, listAccessibleChildren, type Actor } from '../../core/tenancy';

/**
 * The columns a parent is allowed to see on a child.
 *
 * `passwordHash` and `pinHash` are deliberately absent. The previous implementation
 * returned raw Prisma rows, so every child's argon2id password hash and PIN hash was sent
 * to the owning parent over the API on every call.
 */
const CHILD_SELECT = {
  id: true,
  parentId: true,
  name: true,
  nickname: true,
  grade: true,
  curriculum: true,
  medium: true,
  avatar: true,
  email: true,
  slug: true,
  demoProfile: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Fields needed to verify a PIN — loaded explicitly, never spread into a response. */
const CHILD_WITH_SECRETS_SELECT = {
  ...CHILD_SELECT,
  pinHash: true,
  passwordHash: true,
} as const;

/**
 * List the children this actor may see.
 *
 * The scope comes from the token (via `actor.ownerId`) and nowhere else. The old
 * implementation widened every request to include the demo tenant.
 */
export async function listChildren(actor: Actor) {
  return listAccessibleChildren(actor);
}

export async function createChild(actor: Actor, data: any) {
  const normEmail =
    data.email && typeof data.email === 'string' && data.email.trim() ? data.email.trim().toLowerCase() : null;

  // Check if student email is already in use in memory or database
  if (normEmail) {
    const existingMemChild = store.children.findByField('email', normEmail);
    if (existingMemChild && !existingMemChild.deletedAt) {
      throw conflict('An account with this student email already exists');
    }
    const existingMemUser = store.users.byEmail(normEmail);
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

  // Entitlement check
  let count = 0;
  let planCode = 'free';

  try {
    count = await prisma.child.count({
      where: {
        parentId: actor.ownerId,
        deletedAt: null,
      },
    });

    const sub = await prisma.subscription.findFirst({
      where: {
        userId: actor.ownerId,
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    if (sub?.plan?.code) {
      planCode = sub.plan.code;
    }
  } catch {}

  // Ensure in-memory count is factored in for mock/dev fallback
  const memCount = store.children.forOwner(actor.ownerId).filter((c: any) => !c.deletedAt).length;

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

    // Keep the in-memory identity in sync so the student can log in in offline/mock mode.
    const existingInMem = store.users.byEmail(normEmail);
    if (!existingInMem) {
      store.users.add({
        id: 'user-child-' + Date.now(),
        name: data.name,
        email: normEmail,
        passwordHash: passwordHash!,
        role: 'child',
        language: data.medium === 'English' ? 'en' : 'bn',
        createdAt: new Date().toISOString(),
      });
    }
  }

  const pinHash = data.pin ? await hashPin(data.pin) : null;
  const payload: any = {
    // The child belongs to the account that created it. Never to the demo tenant.
    parentId: actor.ownerId,
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
    child = await prisma.child.create({
      data: payload,
      select: CHILD_SELECT,
    });
  } catch (err: any) {
    if (err?.code === 'P2002' || err?.statusCode === 409) {
      throw conflict('An account with this student email already exists');
    }
  }

  if (!child) {
    child = {
      id: 'child-' + Date.now(),
      ...payload,
      createdAt: new Date().toISOString(),
    };
  }

  // Always keep the in-memory store synced so student login & listing work seamlessly.
  if (!store.children.findAny(child.id)) {
    store.children.add({
      ...child,
      ownerId: actor.ownerId,
      parentId: actor.ownerId,
    } as any);
  }

  return sanitizeChild(child);
}

export async function getChild(actor: Actor, id: string) {
  // Ownership is checked FIRST and outside any try/catch, so a database error can never
  // skip the check.
  await assertChildAccess(actor, id);

  try {
    const c = await prisma.child.findFirst({
      where: { id, parentId: actor.ownerId, deletedAt: null },
      select: CHILD_SELECT,
    });
    if (c) return c;
  } catch {}

  const c = store.children.find(actor.ownerId, id);
  if (!c || c.deletedAt) throw notFound('Child not found');
  return sanitizeChild(c);
}

export async function updateChild(actor: Actor, id: string, data: any) {
  await assertChildAccess(actor, id);

  const updateData: any = { ...data };
  if (data.pin) updateData.pinHash = await hashPin(data.pin);
  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
  }
  // The plaintext fields are not columns. Prisma rejects an unknown key, which used to
  // throw inside the `try` and fall through to the in-memory branch — so changing a
  // child's password 404'd instead of working.
  delete updateData.pin;
  delete updateData.password;

  try {
    const updated = await prisma.child.update({
      where: { id },
      data: updateData,
      select: CHILD_SELECT,
    });
    // Keep the child's login identity in sync. `users` doubles as the child-credential
    // table, so a password changed on the `Child` row has to change there too —
    // otherwise the child can still log in with the old password.
    if (data.password) await syncChildIdentityPassword(updated.id, updated.email, updateData.passwordHash);
    return updated;
  } catch {
    const existing = store.children.find(actor.ownerId, id);
    if (existing) {
      const { pin, password, ...safe } = updateData;
      Object.assign(existing, safe);
      if (data.password) {
        existing.passwordHash = updateData.passwordHash;
        await syncChildIdentityPassword(existing.id, existing.email, updateData.passwordHash);
      }
      return sanitizeChild(existing);
    }
    throw notFound('Child not found');
  }
}

/**
 * Mirror a child's password hash onto the child-role `User` row.
 *
 * A child's login identity lives in `users` (role `child`) and its PIN lives on the
 * `Child` row. Two copies of one credential that can drift apart is how "the parent
 * reset the password but the old one still works" happens. Both are written together.
 */
async function syncChildIdentityPassword(childId: string, email: string | null | undefined, passwordHash: string) {
  if (!email) return;
  try {
    await prisma.user.updateMany({ where: { email, role: 'child' }, data: { passwordHash } });
  } catch {
    // The database is unreachable — the in-memory identity is updated below.
  }
  const identity = store.users.byEmail(email);
  if (identity && identity.role === 'child') identity.passwordHash = passwordHash;
}

export async function deleteChild(actor: Actor, id: string) {
  await assertChildAccess(actor, id);
  try {
    await prisma.child.update({ where: { id }, data: { deletedAt: new Date() } });
  } catch {
    const existing = store.children.find(actor.ownerId, id);
    if (existing) existing.deletedAt = new Date().toISOString();
  }
  return { message: 'Child deleted (soft)' };
}

export async function setPin(actor: Actor, id: string, pin: string) {
  const hash = await hashPin(pin);
  return updateChild(actor, id, { pinHash: hash } as any);
}

/**
 * Issue a child-scoped token.
 *
 * The token carries the CHILD's own identity, not the parent's. The old version put the
 * parent's id in `userId`, which made a child token indistinguishable from the parent's
 * token at the controller layer — the root of "a child can read their siblings' data".
 */
export async function enterChildMode(actor: Actor, childId: string, pin: string) {
  await assertChildAccess(actor, childId);

  let pinHash: string | null | undefined;
  try {
    const row = await prisma.child.findUnique({
      where: { id: childId },
      select: { id: true, name: true, grade: true, pinHash: true, email: true, parentId: true },
    });
    if (row) {
      pinHash = row.pinHash;
      if (row.pinHash) {
        // The PIN is optional in the request schema, because a child whose parent
        // never set a PIN must still be able to enter their portal. But if a PIN IS
        // set, one has to be supplied — say so plainly rather than failing with a
        // generic "Invalid PIN" from the argon2 verifier.
        if (!pin) throw badRequest('PIN required');
        const ok = await verifyPin(row.pinHash, pin);
        if (!ok) throw badRequest('Invalid PIN');
      }
      const token = jwt.sign(
        {
          userId: await childIdentityId(row.email, childId),
          childId,
          role: 'child',
          type: 'child',
        },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '8h' }
      );
      return { token, child: { id: row.id, name: row.name, grade: row.grade } };
    }
  } catch (e: any) {
    if (e?.statusCode) throw e;
  }

  // degraded mode
  const mem = store.children.find(actor.ownerId, childId);
  if (!mem || mem.deletedAt) throw notFound('Child not found');
  if (mem.pinHash) {
    if (!pin) throw badRequest('PIN required');
    const ok = await verifyPin(mem.pinHash, pin);
    if (!ok) throw badRequest('Invalid PIN');
  }
  const token = jwt.sign(
    {
      userId: await childIdentityId(mem.email || '', childId),
      childId,
      role: 'child',
      type: 'child',
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '8h' }
  );
  return { token, child: { id: mem.id, name: mem.name, grade: mem.grade } };
}

/**
 * The id a child token should carry as its subject.
 *
 * `users` doubles as the child-credential table, so a child's login identity is its
 * `User` row. When there is none, the child's own id is used — which still scopes the
 * token to that one child.
 *
 * The database is the source of truth here, not the in-memory store. The store only
 * holds the seeded demo fixtures, so a lookup there found nothing for any child
 * created at runtime — and the token was signed with the child's *profile* id, which
 * is not a `users` row. `resolveActor` then rejected it as an unknown account and
 * every child-mode request came back 401: the child could not read their own notes.
 */
async function childIdentityId(email: string | null | undefined, childId: string): Promise<string> {
  if (!email) return childId;
  const norm = email.trim().toLowerCase();
  try {
    const identity = await prisma.user.findFirst({
      where: { email: norm },
      select: { id: true },
    });
    if (identity) return identity.id;
  } catch {
    // Degraded mode — fall through to the store.
  }
  const memIdentity = store.users.byEmail(norm);
  return memIdentity?.id || childId;
}

export interface UnloggedStudyAlertConfig {
  childId: string;
  enabled: boolean;
  time: string; // e.g. "21:00"
  channel: 'in_app' | 'email' | 'all';
  daysOfWeek: number[];
  updatedAt?: string;
}

/**
 * Per-child alert configuration.
 *
 * Keyed by child id. Every read and write goes through `assertChildAccess`, so a config
 * can only be reached by the owning parent.
 */
export const memUnloggedAlertConfigs: Record<string, UnloggedStudyAlertConfig> = {};

export async function getUnloggedAlertConfig(actor: Actor, childId: string): Promise<UnloggedStudyAlertConfig> {
  await assertChildAccess(actor, childId);
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
  actor: Actor,
  childId: string,
  config: Partial<UnloggedStudyAlertConfig>
): Promise<UnloggedStudyAlertConfig> {
  await assertChildAccess(actor, childId);
  const current = await getUnloggedAlertConfig(actor, childId);
  const updated: UnloggedStudyAlertConfig = {
    ...current,
    ...config,
    childId,
    updatedAt: new Date().toISOString(),
  };
  memUnloggedAlertConfigs[childId] = updated;
  return updated;
}

export async function triggerTestUnloggedAlert(actor: Actor, childId: string) {
  const child: any = await getChild(actor, childId);
  const cfg = await getUnloggedAlertConfig(actor, childId);

  const notif = await createNotification(actor.ownerId, 'missed_sessions', {
    childId,
    childName: child.name,
    time: cfg.time,
    title: 'দৈনিক পড়ার বিবরণ অ্যালার্ট (Unlogged Study Alert)',
    message: `${child.name}-এর আজকের কোনো পড়ার বিবরণ এখনও লিপিবদ্ধ করা হয়নি। নির্ধারিত সময়: ${cfg.time}। শিক্ষার্থীকে পোর্টাল থেকে পড়ার বিবরণ যুক্ত করতে বলুন।`,
  });

  return { success: true, notification: notif };
}

/** The seeded demo tenant's ids — used by the seed script and the demo dataset lookups. */
export const demoTenant = {
  parentId: DEMO_PARENT_ID,
  childIds: DEMO_CHILD_IDS,
};
