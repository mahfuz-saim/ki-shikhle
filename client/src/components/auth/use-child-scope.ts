'use client';

/**
 * The child a page is about, and which demo dataset (if any) applies.
 *
 * This replaces the pattern that was scattered across a dozen pages:
 *
 * ```ts
 * const childId = activeChild?.id || (user as any)?.childId || user?.id || 'demo-child-1';
 * const isTasnim = childId === 'demo-child-2' || user?.email?.includes('tasnim');
 * ```
 *
 * which was wrong twice over:
 *
 *  - `user?.id` is the **parent's** user id for a parent session, so the fallback asked
 *    the server about a child that does not exist.
 *  - `'demo-child-1'` is a hardcoded id. A brand-new account with no children was sent
 *    a request for the demo student, and — because these pages fall back to mock data
 *    when a request fails — the new account was shown the demo family's content.
 *
 * The demo children now carry deterministic UUIDs and a server-assigned `demoProfile`,
 * so the demo identity comes from the data, never from a magic id.
 */

import { useAuth } from './auth-context';
import { demoProfileOf, type DemoProfile } from '@/lib/child-scope';

export interface ChildScope {
  /** The child's id, or `null` when the account has no child to act for. */
  childId: string | null;
  /** Which demo dataset applies, or `null` for a real (non-demo) child. */
  demoProfile: DemoProfile | null;
  isRahim: boolean;
  isTasnim: boolean;
  isFahim: boolean;
  /** True when the demo tenant's own dataset should be shown. */
  isDemoChild: boolean;
}

export function useChildScope(): ChildScope {
  const { activeChild, user } = useAuth();

  // A child session carries `childId` on the user; a parent session carries the
  // selected child. A parent's own `user.id` is never a child id.
  const childId = activeChild?.id || (user as any)?.childId || null;

  const profile =
    demoProfileOf(activeChild) ||
    (() => {
      const raw = (user as any)?.demoProfile;
      if (!raw) return null;
      const key = String(raw).toLowerCase();
      return key === 'rahim' || key === 'tasnim' || key === 'fahim' ? (key as DemoProfile) : null;
    })();

  return {
    childId,
    demoProfile: profile,
    isRahim: profile === 'rahim',
    isTasnim: profile === 'tasnim',
    isFahim: profile === 'fahim',
    isDemoChild: profile !== null,
  };
}
