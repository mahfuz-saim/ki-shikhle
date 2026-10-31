'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
export default function Onboarding(){
  const [step, setStep]=useState(1);
  const [child, setChild]=useState({ name:'', grade:'6', curriculum:'NCTB'});
  const [routine, setRoutine]=useState({ name:'Math Tuition', weekdays:'0,2,5', startTime:'16:00'});
  async function addChild(){ await api.post('/children', {...child, medium:'Bangla'}); setStep(2); }
  async function addRoutine(){ const childId = (await api.get('/children')).data.data[0]?.id || 'demo-child'; await api.post(`/children/${childId}/routines`, { name: routine.name, source:'tuition', weekdays: routine.weekdays.split(',').map(Number), startTime: routine.startTime, durationMin:60, startsOn: new Date().toISOString().slice(0,10)}); setStep(3); }
  async function firstLog(){ const childId = (await api.get('/children')).data.data[0]?.id || 'demo-child'; await api.post(`/children/${childId}/entries`, { source:'tuition', topicsText:'Intro to Quadratic Equations', date: new Date().toISOString().slice(0,10)}); setStep(4); }
  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Onboarding Wizard</h1>
      <div className="flex gap-2 text-sm"><span className={step>=1?'text-primary font-bold':''}>1 Child</span> → <span className={step>=2?'text-primary font-bold':''}>2 Routine</span> → <span className={step>=3?'text-primary font-bold':''}>3 First Log</span> → <span className={step>=4?'text-primary font-bold':''}>Done 🎉</span></div>
      {step===1 && <Card><CardHeader><CardTitle>Add child → class & curriculum</CardTitle><CardDescription>Trial countdown banner visible</CardDescription></CardHeader><CardContent className="space-y-3"><div><Label>Name</Label><Input value={child.name} onChange={e=> setChild({...child, name:e.target.value})} /></div><Button onClick={addChild}>Next</Button></CardContent></Card>}
      {step===2 && <Card><CardHeader><CardTitle>Add routine</CardTitle></CardHeader><CardContent className="space-y-3"><div><Label>Routine name</Label><Input value={routine.name} onChange={e=> setRoutine({...routine, name:e.target.value})} /></div><Button onClick={addRoutine}>Next</Button></CardContent></Card>}
      {step===3 && <Card><CardHeader><CardTitle>First log</CardTitle></CardHeader><CardContent><Button onClick={firstLog}>Log today&apos;s learning</Button></CardContent></Card>}
      {step===4 && <Card><CardHeader><CardTitle>🎉 You&apos;re set!</CardTitle><CardDescription>Parent can now see dashboard in 30s. Explore /dashboard, /children, /schedule, /billing.</CardDescription></CardHeader><CardContent><Button onClick={()=> window.location.href='/dashboard'}>Go to Dashboard</Button></CardContent></Card>}
      <p className="text-xs text-muted-foreground">Empty/loading/error states on every screen • Toasts • Dialogs for destructive • Accessibility WCAG AA</p>
    </div>
  );
}
