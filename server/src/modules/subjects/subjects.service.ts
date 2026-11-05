import { prisma } from '../../db/client';
import { notFound, forbidden, badRequest } from '../../utils/errors';
import { store, type MemSubject } from '../../core/store';
import { assertChildAccess, assertEntityAccess, type Actor } from '../../core/tenancy';

/**
 * Subjects come in two flavours:
 *
 *  - **Seeded** subjects (`parentId === null`) are shared platform content. Everyone may
 *    read them, nobody may edit or delete them.
 *  - **Custom** subjects are owned by the account that created them.
 *
 * `deleteSubject` used to check only `isCustom`, so any authenticated parent could delete
 * another tenant's custom subject by guessing its id. The ownership check now lives in
 * `core/tenancy` (`assertEntityAccess({ kind: 'subject' })`).
 */

/** The seeded subjects, used in degraded mode when the database is unreachable. */
const seededSubjects = [
  { id: 's1', curriculum: 'NCTB', grade: '6', nameEn: 'Mathematics', nameBn: 'গণিত', isCustom: false },
  { id: 's2', curriculum: 'NCTB', grade: '6', nameEn: 'Science', nameBn: 'বিজ্ঞান', isCustom: false },
  { id: 's3', curriculum: 'NCTB', grade: '6', nameEn: 'English', nameBn: 'ইংরেজি', isCustom: false },
  { id: 's4', curriculum: 'NCTB', grade: '11', nameEn: 'Physics', nameBn: 'পদার্থবিজ্ঞান', isCustom: false },
];

export async function listSubjects(actor: Actor) {
  try {
    // seeded (shared) + this account's own custom subjects
    const all = await prisma.subject.findMany({
      where: { OR: [{ parentId: null }, { parentId: actor.ownerId }] },
      orderBy: { nameEn: 'asc' },
    });
    return all;
  } catch {
    // degraded mode — seeded subjects plus this account's own custom subjects
    const shared = seededSubjects.map((s) => ({ ...s, parentId: null, ownerId: null }));
    const mine = store.subjects.forOwner(actor.ownerId);
    return [...shared, ...mine];
  }
}

/**
 * The subjects a child studies.
 *
 * The `Subject`↔`Child` relation used to be an **implicit** many-to-many (`_ChildToSubject`)
 * with no tenancy boundary of its own: it stored a child id and a subject id, and nothing
 * tied them to the same account. A row could link one tenant's child to another tenant's
 * custom subject, and any query that followed the relation would cross the account
 * boundary.
 *
 * The relation is now the explicit `child_subjects` table, which carries `parent_id`, so
 * the join can be constrained by owner in a single query.
 *
 * The list is: the subjects **assigned** to this child, plus the seeded subjects that
 * match the child's grade and curriculum, plus this account's own custom subjects. A
 * custom subject belonging to a *different* account is never returned.
 */
export async function listSubjectsForChild(actor: Actor, childId: string) {
  await assertChildAccess(actor, childId);

  try {
    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { grade: true, curriculum: true },
    });

    // Subjects explicitly assigned to this child, scoped to this account.
    const assigned: any[] = await prisma.childSubject.findMany({
      where: { childId, parentId: actor.ownerId },
      include: { subject: true },
      orderBy: { createdAt: 'asc' },
    });

    const seen = new Set(assigned.map((a: any) => a.subject.id));
    const out: any[] = assigned.map((a: any) => a.subject);

    // Seeded subjects for the child's grade and curriculum.
    const seeded = await prisma.subject.findMany({
      where: {
        parentId: null,
        ...(child?.grade ? { grade: child.grade } : {}),
        ...(child?.curriculum ? { curriculum: child.curriculum } : {}),
      },
      orderBy: { nameEn: 'asc' },
    });
    for (const s of seeded) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        out.push(s);
      }
    }

    // This account's own custom subjects.
    const mine = await prisma.subject.findMany({
      where: { parentId: actor.ownerId, isCustom: true },
      orderBy: { nameEn: 'asc' },
    });
    for (const s of mine) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        out.push(s);
      }
    }

    return out.sort((a, b) => String(a.nameEn).localeCompare(String(b.nameEn)));
  } catch {
    // degraded mode — the seeded subjects plus this account's own custom subjects,
    // plus anything explicitly assigned to this child.
    const shared = seededSubjects.map((s) => ({ ...s, parentId: null, ownerId: null }));
    const mine = store.subjects.forOwner(actor.ownerId);
    const assigned = store.childSubjects.forChild(actor.ownerId, childId);
    const assignedSubjects = assigned
      .map((a) => store.subjects.findAny(a.subjectId))
      .filter((s): s is MemSubject => Boolean(s));
    const seen = new Set(assignedSubjects.map((s) => s.id));
    const out = [...assignedSubjects];
    for (const s of [...shared, ...mine]) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        out.push(s);
      }
    }
    return out.sort((a, b) => String(a.nameEn).localeCompare(String(b.nameEn)));
  }
}

/**
 * Assign a subject to a child.
 *
 * Both sides must belong to the caller's account: the child (checked by
 * `assertChildAccess`) and the subject. A seeded subject is shared, so anyone may assign
 * it; a custom subject may only be assigned by the account that owns it.
 */
export async function assignToChild(actor: Actor, childId: string, subjectId: string) {
  await assertChildAccess(actor, childId);

  const owner = await resolveSubjectOwner(subjectId);
  if (owner === undefined) throw notFound('Subject not found');
  if (owner !== null && owner !== actor.ownerId) {
    // Another tenant's custom subject. 404, not 403 — a 403 would confirm it exists.
    throw notFound('Subject not found');
  }

  try {
    return await prisma.childSubject.create({
      data: { childId, subjectId, parentId: actor.ownerId },
    });
  } catch (e: any) {
    // The unique index on (childId, subjectId) means a duplicate is not an error.
    if (e?.code === 'P2002') {
      return { childId, subjectId, parentId: actor.ownerId, alreadyAssigned: true };
    }
    // The database is unreachable — fall back to the in-memory store.
    const existing = store.childSubjects.forChild(actor.ownerId, childId);
    if (existing.some((a) => a.subjectId === subjectId)) {
      return { childId, subjectId, parentId: actor.ownerId, alreadyAssigned: true };
    }
    const row = {
      id: 'csx-' + Date.now(),
      ownerId: actor.ownerId,
      childId,
      subjectId,
    };
    store.childSubjects.add(row);
    return row;
  }
}

/** Remove a subject assignment from a child. */
export async function unassignFromChild(actor: Actor, childId: string, subjectId: string) {
  await assertChildAccess(actor, childId);
  try {
    await prisma.childSubject.deleteMany({
      where: { childId, subjectId, parentId: actor.ownerId },
    });
  } catch {
    const row = store.childSubjects.forChild(actor.ownerId, childId).find((a) => a.subjectId === subjectId);
    if (row) store.childSubjects.remove(row.id);
  }
  return { message: 'Unassigned' };
}

export async function createCustom(actor: Actor, data: any) {
  try {
    return await prisma.subject.create({ data: { ...data, parentId: actor.ownerId, isCustom: true } });
  } catch {
    const s = { id: 'cs-' + Date.now(), ...data, parentId: actor.ownerId, ownerId: actor.ownerId, isCustom: true };
    store.subjects.add(s as any);
    return s;
  }
}

export async function updateSubject(actor: Actor, id: string, data: any) {
  await assertEntityAccess(actor, { kind: 'subject', id });
  const owner = await resolveSubjectOwner(id);
  if (owner === null) throw forbidden('Cannot edit seeded subjects');
  try {
    return await prisma.subject.update({ where: { id }, data });
  } catch {
    const row = store.subjects.find(actor.ownerId, id);
    if (!row) throw notFound('Subject not found');
    Object.assign(row, data);
    return row;
  }
}

export async function deleteSubject(actor: Actor, id: string) {
  await assertEntityAccess(actor, { kind: 'subject', id });
  const owner = await resolveSubjectOwner(id);
  if (owner === null) throw forbidden('Cannot delete seeded subjects');
  try {
    await prisma.subject.delete({ where: { id } });
  } catch {
    store.subjects.remove(id);
  }
  return { message: 'Deleted' };
}

/**
 * Who owns a subject.
 *
 * Returns `null` for a seeded (shared) subject, the owner's id for a custom one, and
 * `undefined` when the subject does not exist.
 */
async function resolveSubjectOwner(id: string): Promise<string | null | undefined> {
  try {
    const row = await prisma.subject.findUnique({ where: { id }, select: { parentId: true } });
    if (!row) return undefined;
    return row.parentId ?? null;
  } catch {
    const mem = store.subjects.findAny(id);
    if (!mem) return undefined;
    return mem.ownerId ?? null;
  }
}
