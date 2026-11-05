'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardGridSkeleton } from '@/components/ui/skeleton';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/components/auth/auth-context';
import { ChildSelector } from '@/components/children/child-selector';
import { demoProfileOf } from '@/lib/child-scope';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import {
  Brain,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Eye,
  Award,
  Sparkles,
  BookOpen,
  Zap,
  Settings2,
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
  Calendar,
  Layers,
  Calculator,
  Flame,
  Info,
} from 'lucide-react';

/**
 * There is no demo fixture list here, and there must not be one.
 *
 * The old `DEFAULT_DEMO_CHILDREN` was used whenever the account had no children — so
 * a brand-new parent saw three demo students, and the quizzes page fetched
 * `/children/demo-child-1/quizzes` for a child that belongs to the demo tenant. The
 * ids were also stale: the demo children are now deterministic UUIDs.
 *
 * An empty children list is an empty list. The UI shows an empty state instead.
 */

interface AutoQuizScheduleConfig {
  childId: string | null;
  enabled: boolean;
  topicStrategy: 'one_day_old' | 'ai_adaptive' | 'recent_notes' | 'all_subjects';
  questionCount: number;
  timeStrategy: 'ai_dynamic' | 'fixed_10' | 'fixed_15' | 'fixed_20';
  customTimeMinutes?: number;
  triggerTime: string;
  daysOfWeek: number[];
  subjects: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  lastGeneratedAt?: string;
}

export default function QuizzesPage() {
  const { activeChild, childrenList } = useAuth();
  const { t, isBn } = useI18n();

  // The account's own children. No demo fallback: an empty list is an empty list.
  const availableChildren = childrenList || [];
  const currentChild = activeChild || availableChildren[0] || null;
  const childId = currentChild?.id || null;
  const childName = currentChild?.name || '';

  // Which demo dataset applies, if any. The server marks the three seeded demo
  // children with a `demoProfile`; the mock quiz lists below only run for those.
  const demoProfile = demoProfileOf(currentChild);
  const isDemoChild = demoProfile !== null;
  const isTasnim = demoProfile === 'tasnim';

  const toBnNum = (n: number | string) => {
    if (!isBn) return String(n);
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(n).replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
  };

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'completed' | 'draft'>('all');

  // Auto Quiz Schedule State
  const [autoSchedule, setAutoSchedule] = useState<AutoQuizScheduleConfig>({
    childId,
    enabled: true,
    topicStrategy: 'one_day_old',
    questionCount: 5,
    timeStrategy: 'ai_dynamic',
    triggerTime: '19:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    subjects: ['All'],
    difficulty: 'mixed',
  });
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [runningAutoQuiz, setRunningAutoQuiz] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<{
    type: 'success' | 'error';
    text: string;
    details?: any;
  } | null>(null);

  const loadQuizzes = async () => {
    setLoading(true);
    if (!childId) {
      setQuizzes([]);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/children/${childId}/quizzes`);
      const list = res.data?.data || [];
      if (list && list.length > 0) {
        setQuizzes(list);
      } else if (isDemoChild) {
        setQuizzes(
          isTasnim
            ? [
                {
                  id: 'q-t1',
                  title: isBn ? 'প্রাথমিক গণিত: গুণনীয়ক ও লসাগু-গসাগু কুইজ' : 'Primary Math: Factors & LCM-HCF Quiz',
                  subject: 'Elementary Math',
                  questionCount: 5,
                  difficulty: 'easy',
                  status: 'completed',
                  score: 5,
                  maxScore: 5,
                  attemptId: 'att-t1',
                  timeLimitMin: 10,
                  createdAt: new Date().toISOString(),
                },
                {
                  id: 'q-t2',
                  title: isBn ? 'প্রাথমিক বিজ্ঞান: জীবনের জন্য পানি বিশুদ্ধকরণ' : 'Primary Science: Safe Water & Purification',
                  subject: 'Primary Science',
                  questionCount: 5,
                  difficulty: 'easy',
                  status: 'assigned',
                  score: null,
                  maxScore: 5,
                  timeLimitMin: 10,
                  createdAt: new Date(Date.now() - 86400000).toISOString(),
                },
                {
                  id: 'q-t3',
                  title: isBn ? 'ইংরেজি: Unit 6 Eat Healthy Vocabulary' : 'English: Unit 6 Eat Healthy Vocabulary',
                  subject: 'English for Today',
                  questionCount: 5,
                  difficulty: 'easy',
                  status: 'draft',
                  score: null,
                  maxScore: 5,
                  timeLimitMin: null,
                  createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                },
              ]
            : [
                {
                  id: 'q1',
                  title: isBn ? 'পদার্থবিজ্ঞান ও বলবিদ্যা অধ্যায় কুইজ' : 'Physics & Newton Laws Chapter Quiz',
                  subject: 'Physics',
                  questionCount: 10,
                  difficulty: 'mixed',
                  status: 'completed',
                  score: 9,
                  maxScore: 10,
                  attemptId: 'att-1',
                  timeLimitMin: 15,
                  createdAt: new Date().toISOString(),
                },
                {
                  id: 'q2',
                  title: isBn ? 'গণিত: বীজগাণিতিক সূত্রাবলী ও প্রয়োগ' : 'Mathematics: Algebraic Formulae Revision',
                  subject: 'Mathematics',
                  questionCount: 10,
                  difficulty: 'easy',
                  status: 'assigned',
                  score: null,
                  maxScore: 10,
                  timeLimitMin: 10,
                  createdAt: new Date(Date.now() - 86400000).toISOString(),
                },
                {
                  id: 'q3',
                  title: isBn ? 'রসায়ন: পর্যায় সারণি ও পরমাণু' : 'Chemistry: Periodic Table & Atoms',
                  subject: 'Chemistry',
                  questionCount: 5,
                  difficulty: 'mixed',
                  status: 'draft',
                  score: null,
                  maxScore: 5,
                  timeLimitMin: null,
                  createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                },
              ]
        );
      } else {
        setQuizzes([]);
      }
    } catch {
      if (!isDemoChild) {
        setQuizzes([]);
        return;
      }
      setQuizzes(
        isTasnim
          ? [
              {
                id: 'q-t1',
                title: isBn ? 'প্রাথমিক গণিত: গুণনীয়ক ও লসাগু-গসাগু কুইজ' : 'Primary Math: Factors & LCM-HCF Quiz',
                subject: 'Elementary Math',
                questionCount: 5,
                difficulty: 'easy',
                status: 'completed',
                score: 5,
                maxScore: 5,
                attemptId: 'att-t1',
                timeLimitMin: 10,
                createdAt: new Date().toISOString(),
              },
              {
                id: 'q-t2',
                title: isBn ? 'প্রাথমিক বিজ্ঞান: জীবনের জন্য পানি বিশুদ্ধকরণ' : 'Primary Science: Safe Water & Purification',
                subject: 'Primary Science',
                questionCount: 5,
                difficulty: 'easy',
                status: 'assigned',
                score: null,
                maxScore: 5,
                timeLimitMin: 10,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
              },
            ]
          : [
              {
                id: 'q1',
                title: isBn ? 'পদার্থবিজ্ঞান ও বলবিদ্যা অধ্যায় কুইজ' : 'Physics & Newton Laws Chapter Quiz',
                subject: 'Physics',
                questionCount: 10,
                difficulty: 'mixed',
                status: 'completed',
                score: 9,
                maxScore: 10,
                attemptId: 'att-1',
                timeLimitMin: 15,
                createdAt: new Date().toISOString(),
              },
              {
                id: 'q2',
                title: isBn ? 'গণিত: বীজগাণিতিক সূত্রাবলী ও প্রয়োগ' : 'Mathematics: Algebraic Formulae Revision',
                subject: 'Mathematics',
                questionCount: 10,
                difficulty: 'easy',
                status: 'assigned',
                score: null,
                maxScore: 10,
                timeLimitMin: 10,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
              },
            ]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadSchedule = async () => {
    setLoadingSchedule(true);
    if (!childId) {
      setLoadingSchedule(false);
      return;
    }
    try {
      const res = await api.get(`/children/${childId}/quizzes/auto-schedule`);
      if (res.data?.data) {
        setAutoSchedule(res.data.data);
      }
    } catch {
      // Use defaults
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
    loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, isDemoChild, isTasnim]);

  const handleSaveSchedule = async (overrides?: Partial<AutoQuizScheduleConfig>) => {
    setSavingSchedule(true);
    setScheduleMsg(null);
    const toSave = overrides ? { ...autoSchedule, ...overrides } : autoSchedule;
    try {
      const res = await api.post(`/children/${childId}/quizzes/auto-schedule`, toSave);
      if (res.data?.data) {
        setAutoSchedule(res.data.data);
      }
      setScheduleMsg({
        type: 'success',
        text: isBn
          ? 'স্বয়ংক্রিয় কুইজ শিডিউল সেটিংস সফলভাবে সংরক্ষিত হয়েছে!'
          : 'Auto-quiz schedule settings saved successfully!',
      });
      setTimeout(() => setScheduleMsg(null), 5000);
    } catch (err: any) {
      setScheduleMsg({
        type: 'error',
        text: err.response?.data?.error?.message || (isBn ? 'সেটিংস সংরক্ষণে ব্যর্থ হয়েছে' : 'Failed to save settings'),
      });
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleRunAutoQuiz = async () => {
    setRunningAutoQuiz(true);
    setScheduleMsg(null);
    try {
      const res = await api.post(`/children/${childId}/quizzes/auto-schedule/run`);
      const quiz = res.data?.data?.quiz;
      const timingInfo = res.data?.data?.timingInfo;
      const config = res.data?.data?.config;

      if (config) {
        setAutoSchedule(config);
      }

      // Prepend to quizzes list immediately
      if (quiz) {
        setQuizzes((prev) => [quiz, ...prev.filter((q) => q.id !== quiz.id)]);
      } else {
        await loadQuizzes();
      }

      setScheduleMsg({
        type: 'success',
        text: isBn
          ? `⚡ আজকের স্বয়ংক্রিয় কুইজ সফলভাবে প্রস্তুত হয়েছে! (${quiz?.title || 'কুইজ'})`
          : `⚡ Today's auto-quiz generated successfully! (${quiz?.title || 'Quiz'})`,
        details: timingInfo,
      });
    } catch (err: any) {
      setScheduleMsg({
        type: 'error',
        text: err.response?.data?.error?.message || (isBn ? 'স্বয়ংক্রিয় কুইজ তৈরিতে সমস্যা হয়েছে' : 'Failed to generate auto-quiz'),
      });
    } finally {
      setRunningAutoQuiz(false);
    }
  };

  const handleToggleEnable = (newVal: boolean) => {
    const updated = { ...autoSchedule, enabled: newVal };
    setAutoSchedule(updated);
    handleSaveSchedule(updated);
  };

  const filteredQuizzes = quizzes.filter((q) => {
    if (filter === 'all') return true;
    return q.status === filter;
  });

  const completedCount = quizzes.filter((q) => q.status === 'completed').length;
  const assignedCount = quizzes.filter((q) => q.status === 'assigned').length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t('quiz.title', 'AI Quizzes')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isBn
                ? `${childName}-এর জন্য ক্লাস নোট ও ১ দিন আগের পাঠের ওপর স্বয়ংক্রিয় কুইজ প্রস্তুতি`
                : `Custom quizzes and spaced repetition auto-scheduler for ${childName}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Which child these quizzes belong to. The selector also keeps the URL in
                sync, so `/children/<id>/quizzes/new` targets the same child. */}
            <ChildSelector
              label={isBn ? 'শিক্ষার্থী' : 'Student'}
              className="mr-1"
            />
            {childId && (
            <Link href={`/children/${childId}/quizzes/new`}>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-9">
                <Plus className="w-4 h-4" />
                <span>{isBn ? 'ম্যানুয়াল কুইজ তৈরি' : 'Manual Quiz Builder'}</span>
              </Button>
            </Link>
            )}
            <Button
              size="sm"
              onClick={handleRunAutoQuiz}
              disabled={runningAutoQuiz}
              className="gap-1.5 text-xs h-9 bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-500/20"
            >
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>{runningAutoQuiz ? (isBn ? 'প্রস্তুত হচ্ছে...' : 'Generating...') : (isBn ? '⚡ অটো কুইজ এখনই নাও' : 'Run Auto Quiz Now')}</span>
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Auto Quiz Scheduling Management Card (Parent Portal Feature) */}
        {/* ========================================================================= */}
        <Card className="rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-card to-indigo-500/5 shadow-md overflow-hidden">
          <CardHeader className="p-5 sm:p-6 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
                  <Zap className="w-6 h-6 fill-amber-300 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg sm:text-xl font-black text-foreground">
                      {isBn ? 'স্বয়ংক্রিয় কুইজ শিডিউলার ব্যবস্থাপনা' : 'Auto Quiz Scheduling Management'}
                    </CardTitle>
                    <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold">
                      {isBn ? '৩য় প্যাকেজ: প্রিমিয়াম ফিচার' : 'Package 3: Premium Feature'}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    {isBn
                      ? 'সন্তানের স্মৃতি ধরে রাখতে ১ দিন আগের পাঠ ও দুর্বল টপিক থেকে এআই স্বয়ংক্রিয়ভাবে কুইজ তৈরি করে টাইমিং সেট করবে।'
                      : 'Automatically prepares quizzes from 1-day-old topics with AI dynamic timing allocation.'}
                  </CardDescription>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap w-full lg:w-auto">
                {/* Active / Paused Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card text-xs">
                  <span className="text-muted-foreground font-medium text-[11px]">
                    {isBn ? 'অবস্থা:' : 'Status:'}
                  </span>
                  {autoSchedule.enabled ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {isBn ? 'সক্রিয় (Auto Taking ON)' : 'Active (Taking ON)'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                      {isBn ? 'বন্ধ (Paused)' : 'Paused'}
                    </span>
                  )}
                </div>

                {/* Enable/Disable Toggle */}
                <Button
                  size="sm"
                  variant={autoSchedule.enabled ? 'outline' : 'default'}
                  onClick={() => handleToggleEnable(!autoSchedule.enabled)}
                  className={`h-9 text-xs font-bold rounded-xl ${
                    autoSchedule.enabled
                      ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {autoSchedule.enabled
                    ? (isBn ? 'সাময়িক বন্ধ করুন' : 'Pause Auto-Quiz')
                    : (isBn ? 'সক্রিয় করুন' : 'Enable Auto-Quiz')}
                </Button>

                {/* Configure Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConfig(!showConfig)}
                  className="h-9 text-xs font-bold rounded-xl gap-1.5"
                >
                  <Settings2 className="w-3.5 h-3.5 text-primary" />
                  <span>{isBn ? 'কাস্টমাইজ ও সেটিংস' : 'Configure Options'}</span>
                  {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </Button>

                {/* Instant Live Run Button */}
                <Button
                  size="sm"
                  onClick={handleRunAutoQuiz}
                  disabled={runningAutoQuiz}
                  className="h-9 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>{runningAutoQuiz ? (isBn ? 'কুইজ তৈরি হচ্ছে...' : 'Generating...') : (isBn ? '⚡ আজকের কুইজ এখনই তৈরি করো' : 'Run Today\'s Auto-Quiz')}</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Feedback & Smart Timing Message */}
          {scheduleMsg && (
            <div className="mx-5 sm:mx-6 mb-4 p-4 rounded-2xl bg-card border border-purple-500/30 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{scheduleMsg.text}</span>
              </div>
              {scheduleMsg.details && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-purple-700 dark:text-purple-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isBn ? 'এআই স্মার্ট টাইমিং বিশ্লেষণ (AI Smart Dynamic Timing Breakdown):' : 'AI Smart Timing Calculation Breakdown:'}</span>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="p-2 rounded-lg bg-card border">
                      <span className="text-muted-foreground block">{isBn ? '📐 গণিত ও বিশ্লেষণমূলক প্রশ্ন:' : '📐 Math & Analytical Questions:'}</span>
                      <strong className="text-foreground">{toBnNum(scheduleMsg.details.mathCount)}টি × ৩ মিনিট = {toBnNum(scheduleMsg.details.mathCount * 3)} মিনিট</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-card border">
                      <span className="text-muted-foreground block">{isBn ? '⏱️ তত্ত্বীয় ও মুখস্থ প্রশ্ন:' : '⏱️ Theory & Recall Questions:'}</span>
                      <strong className="text-foreground">{toBnNum(scheduleMsg.details.nonMathCount)}টি × ৫০ সেকেন্ড = {toBnNum(Math.round((scheduleMsg.details.nonMathCount * 50) / 60))} মিনিট</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-600 text-white font-bold flex flex-col justify-center">
                      <span className="text-[10px] text-purple-200 block">{isBn ? 'মোট সময় বরাদ্দ:' : 'Total Time Allocated:'}</span>
                      <span className="text-sm">{toBnNum(scheduleMsg.details.minutes)} {isBn ? 'মিনিট' : 'minutes'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Configuration Form (Collapsible / Expandable) */}
          {showConfig && (
            <CardContent className="p-5 sm:p-6 pt-0 border-t border-purple-500/15 bg-card/40 space-y-6 animate-in fade-in duration-200">
              {/* Option 1: Topic Strategy Selection (User requirement: Mainly topics that are 1 day old, AI analysis on topic understanding) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>{isBn ? '১. পাঠ ও টপিক নির্বাচনের মাধ্যম (Topic Source Selection)' : '1. Topic Source Selection Strategy'}</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {isBn ? 'অভিভাবকের পছন্দ অনুযায়ী এআই প্রশ্ন বাছাই করবে' : 'Select how AI sources questions'}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* One Day Old Topics */}
                  <div
                    onClick={() => setAutoSchedule({ ...autoSchedule, topicStrategy: 'one_day_old' })}
                    className={`cursor-pointer p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      autoSchedule.topicStrategy === 'one_day_old'
                        ? 'border-purple-600 bg-purple-500/10 shadow-sm'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge className="bg-purple-600 text-white text-[10px] font-bold">
                          {isBn ? 'সুপারিশকৃত' : 'Recommended'}
                        </Badge>
                        {autoSchedule.topicStrategy === 'one_day_old' && (
                          <Check className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        {isBn ? 'গতকালকের শেখা পাঠ (১ দিন আগে)' : '1-Day-Old Topics (Spaced Repetition)'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {isBn
                          ? 'স্মৃতিশক্তি স্থায়ী করতে গতকাল স্কুল ও প্রাইভেটে যা শিখেছে, ঠিক ১ দিন পর সেই টপিক থেকে প্রশ্ন তৈরি হবে।'
                          : 'Generates revision tests strictly from topics taught 24 hours ago for optimal memory consolidation.'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 mt-2 block">
                      Spaced Repetition Formula
                    </span>
                  </div>

                  {/* AI Adaptive Weakness Targeting */}
                  <div
                    onClick={() => setAutoSchedule({ ...autoSchedule, topicStrategy: 'ai_adaptive' })}
                    className={`cursor-pointer p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      autoSchedule.topicStrategy === 'ai_adaptive'
                        ? 'border-purple-600 bg-purple-500/10 shadow-sm'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 font-bold">
                          {isBn ? 'এআই বিশ্লেষণ' : 'AI Adaptive'}
                        </Badge>
                        {autoSchedule.topicStrategy === 'ai_adaptive' && (
                          <Check className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        {isBn ? 'টপিক অনুধাবন ও দুর্বলতা ফোকাস' : 'AI Topic Understanding & Weaknesses'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {isBn
                          ? 'বিগত দিনের কুইজে যে যে ধারণায় ঘাটতি দেখা গেছে, এআই তা গভীরভাবে বিশ্লেষণ করে সেই দুর্বলতায় বেশি প্রশ্ন দেবে।'
                          : 'AI assesses topic mastery and crafts quizzes targeting concepts where the student scored lower.'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-2 block">
                      Adaptive Mastery
                    </span>
                  </div>

                  {/* Recent Class Notes & OCR */}
                  <div
                    onClick={() => setAutoSchedule({ ...autoSchedule, topicStrategy: 'recent_notes' })}
                    className={`cursor-pointer p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      autoSchedule.topicStrategy === 'recent_notes'
                        ? 'border-purple-600 bg-purple-500/10 shadow-sm'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge variant="outline" className="text-[10px] border-blue-500/40 text-blue-600 font-bold">
                          {isBn ? 'নোট ও ওসিআর' : 'OCR Notes'}
                        </Badge>
                        {autoSchedule.topicStrategy === 'recent_notes' && (
                          <Check className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        {isBn ? 'সর্বশেষ খাতার নোট ও ওসিআর' : 'Recent Class Notes & OCR'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {isBn
                          ? 'ক্যামেরায় তোলা সাম্প্রতিক খাতার ছবি ও এআই নোটমেকিংয়ের সারসংক্ষেপ থেকে সুনির্দিষ্ট প্রশ্ন তৈরি হবে।'
                          : 'Constructs questions directly from scanned handwritten notebooks and teacher board summaries.'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-2 block">
                      OCR Notebook Synthesis
                    </span>
                  </div>

                  {/* All Subjects Rotation */}
                  <div
                    onClick={() => setAutoSchedule({ ...autoSchedule, topicStrategy: 'all_subjects' })}
                    className={`cursor-pointer p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      autoSchedule.topicStrategy === 'all_subjects'
                        ? 'border-purple-600 bg-purple-500/10 shadow-sm'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {isBn ? 'নিয়মিত চক্র' : 'All Subjects'}
                        </Badge>
                        {autoSchedule.topicStrategy === 'all_subjects' && (
                          <Check className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        {isBn ? 'সকল বিষয়ের সমন্বিত আবর্তন' : 'All Subjects Rotation'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {isBn
                          ? 'গণিত, বিজ্ঞান, ব্যাকরণ ইত্যাদি সকল মূল বিষয়ের সমন্বয়ে ভারসাম্যপূর্ণ নিয়মিত প্রশ্নমালা।'
                          : 'Rotates evenly across curriculum subjects to ensure broad examination readiness.'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground mt-2 block">
                      Full Syllabus Balanced
                    </span>
                  </div>
                </div>
              </div>

              {/* Option 2: Question Count & Timing Strategy (User requirement: Selecting how many questions, tight time for non-math, more time for math/analytical) */}
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                {/* Question Count Selector */}
                <div className="space-y-2.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span>{isBn ? '২. প্রশ্নের সংখ্যা (Number of Questions)' : '2. Question Count'}</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { count: 3, label: isBn ? '৩টি (দ্রুত)' : '3 Qs (Quick)' },
                      { count: 5, label: isBn ? '৫টি (আদর্শ)' : '5 Qs (Standard)', pop: true },
                      { count: 8, label: isBn ? '৮টি (গভীর)' : '8 Qs (Deep)' },
                      { count: 10, label: isBn ? '১০টি (পরীক্ষা)' : '10 Qs (Exam)' },
                    ].map((opt) => (
                      <button
                        key={opt.count}
                        type="button"
                        onClick={() => setAutoSchedule({ ...autoSchedule, questionCount: opt.count })}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all relative flex flex-col items-center justify-center gap-0.5 ${
                          autoSchedule.questionCount === opt.count
                            ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {opt.pop && (
                          <span className={`text-[8px] font-extrabold px-1 rounded uppercase tracking-wider ${autoSchedule.questionCount === opt.count ? 'bg-white/20 text-white' : 'bg-purple-500/15 text-purple-700 dark:text-purple-300'}`}>
                            {isBn ? 'জনপ্রিয়' : 'Best'}
                          </span>
                        )}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timing Strategy (Tight for non-math, generous for math/analytical) */}
                <div className="space-y-2.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-purple-600" />
                    <span>{isBn ? '৩. বুদ্ধিমান সময় বরাদ্দ (Intelligent Timing Allocation)' : '3. Intelligent Timing Strategy'}</span>
                  </label>

                  <div className="space-y-2">
                    {/* AI Smart Dynamic Timing */}
                    <div
                      onClick={() => setAutoSchedule({ ...autoSchedule, timeStrategy: 'ai_dynamic' })}
                      className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${
                        autoSchedule.timeStrategy === 'ai_dynamic'
                          ? 'border-purple-600 bg-purple-500/10 shadow-xs'
                          : 'border-border bg-card hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{isBn ? 'এআই স্মার্ট ডায়নামিক টাইমিং (AI Dynamic Smart Timing)' : 'AI Dynamic Smart Timing'}</span>
                        </span>
                        <Badge className="bg-purple-600 text-white text-[9px] font-bold">
                          {isBn ? 'সুপারিশকৃত' : 'Optimal'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {isBn
                          ? '⚡ সাধারণ ও বর্ণনামূলক প্রশ্নে আঁটসাঁট সময় (৫০ সেকেন্ড/প্রশ্ন - দ্রুত স্মরণের জন্য); 🧮 গণিত ও বিশ্লেষণমূলক প্রশ্নে পর্যাপ্ত সময় (৩ মিনিট/প্রশ্ন - খসড়া ও হিসাবের জন্য)।'
                          : 'Tight time for factual/theory questions (50s each for fast recall); generous time for math/analytical questions (3 mins each for scratchwork).'}
                      </p>
                    </div>

                    {/* Fixed options */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'fixed_10', label: isBn ? '১০ মিনিট ফিক্সড' : 'Fixed 10m' },
                        { id: 'fixed_15', label: isBn ? '১৫ মিনিট ফিক্সড' : 'Fixed 15m' },
                        { id: 'fixed_20', label: isBn ? '২০ মিনিট ফিক্সড' : 'Fixed 20m' },
                      ].map((tOpt) => (
                        <button
                          key={tOpt.id}
                          type="button"
                          onClick={() => setAutoSchedule({ ...autoSchedule, timeStrategy: tOpt.id as any })}
                          className={`p-2 rounded-xl border text-[11px] font-bold transition-all ${
                            autoSchedule.timeStrategy === tOpt.id
                              ? 'border-purple-600 bg-purple-500/10 text-purple-700 dark:text-purple-300'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {tOpt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Schedule Time & Difficulty */}
              <div className="grid sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    {isBn ? 'প্রতিদিন কুইজ প্রস্তুতির সময় (Trigger Time)' : 'Daily Trigger Time'}
                  </label>
                  <input
                    type="time"
                    value={autoSchedule.triggerTime}
                    onChange={(e) => setAutoSchedule({ ...autoSchedule, triggerTime: e.target.value })}
                    className="w-full h-10 border rounded-xl px-3 bg-background text-sm font-semibold"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {isBn ? 'সন্ধ্যা ৭:৩০ বা পড়ার রুটিন শেষে কুইজ তৈরি হবে' : 'Usually scheduled after evening study routines'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    {isBn ? 'প্রশ্নের কাঠিন্য মাত্রা (Difficulty)' : 'Difficulty Level'}
                  </label>
                  <select
                    value={autoSchedule.difficulty}
                    onChange={(e) => setAutoSchedule({ ...autoSchedule, difficulty: e.target.value as any })}
                    className="w-full h-10 border rounded-xl px-3 bg-background text-sm font-semibold"
                  >
                    <option value="mixed">{isBn ? 'মিশ্রিত (সহজ ও মাঝারি সমন্বয় - সুপারিশকৃত)' : 'Mixed (Easy & Medium blend)'}</option>
                    <option value="easy">{isBn ? 'সহজ (মৌলিক ধারণা ঝালাই)' : 'Easy (Fundamental concepts)'}</option>
                    <option value="medium">{isBn ? 'মাঝারি (নিয়মিত পরীক্ষার মান)' : 'Medium (Standard exam level)'}</option>
                    <option value="hard">{isBn ? 'কঠিন (উচ্চতর দক্ষতা ও অলিম্পিয়াড)' : 'Hard (Challenging analytical)'}</option>
                  </select>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-xs text-muted-foreground">
                  {isBn ? 'পরিবর্তনগুলো সন্তানের ড্যাশবোর্ডে স্বয়ংক্রিয়ভাবে কার্যকর হবে।' : 'Changes apply automatically to child portal.'}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowConfig(false)}
                    className="h-9 text-xs rounded-xl"
                  >
                    {isBn ? 'বন্ধ করুন' : 'Close'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSaveSchedule()}
                    disabled={savingSchedule}
                    className="h-9 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{savingSchedule ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'সেটিংস সংরক্ষণ করুন' : 'Save Settings')}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card className="rounded-2xl border p-4 bg-card/60 backdrop-blur shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isBn ? 'মোট কুইজ' : 'Total Quizzes'}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">{toBnNum(quizzes.length)}</p>
          </Card>
          <Card className="rounded-2xl border p-4 bg-card/60 backdrop-blur shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isBn ? 'অ্যাসাইনকৃত' : 'Pending / Assigned'}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {toBnNum(assignedCount)}
            </p>
          </Card>
          <Card className="rounded-2xl border p-4 bg-card/60 backdrop-blur shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isBn ? 'সম্পন্ন' : 'Completed'}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {toBnNum(completedCount)}
            </p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 border-b pb-2">
          {(['all', 'assigned', 'completed', 'draft'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                filter === st
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {st === 'all'
                ? (isBn ? 'সকল কুইজ' : 'All')
                : st === 'assigned'
                ? (isBn ? 'অ্যাসাইনকৃত' : 'Assigned')
                : st === 'completed'
                ? (isBn ? 'সম্পন্ন' : 'Completed')
                : (isBn ? 'খসড়া' : 'Draft')}
            </button>
          ))}
        </div>

        {/* Quizzes List */}
        {loading ? (
          <CardGridSkeleton count={6} />
        ) : filteredQuizzes.length === 0 ? (
          <Card className="rounded-2xl border p-12 text-center">
            <p className="text-sm text-muted-foreground">
              {isBn ? 'কোনো কুইজ পাওয়া যায়নি' : 'No quizzes found.'}
            </p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((q) => {
            const isCompleted = q.status === 'completed';
            const isAssigned = q.status === 'assigned';
            const isAuto = q.isAutoScheduled || q.title?.includes('স্বয়ংক্রিয়') || q.title?.includes('Auto') || q.scopeJson?.topicAge === '1-day-old';

            return (
              <Card
                key={q.id}
                className={`rounded-2xl border bg-card hover:shadow-md transition-all flex flex-col justify-between ${
                  isAuto ? 'border-purple-500/40 ring-1 ring-purple-500/20' : ''
                }`}
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {q.subject || 'General'}
                      </Badge>

                      {isAuto && (
                        <Badge className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold gap-1 shadow-2xs">
                          <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
                          <span>{isBn ? 'অটো-শিডিউলড' : 'Auto-Scheduled'}</span>
                        </Badge>
                      )}
                    </div>

                    <Badge
                      variant={isCompleted ? 'default' : isAssigned ? 'secondary' : 'outline'}
                      className={`text-[10px] capitalize font-semibold ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isAssigned
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          : ''
                      }`}
                    >
                      {q.status}
                    </Badge>
                  </div>

                  <CardTitle className="text-base font-bold text-foreground mt-2 line-clamp-2">
                    {q.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5 text-primary" />
                      {toBnNum(q.questionCount || q.questions?.length || 5)} {isBn ? 'টি প্রশ্ন' : 'Questions'}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{q.difficulty || 'mixed'}</span>
                    {q.timeLimitMin && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Clock className="w-3 h-3 text-purple-600" />
                          {toBnNum(q.timeLimitMin)}m
                        </span>
                      </>
                    )}
                  </div>

                  {/* Smart Timing breakdown or Spaced Repetition tag if auto */}
                  {isAuto && (
                    <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-semibold text-purple-700 dark:text-purple-300">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          {isBn ? 'স্মার্ট টাইমিং ও স্পেসড রিপিটেশন' : 'Smart Timing Breakdown'}
                        </span>
                        <span className="text-[10px] bg-purple-500/15 px-1.5 py-0.5 rounded font-bold">
                          {isBn ? '১ দিন আগের পাঠ' : '1-Day-Old'}
                        </span>
                      </div>
                      {q.timingBreakdown ? (
                        <p className="text-muted-foreground text-[10px]">
                          {isBn
                            ? `গণিত/বিশ্লেষণ: ${toBnNum(q.timingBreakdown.mathCount)}টি (৩ মি./প্রশ্ন) • সাধারণ: ${toBnNum(q.timingBreakdown.nonMathCount)}টি (৫০ সে./প্রশ্ন)`
                            : `Math: ${q.timingBreakdown.mathCount} (3m/q) • Non-Math: ${q.timingBreakdown.nonMathCount} (50s/q)`}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-[10px]">
                          {isBn
                            ? 'গণিতে পর্যাপ্ত সময় ও বর্ণনামূলক প্রশ্নে আঁটসাঁট সময় বরাদ্দ'
                            : 'Generous time for math, tight time for recall'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Score if completed */}
                  {isCompleted && q.score !== null && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        {isBn ? 'অর্জিত স্কোর' : 'Score Achieved'}
                      </span>
                      <strong className="text-emerald-700 dark:text-emerald-300 font-extrabold text-sm">
                        {toBnNum(q.score)}/{toBnNum(q.maxScore || 10)} ({toBnNum(Math.round(((q.score || 0) / (q.maxScore || 10)) * 100))}%)
                      </strong>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t flex items-center gap-2">
                    {isCompleted ? (
                      <Link href={`/attempts/${q.attemptId || 'att-1'}/results`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isBn ? 'ফলাফল ও এআই বিশ্লেষণ' : 'View AI Results'}</span>
                        </Button>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <Link href={`/quizzes/${q.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isBn ? 'প্রশ্ন পর্যালোচনা' : 'Preview'}</span>
                          </Button>
                        </Link>
                        <div className="flex-1 flex items-center justify-center">
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 w-full text-center">
                            {isBn ? 'শিক্ষার্থীর পেন্ডিং' : 'Student Pending'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        )}
      </div>
    </AppShell>
  );
}
