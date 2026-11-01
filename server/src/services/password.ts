import { argon2id, argon2Verify } from 'hash-wasm';
import { env } from '../config/env';
import { randomHex } from '../utils/crypto';

// Same cost as before (memoryCost 19456 KiB, timeCost 2, parallelism 1), pure WASM so it
// runs on Cloudflare Workers where native modules are not allowed.
const PARAMS = { memorySize: 19456, iterations: 2, parallelism: 1, hashLength: 32, outputType: 'encoded' } as const;
const salt = () => Uint8Array.from(Buffer.from(randomHex(16), 'hex'));

async function hash(plain: string): Promise<string> {
  return String(await argon2id({ password: plain, salt: salt(), ...PARAMS } as any));
}
async function verify(hashValue: string, plain: string) {
  try {
    return await argon2Verify({ password: plain, hash: hashValue });
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
