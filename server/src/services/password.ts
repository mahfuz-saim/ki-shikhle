import { argon2Verify } from 'hash-wasm';
import { env } from '../config/env';

/**
 * Password / PIN hashing.
 *
 * New hashes use PBKDF2-HMAC-SHA256 through Web Crypto (`crypto.subtle`), which is built
 * into both Node (>=18) and Cloudflare Workers. The previous implementation used argon2id
 * from `hash-wasm`, which compiles WebAssembly at runtime — Workers forbid that
 * ("Wasm code generation disallowed by embedder"), so every login failed in production.
 *
 * Format: `pbkdf2_sha256$<iterations>$<salt b64>$<hash b64>`
 * 100,000 iterations is the maximum Cloudflare Workers allows for PBKDF2.
 *
 * Legacy `$argon2...` hashes are still verified where WebAssembly compilation is allowed
 * (Node / local dev). On Workers they cannot be verified — re-seed or reset those
 * passwords so they are re-hashed with PBKDF2.
 */
const ITERATIONS = 100_000;
const KEY_BITS = 256;
const SALT_BYTES = 16;
const PREFIX = 'pbkdf2_sha256';

const subtle = () => globalThis.crypto.subtle;
const enc = new TextEncoder();

const toB64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');
const fromB64 = (s: string) => new Uint8Array(Buffer.from(s, 'base64'));

async function derive(plain: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await subtle().importKey('raw', enc.encode(plain), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, KEY_BITS);
  return new Uint8Array(bits);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function hash(plain: string): Promise<string> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const derived = await derive(plain, salt, ITERATIONS);
  return `${PREFIX}$${ITERATIONS}$${toB64(salt)}$${toB64(derived)}`;
}

async function verify(hashValue: string, plain: string): Promise<boolean> {
  try {
    if (!hashValue) return false;
    if (hashValue.startsWith(`${PREFIX}$`)) {
      const [, iter, saltB64, hashB64] = hashValue.split('$');
      const iterations = Number(iter);
      if (!Number.isInteger(iterations) || iterations <= 0 || !saltB64 || !hashB64) return false;
      const expected = fromB64(hashB64);
      const actual = await derive(plain, fromB64(saltB64), iterations);
      return timingSafeEqual(actual, expected);
    }
    if (hashValue.startsWith('$argon2')) {
      // Legacy hash: only verifiable where runtime WASM compilation is permitted (Node).
      return await argon2Verify({ password: plain, hash: hashValue });
    }
    return false;
  } catch {
    return false;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const peppered = env.PASSWORD_PEPPER ? password + env.PASSWORD_PEPPER : password;
  return hash(peppered);
}
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  const peppered = env.PASSWORD_PEPPER ? password + env.PASSWORD_PEPPER : password;
  return verify(hash, peppered);
}
export function validatePasswordStrength(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Password must contain upper, lower and number';
  return null;
}
export async function hashPin(pin: string): Promise<string> {
  return hash(pin);
}
export async function verifyPin(hash: string, pin: string): Promise<boolean> {
  return verify(hash, pin);
}
