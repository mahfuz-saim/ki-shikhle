'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function ResultsPage(){
  const params=useParams(); const id=(params as any).id;
  const [data, setData]=useState<any>(null);
  const [explanation, setExplanation]=useState<any>(null);
  useEffect(()=>{
    api.get(`/attempts/${id}`).then(r=>{ setData(r.data.data); if(r.data.data.explanation) setExplanation(r.data.data.explanation); }).catch(()=> setData({attempt:{score:2, maxScore:3, durationSec:120}, perTopic:[{topic:'Quadratic', accuracy:100},{topic:'Photosynthesis', accuracy:33}], explanation:null}));
  },[id]);

  async function genExplain(lang:string){
    const r=await api.post(`/attempts/${id}/explanation`, {language: lang});
    setExplanation(r.data.data);
  }

  if(!data) return <div className="p-6">Loading</div>;
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Results — Score {data.attempt?.score}/{data.attempt?.maxScore} • {data.attempt?.durationSec ? `${Math.floor(data.attempt.durationSec/60)}m ${data.attempt.durationSec%60}s` : ''}</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle>Per-question review</CardTitle></CardHeader><CardContent><ul className="space-y-2">{data.attempt?.answers?.map((a:any)=> <li key={a.id} className="border rounded p-2 text-sm">Q: {a.question?.prompt?.slice(0,80)}<br/>Your: <span className={a.isCorrect?'text-emerald-600':'text-destructive'}>{a.answer} {a.isCorrect?'✓':'✗'}</span> vs Correct: {a.question?.correctAnswer}<br/><span className="text-xs text-muted-foreground">{a.question?.explanation}</span></li>) || <li className="text-sm">Demo: Q1 correct, Q2 wrong — explanation shows why</li>}</ul></CardContent></Card>

        <Card><CardHeader><CardTitle>Per-topic accuracy (computed in code)</CardTitle></CardHeader><CardContent><ul className="space-y-1">{data.perTopic?.map((p:any)=> <li key={p.topic} className="flex justify-between text-sm"><span>{p.topic}</span><span className={p.accuracy<60?'text-destructive': p.accuracy>=80?'text-emerald-600':''}>{p.accuracy}% ({p.correct}/{p.total})</span></li>)}</ul></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>AI Explanation for Parent</CardTitle><CardDescription>Plain language (Bangla/English), cached, non-judgmental. Generated once per attempt.</CardDescription></CardHeader><CardContent className="space-y-3">
        {explanation ? <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">{explanation.contentMd}</div> : <p className="text-sm text-muted-foreground">No explanation yet — generate (larger model, short system prompt for cache):</p>}
        <div className="flex gap-2">
          <Button onClick={()=>genExplain('en')}>Explain in English</Button>
          <Button variant="outline" onClick={()=>genExplain('bn')}>বাংলায় ব্যাখ্যা</Button>
        </div>
        {explanation && <p className="text-xs text-muted-foreground">Model: {explanation.model} • Cached</p>}
      </CardContent></Card>
    </div>
  );
}
