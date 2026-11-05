/**
 * Which child is this page about?
 *
 * The app used to answer that question with a hardcoded `'demo-child-1'` fallback and a
 * pile of `childId === 'demo-child-2'` checks that picked the demo dataset. That broke
 * twice:
 *
 *  1. A real account with no children yet fell back to `demo-child-1`, so the UI
 *     rendered the demo student's data instead of an empty state.
 *  2. The demo children were migrated to deterministic UUIDs, so every one of those
 *     comparisons stopped matching and the demo walkthrough silently degraded to
 *     generic data — while the *ids* still said `demo-child-1`, which the server no
 *     longer knows.
 *
 * The demo identity is now carried by the data itself: the server returns
 * `demoProfile: 'rahim' | 'tasnim' | 'fahim'` on the demo children, and nothing else.
 * A child is "the demo child" because the server says so, never because of a magic id.
 */

/** The profile keys the server assigns to the seeded demo children. */
export type DemoProfile = 'rahim' | 'tasnim' | 'fahim';

export interface ChildLike {
  id?: string | null;
  name?: string | null;
  grade?: string | null;
  demoProfile?: string | null;
  slug?: string | null;
}

/**
 * The demo profile of a child, if it is one.
 *
 * Reads the server-provided `demoProfile` first. The `slug` is the same key and is
 * present on older payloads. Nothing here matches on an id — the demo children's ids
 * are UUIDs now, and hardcoding them would re-open the very bug this file removes.
 */
export function demoProfileOf(child: ChildLike | null | undefined): DemoProfile | null {
  const raw = child?.demoProfile || child?.slug;
  if (!raw) return null;
  const key = String(raw).toLowerCase();
  if (key === 'rahim' || key === 'tasnim' || key === 'fahim') return key;
  return null;
}

/**
 * The id of the child a page is about.
 *
 * Returns `null` when there is no child — which the callers must handle as an empty
 * state, not by substituting a demo id.
 */
export function resolveChildId(
  explicitId: string | null | undefined,
  ...candidates: Array<ChildLike | null | undefined>
): string | null {
  if (explicitId) return explicitId;
  for (const c of candidates) {
    if (c?.id) return c.id;
  }
  return null;
}
