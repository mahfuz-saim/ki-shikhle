import { prisma } from '../../db/client';
import { notFound, forbidden } from '../../utils/errors';
import { store } from '../../core/store';
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
 * The `Subject`↔`Child` relation is an implicit many-to-many with **no tenancy
 * boundary of its own**: `listSubjects` used to accept a `childId` and ignore it,
 * so the child's subject list was really "every subject in the database" —
 * including other tenants' custom subjects.
 *
 * The relation is now scoped through the child's owner: a child sees the seeded
 * subjects plus the custom subjects belonging to **its own account**.
 */
export async function listSubjectsForChild(actor: Actor, childId: string) {
  await assertChildAccess(actor, childId);
  try {
    return await prisma.subject.findMany({
      where: { OR: [{ parentId: null }, { parentId: actor.ownerId }] },
      orderBy: { nameEn: 'asc' },
    });
  } catch {
    const shared = seededSubjects.map((s) => ({ ...s, parentId: null, ownerId: null }));
    const mine = store.subjects.forOwner(actor.ownerId);
    return [...shared, ...mine];
  }
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
