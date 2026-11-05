/**
 * One-off migration: move the demo tenant onto deterministic UUIDs.
 *
 * Why
 * ---
 * The demo tenant used to be identified by the id prefix `parent-demo` and by child ids
 * `demo-child-1/2/3`. Two problems with that:
 *
 *  1. The client hardcoded `demo-child-1` in ~62 places, so every future "is this the demo
 *     tenant?" check would have been a string-prefix check — exactly the shape of bug that
 *     caused the original cross-tenant leak.
 *  2. The seeded demo parent was created with `id: 'parent-demo'`, but the upsert key was
 *     the **email**. The database already had the demo parent under a random UUID
 *     (`bb7bca75-…`), so re-running the seed matched on email and left the id alone —
 *     meaning the seeded id and the actual id disagreed, and every `where: { id: 'parent-demo' }`
 *     query silently found nothing.
 *
 * This script moves the demo tenant onto stable, deterministic UUIDs and re-points every
 * foreign key at them.
 *
 * Renaming a primary key that other tables reference means the FK constraints have to be
 * lifted for the duration — the database validates them on every statement, so a
 * `UPDATE children SET id = ...` would be rejected while `learning_entries.child_id` still
 * pointed at the old value. The script therefore:
 *
 *   1. records the FK definitions that reference `users(id)` / `children(id)`,
 *   2. drops them,
 *   3. renames the parent and the three children,
 *   4. re-points every referencing column,
 *   5. re-creates the constraints,
 *   6. re-adds the `slug` / `demo_profile` columns and the child login identities.
 *
 * Idempotent: safe to run more than once.
 *
 * Usage: `npx tsx scripts/migrateDemoIds.ts`
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_PARENT_ID = '00000000-0000-4000-8000-000000000001';
const DEMO_CHILD_IDS: Record<string, string> = {
  'demo-child-1': '00000000-0000-4000-8000-000000000101', // Rahim
  'demo-child-2': '00000000-0000-4000-8000-000000000102', // Tasnim
  'demo-child-3': '00000000-0000-4000-8000-000000000103', // Fahim
};
const DEMO_CHILD_SLUGS: Record<string, string> = {
  'demo-child-1': 'rahim',
  'demo-child-2': 'tasnim',
  'demo-child-3': 'fahim',
};

interface FkDef {
  name: string;
  table: string;
  def: string;
}

/** Every foreign key that points at `users(id)` or `children(id)`. */
async function collectConstraints(): Promise<FkDef[]> {
  const rows: any[] = await prisma.$queryRawUnsafe(`
    SELECT con.conname AS name,
           rel.relname AS table,
           pg_get_constraintdef(con.oid) AS def
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = rel.relnamespace
      JOIN pg_class refrel ON refrel.oid = con.confrelid
      JOIN pg_namespace refns ON refns.oid = refrel.relnamespace
     WHERE con.contype = 'f'
       AND ns.nspname = 'public'
       AND refns.nspname = 'public'
       AND refrel.relname IN ('users', 'children')
  `);
  return rows;
}

async function main() {
  console.log('▶ Demo tenant id migration starting…\n');

  // ---------------------------------------------------------------- 1. The parent
  const demoUser = await prisma.user.findUnique({ where: { email: 'parent@demo.com' } });
  if (!demoUser) {
    console.error('✗ No user with email parent@demo.com — run the seed first. Aborting.');
    process.exit(1);
  }

  const oldParentId = demoUser.id;
  const parentMoves = oldParentId !== DEMO_PARENT_ID;

  // ------------------------------------------------- 2. Detect orphaned real children
  //
  // While the old `resolveParentContext` bug was live, a brand-new parent's child was
  // written under the demo parent. Those rows belong to a real customer and must be
  // reassigned, not migrated with the demo family.
  const orphans: any[] = await prisma.$queryRawUnsafe(
    `SELECT c.id, c.name, c.email
       FROM children c
      WHERE c.parent_id = $1
        AND c.email IS NOT NULL
        AND c.email NOT IN ('rahim@demo.com','tasnim@demo.com','fahim@demo.com')`,
    oldParentId,
  );

  if (orphans.length > 0) {
    console.log(`  ⚠ ${orphans.length} non-demo child(ren) are filed under the demo parent:`);
    for (const o of orphans) console.log(`      ${o.id}  ${o.name}  <${o.email}>`);
    console.log('    These are real customers misfiled by the old bug. Reassign them manually');
    console.log('    (UPDATE children SET parent_id = <real parent uuid> WHERE id = ...) and re-run.');
    console.log('    They are LEFT ALONE by this script on purpose.\n');
  }

  // ------------------------------------------------- 3. Lift the FK constraints
  const constraints = await collectConstraints();
  console.log(`  lifting ${constraints.length} foreign key constraint(s)…`);
  for (const c of constraints) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${c.table}" DROP CONSTRAINT "${c.name}"`);
  }

  try {
    // ------------------------------------------------------- 4. Rename the parent
    if (parentMoves) {
      console.log(`  parent: ${oldParentId} → ${DEMO_PARENT_ID}`);
      await prisma.$executeRawUnsafe(`UPDATE users SET id = $1 WHERE id = $2`, DEMO_PARENT_ID, oldParentId);
      console.log('    ✓ parent id migrated');
    } else {
      console.log('  ✓ parent already at the deterministic id');
    }

    // ------------------------------------------------------ 5. Rename the children
    for (const [legacyId, newId] of Object.entries(DEMO_CHILD_IDS)) {
      const child = await prisma.child.findUnique({ where: { id: legacyId } });
      if (!child) continue;

      console.log(`  child: ${legacyId} → ${newId}`);
      await prisma.$executeRawUnsafe(`UPDATE children SET id = $1 WHERE id = $2`, newId, legacyId);
      console.log('    ✓ migrated');
    }

    // ------------------------------ 6. Re-point every referencing column to the new ids
    if (parentMoves) {
      await prisma.$executeRawUnsafe(`UPDATE children SET parent_id = $1 WHERE parent_id = $2`, DEMO_PARENT_ID, oldParentId);
      await prisma.$executeRawUnsafe(`UPDATE subscriptions SET user_id = $1 WHERE user_id = $2`, DEMO_PARENT_ID, oldParentId);
      await prisma.$executeRawUnsafe(`UPDATE notifications SET user_id = $1 WHERE user_id = $2`, DEMO_PARENT_ID, oldParentId);
      await prisma.$executeRawUnsafe(`UPDATE refresh_tokens SET user_id = $1 WHERE user_id = $2`, DEMO_PARENT_ID, oldParentId);
      await prisma.$executeRawUnsafe(`UPDATE auth_tokens SET user_id = $1 WHERE user_id = $2`, DEMO_PARENT_ID, oldParentId);
      await prisma.$executeRawUnsafe(`UPDATE ai_usage_logs SET user_id = $1 WHERE user_id = $2`, DEMO_PARENT_ID, oldParentId);
      await prisma.$executeRawUnsafe(`UPDATE audit_logs SET user_id = $1 WHERE user_id = $2`, DEMO_PARENT_ID, oldParentId);
      await prisma.$executeRawUnsafe(`UPDATE subjects SET parent_id = $1 WHERE parent_id = $2`, DEMO_PARENT_ID, oldParentId);
      await prisma.$executeRawUnsafe(`UPDATE quizzes SET created_by = $1 WHERE created_by = $2`, DEMO_PARENT_ID, oldParentId);
      console.log('  ✓ parent references re-pointed');
    }

    for (const [legacyId, newId] of Object.entries(DEMO_CHILD_IDS)) {
      await prisma.$executeRawUnsafe(`UPDATE learning_entries SET child_id = $1 WHERE child_id = $2`, newId, legacyId);
      await prisma.$executeRawUnsafe(`UPDATE notes SET child_id = $1 WHERE child_id = $2`, newId, legacyId);
      await prisma.$executeRawUnsafe(`UPDATE routines SET child_id = $1 WHERE child_id = $2`, newId, legacyId);
      await prisma.$executeRawUnsafe(`UPDATE quizzes SET child_id = $1 WHERE child_id = $2`, newId, legacyId);
      await prisma.$executeRawUnsafe(`UPDATE quiz_attempts SET child_id = $1 WHERE child_id = $2`, newId, legacyId);
      await prisma.$executeRawUnsafe(`UPDATE topic_digests SET child_id = $1 WHERE child_id = $2`, newId, legacyId);
      await prisma.$executeRawUnsafe(`UPDATE ai_usage_logs SET child_id = $1 WHERE child_id = $2`, newId, legacyId);
      await prisma.$executeRawUnsafe(`UPDATE "_ChildToSubject" SET "B" = $1 WHERE "B" = $2`, newId, legacyId);
    }
    console.log('  ✓ child references re-pointed');
  } finally {
    // ------------------------------------------- 7. Restore the FK constraints
    console.log('  restoring foreign key constraints…');
    for (const c of constraints) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${c.table}" ADD CONSTRAINT "${c.name}" ${c.def}`);
    }
  }

  // ------------------------------------------------ 8. slug / demo_profile columns
  for (const [legacyId, newId] of Object.entries(DEMO_CHILD_IDS)) {
    const slug = DEMO_CHILD_SLUGS[legacyId];
    await prisma.$executeRawUnsafe(
      `UPDATE children SET slug = $1, demo_profile = $1 WHERE id = $2`,
      slug,
      newId,
    );
  }
  console.log('  ✓ slug / demo_profile set');

  // ------------------------------------------------------- 9. Child login identities
  //
  // `users` doubles as the child-credential table. Give each demo child a real login
  // identity so a child token carries the child's own id rather than the parent's.
  const { hashPassword } = await import('../src/services/password');
  const passwordHash = await hashPassword('Password123!');
  const demoChildren = await prisma.child.findMany({ where: { parentId: DEMO_PARENT_ID } });
  for (const c of demoChildren) {
    if (!c.email) continue;
    const existing = await prisma.user.findUnique({ where: { email: c.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          name: c.name,
          email: c.email,
          passwordHash,
          role: 'child',
          language: 'en',
        },
      });
      console.log(`  ✓ child login identity created for ${c.email}`);
    } else if (existing.role !== 'child') {
      await prisma.user.update({ where: { id: existing.id }, data: { role: 'child' } });
      console.log(`  ✓ ${c.email} re-roled to 'child'`);
    }
    // Keep the child's own hash in sync with the identity's hash.
    await prisma.child.update({ where: { id: c.id }, data: { passwordHash } });
  }

  console.log('\n✅ Demo tenant id migration complete.');
  console.log(`   parent: ${DEMO_PARENT_ID}`);
  for (const [legacy, next] of Object.entries(DEMO_CHILD_IDS)) {
    console.log(`   ${legacy} → ${next}`);
  }
}

main()
  .catch((e) => {
    console.error('✗ Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
