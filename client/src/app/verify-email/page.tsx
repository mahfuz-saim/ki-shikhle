'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setLoading(true);
    try {
      const r = await api.post('/auth/verify-email', { token });
      setMsg(r.data?.data?.message || 'Email verified successfully!');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (e: any) {
      setErr(e.response?.data?.error?.message || 'Verification token invalid or expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="w-full max-w-md space-y-4">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <Card className="rounded-3xl border shadow-xl bg-card">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-black text-foreground">Verify Email</CardTitle>
            <CardDescription className="text-xs">
              Enter the verification token sent to your email address.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold">Verification Token</Label>
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste token from email"
                  required
                  className="mt-1 h-10 rounded-xl text-xs font-mono"
                />
              </div>

              {msg && <p className="text-xs text-emerald-600 font-medium">{msg}</p>}
              {err && <p className="text-xs text-destructive font-medium">{err}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
