'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

export default function SettingsPage(){
  const [curr, setCurr]=useState(''); const [nw, setNw]=useState(''); const [msg,setMsg]=useState(''); const [err,setErr]=useState('');
  async function changePw(e:React.FormEvent){ e.preventDefault(); setErr(''); try{ const r=await api.post('/auth/change-password',{currentPassword:curr,newPassword:nw}); setMsg(r.data.data.message);}catch(e:any){ setErr(e.response?.data?.error?.message||'Failed'); }}
  async function exportData(){ const r=await api.get('/auth/export'); alert(JSON.stringify(r.data.data,null,2)); }
  async function del(){ if(!confirm('Soft-delete with 7-day grace?')) return; const r=await api.delete('/auth/account'); alert(r.data.data.message); }
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card><CardHeader><CardTitle>Change password</CardTitle></CardHeader><CardContent><form onSubmit={changePw} className="space-y-3 max-w-sm">
        <div><Label>Current</Label><Input type="password" value={curr} onChange={e=>setCurr(e.target.value)} /></div>
        <div><Label>New (8+ upper/lower/number)</Label><Input type="password" value={nw} onChange={e=>setNw(e.target.value)} /></div>
        <Button type="submit">Change</Button>
        {msg && <p className="text-sm text-emerald-600">{msg}</p>}
        {err && <p className="text-sm text-destructive">{err}</p>}
      </form></CardContent></Card>
      <Card><CardHeader><CardTitle>Data & Account</CardTitle></CardHeader><CardContent className="flex gap-2">
        <Button variant="outline" onClick={exportData}>Export my data</Button>
        <Button variant="destructive" onClick={del}>Delete account (7-day grace)</Button>
      </CardContent></Card>
      <p className="text-sm text-muted-foreground">Theme: light/dark/system via next-themes • Language stored server-side + local • Timezone Asia/Dhaka</p>
    </div>
  );
}
