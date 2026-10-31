'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
export default function KidLog(){
  const [topic, setTopic]=useState('Photosynthesis steps');
  async function log(){
    const childId=localStorage.getItem('activeChild')||'demo-child';
    await api.post(`/children/${childId}/entries`, { source: 'school', topicsText: topic, date: new Date().toISOString().slice(0,10) });
    alert('Logged! 🎉 Streak kept!');
  }
  return (
    <div className="container mx-auto p-6">
      <Card><CardHeader><CardTitle>Quick Log — Today</CardTitle></CardHeader><CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Tap scheduled item, fill only topic — under 1 minute.</p>
        <div className="grid gap-3">
          <Button variant="outline" onClick={()=> setTopic('Math — Quadratic')}>📚 Math Tuition 4pm — tap to log</Button>
          <Button variant="outline" onClick={()=> setTopic('Science — Photosynthesis')}>🔬 Science School — tap to log</Button>
        </div>
        <div><Label>Topic</Label><Input value={topic} onChange={e=>setTopic(e.target.value)} /></div>
        <Button onClick={log} className="w-full">Save Log 🎉</Button>
      </CardContent></Card>
    </div>
  );
}
