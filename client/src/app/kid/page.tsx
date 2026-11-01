'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KidShell } from '@/components/layout/kid-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import {
  Flame,
  Brain,
  BookOpen,
  Camera,
  Play,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function KidDashboard() {
  const { activeChild, user } = useAuth();
  const { isBn } = useI18n();

  const childId = activeChild?.id || (user as any)?.childId || user?.id || 'demo-child-1';
  const isTasnim = childId === 'demo-child-2' || user?.email?.includes('tasnim') || activeChild?.name?.includes('Tasnim');

  const [summary, setSummary] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);

  useEffect(() => {
    api
      .get(`/children/${childId}/dashboard/summary`)
      .then((r) => {
        if (r.data?.data && (r.data.data.kpis?.totalTime > 0 || r.data.data.kpis?.streak > 0)) {
          setSummary(r.data.data);
        } else {
          setSummary({
            kpis: isTasnim
              ? { streak: 6, quizzes: 6, avgScore: 95 }
              : { streak: 5, quizzes: 4, avgScore: 88 },
          });
        }
      })
      .catch(() =>
        setSummary({
          kpis: isTasnim
            ? { streak: 6, quizzes: 6, avgScore: 95 }
            : { streak: 5, quizzes: 4, avgScore: 88 },
        })
      );

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
                    id: 'q-t1',
                    title: isBn ? 'প্রাথমিক গণিত: গুণনীয়ক ও লসাগু-গসাগু কুইজ' : 'Primary Math: Factors & LCM-HCF Quiz',
                    status: 'completed',
                    questionCount: 5,
                    score: 95,
                  },
                  {
                    id: 'q-t2',
                    title: isBn ? 'প্রাথমিক বিজ্ঞান: জীবনের জন্য পানি বিশুদ্ধকরণ' : 'Primary Science: Safe Water & Purification',
                    status: 'assigned',
                    questionCount: 5,
                    score: null,
                  },
                ]
              : [
                  {
                    id: 'q-r1',
                    title: isBn ? 'গণিত: বীজগাণিতিক সূত্রাবলী ও প্রয়োগ কুইজ' : 'Class 8 Math: Algebraic Formulae Quiz',
                    status: 'completed',
                    questionCount: 5,
                    score: 85,
                  },
                  {
                    id: 'q-r2',
                    title: isBn ? 'পদার্থবিজ্ঞান: গতির সমীকরণ ও ত্বরণ' : 'Physics: Equations of Motion & Acceleration',
                    status: 'completed',
                    questionCount: 5,
                    score: 90,
                  },
                  {
                    id: 'q-r3',
                    title: isBn ? 'ইংরেজি: Right Forms of Verbs & Prepositions' : 'English: Right Forms of Verbs & Prepositions',
                    status: 'assigned',
                    questionCount: 5,
                    score: null,
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
                  id: 'q-t1',
                  title: isBn ? 'প্রাথমিক গণিত: গুণনীয়ক ও লসাগু-গসাগু কুইজ' : 'Primary Math: Factors & LCM-HCF Quiz',
                  status: 'completed',
                  questionCount: 5,
                  score: 95,
                },
                {
                  id: 'q-t2',
                  title: isBn ? 'প্রাথমিক বিজ্ঞান: জীবনের জন্য পানি বিশুদ্ধকরণ' : 'Primary Science: Safe Water & Purification',
                  status: 'assigned',
                  questionCount: 5,
                  score: null,
                },
              ]
            : [
                {
                  id: 'q-r1',
                  title: isBn ? 'গণিত: বীজগাণিতিক সূত্রাবলী ও প্রয়োগ কুইজ' : 'Class 8 Math: Algebraic Formulae Quiz',
                  status: 'completed',
                  questionCount: 5,
                  score: 85,
                },
                {
                  id: 'q-r2',
                  title: isBn ? 'পদার্থবিজ্ঞান: গতির সমীকরণ ও ত্বরণ' : 'Physics: Equations of Motion & Acceleration',
                  status: 'completed',
                  questionCount: 5,
                  score: 90,
                },
                {
                  id: 'q-r3',
                  title: isBn ? 'ইংরেজি: Right Forms of Verbs & Prepositions' : 'English: Right Forms of Verbs & Prepositions',
                  status: 'assigned',
                  questionCount: 5,
                  score: null,
                },
              ]
        )
      );
  }, [childId, isBn, isTasnim]);

  const defaultKpis = isTasnim
    ? { streak: 6, quizzes: 6, avgScore: 95 }
    : { streak: 5, quizzes: 4, avgScore: 88 };
  const kpis = summary?.kpis?.streak ? summary.kpis : defaultKpis;

  return (
    <KidShell>
      <div className="space-y-6">
        {/* Welcome Greeting Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 text-white shadow-xl shadow-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider font-extrabold text-amber-200">
              {isBn ? 'স্বাগতম!' : 'Welcome Back!'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isBn ? 'আজকে তুমি কী শিখলে?' : 'What did you learn today?'}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-md">
              {isBn
                ? 'পড়ার টপিক ১ মিনিটে লগ করো এবং তোমার স্ট্রিক বজায় রাখো!'
                : 'Log your daily lessons in 1 minute and keep your study streak burning bright!'}
            </p>
          </div>

          <Link href="/kid/log">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 font-bold rounded-2xl shadow-lg shrink-0">
              📝 {isBn ? 'পড়ার বিবরণ দিন' : 'Quick Log Lesson'}
            </Button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card className="rounded-2xl border bg-card/70 p-4 text-center shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isBn ? 'স্ট্রিক' : 'Daily Streak'}
            </p>
            <p className="text-2xl sm:text-3xl font-black text-amber-500 mt-1 flex items-center justify-center gap-1">
              <Flame className="w-6 h-6 fill-amber-500" />
              <span>{kpis.streak}</span>
            </p>
          </Card>

          <Card className="rounded-2xl border bg-card/70 p-4 text-center shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isBn ? 'কুইজ সম্পন্ন' : 'Quizzes Done'}
            </p>
            <p className="text-2xl sm:text-3xl font-black text-primary mt-1 flex items-center justify-center gap-1">
              <Brain className="w-6 h-6" />
              <span>{kpis.quizzes}</span>
            </p>
          </Card>

          <Card className="rounded-2xl border bg-card/70 p-4 text-center shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isBn ? 'গড় স্কোর' : 'Avg Score'}
            </p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center justify-center gap-1">
              <Award className="w-6 h-6" />
              <span>{kpis.avgScore}%</span>
            </p>
          </Card>
        </div>

        {/* Today's Schedule & 1-tap quick log */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>{isBn ? 'আজকের রুটিন' : 'Today\'s Schedule'}</span>
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {isBn ? 'যে কোনো ক্লাসে ট্যাপ করে সহজে লগ করো' : 'Tap any session to quickly log what was taught'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border bg-muted/20 hover:bg-muted/40 transition-colors gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  📚
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {isTasnim
                      ? (isBn ? 'প্রাথমিক গণিত প্রাইভেট — বিকাল ৪:০০' : 'Elementary Math Tuition – 4:00 PM')
                      : (isBn ? 'গণিত প্রাইভেট — বিকাল ৪:০০' : 'Math Tuition – 4:00 PM')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {isTasnim
                      ? (isBn ? 'ম্যাথ টিউটর • ৬০ মিনিট' : 'Math Tutor • 60 mins')
                      : (isBn ? 'রহিম স্যার • ৯০ মিনিট' : 'Rahim Sir • 90 mins')}
                  </p>
                </div>
              </div>

              <Link href="/kid/log">
                <Button size="sm" variant="outline" className="text-xs h-8 gap-1 border-primary/30 text-primary">
                  <span>{isBn ? 'টপিক লিখুন' : 'Log Topic'}</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border bg-muted/20 hover:bg-muted/40 transition-colors gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm">
                  🔬
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {isTasnim
                      ? (isBn ? 'প্রাথমিক বিজ্ঞান ক্লাস — স্কুল' : 'Primary Science – School')
                      : (isBn ? 'পদার্থবিজ্ঞান ক্লাস — স্কুল' : 'Physics Class – School')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {isTasnim
                      ? (isBn ? 'অধ্যায় ৩: জীবনের জন্য পানি • ৪৫ মিনিট' : 'Chapter 3: Safe Water • 45 mins')
                      : (isBn ? 'অধ্যায় ৩: বলবিদ্যা • ৪৫ মিনিট' : 'Chapter 3: Dynamics • 45 mins')}
                  </p>
                </div>
              </div>

              <Link href="/kid/log">
                <Button size="sm" variant="outline" className="text-xs h-8 gap-1 border-primary/30 text-primary">
                  <span>{isBn ? 'টপিক লিখুন' : 'Log Topic'}</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Quizzes Card */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <span>{isBn ? 'তোমার কুইজসমূহ' : 'Assigned Quizzes'}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {isBn ? 'তোমার বাবা-মা তোমার জন্য এই কুইজগুলো তৈরি করেছেন' : 'Created by your parent to test your real lesson knowledge'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {quizzes.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl border bg-card hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{q.title}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {q.questionCount || 10} Qs
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isBn ? 'সময়সীমা: ১৫ মিনিট • ১টি করে প্রশ্ন' : 'Time: 15 mins • One question at a time'}
                  </p>
                </div>

                <Link href={`/kid/quiz/${q.id}`}>
                  <Button size="sm" className="h-9 text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md">
                    <Play className="w-3.5 h-3.5" />
                    <span>{isBn ? 'কুইজ শুরু করো' : 'Start Quiz'}</span>
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/kid/notes" className="block">
            <Card className="rounded-2xl border hover:border-primary/50 transition-all p-4 flex items-center gap-3 bg-card cursor-pointer">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {isBn ? 'ক্লাস নোটের ছবি তোলো' : 'Scan Class Notes'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isBn ? 'ছবি তুলে স্বয়ংক্রিয় লেখা তৈরি করো' : 'OCR turns handwritten notes into study text'}
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/kid/log" className="block">
            <Card className="rounded-2xl border hover:border-primary/50 transition-all p-4 flex items-center gap-3 bg-card cursor-pointer">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {isBn ? 'পড়ার লগ যোগ করো' : 'Quick Study Log'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isBn ? 'আজকে যা শিখেছ তা লিখো' : 'Keep your daily habit score high'}
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </KidShell>
  );
}
