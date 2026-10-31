'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

export default function VerifyPage() {
  const params = useSearchParams();
  const [token, setToken] = useState(params.get('token') || '');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  async function onVerify() {
    setErr(''); setMsg('');
    try { const r = await api.post('/auth/verify-email', { token }); setMsg(r.data.data.message); } catch (e: any) { setErr(e.response?.data?.error?.message || 'Failed'); }
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md"><CardHeader><CardTitle>Verify Email</CardTitle><CardDescription>Enter the token from your email (also check console in dev)</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <Input value={token} onChange={e=>setToken(e.target.value)} placeholder="verification token" />
        <Button onClick={onVerify} className="w-full">Verify</Button>
        {msg && <p className="text-sm text-emerald-600">{msg}</p>}
        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent></Card>
    </div>
  );
}
