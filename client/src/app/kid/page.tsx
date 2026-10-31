'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function KidDashboard(){
  const [summary, setSummary]=useState<any>(null);
  useEffect(()=>{
    const childId = localStorage.getItem('activeChild') || 'demo-child';
    api.get(`/children/${childId}/dashboard/summary`).then(r=> setSummary(r.data.data)).catch(()=> setSummary({kpis:{streak:3}}));
  },[]);
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">👋 Hi! Let&apos;s learn today</h1>
      <div className="grid grid-cols-2 gap-4 text-center">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Streak</p><p className="text-2xl">{summary?.kpis?.streak || 3} 🔥</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Quizzes</p><p className="text-2xl">{summary?.kpis?.quizzes || 2} 🧠</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Today&apos;s Schedule</CardTitle></CardHeader><CardContent><p className="text-sm">Math Tuition 4pm — tap to quick-log (only topic needed)</p><Link href="/kid/log"><Button className="mt-2 w-full">📝 Quick Log Today</Button></Link></CardContent></Card>
      <Card><CardHeader><CardTitle>My Progress</CardTitle></CardHeader><CardContent><div className="space-y-2"><div><p className="text-sm">Math — 80%</p><div className="h-2 bg-secondary rounded"><div className="h-2 bg-primary rounded" style={{width:'80%'}}></div></div></div><div><p className="text-sm">Science — 60%</p><div className="h-2 bg-secondary rounded"><div className="h-2 bg-amber-500 rounded" style={{width:'60%'}}></div></div></div></div></CardContent></Card>
      <div className="flex gap-3">
        <Link href="/kid/quiz/demo-quiz" className="flex-1"><Button variant="outline" className="w-full">🧠 Take Quiz</Button></Link>
        <Link href="/kid/notes" className="flex-1"><Button variant="outline" className="w-full">📸 Upload Notes</Button></Link>
      </div>
      <p className="text-xs text-muted-foreground">No red fail screens — low scores: &quot;let&apos;s practice&quot; 🌟</p>
    </div>
  );
}
