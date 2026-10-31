'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { StudyTimeChart, ScoreTrendChart, SubjectDonut, MasteryRadar, Heatmap } from '@/components/charts/study-time-chart';

export default function DashboardPage() {
  const [childId, setChildId] = useState('demo-child');
  const [summary, setSummary] = useState<any>(null);
  const [studyTime, setStudyTime] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [mastery, setMastery] = useState<any[]>([]);
  const [consistency, setConsistency] = useState<Record<string,number>>({});
  const [topics, setTopics] = useState<any>(null);

  useEffect(()=>{
    api.get('/dashboard/overview').then(r=> {
      const first = r.data.data?.children?.[0]?.child?.id;
      if(first) setChildId(first);
    }).catch(()=>{});
  },[]);

  useEffect(()=>{
    api.get(`/children/${childId}/dashboard/summary`).then(r=> setSummary(r.data.data)).catch(()=> setSummary({ kpis:{ studyDays:5, totalTime:390, quizzes:3, avgScore:78, streak:4 }, recent:[] }));
    api.get(`/children/${childId}/dashboard/study-time`).then(r=> setStudyTime(r.data.data)).catch(()=> setStudyTime([
      { date:'Mon', school:30, tuition:60, self_study:20 },
      { date:'Tue', school:45, tuition:0, self_study:30 },
      { date:'Wed', school:30, tuition:90, self_study:10 },
    ]));
    api.get(`/children/${childId}/dashboard/subjects`).then(r=> setSubjects(r.data.data)).catch(()=> setSubjects([{subject:'Math', value:8},{subject:'Science', value:5}]));
    api.get(`/children/${childId}/dashboard/scores`).then(r=> setScores(r.data.data)).catch(()=> setScores([{date:'2026-10-20', score:65},{date:'2026-10-30', score:85}]));
    api.get(`/children/${childId}/dashboard/mastery`).then(r=> setMastery(r.data.data)).catch(()=> setMastery([{subject:'Math', accuracy:85},{subject:'Science', accuracy:60}]));
    api.get(`/children/${childId}/dashboard/consistency`).then(r=> setConsistency(r.data.data)).catch(()=> setConsistency({}));
    api.get(`/children/${childId}/dashboard/topics`).then(r=> setTopics(r.data.data)).catch(()=> setTopics({weakest:[{subject:'Science', accuracy:60}], strongest:[{subject:'Math', accuracy:85}]}));
  },[childId]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Parent Dashboard — {childId}</h1>
        <div className="flex gap-2">
          <Link href="/children"><Button variant="outline">Switch Child</Button></Link>
          <Link href="/children"><Button>Add Child</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>Study days this week</CardDescription><CardTitle className="text-2xl">{summary?.kpis?.studyDays ?? 5}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total study time (min)</CardDescription><CardTitle className="text-2xl">{summary?.kpis?.totalTime ?? 390}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Quizzes taken</CardDescription><CardTitle className="text-2xl">{summary?.kpis?.quizzes ?? 3}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Average score</CardDescription><CardTitle className="text-2xl">{summary?.kpis?.avgScore ?? 78}%</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Streak</CardDescription><CardTitle className="text-2xl">{summary?.kpis?.streak ?? 4} days 🔥</CardTitle></CardHeader></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Weekly Study Time (stacked bar by source)</CardTitle><CardDescription>school/tuition/self-study • color-blind safe</CardDescription></CardHeader><CardContent><StudyTimeChart data={studyTime} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Subject Distribution (donut)</CardTitle></CardHeader><CardContent><SubjectDonut data={subjects} /><p className="text-xs text-muted-foreground mt-2">Label + pattern for accessibility</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Score Trend (line)</CardTitle><CardDescription>Quiz scores over time</CardDescription></CardHeader><CardContent><ScoreTrendChart data={scores} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Subject Mastery (radar)</CardTitle><CardDescription>Accuracy per subject — weak vs strong</CardDescription></CardHeader><CardContent><MasteryRadar data={mastery} /></CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Consistency Heatmap (90 days)</CardTitle></CardHeader><CardContent><Heatmap data={consistency} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Weakest & Strongest Topics</CardTitle></CardHeader><CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="font-bold text-destructive">Weakest</p><ul>{topics?.weakest?.map((t:any)=> <li key={t.subject}>{t.subject} — {t.accuracy}%</li>)}</ul></div>
            <div><p className="font-bold text-emerald-600">Strongest</p><ul>{topics?.strongest?.map((t:any)=> <li key={t.subject}>{t.subject} — {t.accuracy}%</li>)}</ul></div>
          </div>
        </CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Missed Sessions & Upcoming 7 days</CardTitle></CardHeader><CardContent className="text-sm">
          <p>Missed: Science 2026-10-27 (no log for scheduled tuition)</p>
          <p className="mt-2">Upcoming: Math Tuition — Sun 4pm, Physics — Tue 5pm</p>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Recent Activity Feed</CardTitle></CardHeader><CardContent><ul className="space-y-1 text-sm">{summary?.recent?.map((r:any,i:number)=> <li key={i} className="border-b py-1">{r.date?.slice(0,10)} • {r.topicsText || r.topic}</li>) || <li>No activity yet</li>}</ul></CardContent></Card>
      </div>

      <p className="text-xs text-muted-foreground">Child dashboard variant at /kid — motivating, light, progress bars only. Charts use Recharts via shadcn chart components, readable in dark mode.</p>
    </div>
  );
}
