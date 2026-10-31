'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

export default function ResetPage() {
  const params = useSearchParams();
  const [token, setToken] = useState(params.get('token') || ''); const [password, setPassword] = useState(''); const [msg, setMsg]=useState(''); const [err,setErr]=useState('');
  async function onSubmit(e: React.FormEvent){ e.preventDefault(); setErr(''); try{ const r=await api.post('/auth/reset-password',{token,password}); setMsg(r.data.data.message);}catch(e:any){ setErr(e.response?.data?.error?.message||'Failed'); }}
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md"><CardHeader><CardTitle>Reset password</CardTitle><CardDescription>Token expires in 60m, single-use, hashed</CardDescription></CardHeader>
      <CardContent><form onSubmit={onSubmit} className="space-y-4">
        <div><Label>Token</Label><Input value={token} onChange={e=>setToken(e.target.value)} required /></div>
        <div><Label>New password</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
        {msg && <p className="text-sm text-emerald-600">{msg}</p>}
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button type="submit" className="w-full">Reset</Button>
      </form></CardContent></Card>
    </div>
  );
}
