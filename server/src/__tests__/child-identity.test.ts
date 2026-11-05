/**
 * Child login identity — one credential, two homes.
 *
 * A child has a `Child` profile row (name, grade, PIN) **and** a `users` row with
 * `role: 'child'` (the actual login identity). Both used to carry a password hash
 * independently, so a password changed in one place did not change the other: the old
 * password kept working, and the two hashes silently diverged.
 *
 * These tests pin the invariant down.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../db/client';
import { call, cleanupTenants, createTenant, tokenFor, type Tenant } from '../test-utils/http';
import { hashPassword, verifyPassword } from '../services/password';
import { store, ensureDemoCredentials } from '../core/store';

let t: Tenant;

beforeAll(async () => {
  t = await createTenant('identity');
});

afterAll(async () => {
  await cleanupTenants(t);
});

describe('A child\'s credential lives in exactly one place', () => {
  it('creating a child with a password writes both the Child row and the login identity', async () => {
    const email = `newchild-${Date.now()}@example.test`;
    const token = tokenFor(t.parentId, { email: t.parentEmail });

    const res = await call('POST', '/api/v1/children', {
      token,
      body: { name: 'New Child', grade: 'Class 4', email, password: 'ChildPass1!' },
    });
    expect(res.status).toBe(201);

    const child = await prisma.child.findFirst({ where: { email } });
    const identity = await prisma.user.findFirst({ where: { email } });
    expect(child).toBeTruthy();
    expect(identity).toBeTruthy();
    expect(identity!.role).toBe('child');

    // Both copies verify against the same password.
    expect(await verifyPassword(child!.passwordHash!, 'ChildPass1!')).toBe(true);
    expect(await verifyPassword(identity!.passwordHash, 'ChildPass1!')).toBe(true);

    // And the response never carried either hash.
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');

    await prisma.user.deleteMany({ where: { email } });
    await prisma.child.deleteMany({ where: { email } });
  });

  it('changing a child\'s password updates BOTH copies', async () => {
    const token = tokenFor(t.parentId, { email: t.parentEmail });

    const res = await call('PATCH', `/api/v1/children/${t.childId}`, {
      token,
      body: { password: 'RotatedPass1!' },
    });
    expect(res.status).toBe(200);

    const child = await prisma.child.findUnique({ where: { id: t.childId } });
    const identity = await prisma.user.findFirst({ where: { email: t.childEmail } });

    expect(await verifyPassword(child!.passwordHash!, 'RotatedPass1!')).toBe(true);
    expect(await verifyPassword(identity!.passwordHash, 'RotatedPass1!')).toBe(true);
    // The old password is dead in both places.
    expect(await verifyPassword(child!.passwordHash!, 'TestPass1!')).toBe(false);
    expect(await verifyPassword(identity!.passwordHash, 'TestPass1!')).toBe(false);
  });

  it('the child can log in with the rotated password', async () => {
    const res = await call('POST', '/api/v1/auth/login', {
      body: { email: t.childEmail, password: 'RotatedPass1!' },
    });
    expect(res.status).toBe(200);
    expect(res.body?.data?.accessToken).toBeTruthy();
  });

  it('the child cannot log in with the old password', async () => {
    const res = await call('POST', '/api/v1/auth/login', {
      body: { email: t.childEmail, password: 'TestPass1!' },
    });
    expect(res.status).toBe(401);
  });

  it('a child changing their own password updates the Child row too', async () => {
    const identity = await prisma.user.findFirst({ where: { email: t.childEmail } });
    const childToken = tokenFor(identity!.id, {
      role: 'child',
      childId: t.childId,
      email: t.childEmail,
    });

    const res = await call('POST', '/api/v1/auth/change-password', {
      token: childToken,
      body: { currentPassword: 'RotatedPass1!', newPassword: 'SelfChanged1!' },
    });
    expect(res.status).toBe(200);

    const child = await prisma.child.findUnique({ where: { id: t.childId } });
    expect(await verifyPassword(child!.passwordHash!, 'SelfChanged1!')).toBe(true);
  });
});

describe('A child-role account with no Child profile is rejected', () => {
  it('fails closed rather than falling back to some other account', async () => {
    // A child-role `User` with no matching `Child` row — the shape an orphaned
    // credential takes. It must authenticate as nobody, not as the demo family and
    // not as some default parent.
    //
    // The row is created here rather than expected to be present, because the
    // premise is that it is *absent* from `children`. A leftover row from an older
    // schema (the demo seed used to write `ownerx@mail.com` as a real child) would
    // silently turn this into a different test — and one that passes for the wrong
    // reason.
    const email = `test-orphan-${Date.now().toString(36)}@example.test`;
    const orphan = await prisma.user.create({
      data: {
        name: 'Orphan Child Identity',
        email,
        passwordHash: await hashPassword('OrphanPass1!'),
        role: 'child',
      },
      select: { id: true, email: true },
    });

    try {
      // The orphan really has no Child row.
      const child = await prisma.child.findFirst({ where: { email } });
      expect(child).toBeNull();

      const res = await call('GET', '/api/v1/children', {
        token: tokenFor(orphan.id, { role: 'child', email: orphan.email }),
      });
      expect(res.status).toBe(401);
    } finally {
      await prisma.user.deleteMany({ where: { id: orphan.id } });
    }
  });
});

describe('The in-memory store mirrors the same rules', () => {
  it('the store exposes no accessor that returns every user', () => {
    // `UserPartition` deliberately has no `listAll()` — a caller must say whose data it
    // wants. This is the property that stopped the fallback path from being a
    // shared-tenant leak.
    expect((store.users as any).listAll).toBeUndefined();
  });

  it('the seeded demo child identities store a hash, never a plaintext password', async () => {
    // The demo hashes are computed lazily (the store is synchronous, hashing is async).
    await ensureDemoCredentials();
    const demoChildUser = store.users.byEmail('rahim@demo.com');
    expect(demoChildUser).toBeTruthy();
    expect(demoChildUser!.passwordHash).toBeTruthy();
    expect(demoChildUser!.passwordHash).not.toBe('Password123!');
  });
});
