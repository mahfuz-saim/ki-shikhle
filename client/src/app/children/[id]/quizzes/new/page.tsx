'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

export default function QuizBuilder(){
  const params=useParams(); const childId=(params as any).id;
  const [form, setForm]=useState({ scope:'last7', from:'', to:'', numQuestions:10, difficulty:'mixed', types:['mcq','true_false','fill_blank'], language:'en', title:'' });
  const [preview, setPreview]=useState<any>(null);
  const [assigning, setAssigning]=useState(false);

  async function generate(){
    const r=await api.post(`/children/${childId}/quizzes/generate`, { ...form, numQuestions: form.numQuestions.toString(), subjectIds: [] });
    setPreview(r.data.data);
  }
  async function assign(){
    if(!preview) return;
    await api.post(`/quizzes/${preview.id}/assign`);
    setAssigning(true);
    alert('Assigned to child — notification sent');
  }
  async function regen(qid:string){
    const r=await api.post(`/quizzes/${preview.id}/questions/${qid}/regenerate`);
    // update locally
    setPreview({...preview, questions: preview.questions.map((q:any)=> q.id===qid? r.data.data : q)});
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI Quiz Builder — Parent (Child {childId})</h1>
      <p className="text-sm text-muted-foreground">Scope: yesterday/today/last7/last30/custom/entries/notes. Preview before assigning; remove/regenerate individual questions. Correct answers never sent to child until submission.</p>

      <Card><CardHeader><CardTitle>Configure</CardTitle><CardDescription>Digests collected for scope → compact prompt → LLM → zod validated → cached (short window)</CardDescription></CardHeader><CardContent className="grid md:grid-cols-3 gap-4">
        <div><Label>Scope</Label><select value={form.scope} onChange={e=>setForm({...form, scope:e.target.value})} className="h-10 border rounded px-3 w-full"><option value="today">today</option><option value="yesterday">yesterday</option><option value="last7">last 7 days</option><option value="last30">last 30 days</option><option value="custom">custom date range</option><option value="entries">specific entries</option><option value="notes">specific notes</option></select></div>
        <div><Label>From</Label><Input type="date" value={form.from} onChange={e=>setForm({...form, from:e.target.value})} /></div>
        <div><Label>To</Label><Input type="date" value={form.to} onChange={e=>setForm({...form, to:e.target.value})} /></div>
        <div><Label># Questions</Label><select value={form.numQuestions} onChange={e=>setForm({...form, numQuestions: parseInt(e.target.value)})} className="h-10 border rounded px-3 w-full"><option value={5}>5</option><option value={10}>10</option><option value={15}>15</option><option value={20}>20</option></select></div>
        <div><Label>Difficulty</Label><select value={form.difficulty} onChange={e=>setForm({...form, difficulty:e.target.value})} className="h-10 border rounded px-3 w-full"><option value="easy">easy</option><option value="mixed">mixed</option><option value="hard">hard</option></select></div>
        <div><Label>Language</Label><select value={form.language} onChange={e=>setForm({...form, language:e.target.value})} className="h-10 border rounded px-3 w-full"><option value="en">English</option><option value="bn">Bangla</option></select></div>
        <div className="md:col-span-3"><Label>Title (optional)</Label><Input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="e.g., Math Revision Quiz" /></div>
        <Button onClick={generate} className="md:col-span-3">Generate (budget-capped, prompt-cached, validated)</Button>
      </CardContent></Card>

      {preview && (
        <Card><CardHeader><CardTitle>Preview — {preview.title} ({preview.questions?.length} Qs)</CardTitle><CardDescription>Parent can remove/regenerate before assigning. Time limit: {preview.settingsJson?.timeLimitMin || 'none'}</CardDescription></CardHeader><CardContent className="space-y-4">
          {preview.questions?.map((q:any,i:number)=> (
            <div key={q.id||i} className="border rounded p-3">
              <p className="font-medium">{i+1}. [{q.type}] {q.prompt} <span className="text-xs bg-secondary px-2 py-1 rounded">{q.topic}</span></p>
              {q.optionsJson && <ul className="text-sm list-disc ml-6">{(q.optionsJson as string[]).map((o:string,j:number)=> <li key={j}>{o} {o===q.correctAnswer && <span className="text-emerald-600">(correct)</span>}</li>)}</ul>}
              <p className="text-xs text-muted-foreground mt-1">Correct: {q.correctAnswer} • Exp: {q.explanation}</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={()=>regen(q.id)}>Regenerate</Button>
                <Button size="sm" variant="ghost" onClick={()=> setPreview({...preview, questions: preview.questions.filter((x:any)=> x.id!==q.id)})}>Remove</Button>
                <Button size="sm" variant="ghost" onClick={()=> alert('Report bad question → review queue')}>Report</Button>
              </div>
            </div>
          ))}
          <Button onClick={assign} disabled={assigning}>{assigning? 'Assigned':'Assign to child'}</Button>
        </CardContent></Card>
      )}
    </div>
  );
}
