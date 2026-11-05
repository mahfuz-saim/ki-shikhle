/**
 * Live check of the child-mode entry flow against the running API.
 *
 * The child portal is reachable from the UI now, but nothing had exercised the
 * whole path end to end: log in as the demo parent, list the children, enter
 * child mode, and confirm the child token actually scopes the request to that
 * one child (a sibling's notes must 404).
 *
 * Run with the API already listening on :5000.
 */

const BASE = process.env.API_BASE || 'http://localhost:5000/api/v1';

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

function fail(msg) {
  console.log(`FAIL  ${msg}`);
  process.exitCode = 1;
}

function pass(msg) {
  console.log(`ok    ${msg}`);
}

// 1. Log in as the demo parent.
const login = await api('/auth/login', {
  method: 'POST',
  body: { email: 'parent@demo.com', password: 'Password123!' },
});
if (login.status !== 200) {
  fail(`login as the demo parent returned ${login.status}`);
  process.exit(1);
}
const parentToken = login.body?.data?.accessToken;
pass('logged in as the demo parent');

// 2. List the children — and check no credential hash rides along.
const children = await api('/children', { token: parentToken });
if (children.status !== 200) {
  fail(`GET /children returned ${children.status}`);
  process.exit(1);
}
const list = children.body?.data || [];
const leaked = list.filter((c) => 'passwordHash' in c || 'pinHash' in c || 'password' in c);
if (leaked.length) fail(`${leaked.length} child row(s) carried a credential hash`);
else pass(`GET /children returned ${list.length} children, none with a credential hash`);

if (list.length < 2) {
  fail('need at least two children to test sibling isolation');
  process.exit(1);
}
const [child, sibling] = list;

// 3. Enter child mode for the first child.
const entered = await api(`/children/${child.id}/enter`, { method: 'POST', token: parentToken, body: {} });
if (entered.status !== 200) {
  fail(`entering child mode returned ${entered.status}: ${JSON.stringify(entered.body).slice(0, 200)}`);
  process.exit(1);
}
const childToken = entered.body?.data?.token;
if (!childToken) {
  fail('entering child mode returned no token');
  process.exit(1);
}
pass(`entered child mode for ${child.name}`);

const enteredFields = Object.keys(entered.body?.data?.child || {});
if (enteredFields.some((f) => /hash|password|pin/i.test(f))) {
  fail(`the child object in the enter response carries a credential field: ${enteredFields.join(', ')}`);
} else {
  pass('the enter response carries no credential field');
}

// 4. The child token must not reach a sibling's notes.
const siblingNotes = await api(`/children/${sibling.id}/notes`, { token: childToken });
if (siblingNotes.status === 404) pass(`the child token cannot read ${sibling.name}'s notes (404)`);
else fail(`the child token read ${sibling.name}'s notes — status ${siblingNotes.status}`);

const ownNotes = await api(`/children/${child.id}/notes`, { token: childToken });
if (ownNotes.status === 200) pass(`the child token can read their own notes`);
else fail(`the child token could not read their own notes — status ${ownNotes.status}`);

// 5. A child token must not be able to list the parent's other children.
const childList = await api('/children', { token: childToken });
if (childList.status === 200) {
  const rows = childList.body?.data || [];
  const foreign = rows.filter((c) => c.id !== child.id);
  if (foreign.length) fail(`a child token listed ${foreign.length} foreign child row(s)`);
  else pass('a child token lists only their own row');
} else {
  pass(`a child token gets ${childList.status} for /children (no sibling rows)`);
}

// 6. The parent token must not be usable as a child token for the sibling.
const siblingEnter = await api(`/children/${sibling.id}/enter`, { method: 'POST', token: parentToken, body: {} });
if (siblingEnter.status === 200) {
  const siblingToken = siblingEnter.body?.data?.token;
  const cross = await api(`/children/${child.id}/notes`, { token: siblingToken });
  if (cross.status === 404) pass(`${sibling.name}'s token cannot read ${child.name}'s notes (404)`);
  else fail(`${sibling.name}'s token read ${child.name}'s notes — status ${cross.status}`);
} else {
  fail(`entering ${sibling.name}'s mode returned ${siblingEnter.status}`);
}

console.log(process.exitCode ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED');
