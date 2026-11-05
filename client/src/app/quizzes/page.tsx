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

function QuizzesPageContent() {
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
    questionCount: 20,
    timeStrategy: 'ai_dynamic',
    triggerTime: '19:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    subjects: ['All'],
    difficulty: 'mixed',
  });
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [scheduleLoadFailed, setScheduleLoadFailed] = useState(false);
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
                  title: t('quizzes.text'),
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
                  title: t('quizzes.text_2'),
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
                  title: t('quizzes.unit_6_eat_healthy_vocabulary'),
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
                  title: t('quizzes.text_3'),
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
                  title: t('quizzes.text_4'),
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
                  title: t('quizzes.text_5'),
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
                title: t('quizzes.text'),
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
                title: t('quizzes.text_2'),
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
                title: t('quizzes.text_3'),
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
                title: t('quizzes.text_4'),
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
    setScheduleLoadFailed(false);
    if (!childId) {
      setLoadingSchedule(false);
      return;
    }
    try {
      const res = await api.get(`/children/${childId}/quizzes/auto-schedule`);
      if (!res.data?.data) throw new Error('Missing schedule settings');
      setAutoSchedule(res.data.data);
      setScheduleMsg(null);
    } catch {
      // A failed read must not overwrite a student's existing saved schedule.
      setScheduleLoadFailed(true);
      setScheduleMsg({ type: 'error', text: t('quizzes.scheduleLoadError') });
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
    if (!childId || savingSchedule || runningAutoQuiz || loadingSchedule || scheduleLoadFailed) return;
    setSavingSchedule(true);
    setScheduleMsg(null);
    const toSave = overrides ? { ...autoSchedule, ...overrides } : autoSchedule;
    try {
      const res = await api.post(`/children/${childId}/quizzes/auto-schedule`, toSave);
      if (!res.data?.data) throw new Error('The server did not return the saved quiz settings.');
      setAutoSchedule(res.data.data);
      setScheduleMsg({
        type: 'success',
        text: t('quizzes.text_6'),
      });
      setTimeout(() => setScheduleMsg(null), 5000);
    } catch (err: any) {
      setScheduleMsg({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || (t('quizzes.text_7')),
      });
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleRunAutoQuiz = async () => {
    if (!childId || runningAutoQuiz || savingSchedule || loadingSchedule || scheduleLoadFailed) return;
    setRunningAutoQuiz(true);
    setScheduleMsg(null);
    try {
      // Run the options currently shown, not a stale server-side configuration.
      const saved = await api.post(`/children/${childId}/quizzes/auto-schedule`, autoSchedule);
      if (!saved.data?.data) throw new Error('Could not save the selected quiz settings.');
      setAutoSchedule(saved.data.data);
      const res = await api.post(`/children/${childId}/quizzes/auto-schedule/run`);
      const quiz = res.data?.data?.quiz;
      const timingInfo = res.data?.data?.timingInfo;
      const config = res.data?.data?.config;
      if (!quiz?.id) throw new Error('The server did not return a generated quiz.');

      if (config) {
        setAutoSchedule(config);
      }

      // Prepend to quizzes list immediately
      setQuizzes((prev) => [quiz, ...prev.filter((q) => q.id !== quiz.id)]);

      setScheduleMsg({
        type: 'success',
        text: t('quizzes.autoGenerated', { count: toBnNum(quiz.questionCount || quiz.questions?.length || 0), topics: toBnNum(quiz.scopeJson?.topicsCovered?.length || 0) }),
        details: timingInfo,
      });
    } catch (err: any) {
      setScheduleMsg({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || (t('quizzes.text_8')),
      });
    } finally {
      setRunningAutoQuiz(false);
    }
  };

  const handleToggleEnable = (newVal: boolean) => {
    void handleSaveSchedule({ enabled: newVal });
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
              {t('quizzes.custom_quizzes_and_spaced_repetition_auto_schedu', { p0: childName }, `Custom quizzes and spaced repetition auto-scheduler for ${childName}`)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Which child these quizzes belong to. The selector also keeps the URL in
                sync, so `/children/<id>/quizzes/new` targets the same child. */}
            <ChildSelector
              label={t('quizzes.text_9')}
              className="mr-1"
            />
            {childId && (
            <Link href={`/children/${childId}/quizzes/new`}>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-9">
                <Plus className="w-4 h-4" />
                <span>{t('quizzes.text_10')}</span>
              </Button>
            </Link>
            )}
            <Button
              size="sm"
              onClick={handleRunAutoQuiz}
              disabled={runningAutoQuiz || savingSchedule || loadingSchedule || scheduleLoadFailed || !childId}
              className="gap-1.5 text-xs h-9 bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-500/20"
            >
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>{runningAutoQuiz ? (t('quizzes.text_11')) : (t('quizzes.text_12'))}</span>
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
                      {t('quizzes.text_13')}
                    </CardTitle>
                    <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold">
                      {t('quizzes.text_14')}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    {t('quizzes.text_15')}
                  </CardDescription>
                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mt-1">
                    {t('quizzes.autoSummary', { count: toBnNum(autoSchedule.questionCount), source: t(`quizzes.${({ one_day_old: 'text_28', ai_adaptive: 'text_31', recent_notes: 'text_34', all_subjects: 'text_37' })[autoSchedule.topicStrategy]}`) })}
                  </p>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap w-full lg:w-auto">
                {/* Active / Paused Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card text-xs">
                  <span className="text-muted-foreground font-medium text-[11px]">
                    {t('quizzes.text_16')}
                  </span>
                  {autoSchedule.enabled ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {t('quizzes.auto_taking_on')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                      {t('quizzes.paused')}
                    </span>
                  )}
                </div>

                {/* Enable/Disable Toggle */}
                <Button
                  size="sm"
                  disabled={loadingSchedule || scheduleLoadFailed || savingSchedule || runningAutoQuiz || !childId}
                  variant={autoSchedule.enabled ? 'outline' : 'default'}
                  onClick={() => handleToggleEnable(!autoSchedule.enabled)}
                  className={`h-9 text-xs font-bold rounded-xl ${
                    autoSchedule.enabled
                      ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {autoSchedule.enabled
                    ? (t('quizzes.text_17'))
                    : (t('quizzes.text_18'))}
                </Button>

                {/* Configure Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConfig(!showConfig)}
                  className="h-9 text-xs font-bold rounded-xl gap-1.5"
                >
                  <Settings2 className="w-3.5 h-3.5 text-primary" />
                  <span>{t('quizzes.text_19')}</span>
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
                  <span>{runningAutoQuiz ? (t('quizzes.text_20')) : (t('quizzes.text_21'))}</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Feedback & Smart Timing Message */}
          {scheduleMsg && (
            <div className="mx-5 sm:mx-6 mb-4 p-4 rounded-2xl bg-card border border-purple-500/30 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                {scheduleMsg.type === 'error' ? <AlertCircle className="w-4 h-4 text-destructive shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                <span>{scheduleMsg.text}</span>
                {scheduleLoadFailed && <Button type="button" variant="outline" size="sm" disabled={loadingSchedule} onClick={loadSchedule}>{t('common.retry', 'Retry')}</Button>}
              </div>
              {scheduleMsg.details && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-purple-700 dark:text-purple-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t('quizzes.ai_smart_dynamic_timing_breakdown')}</span>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="p-2 rounded-lg bg-card border">
                      <span className="text-muted-foreground block">{t('quizzes.text_22')}</span>
                      <strong className="text-foreground">{toBnNum(scheduleMsg.details.mathCount)}টি × ৩ মিনিট = {toBnNum(scheduleMsg.details.mathCount * 3)} মিনিট</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-card border">
                      <span className="text-muted-foreground block">{t('quizzes.text_23')}</span>
                      <strong className="text-foreground">{toBnNum(scheduleMsg.details.nonMathCount)}টি × ৫০ সেকেন্ড = {toBnNum(Math.round((scheduleMsg.details.nonMathCount * 50) / 60))} মিনিট</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-600 text-white font-bold flex flex-col justify-center">
                      <span className="text-[10px] text-purple-200 block">{t('quizzes.text_24')}</span>
                      <span className="text-sm">{toBnNum(scheduleMsg.details.minutes)} {t('quizzes.text_25')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Configuration Form (Collapsible / Expandable) */}
          {showConfig && (
            <CardContent className="p-5 sm:p-6 pt-0 border-t border-purple-500/15 bg-card/40 space-y-6 animate-in fade-in duration-200">
              <fieldset disabled={loadingSchedule || scheduleLoadFailed || savingSchedule || runningAutoQuiz || !childId} className="space-y-6 min-w-0">
              {/* Option 1: Topic Strategy Selection (User requirement: Mainly topics that are 1 day old, AI analysis on topic understanding) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>{t('quizzes.topic_source_selection')}</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {t('quizzes.text_26')}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Yesterday's class notes: all logged topics and attached notes */}
                  <button
                    type="button"
                    aria-pressed={autoSchedule.topicStrategy === 'one_day_old'}
                    onClick={() => setAutoSchedule({ ...autoSchedule, topicStrategy: 'one_day_old' })}
                    className={`text-left cursor-pointer p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      autoSchedule.topicStrategy === 'one_day_old'
                        ? 'border-purple-600 bg-purple-500/10 shadow-sm'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge className="bg-purple-600 text-white text-[10px] font-bold">
                          {t('quizzes.text_27')}
                        </Badge>
                        {autoSchedule.topicStrategy === 'one_day_old' && (
                          <Check className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        {t('quizzes.text_28')}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {t('quizzes.text_29')}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 mt-2 block">
                      {t('quizzes.allYesterdayTopics')}
                    </span>
                  </button>

                  {/* AI Adaptive Weakness Targeting */}
                  <button
                    type="button"
                    aria-pressed={autoSchedule.topicStrategy === 'ai_adaptive'}
                    onClick={() => setAutoSchedule({ ...autoSchedule, topicStrategy: 'ai_adaptive' })}
                    className={`text-left cursor-pointer p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      autoSchedule.topicStrategy === 'ai_adaptive'
                        ? 'border-purple-600 bg-purple-500/10 shadow-sm'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 font-bold">
                          {t('quizzes.text_30')}
                        </Badge>
                        {autoSchedule.topicStrategy === 'ai_adaptive' && (
                          <Check className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        {t('quizzes.text_31')}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {t('quizzes.text_32')}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-2 block">
                      Adaptive Mastery
                    </span>
                  </button>

                  {/* Recent Class Notes & OCR */}
                  <button
                    type="button"
                    aria-pressed={autoSchedule.topicStrategy === 'recent_notes'}
                    onClick={() => setAutoSchedule({ ...autoSchedule, topicStrategy: 'recent_notes' })}
                    className={`text-left cursor-pointer p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      autoSchedule.topicStrategy === 'recent_notes'
                        ? 'border-purple-600 bg-purple-500/10 shadow-sm'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge variant="outline" className="text-[10px] border-blue-500/40 text-blue-600 font-bold">
                          {t('quizzes.text_33')}
                        </Badge>
                        {autoSchedule.topicStrategy === 'recent_notes' && (
                          <Check className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        {t('quizzes.text_34')}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {t('quizzes.text_35')}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-2 block">
                      OCR Notebook Synthesis
                    </span>
                  </button>

                  {/* All Subjects Rotation */}
                  <button
                    type="button"
                    aria-pressed={autoSchedule.topicStrategy === 'all_subjects'}
                    onClick={() => setAutoSchedule({ ...autoSchedule, topicStrategy: 'all_subjects' })}
                    className={`text-left cursor-pointer p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      autoSchedule.topicStrategy === 'all_subjects'
                        ? 'border-purple-600 bg-purple-500/10 shadow-sm'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {t('quizzes.text_36')}
                        </Badge>
                        {autoSchedule.topicStrategy === 'all_subjects' && (
                          <Check className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        {t('quizzes.text_37')}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {t('quizzes.text_38')}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground mt-2 block">
                      Full Syllabus Balanced
                    </span>
                  </button>
                </div>
              </div>

              {/* Option 2: Question Count & Timing Strategy (User requirement: Selecting how many questions, tight time for non-math, more time for math/analytical) */}
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                {/* Question Count Selector */}
                <div className="space-y-2.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span>{t('quizzes.number_of_questions')}</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 5, 8, 10, 15, 20, 30, 50].map((count) => ({ count, pop: count === 20 })).map((opt) => (
                      <button
                        key={opt.count}
                        type="button"
                        aria-pressed={autoSchedule.questionCount === opt.count}
                        onClick={() => setAutoSchedule({ ...autoSchedule, questionCount: opt.count })}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all relative flex flex-col items-center justify-center gap-0.5 ${
                          autoSchedule.questionCount === opt.count
                            ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {opt.pop && (
                          <span className={`text-[8px] font-extrabold px-1 rounded uppercase tracking-wider ${autoSchedule.questionCount === opt.count ? 'bg-white/20 text-white' : 'bg-purple-500/15 text-purple-700 dark:text-purple-300'}`}>
                            {t('quizzes.text_43')}
                          </span>
                        )}
                        <span>{t('quizzes.mcqCount', { count: toBnNum(opt.count) })}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{t('quizzes.coverageHint')}</p>
                </div>

                {/* Timing Strategy (Tight for non-math, generous for math/analytical) */}
                <div className="space-y-2.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-purple-600" />
                    <span>{t('quizzes.intelligent_timing_allocation')}</span>
                  </label>

                  <div className="space-y-2">
                    {/* AI Smart Dynamic Timing */}
                    <button type="button" aria-pressed={autoSchedule.timeStrategy === 'ai_dynamic'}
                      onClick={() => setAutoSchedule({ ...autoSchedule, timeStrategy: 'ai_dynamic' })}
                      className={`w-full text-left cursor-pointer p-3 rounded-xl border-2 transition-all ${
                        autoSchedule.timeStrategy === 'ai_dynamic'
                          ? 'border-purple-600 bg-purple-500/10 shadow-xs'
                          : 'border-border bg-card hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t('quizzes.ai_dynamic_smart_timing')}</span>
                        </span>
                        <Badge className="bg-purple-600 text-white text-[9px] font-bold">
                          {t('quizzes.text_27')}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {t('quizzes.text_44')}
                      </p>
                    </button>

                    {/* Fixed options */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'fixed_10', label: t('quizzes.text_45') },
                        { id: 'fixed_15', label: t('quizzes.text_46') },
                        { id: 'fixed_20', label: t('quizzes.text_47') },
                      ].map((tOpt) => (
                        <button
                          key={tOpt.id}
                          type="button"
                          aria-pressed={autoSchedule.timeStrategy === tOpt.id}
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
                    {t('quizzes.trigger_time')}
                  </label>
                  <input
                    type="time"
                    value={autoSchedule.triggerTime}
                    onChange={(e) => setAutoSchedule({ ...autoSchedule, triggerTime: e.target.value })}
                    className="w-full h-10 border rounded-xl px-3 bg-background text-sm font-semibold"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {t('quizzes.text_48')}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    {t('quizzes.difficulty')}
                  </label>
                  <select
                    value={autoSchedule.difficulty}
                    onChange={(e) => setAutoSchedule({ ...autoSchedule, difficulty: e.target.value as any })}
                    className="w-full h-10 border rounded-xl px-3 bg-background text-sm font-semibold"
                  >
                    <option value="mixed">{t('quizzes.text_49')}</option>
                    <option value="easy">{t('quizzes.text_50')}</option>
                    <option value="medium">{t('quizzes.text_51')}</option>
                    <option value="hard">{t('quizzes.text_52')}</option>
                  </select>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-xs text-muted-foreground">
                  {t('quizzes.text_53')}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowConfig(false)}
                    className="h-9 text-xs rounded-xl"
                  >
                    {t('quizzes.text_54')}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSaveSchedule()}
                    disabled={savingSchedule || runningAutoQuiz || loadingSchedule || scheduleLoadFailed || !childId}
                    className="h-9 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{savingSchedule ? (t('quizzes.text_55')) : (t('quizzes.text_56'))}</span>
                  </Button>
                </div>
              </div>
              </fieldset>
            </CardContent>
          )}
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card className="rounded-2xl border p-4 bg-card/60 backdrop-blur shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('quizzes.text_57')}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">{toBnNum(quizzes.length)}</p>
          </Card>
          <Card className="rounded-2xl border p-4 bg-card/60 backdrop-blur shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('quizzes.text_58')}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {toBnNum(assignedCount)}
            </p>
          </Card>
          <Card className="rounded-2xl border p-4 bg-card/60 backdrop-blur shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('quizzes.text_59')}
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
                ? (t('quizzes.text_60'))
                : st === 'assigned'
                ? (t('quizzes.text_58'))
                : st === 'completed'
                ? (t('quizzes.text_59'))
                : (t('quizzes.text_61'))}
            </button>
          ))}
        </div>

        {/* Quizzes List */}
        {loading ? (
          <CardGridSkeleton count={6} />
        ) : filteredQuizzes.length === 0 ? (
          <Card className="rounded-2xl border p-12 text-center">
            <p className="text-sm text-muted-foreground">
              {t('quizzes.text_62')}
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
                          <span>{t('quizzes.text_63')}</span>
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
                      {toBnNum(q.questionCount || q.questions?.length || 5)} {t('quizzes.text_64')}
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
                          {t('quizzes.text_65')}
                        </span>
                        <span className="text-[10px] bg-purple-500/15 px-1.5 py-0.5 rounded font-bold">
                          {q.scopeJson?.strategy === 'one_day_old' ? t('quizzes.text_66') : t('quizzes.text_63')}
                        </span>
                      </div>
                      {q.timingBreakdown ? (
                        <p className="text-muted-foreground text-[10px]">
                          {t('quizzes.math_3m_q_non_math_50s_q', { p0: isBn ? toBnNum(q.timingBreakdown.mathCount) : q.timingBreakdown.mathCount, p1: isBn ? toBnNum(q.timingBreakdown.nonMathCount) : q.timingBreakdown.nonMathCount }, `Math: ${q.timingBreakdown.mathCount} (3m/q) • Non-Math: ${q.timingBreakdown.nonMathCount} (50s/q)`)}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-[10px]">
                          {t('quizzes.text_67')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Score if completed */}
                  {isCompleted && q.score !== null && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        {t('quizzes.text_68')}
                      </span>
                      <strong className="text-emerald-700 dark:text-emerald-300 font-extrabold text-sm">
                        {toBnNum(q.score)}/{toBnNum(q.maxScore || 10)} ({toBnNum(Math.round(((q.score || 0) / (q.maxScore || 10)) * 100))}%)
                      </strong>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t flex items-center gap-2">
                    {isCompleted ? (
                      // The server now attaches the child's most recent attempt to
                      // each quiz. The old fallback was the literal id 'att-1', which
                      // is not a real attempt — every real quiz's results page errored.
                      // If somehow there is still no attempt id, do not link to
                      // `/attempts/undefined/results`.
                      q.attemptId ? (
                        <Link href={`/attempts/${q.attemptId}/results`} className="w-full">
                          <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1.5">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('quizzes.text_69')}</span>
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="w-full text-xs h-8 gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t('quizzes.text_69')}</span>
                        </Button>
                      )
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <Link href={`/quizzes/${q.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('quizzes.text_70')}</span>
                          </Button>
                        </Link>
                        <div className="flex-1 flex items-center justify-center">
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 w-full text-center">
                            {t('quizzes.text_71')}
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

/** A navbar student switch starts a fresh draft and isolates in-flight requests. */
export default function QuizzesPage() {
  const { activeChild, childrenList } = useAuth();
  const childId = activeChild?.id || childrenList[0]?.id || null;
  return <QuizzesPageContent key={childId || 'no-child'} />;
}
