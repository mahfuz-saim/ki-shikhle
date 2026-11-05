/**
 * The quiz cache must not cross accounts.
 *
 * `generateQuiz` caches the generated quiz for five minutes, keyed by a hash of the
 * child's digests and the request settings. The digests are **empty** for a child
 * with no notes, so the key was a function of the settings alone — and every account
 * asking for the same kind of quiz hashed to the same key.
 *
 * The second account to generate a quiz therefore received the *first account's*
 * quiz object: someone else's quiz id, someone else's questions, and a `createdBy`
 * pointing at another tenant. That quiz was not in the second account's own quiz
 * list either, so the id 404'd and the list appeared empty.
 *
 * The key now includes the owning account and the child.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { call, cleanupTenants, createTenant, tokenFor, type Tenant } from '../test-utils/http';

let a: Tenant;
let b: Tenant;

beforeAll(async () => {
  a = await createTenant('cacheA');
  b = await createTenant('cacheB');
});

afterAll(async () => {
  await cleanupTenants(a, b);
});

const GEN_BODY = {
  title: 'Cache probe',
  subject: 'Mathematics',
  difficulty: 'mixed',
  numQuestions: 5,
  scope: 'last7',
  types: ['mcq', 'true_false', 'fill_blank'],
  language: 'en',
};

describe('The quiz cache does not cross accounts', () => {
  it('two accounts asking for the same quiz get different quizzes', async () => {
    const resA = await call('POST', `/api/v1/children/${a.childId}/quizzes/generate`, {
      token: tokenFor(a.parentId, { email: a.parentEmail }),
      body: GEN_BODY,
    });
    expect(resA.status).toBe(201);
    const quizA = resA.body?.data;

    const resB = await call('POST', `/api/v1/children/${b.childId}/quizzes/generate`, {
      token: tokenFor(b.parentId, { email: b.parentEmail }),
      body: GEN_BODY,
    });
    expect(resB.status).toBe(201);
    const quizB = resB.body?.data;

    expect(quizA?.id).toBeTruthy();
    expect(quizB?.id).toBeTruthy();
    expect(quizB.id, 'the second account was served the first account\'s quiz').not.toBe(quizA.id);
    expect(quizB.childId, 'the second account was served a quiz for another child').toBe(b.childId);
  });

  it('the generated quiz actually belongs to the account that asked for it', async () => {
    const res = await call('POST', `/api/v1/children/${b.childId}/quizzes/generate`, {
      token: tokenFor(b.parentId, { email: b.parentEmail }),
      body: GEN_BODY,
    });
    expect(res.status).toBe(201);
    const quiz = res.body?.data;

    // It must be in the account's own quiz list.
    const list = await call('GET', `/api/v1/children/${b.childId}/quizzes`, {
      token: tokenFor(b.parentId, { email: b.parentEmail }),
    });
    expect(list.status).toBe(200);
    const ids = (list.body?.data || []).map((q: any) => q.id);
    expect(ids, 'the generated quiz is not in the account\'s own quiz list').toContain(quiz.id);

    // And it must be readable by its owner.
    const detail = await call('GET', `/api/v1/quizzes/${quiz.id}`, {
      token: tokenFor(b.parentId, { email: b.parentEmail }),
    });
    expect(detail.status).toBe(200);
  });

  it('another account cannot read the generated quiz', async () => {
    const res = await call('POST', `/api/v1/children/${a.childId}/quizzes/generate`, {
      token: tokenFor(a.parentId, { email: a.parentEmail }),
      body: GEN_BODY,
    });
    expect(res.status).toBe(201);
    const quizId = res.body?.data?.id;

    const foreign = await call('GET', `/api/v1/quizzes/${quizId}`, {
      token: tokenFor(b.parentId, { email: b.parentEmail }),
    });
    expect(foreign.status).toBe(404);
  });
});
