'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
export default function QuizView(){
  const params=useParams(); const id=(params as any).id;
  const [quiz, setQuiz]=useState<any>(null);
  useEffect(()=>{ api.get(`/quizzes/${id}`).then(r=>setQuiz(r.data.data)).catch(()=> setQuiz({id, title:'Demo Quiz', questions:[]})) },[id]);
  if(!quiz) return <div className="p-6">Loading</div>;
  return <div className="container mx-auto p-6"><Card><CardHeader><CardTitle>{quiz.title}</CardTitle></CardHeader><CardContent><pre className="text-xs bg-muted p-3 rounded overflow-auto">{JSON.stringify(quiz,null,2)}</pre><Button onClick={async()=>{ await api.post(`/quizzes/${id}/assign`); alert('Assigned');}}>Assign</Button></CardContent></Card></div>;
}
