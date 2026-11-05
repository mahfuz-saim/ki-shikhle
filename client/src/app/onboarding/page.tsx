'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/auth-context';
import { useRouteGuard } from '@/components/auth/route-guard';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import {
  Users,
  Calendar,
  BookOpen,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function Onboarding() {
  const router = useRouter();
  const { refreshChildren } = useAuth();
  const { t, isBn } = useI18n();

  // This wizard creates children, which is a parent-only action. Without the guard a
  // signed-out visitor could walk the whole flow and get a 401 on the first step,
  // and a child could try it too.
  const { allowed: guardAllowed, resolving: guardResolving } = useRouteGuard({
    allow: ['parent', 'admin'],
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdChildId, setCreatedChildId] = useState('');
  const [error, setError] = useState('');

  // The form starts EMPTY. It used to be prefilled with the demo student's details
  // (`Rahim Ahmed` / `student@demo.com` / `Password123!`), so a brand-new parent who
  // clicked straight through created — or appeared to create — a *demo* student.
  const [child, setChild] = useState({
    name: '',
    nickname: '',
    grade: 'Class 8',
    curriculum: 'NCTB',
    medium: 'Bangla',
    email: '',
    password: '',
  });

  const [routine, setRoutine] = useState({
    name: '',
    source: 'tuition',
    weekdays: [0, 2, 4],
    startTime: '16:00',
    durationMin: 90,
  });

  const [logTopic, setLogTopic] = useState('');

  /**
   * Turn a failed request into a message the parent can act on.
   *
   * The old code swallowed the error and advanced the wizard anyway — so a duplicate
   * email, a weak password or an unreachable API all ended on the "You're All Set!"
   * screen with nothing actually created.
   */
  function errorMessage(err: any, fallback: string): string {
    const serverMsg = err?.response?.data?.error?.message;
    if (serverMsg) return serverMsg;
    if (err?.request) {
      return t('onboarding.text');
    }
    return fallback;
  }

  async function handleAddChild() {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/children', child);
      const cId = res.data?.data?.id;
      if (!cId) {
        setError(
          t('onboarding.text_2')
        );
        return;
      }
      setCreatedChildId(cId);
      await refreshChildren();
      setStep(2);
    } catch (err: any) {
      setError(
        errorMessage(
          err,
          t('onboarding.text_3')
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRoutine() {
    setLoading(true);
    setError('');
    try {
      await api.post(`/children/${createdChildId}/routines`, {
        ...routine,
        startsOn: new Date().toISOString().slice(0, 10),
      });
      setStep(3);
    } catch (err: any) {
      setError(
        errorMessage(
          err,
          t('onboarding.text_4')
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleFirstLog() {
    setLoading(true);
    setError('');
    try {
      await api.post(`/children/${createdChildId}/entries`, {
        source: 'tuition',
        topicsText: logTopic,
        date: new Date().toISOString().slice(0, 10),
      });
      setStep(4);
    } catch (err: any) {
      setError(
        errorMessage(
          err,
          t('onboarding.text_5')
        )
      );
    } finally {
      setLoading(false);
    }
  }

  if (guardResolving || !guardAllowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground font-medium">
          {t('common.loading', 'Loading...')}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2">
          {[
            { num: 1, title: 'Add Child', icon: Users },
            { num: 2, title: 'Add Routine', icon: Calendar },
            { num: 3, title: 'First Log', icon: BookOpen },
            { num: 4, title: 'Done', icon: Sparkles },
          ].map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            const Icon = s.icon;
            return (
              <div key={s.num} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? '✓' : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step 1: Add Child */}
        {step === 1 && (
          <Card className="rounded-3xl border shadow-xl bg-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Step 1: Add Student Account</CardTitle>
              <CardDescription className="text-xs">
                Set up your student&apos;s profile and login credentials for their dedicated portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs font-semibold">Student Full Name</Label>
                <Input
                  value={child.name}
                  onChange={(e) => setChild({ ...child, name: e.target.value })}
                  placeholder={t('onboarding.text_6')}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Grade / Class</Label>
                  <select
                    value={child.grade}
                    onChange={(e) => setChild({ ...child, grade: e.target.value })}
                    className="w-full h-10 border rounded-xl px-3 bg-background text-xs mt-1"
                  >
                    <option value="Class 4">Class 4</option>
                    <option value="Class 5">Class 5 (PEC)</option>
                    <option value="Class 6">Class 6</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 8">Class 8 (JSC)</option>
                    <option value="Class 9">Class 9 (SSC)</option>
                    <option value="Class 10">Class 10 (SSC)</option>
                    <option value="Class 11">Class 11 (HSC)</option>
                    <option value="Class 12">Class 12 (HSC)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Version / Medium</Label>
                  <select
                    value={child.medium}
                    onChange={(e) => setChild({ ...child, medium: e.target.value })}
                    className="w-full h-10 border rounded-xl px-3 bg-background text-xs mt-1"
                  >
                    <option value="Bangla">Bangla Version</option>
                    <option value="English">English Version</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Student Login Email</Label>
                  <Input
                    type="email"
                    value={child.email}
                    onChange={(e) => setChild({ ...child, email: e.target.value })}
                    placeholder="student@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Student Password</Label>
                  <Input
                    type="password"
                    value={child.password}
                    onChange={(e) => setChild({ ...child, password: e.target.value })}
                    placeholder="At least 8 characters"
                    className="mt-1"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-destructive font-medium">{error}</p>}

              <Button
                onClick={handleAddChild}
                disabled={loading || !child.name || !child.email || !child.password}
                className="w-full h-10 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? 'Creating Profile...' : 'Next: Setup Routine →'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Add Routine */}
        {step === 2 && (
          <Card className="rounded-3xl border shadow-xl bg-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Step 2: Add Regular Tuition or Class</CardTitle>
              <CardDescription className="text-xs">
                Recurring schedule lets the platform remind and compute missed sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs font-semibold">Routine Name</Label>
                <Input
                  value={routine.name}
                  onChange={(e) => setRoutine({ ...routine, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Start Time</Label>
                  <Input
                    type="time"
                    value={routine.startTime}
                    onChange={(e) => setRoutine({ ...routine, startTime: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Duration (Minutes)</Label>
                  <Input
                    type="number"
                    value={routine.durationMin}
                    onChange={(e) => setRoutine({ ...routine, durationMin: parseInt(e.target.value) || 60 })}
                    className="mt-1"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-destructive font-medium">{error}</p>}

              <Button
                onClick={handleAddRoutine}
                disabled={loading || !routine.name}
                className="w-full h-10 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? 'Saving Routine...' : 'Next: Record First Log →'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: First Log */}
        {step === 3 && (
          <Card className="rounded-3xl border shadow-xl bg-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Step 3: Record First Study Log</CardTitle>
              <CardDescription className="text-xs">
                What did your child study today or yesterday? Takes under 1 minute.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs font-semibold">Topic Learned</Label>
                <Input
                  value={logTopic}
                  onChange={(e) => setLogTopic(e.target.value)}
                  className="mt-1"
                />
              </div>

              {error && <p className="text-xs text-destructive font-medium">{error}</p>}

              <Button
                onClick={handleFirstLog}
                disabled={loading || !logTopic}
                className="w-full h-10 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? 'Recording...' : 'Finish Setup'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <Card className="rounded-3xl border-2 border-emerald-500/30 bg-card shadow-xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl">
              🎉
            </div>
            <h2 className="text-2xl font-black text-foreground">You&apos;re All Set!</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Your child profile and routine are configured. You can now track daily progress in 30 seconds on your dashboard and generate custom AI quizzes!
            </p>
            <div className="pt-2">
              <Button
                onClick={() => router.push('/dashboard')}
                className="h-11 px-8 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25"
              >
                Go to Parent Dashboard →
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
