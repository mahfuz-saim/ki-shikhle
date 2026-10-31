import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding plans...');
  const plans = [
    { code: 'trial', name: 'Trial', priceBdt: 0, priceUsd: 0, limitsJson: { maxChildren: 2, aiQuizzesPerMonth: 40, aiVisionOCR: false, historyMonths: 12, aiExplanation: true }, active: true },
    { code: 'starter', name: 'Starter', priceBdt: 149, priceUsd: 2, limitsJson: { maxChildren: 3, aiQuizzesPerMonth: 10, aiVisionOCR: false, historyMonths: 3, aiExplanation: false }, active: true },
    { code: 'standard', name: 'Standard', priceBdt: 299, priceUsd: 4, limitsJson: { maxChildren: 5, aiQuizzesPerMonth: 40, aiVisionOCR: false, historyMonths: 12, aiExplanation: true }, active: true },
    { code: 'premium', name: 'Premium', priceBdt: 499, priceUsd: 6, limitsJson: { maxChildren: 10, aiQuizzesPerMonth: 120, aiVisionOCR: true, historyMonths: null, aiExplanation: true }, active: true },
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

  console.log('Seed done');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
