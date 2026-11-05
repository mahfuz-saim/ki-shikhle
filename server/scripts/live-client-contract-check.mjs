/**
 * Simulate what the browser actually does, using the client's own conventions.
 *
 * `client/src/lib/api.ts` picks the token by **route**: a `/child/*` path uses
 * `childToken`, anything else uses `accessToken`. `auth-context.tsx` stores the
 * child token under `childToken` and the parent's under `accessToken`.
 *
 * This walks the same sequence with the same header layout, so a mismatch between
 * what the client stores and what the server expects shows up here.
 */

const BASE = process.env.API_BASE || 'http://localhost:5000/api/v1';
const stamp = Date.now().toString(36);

let failed = 0;
const pass = (m) => console.log(`ok    ${m}`);
const fail = (m) => {
  console.log(`FAIL  ${m}`);
  failed++;
};

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, body: json };
}

// A parent signs in.
const email = `contract-${stamp}@example.test`;
const reg = await api('/auth/register', {
  method: 'POST',
  body: { name: 'Contract Parent', email, password: 'ContractPass1!', country: 'BD', language: 'en' },
});
let accessToken = reg.body?.data?.accessToken;
if (!accessToken) {
  const login = await api('/auth/login', { method: 'POST', body: { email, password: 'ContractPass1!' } });
  accessToken = login.body?.data?.accessToken;
}
if (!accessToken) {
  fail('could not sign in');
  process.exit(1);
}
pass('signed in as a parent');

// Two children, so sibling isolation is meaningful. The free plan allows one child
// per account, so the sibling is added straight to the database — the API refuses
// the second child with a 403, which is the entitlement working.
const kids = [];
for (const name of ['Alpha', 'Beta']) {
  const r = await api('/children', {
    method: 'POST',
    token: accessToken,
    body: {
      name,
      grade: 'Class 8',
      email: `contract-${name.toLowerCase()}-${stamp}@example.test`,
      password: 'ChildPass1!',
      medium: 'Bangla',
    },
  });
  if (r.status === 403) {
    // The plan limit is doing its job. Add the sibling directly.
    const { PrismaClient } = await import('@prisma/client');
    const client = new PrismaClient();
    const sibling = await client.child.create({
      data: {
        parentId: kids[0].parentId,
        name,
        grade: 'Class 8',
        email: `contract-${name.toLowerCase()}-${stamp}@example.test`,
        slug: `contract-${name.toLowerCase()}-${stamp}`,
      },
      select: { id: true, parentId: true, name: true, grade: true, email: true },
    });
    await client.$disconnect();
    kids.push(sibling);
    continue;
  }
  if (r.status !== 200 && r.status !== 201) {
    fail(`creating ${name} returned ${r.status}: ${JSON.stringify(r.body).slice(0, 200)}`);
    process.exit(1);
  }
  kids.push(r.body.data);
}
pass(`created ${kids.length} children`);

// `enterChildMode` in the client stores the returned token as `childToken`.
const entered = await api(`/children/${kids[0].id}/enter`, { method: 'POST', token: accessToken, body: {} });
if (entered.status !== 200) {
  fail(`entering child mode returned ${entered.status}: ${JSON.stringify(entered.body).slice(0, 200)}`);
  process.exit(1);
}
const childToken = entered.body?.data?.token;
if (!childToken) {
  fail('entering child mode returned no token');
  process.exit(1);
}
pass('entered child mode');

// The child's own endpoints, sent with the CHILD token — exactly as `api.ts` does
// for a `/child/*` route.
const own = await api(`/children/${kids[0].id}/notes`, { token: childToken });
if (own.status === 200) pass('the child token reads their own notes');
else fail(`the child token could not read their own notes — status ${own.status}`);

// The sibling's endpoints, sent with the CHILD token.
const sibling = await api(`/children/${kids[1].id}/notes`, { token: childToken });
if (sibling.status === 404) pass('the child token cannot read a sibling\'s notes');
else fail(`the child token read a sibling\'s notes — status ${sibling.status}`);

// The child's quiz list, with the child token.
const quizzes = await api(`/children/${kids[0].id}/quizzes`, { token: childToken });
if (quizzes.status === 200) pass('the child token reads their own quiz list');
else fail(`the child token could not read their own quiz list — status ${quizzes.status}`);

// The child's dashboard, with the child token.
const dash = await api(`/children/${kids[0].id}/dashboard/summary`, { token: childToken });
if (dash.status === 200) pass('the child token reads their own dashboard');
else fail(`the child token could not read their own dashboard — status ${dash.status}`);

// A child must NOT be able to reach a parent-only endpoint.
const billing = await api('/billing/invoices', { token: childToken });
if (billing.status === 403 || billing.status === 401 || billing.status === 404) {
  pass(`a child token cannot reach the parent's billing (${billing.status})`);
} else {
  fail(`a child token reached /billing/invoices — status ${billing.status}`);
}

// And the parent must NOT be able to reach the admin API.
const admin = await api('/admin/users', { token: accessToken });
if (admin.status === 403) pass('a parent token cannot reach the admin API');
else fail(`a parent token reached /admin/users — status ${admin.status}`);

console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
process.exitCode = failed ? 1 : 0;
