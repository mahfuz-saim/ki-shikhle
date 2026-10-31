'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

export default function ForgotPage() {
  const [email, setEmail] = useState(''); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  async function onSubmit(e: React.FormEvent){ e.preventDefault(); setErr(''); try{ const r=await api.post('/auth/forgot-password',{email}); setMsg(r.data.data.message + (r.data.data._devToken ? ` (dev token: ${r.data.data._devToken})` : '')); }catch(e:any){ setErr(e.response?.data?.error?.message||'Failed'); }}
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md"><CardHeader><CardTitle>Forgot password</CardTitle><CardDescription>We will send a reset link (console in dev)</CardDescription></CardHeader>
      <CardContent><form onSubmit={onSubmit} className="space-y-4">
        <div><Label>Email</Label><Input value={email} onChange={e=>setEmail(e.target.value)} required /></div>
        {msg && <p className="text-sm text-emerald-600">{msg}</p>}
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button type="submit" className="w-full">Send reset link</Button>
      </form></CardContent></Card>
    </div>
  );
}
