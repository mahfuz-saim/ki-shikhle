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
import { ArrowLeft, Sparkles, GraduationCap, ShieldCheck, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { isBn } = useI18n();

  const [email, setEmail] = useState('parent@demo.com');
  const [password, setPassword] = useState('Password123!');
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
        login(data.accessToken, data.user);
        if (data.user.role === 'child') {
          router.push('/kid');
        } else {
          router.push('/dashboard');
        }
        return;
      }
      router.push('/dashboard');
    } catch (err: any) {
      const serverMsg = err.response?.data?.error?.message;
      if (err.response?.status === 401 && serverMsg) {
        setError(serverMsg);
        setLoading(false);
        return;
      }

      // Offline dev fallback
      const normEmail = email.trim().toLowerCase();
      if (normEmail.includes('tasnim')) {
        login('demo-child-token-tasnim', {
          id: 'demo-child-2',
          name: 'Tasnim Islam',
          email: normEmail,
          role: 'child',
          childId: 'demo-child-2',
          grade: 'Class 5',
          curriculum: 'NCTB',
        });
        router.push('/kid');
      } else if (normEmail.includes('rahim') || normEmail.includes('student')) {
        login('demo-child-token-rahim', {
          id: 'demo-child-1',
          name: 'Rahim Ahmed',
          email: normEmail,
          role: 'child',
          childId: 'demo-child-1',
          grade: 'Class 8',
          curriculum: 'NCTB',
        });
        router.push('/kid');
      } else {
        login('demo-parent-token', {
          id: 'parent-demo',
          name: 'Rafiqul Islam',
          email: normEmail,
          role: 'parent',
          trialEndsAt: new Date(Date.now() + 15 * 86400000).toISOString(),
        });
        router.push('/dashboard');
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
          <span>{isBn ? 'হোমপেজে ফিরুন' : 'Back to Home'}</span>
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
              {isBn ? 'লগইন করুন' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isBn
                ? 'অভিভাবক অথবা শিক্ষার্থীর ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন'
                : 'Sign in with your parent or student account to enter your portal'}
            </CardDescription>

            {/* Portal destination indicator badge */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                <ShieldCheck className="w-3 h-3" />
                <span>Parent Dashboard</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                <GraduationCap className="w-3 h-3" />
                <span>Student Portal</span>
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <form onSubmit={onSubmit} className="space-y-3.5">
              <div>
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input
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
                  <Label className="text-xs font-semibold">Password</Label>
                  <Link href="/forgot-password" className="text-[11px] text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 h-10 rounded-xl text-xs"
                />
              </div>

              {error && <p className="text-xs text-destructive font-medium">{error}</p>}

              <Button
                type="submit"
                className="w-full h-10 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                disabled={loading}
              >
                {loading ? 'Logging in...' : isBn ? 'লগইন করুন' : 'Sign In'}
              </Button>
            </form>

            {/* Quick 1-Click Demo Previews */}
            <div className="p-3.5 rounded-2xl bg-muted/50 border space-y-2.5">
              <p className="text-[11px] text-muted-foreground font-semibold flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Click Seed Account Logins</span>
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
                      <p className="text-[10px] text-muted-foreground">parent@demo.com • Password123!</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                    Parent View
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={fillRahimDemo}
                    className="px-2.5 py-2 rounded-xl border bg-card hover:bg-amber-500/10 hover:border-amber-500 text-left transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-xs font-bold text-foreground">Rahim (Class 8)</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">rahim@demo.com</p>
                  </button>

                  <button
                    type="button"
                    onClick={fillTasnimDemo}
                    className="px-2.5 py-2 rounded-xl border bg-card hover:bg-amber-500/10 hover:border-amber-500 text-left transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-xs font-bold text-foreground">Tasnim (Class 5)</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">tasnim@demo.com</p>
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Parent connects to both children • Students access their individual study portals
              </p>
            </div>

            <p className="text-xs text-center text-muted-foreground pt-1">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary font-bold hover:underline">
                Create parent account (15-day trial)
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
