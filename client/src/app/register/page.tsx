'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t, isBn } = useI18n();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    language: 'en',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      const data = res.data?.data;
      if (data?.accessToken && data?.user) {
        login(data.accessToken, data.user, data.refreshToken);
      }
      router.push('/dashboard');
    } catch (err: any) {
      // Show the real error. The old fallback created a **fake session** whenever the
      // request failed — so a duplicate email, a weak password, or an unreachable API
      // all landed the visitor in the app as "parent-<timestamp>" with a demo token.
      // The account was never created, so every later request failed while the UI
      // looked like it had worked.
      const serverMsg = err.response?.data?.error?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.request) {
        setError(
          t('register.text')
        );
      } else {
        setError(t('register.text_2'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="w-full max-w-md space-y-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('register.text_3')}</span>
        </Link>

        <Card className="rounded-3xl border shadow-xl bg-card">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2.5">
              <Image
                src="/logo-light.png"
                alt="কি শিখলে?"
                width={260}
                height={112}
                priority
                className="h-12 w-auto object-contain dark:hidden"
              />
              <Image
                src="/logo-dark.png"
                alt="কি শিখলে?"
                width={260}
                height={112}
                priority
                className="h-12 w-auto object-contain hidden dark:block"
              />
            </div>
            <CardTitle className="text-2xl font-black text-foreground">
              {t('register.text_4')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('register.text_5')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <form onSubmit={onSubmit} className="space-y-3.5">
              <div>
                <Label htmlFor="register-name" className="text-xs font-semibold">
                  Parent&apos;s Full Name
                </Label>
                <Input
                  id="register-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Nasrin Sultana"
                  required
                  className="mt-1 h-10 rounded-xl text-xs"
                />
              </div>

              <div>
                <Label htmlFor="register-email" className="text-xs font-semibold">
                  Email Address
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="parent@example.com"
                  required
                  className="mt-1 h-10 rounded-xl text-xs"
                />
              </div>

              <div>
                <Label htmlFor="register-password" className="text-xs font-semibold">
                  Password (min 8 characters)
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="mt-1 h-10 rounded-xl text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Preferred Language</Label>
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full h-10 border rounded-xl px-3 bg-background text-xs mt-1"
                >
                  <option value="en">English</option>
                  <option value="bn">বাংলা (Bangla)</option>
                </select>
              </div>

              {error && <p className="text-xs text-destructive font-medium">{error}</p>}

              <Button
                type="submit"
                className="w-full h-10 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 mt-2"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : t('register.text_6')}
              </Button>
            </form>

            <p className="text-xs text-center text-muted-foreground pt-1">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
