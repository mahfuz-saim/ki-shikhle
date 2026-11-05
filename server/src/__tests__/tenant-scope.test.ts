/**
 * The degraded-mode isolation suite.
 *
 * The API is documented to run with no database at all ("clone and run with no env
 * file"). That fallback used to be a set of bare, **global** `memX` arrays — every
 * tenant read the same array, so the no-database path was a shared-tenant data leak
 * with a different shape than the database path.
 *
 * `core/store.ts` replaced those arrays with one owner-partitioned store, and
 * `core/tenancy.ts` applies the identical ownership rules to rows loaded from it.
 * This suite proves that: it forces every Prisma call to reject, so the whole request
 * path runs against the in-memory store, and then runs the isolation matrix again.
 *
 * The mem path is NOT a bypass. If it ever becomes one, the "no database" deployment
 * leaks every tenant's data — which is exactly what used to happen.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

/**
 * A stand-in for the Prisma client where every call rejects.
 *
 * This is the same shape as the `unavailableProxy` in `db/client.ts` — the code path a
 * server with no generated client or no reachable database actually takes.
 */
function unavailableProxy(path = 'prisma'): any {
  const target = function () {} as any;
  return new Proxy(target, {
    get: (_t, prop) => {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined;
      return unavailableProxy(`${path}.${String(prop)}`);
    },
    apply: () => Promise.reject(new Error(`Prisma unavailable (${path})`)),
  });
}

vi.mock('../db/client', () => ({
  prisma: unavailableProxy(),
  connectDb: async () => {},
}));

// Vitest hoists `vi.mock` above the imports, so these static imports already see the
// mocked Prisma client — no top-level await needed.
import { store, resetStore, DEMO_PARENT_ID, DEMO_CHILD_IDS } from '../core/store';
import { tokenFor, call } from '../test-utils/http';
import { hashPassword } from '../services/password';

/** A tenant that exists only in the in-memory store. */
interface MemTenant {
  parentId: string;
  childId: string;
  token: string;
  childToken: string;
}

let a: MemTenant;
let b: MemTenant;

beforeAll(async () => {
  resetStore();

  const passwordHash = await hashPassword('TestPass1!');

  const makeTenant = async (label: string): Promise<MemTenant> => {
    const parentId = `mem-parent-${label}`;
    const childId = `mem-child-${label}`;
    store.users.add({
      id: parentId,
      name: `Mem ${label}`,
      email: `${label}@mem.test`,
      passwordHash,
      role: 'parent',
      createdAt: new Date().toISOString(),
    });
    store.children.add({
      id: childId,
      ownerId: parentId,
      name: `Mem ${label} Child`,
      grade: 'Class 8',
      email: `${label}-child@mem.test`,
      passwordHash,
      createdAt: new Date().toISOString(),
    });
    store.users.add({
      id: `mem-user-${label}`,
      name: `Mem ${label} Child`,
      email: `${label}-child@mem.test`,
      passwordHash,
      role: 'child',
      createdAt: new Date().toISOString(),
    });
    return {
      parentId,
      childId,
      token: tokenFor(parentId, { email: `${label}@mem.test` }),
      childToken: tokenFor(`mem-user-${label}`, {
        role: 'child',
        childId,
        email: `${label}-child@mem.test`,
      }),
    };
  };

  a = await makeTenant('alpha');
  b = await makeTenant('beta');

  // Give tenant B a note, so "404 because it exists but is not yours" is distinguishable
  // from "404 because nothing is there".
  store.notes.add({
    id: 'mem-note-beta',
    ownerId: b.parentId,
    childId: b.childId,
    subject: 'Physics',
    title: 'Tenant B secret note',
    date: new Date().toISOString(),
    textClean: 'secret',
  });
  store.entries.add({
    id: 'mem-entry-beta',
    ownerId: b.parentId,
    childId: b.childId,
    source: 'tuition',
    date: new Date().toISOString(),
    topicsText: 'Tenant B secret topic',
    durationMin: 30,
  });
  store.routines.add({
    id: 'mem-routine-beta',
    ownerId: b.parentId,
    childId: b.childId,
    name: 'Tenant B secret routine',
    source: 'tuition',
    weekdays: [1],
    startTime: '16:00',
    durationMin: 60,
    startsOn: new Date().toISOString(),
    active: true,
  });
  store.quizzes.add({
    id: 'mem-quiz-beta',
    ownerId: b.parentId,
    childId: b.childId,
    createdBy: b.parentId,
    title: 'Tenant B secret quiz',
    scopeJson: {},
    settingsJson: {},
    questions: [{ id: 'mem-q1', prompt: 'Secret question?', correctAnswer: 'a', explanation: 'because' }],
  });
  store.attempts.add({
    id: 'mem-attempt-beta',
    ownerId: b.parentId,
    childId: b.childId,
    quizId: 'mem-quiz-beta',
    startedAt: new Date().toISOString(),
    answers: [],
  });
});

afterAll(() => {
  resetStore();
});

function expectNotFound(res: { status: number; body: any }) {
  expect(res.status).toBe(404);
  expect(res.body?.success).toBe(false);
}

describe('Degraded mode still isolates tenants', () => {
  it('GET /children returns only the caller\'s own children', async () => {
    const res = await call('GET', '/api/v1/children', { token: a.token });
    expect(res.status).toBe(200);
    const ids = (res.body.data || []).map((c: any) => c.id);
    expect(ids).toContain(a.childId);
    expect(ids).not.toContain(b.childId);
    expect(ids).not.toContain(DEMO_CHILD_IDS.rahim);
    expect(ids).not.toContain(DEMO_CHILD_IDS.tasnim);
    expect(ids).not.toContain(DEMO_CHILD_IDS.fahim);
  });

  it('GET /children never returns the demo tenant\'s children to another account', async () => {
    const res = await call('GET', '/api/v1/children', { token: b.token });
    expect(res.status).toBe(200);
    const ids = (res.body.data || []).map((c: any) => c.id);
    expect(ids).not.toContain(DEMO_CHILD_IDS.rahim);
  });

  it('the demo tenant sees exactly its own children', async () => {
    const res = await call('GET', '/api/v1/children', {
      token: tokenFor(DEMO_PARENT_ID, { email: 'parent@demo.com' }),
    });
    expect(res.status).toBe(200);
    const ids = (res.body.data || []).map((c: any) => c.id);
    expect(ids).toContain(DEMO_CHILD_IDS.rahim);
    expect(ids).not.toContain(a.childId);
    expect(ids).not.toContain(b.childId);
  });
});

describe('Degraded mode: cross-tenant child reads are 404', () => {
  const reads: Array<[string, string]> = [
    ['GET', '/api/v1/children/:id'],
    ['GET', '/api/v1/children/:id/notes'],
    ['GET', '/api/v1/children/:id/entries'],
    ['GET', '/api/v1/children/:id/quizzes'],
    ['GET', '/api/v1/children/:id/routines'],
    ['GET', '/api/v1/children/:id/schedule'],
    ['GET', '/api/v1/children/:id/dashboard/summary'],
    ['GET', '/api/v1/children/:id/unlogged-alert'],
  ];

  it.each(reads)('%s %s against another tenant\'s child is 404', async (method, path) => {
    const url = path.replace(':id', b.childId);
    const res = await call(method, url, { token: a.token });
    expectNotFound(res);
  });

  it('POST /children/:id/notes against another tenant\'s child is 404', async () => {
    const res = await call('POST', `/api/v1/children/${b.childId}/notes`, {
      token: a.token,
      body: { subject: 'Physics', textClean: 'intruding', date: '2026-01-01' },
    });
    expectNotFound(res);
  });

  it('POST /children/:id/entries against another tenant\'s child is 404', async () => {
    const res = await call('POST', `/api/v1/children/${b.childId}/entries`, {
      token: a.token,
      body: { source: 'school', date: '2026-01-01', topicsText: 'intruding' },
    });
    expectNotFound(res);
  });
});

describe('Degraded mode: cross-tenant entity reads are 404', () => {
  it('PATCH /notes/:id against another tenant\'s note is 404', async () => {
    const res = await call('PATCH', '/api/v1/notes/mem-note-beta', {
      token: a.token,
      body: { title: 'hijacked' },
    });
    expectNotFound(res);
  });

  it('DELETE /notes/:id against another tenant\'s note is 404', async () => {
    const res = await call('DELETE', '/api/v1/notes/mem-note-beta', { token: a.token });
    expectNotFound(res);
  });

  it('PATCH /entries/:id against another tenant\'s entry is 404', async () => {
    const res = await call('PATCH', '/api/v1/entries/mem-entry-beta', {
      token: a.token,
      body: { topicsText: 'hijacked' },
    });
    expectNotFound(res);
  });

  it('GET /quizzes/:id against another tenant\'s quiz is 404', async () => {
    const res = await call('GET', '/api/v1/quizzes/mem-quiz-beta', { token: a.token });
    expectNotFound(res);
  });

  it('GET /attempts/:id against another tenant\'s attempt is 404', async () => {
    const res = await call('GET', '/api/v1/attempts/mem-attempt-beta', { token: a.token });
    expectNotFound(res);
  });

  it('PUT /attempts/:id/answers against another tenant\'s attempt is 404', async () => {
    const res = await call('PUT', '/api/v1/attempts/mem-attempt-beta/answers', {
      token: a.token,
      body: { answers: [{ questionId: 'mem-q1', answer: 'a' }] },
    });
    expectNotFound(res);
  });

  it('DELETE /routines/:id against another tenant\'s routine is 404', async () => {
    const res = await call('DELETE', '/api/v1/routines/mem-routine-beta', { token: a.token });
    expectNotFound(res);
  });
});

describe('Degraded mode: a child sees only its own data', () => {
  it('GET /children returns only the child itself', async () => {
    const res = await call('GET', '/api/v1/children', { token: a.childToken });
    expect(res.status).toBe(200);
    const ids = (res.body.data || []).map((c: any) => c.id);
    expect(ids).toEqual([a.childId]);
  });

  it('a sibling\'s notes are 404', async () => {
    const res = await call('GET', `/api/v1/children/${b.childId}/notes`, { token: a.childToken });
    expectNotFound(res);
  });
});

describe('Degraded mode: no credential material leaves the API', () => {
  it('GET /children has no passwordHash, pinHash or password', async () => {
    const res = await call('GET', '/api/v1/children', { token: a.token });
    expect(res.status).toBe(200);
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain('passwordHash');
    expect(raw).not.toContain('pinHash');
    expect(raw).not.toContain('"password"');
  });

  it('GET /children/:id has no passwordHash, pinHash or password', async () => {
    const res = await call('GET', `/api/v1/children/${a.childId}`, { token: a.token });
    expect(res.status).toBe(200);
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain('passwordHash');
    expect(raw).not.toContain('pinHash');
    expect(raw).not.toContain('"password"');
  });
});

describe('Degraded mode: the backdoor stays shut', () => {
  it('rejects the demo token', async () => {
    const res = await call('GET', '/api/v1/children', { token: 'demo-parent-token' });
    expect(res.status).toBe(401);
  });

  it('rejects a mock refresh token', async () => {
    const res = await call('POST', '/api/v1/auth/refresh', { body: { refreshToken: 'mock-refresh-parent' } });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown account', async () => {
    const res = await call('GET', '/api/v1/children', { token: tokenFor('nobody-at-all') });
    expect(res.status).toBe(401);
  });
});
