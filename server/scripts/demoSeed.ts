import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/services/password';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Demo seed starting...');
  const pw = await hashPassword('Password123!');

  // 1. Parent Account
  const parent = await prisma.user.upsert({
    where: { email: 'parent@demo.com' },
    update: { name: 'Rafiqul Islam', passwordHash: pw },
    create: {
      name: 'Rafiqul Islam',
      email: 'parent@demo.com',
      passwordHash: pw,
      role: 'parent',
      language: 'en',
      country: 'BD',
      timezone: 'Asia/Dhaka',
      trialEndsAt: new Date(Date.now() + 15 * 86400000),
    },
  });

  // 2. Subscription
  const plan = await prisma.plan.findUnique({ where: { code: 'trial' } });
  if (plan) {
    await prisma.subscription.upsert({
      where: { id: parent.id + '-sub' },
      update: {},
      create: {
        id: parent.id + '-sub',
        userId: parent.id,
        planId: plan.id,
        status: 'trialing',
        childSlots: 5,
        currentPeriodEnd: new Date(Date.now() + 15 * 86400000),
      },
    });
  }

  // 3. Child 1: Rahim Ahmed (Class 8)
  const child1 = await prisma.child.upsert({
    where: { id: 'demo-child-1' },
    update: { email: 'rahim@demo.com', passwordHash: pw, parentId: parent.id },
    create: {
      id: 'demo-child-1',
      parentId: parent.id,
      name: 'Rahim Ahmed',
      nickname: 'Rahim',
      email: 'rahim@demo.com',
      passwordHash: pw,
      grade: 'Class 8',
      curriculum: 'NCTB',
      medium: 'Bangla',
    },
  });

  // 4. Child 2: Tasnim Islam (Class 5)
  const child2 = await prisma.child.upsert({
    where: { id: 'demo-child-2' },
    update: { email: 'tasnim@demo.com', passwordHash: pw, parentId: parent.id },
    create: {
      id: 'demo-child-2',
      parentId: parent.id,
      name: 'Tasnim Islam',
      nickname: 'Tasnim',
      email: 'tasnim@demo.com',
      passwordHash: pw,
      grade: 'Class 5',
      curriculum: 'NCTB',
      medium: 'Bangla',
    },
  });


  // 4.1 Child 3: Fahim Islam (Class 11 - College)
  const child3 = await prisma.child.upsert({
    where: { id: 'demo-child-3' },
    update: { email: 'fahim@demo.com', passwordHash: pw, parentId: parent.id },
    create: {
      id: 'demo-child-3',
      parentId: parent.id,
      name: 'Fahim Islam',
      nickname: 'Fahim',
      email: 'fahim@demo.com',
      passwordHash: pw,
      grade: 'Class 11',
      curriculum: 'NCTB',
      medium: 'Bangla',
    },
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
  await prisma.routine.upsert({
    where: { id: 'routine-rahim-1' },
    update: {},
    create: {
      id: 'routine-rahim-1',
      childId: child1.id,
      name: 'গণিত প্রাইভেট — রহিম স্যার',
      source: 'tuition',
      weekdays: [0, 2, 5],
      startTime: '16:00',
      durationMin: 90,
      startsOn: new Date(now - 30 * dayMs),
      active: true,
    },
  }).catch(() => {});

  await prisma.routine.upsert({
    where: { id: 'routine-rahim-2' },
    update: {},
    create: {
      id: 'routine-rahim-2',
      childId: child1.id,
      name: 'পদার্থবিজ্ঞান কোচিং',
      source: 'tuition',
      weekdays: [1, 3],
      startTime: '17:30',
      durationMin: 60,
      startsOn: new Date(now - 30 * dayMs),
      active: true,
    },
  }).catch(() => {});

  await prisma.routine.upsert({
    where: { id: 'routine-tasnim-1' },
    update: {},
    create: {
      id: 'routine-tasnim-1',
      childId: child2.id,
      name: 'প্রাথমিক গণিত প্রাইভেট',
      source: 'tuition',
      weekdays: [0, 2, 4],
      startTime: '16:00',
      durationMin: 60,
      startsOn: new Date(now - 30 * dayMs),
      active: true,
    },
  }).catch(() => {});


  await prisma.routine.upsert({
    where: { id: 'routine-fahim-c1' },
    update: {},
    create: {
      id: 'routine-fahim-c1',
      childId: child3.id,
      name: '১ম পিরিয়ড: পদার্থবিজ্ঞান ১ম পত্র',
      source: 'college',
      weekdays: [0, 1, 2, 3, 4],
      startTime: '08:30',
      durationMin: 50,
      startsOn: new Date(now - 30 * dayMs),
      active: true,
    },
  }).catch(() => {});

  await prisma.routine.upsert({
    where: { id: 'routine-fahim-c2' },
    update: {},
    create: {
      id: 'routine-fahim-c2',
      childId: child3.id,
      name: '২য় পিরিয়ড: রসায়ন ১ম পত্র',
      source: 'college',
      weekdays: [0, 1, 2, 3, 4],
      startTime: '09:20',
      durationMin: 50,
      startsOn: new Date(now - 30 * dayMs),
      active: true,
    },
  }).catch(() => {});

  await prisma.routine.upsert({
    where: { id: 'routine-fahim-t1' },
    update: {},
    create: {
      id: 'routine-fahim-t1',
      childId: child3.id,
      name: 'পদার্থবিজ্ঞান কোচিং — গতিবিদ্যা',
      source: 'tuition',
      weekdays: [0, 2, 4],
      startTime: '16:30',
      durationMin: 75,
      startsOn: new Date(now - 30 * dayMs),
      active: true,
    },
  }).catch(() => {});

  console.log('✅ Demo Seed Complete:');
  console.log('  Parent: Rafiqul Islam (parent@demo.com / Password123!)');
  console.log('  Child 1: Rahim Ahmed (rahim@demo.com / Password123! - Class 8)');
  console.log('  Child 2: Tasnim Islam (tasnim@demo.com / Password123! - Class 5)');
  console.log('  Realistic learning entries, routines, and metrics populated.');
}

main().finally(() => prisma.$disconnect());
