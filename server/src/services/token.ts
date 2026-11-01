import jwt from 'jsonwebtoken';
import { randomHex, sha256Hex } from '../utils/crypto';
import { env } from '../config/env';

export function signAccessToken(payload: object): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL as any });
}
export function signRefreshToken(payload: object): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: `${env.REFRESH_TTL_DAYS}d` as any });
}
export function verifyRefreshToken(token: string): any {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
export function generateRandomToken(bytes = 32): string {
  return randomHex(bytes);
}
export function hashToken(token: string): string {
  return sha256Hex(token);
}
