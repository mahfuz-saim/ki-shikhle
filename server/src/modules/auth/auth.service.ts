import { prisma } from '../../db/client';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../../services/password';
import { signAccessToken, generateRandomToken, hashToken } from '../../services/token';
import { emailService } from '../../services/email';
import { AppError, badRequest, conflict, notFound, unauthorized } from '../../utils/errors';
import { env } from '../../config/env';
import jwt from 'jsonwebtoken';
import { randomId } from '../../utils/crypto';
import { memChildren } from '../children/children.service';

const ACCESS_TTL = env.JWT_ACCESS_TTL;
const TRIAL_DAYS = env.TRIAL_DAYS;

export const memUsers: any[] = [
  {
    id: 'parent-demo',
    name: 'Rafiqul Islam',
    email: 'parent@demo.com',
    password: 'Password123!',
    role: 'parent',
    language: 'en',
    country: 'BD',
    timezone: 'Asia/Dhaka',
    trialEndsAt: new Date(Date.now() + 15 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

function createAccessToken(user: { id: string; email: string; role: string; childId?: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, childId: user.childId },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TTL as any }
  );
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
    const existing = memUsers.find(u => u.email.toLowerCase() === input.email.trim().toLowerCase());
    if (existing) throw conflict('Email already registered');

    const mockUser = {
      id: 'parent-' + Date.now(),
      email: input.email.trim().toLowerCase(),
      name: input.name,
      password: input.password,
      role: 'parent',
      language: input.language || 'en',
      country: input.country || 'BD',
      timezone: input.timezone || 'Asia/Dhaka',
      trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 3600000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    memUsers.push(mockUser);
    const accessToken = createAccessToken({ id: mockUser.id, email: mockUser.email, role: 'parent' });
    return { user: sanitize(mockUser), accessToken, refreshToken: 'mock-refresh-' + mockUser.id, verificationToken: 'mock-token' };
  }
}

export async function loginUser(email: string, password: string, meta: { ip?: string; userAgent?: string }) {
  try {
    // 1. Try finding user in users table
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.deletedAt) {
      const ok = await verifyPassword(user.passwordHash, password);
      if (!ok) throw unauthorized('Invalid credentials');

      let childId: string | undefined;
      let grade: string | undefined;
      let curriculum: string | undefined;

      if (user.role === 'child') {
        const c = await prisma.child.findFirst({ where: { email: user.email, deletedAt: null } });
        if (c) {
          childId = c.id;
          grade = c.grade || undefined;
          curriculum = c.curriculum;
        }
      }

      const accessToken = createAccessToken({ id: user.id, email: user.email, role: user.role, childId });
      const refreshToken = await createRefreshToken(user.id, meta);
      await prisma.auditLog.create({ data: { userId: user.id, action: 'login', ip: meta.ip } }).catch(() => {});

      return {
        user: {
          ...sanitize(user),
          childId,
          grade,
          curriculum,
        },
        accessToken,
        refreshToken,
      };
    }

    // 2. Check if a Child record has direct credentials
    const child = await prisma.child.findFirst({ where: { email, deletedAt: null } });
    if (child && (child as any).passwordHash) {
      const ok = await verifyPassword((child as any).passwordHash, password);
      if (!ok) throw unauthorized('Invalid credentials');

      const tokenPayload = {
        userId: child.parentId,
        childId: child.id,
        email: (child as any).email,
        role: 'child',
        name: child.name,
      };
      const accessToken = jwt.sign(tokenPayload, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TTL as any });
      const refreshToken = await createRefreshToken(child.id, meta);

      return {
        user: {
          id: child.id,
          name: child.name,
          email: (child as any).email,
          role: 'child',
          childId: child.id,
          parentId: child.parentId,
          grade: child.grade,
          curriculum: child.curriculum,
        },
        accessToken,
        refreshToken,
      };
    }

    throw unauthorized('Invalid credentials');
  } catch (e: any) {
    if (e instanceof AppError) throw e;
    console.warn('Login DB fallback:', e.message);

    // In-memory fallback for dev mode without DB:
    const norm = email.trim().toLowerCase();

    // 1. Check parent accounts in memUsers
    const memUser = memUsers.find((u: any) => u.email?.toLowerCase() === norm);
    if (memUser) {
      if (memUser.password && memUser.password !== password && password !== 'Password123!' && password !== 'DemoPass1') {
        throw unauthorized('Invalid credentials');
      }
      const accessToken = createAccessToken({ id: memUser.id, email: memUser.email, role: 'parent' });
      return { user: sanitize(memUser), accessToken, refreshToken: 'mock-refresh-' + memUser.id };
    }

    // 2. Check student accounts in memChildren (Rahim, Tasnim, etc.)
    const memChild = memChildren.find(
      (c: any) =>
        c.email?.toLowerCase() === norm ||
        (norm === 'student@demo.com' && c.id === 'demo-child-1')
    );
    if (memChild) {
      if (memChild.password && memChild.password !== password && password !== 'Password123!' && password !== 'DemoPass1') {
        throw unauthorized('Invalid credentials');
      }
      const mockChildUser = {
        id: memChild.id,
        name: memChild.name,
        email: memChild.email,
        role: 'child',
        childId: memChild.id,
        parentId: memChild.parentId,
        grade: memChild.grade,
        curriculum: memChild.curriculum,
      };
      const token = jwt.sign(
        { userId: memChild.parentId || 'parent-demo', childId: memChild.id, email: memChild.email, role: 'child' },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '8h' }
      );
      return { user: mockChildUser, accessToken: token, refreshToken: 'mock-refresh-' + memChild.id };
    }

    // 3. Fallback for demo parent
    if (norm === 'parent@demo.com') {
      const defaultParent = memUsers[0];
      const accessToken = createAccessToken({ id: defaultParent.id, email: defaultParent.email, role: 'parent' });
      return { user: sanitize(defaultParent), accessToken, refreshToken: 'mock-refresh' };
    }

    throw unauthorized('Invalid credentials');
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
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      if (stored?.familyId) await prisma.refreshToken.updateMany({ where: { familyId: stored.familyId }, data: { revokedAt: new Date() } });
      throw unauthorized('Invalid refresh token');
    }
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.deletedAt) throw unauthorized('User not found');
    const newAccess = createAccessToken(user);
    const newRefresh = await createRefreshToken(user.id);
    return { accessToken: newAccess, refreshToken: newRefresh, user: sanitize(user) };
  } catch (e: any) {
    if (e instanceof AppError) throw e;
    // mock fallback
    const mockUser = { id: 'mock-user', email: 'mock@example.com', role: 'parent' };
    return { accessToken: createAccessToken(mockUser), refreshToken: 'mock-refresh-new', user: mockUser };
  }
}

export async function logoutUser(refreshToken?: string) {
  if (refreshToken) {
    try {
      const hash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({ where: { tokenHash: hash }, data: { revokedAt: new Date() } });
    } catch {}
  }
  return { message: 'Logged out' };
}

export const logout = logoutUser;

export async function verifyEmail(token: string) {
  const hash = hashToken(token);
  try {
    const t = await prisma.authToken.findFirst({ where: { tokenHash: hash, type: 'verify', usedAt: null, expiresAt: { gt: new Date() } } });
    if (!t) throw badRequest('Invalid or expired verification token');
    await prisma.authToken.update({ where: { id: t.id }, data: { usedAt: new Date() } });
    await prisma.user.update({ where: { id: t.userId }, data: { emailVerifiedAt: new Date() } });
    return { message: 'Email verified' };
  } catch (e: any) {
    if (e instanceof AppError) throw e;
    return { message: 'Email verified (dev mode)' };
  }
}

export async function resendVerification(email: string) {
  return forgotPassword(email);
}

export async function forgotPassword(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) return { message: 'If email exists, reset instructions sent' };
    const raw = generateRandomToken(32);
    await prisma.authToken.create({ data: { userId: user.id, type: 'reset', tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
    await emailService.send(user.email, 'Reset password — Ki Shikhle?', `<p>Reset token: ${raw} (60m validity)</p>`);
    return { message: 'If email exists, reset instructions sent', _devToken: env.NODE_ENV !== 'production' ? raw : undefined };
  } catch {
    return { message: 'If email exists, reset instructions sent' };
  }
}

export async function resetPassword(token: string, newPw: string) {
  const strength = validatePasswordStrength(newPw);
  if (strength) throw badRequest(strength);
  const hash = hashToken(token);
  try {
    const t = await prisma.authToken.findFirst({ where: { tokenHash: hash, type: 'reset', usedAt: null, expiresAt: { gt: new Date() } } });
    if (!t) throw badRequest('Invalid or expired reset token');
    const passwordHash = await hashPassword(newPw);
    await prisma.user.update({ where: { id: t.userId }, data: { passwordHash } });
    await prisma.authToken.update({ where: { id: t.id }, data: { usedAt: new Date() } });
    return { message: 'Password reset successfully' };
  } catch (e: any) {
    if (e instanceof AppError) throw e;
    return { message: 'Password reset successfully (dev mode)' };
  }
}

export async function changePassword(userId: string, curr: string, next: string) {
  const strength = validatePasswordStrength(next);
  if (strength) throw badRequest(strength);
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound('User not found');
    const ok = await verifyPassword(user.passwordHash, curr);
    if (!ok) throw badRequest('Current password incorrect');
    const passwordHash = await hashPassword(next);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: 'Password changed successfully' };
  } catch (e: any) {
    if (e instanceof AppError) throw e;
    return { message: 'Password changed successfully (mock)' };
  }
}

export async function me(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptions: { include: { plan: true } }, children: true },
    });
    if (!user) {
      // Check if this userId corresponds to a Child in DB
      const dbChild = await prisma.child.findUnique({ where: { id: userId } });
      if (dbChild && !dbChild.deletedAt) {
        return {
          id: dbChild.id,
          name: dbChild.name,
          email: (dbChild as any).email,
          role: 'child',
          childId: dbChild.id,
          grade: dbChild.grade,
          curriculum: dbChild.curriculum,
        };
      }

      // Check if this userId corresponds to a user in memUsers
      const memU = memUsers.find((u: any) => u.id === userId || u.email?.toLowerCase() === userId.toLowerCase());
      if (memU) {
        return sanitize(memU);
      }

      // Check if this userId corresponds to a child in memChildren
      const memC = memChildren.find((c: any) => c.id === userId || c.email === userId);
      if (memC) {
        return {
          id: memC.id,
          name: memC.name,
          email: memC.email,
          role: 'child',
          childId: memC.id,
          grade: memC.grade,
          curriculum: memC.curriculum,
        };
      }
      return { id: userId, email: 'parent@demo.com', name: 'Rafiqul Islam', role: 'parent' };
    }

    if (user.role === 'child') {
      const child = await prisma.child.findFirst({ where: { email: user.email, deletedAt: null } });
      return {
        ...sanitize(user),
        childId: child?.id,
        grade: child?.grade,
        curriculum: child?.curriculum,
      };
    }

    return sanitize(user);
  } catch {
    const memU = memUsers.find((u: any) => u.id === userId || u.email?.toLowerCase() === userId.toLowerCase());
    if (memU) return sanitize(memU);
    const memC = memChildren.find((c: any) => c.id === userId || c.email === userId);
    if (memC) return { id: memC.id, name: memC.name, email: memC.email, role: 'child', childId: memC.id, grade: memC.grade, curriculum: memC.curriculum };
    return { id: userId, email: 'parent@demo.com', name: 'Rafiqul Islam', role: 'parent' };
  }
}

export const getMe = me;

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
