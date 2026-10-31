import * as argon2 from 'argon2';
import { env } from '../config/env';

export async function hashPassword(password: string): Promise<string> {
  const peppered = env.PASSWORD_PEPPER ? password + env.PASSWORD_PEPPER : password;
  return argon2.hash(peppered, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
}
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  const peppered = env.PASSWORD_PEPPER ? password + env.PASSWORD_PEPPER : password;
  try { return await argon2.verify(hash, peppered); } catch { return false; }
}
export function validatePasswordStrength(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Password must contain upper, lower and number';
  return null;
}
export async function hashPin(pin: string): Promise<string> {
  return argon2.hash(pin, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
}
export async function verifyPin(hash: string, pin: string): Promise<boolean> {
  try { return await argon2.verify(hash, pin); } catch { return false; }
}
