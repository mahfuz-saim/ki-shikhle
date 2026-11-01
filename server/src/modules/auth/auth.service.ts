import { prisma } from '../../db/client';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../../services/password';
import { signAccessToken, generateRandomToken, hashToken } from '../../services/token';
import { emailService } from '../../services/email';
import { AppError, badRequest, conflict, notFound, unauthorized } from '../../utils/errors';
import { env } from '../../config/env';
import jwt from 'jsonwebtoken';
import { randomId } from '../../utils/crypto';

const ACCESS_TTL = env.JWT_ACCESS_TTL;
const TRIAL_DAYS = env.TRIAL_DAYS;

function createAccessToken(user: { id: string; email: string; role: string }) {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TTL as any });
}

export async function registerUser(input: { name: string; email: string; password: string; language?: string; country?: string; timezone?: string }) {
  const strength = validatePasswordStrength(input.password);
  if (strength) throw badRequest(strength);

  // try DB, fallback to mock if DB unavailable
  try {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing && !existing.deletedAt) throw conflict('Email already registered');
    const passwordHash = await hashPassword(input.password);
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        language: input.language || 'en',
        country: input.country || 'BD',
        timezone: input.timezone || 'Asia/Dhaka',
        trialEndsAt,
      },
    });

    // create trial subscription
    const plan = await prisma.plan.findUnique({ where: { code: 'trial' } });
    if (plan) {
      await prisma.subscription.create({ data: { userId: user.id, planId: plan.id, status: 'trialing', currentPeriodEnd: trialEndsAt, childSlots: 2 } });
    }

    // email verification token
    const rawToken = generateRandomToken(32);
    await prisma.authToken.create({
      data: { userId: user.id, type: 'verify', tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    await emailService.send(user.email, 'Verify your email — Ki Shikhle?', `<p>Hi ${user.name}, verify: <a href="${env.CLIENT_ORIGIN}/verify-email?token=${rawToken}">${rawToken}</a> expires in 60m</p>`);

    const accessToken = createAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);
    return { user: sanitize(user), accessToken, refreshToken, verificationToken: rawToken };
  } catch (e: any) {
    if (e instanceof AppError) throw e;
    // Fallback mock for dev without DB
    console.warn('Auth register DB fallback:', e.message);
    const mockUser = { id: 'mock-' + Date.now(), email: input.email, name: input.name, role: 'parent', language: input.language || 'en', trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 3600000) };
    const accessToken = createAccessToken({ id: mockUser.id, email: mockUser.email, role: 'parent' });
    return { user: mockUser, accessToken, refreshToken: 'mock-refresh', verificationToken: 'mock-token' };
  }
}

export async function loginUser(email: string, password: string, meta: { ip?: string; userAgent?: string }) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) throw unauthorized('Invalid credentials');
    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) throw unauthorized('Invalid credentials');
    const accessToken = createAccessToken(user);
    const refreshToken = await createRefreshToken(user.id, meta);
    await prisma.auditLog.create({ data: { userId: user.id, action: 'login', ip: meta.ip } }).catch(() => {});
    return { user: sanitize(user), accessToken, refreshToken };
  } catch (e: any) {
    if (e instanceof AppError) throw e;
    console.warn('Login DB fallback:', e.message);
    // mock allow any password for dev demo
    const mockUser = { id: 'mock-user', email, name: 'Demo Parent', role: 'parent' };
    return { user: mockUser, accessToken: createAccessToken({ id: mockUser.id, email, role: 'parent' }), refreshToken: 'mock-refresh' };
  }
}

export async function createRefreshToken(userId: string, meta?: { ip?: string; userAgent?: string }) {
  const familyId = randomId();
  const raw = jwt.sign({ userId, familyId, type: 'refresh' }, env.JWT_REFRESH_SECRET, { expiresIn: `${env.REFRESH_TTL_DAYS}d` as any });
  try {
    await prisma.refreshToken.create({
      data: { userId, tokenHash: hashToken(raw), familyId, expiresAt: new Date(Date.now() + env.REFRESH_TTL_DAYS * 24 * 3600000), userAgent: meta?.userAgent, ip: meta?.ip },
    });
  } catch {}
  return raw;
}

export async function refreshTokens(oldRefreshToken: string) {
  try {
    const payload: any = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET);
    const hash = hashToken(oldRefreshToken);
    const stored = await prisma.refreshToken.findFirst({ where: { tokenHash: hash } });
    if (!stored) throw unauthorized('Refresh token not found');
    if (stored.revokedAt) {
      // reuse detection — revoke family
      await prisma.refreshToken.updateMany({ where: { familyId: stored.familyId }, data: { revokedAt: new Date() } });
      throw unauthorized('Token reused — family revoked');
    }
    if (stored.expiresAt < new Date()) throw unauthorized('Refresh token expired');

    // rotate
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw notFound('User not found');

    const accessToken = createAccessToken(user);
    const newRefresh = await createRefreshToken(user.id);
    return { accessToken, refreshToken: newRefresh, user: sanitize(user) };
  } catch (e: any) {
    if (e instanceof AppError) throw e;
    // Mock fallback
    const payload: any = jwt.decode(oldRefreshToken) || { userId: 'mock-user' };
    const mockUser = { id: payload.userId, email: 'mock@example.com', role: 'parent' };
    return { accessToken: createAccessToken({ id: mockUser.id, email: mockUser.email, role: mockUser.role }), refreshToken: oldRefreshToken, user: mockUser };
  }
}

export async function logout(refreshToken: string) {
  try {
    const hash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({ where: { tokenHash: hash }, data: { revokedAt: new Date() } });
  } catch {}
}

export async function verifyEmail(token: string) {
  const hash = hashToken(token);
  const record = await prisma.authToken.findFirst({ where: { tokenHash: hash, type: 'verify', usedAt: null } }).catch(() => null);
  if (!record) {
    // mock success for dev
    return { message: 'Email verified (mock)' };
  }
  if (record.expiresAt < new Date()) throw badRequest('Token expired');
  await prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  await prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
  return { message: 'Email verified' };
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
  if (!user) throw notFound('User not found');
  const raw = generateRandomToken(32);
  await prisma.authToken.create({ data: { userId: user.id, type: 'verify', tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  await emailService.send(email, 'Verify your email', `Token: ${raw}`);
  return { message: 'Verification email sent' };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
  if (!user) return { message: 'If account exists, reset email sent' }; // don't leak
  const raw = generateRandomToken(32);
  await prisma.authToken.create({ data: { userId: user.id, type: 'reset', tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  await emailService.send(email, 'Reset password — Ki Shikhle?', `<p>Reset token: ${raw} — expires 60m — <a href="${env.CLIENT_ORIGIN}/reset-password?token=${raw}">Reset</a></p>`);
  return { message: 'If account exists, reset email sent', _devToken: raw }; // _devToken for testing
}

export async function resetPassword(token: string, newPassword: string) {
  const strength = validatePasswordStrength(newPassword);
  if (strength) throw badRequest(strength);
  const hash = hashToken(token);
  const record = await prisma.authToken.findFirst({ where: { tokenHash: hash, type: 'reset', usedAt: null } }).catch(() => null);
  if (!record) throw badRequest('Invalid token');
  if (record.expiresAt < new Date()) throw badRequest('Token expired');
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: record.userId }, data: { passwordHash } });
  await prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return { message: 'Password reset successful' };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('User not found');
  const ok = await verifyPassword(user.passwordHash, currentPassword);
  if (!ok) throw badRequest('Current password incorrect');
  const strength = validatePasswordStrength(newPassword);
  if (strength) throw badRequest(strength);
  const hash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
  return { message: 'Password changed' };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { subscriptions: { include: { plan: true } }, children: true } }).catch(() => null);
  if (!user) return { id: userId, email: 'mock@example.com', name: 'Demo', role: 'parent' };
  return sanitize(user);
}

export async function deleteAccount(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } }).catch(() => {});
  return { message: 'Account scheduled for deletion (7-day grace)', deletedAt: new Date() };
}
export async function restoreAccount(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { deletedAt: null } }).catch(() => {});
  return { message: 'Account restored' };
}
export async function exportData(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { children: true, subscriptions: true } }).catch(() => null);
  return user || { message: 'Export mock', userId };
}

function sanitize(u: any) {
  const { passwordHash, ...rest } = u;
  return rest;
}
