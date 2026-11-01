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
    update: { email: 'rahim@demo.com', passwordHash: pw },
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
    update: { email: 'tasnim@demo.com', passwordHash: pw },
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

  console.log('✅ Demo Seed Complete:');
  console.log('  Parent: Rafiqul Islam (parent@demo.com / Password123!)');
  console.log('  Child 1: Rahim Ahmed (rahim@demo.com / Password123! - Class 8)');
  console.log('  Child 2: Tasnim Islam (tasnim@demo.com / Password123! - Class 5)');
}

main().finally(() => prisma.$disconnect());
