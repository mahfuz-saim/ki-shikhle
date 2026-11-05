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
  it('REJECTS a mock refresh token — it is not a session', async () => {
    // There used to be a branch here that accepted any token starting with 'mock-refresh'
    // (or merely containing 'demo') and returned a signed access token for the seeded demo
    // family. Because `POST /auth/refresh` is public, that was an unauthenticated login
    // bypass. It is gone: a refresh token that is not a verifiable JWT is invalid.
    await expect(refreshTokens('mock-refresh-parent')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('REJECTS a mock student refresh token', async () => {
    await expect(refreshTokens('mock-refresh-rahim')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('REJECTS a garbage refresh token', async () => {
    await expect(refreshTokens('totally-invalid-token')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('REJECTS a refresh token signed with the wrong secret', async () => {
    const forged = jwt.sign({ userId: 'someone', familyId: 'f', type: 'refresh' }, 'not-the-real-secret', {
      expiresIn: '7d',
    });
    await expect(refreshTokens(forged)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('default access token TTL is 7 days to prevent unexpected inactivity logout', () => {
    expect(env.JWT_ACCESS_TTL).toBe('7d');
  });
});
