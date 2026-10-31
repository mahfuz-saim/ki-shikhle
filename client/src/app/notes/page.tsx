'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
export default function NotesPage(){
  const [text, setText]=useState('পদার্থবিজ্ঞান নোট: নিউটনের সূত্র...');
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Notes & OCR</h1>
      <Card><CardHeader><CardTitle>Upload (JPG/PNG/PDF 5/10MB) or paste text</CardTitle></CardHeader><CardContent className="space-y-3">
        <div><Label>Upload</Label><Input type="file" accept="image/*,application/pdf" onChange={e=> alert('Client-side Tesseract ben+eng would run in worker — see Phase 4 detail')} /></div>
        <div><Label>Paste text</Label><textarea value={text} onChange={e=>setText(e.target.value)} className="w-full border rounded p-3 h-32" /></div>
        <Button onClick={()=> alert('Stored text_clean + hash + confidence, original file S3/local')}>Save</Button>
        <p className="text-xs text-muted-foreground">Client preprocessing (resize, grayscale, contrast) → Tesseract.js ben+eng → editable preview → hash dedup → optional AI vision</p>
      </CardContent></Card>
    </div>
  );
}
