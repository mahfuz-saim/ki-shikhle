'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', language: 'en' });
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try { const res = await api.post('/auth/register', form); if (res.data.data?.accessToken) localStorage.setItem('accessToken', res.data.data.accessToken); router.push('/dashboard'); } catch (err: any) { setError(err.response?.data?.error?.message || 'Registration failed'); } finally { setLoading(false); }
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center"><CardTitle className="text-2xl">Create account</CardTitle><CardDescription>15-day free trial • Full Standard features</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div><Label>Full name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
            <div><Label>Password (min 8, upper/lower/number)</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
            <div><Label>Language</Label><select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="en">English</option><option value="bn">বাংলা</option></select></div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create account & Start Trial'}</Button>
          </form>
          <p className="text-sm text-center mt-4 text-muted-foreground"><Link href="/login" className="text-primary underline">Already have an account? Login</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
