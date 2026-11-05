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
import { ArrowLeft, Sparkles, GraduationCap, UserCheck, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t, isBn } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data?.data;
      if (data?.accessToken && data?.user) {
        login(data.accessToken, data.user, data.refreshToken);
        if (data.user.role === 'child') {
          router.push('/child');
        } else {
          router.push('/dashboard');
        }
        return;
      }
      router.push('/dashboard');
    } catch (err: any) {
      // Show the real error. This used to have a catch-all that logged the visitor in as
      // the demo parent (or as a demo child, picked by substring-matching their email)
      // on ANY failure — including a typo'd password and including the API being down.
      // So a wrong password "worked", and every account could reach the demo family.
      const serverMsg = err.response?.data?.error?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.response?.status === 401) {
        setError(t('login.text'));
      } else if (err.request) {
        setError(
          t('login.text_2')
        );
      } else {
        setError(t('login.text_3'));
      }
    } finally {
      setLoading(false);
    }
  }

  const fillParentDemo = () => {
    setEmail('parent@demo.com');
    setPassword('Password123!');
    setError('');
  };

  const fillRahimDemo = () => {
    setEmail('rahim@demo.com');
    setPassword('Password123!');
    setError('');
  };

  const fillFahimDemo = () => {
    setEmail('fahim@demo.com');
    setPassword('Password123!');
    setError('');
  };

  const fillTasnimDemo = () => {
    setEmail('tasnim@demo.com');
    setPassword('Password123!');
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="w-full max-w-md space-y-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('login.text_4')}</span>
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
              {t('login.text_5')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('login.text_6')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <form onSubmit={onSubmit} className="space-y-3.5">
              <div>
                <Label htmlFor="login-email" className="text-xs font-semibold">
                  {t('login.text_7')}
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com or student@example.com"
                  required
                  className="mt-1 h-10 rounded-xl text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-xs font-semibold">
                    {t('login.text_8')}
                  </Label>
                  <Link href="/forgot-password" className="text-[11px] text-primary hover:underline">
                    {t('login.text_9')}
                  </Link>
                </div>
                <div className="relative mt-1">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="h-10 rounded-xl text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 focus:outline-none"
                    title={showPassword ? (t('login.text_10')) : (t('login.text_11'))}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && <p className="text-xs text-destructive font-medium">{error}</p>}

              <Button
                type="submit"
                className="w-full h-10 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                disabled={loading}
              >
                {loading ? (t('login.text_12')) : t('login.text_5')}
              </Button>
            </form>

            {/* Quick 1-Click Demo Previews */}
            <div className="p-3.5 rounded-2xl bg-muted/50 border space-y-2.5">
              <p className="text-[11px] text-muted-foreground font-semibold flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('login.load_demo_account_s_credentials')}</span>
              </p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={fillParentDemo}
                  className="w-full px-3 py-2 rounded-xl border bg-card hover:bg-indigo-500/10 hover:border-indigo-500 text-left transition-colors flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Parent: Rafiqul Islam</p>
                      <p className="text-[10px] text-muted-foreground">parent@demo.com</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                    Parent View
                  </span>
                </button>

                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={fillRahimDemo}
                    className="px-2 py-2 rounded-xl border bg-card hover:bg-amber-500/10 hover:border-amber-500 text-left transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-[11px] font-bold text-foreground truncate">Rahim (8)</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5 truncate">rahim@demo.com</p>
                  </button>

                  <button
                    type="button"
                    onClick={fillTasnimDemo}
                    className="px-2 py-2 rounded-xl border bg-card hover:bg-amber-500/10 hover:border-amber-500 text-left transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-[11px] font-bold text-foreground truncate">Tasnim (5)</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5 truncate">tasnim@demo.com</p>
                  </button>

                  <button
                    type="button"
                    onClick={fillFahimDemo}
                    className="px-2 py-2 rounded-xl border bg-card hover:bg-cyan-500/10 hover:border-cyan-500 text-left transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      <span className="text-[11px] font-bold text-foreground truncate">Fahim (11)</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5 truncate">fahim@demo.com</p>
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground pt-1">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary font-bold hover:underline">
                {t('login.text_13')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
