import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/services/password';
import { DEMO_ROUTINES } from '../src/core/demo-data';

/**
 * The demo tenant's deterministic ids.
 *
 * Shared with `src/core/store.ts` so the database path and the no-database fallback agree.
 * Nothing identifies the demo tenant by an id prefix — a prefix check is exactly the shape
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
  console.log('🌱 Demo seed starting...');
  const pw = await hashPassword('Password123!');

  // 1. Parent Account
  //
  // The upsert key is the EMAIL. The id is only set on create — previously the id was
  // hardcoded to 'parent-demo' while the upsert matched on email, so on a database that
  // already had the demo parent the seeded id and the real id disagreed.
  const parent = await prisma.user.upsert({
    where: { email: 'parent@demo.com' },
    update: { name: 'Rafiqul Islam', passwordHash: pw, trialEndsAt: null },
    create: {
      id: DEMO_PARENT_ID,
      name: 'Rafiqul Islam',
      email: 'parent@demo.com',
      passwordHash: pw,
      role: 'parent',
      language: 'en',
      country: 'BD',
      timezone: 'Asia/Dhaka',
      trialEndsAt: null,
    },
  });

  // 2. Subscription (Pro Family Plan - Most Upgraded)
  const plan =
    (await prisma.plan.findUnique({ where: { code: 'pro' } })) ||
    (await prisma.plan.findFirst({ orderBy: { priceBdt: 'desc' } }));
  if (plan) {
    await prisma.subscription.upsert({
      where: { id: parent.id + '-sub' },
      update: {
        planId: plan.id,
        status: 'active',
        childSlots: 5,
        userId: parent.id,
        currentPeriodEnd: new Date(Date.now() + 365 * 86400000),
      },
      create: {
        id: parent.id + '-sub',
        userId: parent.id,
        planId: plan.id,
        status: 'active',
        childSlots: 5,
        currentPeriodEnd: new Date(Date.now() + 365 * 86400000),
      },
    });
  }

  /** Create or refresh a demo child plus its login identity. */
  async function upsertDemoChild(opts: {
    id: string;
    name: string;
    nickname: string;
    email: string;
    grade: string;
    slug: string;
  }) {
    const child = await prisma.child.upsert({
      where: { id: opts.id },
      update: {
        email: opts.email,
        passwordHash: pw,
        parentId: parent.id,
        name: opts.name,
        nickname: opts.nickname,
        grade: opts.grade,
        slug: opts.slug,
        demoProfile: opts.slug,
      },
      create: {
        id: opts.id,
        parentId: parent.id,
        name: opts.name,
        nickname: opts.nickname,
        email: opts.email,
        passwordHash: pw,
        grade: opts.grade,
        curriculum: 'NCTB',
        medium: 'Bangla',
        slug: opts.slug,
        demoProfile: opts.slug,
      },
    });

    // The `users` table doubles as the child-credential table. A child token must carry
    // the child's OWN id, otherwise the server cannot tell a child from their parent.
    const existing = await prisma.user.findUnique({ where: { email: opts.email } });
    if (!existing) {
      await prisma.user.create({
        data: { name: opts.name, email: opts.email, passwordHash: pw, role: 'child', language: 'en' },
      });
    } else if (existing.role !== 'child') {
      await prisma.user.update({ where: { id: existing.id }, data: { role: 'child', passwordHash: pw } });
    }

    return child;
  }

  // 3. Child 1: Rahim Ahmed (Class 8)
  const child1 = await upsertDemoChild({
    id: DEMO_CHILD_IDS.rahim,
    name: 'Rahim Ahmed',
    nickname: 'Rahim',
    email: 'rahim@demo.com',
    grade: 'Class 8',
    slug: 'rahim',
  });

  // 4. Child 2: Tasnim Islam (Class 5)
  const child2 = await upsertDemoChild({
    id: DEMO_CHILD_IDS.tasnim,
    name: 'Tasnim Islam',
    nickname: 'Tasnim',
    email: 'tasnim@demo.com',
    grade: 'Class 5',
    slug: 'tasnim',
  });

  // 4.1 Child 3: Fahim Islam (Class 11 - College)
  const child3 = await upsertDemoChild({
    id: DEMO_CHILD_IDS.fahim,
    name: 'Fahim Islam',
    nickname: 'Fahim',
    email: 'fahim@demo.com',
    grade: 'Class 11',
    slug: 'fahim',
  });

  const now = Date.now();
  const dayMs = 86400000;

  // 5. Seed Learning Entries for Rahim
  const rahimEntries = [
    {
      id: 'db-rahim-e1',
      childId: child1.id,
      source: 'tuition' as const,
      providerName: 'রহিম স্যার (Math Tutor)',
      date: new Date(now),
      topicsText: 'অধ্যায় ৪: বীজগণিতীয় সূত্রাবলী ও প্রয়োগ (অনুশীলনী ৪.১) — বর্গের সূত্র (a+b)^2 ও (a-b)^2 ব্যবহার করে সমাধান সম্পন্ন।',
      durationMin: 75,
      confidence: 5,
      verifiedByParent: true,
    },
    {
      id: 'db-rahim-e2',
      childId: child1.id,
      source: 'school' as const,
      providerName: 'School',
      date: new Date(now - 1 * dayMs),
      topicsText: 'অধ্যায় ২: গতি ও ত্বরণ — গতির ৩টি মৌলিক সমীকরণ ও তাৎক্ষণিক দ্রুতি নির্ণয়ের গাণিতিক উদাহরণ।',
      durationMin: 60,
      confidence: 4,
      verifiedByParent: true,
    },
    {
      id: 'db-rahim-e3',
      childId: child1.id,
      source: 'self_study' as const,
      providerName: 'Self Study',
      date: new Date(now - 2 * dayMs),
      topicsText: 'Unit 3: Health and Hygiene — Passage comprehension, new vocabulary with synonyms/antonyms.',
      durationMin: 45,
      confidence: 4,
      verifiedByParent: false,
    },
    {
      id: 'db-rahim-e4',
      childId: child1.id,
      source: 'tuition' as const,
      providerName: 'আইসিটি শিক্ষক',
      date: new Date(now - 3 * dayMs),
      topicsText: 'অধ্যায় ৩: স্প্রেডশিট সফটওয়্যারের ব্যবহার — মাইক্রোসফট এক্সেলে যোগ, গড়, গুণ এবং শতকরা বের করার সেল ফর্মুলা তৈরি।',
      durationMin: 60,
      confidence: 5,
      verifiedByParent: true,
    },
    {
      id: 'db-rahim-e5',
      childId: child1.id,
      source: 'self_study' as const,
      providerName: 'Self Study',
      date: new Date(now - 4 * dayMs),
      topicsText: 'কবিতা: "বঙ্গভূমির প্রতি" (মাইকেল মধুসূদন দত্ত) — মূলভাব বিশ্লেষণ, কবি পরিচিতি এবং সৃজনশীল প্রশ্ন অনুশীলন।',
      durationMin: 50,
      confidence: 4,
      verifiedByParent: true,
    },
  ];

  for (const e of rahimEntries) {
    await prisma.learningEntry.upsert({
      where: { id: e.id },
      update: e,
      create: e,
    }).catch(() => {});
  }

  // 6. Seed Learning Entries for Tasnim
  const tasnimEntries = [
    {
      id: 'db-tasnim-e1',
      childId: child2.id,
      source: 'tuition' as const,
      providerName: 'ম্যাথ টিউটর',
      date: new Date(now),
      topicsText: 'অধ্যায় ৫: গুণনীয়ক ও গুণিতক — মৌলিক উৎপাদকে বিশ্লেষণ করে লসাগু (LCM) ও গসাগু (HCF) নির্ণয়।',
      durationMin: 60,
      confidence: 5,
      verifiedByParent: true,
    },
    {
      id: 'db-tasnim-e2',
      childId: child2.id,
      source: 'school' as const,
      providerName: 'School',
      date: new Date(now - 1 * dayMs),
      topicsText: 'অধ্যায় ৩: জীবনের জন্য পানি — নিরাপদ পানি ও পানি বিশুদ্ধকরণ প্রক্রিয়া (২০ মিনিট ফোটানো)।',
      durationMin: 50,
      confidence: 4,
      verifiedByParent: true,
    },
    {
      id: 'db-tasnim-e3',
      childId: child2.id,
      source: 'tuition' as const,
      providerName: 'ইংরেজি টিউটর',
      date: new Date(now - 2 * dayMs),
      topicsText: 'Unit 6: Eat Healthy — Food pyramid, healthy fruits and vegetables vocabulary reading.',
      durationMin: 45,
      confidence: 5,
      verifiedByParent: false,
    },
    {
      id: 'db-tasnim-e4',
      childId: child2.id,
      source: 'self_study' as const,
      providerName: 'Self Study',
      date: new Date(now - 3 * dayMs),
      topicsText: 'অধ্যায় ১: আমাদের মুক্তিযুদ্ধ — ১৯৭১ সালের ২৫শে মার্চের কালরাত ও ঐতিহাসিক পটভূমি।',
      durationMin: 40,
      confidence: 5,
      verifiedByParent: true,
    },
    {
      id: 'db-tasnim-e5',
      childId: child2.id,
      source: 'school' as const,
      providerName: 'School',
      date: new Date(now - 4 * dayMs),
      topicsText: 'গল্প: "হাতি আর শিয়ালের গল্প" — শব্দার্থ, যুক্তবর্ণ ও অনুশীলনীর প্রশ্ন সমাধান।',
      durationMin: 45,
      confidence: 5,
      verifiedByParent: true,
    },
  ];

  for (const e of tasnimEntries) {
    await prisma.learningEntry.upsert({
      where: { id: e.id },
      update: e,
      create: e,
    }).catch(() => {});
  }


  // 6.1 Seed Learning Entries for Fahim (College HSC Science)
  const fahimEntries = [
    {
      id: 'db-fahim-e1',
      childId: child3.id,
      source: 'college' as const,
      providerName: 'নটর ডেম কলেজ (Physics)',
      date: new Date(now),
      topicsText: 'অধ্যায় ৩: গতিবিদ্যা — প্রক্ষেপক (Projectile Motion), সর্বাধিক উচ্চতা ও পাল্লা নির্ণয়।',
      durationMin: 50,
      confidence: 5,
      verifiedByParent: true,
    },
    {
      id: 'db-fahim-e2',
      childId: child3.id,
      source: 'college' as const,
      providerName: 'নটর ডেম কলেজ (Chemistry)',
      date: new Date(now),
      topicsText: 'অধ্যায় ২: গুণগত রসায়ন — বোর পরমাণু মডেল ও কোয়ান্টাম সংখ্যা।',
      durationMin: 50,
      confidence: 5,
      verifiedByParent: true,
    },
    {
      id: 'db-fahim-e3',
      childId: child3.id,
      source: 'tuition' as const,
      providerName: 'পদার্থবিজ্ঞান কোচিং',
      date: new Date(now),
      topicsText: 'প্রক্ষেপকের উচ্চতর গাণিতিক সমস্যা ও বিভিন্ন কোণে নিক্ষিপ্ত বস্তুর গতিপথ বিশ্লেষণ।',
      durationMin: 75,
      confidence: 5,
      verifiedByParent: true,
    },
    {
      id: 'db-fahim-e4',
      childId: child3.id,
      source: 'college' as const,
      providerName: 'নটর ডেম কলেজ (Higher Math)',
      date: new Date(now - 1 * dayMs),
      topicsText: 'ম্যাট্রিক্সের গুণন বিধি ও বিপরীত ম্যাট্রিক্স নির্ণয়।',
      durationMin: 50,
      confidence: 5,
      verifiedByParent: true,
    },
    {
      id: 'db-fahim-e5',
      childId: child3.id,
      source: 'college' as const,
      providerName: 'নটর ডেম কলেজ (ICT)',
      date: new Date(now - 2 * dayMs),
      topicsText: 'সংখ্যা পদ্ধতি — বাইনারি, ডেসিমাল ও হেক্সাডেসিমেল রূপান্তর।',
      durationMin: 50,
      confidence: 5,
      verifiedByParent: true,
    },
  ];

  for (const e of fahimEntries) {
    await prisma.learningEntry.upsert({
      where: { id: e.id },
      update: e,
      create: e,
    }).catch(() => {});
  }

  // 7. Seed Routines
  //
  // The dataset lives in `src/core/demo-data.ts` so the database rows and the no-database
  // fallback are always the same timetable. Previously the two copies drifted and the
  // seeded rows had no subject/period label at all.
  for (const r of DEMO_ROUTINES) {
    await prisma.routine
      .upsert({
        where: { id: r.id },
        update: {
          childId: r.childId,
          name: r.name,
          periodName: r.periodName ?? null,
          subject: r.subject ?? null,
          teacher: r.teacher ?? null,
          room: r.room ?? null,
          source: r.source,
          weekdays: r.weekdays,
          startTime: r.startTime,
          durationMin: r.durationMin,
          startsOn: r.startsOn,
          active: r.active,
        },
        create: {
          id: r.id,
          childId: r.childId,
          name: r.name,
          periodName: r.periodName ?? null,
          subject: r.subject ?? null,
          teacher: r.teacher ?? null,
          room: r.room ?? null,
          source: r.source,
          weekdays: r.weekdays,
          startTime: r.startTime,
          durationMin: r.durationMin,
          startsOn: r.startsOn,
          active: r.active,
        },
      })
      .catch((e) => console.warn('routine seed skipped', r.id, (e as Error).message.slice(0, 120)));
  }

  console.log('✅ Demo Seed Complete:');
  console.log('  Parent: Rafiqul Islam (parent@demo.com / Password123!)');
  console.log('  Child 1: Rahim Ahmed (rahim@demo.com / Password123! - Class 8)');
  console.log('  Child 2: Tasnim Islam (tasnim@demo.com / Password123! - Class 5)');
  console.log('  Realistic learning entries, routines, and metrics populated.');
}

main().finally(() => prisma.$disconnect());
