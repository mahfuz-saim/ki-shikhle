'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KidShell } from '@/components/layout/kid-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useChildScope } from '@/components/auth/use-child-scope';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import {
  Brain,
  ChevronRight,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  RotateCcw,
  AlertTriangle,
  Star,
  Check,
  ArrowRight,
  BookOpen,
  Layers,
  GraduationCap,
  Flame,
} from 'lucide-react';

function toBnNum(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
}

export default function ChildQuizHubPage() {
  const { activeChild, user } = useAuth();
  const { t, isBn } = useI18n();

  // The child this session acts for, and the demo dataset that applies (if any).
  // The old fallback chain ended at the hardcoded `'demo-child-1'`, so an account with
  // no children was sent a request for the demo student and — when that request
  // failed — was shown the demo quizzes.
  const { childId, isTasnim, isFahim, isDemoChild } = useChildScope();
  const studentName = activeChild?.name || user?.name || (isFahim ? 'Fahim Islam' : isTasnim ? 'Tasnim Islam' : 'Rahim Ahmed');
  const studentGrade = activeChild?.grade || (user as any)?.grade || (isFahim ? 'Class 11' : isTasnim ? 'Class 5' : 'Class 8');

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [topics, setTopics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /**
   * The locale is read through a ref instead of being an effect dependency.
   *
   * `isBn` used to sit in the dependency array, so toggling the UI language
   * re-fired both dashboard requests. The locale only affects the *copy* of the
   * demo fallback, so it is read at call time instead.
   */
  const isBnRef = useRef(isBn);
  useEffect(() => {
    isBnRef.current = isBn;
  }, [isBn]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fallbackQuizzes = isFahim
      ? [
          {
            id: 'q-f1',
            title: isBnRef.current ? 'পদার্থবিজ্ঞান ১ম পত্র: নিউটনের গতিসূত্র ও মহাকর্ষ' : 'Physics 1st Paper: Laws of Motion & Gravity',
            subject: 'Physics 1st Paper',
            status: 'assigned',
            questionCount: 5,
            timeLimitMin: 15,
            isNew: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'q-f2',
            title: isBnRef.current ? 'রসায়ন ১ম পত্র: গুণগত রসায়ন ও কোয়ান্টাম সংখ্যা' : 'Chemistry 1st Paper: Quantum Numbers & Orbitals',
            subject: 'Chemistry 1st Paper',
            status: 'assigned',
            questionCount: 5,
            timeLimitMin: 15,
            isNew: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'q-f3',
            title: isBnRef.current ? 'উচ্চতর গণিত ১ম পত্র: ম্যাট্রিক্স ও নির্ণায়ক' : 'Higher Mathematics: Matrix & Determinants',
            subject: 'Higher Mathematics',
            status: 'completed',
            questionCount: 5,
            score: 92,
            completedAt: isBnRef.current ? 'গতকাল' : 'Yesterday',
          },
          {
            id: 'q-f4',
            title: isBnRef.current ? 'আইসিটি: সংখ্যা পদ্ধতি ও বুলিয়ান অ্যালজেব্রা' : 'ICT: Number Systems & Boolean Algebra',
            subject: 'ICT',
            status: 'completed',
            questionCount: 5,
            score: 96,
            completedAt: isBnRef.current ? '৩ দিন আগে' : '3 days ago',
          },
          {
            id: 'q-f5',
            title: isBnRef.current ? 'পদার্থবিজ্ঞান ১ম পত্র: ভেক্টর ও গতিবিদ্যা' : 'Physics 1st Paper: Vectors & Dynamics',
            subject: 'Physics 1st Paper',
            status: 'completed',
            questionCount: 5,
            score: 88,
            completedAt: isBnRef.current ? '৫ দিন আগে' : '5 days ago',
          },
        ]
      : isTasnim
      ? [
          {
            id: 'q-t2',
            title: isBnRef.current ? 'প্রাথমিক বিজ্ঞান: জীবনের জন্য পানি বিশুদ্ধকরণ' : 'Primary Science: Safe Water & Purification',
            subject: 'General Science',
            status: 'assigned',
            questionCount: 5,
            timeLimitMin: 15,
            isNew: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'q-t1',
            title: isBnRef.current ? 'প্রাথমিক গণিত: গুণনীয়ক ও লসাগু-গসাগু কুইজ' : 'Primary Math: Factors & LCM-HCF Quiz',
            subject: 'Mathematics',
            status: 'completed',
            questionCount: 5,
            score: 95,
            completedAt: isBnRef.current ? 'গতকাল' : 'Yesterday',
          },
          {
            id: 'q-t3',
            title: isBnRef.current ? 'প্রাথমিক বাংলা: বীরপুরুষ কবিতা ও শব্দার্থ' : 'Primary Bangla: Birpurush Poem & Vocabulary',
            subject: 'Bangla',
            status: 'completed',
            questionCount: 5,
            score: 90,
            completedAt: isBnRef.current ? '৩ দিন আগে' : '3 days ago',
          },
          {
            id: 'q-t4',
            title: isBnRef.current ? 'বাংলাদেশ ও বিশ্বপরিচয়: আমাদের মুক্তিযুদ্ধ ও বীরত্ব' : 'BGS: Our Liberation War',
            subject: 'Bangladesh & Global Studies',
            status: 'completed',
            questionCount: 5,
            score: 92,
            completedAt: isBnRef.current ? '৫ দিন আগে' : '5 days ago',
          },
        ]
      : [
          {
            id: 'q-r2',
            title: isBnRef.current ? 'পদার্থবিজ্ঞান: গতির সমীকরণ ও ত্বরণ' : 'Physics: Equations of Motion & Acceleration',
            subject: 'General Science',
            status: 'assigned',
            questionCount: 5,
            timeLimitMin: 15,
            isNew: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'q-r4',
            title: isBnRef.current ? 'ইংরেজি ১ম পত্র: Right Forms of Verbs & Prepositions' : 'English: Right Forms of Verbs & Prepositions',
            subject: 'English 1st Paper',
            status: 'assigned',
            questionCount: 5,
            timeLimitMin: 15,
            isNew: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'q-r1',
            title: isBnRef.current ? 'গণিত: বীজগাণিতিক সূত্রাবলী ও প্রয়োগ কুইজ' : 'Class 8 Math: Algebraic Formulae Quiz',
            subject: 'Mathematics',
            status: 'completed',
            questionCount: 5,
            score: 85,
            completedAt: isBnRef.current ? 'গতকাল' : 'Yesterday',
          },
          {
            id: 'q-r3',
            title: isBnRef.current ? 'সাধারণ বিজ্ঞান: রাসায়নিক বিক্রিয়া ও সমতাকরণ' : 'Science: Chemical Reactions & Balancing',
            subject: 'General Science',
            status: 'completed',
            questionCount: 5,
            score: 90,
            completedAt: isBnRef.current ? '৩ দিন আগে' : '3 days ago',
          },
          {
            id: 'q-r5',
            title: isBnRef.current ? 'বাংলাদেশ ও বিশ্বপরিচয়: প্রাচীন বাংলার ইতিহাস' : 'BGS: Ancient Bengal History',
            subject: 'Bangladesh & Global Studies',
            status: 'completed',
            questionCount: 5,
            score: 88,
            completedAt: isBnRef.current ? '৬ দিন আগে' : '6 days ago',
          },
        ];

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

    Promise.all([
      childId ? api.get(`/children/${childId}/quizzes`).catch(() => null) : Promise.resolve(null),
      childId ? api.get(`/children/${childId}/dashboard/topics`).catch(() => null) : Promise.resolve(null),
    ])
      .then(([quizzesRes, topicsRes]) => {
        if (!isMounted) return;

        const rawQuizzes = quizzesRes?.data?.data;
        const qList = Array.isArray(rawQuizzes?.data)
          ? rawQuizzes.data
          : Array.isArray(rawQuizzes)
          ? rawQuizzes
          : [];

        if (qList.length > 0) {
          // Merge with fallback completion scores if score is missing
          const merged = qList.map((q: any) => {
            const foundFallback = fallbackQuizzes.find((fb) => fb.id === q.id || fb.title === q.title);
            return {
              ...q,
              score: q.score !== undefined && q.score !== null ? q.score : foundFallback?.score,
              completedAt: q.completedAt || foundFallback?.completedAt,
              questionCount: q.questionCount || q.questions?.length || 5,
              timeLimitMin: q.timeLimitMin || 15,
            };
          });
          setQuizzes(merged);
        } else {
          // The fallback list is the demo dataset — only for a demo child.
          setQuizzes(isDemoChild ? fallbackQuizzes : []);
        }

        if (topicsRes?.data?.data && (topicsRes.data.data.weakest || topicsRes.data.data.strongest)) {
          setTopics(topicsRes.data.data);
        } else {
          setTopics(isDemoChild ? fallbackTopics : null);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setQuizzes(isDemoChild ? fallbackQuizzes : []);
        setTopics(isDemoChild ? fallbackTopics : null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [childId, isTasnim, isFahim, isDemoChild]);

  const quizList = Array.isArray(quizzes) ? quizzes : [];

  const isCompletedQuiz = (quiz: any) => quiz.status === 'completed'
    || (quiz.score !== null && quiz.score !== undefined);
  const completedQuizzes = quizList.filter(isCompletedQuiz);
  // Completed attempts belong only in history, even if an older payload still
  // marks the quiz assigned/new. Drafts are never available for a child to take.
  const pendingQuizzes = quizList.filter((quiz) => quiz.status !== 'draft' && !isCompletedQuiz(quiz));

  // Aggregate stats
  const totalCompleted = completedQuizzes.length;
  const totalPending = pendingQuizzes.length;
  const avgScore =
    totalCompleted > 0
      ? Math.round(completedQuizzes.reduce((acc, q) => acc + (q.score || 0), 0) / totalCompleted)
      : isDemoChild
      ? isFahim
        ? 92
        : isTasnim
        ? 92
        : 88
      : 0;
  const highestScore =
    totalCompleted > 0
      ? Math.max(...completedQuizzes.map((q) => q.score || 0))
      : isDemoChild
      ? isFahim
        ? 96
        : isTasnim
        ? 95
        : 90
      : 0;

  const renderQuiz = (q: any) => {
    const isDone = q.status === 'completed' || (q.score !== null && q.score !== undefined);
    const scoreNum = q.score || 0;
    const scoreColor =
      scoreNum >= 85
        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
        : scoreNum >= 70
        ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';

    return (
      <Card
        key={q.id}
        className={`rounded-3xl border transition-all overflow-hidden ${
          !isDone
            ? 'border-indigo-500/40 bg-gradient-to-r from-indigo-500/5 via-card to-card hover:border-indigo-500/60 shadow-xs'
            : 'border-border/70 bg-card hover:border-primary/40 shadow-xs'
        }`}
      >
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Info, Subject & Title */}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isDone ? (
                <Badge className="bg-emerald-500 text-white font-bold text-[10px] px-2 py-0.5 flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>{t('childQuiz.text_25')}</span>
                </Badge>
              ) : (
                <Badge className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  <span>{t('childQuiz.text_26')}</span>
                </Badge>
              )}

              {q.subject && (
                <Badge variant="outline" className="text-[10px] font-semibold border-primary/25 text-primary">
                  {q.subject}
                </Badge>
              )}

              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-lg border">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span>
                  {q.questionCount || 5} {t('childQuiz.text_27')}
                </span>
                <span>•</span>
                <span>
                  {t('childQuiz.mins', { p0: isBn ? toBnNum(q.timeLimitMin || 15) : q.timeLimitMin || 15 }, `${q.timeLimitMin || 15} mins`)}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                {q.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isDone
                  ? t('childQuiz.taken', { p0: isBn ? q.completedAt || 'সম্প্রতি' : q.completedAt || 'Recently' }, `Taken: ${q.completedAt || 'Recently'}`)
                  : t('childQuiz.text_28')}
              </p>
            </div>

            {/* Result Score Bar if completed */}
            {isDone && (
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl border ${scoreColor}`}>
                    {t('childQuiz.score', { p0: isBn ? toBnNum(scoreNum) : scoreNum }, `Score: ${scoreNum}%`)}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round((scoreNum / 100) * 5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                  <span className="text-[11px] font-bold text-foreground ml-1">
                    ({scoreNum >= 85 ? (t('childQuiz.text_29')) : (t('childQuiz.text_30'))})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <Link href={`/child/quiz/${q.id}`}>
              <Button
                size="sm"
                className={`h-10 px-4 text-xs font-bold rounded-2xl shadow-md gap-1.5 ${
                  !isDone
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                {!isDone ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{t('childQuiz.text_31')}</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('childQuiz.text_32')}</span>
                  </>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <KidShell>
      <div className="space-y-6 pb-12">
        {/* ======================================================== */}
        {/* 1. Page Header */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Brain className="w-4 h-4" />
                {t('childQuiz.heading')}
              </span>
              <Badge variant="secondary" className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 font-bold">
                {studentGrade}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <span>{t('childQuiz.text_2')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              {t('childQuiz.text_3')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Link href="/child">
              <Button
                variant="outline"
                className="rounded-2xl h-10 px-4 text-xs font-bold gap-1.5 border-border hover:bg-muted"
              >
                <span>{t('childQuiz.text_4')}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. Top Summary KPI Cards (4 Cards) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Pending Quizzes */}
          <Card className="rounded-2xl border shadow-xs bg-card/60 backdrop-blur-sm">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {t('childQuiz.text_5')}
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-black text-foreground">
                {isBn ? toBnNum(totalPending) : totalPending}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  {t('childQuiz.text_6')}
                </span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1 flex items-center gap-1">
                {totalPending > 0 ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>{t('childQuiz.text_7')}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>{t('childQuiz.text_8')}</span>
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Quizzes Completed */}
          <Card className="rounded-2xl border shadow-xs bg-card/60 backdrop-blur-sm">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {t('childQuiz.text_9')}
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-black text-foreground">
                {isBn ? toBnNum(totalCompleted) : totalCompleted}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  {t('childQuiz.text_10')}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">
                {t('childQuiz.text_11')}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Average Score */}
          <Card className="rounded-2xl border shadow-xs bg-card/60 backdrop-blur-sm">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {t('childQuiz.text_12')}
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-black text-foreground">
                {t('childQuiz.avg_score', { p0: isBn ? toBnNum(avgScore) : avgScore }, `${avgScore}%`)}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                {avgScore >= 85
                  ? t('childQuiz.text_13')
                  : t('childQuiz.text_14')}
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Highest Score */}
          <Card className="rounded-2xl border shadow-xs bg-card/60 backdrop-blur-sm">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {t('childQuiz.text_15')}
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-black text-foreground">
                {t('childQuiz.highest_score', { p0: isBn ? toBnNum(highestScore) : highestScore }, `${highestScore}%`)}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">
                {t('childQuiz.text_16')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* 3. Available Quizzes */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between gap-3 border-b pb-3">
          <h2 className="text-sm font-bold">{isBn ? 'দেওয়ার জন্য কুইজ' : 'Available quizzes'}</h2>
          <span className="text-xs text-muted-foreground">
            {t('childQuiz.showing_quiz', { p0: isBn ? toBnNum(pendingQuizzes.length) : pendingQuizzes.length, p1: pendingQuizzes.length === 1 ? '' : 'zes' }, `Showing ${pendingQuizzes.length} quiz${pendingQuizzes.length === 1 ? '' : 'zes'}`)}
          </span>
        </div>

        {/* ======================================================== */}
        {/* 4. Quiz Cards Grid (Pending & Results) */}
        {/* ======================================================== */}
        <div className="space-y-4">
          {pendingQuizzes.length === 0 ? (
            <Card className="rounded-3xl border border-dashed p-10 text-center bg-muted/10">
              <Brain className="w-12 h-12 mx-auto text-muted-foreground/60 mb-3" />
              <h3 className="text-base font-bold text-foreground">
                {loading ? t('common.loading', 'Loading...') : t('childQuiz.text_20')}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {t('childQuiz.text_22')}
              </p>

            </Card>
          ) : (
            <div className="grid gap-3.5">
              {pendingQuizzes.map(renderQuiz)}
            </div>
          )}
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
                        {/* `s.accuracy`, not `w.accuracy` — this is the *strongest* topics
                            list, and `w` belongs to the weak-topics map above. It
                            rendered `undefined%` before. */}
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

        {/* ======================================================== */}
        {/* 6. Helpful Tips Card */}
        {/* ======================================================== */}
        <Card className="rounded-3xl border shadow-xs bg-muted/15">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t('childQuiz.text_39')}</span>
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              {t('childQuiz.text_40')}
            </CardDescription>
          </CardHeader>
        </Card>

        <details className="group/past-quizzes rounded-3xl border bg-card shadow-xs">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5 text-sm font-bold [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {isBn ? 'আগের কুইজ দেখুন' : 'Show past quiz'}
              <Badge variant="secondary">{isBn ? toBnNum(totalCompleted) : totalCompleted}</Badge>
            </span>
            <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open/past-quizzes:rotate-90" />
          </summary>
          <div className="border-t p-4 sm:p-5 space-y-3.5">
            {completedQuizzes.length > 0 ? completedQuizzes.map(renderQuiz) : (
              <p className="text-xs text-muted-foreground text-center py-3">
                {loading ? t('common.loading', 'Loading...') : (isBn ? 'এখনও কোনো কুইজ দেওয়া হয়নি।' : 'No past quizzes yet.')}
              </p>
            )}
          </div>
        </details>
      </div>
    </KidShell>
  );
}
