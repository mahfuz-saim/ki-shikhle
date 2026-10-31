'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function TakeQuiz(){
  const params=useParams(); const quizId=(params as any).id;
  const [quiz, setQuiz]=useState<any>(null);
  const [attempt, setAttempt]=useState<any>(null);
  const [answers, setAnswers]=useState<Record<string,string>>({});
  const [idx, setIdx]=useState(0);
  const [timeLeft, setTimeLeft]=useState<number|null>(null);

  useEffect(()=>{
    const childId = localStorage.getItem('activeChild') || 'demo-child';
    api.get(`/quizzes/${quizId}`).then(r=>{
      // strip correct answers for child view
      const q = r.data.data;
      q.questions = q.questions.map((qq:any)=> ({...qq, correctAnswer: undefined, correct_answer: undefined}));
      setQuiz(q);
      if(q.timeLimitMin) setTimeLeft(q.timeLimitMin*60);
    }).catch(()=> setQuiz({id:quizId, title:'Mock Quiz', questions:[{id:'q1', type:'mcq', prompt:'What is 2+2?', optionsJson:['3','4','5'], topic:'Math'}, {id:'q2', type:'true_false', prompt:'Photosynthesis needs sunlight.', optionsJson:['True','False']}]}));
    api.post(`/quizzes/${quizId}/attempts`, { childId }).then(r=> setAttempt(r.data.data)).catch(()=> setAttempt({id:'attempt-demo', quizId}));
  },[quizId]);

  useEffect(()=>{
    if(timeLeft===null) return;
    if(timeLeft<=0) { handleSubmit(); return; }
    const t=setTimeout(()=> setTimeLeft(timeLeft-1),1000);
    return ()=> clearTimeout(t);
  },[timeLeft]);

  async function handleSave(){
    if(!attempt) return;
    const payload = Object.entries(answers).map(([questionId, answer])=>({questionId, answer}));
    await api.put(`/attempts/${attempt.id}/answers`, { answers: payload });
    alert('Progress saved — resume if interrupted');
  }
  async function handleSubmit(){
    const payload = Object.entries(answers).map(([questionId, answer])=>({questionId, answer}));
    await api.put(`/attempts/${attempt.id}/answers`, { answers: payload });
    const r=await api.post(`/attempts/${attempt.id}/submit`);
    alert(`Submitted! Score ${r.data.data.score}/${r.data.data.maxScore}`);
    window.location.href=`/attempts/${attempt.id}/results`;
  }

  if(!quiz) return <div className="p-6">Loading...</div>;
  const q=quiz.questions?.[idx];

  return (
    <div className="container mx-auto p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">{quiz.title} — One question per screen</h1>
        {timeLeft!==null && <span className="bg-card border px-3 py-1 rounded">⏱ {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</span>}
      </div>
      <p className="text-sm text-muted-foreground">Timer • resume • correct answers hidden until submit</p>

      {q && (
        <Card><CardHeader><CardTitle>Q{idx+1}/{quiz.questions.length} — {q.topic || ''}</CardTitle></CardHeader><CardContent className="space-y-3">
          <p className="font-medium">{q.prompt}</p>
          {q.optionsJson?.map((opt:string)=> (
            <label key={opt} className={`flex items-center gap-2 border rounded p-3 cursor-pointer ${answers[q.id]===opt?'bg-primary text-primary-foreground':''}`}>
              <input type="radio" name={q.id} value={opt} checked={answers[q.id]===opt} onChange={e=> setAnswers({...answers, [q.id]: e.target.value})} />
              {opt}
            </label>
          ))}
          {q.type==='fill_blank' && <input value={answers[q.id]||''} onChange={e=> setAnswers({...answers,[q.id]: e.target.value})} placeholder="Your answer" className="w-full border rounded p-3" />}
          <div className="flex gap-2">
            <Button variant="outline" disabled={idx===0} onClick={()=> setIdx(idx-1)}>Prev</Button>
            <Button variant="outline" onClick={handleSave}>Save & Resume later</Button>
            {idx < quiz.questions.length-1 ? <Button onClick={()=> setIdx(idx+1)}>Next</Button> : <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">Submit</Button>}
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
