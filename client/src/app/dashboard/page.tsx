'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/components/auth/auth-context';
import { demoProfileOf } from '@/lib/child-scope';
import { useI18n } from '@/lib/i18n-context';
import { getInstitutionType } from '@/lib/institution';
import { api } from '@/lib/api';
import {
  StudyTimeChart,
  ScoreTrendChart,
  SubjectDonut,
  MasteryRadar,
  MonthlyActivityCalendar,
} from '@/components/charts/study-time-chart';
import {
  Clock,
  Calendar,
  Brain,
  Award,
  Flame,
  AlertTriangle,
  Plus,
  BookOpen,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

function toBnNum(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
}

export default function DashboardPage() {
  const { activeChild, childrenList } = useAuth();
  const { t, isBn } = useI18n();

  const [summary, setSummary] = useState<any>(null);
  const [studyTime, setStudyTime] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [mastery, setMastery] = useState<any[]>([]);
  const [consistency, setConsistency] = useState<Record<string, number>>({});
  const [topics, setTopics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // The child this dashboard is about.
  //
  // The old chain ended at the hardcoded `'demo-child-1'`, so a brand-new account with
  // no children asked the server about the demo student — and, because every panel
  // below falls back to mock data when a request fails, was shown the demo family's
  // dashboard. `null` means "no children yet", which is a legitimate empty state.
  const childId = activeChild?.id || childrenList[0]?.id || null;
  const currentChild = childrenList.find((c) => c.id === childId) || activeChild || childrenList[0];
  const institutionType = getInstitutionType(currentChild?.grade);

  // Which demo dataset applies, if any. The server marks the three seeded demo
  // children with a `demoProfile`; the mock fallbacks below only run for those.
  const demoProfile = demoProfileOf(currentChild);
  const isDemoChild = demoProfile !== null;
  const isTasnim = demoProfile === 'tasnim';
  const isFahim = demoProfile === 'fahim';

  useEffect(() => {
    let cancelled = false;
    setSummary(null);
    if (!childId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    Promise.allSettled([
      api.get(`/children/${childId}/dashboard/summary`),
      api.get(`/children/${childId}/dashboard/study-time`),
      api.get(`/children/${childId}/dashboard/subjects`),
      api.get(`/children/${childId}/dashboard/scores`),
      api.get(`/children/${childId}/dashboard/mastery`),
      api.get(`/children/${childId}/dashboard/consistency`),
      api.get(`/children/${childId}/dashboard/topics`),
    ]).then(([sumRes, stRes, subjRes, scrRes, mastRes, consRes, topRes]) => {
      if (cancelled) return;
      // Summary
      if (sumRes.status === 'fulfilled' && sumRes.value.data?.data?.kpis) {
        setSummary(sumRes.value.data.data);
      } else if (isDemoChild) {
        setSummary(
          isFahim
            ? {
                kpis: { studyDays: 6, totalTime: 1560, quizzes: 4, avgScore: 92, streak: 7 },
              }
            : isTasnim
            ? {
                kpis: { studyDays: 6, totalTime: 1080, quizzes: 6, avgScore: 95, streak: 6 },
              }
            : {
                kpis: { studyDays: 6, totalTime: 1350, quizzes: 5, avgScore: 88, streak: 6 },
              }
        );
      } else {
        // A real child with no data yet — an empty state, not the demo's numbers.
        setSummary(null);
      }

      const formatStudyTime = (arr: any[]) =>
        arr.map((d: any) => {
          const college = d.college !== undefined ? d.college : (institutionType === 'college' ? d.school || 0 : 0);
          const school = institutionType === 'college' ? 0 : (d.school || 0);
          if (institutionType === 'college') {
            return { date: d.date, college, tuition: d.tuition || 0, self_study: d.self_study || 0 };
          }
          if (institutionType === 'admission') {
            const base = d.school || d.college || 0;
            return {
              date: d.date,
              tuition: (d.tuition || 0) + Math.round(base * 0.6),
              self_study: (d.self_study || 0) + Math.round(base * 0.4),
            };
          }
          return { date: d.date, school, tuition: d.tuition || 0, self_study: d.self_study || 0 };
        });

      // Study time
      if (stRes.status === 'fulfilled' && stRes.value.data?.data?.length && stRes.value.data.data.some((x: any) => (x.school || 0) + (x.college || 0) + (x.tuition || 0) + (x.self_study || 0) > 0)) {
        setStudyTime(formatStudyTime(stRes.value.data.data));
      } else if (isDemoChild) {
        setStudyTime(
          formatStudyTime(
            isFahim
              ? [
                  { date: 'Mon', college: 100, tuition: 75, self_study: 60 },
                  { date: 'Tue', college: 100, tuition: 60, self_study: 60 },
                  { date: 'Wed', college: 100, tuition: 75, self_study: 45 },
                  { date: 'Thu', college: 100, tuition: 60, self_study: 60 },
                  { date: 'Fri', college: 0, tuition: 90, self_study: 75 },
                  { date: 'Sat', college: 0, tuition: 0, self_study: 90 },
                  { date: 'Sun', college: 100, tuition: 75, self_study: 60 },
                ]
              : isTasnim
              ? [
                  { date: 'Mon', school: 45, tuition: 60, self_study: 45 },
                  { date: 'Tue', school: 45, tuition: 50, self_study: 45 },
                  { date: 'Wed', school: 40, tuition: 60, self_study: 45 },
                  { date: 'Thu', school: 45, tuition: 50, self_study: 40 },
                  { date: 'Fri', school: 0, tuition: 60, self_study: 45 },
                  { date: 'Sat', school: 0, tuition: 0, self_study: 50 },
                  { date: 'Sun', school: 45, tuition: 60, self_study: 45 },
                ]
              : [
                  { date: 'Mon', school: 95, tuition: 75, self_study: 45 },
                  { date: 'Tue', school: 90, tuition: 60, self_study: 50 },
                  { date: 'Wed', school: 50, tuition: 75, self_study: 45 },
                  { date: 'Thu', school: 50, tuition: 60, self_study: 40 },
                  { date: 'Fri', school: 0, tuition: 75, self_study: 45 },
                  { date: 'Sat', school: 0, tuition: 60, self_study: 60 },
                  { date: 'Sun', school: 95, tuition: 75, self_study: 45 },
                ]
          )
        );
      } else {
        setStudyTime([]);
      }

      // Subjects
      if (subjRes.status === 'fulfilled' && subjRes.value.data?.data?.length && subjRes.value.data.data.some((x: any) => (x.value || x.count || 0) > 0)) {
        setSubjects(subjRes.value.data.data);
      } else if (isDemoChild) {
        setSubjects(
          isFahim
            ? [
                { subject: t('dashboard.text'), value: 14 },
                { subject: t('dashboard.text_2'), value: 12 },
                { subject: t('dashboard.text_3'), value: 10 },
                { subject: t('dashboard.text_4'), value: 8 },
                { subject: t('dashboard.text_5'), value: 6 },
                { subject: t('dashboard.text_6'), value: 5 },
              ]
            : isTasnim
            ? [
                { subject: t('dashboard.text_7'), value: 9 },
                { subject: t('dashboard.text_8'), value: 6 },
                { subject: t('dashboard.text_9'), value: 5 },
                { subject: t('dashboard.text_10'), value: 4 },
                { subject: t('dashboard.text_11'), value: 3 },
                { subject: t('dashboard.text_12'), value: 3 },
              ]
            : [
                { subject: t('dashboard.text_13'), value: 12 },
                { subject: t('dashboard.text_14'), value: 8 },
                { subject: t('dashboard.text_6'), value: 6 },
                { subject: t('dashboard.text_4'), value: 5 },
                { subject: t('dashboard.text_15'), value: 4 },
                { subject: t('dashboard.text_10'), value: 4 },
              ]
        );
      } else {
        setSubjects([]);
      }

      // Scores
      if (scrRes.status === 'fulfilled' && scrRes.value.data?.data?.length && scrRes.value.data.data.some((x: any) => x.score > 0)) {
        setScores(scrRes.value.data.data);
      } else if (isDemoChild) {
        setScores(
          isFahim
            ? [
                { date: 'Oct 12', score: 85 },
                { date: 'Oct 18', score: 88 },
                { date: 'Oct 24', score: 90 },
                { date: 'Oct 28', score: 92 },
                { date: 'Nov 01', score: 95 },
              ]
            : isTasnim
            ? [
                { date: 'Oct 12', score: 90 },
                { date: 'Oct 18', score: 92 },
                { date: 'Oct 24', score: 94 },
                { date: 'Oct 28', score: 96 },
                { date: 'Nov 01', score: 98 },
              ]
            : [
                { date: 'Oct 12', score: 76 },
                { date: 'Oct 18', score: 80 },
                { date: 'Oct 24', score: 84 },
                { date: 'Oct 28', score: 82 },
                { date: 'Nov 01', score: 90 },
              ]
        );
      } else {
        setScores([]);
      }

      // Mastery
      if (mastRes.status === 'fulfilled' && mastRes.value.data?.data?.length && mastRes.value.data.data.some((x: any) => x.accuracy > 0)) {
        setMastery(mastRes.value.data.data);
      } else if (isDemoChild) {
        setMastery(
          isFahim
            ? [
                { subject: t('dashboard.text_16'), accuracy: 95 },
                { subject: t('dashboard.text_17'), accuracy: 92 },
                { subject: t('dashboard.text_18'), accuracy: 88 },
                { subject: t('dashboard.text_19'), accuracy: 85 },
                { subject: t('dashboard.text_20'), accuracy: 82 },
              ]
            : isTasnim
            ? [
                { subject: t('dashboard.text_21'), accuracy: 96 },
                { subject: t('dashboard.text_22'), accuracy: 92 },
                { subject: t('dashboard.vocabulary_reading'), accuracy: 90 },
                { subject: t('dashboard.text_23'), accuracy: 94 },
                { subject: t('dashboard.text_24'), accuracy: 88 },
              ]
            : [
                { subject: t('dashboard.text_25'), accuracy: 92 },
                { subject: t('dashboard.text_26'), accuracy: 88 },
                { subject: t('dashboard.text_27'), accuracy: 85 },
                { subject: t('dashboard.grammar_verbs'), accuracy: 80 },
                { subject: t('dashboard.text_28'), accuracy: 75 },
              ]
        );
      } else {
        setMastery([]);
      }

      // Consistency
      if (consRes.status === 'fulfilled' && consRes.value.data?.data && Object.keys(consRes.value.data.data).length > 0 && Object.values(consRes.value.data.data).some((v: any) => v > 0)) {
        setConsistency(consRes.value.data.data);
      } else if (isDemoChild) {
        const out: Record<string, number> = {};
        for (let i = 0; i < 180; i++) {
          const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
          out[d] = isFahim ? (i % 7 === 0 ? 1 : 2) : isTasnim ? (i % 2 === 0 ? 2 : i % 5 === 0 ? 0 : 1) : (i % 7 === 0 ? 0 : i % 4 === 0 ? 3 : 2);
        }
        setConsistency(out);
      } else {
        setConsistency({});
      }

      // Topics
      if (topRes.status === 'fulfilled' && topRes.value.data?.data?.weakest?.length && topRes.value.data.data.weakest.some((x: any) => x.accuracy > 0)) {
        setTopics(topRes.value.data.data);
      } else if (isDemoChild) {
        setTopics(
          isFahim
            ? {
                weakest: [
                  { subject: t('dashboard.text_29'), accuracy: 72 },
                  { subject: t('dashboard.text_30'), accuracy: 76 },
                ],
                strongest: [
                  { subject: t('dashboard.text_31'), accuracy: 96 },
                  { subject: t('dashboard.text_32'), accuracy: 94 },
                ],
              }
            : isTasnim
            ? {
                weakest: [
                  { subject: t('dashboard.spelling_prepositions'), accuracy: 84 },
                  { subject: t('dashboard.text_33'), accuracy: 86 },
                ],
                strongest: [
                  { subject: t('dashboard.text_34'), accuracy: 98 },
                  { subject: t('dashboard.text_35'), accuracy: 96 },
                ],
              }
            : {
                weakest: [
                  { subject: t('dashboard.text_36'), accuracy: 72 },
                  { subject: t('dashboard.right_forms_of_verbs'), accuracy: 78 },
                ],
                strongest: [
                  { subject: t('dashboard.text_37'), accuracy: 92 },
                  { subject: t('dashboard.text_38'), accuracy: 90 },
                ],
              }
        );
      } else {
        setTopics(null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // `isBn` is read inside the render instead of being a dependency — it re-fired
    // all seven requests on every locale toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, isDemoChild, isTasnim, isFahim, institutionType]);

  // Missing data is zero; do not discard quiz stats when study time is zero.
  const kpis = {
    studyDays: summary?.kpis?.studyDays ?? 0,
    totalTime: summary?.kpis?.totalTime ?? 0,
    quizzes: summary?.kpis?.quizzes ?? 0,
    avgScore: summary?.kpis?.avgScore ?? 0,
    streak: summary?.kpis?.streak ?? 0,
  };
  const hours = Math.floor(kpis.totalTime / 60);
  const minutes = kpis.totalTime % 60;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t('dashboard.text_51')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('dashboard.text_52')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 w-full sm:w-auto">
            <Link href={`/children/${childId}/log`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('dashboard.text_53')}</span>
              </Button>
            </Link>
            <Link href={`/children/${childId}/quizzes/new`}>
              <Button size="sm" className="gap-1.5 text-xs h-9 shadow-sm shadow-primary/20">
                <Brain className="w-3.5 h-3.5" />
                <span>{t('dashboard.text_54')}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Study days */}
          <Card className="rounded-2xl border bg-card/60 backdrop-blur shadow-sm hover:shadow transition-shadow">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  {t('dashboard.text_55')}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1">
                {kpis.studyDays} <span className="text-xs font-normal text-muted-foreground">/ 7 days</span>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Total study time */}
          <Card className="rounded-2xl border bg-card/60 backdrop-blur shadow-sm hover:shadow transition-shadow">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  {t('dashboard.text_56')}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1">
                {hours}h {minutes}m
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Quizzes taken */}
          <Card className="rounded-2xl border bg-card/60 backdrop-blur shadow-sm hover:shadow transition-shadow">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  {t('dashboard.text_57')}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1">
                {kpis.quizzes}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Average score */}
          <Card className="rounded-2xl border bg-card/60 backdrop-blur shadow-sm hover:shadow transition-shadow">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  {t('dashboard.text_58')}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">
                {kpis.avgScore}%
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Daily streak */}
          <Card className="rounded-2xl border bg-card/60 backdrop-blur shadow-sm hover:shadow transition-shadow col-span-2 lg:col-span-1">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  {t('dashboard.text_59')}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-amber-500" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1 flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span>{kpis.streak}</span>
                <span className="text-xs font-normal text-muted-foreground">{t('dashboard.text_60')}</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Charts Row 1: Weekly Study Time & Subject Distribution */}
        <div className="grid md:grid-cols-2 gap-6 min-w-0">
          <Card className="rounded-2xl border shadow-sm min-w-0 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">
                    {t('dashboard.weeklyStudyTime', 'Weekly Study Time')}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t('dashboard.text_61')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <StudyTimeChart data={studyTime} institutionType={institutionType} isBn={isBn} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm min-w-0 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">
                {t('dashboard.subjectDistribution', 'Subject Distribution')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('dashboard.text_62')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubjectDonut data={subjects} isBn={isBn} />
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2: Score Trend & Subject Mastery Radar */}
        <div className="grid md:grid-cols-2 gap-6 min-w-0">
          <Card className="rounded-2xl border shadow-sm min-w-0 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">
                {t('dashboard.scoreTrend', 'Quiz Score Progress')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('dashboard.text_63')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreTrendChart data={scores} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm min-w-0 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">
                {t('dashboard.subjectMastery', 'Subject Mastery Radar')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('dashboard.text_64')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MasteryRadar data={mastery} />
            </CardContent>
          </Card>
        </div>

        {/* Consistency Heatmap & Topic Breakdown */}
        <div className="grid md:grid-cols-2 gap-6 min-w-0">
          {/* Monthly Activity Consistency Calendar */}
          <Card className="rounded-2xl border shadow-sm min-w-0 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">
                {t('dashboard.text_65')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('dashboard.text_66')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyActivityCalendar data={consistency} isBn={isBn} />
            </CardContent>
          </Card>

          {/* Weakest & Strongest Topics */}
          <Card className="rounded-2xl border shadow-sm min-w-0 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">
                {t('dashboard.text_67')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('dashboard.text_68')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Weakest */}
              <div>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{t('dashboard.weakestTopics', 'Needs Practice')}</span>
                </p>
                <div className="space-y-2">
                  {topics?.weakest?.map((w: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs"
                    >
                      <span className="font-medium text-foreground">{w.subject}</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{w.accuracy}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strongest */}
              <div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('dashboard.strongestTopics', 'Mastered Topics')}</span>
                </p>
                <div className="space-y-2">
                  {topics?.strongest?.map((s: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs"
                    >
                      <span className="font-medium text-foreground">{s.subject}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{s.accuracy}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
