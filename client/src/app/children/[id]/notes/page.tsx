'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
export default function NotesByChild(){
  const params = useParams(); const childId=(params as any).id as string;
  const [list, setList]=useState<any[]>([]);
  useEffect(()=>{ api.get(`/children/${childId}/notes`).then(r=>setList(r.data.data)).catch(()=> setList([{id:'n1', textClean:'পদার্থবিজ্ঞান: নিউটনের দ্বিতীয় সূত্র F=ma', ocrConfidence:0.91, fileUrl:'/uploads/demo.jpg'}])); },[childId]);
  return (
    <div className="container mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Notes — Child {childId}</h1>
      {list.map((n:any)=> <Card key={n.id}><CardHeader><CardTitle className="text-sm">OCR Confidence: {n.ocrConfidence ? `${(n.ocrConfidence*100).toFixed(0)}%` : 'N/A'} • Hash: {n.textHash?.slice(0,8) || '—'}</CardTitle></CardHeader><CardContent><p className="text-sm whitespace-pre-wrap">{n.textClean}</p>{n.fileUrl && <a href={n.fileUrl} className="text-primary underline text-xs">Original file</a>}</CardContent></Card>)}
    </div>
  );
}
