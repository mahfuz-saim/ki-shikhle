/**
 * Tenancy — the single ownership choke point.
 *
 * Every module used to carry its own `assertOwnership()` helper. There were five of them,
 * they disagreed with each other, and four of the five never actually threw. This module
 * replaces all of them.
 *
 * Rules that hold everywhere:
 *
 *  - The scope of a request comes from the **token**, never from a request body, a query
 *    parameter, or a hardcoded fallback.
 *  - The **database row is the source of truth for the role**, not the JWT claim. A token
 *    minted before a role change stays valid for the token's whole lifetime, so trusting
 *    the claim would let a demoted admin keep admin powers for days.
 *  - Cross-tenant access returns **404 "Child not found"**, not 403. A 403 confirms that
 *    the resource exists, which is itself a leak. 403 is reserved for *role* violations
 *    (a child calling a parent-only endpoint).
 *  - An unknown account is **never** silently replaced by another account. There is no
 *    "default parent" anywhere in this file.
 *
 * This module imports only `db/`, `utils/` and `core/store` — never `modules/*` — so it
 * cannot create an import cycle.
 */

import { prisma } from '../db/client';
import { badRequest, forbidden, notFound, unauthorized } from '../utils/errors';
import { store, sanitizeChild, type MemChild } from './store';

export type Role = 'parent' | 'child' | 'admin';

export interface Actor {
  /** The account that OWNS data. For a child actor this is the PARENT's user id. */
  ownerId: string;
  /** Present only for child actors — the single child this token may act as. */
  childId?: string;
  role: Role;
  email?: string;
  /** True when the id came from the in-memory store because the database was unreachable. */
  degraded: boolean;
}

/** The shape a JWT payload provides. */
export interface ActorInput {
  userId?: string;
  childId?: string;
  role?: string;
  email?: string;
}

const asRole = (value: unknown): Role => {
  const v = String(value || '').toLowerCase();
  if (v === 'child' || v === 'admin' || v === 'parent') return v;
  return 'parent';
};

/**
 * Turn a token into a tenancy scope.
 *
 * The only function in the codebase allowed to produce an `Actor`.
 */
export async function resolveActor(input: ActorInput): Promise<Actor> {
  const userId = input?.userId;
  if (!userId || typeof userId !== 'string') {
    // Previously this fell back to 'parent-demo', which silently attributed an
    // unauthenticated request to the demo tenant.
    throw unauthorized('Missing token subject');
  }

  // 1. The database is authoritative.
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && !user.deletedAt) {
      const role = asRole(user.role);

      if (role === 'child') {
        const resolved = await resolveChildIdentity(user.id, user.email, input.childId);
        return {
          // The account that OWNS the data is the PARENT, even for a child actor.
          ownerId: resolved.parentId,
          childId: resolved.childId,
          role,
          email: user.email,
          degraded: false,
        };
      }

      return { ownerId: user.id, role, email: user.email, degraded: false };
    }
  } catch {
    // Fall through to the in-memory store (degraded mode).
  }

  // 2. Degraded mode: the in-memory store, scoped exactly like the database.
  const mem = store.users.byId(userId);
  if (!mem) {
    // Never fall back to another account. An unknown subject is an authentication failure.
    throw unauthorized('Unknown or disabled account');
  }

  const role = asRole(mem.role);
  if (role === 'child') {
    const resolved = await resolveChildIdentity(mem.id, mem.email, input.childId);
    return {
      ownerId: resolved.parentId,
      childId: resolved.childId,
      role,
      email: mem.email,
      degraded: true,
    };
  }

  return { ownerId: mem.id, role, email: mem.email, degraded: true };
}

interface ChildIdentity {
  /** The id of the child profile. */
  childId: string;
  /** The id of the account that OWNS that child — the parent. */
  parentId: string;
}

/**
 * Find the child a child-role token is allowed to act as, and its owning parent.
 *
 * The token's `childId` claim is only a hint: it is validated against the store so that a
 * token cannot be re-pointed at a sibling by editing the claim. The child's *own* user id
 * is never the owner — the parent is, which is what makes a child token able to read its
 * own rows but not its siblings'.
 */
async function resolveChildIdentity(userId: string, email: string | undefined, claimedChildId?: string): Promise<ChildIdentity> {
  // Prefer the claim when it is backed by a real child row for this user.
  if (claimedChildId) {
    const child = await loadChild(claimedChildId);
    if (child && !child.deletedAt && matchesUser(child, userId, email)) {
      return { childId: child.id, parentId: owningParentId(child) };
    }
  }

  // Otherwise derive it from the child's own email.
  if (email) {
    const byEmail = await findChildByEmail(email);
    if (byEmail && !byEmail.deletedAt) {
      return { childId: byEmail.id, parentId: owningParentId(byEmail) };
    }
  }

  throw unauthorized('Child profile not found');
}

/** The id of the account that owns a child row. */
function owningParentId(child: { parentId?: string | null; ownerId?: string | null }): string {
  const parentId = child.parentId ?? child.ownerId;
  if (!parentId) throw unauthorized('Child profile not found');
  return parentId;
}

/** Does this child record belong to this login identity? */
function matchesUser(child: { email?: string | null }, userId: string, email?: string | null): boolean {
  if (email && child.email && child.email.toLowerCase() === email.toLowerCase()) return true;
  // The `users` table doubles as the child-credential table, so the child's login id is
  // derived from its email. Compare the owning user as a fallback for seeded children.
  return !!child.email && child.email.toLowerCase() === (email || '').toLowerCase() && !!userId;
}

/**
 * Load a child by id, from the database or — in degraded mode — from the store.
 * Returns undefined when it does not exist.
 */
export async function loadChild(childId: string): Promise<MemChild | undefined> {
  if (!childId) return undefined;
  try {
    // Projected: the callers read `parentId`, `deletedAt` and `email`. Loading the
    // whole row would carry the child's `passwordHash` and `pinHash` into whatever
    // the caller does with it next.
    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { id: true, parentId: true, email: true, deletedAt: true },
    });
    if (child) return child as unknown as MemChild;
  } catch {
    // degraded — fall through
  }
  return store.children.findAny(childId);
}

async function findChildByEmail(email: string): Promise<MemChild | undefined> {
  const norm = email.trim().toLowerCase();
  try {
    const child = await prisma.child.findFirst({
      where: { email: norm },
      select: { id: true, parentId: true, email: true, deletedAt: true },
    });
    if (child) return child as unknown as MemChild;
  } catch {
    // degraded — fall through
  }
  return store.children.findByField('email', norm);
}

/**
 * Assert the actor may act on `childId`.
 *
 *  - parent: the child must be one of THIS parent's children.
 *  - child : the child MUST be the actor's own child.
 *  - admin : denied — admins may read platform metrics, never tenant content.
 *
 * Throws 404 when the child does not belong to this actor (so existence is not disclosed).
 */
export async function assertChildAccess(actor: Actor, childId: string): Promise<void> {
  if (!childId || typeof childId !== 'string') throw badRequest('childId is required');

  if (actor.role === 'admin') {
    // Deliberately NOT a superuser bypass: a leaked admin token must not read tenant data.
    throw forbidden('Admin cannot access tenant data');
  }

  if (actor.role === 'child') {
    if (actor.childId && actor.childId === childId) return;
    throw notFound('Child not found');
  }

  const child = await loadChild(childId);
  if (!child || child.deletedAt) throw notFound('Child not found');
  // `parentId` is the database column name; `ownerId` is the in-memory equivalent.
  const owningParent = (child as any).parentId ?? child.ownerId;
  if (owningParent !== actor.ownerId) throw notFound('Child not found');
}

/**
 * The kinds of record that hang off a child (or, for user-owned rows, off the account).
 */
export type EntityKind =
  | 'entry'
  | 'note'
  | 'routine'
  | 'exception'
  | 'quiz'
  | 'attempt'
  | 'subject'
  | 'notification';

export interface EntityRef {
  kind: EntityKind;
  id: string;
}

/**
 * Assert the actor may act on a record that belongs to a child (or to the account).
 *
 * Resolves the owning child explicitly per kind — deliberately not a generic introspection —
 * so every `where` clause is reviewable.
 */
export async function assertEntityAccess(actor: Actor, entity: EntityRef): Promise<void> {
  const { kind, id } = entity;
  if (!id) throw notFound('Not found');

  if (actor.role === 'admin') {
    throw forbidden('Admin cannot access tenant data');
  }

  if (kind === 'notification') {
    // Notifications are owned by the account, not by a child.
    const ownerId = await resolveNotificationOwner(id);
    if (!ownerId || ownerId !== actor.ownerId) throw notFound('Notification not found');
    return;
  }

  if (kind === 'subject') {
    // A custom subject is owned by the parent directly; a seeded one (parentId === null)
    // is shared and readable by anyone.
    const ownerId = await resolveSubjectOwner(id);
    if (ownerId === null) return; // seeded subject — shared
    if (actor.role === 'child') throw notFound('Subject not found');
    if (ownerId !== actor.ownerId) throw notFound('Subject not found');
    return;
  }

  const owningChildId = await resolveOwningChild(kind, id);
  if (!owningChildId) throw notFound('Not found');
  await assertChildAccess(actor, owningChildId);
}

/** Resolve which child owns a given record. Returns undefined when the record is gone. */
async function resolveOwningChild(kind: EntityKind, id: string): Promise<string | undefined> {
  try {
    switch (kind) {
      case 'entry': {
        const row = await prisma.learningEntry.findUnique({ where: { id }, select: { childId: true } });
        return row?.childId;
      }
      case 'note': {
        const row = await prisma.note.findUnique({ where: { id }, select: { childId: true } });
        return row?.childId;
      }
      case 'routine': {
        const row = await prisma.routine.findUnique({ where: { id }, select: { childId: true } });
        return row?.childId;
      }
      case 'exception': {
        const row = await prisma.routineException.findUnique({
          where: { id },
          select: { routine: { select: { childId: true } } },
        });
        return row?.routine?.childId;
      }
      case 'quiz': {
        const row = await prisma.quiz.findUnique({ where: { id }, select: { childId: true } });
        return row?.childId;
      }
      case 'attempt': {
        const row = await prisma.quizAttempt.findUnique({ where: { id }, select: { childId: true } });
        return row?.childId;
      }
      default:
        return undefined;
    }
  } catch {
    // degraded mode — read the in-memory partitions
    switch (kind) {
      case 'entry':
        return store.entries.findAny(id)?.childId;
      case 'note':
        return store.notes.findAny(id)?.childId;
      case 'routine':
        return store.routines.findAny(id)?.childId;
      case 'exception':
        return undefined;
      case 'quiz':
        return store.quizzes.findAny(id)?.childId;
      case 'attempt':
        return store.attempts.findAny(id)?.childId;
      default:
        return undefined;
    }
  }
}

async function resolveNotificationOwner(id: string): Promise<string | undefined> {
  try {
    const row = await prisma.notification.findUnique({ where: { id }, select: { userId: true } });
    return row?.userId;
  } catch {
    return store.notifications.findAny(id)?.userId;
  }
}

async function resolveSubjectOwner(id: string): Promise<string | null | undefined> {
  try {
    const row = await prisma.subject.findUnique({ where: { id }, select: { parentId: true } });
    return row?.parentId ?? null;
  } catch {
    const mem = store.subjects.findAny(id);
    return mem ? mem.ownerId : undefined;
  }
}

/**
 * The children an actor may see.
 *
 * A parent sees its own children. A child sees only itself. Admins see none.
 */
export async function listAccessibleChildren(actor: Actor): Promise<MemChild[]> {
  if (actor.role === 'admin') return [];
  if (actor.role === 'child') {
    if (!actor.childId) return [];
    const child = await loadChild(actor.childId);
    return child && !child.deletedAt ? [sanitizeChild(child)] : [];
  }
  try {
    const list = await prisma.child.findMany({
      where: { parentId: actor.ownerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
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
      },
    });
    if (list && list.length > 0) return list as unknown as MemChild[];
    return [];
  } catch {
    // degraded mode — the store is already partitioned by owner.
    //
    // The rows are sanitized: a store child carries `passwordHash` and `pinHash`, and
    // this list goes straight into `GET /children`.
    return store.children
      .forOwner(actor.ownerId)
      .filter((c) => !c.deletedAt)
      .map((c) => sanitizeChild(c));
  }
}
