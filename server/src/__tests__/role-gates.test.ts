/**
 * A child token must not be able to do a parent's job.
 *
 * The tenancy layer answers "is this *your* child?", which is the right question
 * for reading. But for actions that **manage** the account it is the wrong
 * question: a child actor's `ownerId` is the *parent's* id, so anything filtered
 * by `ownerId` hands the child the parent's data, and `assertChildAccess` passes
 * for the child's own row.
 *
 * That left a child able to create a sibling under the parent account, rename and
 * re-grade themselves, soft-delete their own profile, set their own PIN, curate
 * their own subjects, generate and assign quizzes for themselves, rewrite a
 * question's `correctAnswer`, self-attest parent verification of their own
 * learning log, and read the parent's invoices and notifications.
 *
 * These routes are now role-gated. The role is read from the database, not from
 * the JWT claim, so a token minted before a demotion cannot keep its old powers.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { call, cleanupTenants, createTenant, tokenFor, type Tenant } from '../test-utils/http';

let t: Tenant;
let childToken: string;
let childId: string;

beforeAll(async () => {
  t = await createTenant('roles');
  childId = t.childId;

  // A child-scoped token, exactly as `POST /children/:id/enter` issues it.
  const entered = await call('POST', `/api/v1/children/${t.childId}/enter`, {
    token: tokenFor(t.parentId, { email: t.parentEmail }),
    body: {},
  });
  expect(entered.status).toBe(200);
  childToken = entered.body?.data?.token;
  expect(childToken).toBeTruthy();
});

afterAll(async () => {
  await cleanupTenants(t);
});

/**
 * Every one of these must be refused for a child token.
 *
 * The paths carry a `{child}` placeholder rather than a real id: `it()` titles are
 * evaluated when the suite is collected, which is before `beforeAll` has created
 * the tenant, so the id is not known yet.
 */
const PARENT_ONLY: Array<[string, string, any]> = [
  ['POST', '/api/v1/children', { name: 'Sneaky', grade: 'Class 9' }],
  ['PATCH', '/api/v1/children/{child}', { name: 'Renamed' }],
  ['DELETE', '/api/v1/children/{child}', undefined],
  ['POST', '/api/v1/children/{child}/pin', { pin: '1234' }],
  ['PUT', '/api/v1/children/{child}/unlogged-alert', { enabled: true }],
  ['POST', '/api/v1/children/{child}/unlogged-alert/test', {}],
  ['POST', '/api/v1/subjects', { nameEn: 'Sneaky', nameBn: 'Sneaky' }],
  ['POST', '/api/v1/subjects/children/{child}/subjects/any-subject-id', {}],
  ['POST', '/api/v1/children/{child}/quizzes/generate', { numQuestions: 5 }],
  ['POST', '/api/v1/children/{child}/quizzes/auto-schedule', { enabled: true }],
  ['POST', '/api/v1/children/{child}/quizzes/auto-schedule/run', {}],
  ['POST', '/api/v1/billing/demo-checkout', { planCode: 'pro' }],
  ['POST', '/api/v1/billing/cancel', {}],
  ['GET', '/api/v1/billing/invoices', undefined],
  ['GET', '/api/v1/billing/subscription', undefined],
];

describe('A child token cannot perform a parent-only action', () => {
  for (const [method, pathTemplate, body] of PARENT_ONLY) {
    it(`${method} ${pathTemplate.replace('{child}', '<child>')} is refused`, async () => {
      const path = pathTemplate.replace('{child}', childId);
      const res = await call(method, path, { token: childToken, body });
      // 403 (wrong role) is the right answer. 401 would mean the token was not even
      // recognised — also a refusal, but it means something else broke.
      expect([401, 403], `${method} ${path} answered ${res.status}`).toContain(res.status);
      expect(res.status, `${method} ${path} was allowed for a child`).not.toBe(200);
      expect(res.status, `${method} ${path} was allowed for a child`).not.toBe(201);
    });
  }
});

describe('A child token can still do a child\'s own work', () => {
  it('reads its own notes', async () => {
    const res = await call('GET', `/api/v1/children/${childId}/notes`, { token: childToken });
    expect(res.status).toBe(200);
  });

  it('reads its own dashboard', async () => {
    const res = await call('GET', `/api/v1/children/${childId}/dashboard/summary`, { token: childToken });
    expect(res.status).toBe(200);
  });

  it('reads its own quiz list', async () => {
    const res = await call('GET', `/api/v1/children/${childId}/quizzes`, { token: childToken });
    expect(res.status).toBe(200);
  });

  it('reads its own subject list', async () => {
    const res = await call('GET', `/api/v1/subjects/children/${childId}/subjects`, { token: childToken });
    expect(res.status).toBe(200);
  });

  it('writes its own learning log', async () => {
    const res = await call('POST', `/api/v1/children/${childId}/entries`, {
      token: childToken,
      body: { source: 'self_study', date: new Date().toISOString().slice(0, 10), topicsText: 'x', durationMin: 20 },
    });
    expect([200, 201]).toContain(res.status);
  });
});

describe('A parent can still do everything', () => {
  it('reads its own invoices', async () => {
    const res = await call('GET', '/api/v1/billing/invoices', {
      token: tokenFor(t.parentId, { email: t.parentEmail }),
    });
    expect(res.status).toBe(200);
  });

  it('reads its own subscription', async () => {
    const res = await call('GET', '/api/v1/billing/subscription', {
      token: tokenFor(t.parentId, { email: t.parentEmail }),
    });
    expect(res.status).toBe(200);
  });

  it('generates a quiz for its child', async () => {
    const res = await call('POST', `/api/v1/children/${t.childId}/quizzes/generate`, {
      token: tokenFor(t.parentId, { email: t.parentEmail }),
      body: { numQuestions: 5, difficulty: 'mixed', scope: 'last7' },
    });
    expect([200, 201]).toContain(res.status);
  });
});
