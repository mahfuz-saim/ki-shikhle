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
  const { isBn } = useI18n();

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
        router.push('/child');
      } else if (normEmail.includes('fahim')) {
        login('demo-child-token-fahim', {
          id: 'demo-child-3',
          name: 'Fahim Islam',
          email: normEmail,
          role: 'child',
          childId: 'demo-child-3',
          grade: 'Class 11',
          curriculum: 'NCTB',
        });
        router.push('/child');
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
        router.push('/child');
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
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <form onSubmit={onSubmit} className="space-y-3.5">
              <div>
                <Label className="text-xs font-semibold">{isBn ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}</Label>
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
                  <Label className="text-xs font-semibold">{isBn ? 'পাসওয়ার্ড' : 'Password'}</Label>
                  <Link href="/forgot-password" className="text-[11px] text-primary hover:underline">
                    {isBn ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
                  </Link>
                </div>
                <div className="relative mt-1">
                  <Input
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
                    title={showPassword ? (isBn ? 'পাসওয়ার্ড লুকান' : 'Hide password') : (isBn ? 'পাসওয়ার্ড দেখুন' : 'Show password')}
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
                {loading ? (isBn ? 'লগইন হচ্ছে...' : 'Logging in...') : isBn ? 'লগইন করুন' : 'Sign In'}
              </Button>
            </form>

            {/* Quick 1-Click Demo Previews */}
            <div className="p-3.5 rounded-2xl bg-muted/50 border space-y-2.5">
              <p className="text-[11px] text-muted-foreground font-semibold flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isBn ? 'ডেমো অ্যাকাউন্টের ক্রেডেনশিয়াল লোড করুন' : "Load demo account's credentials"}</span>
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
                {isBn ? 'ফ্রি অ্যাকাউন্ট তৈরি করুন' : 'Create Free Account'}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
