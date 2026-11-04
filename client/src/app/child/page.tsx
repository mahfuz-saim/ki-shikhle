'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KidShell } from '@/components/layout/kid-shell';
import { useAuth } from '@/components/auth/auth-context';
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
} from 'lucide-react';

function toBnNum(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
}

export default function KidDashboard() {
  const { activeChild, user } = useAuth();
  const { isBn } = useI18n();

  const childId = activeChild?.id || (user as any)?.childId || user?.id || 'demo-child-1';
  const isTasnim = childId === 'demo-child-2' || user?.email?.includes('tasnim') || activeChild?.name?.includes('Tasnim');
  const isFahim = childId === 'demo-child-3' || user?.email?.includes('fahim') || activeChild?.name?.includes('Fahim');
  const studentGrade = user?.grade || activeChild?.grade || (isFahim ? 'Class 11' : isTasnim ? 'Class 5' : 'Class 8');
  const institutionType = getInstitutionType(studentGrade);
  const instInfo = getInstitutionInfo(institutionType, isBn);

  const [summary, setSummary] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [consistency, setConsistency] = useState<Record<string, number>>({});
  const [hasPendingLog, setHasPendingLog] = useState(true);

  useEffect(() => {
    // 1. Summary & KPIs
    api
      .get(`/children/${childId}/dashboard/summary`)
      .then((r) => {
        if (r.data?.data && (r.data.data.kpis?.totalTime > 0 || r.data.data.kpis?.streak > 0)) {
          setSummary(r.data.data);
        } else {
          setSummary({
            kpis: isFahim
              ? { studyDays: 6, totalTime: 1560, streak: 7, quizzes: 4, avgScore: 92 }
              : isTasnim
              ? { studyDays: 6, totalTime: 1080, streak: 6, quizzes: 6, avgScore: 95 }
              : { studyDays: 6, totalTime: 1350, streak: 6, quizzes: 5, avgScore: 88 },
            recent: isFahim
              ? [
                  { date: new Date().toISOString(), topicsText: 'Physics 1st Paper - Projectile Motion (প্রক্ষেপকের গাণিতিক সমাধান)', source: 'college' },
                  { date: new Date(Date.now() - 3600000 * 3).toISOString(), topicsText: 'Chemistry 1st Paper - Bohr Atomic Model & Quantum Numbers', source: 'college' },
                  { date: new Date(Date.now() - 3600000 * 6).toISOString(), topicsText: 'Physics Coaching - Advanced Trajectory Equations', source: 'tuition' },
                ]
              : isTasnim
              ? [
                  { date: new Date().toISOString(), topicsText: 'Elementary Math - Factors & Multiples (লসাগু ও গসাগু নির্ণয়)', source: 'school' },
                  { date: new Date(Date.now() - 3600000 * 4).toISOString(), topicsText: 'Primary Science - Safe Drinking Water & Purification Steps', source: 'school' },
                  { date: new Date(Date.now() - 3600000 * 7).toISOString(), topicsText: 'Math Tutor - Word Problems on Bell Intervals', source: 'tuition' },
                ]
              : [
                  { date: new Date().toISOString(), topicsText: 'Mathematics - Algebraic Formulae (বর্গের সূত্রাবলী ও প্রয়োগ)', source: 'school' },
                  { date: new Date(Date.now() - 3600000 * 4).toISOString(), topicsText: 'General Science - 3 Equations of Motion & v-t Graphs', source: 'school' },
                  { date: new Date(Date.now() - 3600000 * 7).toISOString(), topicsText: 'Math Tuition - Value Finding with Rahim Sir', source: 'tuition' },
                ],
          });
        }
      })
      .catch(() =>
        setSummary({
          kpis: isFahim
            ? { studyDays: 6, totalTime: 1560, streak: 7, quizzes: 4, avgScore: 92 }
            : isTasnim
            ? { studyDays: 6, totalTime: 1080, streak: 6, quizzes: 6, avgScore: 95 }
            : { studyDays: 6, totalTime: 1350, streak: 6, quizzes: 5, avgScore: 88 },
          recent: isFahim
            ? [
                { date: new Date().toISOString(), topicsText: 'Physics 1st Paper - Projectile Motion (প্রক্ষেপকের গাণিতিক সমাধান)', source: 'college' },
                { date: new Date(Date.now() - 3600000 * 3).toISOString(), topicsText: 'Chemistry 1st Paper - Bohr Atomic Model & Quantum Numbers', source: 'college' },
              ]
            : isTasnim
            ? [
                { date: new Date().toISOString(), topicsText: 'Elementary Math - Factors & Multiples (লসাগু ও গসাগু নির্ণয়)', source: 'school' },
                { date: new Date(Date.now() - 3600000 * 4).toISOString(), topicsText: 'Primary Science - Safe Drinking Water & Purification Steps', source: 'school' },
              ]
            : [
                { date: new Date().toISOString(), topicsText: 'Mathematics - Algebraic Formulae (বর্গের সূত্রাবলী ও প্রয়োগ)', source: 'school' },
                { date: new Date(Date.now() - 3600000 * 4).toISOString(), topicsText: 'General Science - 3 Equations of Motion & v-t Graphs', source: 'school' },
              ],
        })
      );

    // 2. Quizzes
    api
      .get(`/children/${childId}/quizzes`)
      .then((r) => {
        const list = r.data?.data;
        if (list && list.length > 0) {
          setQuizzes(list);
        } else {
          setQuizzes(
            isTasnim
              ? [
                  {
                    id: 'q-t2',
                    title: isBn ? 'প্রাথমিক বিজ্ঞান: জীবনের জন্য পানি বিশুদ্ধকরণ' : 'Primary Science: Safe Water & Purification',
                    status: 'assigned',
                    questionCount: 5,
                    timeLimitMin: 15,
                    isNew: true,
                  },
                  {
                    id: 'q-t1',
                    title: isBn ? 'প্রাথমিক গণিত: গুণনীয়ক ও লসাগু-গসাগু কুইজ' : 'Primary Math: Factors & LCM-HCF Quiz',
                    status: 'completed',
                    questionCount: 5,
                    score: 95,
                  },
                ]
              : [
                  {
                    id: 'q-r2',
                    title: isBn ? 'পদার্থবিজ্ঞান: গতির সমীকরণ ও ত্বরণ' : 'Physics: Equations of Motion & Acceleration',
                    status: 'assigned',
                    questionCount: 5,
                    timeLimitMin: 15,
                    isNew: true,
                  },
                  {
                    id: 'q-r1',
                    title: isBn ? 'গণিত: বীজগাণিতিক সূত্রাবলী ও প্রয়োগ কুইজ' : 'Class 8 Math: Algebraic Formulae Quiz',
                    status: 'completed',
                    questionCount: 5,
                    score: 85,
                  },
                  {
                    id: 'q-r3',
                    title: isBn ? 'ইংরেজি: Right Forms of Verbs & Prepositions' : 'English: Right Forms of Verbs & Prepositions',
                    status: 'completed',
                    questionCount: 5,
                    score: 80,
                  },
                ]
          );
        }
      })
      .catch(() =>
        setQuizzes(
          isTasnim
            ? [
                {
                  id: 'q-t2',
                  title: isBn ? 'প্রাথমিক বিজ্ঞান: জীবনের জন্য পানি বিশুদ্ধকরণ' : 'Primary Science: Safe Water & Purification',
                  status: 'assigned',
                  questionCount: 5,
                  timeLimitMin: 15,
                  isNew: true,
                },
                {
                  id: 'q-t1',
                  title: isBn ? 'প্রাথমিক গণিত: গুণনীয়ক ও লসাগু-গসাগু কুইজ' : 'Primary Math: Factors & LCM-HCF Quiz',
                  status: 'completed',
                  questionCount: 5,
                  score: 95,
                },
              ]
            : [
                {
                  id: 'q-r2',
                  title: isBn ? 'পদার্থবিজ্ঞান: গতির সমীকরণ ও ত্বরণ' : 'Physics: Equations of Motion & Acceleration',
                  status: 'assigned',
                  questionCount: 5,
                  timeLimitMin: 15,
                  isNew: true,
                },
                {
                  id: 'q-r1',
                  title: isBn ? 'গণিত: বীজগাণিতিক সূত্রাবলী ও প্রয়োগ কুইজ' : 'Class 8 Math: Algebraic Formulae Quiz',
                  status: 'completed',
                  questionCount: 5,
                  score: 85,
                },
              ]
        )
      );

    // 3. Consistency (for MonthlyActivityCalendar)
    api
      .get(`/children/${childId}/dashboard/consistency`)
      .then((r) => {
        if (r.data?.data && Object.keys(r.data.data).length > 0) {
          setConsistency(r.data.data);
        } else {
          const out: Record<string, number> = {};
          for (let i = 0; i < 180; i++) {
            const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
            out[d] = isTasnim ? (i % 2 === 0 ? 1 : i % 5 === 0 ? 0 : 1) : (i % 7 === 0 ? 0 : i % 4 === 0 ? 2 : 1);
          }
          setConsistency(out);
        }
      })
      .catch(() => {
        const out: Record<string, number> = {};
        for (let i = 0; i < 180; i++) {
          const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
          out[d] = isTasnim ? (i % 2 === 0 ? 1 : i % 5 === 0 ? 0 : 1) : (i % 7 === 0 ? 0 : i % 4 === 0 ? 2 : 1);
        }
        setConsistency(out);
      });

    // 4. Check if today's class logs are pending
    api
      .get(`/children/${childId}/entries`)
      .then((r) => {
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
      .catch(() => setHasPendingLog(true));
  }, [childId, isBn, isTasnim, isFahim]);

  const defaultKpis = isFahim
    ? { studyDays: 6, totalTime: 1560, quizzes: 4, avgScore: 92, streak: 7 }
    : isTasnim
    ? { studyDays: 6, totalTime: 1080, quizzes: 6, avgScore: 95, streak: 6 }
    : { studyDays: 6, totalTime: 1350, quizzes: 5, avgScore: 88, streak: 6 };
  const kpis = (summary?.kpis?.totalTime || summary?.kpis?.studyDays) ? summary.kpis : defaultKpis;
  const effectiveTotalMin = kpis.totalTime || (isFahim ? 1560 : 420);
  const hours = Math.floor(effectiveTotalMin / 60);
  const minutes = effectiveTotalMin % 60;

  const studentName = activeChild?.name || user?.name || (isTasnim ? 'Tasnim Islam' : 'Rahim Ahmed');
  const pendingQuizzes = (Array.isArray(quizzes) ? quizzes : []).filter((q) => q.status === 'assigned' || q.isNew || !q.score);
  const pendingCount = pendingQuizzes.length || (isTasnim ? 1 : 2);
  const firstPendingQuiz = pendingQuizzes[0] || (isTasnim ? { title: isBn ? 'প্রাথমিক বিজ্ঞান: জীবনের জন্য পানি বিশুদ্ধকরণ' : 'Primary Science: Safe Water & Purification' } : { title: isBn ? 'পদার্থবিজ্ঞান: গতির সমীকরণ ও ত্বরণ' : 'Physics: Equations of Motion & Acceleration' });

  return (
    <KidShell>
      <div className="space-y-6">
        {/* Welcome Greeting Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 text-white shadow-xl shadow-indigo-500/10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                🔥 {isBn ? `${toBnNum(kpis.streak)} দিনের স্ট্রিক` : `${kpis.streak}-Day Streak`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isBn ? `${studentName}, আজকে তুমি কী শিখলে?` : `${studentName}, what did you learn today?`}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              {isBn
                ? 'পড়ার টপিক ১ মিনিটে লগ করো, ক্লাস নোট আপলোড করো এবং কুইজ দিয়ে প্রস্তুতি যাচাই করো!'
                : 'Log what was taught in 1 minute, scan your notebooks, and test your mastery with AI quizzes!'}
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
                      {isBn
                        ? `তোমার জন্য ${toBnNum(pendingCount)}টি নতুন এআই কুইজ অপেক্ষমাণ আছে!`
                        : `${pendingCount} Pending AI Quiz${pendingCount > 1 ? 'zes' : ''} Ready For You!`}
                    </h3>
                    <Badge className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 animate-pulse shadow-xs">
                      {isBn ? `${toBnNum(pendingCount)}টি বাকি` : `${pendingCount} Pending`}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">
                    {isBn
                      ? `সর্বশেষ: "${firstPendingQuiz.title}" — প্রস্তুতি যাচাই করতে কুইজ পেজে যান`
                      : `Latest: "${firstPendingQuiz.title}" — Click to open Quiz page & test your mastery`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <Button
                  size="sm"
                  className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  <span>{isBn ? 'কুইজ পেজে যান' : 'Go to Quizzes'}</span>
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
                      {isBn ? 'আজকের ক্লাসের পড়া জমা দেওয়া হয়নি' : 'Log your classes today'}
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-bold border-amber-500/40 text-amber-600 bg-amber-500/15">
                      {isBn ? 'লগ বাকি' : 'Log Pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isBn
                      ? 'আজকের ক্লাসে বা প্রাইভেটে কী কী শিখলে তা ১ ক্লিকে ভয়েস বা টেক্সট দিয়ে লিখে ফেলো এবং তোমার স্ট্রিক রক্ষা করো!'
                      : 'Submit what was taught in school or tuition today in 1 minute to protect your streak!'}
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
                    <span>{isBn ? 'আজকের ক্লাসের পড়া লগ দিন' : 'Log Your Classes'}</span>
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
                  {isBn ? 'পড়ার দিন' : 'Study Days'}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1">
                {isBn ? toBnNum(kpis.studyDays || 5) : (kpis.studyDays || 5)} <span className="text-xs font-normal text-muted-foreground">/ {isBn ? '৭ দিন' : '7 days'}</span>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Total Study Time */}
          <Card className="rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  {isBn ? 'মোট সময়' : 'Total Study Time'}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1">
                {isBn ? `${toBnNum(hours)}ঘ ${toBnNum(minutes)}মি` : `${hours}h ${minutes}m`}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Quizzes Completed */}
          <Link href="/child/quiz" className="block group">
            <Card className="rounded-2xl border bg-card shadow-sm hover:shadow-md group-hover:border-indigo-500/50 transition-all h-full">
              <CardHeader className="p-4 pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-semibold uppercase tracking-wider group-hover:text-primary transition-colors">
                    {isBn ? 'কুইজ সম্পন্ন' : 'Quizzes Done'}
                  </CardDescription>
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Brain className="w-4 h-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1">
                  {isBn ? toBnNum(kpis.quizzes || 4) : (kpis.quizzes || 4)} <span className="text-xs font-normal text-muted-foreground">{isBn ? 'টি' : 'tests'}</span>
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>

          {/* Avg Accuracy / Score */}
          <Card className="rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  {isBn ? 'গড় স্কোর' : 'Avg Score'}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">
                {isBn ? `${toBnNum(kpis.avgScore || 88)}%` : `${kpis.avgScore || 88}%`}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Streak Counter */}
          <Card className="rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  {isBn ? 'স্ট্রিক' : 'Daily Streak'}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1 text-rose-500 flex items-center gap-1">
                <span>{isBn ? toBnNum(kpis.streak || 5) : (kpis.streak || 5)}</span>
                <span className="text-xs font-normal text-muted-foreground">{isBn ? 'দিন 🔥' : 'days 🔥'}</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Monthly Study Consistency Calendar (Full-width clean card) */}
        <Card className="rounded-3xl border shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className="text-base font-bold">
              {isBn ? 'মাসিক পড়ার ধারাবাহিকতা ক্যালেন্ডার' : 'Monthly Study Consistency Calendar'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isBn
                ? 'সবুজ: সম্পন্ন পড়া, লাল: মিস হওয়া দিন — তোমার ধারাবাহিকতা ট্র্যাক করো'
                : 'Green shows logged study days, red shows missed sessions. Keep your habit strong!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <MonthlyActivityCalendar data={consistency} isBn={isBn} />
          </CardContent>
        </Card>

        {/* Recent Learning Activity Feed */}
        <Card className="rounded-3xl border shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>{isBn ? 'সর্বশেষ পড়ার বিবরণী' : 'Recent Study Logs'}</span>
              </CardTitle>
              <Link href="/child/schedule" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
                <span>{isBn ? 'রুটিন ও ক্লাস বিবরণী' : 'Routine & Class Logs'}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <CardDescription className="text-xs">
              {isBn ? 'তোমার সম্পন্ন করা সাম্প্রতিক পাঠসমূহ' : 'Your recently completed study sessions'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-2.5">
              {summary?.recent?.slice(0, 4).map((r: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2.5 p-3 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors min-w-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">
                        {r.topicsText || r.topic}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                        <span className="capitalize font-semibold text-primary/80">
                          {r.source === 'tuition'
                            ? (isBn ? 'টিউশন' : 'Tuition')
                            : r.source === 'college'
                            ? (isBn ? 'কলেজ' : 'College')
                            : r.source === 'school'
                            ? (isBn ? 'স্কুল' : 'School')
                            : (isBn ? 'স্ব-শিক্ষা' : 'Self-study')}
                        </span>
                        <span>•</span>
                        <span>
                          {isBn
                            ? toBnNum(new Date(r.date).toLocaleDateString())
                            : new Date(r.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shrink-0 font-bold">
                    ✓ {isBn ? 'সম্পন্ন' : 'Logged'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </KidShell>
  );
}
