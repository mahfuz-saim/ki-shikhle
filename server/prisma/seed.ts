import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding plans...');
  const plans = [
    { code: 'free', name: 'Free (ফ্রি)', priceBdt: 0, priceUsd: 0, limitsJson: { maxChildren: 1, aiQuizzesPerMonth: 2, aiVisionOCR: true, historyMonths: 1, aiExplanation: false, autoQuizScheduling: false }, active: true },
    { code: 'basic', name: 'Basic (বেসিক)', priceBdt: 249, priceUsd: 2.99, limitsJson: { maxChildren: 1, aiQuizzesPerMonth: 10, aiVisionOCR: true, historyMonths: 6, aiExplanation: true, autoQuizScheduling: false }, active: true },
    { code: 'premium', name: 'Premium (প্রিমিয়াম)', priceBdt: 599, priceUsd: 6.99, limitsJson: { maxChildren: 2, aiQuizzesPerMonth: 50, aiVisionOCR: true, historyMonths: null, aiExplanation: true, autoQuizScheduling: true }, active: true },
    { code: 'pro', name: 'Pro Family (প্রো ফ্যামিলি)', priceBdt: 999, priceUsd: 11.99, limitsJson: { maxChildren: 5, aiQuizzesPerMonth: 150, aiVisionOCR: true, historyMonths: null, aiExplanation: true, autoQuizScheduling: true }, active: true },
    { code: 'trial', name: 'Trial', priceBdt: 0, priceUsd: 0, limitsJson: { maxChildren: 2, aiQuizzesPerMonth: 40, aiVisionOCR: false, historyMonths: 12, aiExplanation: true, autoQuizScheduling: false }, active: true },
    { code: 'starter', name: 'Starter', priceBdt: 149, priceUsd: 2, limitsJson: { maxChildren: 3, aiQuizzesPerMonth: 10, aiVisionOCR: false, historyMonths: 3, aiExplanation: false, autoQuizScheduling: false }, active: true },
    { code: 'standard', name: 'Standard', priceBdt: 299, priceUsd: 4, limitsJson: { maxChildren: 5, aiQuizzesPerMonth: 40, aiVisionOCR: false, historyMonths: 12, aiExplanation: true, autoQuizScheduling: false }, active: true },
  ];
  for (const p of plans) await prisma.plan.upsert({ where: { code: p.code }, update: p, create: p });

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
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  const demoUser = await prisma.user.upsert({
    where: { email: 'parent@demo.com' },
    update: {
      trialEndsAt: null,
    },
    create: {
      id: 'parent-demo',
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
    { id: 'demo-child-1', parentId: demoUser.id, name: 'Rahim Ahmed', nickname: 'Rahim', grade: 'Class 8', curriculum: 'NCTB', medium: 'Bangla', avatar: '/avatars/boy-1.png' },
    { id: 'demo-child-2', parentId: demoUser.id, name: 'Tasnim Islam', nickname: 'Tasnim', grade: 'Class 5', curriculum: 'NCTB', medium: 'Bangla', avatar: '/avatars/girl-1.png' },
    { id: 'demo-child-3', parentId: demoUser.id, name: 'Fahim Islam', nickname: 'Fahim', grade: 'Class 11', curriculum: 'NCTB', medium: 'Bangla', avatar: '/avatars/boy-2.png' },
  ];
  for (const c of childrenData) {
    await prisma.child.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    });
  }

  console.log('Seed done');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
