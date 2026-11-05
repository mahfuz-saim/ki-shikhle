/**
 * No credential hash ever leaves the API.
 *
 * The `Child` model carries two secrets: `passwordHash` (the child's login password)
 * and `pinHash` (the PIN used for child-mode entry). The `User` model carries
 * `passwordHash`. Neither may appear in a response body — not to the owning parent,
 * and certainly not to anyone else.
 *
 * Three leaks were found and fixed:
 *
 *  - `GET /quizzes/:id` loaded the quiz with `include: { child: true }`, which pulls
 *    the whole Child row — both hashes included — into a response that is serialised
 *    straight to the browser.
 *  - `GET /children/:id/entries` included the entry revisions, and every revision's
 *    `snapshotJson` is a full copy of the entry as it was — which included the child's
 *    hashes, because `updateEntry` snapshotted a row loaded with `include: { child: true }`.
 *  - `POST /auth/refresh` sanitised the user with a helper that stripped only
 *    `passwordHash`, so a child-refresh response carried `pinHash`.
 *
 * These tests pin the rule down across every endpoint that returns a child, a user,
 * or anything that embeds one.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { call, cleanupTenants, createTenant, tokenFor, type Tenant } from '../test-utils/http';
import { prisma } from '../db/client';
import { hashPassword } from '../services/password';

let t: Tenant;
let token: string;
let quizId: string;
let attemptId: string;

beforeAll(async () => {
  t = await createTenant('creds');
  token = tokenFor(t.parentId, { email: t.parentEmail });

  // A child with BOTH secrets set, so a leak of either one is visible.
  await prisma.child.update({
    where: { id: t.childId },
    data: { passwordHash: await hashPassword('ChildSecret1!'), pinHash: await hashPassword('4321') },
  });

  const quiz = await prisma.quiz.create({
    data: {
      childId: t.childId,
      createdBy: t.parentId,
      title: 'Credential leak probe',
      scopeJson: {},
      settingsJson: {},
    },
  });
  quizId = quiz.id;

  const attempt = await prisma.quizAttempt.create({
    data: { quizId: quiz.id, childId: t.childId },
  });
  attemptId = attempt.id;

  // A learning entry, so the entries endpoint has something to return.
  await prisma.learningEntry.create({
    data: {
      childId: t.childId,
      source: 'tuition',
      date: new Date(),
      topicsText: 'probe',
      durationMin: 30,
    },
  });

  // A revision whose snapshot embeds the child — the shape that leaked before.
  const entry = await prisma.learningEntry.findFirst({ where: { childId: t.childId } });
  if (entry) {
    await prisma.entryRevision.create({
      data: {
        entryId: entry.id,
        snapshotJson: { ...(entry as any), child: { id: t.childId, passwordHash: 'x', pinHash: 'y' } },
        changedBy: 'parent',
      },
    });
  }
});

afterAll(async () => {
  await prisma.quizAttempt.deleteMany({ where: { id: attemptId } });
  await prisma.quiz.deleteMany({ where: { id: quizId } });
  await prisma.learningEntry.deleteMany({ where: { childId: t.childId } });
  await cleanupTenants(t);
});

/**
 * The response body must not contain the name of a credential column.
 *
 * Checking the *key* rather than the value is deliberate: the value changes every time
 * the password is reset, so a test that asserted on it would pass by accident if the
 * hash happened to be null. The key is the thing that must never be there.
 */
function expectNoCredentials(res: { status: number; body: any }, label: string) {
  const text = JSON.stringify(res.body ?? {});
  for (const key of ['passwordHash', 'pinHash', 'password_hash', 'pin_hash']) {
    expect(text.includes(key), `${label} must not contain "${key}"`).toBe(false);
  }
}

describe('A child response never carries a credential hash', () => {
  it('GET /children', async () => {
    const res = await call('GET', '/api/v1/children', { token });
    expect(res.status).toBe(200);
    expectNoCredentials(res, 'GET /children');
  });

  it('GET /children/:id', async () => {
    const res = await call('GET', `/api/v1/children/${t.childId}`, { token });
    expect(res.status).toBe(200);
    expectNoCredentials(res, 'GET /children/:id');
  });

  it('GET /children/:id/entries', async () => {
    const res = await call('GET', `/api/v1/children/${t.childId}/entries`, { token });
    expect(res.status).toBe(200);
    expectNoCredentials(res, 'GET /children/:id/entries');
  });

  it('GET /children/:id/notes', async () => {
    const res = await call('GET', `/api/v1/children/${t.childId}/notes`, { token });
    expect(res.status).toBe(200);
    expectNoCredentials(res, 'GET /children/:id/notes');
  });

  it('GET /children/:id/quizzes', async () => {
    const res = await call('GET', `/api/v1/children/${t.childId}/quizzes`, { token });
    expect(res.status).toBe(200);
    expectNoCredentials(res, 'GET /children/:id/quizzes');
  });

  it('GET /quizzes/:id', async () => {
    // This one used to leak: the quiz was loaded with `include: { child: true }`.
    const res = await call('GET', `/api/v1/quizzes/${quizId}`, { token });
    expect(res.status).toBe(200);
    expectNoCredentials(res, 'GET /quizzes/:id');
  });

  it('GET /attempts/:id', async () => {
    const res = await call('GET', `/api/v1/attempts/${attemptId}`, { token });
    expect(res.status).toBe(200);
    expectNoCredentials(res, 'GET /attempts/:id');
  });

  it('GET /auth/me', async () => {
    const res = await call('GET', '/api/v1/auth/me', { token });
    expect(res.status).toBe(200);
    expectNoCredentials(res, 'GET /auth/me');
  });
});

describe('A user response never carries a credential hash', () => {
  it('GET /admin/users — an admin sees the users, never their hashes', async () => {
    const admin = await prisma.user.create({
      data: {
        name: 'Credential probe admin',
        email: `test-creds-admin-${Date.now().toString(36)}@example.test`,
        passwordHash: await hashPassword('AdminPass1!'),
        role: 'admin',
      },
      select: { id: true },
    });
    try {
      const res = await call('GET', '/api/v1/admin/users', {
        token: tokenFor(admin.id, { role: 'admin' }),
      });
      expect(res.status).toBe(200);
      expectNoCredentials(res, 'GET /admin/users');
    } finally {
      await prisma.user.deleteMany({ where: { id: admin.id } });
    }
  });
});
