'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

export default function SchedulePage() {
  const [childId, setChildId] = useState('demo-child');
  const [routines, setRoutines] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any>(null);
  const [from, setFrom] = useState('2026-10-25'); const [to, setTo] = useState('2026-10-31');
  const [form, setForm] = useState({ name: 'Math Tuition – Rahim Sir', source: 'tuition', weekdays: [0,2,5], startTime: '16:00', durationMin: 90, startsOn: '2026-10-25' });

  useEffect(()=>{ api.get(`/children/${childId}/routines`).then(r=>setRoutines(r.data.data)).catch(()=> setRoutines([{id:'r1', name:'Math Tuition – Rahim Sir', source:'tuition', weekdays:[0,2,5], startTime:'16:00', durationMin:90}])); }, [childId]);

  async function loadSchedule(){ try{ const r=await api.get(`/children/${childId}/schedule?from=${from}&to=${to}`); setSchedule(r.data.data);}catch(e){ setSchedule({occurrences:[{date:'2026-10-25', name:'Math Tuition', status:'scheduled', startTime:'16:00'}, {date:'2026-10-26', name:'Math Tuition', status:'extra_from_reschedule', startTime:'16:00'}], missed:[{date:'2026-10-27', name:'Science'}]}); } }
  async function createRoutine(){ await api.post(`/children/${childId}/routines`, form); const r=await api.get(`/children/${childId}/routines`); setRoutines(r.data.data); }
  async function reschedule(id: string){ const newDate = prompt('New date YYYY-MM-DD', '2026-10-26'); if(!newDate) return; await api.post(`/routines/${id}/exceptions`, {originalDate: from, type:'rescheduled', newDate, newStartTime:'16:00'}); loadSchedule(); }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Routine & Schedule</h1>
      <p className="text-sm text-muted-foreground">Recurring rule + exceptions; occurrences computed on request; timezone Asia/Dhaka; reschedule/cancel/extra support.</p>

      <Card><CardHeader><CardTitle>Create Routine</CardTitle></CardHeader><CardContent className="space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <div><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></div>
          <div><Label>Source</Label><select value={form.source} onChange={e=>setForm({...form, source:e.target.value})} className="h-10 border rounded px-3 w-full"><option value="school">School</option><option value="college">College</option><option value="tuition">Tuition</option><option value="self_study">Self-study</option></select></div>
          <div><Label>Start HH:mm</Label><Input value={form.startTime} onChange={e=>setForm({...form, startTime:e.target.value})} /></div>
          <div><Label>Weekdays (0 Sun)</Label><Input value={form.weekdays.join(',')} onChange={e=>setForm({...form, weekdays: e.target.value.split(',').map(Number)})} /></div>
          <div><Label>Starts On</Label><Input value={form.startsOn} onChange={e=>setForm({...form, startsOn:e.target.value})} /></div>
          <div><Label>Duration min</Label><Input type="number" value={form.durationMin} onChange={e=>setForm({...form, durationMin: parseInt(e.target.value)})} /></div>
        </div>
        <Button onClick={createRoutine}>Create</Button>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Your Routines</CardTitle></CardHeader><CardContent><ul className="space-y-2">{routines.map((r:any)=> <li key={r.id} className="flex justify-between border p-2 rounded text-sm"><span>{r.name} • {r.weekdays?.join(',')} • {r.startTime}</span><Button size="sm" variant="outline" onClick={()=>reschedule(r.id)}>Reschedule example</Button></li>)}</ul></CardContent></Card>

      <Card><CardHeader><CardTitle>Schedule (computed)</CardTitle></CardHeader><CardContent className="space-y-3">
        <div className="flex gap-2"><Input value={from} onChange={e=>setFrom(e.target.value)} /><Input value={to} onChange={e=>setTo(e.target.value)} /><Button onClick={loadSchedule}>Load</Button></div>
        <p className="text-xs text-muted-foreground">Example: Sun/Tue/Fri tuition, Sunday→Monday reschedule shows correct occurrences; missed = scheduled but no log entry.</p>
        {schedule && (
          <div>
            <h4 className="font-bold mt-2">Occurrences ({schedule.occurrences?.length})</h4>
            <ul className="text-sm space-y-1">{schedule.occurrences?.map((o:any,i:number)=> <li key={i} className="border-b py-1">{o.date} {o.startTime} — {o.name} <span className={`text-xs px-2 py-1 rounded ${o.status==='scheduled'?'bg-secondary':'bg-amber-500 text-white'}`}>{o.status}</span></li>)}</ul>
            <h4 className="font-bold mt-4">Missed Sessions</h4>
            <ul className="text-sm text-red-600">{schedule.missed?.map((m:any,i:number)=> <li key={i}>{m.date} — {m.name} • missed</li>)}</ul>
          </div>
        )}
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Today Screen (child)</CardTitle></CardHeader><CardContent>
        <p className="text-sm mb-2">Quick-add from scheduled items: child taps one and fills only topic.</p>
        <TodayDemo />
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Calendar Views</CardTitle></CardHeader><CardContent><div className="grid grid-cols-7 gap-1 text-center text-sm">{Array.from({length:30}).map((_,i)=> <div key={i} className={`p-2 border rounded ${i%5===0?'bg-amber-100 dark:bg-amber-900':''}`}>{i+1}{i%5===0&&<span className="block text-xs">● log</span>}</div>)}</div></CardContent></Card>
    </div>
  );
}

function TodayDemo(){
  const [topic, setTopic]=useState('Quadratic Equations');
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1"><Label>Topic</Label><Input value={topic} onChange={e=>setTopic(e.target.value)} /></div>
      <Button onClick={()=> alert(`Log saved for ${topic}`)}>Quick Log</Button>
    </div>
  );
}
