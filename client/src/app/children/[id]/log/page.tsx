'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

export default function LogPage(){
  const params = useParams();
  const childId = (params as any).id || 'demo-child';
  const [list, setList]=useState<any[]>([]);
  const [form, setForm]=useState({ source:'tuition', providerName:'Rahim Sir', subjectId:'', date: new Date().toISOString().slice(0,10), topicsText:'Quadratic Equations - formula', durationMin:60, confidence:4 });
  const load=()=> api.get(`/children/${childId}/entries`).then(r=>setList(r.data.data.data||r.data.data)).catch(()=> setList([{id:'e1', date:'2026-10-30', topicsText:'Quadratic Equations', source:'tuition'}]));
  async function submit(e:React.FormEvent){ e.preventDefault(); await api.post(`/children/${childId}/entries`, form); load(); }
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Daily Learning Log — Child {childId}</h1>
      <Card><CardHeader><CardTitle>Quick Add</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
        <div><Label>Date</Label><Input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
        <div><Label>Source</Label><select value={form.source} onChange={e=>setForm({...form, source:e.target.value})} className="h-10 border rounded px-3 w-full"><option value="school">School</option><option value="college">College</option><option value="tuition">Tuition</option><option value="self_study">Self-study</option></select></div>
        <div><Label>Tuition name if tuition</Label><Input value={form.providerName} onChange={e=>setForm({...form, providerName:e.target.value})} /></div>
        <div><Label>Subject</Label><Input value={form.subjectId} onChange={e=>setForm({...form, subjectId:e.target.value})} placeholder="subjectId or name" /></div>
        <div className="md:col-span-2"><Label>Topic(s) learned (free text)</Label><Input value={form.topicsText} onChange={e=>setForm({...form, topicsText:e.target.value})} /></div>
        <div><Label>Duration min (optional)</Label><Input type="number" value={form.durationMin} onChange={e=>setForm({...form, durationMin: parseInt(e.target.value)})} /></div>
        <div><Label>Confidence 1-5</Label><Input type="number" min={1} max={5} value={form.confidence} onChange={e=>setForm({...form, confidence: parseInt(e.target.value)})} /></div>
        <Button type="submit" className="md:col-span-2">Log (under 1 min)</Button>
      </form></CardContent></Card>
      <Button variant="outline" onClick={load}>Load entries</Button>
      <div className="space-y-2">{list.map((e:any)=> <Card key={e.id}><CardContent className="p-4 flex justify-between"><span>{e.date?.slice?.(0,10) || e.date} • {e.source} • {e.topicsText}</span><Button size="sm" variant="ghost" onClick={async()=>{ await api.post(`/entries/${e.id}/verify`); load(); }}>Verify (parent)</Button></CardContent></Card>)}</div>
      <p className="text-xs text-muted-foreground">Editable by child for 48h, always by parent; edit history via entry_revisions; parent verification tick.</p>
    </div>
  );
}
