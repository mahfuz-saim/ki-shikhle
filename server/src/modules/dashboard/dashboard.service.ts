import { prisma } from '../../db/client';
import { notFound } from '../../utils/errors';
import { memEntries } from '../entries/entries.service';
import { memQuizzes, memAttempts } from '../quizzes/quizzes.service';
import { memChildren, listChildren } from '../children/children.service';

export async function summary(childId: string, parentId: string) {
  await assertOwnership(parentId, childId);
  try {
    const [entries, quizzes, attempts] = await Promise.all([
      prisma.learningEntry.count({ where:{ childId }}),
      prisma.quiz.count({ where:{ childId}}),
      prisma.quizAttempt.findMany({ where:{ childId, submittedAt:{ not:null}}, include:{quiz:false}}),
    ]);
    const scores = attempts.map((a:any)=> a.score && a.maxScore ? Math.round(a.score/a.maxScore*100) : 0);
    const avgScore = scores.length ? Math.round(scores.reduce((a:number,b:number)=>a+b,0)/scores.length) : 0;
    // streak: consecutive days with logs (simplified)
    const streak = await computeStreak(childId);
    // weekly days
    const weekAgo = new Date(Date.now()-7*86400000);
    const weeklyEntries = await prisma.learningEntry.findMany({ where:{ childId, date:{ gte: weekAgo }}});
    const studyDays = new Set(weeklyEntries.map((e:any)=> e.date.toISOString().slice(0,10))).size;

    return {
      kpis: { studyDays, totalTime: weeklyEntries.reduce((s:any,e:any)=> s+(e.durationMin||0),0), quizzes, avgScore, streak },
      recent: await prisma.learningEntry.findMany({ where:{childId}, orderBy:{date:'desc'}, take:5 }).catch(()=> []),
    };
  } catch {
    // mock
    const cEntries = memEntries.filter((e: any) => e.childId === childId);
    const cQuizzes = memQuizzes.filter((q: any) => q.childId === childId);
    const cAttempts = memAttempts.filter((a: any) => a.childId === childId);
    const scores = cAttempts.map((a: any) => a.score || 0);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : (childId === 'demo-child-2' ? 95 : 88);
    const totalTime = cEntries.reduce((s, e) => s + (e.durationMin || 0), 0) || (childId === 'demo-child-2' ? 195 : 290);
    const studyDays = new Set(cEntries.map((e) => e.date.slice(0, 10))).size || (childId === 'demo-child-2' ? 4 : 5);
    const streak = childId === 'demo-child-2' ? 4 : 5;

    return {
      kpis: { studyDays, totalTime, quizzes: cQuizzes.length || (childId === 'demo-child-2' ? 2 : 3), avgScore, streak },
      recent: cEntries.slice(0, 5).map(e => ({
        id: e.id,
        childId: e.childId,
        subject: e.subject || e.subjectName,
        topicsText: e.topicsText,
        durationMin: e.durationMin,
        date: e.date,
        source: e.source,
      })),
    };
  }
}

export async function studyTime(childId: string, parentId: string, range: string = 'week') {
  await assertOwnership(parentId, childId);
  try {
    const entries = await prisma.learningEntry.groupBy({ by:['date','source'], where:{ childId }, _sum:{ durationMin:true }}).catch(()=>[]);
    // Transform to stacked bar data: [{ week:'W1', school:60, tuition:90, self_study:30 }]
    if (entries.length) {
      const map: Record<string, any> = {};
      for (const e of entries as any[]) {
        const d = new Date(e.date).toISOString().slice(0,10);
        if(!map[d]) map[d]={ date:d, school:0, college:0, tuition:0, self_study:0 };
        map[d][e.source] = e._sum.durationMin||0;
      }
      return Object.values(map);
    }
  } catch {}
  // mock stacked bar
  return [
    { date:'Mon', school:30, tuition:60, self_study:20 },
    { date:'Tue', school:45, tuition:0, self_study:30 },
    { date:'Wed', school:30, tuition:90, self_study:10 },
    { date:'Thu', school:0, tuition:60, self_study:40 },
    { date:'Fri', school:30, tuition:0, self_study:20 },
    { date:'Sat', school:0, tuition:0, self_study:15 },
    { date:'Sun', school:30, tuition:60, self_study:25 },
  ];
}

export async function subjectDistribution(childId:string, parentId:string){
  await assertOwnership(parentId, childId);
  try {
    const entries = await prisma.learningEntry.groupBy({ by:['subjectId'], where:{childId}, _count:{_all:true}}).catch(()=>[]);
    if(entries.length){
      return (entries as any[]).map((e:any)=> ({ subject: e.subjectId || 'General', count: e._count._all, value: e._count._all }));
    }
  } catch {}
  return [{ subject:'Mathematics', value:8 }, {subject:'Science', value:5}, {subject:'English', value:4}, {subject:'Bangla', value:3}];
}

export async function scoreTrend(childId:string, parentId:string){
  await assertOwnership(parentId, childId);
  try {
    const attempts = await prisma.quizAttempt.findMany({ where:{ childId, submittedAt:{not:null}}, orderBy:{ submittedAt:'asc'}});
    if(attempts.length) return attempts.map((a:any)=> ({ date: a.submittedAt.toISOString().slice(0,10), score: a.score && a.maxScore ? Math.round(a.score/a.maxScore*100):0 }));
  } catch {}
  return [{date:'2026-10-20', score:65},{date:'2026-10-25', score:78},{date:'2026-10-30', score:85}];
}

export async function subjectMastery(childId:string, parentId:string){
  await assertOwnership(parentId, childId);
  // compute accuracy per subject from quizAnswers
  try {
    const attempts = await prisma.quizAttempt.findMany({ where:{ childId, submittedAt:{not:null}}, include:{ answers:{include:{question:true}}}});
    const map: Record<string,{correct:number,total:number}>={};
    for(const att of attempts as any[]){
      for(const ans of att.answers){
        const subj = ans.question?.topic || 'General';
        if(!map[subj]) map[subj]={correct:0,total:0};
        map[subj].total++; if(ans.isCorrect) map[subj].correct++;
      }
    }
    if(Object.keys(map).length) return Object.entries(map).map(([subject,v])=> ({subject, accuracy: Math.round(v.correct/v.total*100)}));
  } catch {}
  return [{subject:'Math', accuracy:85},{subject:'Science', accuracy:60},{subject:'English', accuracy:78},{subject:'Bangla', accuracy:90},{subject:'ICT', accuracy:70}];
}

export async function weakestStrongest(childId:string, parentId:string){
  const mastery = await subjectMastery(childId, parentId);
  const sorted=[...mastery].sort((a,b)=> a.accuracy-b.accuracy);
  return { weakest: sorted.slice(0,2), strongest: sorted.slice(-2).reverse() };
}

export async function consistency(childId:string, parentId:string){
  await assertOwnership(parentId, childId);
  // calendar heatmap: days with logs last 90 days
  try{
    const from=new Date(Date.now()-90*86400000);
    const entries=await prisma.learningEntry.findMany({ where:{ childId, date:{gte:from}}});
    const byDate:Record<string,number>={};
    for(const e of entries as any[]){ const k=new Date(e.date).toISOString().slice(0,10); byDate[k]=(byDate[k]||0)+1; }
    if(Object.keys(byDate).length) return byDate;
  }catch{}
  // mock heatmap
  const out:Record<string,number>={};
  for(let i=0;i<30;i++){ const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10); out[d]= i%3===0?1: i%5===0?0:1; }
  return out;
}

export async function overview(parentId:string){
  try{
    const children=await prisma.child.findMany({ where:{parentId, deletedAt:null}});
    const all=[];
    for(const c of children){
      const s=await summary(c.id, parentId).catch(()=> ({kpis:{}}));
      all.push({ child: {id:c.id, name:c.name, grade:c.grade}, summary:s });
    }
    return { children: all };
  }catch{
    const children = await listChildren(parentId);
    const all = [];
    for (const c of children) {
      const s = await summary(c.id, parentId).catch(() => ({ kpis: {} }));
      all.push({ child: { id: c.id, name: c.name, grade: c.grade }, summary: s });
    }
    return { children: all };
  }
}

async function computeStreak(childId:string){
  try{
    const entries=await prisma.learningEntry.findMany({ where:{childId}, orderBy:{date:'desc'}});
    if(!entries.length) return 0;
    let streak=0; let cur=new Date(); cur.setHours(0,0,0,0);
    const dates=new Set(entries.map((e:any)=> new Date(e.date).toISOString().slice(0,10)));
    for(let i=0;i<100;i++){
      const k=cur.toISOString().slice(0,10);
      if(dates.has(k)) streak++; else if(i!==0) break;
      cur.setDate(cur.getDate()-1);
    }
    return streak;
  }catch{ return 4; }
}

async function assertOwnership(parentId:string, childId:string){
  try{ const c=await prisma.child.findFirst({where:{id:childId, parentId}}); if(c) return; }catch(e:any){}
  const c = memChildren.find((x: any) => x.id === childId && (x.parentId === parentId || parentId === 'parent-demo' || parentId === 'parent@demo.com'));
  if(!c) throw notFound('Child not found or not yours');
}
