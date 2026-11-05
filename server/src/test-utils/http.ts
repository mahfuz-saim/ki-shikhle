/**
 * HTTP-level test helpers.
 *
 * The regression suites drive the real Hono app through `app.request(...)`, so they
 * exercise the whole stack: routing, the `auth` middleware, the tenancy checks, and the
 * error envelope. Calling the service functions directly would skip the middleware —
 * which is where most of the original bugs lived.
 */

import jwt from 'jsonwebtoken';
import { app } from '../app';
import { env } from '../config/env';
import { prisma } from '../db/client';
import { hashPassword } from '../services/password';

export interface Tenant {
  /** The parent's `users.id`. */
  parentId: string;
  parentEmail: string;
  password: string;
  /** The child's `children.id`. */
  childId: string;
  childEmail: string;
}

let counter = 0;

/**
 * Create a real parent + child pair in the database.
 *
 * The rows are tagged with a `test-` email prefix so `cleanupTenants()` can remove them,
 * and so a stray row can never be mistaken for production data.
 */
export async function createTenant(label = 'tenant'): Promise<Tenant> {
  const n = ++counter;
  const stamp = `${Date.now().toString(36)}${n}`;
  const parentEmail = `test-${label}-${stamp}@example.test`;
  const childEmail = `test-${label}-${stamp}-child@example.test`;
  const password = 'TestPass1!';

  const passwordHash = await hashPassword(password);

  // Fail loudly if the database is unreachable.
  //
  // Every service falls back to the in-memory store when Prisma rejects, and the
  // in-memory store does not contain the tenant that `createTenant` is about to
  // write. So a dead database turned a 404-isolation test into a 401 (the token
  // could not resolve to an account) — a failure that looks like an auth bug and
  // sends you hunting in the wrong file. It also made a whole suite take an hour,
  // because each Prisma call waited out its connect timeout.
  //
  // A missing database is an environment problem, not a test failure, so it is
  // reported as such.
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e: any) {
    throw new Error(
      `The test database is unreachable (${(e as Error).message}). ` +
        `Start Postgres and run \`npm run db:migrate && npm run db:seed\`, then re-run the tests. ` +
        `Without a database these suites cannot pass — the API falls back to the in-memory store, ` +
        `which does not contain the tenants the tests create.`
    );
  }

  const parent = await prisma.user.create({
    data: { name: `Test ${label}`, email: parentEmail, passwordHash, role: 'parent' },
    select: { id: true },
  });

  // A plan, so the child-limit entitlement check has something to read. Without it the
  // account falls back to the `free` plan, which allows exactly one child — and a test
  // that creates a second child would get a 403 for a reason that has nothing to do
  // with isolation.
  const plan =
    (await prisma.plan.findFirst({ where: { code: 'pro' } })) ||
    (await prisma.plan.findFirst({ where: { code: 'free' } }));
  if (plan) {
    await prisma.subscription.create({
      data: { userId: parent.id, planId: plan.id, status: 'active', childSlots: 5 },
    });
  }

  const child = await prisma.child.create({
    data: {
      parentId: parent.id,
      name: `Test ${label} Child`,
      grade: 'Class 8',
      email: childEmail,
      passwordHash,
      slug: `test-${stamp}`,
    },
    select: { id: true },
  });

  // The `users` table doubles as the child-credential table, so a child login identity
  // has to exist for the child-scoped token to resolve.
  await prisma.user.create({
    data: { name: `Test ${label} Child`, email: childEmail, passwordHash, role: 'child' },
    select: { id: true },
  });

  return {
    parentId: parent.id,
    parentEmail,
    password,
    childId: child.id,
    childEmail,
  };
}

/**
 * Remove tenants created by `createTenant`.
 *
 * Scoped to the given tenants by id. Vitest runs test files in parallel against the
 * **same** database, so a blanket "delete everything with a `test-` prefix" in one
 * file's `afterAll` deletes another file's fixtures mid-run.
 */
export async function cleanupTenants(...tenants: Tenant[]): Promise<void> {
  const ids = tenants.map((t) => t.parentId).filter(Boolean);
  if (!ids.length) return;

  // A quiz references its generator through `quizzes.createdBy`, and that column is
  // `RESTRICT` — so the quiz rows have to go before the parent row does. Attempts,
  // answers and explanations reference the quiz, and the quiz references the child.
  const childIds = tenants.map((t) => t.childId).filter(Boolean);
  const quizIds = (
    await prisma.quiz.findMany({
      where: { OR: [{ childId: { in: childIds } }, { createdBy: { in: ids } }] },
      select: { id: true },
    })
  ).map((q: { id: string }) => q.id);

  if (quizIds.length) {
    await prisma.quizAnswer.deleteMany({ where: { attempt: { quizId: { in: quizIds } } } });
    await prisma.quizAttempt.deleteMany({ where: { quizId: { in: quizIds } } });
    await prisma.quizQuestion.deleteMany({ where: { quizId: { in: quizIds } } });
    await prisma.quiz.deleteMany({ where: { id: { in: quizIds } } });
  }

  // Subscriptions cascade from the user, and children cascade from the parent, but the
  // child-role `users` rows have to be removed by their own email.
  await prisma.user.deleteMany({ where: { email: { in: tenants.map((t) => t.childEmail) } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.child.deleteMany({ where: { parentId: { in: ids } } });
}

/**
 * A valid access token for an account id.
 *
 * Signed with the same secret the server uses, so the middleware accepts it. The role
 * claim is intentionally the one the account actually has.
 */
export function tokenFor(userId: string, extra: Record<string, any> = {}): string {
  return jwt.sign({ userId, role: 'parent', ...extra }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' } as any);
}

/** A token for the demo tenant's parent. */
export function demoParentToken(): string {
  return tokenFor('00000000-0000-4000-8000-000000000001', { email: 'parent@demo.com' });
}

export interface HttpResult<T = any> {
  status: number;
  body: T;
  headers: Headers;
}

/** Perform a request against the app with an optional bearer token. */
export async function call(
  method: string,
  path: string,
  opts: { token?: string; body?: any; headers?: Record<string, string> } = {}
): Promise<HttpResult> {
  const headers: Record<string, string> = { ...(opts.headers || {}) };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await app.request(path, {
    method: method.toUpperCase(),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  let body: any = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body, headers: res.headers };
}
