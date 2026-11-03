import { describe, it, expect } from 'vitest';
import { validatePasswordStrength } from '../../services/password';
import { hashToken, generateRandomToken } from '../../services/token';
import { refreshTokens } from './auth.service';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

describe('Password strength', () => {
  it('rejects short', () => expect(validatePasswordStrength('Ab1')).not.toBeNull());
  it('rejects missing classes', () => expect(validatePasswordStrength('abcdefgh')).not.toBeNull());
  it('accepts strong', () => expect(validatePasswordStrength('StrongPass1')).toBeNull());
});

describe('Token helpers', () => {
  it('hash is deterministic', () => {
    const t = 'hello';
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t).length).toBe(64);
  });
  it('generate length', () => {
    expect(generateRandomToken(16).length).toBe(32);
  });
});

describe('Refresh token resilience', () => {
  it('refreshes mock parent token without throwing', async () => {
    const res = await refreshTokens('mock-refresh-parent');
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
    expect(res.user.role).toBe('parent');

    const decoded: any = jwt.verify(res.accessToken, env.JWT_ACCESS_SECRET);
    expect(decoded.role).toBe('parent');
  });

  it('refreshes mock student token without throwing', async () => {
    const res = await refreshTokens('mock-refresh-rahim');
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
    expect(res.user.role).toBe('child');

    const decoded: any = jwt.verify(res.accessToken, env.JWT_ACCESS_SECRET);
    expect(decoded.role).toBe('child');
  });

  it('default access token TTL is 7 days to prevent unexpected inactivity logout', () => {
    expect(env.JWT_ACCESS_TTL).toBe('7d');
  });
});
