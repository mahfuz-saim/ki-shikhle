import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/services/password';
import { PLANS, LEGACY_PLANS } from '../src/services/entitlements';

/**
 * The demo tenant's deterministic ids.
 *
 * These are shared with `src/core/store.ts` so the database path and the no-database
 * fallback agree on which child is which. The ids are plain UUIDs — nothing anywhere
 * identifies the demo tenant by an id prefix, because a prefix check is exactly the shape
 * of bug that caused the original cross-tenant data leak.
 */
const DEMO_PARENT_ID = '00000000-0000-4000-8000-000000000001';
const DEMO_CHILD_IDS = {
  rahim: '00000000-0000-4000-8000-000000000101',
  tasnim: '00000000-0000-4000-8000-000000000102',
  fahim: '00000000-0000-4000-8000-000000000103',
} as const;

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding plans...');
  /**
   * The limits are **derived from the code's plan catalogue**, not written out again
   * here. They used to be a hand-copied duplicate that drifted: the database said
   * `standard` granted five children while the entitlement code granted two, so a
   * subscriber who paid for five was blocked at two. Deriving them makes that class
   * of bug impossible — there is one place that says what a plan grants.
   */
  const plans = [
    { code: 'free', priceBdt: 0, priceUsd: 0, active: true },
    { code: 'basic', priceBdt: 249, priceUsd: 2.99, active: true },
    { code: 'premium', priceBdt: 599, priceUsd: 6.99, active: true },
    { code: 'pro', priceBdt: 999, priceUsd: 11.99, active: true },
  ].map((p) => {
    const plan = PLANS[p.code];
    return {
      code: p.code,
      name: plan.name,
      priceBdt: p.priceBdt,
      priceUsd: p.priceUsd,
      limitsJson: plan.limits,
      active: p.active,
    };
  });
  for (const p of plans) await prisma.plan.upsert({ where: { code: p.code }, update: p, create: p });

  /**
   * The legacy plans are kept in the table so an existing `Subscription` row still
   * resolves to a plan. Their row records what they were **sold** — that is the
   * historical promise — while the entitlement layer maps each of them onto a
   * current plan that grants at least that much, so nobody loses access to
   * something they already paid for.
   */
  for (const code of ['trial', 'starter', 'standard']) {
    const legacy = LEGACY_PLANS[code];
    const row = {
      code,
      name: legacy.name,
      priceBdt: legacy.priceBDT,
      priceUsd: legacy.priceUSD,
      limitsJson: legacy.sold,
      active: false,
    };
    await prisma.plan.upsert({ where: { code }, update: row, create: row });
  }


  console.log('Seeding subjects (NCTB subset)...');
  const subjects = [
    { curriculum: 'NCTB', grade: '6', nameEn: 'Bangla', nameBn: 'বাংলা' },
    { curriculum: 'NCTB', grade: '6', nameEn: 'English', nameBn: 'ইংরেজি' },
    { curriculum: 'NCTB', grade: '6', nameEn: 'Mathematics', nameBn: 'গণিত' },
    { curriculum: 'NCTB', grade: '6', nameEn: 'Science', nameBn: 'বিজ্ঞান' },
    { curriculum: 'NCTB', grade: '6', nameEn: 'Bangladesh & Global Studies', nameBn: 'বাংলাদেশ ও বিশ্বপরিচয়' },
    { curriculum: 'NCTB', grade: '6', nameEn: 'Religion', nameBn: 'ধর্ম' },
    { curriculum: 'NCTB', grade: '6', nameEn: 'ICT', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি' },
    { curriculum: 'NCTB', grade: '7', nameEn: 'Bangla', nameBn: 'বাংলা' },
    { curriculum: 'NCTB', grade: '7', nameEn: 'English', nameBn: 'ইংরেজি' },
    { curriculum: 'NCTB', grade: '7', nameEn: 'Mathematics', nameBn: 'গণিত' },
    { curriculum: 'NCTB', grade: '7', nameEn: 'Science', nameBn: 'বিজ্ঞান' },
    { curriculum: 'NCTB', grade: '8', nameEn: 'Mathematics', nameBn: 'গণিত' },
    { curriculum: 'NCTB', grade: '9', nameEn: 'Physics', nameBn: 'পদার্থবিজ্ঞান' },
    { curriculum: 'NCTB', grade: '9', nameEn: 'Chemistry', nameBn: 'রসায়ন' },
    { curriculum: 'NCTB', grade: '9', nameEn: 'Biology', nameBn: 'জীববিজ্ঞান' },
    { curriculum: 'NCTB', grade: '9', nameEn: 'Higher Mathematics', nameBn: 'উচ্চতর গণিত' },
    { curriculum: 'NCTB', grade: '11', nameEn: 'Physics', nameBn: 'পদার্থবিজ্ঞান' },
    { curriculum: 'NCTB', grade: '11', nameEn: 'Chemistry', nameBn: 'রসায়ন' },
    { curriculum: 'NCTB', grade: '11', nameEn: 'Biology', nameBn: 'জীববিজ্ঞান' },
    { curriculum: 'NCTB', grade: '11', nameEn: 'Mathematics', nameBn: 'গণিত' },
    { curriculum: 'NCTB', grade: '11', nameEn: 'ICT', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি' },
    { curriculum: 'NCTB', grade: '11', nameEn: 'Bangla', nameBn: 'বাংলা' },
    { curriculum: 'NCTB', grade: '11', nameEn: 'English', nameBn: 'ইংরেজি' },
  ];
  for (const s of subjects) {
    const exists = await prisma.subject.findFirst({ where: { curriculum: s.curriculum, grade: s.grade, nameEn: s.nameEn } });
    if (!exists) await prisma.subject.create({ data: { ...s, isCustom: false } });
  }

  // Demo Parent & Pro Family Subscription
  console.log('Seeding demo accounts...');
  const passwordHash = await hashPassword('Password123!');

  // The upsert key is the EMAIL, not the id. The id is only set on create. Previously the
  // id was hardcoded to 'parent-demo' while the upsert matched on email — so on a database
  // that already had the demo parent under a random UUID, the seeded id and the real id
  // disagreed and every `where: { id: 'parent-demo' }` query found nothing.
  const demoUser = await prisma.user.upsert({
    where: { email: 'parent@demo.com' },
    update: {
      name: 'Rafiqul Islam',
      passwordHash,
      trialEndsAt: null,
    },
    create: {
      id: DEMO_PARENT_ID,
      name: 'Rafiqul Islam',
      email: 'parent@demo.com',
      passwordHash,
      role: 'parent',
      language: 'en',
      country: 'BD',
      timezone: 'Asia/Dhaka',
      trialEndsAt: null,
    },
  });

  const proPlan = await prisma.plan.findUnique({ where: { code: 'pro' } });
  if (proPlan) {
    await prisma.subscription.upsert({
      where: { id: 'sub-demo-parent-pro' },
      update: {
        planId: proPlan.id,
        status: 'active',
        childSlots: 5,
        userId: demoUser.id,
      },
      create: {
        id: 'sub-demo-parent-pro',
        userId: demoUser.id,
        planId: proPlan.id,
        status: 'active',
        childSlots: 5,
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
      },
    });
  }

  // Seed Children
  const childrenData = [
    { id: DEMO_CHILD_IDS.rahim, parentId: demoUser.id, name: 'Rahim Ahmed', nickname: 'Rahim', grade: 'Class 8', curriculum: 'NCTB', medium: 'Bangla', avatar: '/avatars/boy-1.png', slug: 'rahim', demoProfile: 'rahim', email: 'rahim@demo.com' },
    { id: DEMO_CHILD_IDS.tasnim, parentId: demoUser.id, name: 'Tasnim Islam', nickname: 'Tasnim', grade: 'Class 5', curriculum: 'NCTB', medium: 'Bangla', avatar: '/avatars/girl-1.png', slug: 'tasnim', demoProfile: 'tasnim', email: 'tasnim@demo.com' },
    { id: DEMO_CHILD_IDS.fahim, parentId: demoUser.id, name: 'Fahim Islam', nickname: 'Fahim', grade: 'Class 11', curriculum: 'NCTB', medium: 'Bangla', avatar: '/avatars/boy-2.png', slug: 'fahim', demoProfile: 'fahim', email: 'fahim@demo.com' },
  ];
  for (const c of childrenData) {
    await prisma.child.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    });

    // The `users` table doubles as the child-credential table, so each demo child needs a
    // login identity with the child's own id. Without it a child token would have to carry
    // the parent's id, and the server could not tell the two apart.
    const existingIdentity = await prisma.user.findUnique({ where: { email: c.email } });
    if (!existingIdentity) {
      await prisma.user.create({
        data: {
          name: c.name,
          email: c.email,
          passwordHash,
          role: 'child',
          language: 'en',
        },
      });
    }
    await prisma.child.update({ where: { id: c.id }, data: { passwordHash } });
  }

  console.log('Seed done');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
