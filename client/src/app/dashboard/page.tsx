'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/dashboard/overview').then(r => setSummary(r.data.data)).catch(e => setError(e.response?.data?.error?.message || 'Failed to load - showing demo data'));
  }, []);
  const demo = {
    kpis: { studyDays: 5, totalTime: '6h 30m', quizzes: 3, avgScore: 78, streak: 4 },
    recent: [{ child: 'Rahim', subject: 'Math', topic: 'Quadratic Equations', date: '2026-10-30' }, { child: 'Rahim', subject: 'Science', topic: 'Photosynthesis', date: '2026-10-29' }],
  };
  const data = summary || demo as any;
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Parent Dashboard</h1>
        <Link href="/children"><Button>Add Child</Button></Link>
      </div>
      {error && <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">{error} — demo data shown</p>}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>Study days (week)</CardDescription><CardTitle className="text-2xl">{data.kpis?.studyDays ?? 5}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total study time</CardDescription><CardTitle className="text-2xl">{data.kpis?.totalTime ?? '6h 30m'}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Quizzes taken</CardDescription><CardTitle className="text-2xl">{data.kpis?.quizzes ?? 3}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Average score</CardDescription><CardTitle className="text-2xl">{data.kpis?.avgScore ?? 78}%</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Streak</CardDescription><CardTitle className="text-2xl">{data.kpis?.streak ?? 4} days 🔥</CardTitle></CardHeader></Card>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Weekly Study Time (stacked bar)</CardTitle><CardDescription>By source: school / tuition / self-study</CardDescription></CardHeader><CardContent><div className="h-48 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">Recharts stacked bar — connect API for live data</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Score Trend (line)</CardTitle><CardDescription>Quiz scores over time</CardDescription></CardHeader><CardContent><div className="h-48 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">Recharts line chart</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Subject Mastery (radar)</CardTitle></CardHeader><CardContent><div className="h-48 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">Radar / horizontal bar</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Consistency Heatmap</CardTitle></CardHeader><CardContent><div className="h-48 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">Calendar heatmap</div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader><CardContent><ul className="space-y-2">{(data.recent || demo.recent).map((r: any, i: number) => <li key={i} className="flex justify-between border-b py-2 text-sm"><span>{r.child} • {r.subject}: {r.topic}</span><span className="text-muted-foreground">{r.date}</span></li>)}</ul></CardContent></Card>
      <Card><CardHeader><CardTitle>Missed Sessions & Upcoming (next 7 days)</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">No missed sessions 🎉 • Next: Math Tuition — Sun 4pm</CardContent></Card>
    </div>
  );
}
