/**
 * The backdoor regression suite.
 *
 * Every assertion in this file corresponds to a way the API used to let an
 * unauthenticated caller in:
 *
 *  - `middleware/auth.ts` accepted any token *starting with* `demo-parent` and any token
 *    merely *containing* `tasnim` / `rahim` / `fahim` / `parent`, turning it into a
 *    session for the seeded demo family.
 *  - `auth.service.ts` accepted the passwords `Password123!` and `DemoPass1` for **any**
 *    account, and logged `parent@demo.com` in with **any** password at all.
 *  - `POST /auth/refresh` turned a `mock-refresh*` token — or **any** database error —
 *    into a valid demo-parent access token. Because the client auto-refreshes on any 401,
 *    a database blip silently escalated the session.
 *  - `POST /auth/account/restore` was public and took the target account id from the
 *    request body.
 *
 * If any of these ever come back, the cross-account leak comes back with them.
 */

import { describe, it, expect } from 'vitest';
import { call, tokenFor } from '../test-utils/http';
import { DEMO_PARENT_ID } from '../core/store';

/** The magic strings that used to authenticate. */
const BACKDOOR_TOKENS = [
  'demo-parent-token',
  'demo-access-token',
  'demo-parent-anything',
  'demo-parent',
  'anything-with-tasnim-inside',
  'anything-with-rahim-inside',
  'anything-with-fahim-inside',
  'anything-with-parent-inside',
  'not-a-real-jwt-parent',
  'totally-invalid-token',
  '',
];

describe('The demo backdoor is gone', () => {
  it.each(BACKDOOR_TOKENS)('rejects %j as an access token', async (token) => {
    const res = await call('GET', '/api/v1/children', token ? { token } : {});
    expect(res.status).toBe(401);
    expect(res.body?.success).toBe(false);
  });

  it.each(BACKDOOR_TOKENS)('rejects %j on a write endpoint too', async (token) => {
    const res = await call('POST', '/api/v1/children', {
      token: token || undefined,
      body: { name: 'Intruder', grade: 'Class 9' },
    });
    expect(res.status).toBe(401);
  });

  it('does not accept a token that merely mentions the demo children', async () => {
    // `optionalAuth` used to do a substring match on the whole token.
    for (const token of ['Bearer-ish rahim', 'x tasnim y', 'zzz-parent-zzz']) {
      const res = await call('GET', '/api/v1/children', { token });
      expect(res.status).toBe(401);
    }
  });

  it('rejects a token signed with the wrong secret', async () => {
    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ userId: DEMO_PARENT_ID, role: 'admin' }, 'not-the-real-secret', {
      expiresIn: '7d',
    });
    const res = await call('GET', '/api/v1/children', { token: forged });
    expect(res.status).toBe(401);
  });

  it('rejects a token whose subject is not a real account', async () => {
    // A valid signature is not enough — the account has to exist.
    const res = await call('GET', '/api/v1/children', {
      token: tokenFor('00000000-0000-0000-0000-000000000000'),
    });
    expect(res.status).toBe(401);
  });
});

describe('Refresh is not a login bypass', () => {
  it.each(['mock-refresh-parent', 'mock-refresh-tasnim', 'mock-refresh-anything', 'demo-refresh'])(
    'rejects %j',
    async (refreshToken) => {
      const res = await call('POST', '/api/v1/auth/refresh', { body: { refreshToken } });
      expect(res.status).toBe(401);
      expect(res.body?.data?.accessToken).toBeUndefined();
    }
  );

  it('rejects a missing refresh token', async () => {
    const res = await call('POST', '/api/v1/auth/refresh', { body: {} });
    expect(res.status).toBe(401);
  });
});

describe('Login verifies the password for every account, including the demo one', () => {
  it('rejects the demo parent with the wrong password', async () => {
    const res = await call('POST', '/api/v1/auth/login', {
      body: { email: 'parent@demo.com', password: 'wrong' },
    });
    expect(res.status).toBe(401);
  });

  it('rejects the demo parent with an empty password', async () => {
    const res = await call('POST', '/api/v1/auth/login', {
      body: { email: 'parent@demo.com', password: '' },
    });
    // Rejected by the request schema before it ever reaches the credential check.
    expect(res.status).toBe(400);
  });

  it('does not let the demo password authenticate an unrelated account', async () => {
    // `Password123!` and `DemoPass1` used to match ANY account.
    const res = await call('POST', '/api/v1/auth/login', {
      body: { email: 'ownery@mail.com', password: 'Password123!' },
    });
    expect(res.status).toBe(401);
  });

  it('logs the demo parent in with the real password and returns a real token', async () => {
    const res = await call('POST', '/api/v1/auth/login', {
      body: { email: 'parent@demo.com', password: 'Password123!' },
    });
    // The demo tenant is a normal account now. If the seeded password was changed
    // locally, this account may not exist — either way it must not be a 200 with a
    // fabricated token.
    if (res.status === 200) {
      const payload = JSON.parse(
        Buffer.from(res.body.data.accessToken.split('.')[1], 'base64url').toString('utf8')
      );
      expect(payload.userId).toBe(DEMO_PARENT_ID);
      expect(payload.userId).not.toBe('parent-demo');
    } else {
      expect(res.status).toBe(401);
    }
  });
});

describe('Account restore is not public', () => {
  it('401s without a token', async () => {
    const res = await call('POST', '/api/v1/auth/account/restore', { body: { userId: DEMO_PARENT_ID } });
    expect(res.status).toBe(401);
  });

  it('401s with a backdoor token', async () => {
    const res = await call('POST', '/api/v1/auth/account/restore', {
      token: 'demo-parent-token',
      body: { userId: DEMO_PARENT_ID },
    });
    expect(res.status).toBe(401);
  });
});

describe('The job trigger is not public', () => {
  it('401s without a cron secret', async () => {
    const res = await call('POST', '/api/v1/jobs/run', { body: {} });
    expect(res.status).toBe(401);
  });

  it('401s with a wrong cron secret', async () => {
    const res = await call('POST', '/api/v1/jobs/run', {
      headers: { 'x-cron-secret': 'not-the-secret' },
      body: {},
    });
    expect(res.status).toBe(401);
  });
});

describe('Public endpoints stay public', () => {
  it('serves the pricing page without a token', async () => {
    const res = await call('GET', '/api/v1/billing/plans');
    expect(res.status).toBe(200);
  });

  it('serves the health check without a token', async () => {
    const res = await call('GET', '/api/v1/health');
    expect(res.status).toBe(200);
  });
});
