import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { sha256Hex, randomHex } from './crypto';

describe('sha256Hex', () => {
  const samples = ['', 'abc', 'Ki Shikhle? — কি শিখলে?', 'a'.repeat(1000), JSON.stringify({ a: 1, b: [1, 2, 3] })];
  it('matches Node crypto for a range of inputs', () => {
    for (const s of samples) {
      expect(sha256Hex(s)).toBe(createHash('sha256').update(s).digest('hex'));
    }
  });
  it('handles UTF-8 and long inputs', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('randomHex', () => {
  it('returns the requested length and differs each call', () => {
    expect(randomHex(8)).toHaveLength(16);
    expect(randomHex(32)).not.toBe(randomHex(32));
  });
});
