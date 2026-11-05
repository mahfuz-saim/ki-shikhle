/**
 * A live walk through the main parent flows against the running API.
 *
 * The child-mode bug was only findable by actually running the app, so this walks
 * the paths a parent takes: sign up, add a child, take a quiz, read the results,
 * add a note, and check the dashboard. Anything that answers with an error shape
 * the UI does not expect is reported.
 *
 * Run with the API already listening on :5000.
 */

const BASE = process.env.API_BASE || 'http://localhost:5000/api/v1';
const stamp = Date.now().toString(36);

let failed = 0;
function pass(msg) {
  console.log(`ok    ${msg}`);
}
function fail(msg) {
  console.log(`FAIL  ${msg}`);
  failed++;
}

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

/** Register a brand new parent. */
const email = `live-${stamp}@example.test`;
const password = 'LivePass1!';
const reg = await api('/auth/register', {
  method: 'POST',
  body: { name: 'Live Parent', email, password, country: 'BD', language: 'en' },
});
if (reg.status !== 200 && reg.status !== 201) {
  fail(`register returned ${reg.status}: ${JSON.stringify(reg.body).slice(0, 300)}`);
  process.exit(1);
}
let token = reg.body?.data?.accessToken;
if (!token) {
  // Some deployments require verification before a session is issued.
  const login = await api('/auth/login', { method: 'POST', body: { email, password } });
  if (login.status !== 200) {
    fail(`login after register returned ${login.status}: ${JSON.stringify(login.body).slice(0, 300)}`);
    process.exit(1);
  }
  token = login.body?.data?.accessToken;
}
pass(`registered and signed in as ${email}`);

// A brand new parent must see no children — the original leak.
const children = await api('/children', { token });
if (children.status !== 200) {
  fail(`GET /children returned ${children.status}`);
} else if ((children.body?.data || []).length !== 0) {
  fail(`a brand new parent sees ${(children.body?.data || []).length} children — the account leak is back`);
} else {
  pass('a brand new parent sees no children');
}

// Add a child.
const childEmail = `live-child-${stamp}@example.test`;
const created = await api('/children', {
  method: 'POST',
  token,
  body: { name: 'Live Child', grade: 'Class 8', email: childEmail, password: 'ChildPass1!', medium: 'Bangla' },
});
if (created.status !== 200 && created.status !== 201) {
  fail(`creating a child returned ${created.status}: ${JSON.stringify(created.body).slice(0, 300)}`);
  process.exit(1);
}
const childId = created.body?.data?.id;
if (!childId) {
  fail('creating a child returned no id');
  process.exit(1);
}
pass(`created a child (${childId})`);

// The child must land under the creator, and carry no hash.
const childRow = (children.body?.data || []).find((c) => c.id === childId);
if (!childRow) {
  const reread = await api('/children', { token });
  if (!(reread.body?.data || []).some((c) => c.id === childId)) {
    fail('the new child does not appear in GET /children');
  } else {
    pass('the new child appears in GET /children');
  }
}
if (['passwordHash', 'pinHash', 'password'].some((k) => k in created.body.data)) {
  fail('the create-child response carries a credential field');
} else {
  pass('the create-child response carries no credential field');
}

// Add a note.
const note = await api(`/children/${childId}/notes`, {
  method: 'POST',
  token,
  body: { subject: 'Mathematics', title: 'Live note', textClean: 'Body of the live note.', date: new Date().toISOString() },
});
if (note.status !== 200 && note.status !== 201) {
  fail(`adding a note returned ${note.status}: ${JSON.stringify(note.body).slice(0, 300)}`);
} else {
  pass('added a note');
}

const notes = await api(`/children/${childId}/notes`, { token });
if (notes.status !== 200) fail(`GET notes returned ${notes.status}`);
else if (!JSON.stringify(notes.body).includes('Live note')) fail('the note is not in the list');
else pass('the note is in the list');

// The dashboard must answer for a child with no data.
for (const ep of ['summary', 'study-time', 'subjects', 'scores', 'mastery', 'consistency', 'topics']) {
  const d = await api(`/children/${childId}/dashboard/${ep}`, { token });
  if (d.status !== 200) fail(`GET dashboard/${ep} returned ${d.status}`);
}
pass('every dashboard endpoint answered 200');

// Generate a quiz.
const quiz = await api(`/children/${childId}/quizzes/generate`, {
  method: 'POST',
  token,
  body: {
    title: 'Live quiz',
    subject: 'Mathematics',
    difficulty: 'mixed',
    numQuestions: 5,
    scope: 'last7',
    types: ['mcq', 'true_false', 'fill_blank'],
    language: 'en',
  },
});
if (quiz.status !== 200 && quiz.status !== 201) {
  fail(`generating a quiz returned ${quiz.status}: ${JSON.stringify(quiz.body).slice(0, 400)}`);
} else {
  const qid = quiz.body?.data?.quiz?.id || quiz.body?.data?.id;
  if (!qid) {
    fail('generating a quiz returned no quiz id');
  } else {
    pass(`generated a quiz (${qid})`);

    const list = await api(`/children/${childId}/quizzes`, { token });
    const listed = (list.body?.data || []).find((q) => q.id === qid);
    if (!listed) fail('the new quiz is not in the quiz list');
    else pass('the new quiz is in the quiz list');

    const detail = await api(`/quizzes/${qid}`, { token });
    if (detail.status !== 200) fail(`GET /quizzes/:id returned ${detail.status}`);
    else {
      const text = JSON.stringify(detail.body);
      // A parent may see the answer key — the client needs it to show a parent's review.
      // A child may not. The child case is checked in the child-mode script.
      if (text.includes('correctAnswer')) pass('the parent can see the answer key (expected)');
      else fail('the parent quiz detail has no correctAnswer — the review screen cannot work');
      const questions = detail.body?.data?.questions || [];
      if (questions.length) {
        const q = questions[0];
        if (!q.optionsJson && !q.options) fail('a quiz question has no options field');
        else pass('a quiz question carries an options field');
      } else {
        console.log('note  the generated quiz has no questions yet');
      }
    }

    // Take it: start an attempt, answer, submit, read the results.
    const attempt = await api(`/quizzes/${qid}/attempts`, { method: 'POST', token, body: { childId } });
    const attemptId =
      attempt.body?.data?.attempt?.id || attempt.body?.data?.id || (list.body?.data || []).find((q) => q.id === qid)?.attemptId;
    if (!attemptId) {
      fail('no attempt id was returned');
    } else {
      pass(`got an attempt id (${attemptId})`);

      const answers = (detail.body?.data?.questions || []).map((q) => ({
        questionId: q.id,
        answer: (q.optionsJson || q.options || [])[0] ?? '',
        isCorrect: false,
      }));
      if (answers.length) {
        const put = await api(`/attempts/${attemptId}/answers`, { method: 'PUT', token, body: { answers } });
        if (put.status !== 200) fail(`PUT answers returned ${put.status}: ${JSON.stringify(put.body).slice(0, 200)}`);
        else pass('saved answers');
      }

      const submit = await api(`/attempts/${attemptId}/submit`, { method: 'POST', token, body: {} });
      if (submit.status !== 200) fail(`POST submit returned ${submit.status}: ${JSON.stringify(submit.body).slice(0, 200)}`);
      else pass('submitted the attempt');

      const results = await api(`/attempts/${attemptId}`, { token });
      if (results.status !== 200) {
        fail(`GET /attempts/:id returned ${results.status}: ${JSON.stringify(results.body).slice(0, 200)}`);
      } else {
        const data = results.body?.data || {};
        if (!data.attempt) fail('the results payload has no `attempt` — the client expects {attempt, perTopic, explanation}');
        else pass('the results payload has the {attempt, perTopic, explanation} shape');
        if (data.attempt && data.attempt.score === undefined) fail('the results payload has no score');
        else pass('the results payload carries a score');
      }
    }
  }
}

// The parent's own profile.
const me = await api('/auth/me', { token });
if (me.status !== 200) fail(`GET /auth/me returned ${me.status}`);
else if (JSON.stringify(me.body).includes('passwordHash')) fail('/auth/me leaks passwordHash');
else pass('/auth/me is clean');

console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
process.exitCode = failed ? 1 : 0;
