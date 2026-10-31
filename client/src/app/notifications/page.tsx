'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function NotificationsPage(){
  const [list, setList]=useState<any[]>([]);
  const load=()=> api.get('/notifications').then(r=> setList(r.data.data)).catch(()=> setList([{id:'n1', type:'quiz_completed', payloadJson:{score:8, maxScore:10}, readAt:null},{id:'n2', type:'trial_reminder', payloadJson:{daysLeft:3}, readAt:null}]));
  useEffect(()=>{ load(); },[]);
  async function mark(id:string){ await api.post(`/notifications/${id}/read`); load(); }
  async function all(){ await api.post('/notifications/read-all'); load(); }
  return (
    <div className="container mx-auto p-6 space-y-4">
      <div className="flex justify-between"><h1 className="text-2xl font-bold">🔔 Notifications</h1><Button variant="outline" onClick={all}>Mark all read</Button></div>
      <p className="text-sm text-muted-foreground">In-app bell + email (provider interface; console in dev). Events: quiz completed, results ready, trial ending, missed sessions summary.</p>
      {list.map((n:any)=> <Card key={n.id} className={n.readAt?'opacity-60':''}><CardHeader><CardTitle className="text-sm">{n.type} — {new Date(n.createdAt||Date.now()).toLocaleString()}</CardTitle></CardHeader><CardContent className="flex justify-between"><pre className="text-xs">{JSON.stringify(n.payloadJson,null,2)}</pre><Button size="sm" onClick={()=>mark(n.id)} disabled={!!n.readAt}>{n.readAt?'Read':'Mark read'}</Button></CardContent></Card>)}
      {list.length===0 && <p className="text-muted-foreground">No notifications</p>}
    </div>
  );
}
