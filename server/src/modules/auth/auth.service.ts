import { prisma } from '../../db/client';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../../services/password';
import { signAccessToken, generateRandomToken, hashToken } from '../../services/token';
import { emailService } from '../../services/email';
import { AppError, badRequest, conflict, notFound, unauthorized } from '../../utils/errors';
import { env } from '../../config/env';
import jwt from 'jsonwebtoken';
import { randomId } from '../../utils/crypto';
import { store, ensureDemoCredentials, sanitizeChild } from '../../core/store';

const ACCESS_TTL = env.JWT_ACCESS_TTL || '7d';
const TRIAL_DAYS = env.TRIAL_DAYS || 15;

/**
 * The in-memory user list.
 *
 * Re-exported for backwards compatibility, but the source of truth is `core/store`, which
 * partitions records by owner. There is no longer a bare `parent-demo` entry here: the demo
 * tenant lives in the store with a real id, so no code path can resolve an arbitrary
 * account to it.
 */
export const memUsers: any[] = [];

function createAccessToken(user: { id?: string; userId?: string; email?: string; role?: string; childId?: string }) {
  const uid = user.id || user.userId;
  if (!uid) {
    // Previously this fell back to 'parent-demo', which minted a demo session for any
    // caller that reached it with no id.
    throw new AppError(500, 'Cannot issue a token without a subject');
  }
  return jwt.sign(
    { userId: uid, email: user.email, role: user.role || 'parent', childId: user.childId },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TTL as any }
  );
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  language?: string;
  country?: string;
  timezone?: string;
}) {
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

    // Create the free subscription.
    //
    // This used to fall back to the `trial` plan, which was a different plan with
    // different limits (two children, forty quizzes, twelve months of history). A
    // new account silently received a legacy plan nobody had asked for, and the
    // fallback made the seed's plan list load-bearing for registration.
    const plan = await prisma.plan.findFirst({ where: { code: 'free' } });
    if (plan) {
      await prisma.subscription.create({
        data: { userId: user.id, planId: plan.id, status: 'active', currentPeriodEnd: null, childSlots: 1 },
      });
    }

    // email verification token
    const rawToken = generateRandomToken(32);
    await prisma.authToken.create({
      data: { userId: user.id, type: 'verify', tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    await emailService.send(
      user.email,
      'Verify your email — Ki Shikhle?',
      `<p>Hi ${user.name}, verify: <a href="${env.CLIENT_ORIGIN}/verify-email?token=${rawToken}">${rawToken}</a> expires in 60m</p>`
    );

    const accessToken = createAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);
    return { user: sanitize(user), accessToken, refreshToken, verificationToken: rawToken };
  } catch (e: any) {
    if (e instanceof AppError) throw e;
    // Fallback mock for dev without DB
    console.warn('Auth register DB fallback:', e.message);
    const normEmail = input.email.trim().toLowerCase();
    const existing = store.users.byEmail(normEmail);
    if (existing) throw conflict('Email already registered');

    // Store the argon2id hash, never the plaintext password.
    const passwordHash = await hashPassword(input.password);
    const mockUser = {
      id: 'parent-' + Date.now(),
      email: normEmail,
      name: input.name,
      passwordHash,
      role: 'parent' as const,
      language: input.language || 'en',
      country: input.country || 'BD',
      timezone: input.timezone || 'Asia/Dhaka',
      trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 3600000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    store.users.add(mockUser);
    memUsers.push(mockUser);
    const accessToken = createAccessToken({ id: mockUser.id, email: mockUser.email, role: 'parent' });
    return {
      user: sanitize(mockUser),
      accessToken,
      refreshToken: 'mock-refresh-' + mockUser.id,
      verificationToken: 'mock-token',
    };
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

    // In-memory fallback for dev mode without DB.
    // The password is ALWAYS verified against the stored hash. There used to be a bypass
    // here where the passwords 'Password123!' and 'DemoPass1' matched any account, and a
    // branch where 'parent@demo.com' logged in with no password check at all.
    await ensureDemoCredentials();
    const norm = email.trim().toLowerCase();

    // 1. Parent / child login identities in the store.
    const memUser = store.users.byEmail(norm);
    if (memUser) {
      const ok = await verifyPassword(memUser.passwordHash || '', password);
      if (!ok) throw unauthorized('Invalid credentials');

      let childId: string | undefined;
      let grade: string | undefined;
      let curriculum: string | undefined;

      if (memUser.role === 'child') {
        const c = store.children.findByField('email', norm);
        if (c) {
          childId = c.id;
          grade = c.grade || undefined;
          curriculum = c.curriculum;
        }
      }

      const accessToken = createAccessToken({
        id: memUser.id,
        email: memUser.email,
        role: memUser.role,
        childId,
      });
      return {
        user: { ...sanitize(memUser), childId, grade, curriculum },
        accessToken,
        refreshToken: 'mock-refresh-' + memUser.id,
      };
    }

    // 2. A child that has credentials on the Child row but no login identity yet.
    const memChild = store.children.findByField('email', norm);
    if (memChild && memChild.passwordHash) {
      const ok = await verifyPassword(memChild.passwordHash, password);
      if (!ok) throw unauthorized('Invalid credentials');

      const mockChildUser = {
        id: memChild.id,
        name: memChild.name,
        email: memChild.email,
        role: 'child',
        childId: memChild.id,
        parentId: memChild.ownerId,
        grade: memChild.grade,
        curriculum: memChild.curriculum,
      };
      const token = jwt.sign(
        { userId: memChild.ownerId, childId: memChild.id, email: memChild.email, role: 'child' },
        env.JWT_ACCESS_SECRET,
        { expiresIn: (env.JWT_ACCESS_TTL || '7d') as any }
      );
      return { user: mockChildUser, accessToken: token, refreshToken: 'mock-refresh-' + memChild.id };
    }

    throw unauthorized('Invalid credentials');
  }
}

export async function createRefreshToken(userId: string, meta?: { ip?: string; userAgent?: string }) {
  const familyId = randomId();
  const raw = jwt.sign({ userId, familyId, type: 'refresh' }, env.JWT_REFRESH_SECRET, { expiresIn: `${env.REFRESH_TTL_DAYS}d` as any });
  try {
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(raw),
        familyId,
        expiresAt: new Date(Date.now() + env.REFRESH_TTL_DAYS * 24 * 3600000),
        userAgent: meta?.userAgent,
        ip: meta?.ip,
      },
    });
  } catch {}
  return raw;
}

export async function refreshTokens(oldRefreshToken: string) {
  // Refresh tokens are opaque, single-use, server-side records. There used to be a branch
  // here that treated any token starting with 'mock-refresh' — or merely *containing* the
  // word 'demo' — as a valid session for the seeded demo family. Because this endpoint is
  // public, that was an unauthenticated login bypass: POST /auth/refresh with
  // {refreshToken:"mock-refresh-parent"} returned a signed access token.
  //
  // A refresh token that is not a verifiable JWT is simply invalid.

  try {
    const payload: any = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET);
    const hash = hashToken(oldRefreshToken);
    const stored = await prisma.refreshToken.findFirst({ where: { tokenHash: hash } });

    // Race condition prevention: allow a 60-second grace window if revoked recently
    const isRecentlyRevoked = stored?.revokedAt && Date.now() - new Date(stored.revokedAt).getTime() < 60000;

    if (!stored || (stored.revokedAt && !isRecentlyRevoked) || stored.expiresAt < new Date()) {
      if (stored?.familyId && !isRecentlyRevoked) {
        await prisma.refreshToken.updateMany({ where: { familyId: stored.familyId }, data: { revokedAt: new Date() } });
      }
      throw unauthorized('Invalid refresh token');
    }

    if (!stored.revokedAt) {
      await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.deletedAt) {
      const child = await prisma.child.findUnique({ where: { id: payload.userId } });
      if (child && !child.deletedAt) {
        const newAccess = jwt.sign(
          { userId: child.parentId, childId: child.id, email: (child as any).email, role: 'child' },
          env.JWT_ACCESS_SECRET,
          { expiresIn: (env.JWT_ACCESS_TTL || '7d') as any }
        );
        const newRefresh = await createRefreshToken(child.id);
        // `sanitize` strips only `passwordHash` — a Child row also carries
        // `pinHash`, the PIN used for child-mode entry. That hash was reaching the
        // client on every refresh. `sanitizeChild` strips both.
        return { accessToken: newAccess, refreshToken: newRefresh, user: sanitizeChild(child) };
      }
      throw unauthorized('User not found');
    }

    const newAccess = createAccessToken(user);
    const newRefresh = await createRefreshToken(user.id);
    return { accessToken: newAccess, refreshToken: newRefresh, user: sanitize(user) };
  } catch (e: any) {
    if (e instanceof AppError) throw e;
    // A database blip during refresh must NOT escalate the caller to another account.
    // The client retries on any 401, so returning a demo session here silently swapped a
    // real parent's identity for the seeded demo family — the exact bug this project is
    // fixing. Fail closed instead.
    console.warn('Refresh failed:', e?.message);
    throw unauthorized('Session refresh failed — please log in again');
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

    // A child-role account has a second copy of the same credential on its `Child` row.
    // Write it there too, so the two can never diverge.
    if (user.role === 'child') {
      try {
        await prisma.child.updateMany({ where: { email: user.email }, data: { passwordHash } });
      } catch {}
      const memChild = store.children.findByField('email', user.email);
      if (memChild) memChild.passwordHash = passwordHash;
    }

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
      include: {
        subscriptions: { include: { plan: true } },
        // The children relation is projected, NOT included wholesale: `Child` carries
        // `passwordHash` and `pinHash`, so `include: { children: true }` sent every
        // child's argon2id hash to the owning parent on every `/auth/me` call.
        children: {
          select: {
            id: true,
            name: true,
            nickname: true,
            grade: true,
            curriculum: true,
            medium: true,
            avatar: true,
            email: true,
            slug: true,
            demoProfile: true,
          },
        },
      },
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

      // The in-memory store, scoped to the requested id.
      const memU = store.users.byId(userId);
      if (memU) return sanitize(memU);

      const memC = store.children.findByField('email', userId) || store.children.findAny(userId);
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

      // An unknown id is an authentication failure. It used to return the demo parent here,
      // which meant every session reported itself as the demo family when the database was
      // unreachable.
      throw notFound('User not found');
    }

    if (user.role === 'child') {
      const child = await prisma.child.findFirst({ where: { email: user.email, deletedAt: null } });
      return {
        ...sanitize(user),
        childId: child?.id,
        grade: child?.grade,
        curriculum: child?.curriculum,
        // The demo dataset selector, so a demo child sees the demo content on their own
        // dashboard. It is chosen by the server and only ever reaches this child.
        demoProfile: child?.demoProfile ?? null,
      };
    }

    return sanitize(user);
  } catch (e: any) {
    if (e instanceof AppError) throw e;
    // Degraded mode — the store is scoped exactly like the database.
    const memU = store.users.byId(userId);
    if (memU) return sanitize(memU);
    const memC = store.children.findByField('email', userId) || store.children.findAny(userId);
    if (memC) {
      return {
        id: memC.id,
        name: memC.name,
        email: memC.email,
        role: 'child',
        childId: memC.id,
        grade: memC.grade,
        curriculum: memC.curriculum,
        demoProfile: memC.demoProfile ?? null,
      };
    }
    throw notFound('User not found');
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
  // Same projection rule as `me()`: a data export must not include the credential
  // columns of the account or of its children.
  const user = await prisma.user
    .findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        language: true,
        country: true,
        timezone: true,
        emailVerifiedAt: true,
        trialEndsAt: true,
        createdAt: true,
        updatedAt: true,
        children: {
          select: {
            id: true,
            name: true,
            nickname: true,
            grade: true,
            curriculum: true,
            medium: true,
            avatar: true,
            email: true,
            slug: true,
            demoProfile: true,
            createdAt: true,
          },
        },
        subscriptions: { include: { plan: true } },
      },
    })
    .catch(() => null);
  return user || { message: 'Export mock', userId };
}

function sanitize(u: any) {
  const { passwordHash, ...rest } = u;
  return rest;
}
