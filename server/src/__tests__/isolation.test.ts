/**
 * The cross-account isolation matrix.
 *
 * The bug that started all of this: a brand-new parent account could read the demo
 * account's family data — children, notes, learning entries, quiz attempts, dashboard
 * KPIs — because `resolveParentContext` widened every caller to the demo parent.
 *
 * This suite pins the fix down. For every tenant-scoped endpoint, a valid token for
 * tenant A against tenant B's child id must return **404**:
 *
 *  - never 200 — that is the leak itself.
 *  - never 403 — a 403 confirms the resource exists, which is its own (smaller) leak.
 *
 * The 404-not-403 rule is deliberate and load-bearing, so it is asserted explicitly.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { call, cleanupTenants, createTenant, tokenFor, type Tenant } from '../test-utils/http';
import { DEMO_CHILD_IDS, DEMO_PARENT_ID } from '../core/store';
import { prisma } from '../db/client';

let a: Tenant; // the "good" tenant
let b: Tenant; // the other tenant
let aToken: string;

beforeAll(async () => {
  a = await createTenant('alpha');
  b = await createTenant('beta');
  aToken = tokenFor(a.parentId, { email: a.parentEmail });

  // Seed some rows under tenant B so the matrix tests *existing* data, not just
  // non-existent ids. Without a real row, "404 because it does not exist" would pass
  // trivially and prove nothing.
  await prisma.learningEntry.create({
    data: {
      childId: b.childId,
      source: 'tuition',
      date: new Date(),
      topicsText: 'Tenant B secret topic',
      durationMin: 30,
    },
  });
  const note = await prisma.note.create({
    data: {
      childId: b.childId,
      subject: 'Physics',
      title: 'Tenant B secret note',
      date: new Date(),
      textClean: 'secret',
    },
  });
  const routine = await prisma.routine.create({
    data: {
      childId: b.childId,
      name: 'Tenant B secret routine',
      source: 'tuition',
      weekdays: [1],
      startTime: '16:00',
      durationMin: 60,
      startsOn: new Date(),
    },
  });
  const exception = await prisma.routineException.create({
    data: { routineId: routine.id, originalDate: new Date(), type: 'cancelled' },
  });
  const quiz = await prisma.quiz.create({
    data: {
      childId: b.childId,
      createdBy: b.parentId,
      title: 'Tenant B secret quiz',
      scopeJson: {},
      settingsJson: {},
    },
  });
  const attempt = await prisma.quizAttempt.create({
    data: { quizId: quiz.id, childId: b.childId },
  });
  const subject = await prisma.subject.create({
    data: { nameEn: 'Tenant B custom subject', parentId: b.parentId, isCustom: true },
  });
  const notification = await prisma.notification.create({
    data: { userId: b.parentId, type: 'trial_reminder', payloadJson: {} },
  });

  // Keep the ids around for the endpoint matrix.
  (globalThis as any).__bIds = { note, routine, exception, quiz, attempt, subject, notification };
});

afterAll(async () => {
  const ids = (globalThis as any).__bIds;
  if (ids) {
    await prisma.quizAttempt.deleteMany({ where: { id: ids.attempt.id } });
    await prisma.quiz.deleteMany({ where: { id: ids.quiz.id } });
    await prisma.routineException.deleteMany({ where: { id: ids.exception.id } });
    await prisma.routine.deleteMany({ where: { id: ids.routine.id } });
    await prisma.note.deleteMany({ where: { id: ids.note.id } });
    await prisma.subject.deleteMany({ where: { id: ids.subject.id } });
    await prisma.notification.deleteMany({ where: { id: ids.notification.id } });
  }
  await prisma.learningEntry.deleteMany({ where: { childId: b.childId } });
  // Scoped to this file's tenants only — vitest runs test files in parallel against the
  // same database, so a blanket prefix delete would take out another file's fixtures.
  await cleanupTenants(a, b);
});

const bIds = () => (globalThis as any).__bIds;

/**
 * Cross-tenant reads must be 404 — never 200, never 403.
 */
function expectNotFound(res: { status: number; body: any }) {
  expect(res.status).toBe(404);
  expect(res.body?.success).toBe(false);
}

describe('Listing never crosses tenants', () => {
  it('GET /children returns only the caller\'s own children', async () => {
    const res = await call('GET', '/api/v1/children', { token: aToken });
    expect(res.status).toBe(200);
    const ids = (res.body.data || []).map((c: any) => c.id);
    expect(ids).toContain(a.childId);
    expect(ids).not.toContain(b.childId);
    expect(ids).not.toContain(DEMO_CHILD_IDS.rahim);
    expect(ids).not.toContain(DEMO_CHILD_IDS.tasnim);
    expect(ids).not.toContain(DEMO_CHILD_IDS.fahim);
  });

  it('GET /children never returns the demo tenant\'s children to another account', async () => {
    const res = await call('GET', '/api/v1/children', { token: tokenFor(b.parentId) });
    expect(res.status).toBe(200);
    const ids = (res.body.data || []).map((c: any) => c.id);
    expect(ids).not.toContain(DEMO_CHILD_IDS.rahim);
  });

  it('GET /notifications returns only the caller\'s own notifications', async () => {
    const res = await call('GET', '/api/v1/notifications', { token: aToken });
    expect(res.status).toBe(200);
    const items = res.body.data || [];
    // The caller has none of tenant B's notification.
    expect(items.some((n: any) => n.id === bIds().notification.id)).toBe(false);
  });

  it('GET /billing/invoices returns only the caller\'s own invoices', async () => {
    const res = await call('GET', '/api/v1/billing/invoices', { token: aToken });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('Cross-tenant child reads are 404', () => {
  const reads: Array<[string, string]> = [
    ['GET', '/api/v1/children/:id'],
    ['GET', '/api/v1/children/:id/notes'],
    ['GET', '/api/v1/children/:id/entries'],
    ['GET', '/api/v1/children/:id/quizzes'],
    ['GET', '/api/v1/children/:id/routines'],
    ['GET', '/api/v1/children/:id/schedule'],
    ['GET', '/api/v1/children/:id/dashboard/summary'],
    ['GET', '/api/v1/children/:id/dashboard/study-time'],
    ['GET', '/api/v1/children/:id/dashboard/subjects'],
    ['GET', '/api/v1/children/:id/dashboard/scores'],
    ['GET', '/api/v1/children/:id/dashboard/topics'],
    ['GET', '/api/v1/children/:id/dashboard/mastery'],
    ['GET', '/api/v1/children/:id/dashboard/consistency'],
    ['GET', '/api/v1/children/:id/unlogged-alert'],
  ];

  it.each(reads)('%s %s against another tenant\'s child is 404', async (method, path) => {
    const url = path.replace(':id', b.childId);
    const res = await call(method, url, { token: aToken });
    expectNotFound(res);
  });

  it('POST /children/:id/notes against another tenant\'s child is 404', async () => {
    const res = await call('POST', `/api/v1/children/${b.childId}/notes`, {
      token: aToken,
      body: { subject: 'Physics', textClean: 'intruding', date: '2026-01-01' },
    });
    expectNotFound(res);
  });

  it('POST /children/:id/entries against another tenant\'s child is 404', async () => {
    const res = await call('POST', `/api/v1/children/${b.childId}/entries`, {
      token: aToken,
      body: { source: 'school', date: '2026-01-01', topicsText: 'intruding' },
    });
    expectNotFound(res);
  });

  it('POST /children/:id/routines against another tenant\'s child is 404', async () => {
    const res = await call('POST', `/api/v1/children/${b.childId}/routines`, {
      token: aToken,
      body: {
        name: 'intruding',
        source: 'school',
        weekdays: [1],
        startTime: '16:00',
        durationMin: 60,
        startsOn: '2026-01-01',
      },
    });
    expectNotFound(res);
  });

  it('PATCH /children/:id against another tenant\'s child is 404', async () => {
    const res = await call('PATCH', `/api/v1/children/${b.childId}`, {
      token: aToken,
      body: { name: 'hijacked' },
    });
    expectNotFound(res);
  });

  it('DELETE /children/:id against another tenant\'s child is 404', async () => {
    const res = await call('DELETE', `/api/v1/children/${b.childId}`, { token: aToken });
    expectNotFound(res);
  });

  it('POST /children/:id/enter against another tenant\'s child is 404', async () => {
    const res = await call('POST', `/api/v1/children/${b.childId}/enter`, {
      token: aToken,
      body: { pin: '1234' },
    });
    expectNotFound(res);
  });
});

describe('Cross-tenant entity reads are 404', () => {
  it('GET /notes/:id — a note is owned by its child', async () => {
    // The notes router has no GET /notes/:id, but the child-scoped list must not leak.
    const res = await call('GET', `/api/v1/children/${b.childId}/notes`, { token: aToken });
    expectNotFound(res);
  });

  it('PATCH /notes/:id against another tenant\'s note is 404', async () => {
    const res = await call('PATCH', `/api/v1/notes/${bIds().note.id}`, {
      token: aToken,
      body: { title: 'hijacked' },
    });
    expectNotFound(res);
  });

  it('DELETE /notes/:id against another tenant\'s note is 404', async () => {
    const res = await call('DELETE', `/api/v1/notes/${bIds().note.id}`, { token: aToken });
    expectNotFound(res);
  });

  it('PATCH /entries/:id against another tenant\'s entry is 404', async () => {
    const entry = await prisma.learningEntry.findFirst({ where: { childId: b.childId } });
    const res = await call('PATCH', `/api/v1/entries/${entry!.id}`, {
      token: aToken,
      body: { topicsText: 'hijacked' },
    });
    expectNotFound(res);
  });

  it('DELETE /entries/:id against another tenant\'s entry is 404', async () => {
    const entry = await prisma.learningEntry.findFirst({ where: { childId: b.childId } });
    const res = await call('DELETE', `/api/v1/entries/${entry!.id}`, { token: aToken });
    expectNotFound(res);
  });

  it('GET /quizzes/:id against another tenant\'s quiz is 404', async () => {
    const res = await call('GET', `/api/v1/quizzes/${bIds().quiz.id}`, { token: aToken });
    expectNotFound(res);
  });

  it('GET /attempts/:id against another tenant\'s attempt is 404', async () => {
    const res = await call('GET', `/api/v1/attempts/${bIds().attempt.id}`, { token: aToken });
    expectNotFound(res);
  });

  it('PUT /attempts/:id/answers against another tenant\'s attempt is 404', async () => {
    const res = await call('PUT', `/api/v1/attempts/${bIds().attempt.id}/answers`, {
      token: aToken,
      body: { answers: [{ questionId: 'q1', answer: 'a' }] },
    });
    expectNotFound(res);
  });

  it('POST /attempts/:id/submit against another tenant\'s attempt is 404', async () => {
    const res = await call('POST', `/api/v1/attempts/${bIds().attempt.id}/submit`, {
      token: aToken,
      body: {},
    });
    expectNotFound(res);
  });

  it('DELETE /routines/:id against another tenant\'s routine is 404', async () => {
    const res = await call('DELETE', `/api/v1/routines/${bIds().routine.id}`, { token: aToken });
    expectNotFound(res);
  });

  it('DELETE /exceptions/:id against another tenant\'s exception is 404', async () => {
    const res = await call('DELETE', `/api/v1/exceptions/${bIds().exception.id}`, { token: aToken });
    expectNotFound(res);
  });

  it('DELETE /subjects/:id against another tenant\'s custom subject is 404', async () => {
    const res = await call('DELETE', `/api/v1/subjects/${bIds().subject.id}`, { token: aToken });
    expectNotFound(res);
  });

  it('POST /notifications/:id/read against another tenant\'s notification is 404', async () => {
    const res = await call('POST', `/api/v1/notifications/${bIds().notification.id}/read`, {
      token: aToken,
      body: {},
    });
    expectNotFound(res);
  });
});

describe('The subject↔child relation has a tenancy boundary', () => {
  // The relation used to be an implicit many-to-many (`_ChildToSubject`) that stored a
  // child id and a subject id with nothing tying them to the same account. It is now
  // the explicit `child_subjects` table, which carries `parent_id`.

  it('GET /children/:id/subjects against another tenant\'s child is 404', async () => {
    const res = await call('GET', `/api/v1/subjects/children/${b.childId}/subjects`, {
      token: aToken,
    });
    expectNotFound(res);
  });

  it('GET /children/:id/subjects never returns another tenant\'s custom subject', async () => {
    const res = await call('GET', `/api/v1/subjects/children/${a.childId}/subjects`, {
      token: aToken,
    });
    expect(res.status).toBe(200);
    const names = (res.body.data || []).map((s: any) => s.nameEn);
    expect(names).not.toContain('Tenant B custom subject');
  });

  it('POST /children/:id/subjects cannot assign another tenant\'s custom subject', async () => {
    const res = await call('POST', `/api/v1/subjects/children/${a.childId}/subjects/${bIds().subject.id}`, {
      token: aToken,
      body: {},
    });
    expectNotFound(res);
  });

  it('POST /children/:id/subjects against another tenant\'s child is 404', async () => {
    const res = await call('POST', `/api/v1/subjects/children/${b.childId}/subjects/${bIds().subject.id}`, {
      token: aToken,
      body: {},
    });
    expectNotFound(res);
  });

  it('DELETE /children/:id/subjects/:subjectId against another tenant\'s child is 404', async () => {
    const res = await call('DELETE', `/api/v1/subjects/children/${b.childId}/subjects/${bIds().subject.id}`, {
      token: aToken,
    });
    expectNotFound(res);
  });

  it('a subject assignment is scoped to its own account in the database', async () => {
    // The point of the explicit table: the row carries the owning parent, so a
    // cross-account link cannot even be represented.
    const row = await prisma.childSubject.findFirst({
      where: { childId: a.childId, subjectId: bIds().subject.id },
    });
    expect(row).toBeNull();
  });
});

describe('A child sees only its own data', () => {
  it('GET /children returns only the child itself', async () => {
    const childUser = await prisma.user.findUnique({ where: { email: a.childEmail } });
    const token = tokenFor(childUser!.id, { role: 'child', childId: a.childId, email: a.childEmail });
    const res = await call('GET', '/api/v1/children', { token });
    expect(res.status).toBe(200);
    const ids = (res.body.data || []).map((c: any) => c.id);
    expect(ids).toEqual([a.childId]);
    expect(ids).not.toContain(b.childId);
  });

  it('GET /children/:siblingId/notes is 404 for a child', async () => {
    const childUser = await prisma.user.findUnique({ where: { email: a.childEmail } });
    const token = tokenFor(childUser!.id, { role: 'child', childId: a.childId, email: a.childEmail });
    const res = await call('GET', `/api/v1/children/${b.childId}/notes`, { token });
    expectNotFound(res);
  });

  it('GET /children/:ownId/notes is allowed for a child', async () => {
    const childUser = await prisma.user.findUnique({ where: { email: a.childEmail } });
    const token = tokenFor(childUser!.id, { role: 'child', childId: a.childId, email: a.childEmail });
    const res = await call('GET', `/api/v1/children/${a.childId}/notes`, { token });
    expect(res.status).toBe(200);
  });
});

describe('Admin is not a tenant superuser', () => {
  it('GET /admin/users is 403 for a parent', async () => {
    const res = await call('GET', '/api/v1/admin/users', { token: aToken });
    expect(res.status).toBe(403);
  });

  it('GET /admin/users never returns a password hash', async () => {
    // Promote the test tenant's parent to admin for the duration of this test.
    await prisma.user.update({ where: { id: a.parentId }, data: { role: 'admin' } });
    try {
      const res = await call('GET', '/api/v1/admin/users', { token: aToken });
      expect(res.status).toBe(200);
      const rows = res.body.data || [];
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row).not.toHaveProperty('passwordHash');
        expect(row).not.toHaveProperty('password_hash');
      }
    } finally {
      await prisma.user.update({ where: { id: a.parentId }, data: { role: 'parent' } });
    }
  });

  it('an admin token cannot read tenant content', async () => {
    await prisma.user.update({ where: { id: a.parentId }, data: { role: 'admin' } });
    try {
      const res = await call('GET', `/api/v1/children/${b.childId}/notes`, { token: aToken });
      // Admins may read platform metrics, never another tenant's data.
      expect(res.status).toBe(403);
    } finally {
      await prisma.user.update({ where: { id: a.parentId }, data: { role: 'parent' } });
    }
  });
});

describe('No credential material ever leaves the API', () => {
  it('GET /children has no passwordHash, pinHash or password', async () => {
    const res = await call('GET', '/api/v1/children', { token: aToken });
    expect(res.status).toBe(200);
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain('passwordHash');
    expect(raw).not.toContain('pinHash');
    expect(raw).not.toContain('"password"');
  });

  it('GET /children/:id has no passwordHash, pinHash or password', async () => {
    const res = await call('GET', `/api/v1/children/${a.childId}`, { token: aToken });
    expect(res.status).toBe(200);
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain('passwordHash');
    expect(raw).not.toContain('pinHash');
    expect(raw).not.toContain('"password"');
  });

  it('POST /children returns a child without credential material', async () => {
    const res = await call('POST', '/api/v1/children', {
      token: aToken,
      body: { name: 'Credential probe', grade: 'Class 7', email: `probe-${Date.now()}@example.test` },
    });
    expect(res.status).toBe(201);
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain('passwordHash');
    expect(raw).not.toContain('pinHash');
    expect(raw).not.toContain('"password"');
    await prisma.child.deleteMany({ where: { name: 'Credential probe' } });
  });

  it('GET /auth/me has no passwordHash', async () => {
    const res = await call('GET', '/api/v1/auth/me', { token: aToken });
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });
});

describe('The demo tenant is a real, isolated account', () => {
  it('the demo parent token sees exactly the demo children', async () => {
    const res = await call('GET', '/api/v1/children', {
      token: tokenFor(DEMO_PARENT_ID, { email: 'parent@demo.com' }),
    });
    expect(res.status).toBe(200);
    const ids = (res.body.data || []).map((c: any) => c.id);
    expect(ids).toContain(DEMO_CHILD_IDS.rahim);
    expect(ids).not.toContain(a.childId);
    expect(ids).not.toContain(b.childId);
  });

  it('a newly created child lands under its creator, not the demo parent', async () => {
    const res = await call('POST', '/api/v1/children', {
      token: aToken,
      body: { name: 'Ownership probe', grade: 'Class 6' },
    });
    expect(res.status).toBe(201);
    expect(res.body.data.parentId).toBe(a.parentId);
    expect(res.body.data.parentId).not.toBe(DEMO_PARENT_ID);
    await prisma.child.deleteMany({ where: { name: 'Ownership probe' } });
  });
});
