import { describe, it, expect } from 'vitest';
import { validatePasswordStrength } from '../../services/password';
import { hashToken, generateRandomToken } from '../../services/token';

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
