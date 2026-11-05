/**
 * The child portal has to work for a child that was created at runtime.
 *
 * `enterChildMode` signs a token whose subject is the child's login identity — the
 * `users` row with `role: 'child'` — because `resolveActor` reads the role from the
 * database and rejects any subject it cannot find there.
 *
 * The identity lookup used to consult the **in-memory store**, which only holds the
 * seeded demo fixtures. For every child created through the API it found nothing and
 * fell back to the child's *profile* id — an id that is not a `users` row. The token
 * was then rejected as an unknown account, and every child-mode request came back
 * 401. The symptom was "the child portal shows nothing, and my own notes are empty".
 *
 * These tests cover the whole flow: enter child mode, read your own data, and be
 * unable to read a sibling's.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { call, cleanupTenants, createTenant, tokenFor, type Tenant } from '../test-utils/http';
import { prisma } from '../db/client';

let t: Tenant;
let siblingId: string;

beforeAll(async () => {
  t = await createTenant('childmode');

  // A second child of the same parent, so sibling isolation can be tested.
  const sibling = await prisma.child.create({
    data: {
      parentId: t.parentId,
      name: 'Test childmode Sibling',
      grade: 'Class 8',
      email: `test-childmode-sibling-${Date.now().toString(36)}@example.test`,
      slug: `test-cm-sib-${Date.now().toString(36)}`,
    },
    select: { id: true },
  });
  siblingId = sibling.id;

  // A note on the first child, so "read your own data" has something to read.
  await prisma.note.create({
    data: {
      childId: t.childId,
      subject: 'Mathematics',
      title: 'Own note',
      textClean: 'A note the child should be able to read.',
      date: new Date(),
    },
  });
});

afterAll(async () => {
  await prisma.note.deleteMany({ where: { childId: { in: [t.childId, siblingId] } } });
  await prisma.child.deleteMany({ where: { id: siblingId } });
  await cleanupTenants(t);
});

/** Enter child mode and return the child-scoped token. */
async function enterChildMode(childId: string): Promise<string> {
  const res = await call('POST', `/api/v1/children/${childId}/enter`, {
    token: tokenFor(t.parentId, { email: t.parentEmail }),
    body: {},
  });
  expect(res.status, `entering child mode failed: ${JSON.stringify(res.body)}`).toBe(200);
  const token = res.body?.data?.token;
  expect(token, 'no token was returned').toBeTruthy();
  return token;
}

describe('Entering child mode issues a usable child token', () => {
  it('the token reads the child\'s own notes', async () => {
    const token = await enterChildMode(t.childId);
    const res = await call('GET', `/api/v1/children/${t.childId}/notes`, { token });
    // The regression: the token's subject was the child's profile id, which is not a
    // `users` row, so this came back 401 instead of 200.
    expect(res.status).toBe(200);
    expect(res.body?.data?.length ?? res.body?.data).toBeTruthy();
  });

  it('the token reads the child\'s own dashboard', async () => {
    const token = await enterChildMode(t.childId);
    const res = await call('GET', `/api/v1/children/${t.childId}/dashboard/summary`, { token });
    expect(res.status).toBe(200);
  });

  it('the token is a child token, not a parent token', async () => {
    const token = await enterChildMode(t.childId);
    // A parent token would list every child of the account.
    const res = await call('GET', '/api/v1/children', { token });
    expect(res.status).toBe(200);
    const rows = res.body?.data || [];
    const foreign = rows.filter((c: any) => c.id !== t.childId);
    expect(foreign, 'a child token listed another child').toHaveLength(0);
  });

  it('the token cannot read a sibling\'s notes', async () => {
    const token = await enterChildMode(t.childId);
    const res = await call('GET', `/api/v1/children/${siblingId}/notes`, { token });
    expect(res.status).toBe(404);
  });

  it('the token cannot read a sibling\'s dashboard', async () => {
    const token = await enterChildMode(t.childId);
    const res = await call('GET', `/api/v1/children/${siblingId}/dashboard/summary`, { token });
    expect(res.status).toBe(404);
  });

  it('a sibling\'s token cannot read the first child\'s notes', async () => {
    const token = await enterChildMode(siblingId);
    const res = await call('GET', `/api/v1/children/${t.childId}/notes`, { token });
    expect(res.status).toBe(404);
  });
});

describe('Entering child mode without a PIN', () => {
  it('works when the child has no PIN set', async () => {
    // The schema used to demand 4-6 digits unconditionally, so a child whose parent
    // never set a PIN was rejected with a 400 before the service was reached.
    const child = await prisma.child.create({
      data: {
        parentId: t.parentId,
        name: 'Test childmode NoPin',
        grade: 'Class 8',
        email: `test-childmode-nopin-${Date.now().toString(36)}@example.test`,
        slug: `test-cm-nopin-${Date.now().toString(36)}`,
      },
      select: { id: true },
    });
    try {
      const res = await call('POST', `/api/v1/children/${child.id}/enter`, {
        token: tokenFor(t.parentId, { email: t.parentEmail }),
        body: {},
      });
      expect(res.status).toBe(200);
      expect(res.body?.data?.token).toBeTruthy();
    } finally {
      await prisma.child.deleteMany({ where: { id: child.id } });
    }
  });
});
