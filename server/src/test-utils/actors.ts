/**
 * Test helpers for building tenancy actors.
 *
 * Every service function now takes an `Actor` instead of a bare `parentId` string, so the
 * tests have to say *who* is acting. These helpers keep that readable.
 */

import { DEMO_PARENT_ID, DEMO_CHILD_IDS, DEMO_SLUGS } from '../core/store';
import type { Actor, Role } from '../core/tenancy';

/** A parent actor that owns the seeded demo family. */
export function demoParent(): Actor {
  return { ownerId: DEMO_PARENT_ID, role: 'parent', email: 'parent@demo.com', degraded: false };
}

/** A child actor for one of the seeded demo children. */
export function demoChild(slug: (typeof DEMO_SLUGS)[number] = 'rahim'): Actor {
  return {
    ownerId: DEMO_PARENT_ID,
    childId: DEMO_CHILD_IDS[slug],
    role: 'child',
    email: `${slug}@demo.com`,
    degraded: false,
  };
}

/** A parent actor for an arbitrary account id. */
export function parent(ownerId: string): Actor {
  return { ownerId, role: 'parent', degraded: false };
}

/** A child actor belonging to an arbitrary parent. */
export function child(ownerId: string, childId: string): Actor {
  return { ownerId, childId, role: 'child', degraded: false };
}

/** An admin actor. Admins may read platform metrics, never tenant content. */
export function admin(ownerId = 'admin-1'): Actor {
  return { ownerId, role: 'admin', degraded: false };
}

export const demoChildIds = DEMO_CHILD_IDS;
export const demoParentId = DEMO_PARENT_ID;

export type { Actor, Role };
