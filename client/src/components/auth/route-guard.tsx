'use client';

/**
 * Route guards.
 *
 * The app had exactly one check — `app-shell.tsx` redirected anyone whose role was
 * `child`, and nothing else. Two consequences:
 *
 *  - `/admin` was reachable by any signed-in parent. The server answers `403` for a
 *    non-admin (the admin router is `auth('admin')`), but the *page* still rendered
 *    its shell, its headings and its mock metrics before the request failed.
 *  - A signed-out visitor could sit on `/dashboard` and see the skeleton forever,
 *    because `loading` only flips once `/auth/me` answers.
 *
 * `useRouteGuard` centralises the decision. It is deliberately **client-side**: the
 * session lives in `localStorage`, and Next's edge middleware cannot read it. The
 * server remains the authority — every one of these routes is also gated server-side,
 * so this guard is about the UX, not about security.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

export type AllowedRole = 'parent' | 'child' | 'admin';

/**
 * Where a visitor with the wrong role should be sent.
 *
 * A child never belongs in the parent portal or the admin console. A parent belongs
 * in neither the admin console nor (except when previewing) the child portal.
 */
export function homeForRole(role: string | undefined, isChildMode: boolean): string {
  if (isChildMode) return '/child';
  if (role === 'child') return '/child';
  if (role === 'admin') return '/admin';
  return '/dashboard';
}

export interface RouteGuardOptions {
  /** Roles allowed to stay on the page. */
  allow: AllowedRole[];
  /** Where to send a visitor whose role is not allowed. Defaults to their home. */
  redirectTo?: string;
  /**
   * The child portal is reachable by a parent who is previewing a child. That is a
   * deliberate feature, so the child shell opts in with `allow: ['child', 'parent']`.
   */
  allowParentPreview?: boolean;
}

/**
 * Returns true while the session is still being resolved, so a caller can render a
 * skeleton instead of flashing a redirect.
 */
export function useRouteGuard({ allow, redirectTo }: RouteGuardOptions): {
  allowed: boolean;
  resolving: boolean;
} {
  const { user, token, loading, isChildMode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // No session at all — send them to sign in.
    if (!token && !user) {
      router.replace('/login');
      return;
    }

    const role = user?.role;
    if (!role) return;

    if (allow.includes(role as AllowedRole)) return;

    router.replace(redirectTo || homeForRole(role, isChildMode));
  }, [loading, token, user, allow, redirectTo, isChildMode, router]);

  return {
    allowed: !!user && allow.includes(user.role as AllowedRole),
    resolving: loading,
  };
}
