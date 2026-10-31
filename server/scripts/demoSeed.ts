import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/services/password';
const prisma = new PrismaClient();

async function main(){
  console.log('🌱 Demo seed...');
  const pw = await hashPassword('DemoPass1');
  const parent = await prisma.user.upsert({
    where:{ email:'parent@demo.com'},
    update:{},
    create:{ name:'Demo Parent', email:'parent@demo.com', passwordHash: pw, language:'en', trialEndsAt: new Date(Date.now()+15*86400000)}
  });
  const plan = await prisma.plan.findUnique({where:{code:'trial'}});
  if(plan){
    await prisma.subscription.upsert({ where:{ id: parent.id+'-sub'}, update:{}, create:{ id: parent.id+'-sub', userId: parent.id, planId: plan.id, status:'trialing', childSlots:2, currentPeriodEnd: new Date(Date.now()+15*86400000)}});
  }
  const child = await prisma.child.upsert({
    where:{ id: 'demo-child-1'},
    update:{},
    create:{ id:'demo-child-1', parentId: parent.id, name:'Rahim', nickname:'Rah', grade:'6', curriculum:'NCTB', medium:'Bangla'}
  });
  const subject = await prisma.subject.findFirst();
  if(subject){
    for(let i=0;i<5;i++){
      await prisma.learningEntry.create({ data:{ childId: child.id, subjectId: subject.id, source:'tuition', date: new Date(Date.now()-i*86400000), topicsText: `Topic ${i+1}: Quadratic & Photosynthesis`, durationMin:60, confidence:4 }});
    }
    await prisma.quiz.create({ data:{ childId: child.id, createdBy: parent.id, title:'Demo Quiz - Last 7 days', scopeJson:{scope:'last7'}, settingsJson:{numQuestions:10}, status:'assigned', timeLimitMin:15}});
  }
  console.log('✅ Demo data inserted: parent@demo.com / DemoPass1, child Rahim');
}
main().finally(()=> prisma.$disconnect());
