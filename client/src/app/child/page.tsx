'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KidShell } from '@/components/layout/kid-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useChildScope } from '@/components/auth/use-child-scope';
import { useI18n } from '@/lib/i18n-context';
import { getInstitutionType, getInstitutionInfo } from '@/lib/institution';
import { api } from '@/lib/api';
import { MonthlyActivityCalendar } from '@/components/charts/study-time-chart';
import {
  Flame,
  Brain,
  BookOpen,
  Award,
  Clock,
  ArrowRight,
  Calendar,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

function toBnNum(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
}

export default function KidDashboard() {
  const { activeChild, user } = useAuth();
  const { t, isBn } = useI18n();

  // The child this session acts for, and which demo dataset (if any) applies.
  //
  // The old code fell back to `user?.id` — the **parent's** user id — and then to a
  // hardcoded `'demo-child-1'`. Both were wrong: a parent session asked the server
  // about a child that does not exist, and a new account with no children was shown
  // the demo student's data.
  const { childId, isTasnim, isFahim, isDemoChild } = useChildScope();
  const studentGrade = user?.grade || activeChild?.grade || (isFahim ? 'Class 11' : isTasnim ? 'Class 5' : 'Class 8');
  const institutionType = getInstitutionType(studentGrade);
  const instInfo = getInstitutionInfo(institutionType, t);

  const [summary, setSummary] = useState<any>(null);
  const [topics, setTopics] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [consistency, setConsistency] = useState<Record<string, number>>({});
  const [hasPendingLog, setHasPendingLog] = useState(true);
  const [loading, setLoading] = useState(true);

  /**
   * The locale is read through a ref instead of being an effect dependency.
   *
   * `isBn` used to be in the dependency array, so toggling the UI language
   * re-fired all five dashboard requests. The locale only affects the *copy* of
   * the demo fallback, so it is read at call time instead.
   */
  const isBnRef = useRef(isBn);
  useEffect(() => {
    isBnRef.current = isBn;
  }, [isBn]);

  useEffect(() => {
    let cancelled = false;
    setSummary(null);
    setTopics(null);
    // No child to act for — there is nothing to load, and nothing to fake.
    if (!childId) {
      setQuizzes([]);
      setConsistency({});
      setLoading(false);
      return;
    }
    setLoading(true);

    /**
     * The mock fallback below is for the **demo tenant only**.
     *
     * It used to fire for every child, so a brand-new account with no data was shown
     * the demo student's KPIs. The demo dataset is now opt-in: the server marks the
     * three seeded children with a `demoProfile`, and only those get mock numbers.
     */
    const mockSummary = () =>
      setSummary({
        kpis: isFahim
          ? { studyDays: 6, totalTime: 1560, streak: 7, quizzes: 4, avgScore: 92 }
          : isTasnim
          ? { studyDays: 6, totalTime: 1080, streak: 6, quizzes: 6, avgScore: 95 }
          : { studyDays: 6, totalTime: 1350, streak: 6, quizzes: 5, avgScore: 88 },
      });

    // 1. Summary & KPIs
    api
      .get(`/children/${childId}/dashboard/summary`)
      .then((r) => {
        if (cancelled) return;
        if (r.data?.data?.kpis) {
          setSummary(r.data.data);
        } else if (isDemoChild) {
          mockSummary();
        } else {
          // A real child with no data yet: an empty state, not invented numbers.
          setSummary(r.data?.data ?? null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (isDemoChild) mockSummary();
        else setSummary(null);
      });

    // 2. Quizzes
    const mockQuizzes = () =>
      setQuizzes(
        isTasnim
          ? [
              {
                id: 'q-t2',
                title: isBnRef.current ? 'প্রাথমিক বিজ্ঞান: জীবনের জন্য পানি বিশুদ্ধকরণ' : 'Primary Science: Safe Water & Purification',
                status: 'assigned',
                questionCount: 5,
                timeLimitMin: 15,
                isNew: true,
              },
              {
                id: 'q-t1',
                title: isBnRef.current ? 'প্রাথমিক গণিত: গুণনীয়ক ও লসাগু-গসাগু কুইজ' : 'Primary Math: Factors & LCM-HCF Quiz',
                status: 'completed',
                questionCount: 5,
                score: 95,
              },
            ]
          : [
              {
                id: 'q-r2',
                title: isBnRef.current ? 'পদার্থবিজ্ঞান: গতির সমীকরণ ও ত্বরণ' : 'Physics: Equations of Motion & Acceleration',
                status: 'assigned',
                questionCount: 5,
                timeLimitMin: 15,
                isNew: true,
              },
              {
                id: 'q-r1',
                title: isBnRef.current ? 'গণিত: বীজগাণিতিক সূত্রাবলী ও প্রয়োগ কুইজ' : 'Class 8 Math: Algebraic Formulae Quiz',
                status: 'completed',
                questionCount: 5,
                score: 85,
              },
              {
                id: 'q-r3',
                title: isBnRef.current ? 'ইংরেজি: Right Forms of Verbs & Prepositions' : 'English: Right Forms of Verbs & Prepositions',
                status: 'completed',
                questionCount: 5,
                score: 80,
              },
            ]
      );

    api
      .get(`/children/${childId}/quizzes`)
      .then((r) => {
        if (cancelled) return;
        const list = r.data?.data;
        if (list && list.length > 0) {
          setQuizzes(list);
        } else if (isDemoChild) {
          mockQuizzes();
        } else {
          // A real child with no quizzes yet — an empty list, not invented quizzes.
          setQuizzes([]);
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (isDemoChild) mockQuizzes();
        else setQuizzes([]);
      });

    // 3. Consistency (for MonthlyActivityCalendar)
    const mockConsistency = () => {
      const out: Record<string, number> = {};
      for (let i = 0; i < 180; i++) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        out[d] = isTasnim ? (i % 2 === 0 ? 1 : i % 5 === 0 ? 0 : 1) : (i % 7 === 0 ? 0 : i % 4 === 0 ? 2 : 1);
      }
      setConsistency(out);
    };

    api
      .get(`/children/${childId}/dashboard/consistency`)
      .then((r) => {
        if (cancelled) return;
        if (r.data?.data && Object.keys(r.data.data).length > 0) {
          setConsistency(r.data.data);
        } else if (isDemoChild) {
          mockConsistency();
        } else {
          setConsistency({});
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (isDemoChild) mockConsistency();
        else setConsistency({});
      });

    // Topic mastery replaces the recent study-log feed on the dashboard.
    const fallbackTopics = isFahim
      ? {
          weakest: [
            { subject: isBnRef.current ? 'উচ্চতর গণিত ১ম পত্র (ম্যাট্রিক্স)' : 'Higher Math (Matrix)', accuracy: 68 },
            { subject: isBnRef.current ? 'পদার্থবিজ্ঞান ১ম পত্র (ভেক্টর গুণন)' : 'Physics 1st (Vectors)', accuracy: 72 },
          ],
          strongest: [
            { subject: isBnRef.current ? 'আইসিটি (সংখ্যা পদ্ধতি)' : 'ICT (Number Systems)', accuracy: 96 },
            { subject: isBnRef.current ? 'রসায়ন ১ম পত্র (গুণগত রসায়ন)' : 'Chemistry 1st (Qualitative)', accuracy: 94 },
          ],
        }
      : isTasnim
      ? {
          weakest: [
            { subject: isBnRef.current ? 'প্রাথমিক বিজ্ঞান (জীবনের জন্য পানি)' : 'Science (Safe Water)', accuracy: 74 },
            { subject: isBnRef.current ? 'প্রাথমিক গণিত (ভগ্নাংশ)' : 'Math (Fractions)', accuracy: 78 },
          ],
          strongest: [
            { subject: isBnRef.current ? 'প্রাথমিক গণিত (লসাগু ও গসাগু)' : 'Math (LCM & HCF)', accuracy: 95 },
            { subject: isBnRef.current ? 'বাংলাদেশ ও বিশ্বপরিচয়' : 'BGS (Liberation War)', accuracy: 92 },
          ],
        }
      : {
          weakest: [
            { subject: isBnRef.current ? 'সাধারণ গণিত (বীজগণিত ৪.১)' : 'Math (Algebra 4.1)', accuracy: 70 },
            { subject: isBnRef.current ? 'ইংরেজি ১ম পত্র (Prepositions)' : 'English (Prepositions)', accuracy: 75 },
          ],
          strongest: [
            { subject: isBnRef.current ? 'সাধারণ বিজ্ঞান (গতির সূত্র)' : 'Science (Motion Laws)', accuracy: 92 },
            { subject: isBnRef.current ? 'বাংলা ১ম পত্র (কবিতা)' : 'Bangla 1st Paper', accuracy: 88 },
          ],
        };

    api
      .get(`/children/${childId}/dashboard/topics`)
      .then((response) => {
        if (cancelled) return;
        const result = response.data?.data;
        setTopics(result && (result.weakest || result.strongest)
          ? result
          : isDemoChild ? fallbackTopics : null);
      })
      .catch(() => {
        if (!cancelled) setTopics(isDemoChild ? fallbackTopics : null);
      });

    // 4. Check if today's class logs are pending
    api
      .get(`/children/${childId}/entries`)
      .then((r) => {
        if (cancelled) return;
        const raw = r.data?.data;
        const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        const todayStr = new Date().toISOString().slice(0, 10);
        const loggedToday = list.some((e: any) => {
          try {
            const d = typeof e.date === 'string' ? e.date.slice(0, 10) : new Date(e.date).toISOString().slice(0, 10);
            return d === todayStr;
          } catch {
            return false;
          }
        });
        setHasPendingLog(!loggedToday);
      })
      .catch(() => {
        if (!cancelled) setHasPendingLog(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `isBn` is deliberately NOT a dependency — it is read through `isBnRef` at
    // call time. Including it re-fired all five requests on every locale toggle.
  }, [childId, isTasnim, isFahim, isDemoChild]);

  // Preserve legitimate zero values and quiz-only activity; missing KPIs are zero.
  const kpis = {
    studyDays: summary?.kpis?.studyDays ?? 0,
    totalTime: summary?.kpis?.totalTime ?? 0,
    quizzes: summary?.kpis?.quizzes ?? 0,
    avgScore: summary?.kpis?.avgScore ?? 0,
    streak: summary?.kpis?.streak ?? 0,
  };
  const hours = Math.floor(kpis.totalTime / 60);
  const minutes = kpis.totalTime % 60;

  const studentName = activeChild?.name || user?.name || (isTasnim ? 'Tasnim Islam' : 'Rahim Ahmed');
  const pendingQuizzes = (Array.isArray(quizzes) ? quizzes : []).filter((q) => q.status === 'assigned' || q.isNew || !q.score);
  const pendingCount = pendingQuizzes.length || (isDemoChild ? (isTasnim ? 1 : 2) : 0);
  const firstPendingQuiz =
    pendingQuizzes[0] ||
    (isDemoChild
      ? isTasnim
        ? { title: t('childHome.pending_quiz_title') }
        : { title: t('childHome.text_2') }
      : null);

  return (
    <KidShell>
      <div className="space-y-6">
        {/* Welcome Greeting Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 text-white shadow-xl shadow-indigo-500/10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                🔥 {t('childHome.day_streak', { p0: isBn ? toBnNum(kpis.streak) : kpis.streak }, `${kpis.streak}-Day Streak`)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {t('childHome.what_did_you_learn_today', { p0: studentName }, `${studentName}, what did you learn today?`)}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              {t('childHome.text_3')}
            </p>
          </div>
        </div>

        {/* Action Banners after Dashboard Banner */}
        <div className="space-y-3.5">
          {/* 1. Pending Quizzes Available Banner (Clicking navigates to /child/quiz) */}
          <Link href="/child/quiz" className="block group">
            <div className="p-4 sm:p-5 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-amber-500/10 hover:border-indigo-500/50 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/25 group-hover:scale-105 transition-transform">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-extrabold text-foreground group-hover:text-primary transition-colors">
                      {t('childHome.pending_ai_quiz_ready_for_you', { p0: isBn ? toBnNum(pendingCount) : pendingCount, p1: pendingCount > 1 ? 'zes' : '' }, `${pendingCount} Pending AI Quiz${pendingCount > 1 ? 'zes' : ''} Ready For You!`)}
                    </h3>
                    <Badge className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 animate-pulse shadow-xs">
                      {t('childHome.pending', { p0: isBn ? toBnNum(pendingCount) : pendingCount }, `${pendingCount} Pending`)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">
                    {firstPendingQuiz
                      ? t('childHome.latest_click_to_open_quiz_page_test_your_mastery', { p0: firstPendingQuiz.title }, `Latest: "${firstPendingQuiz.title}" — Click to open Quiz page & test your mastery`)
                      : t('childHome.text_4')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <Button
                  size="sm"
                  className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  <span>{t('childHome.text_5')}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </div>
          </Link>

          {/* 2. Pending Class Log Banner (Prominent Action Button if class log is pending) */}
          {hasPendingLog && (
            <div className="p-4 sm:p-5 rounded-3xl border border-amber-500/35 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/10 hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                      {t('childHome.text_6')}
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-bold border-amber-500/40 text-amber-600 bg-amber-500/15">
                      {t('childHome.text_7')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('childHome.text_8')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <Link href="/child/schedule">
                  <Button
                    size="sm"
                    className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{t('childHome.text_9')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Top KPI Cards (5-Card Layout) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Study Days */}
          <Card className="rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  {t('childHome.text_10')}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1">
                {isBn ? toBnNum(kpis.studyDays) : kpis.studyDays} <span className="text-xs font-normal text-muted-foreground">/ {t('childHome.text_11')}</span>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Total Study Time */}
          <Card className="rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  {t('childHome.text_12')}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1">
                {t('childHome.h_m', { p0: isBn ? toBnNum(hours) : hours, p1: isBn ? toBnNum(minutes) : minutes }, `${hours}h ${minutes}m`)}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Quizzes Completed */}
          <Link href="/child/quiz" className="block group">
            <Card className="rounded-2xl border bg-card shadow-sm hover:shadow-md group-hover:border-indigo-500/50 transition-all h-full">
              <CardHeader className="p-4 pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-semibold uppercase tracking-wider group-hover:text-primary transition-colors">
                    {t('childHome.text_13')}
                  </CardDescription>
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Brain className="w-4 h-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1">
                  {isBn ? toBnNum(kpis.quizzes) : kpis.quizzes} <span className="text-xs font-normal text-muted-foreground">{t('childHome.text_14')}</span>
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>

          {/* Avg Accuracy / Score */}
          <Card className="rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  {t('childHome.text_15')}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">
                {t('childHome.avg_score', { p0: isBn ? toBnNum(kpis.avgScore) : kpis.avgScore }, `${kpis.avgScore}%`)}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Streak Counter */}
          <Card className="rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  {t('childHome.text_16')}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1 text-rose-500 flex items-center gap-1">
                <span>{isBn ? toBnNum(kpis.streak) : kpis.streak}</span>
                <span className="text-xs font-normal text-muted-foreground">{t('childHome.text_17')}</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* 5. Topic Mastery & Needs Practice (Weakest / Strongest) */}
        {/* ======================================================== */}
        <div className="grid lg:grid-cols-2 gap-6 pt-2">
          {/* Weakest Topics (Needs Practice) */}
          <Card className="rounded-3xl border shadow-xs bg-card/60 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>{t('childQuiz.text_33')}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {t('childQuiz.text_34')}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
              {topics?.weakest && topics.weakest.length > 0 ? (
                topics.weakest.map((w: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">{w.subject}</span>
                      <span className="font-extrabold text-amber-700 dark:text-amber-400">
                        {t('childQuiz.accuracy', { p0: isBn ? toBnNum(w.accuracy) : w.accuracy }, `${w.accuracy}% Accuracy`)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-amber-500/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${w.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground p-3 text-center">
                  {t('childQuiz.text_35')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Strongest Topics (Mastered) */}
          <Card className="rounded-3xl border shadow-xs bg-card/60 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{t('childQuiz.text_36')}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {t('childQuiz.text_37')}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
              {topics?.strongest && topics.strongest.length > 0 ? (
                topics.strongest.map((s: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">{s.subject}</span>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                        {t('childQuiz.accuracy', { p0: isBn ? toBnNum(s.accuracy) : s.accuracy }, `${s.accuracy}% Accuracy`)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-emerald-500/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${s.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground p-3 text-center">
                  {t('childQuiz.text_38')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Study Consistency Calendar (Full-width clean card) */}
        <Card className="rounded-3xl border shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-base font-bold">
              {t('childHome.text_18')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('childHome.text_19')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <MonthlyActivityCalendar data={consistency} isBn={isBn} />
          </CardContent>
        </Card>
      </div>
    </KidShell>
  );
}
