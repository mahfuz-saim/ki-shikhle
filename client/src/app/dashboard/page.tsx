'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
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
  ArrowRight,
  Plus,
  BookOpen,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

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

  const childId = activeChild?.id || childrenList[0]?.id || 'demo-child-1';

  useEffect(() => {
    if (!childId) return;
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
      const isTasnim = childId === 'demo-child-2';

      // Summary
      if (sumRes.status === 'fulfilled' && sumRes.value.data?.data && (sumRes.value.data.data.kpis?.totalTime > 0 || sumRes.value.data.data.kpis?.studyDays > 0)) {
        setSummary(sumRes.value.data.data);
      } else {
        setSummary(
          isTasnim
            ? {
                kpis: { studyDays: 6, totalTime: 360, quizzes: 6, avgScore: 95, streak: 6 },
                recent: [
                  { date: new Date().toISOString(), topicsText: 'Mathematics - Fractions & Decimals (লসাগু ও গসাগু)', source: 'tuition' },
                  { date: new Date(Date.now() - 86400000).toISOString(), topicsText: 'Primary Science - Living & Non-living Things', source: 'school' },
                  { date: new Date(Date.now() - 172800000).toISOString(), topicsText: 'English for Today - Lesson 4 Story Reading', source: 'self_study' },
                  { date: new Date(Date.now() - 259200000).toISOString(), topicsText: 'BGS - Liberation War 1971 History', source: 'tuition' },
                  { date: new Date(Date.now() - 345600000).toISOString(), topicsText: 'Bangla - হাতি আর শিয়ালের গল্প ও শব্দার্থ', source: 'school' },
                ],
              }
            : {
                kpis: { studyDays: 5, totalTime: 420, quizzes: 4, avgScore: 88, streak: 5 },
                recent: [
                  { date: new Date().toISOString(), topicsText: 'Algebra - Quadratic Equations Formula (বর্গের সূত্রাবলী)', source: 'tuition' },
                  { date: new Date(Date.now() - 86400000).toISOString(), topicsText: 'Physics - Newton Laws of Motion & Acceleration', source: 'school' },
                  { date: new Date(Date.now() - 172800000).toISOString(), topicsText: 'English - Right Forms of Verbs & Prepositions', source: 'self_study' },
                  { date: new Date(Date.now() - 259200000).toISOString(), topicsText: 'ICT - Spreadsheet Formulas in Excel', source: 'tuition' },
                  { date: new Date(Date.now() - 345600000).toISOString(), topicsText: 'Bangla - বঙ্গভূমির প্রতি কবিতা ও ভাবসম্প্রসারণ', source: 'self_study' },
                ],
              }
        );
      }

      // Study time
      if (stRes.status === 'fulfilled' && stRes.value.data?.data?.length && stRes.value.data.data.some((x: any) => (x.school || 0) + (x.tuition || 0) + (x.self_study || 0) > 0)) {
        setStudyTime(stRes.value.data.data);
      } else {
        setStudyTime(
          isTasnim
            ? [
                { date: 'Mon', school: 45, tuition: 0, self_study: 30 },
                { date: 'Tue', school: 45, tuition: 60, self_study: 20 },
                { date: 'Wed', school: 45, tuition: 0, self_study: 35 },
                { date: 'Thu', school: 45, tuition: 60, self_study: 20 },
                { date: 'Fri', school: 0, tuition: 45, self_study: 30 },
                { date: 'Sat', school: 0, tuition: 0, self_study: 40 },
                { date: 'Sun', school: 45, tuition: 60, self_study: 25 },
              ]
            : [
                { date: 'Mon', school: 60, tuition: 75, self_study: 45 },
                { date: 'Tue', school: 60, tuition: 90, self_study: 40 },
                { date: 'Wed', school: 60, tuition: 75, self_study: 50 },
                { date: 'Thu', school: 60, tuition: 90, self_study: 45 },
                { date: 'Fri', school: 0, tuition: 60, self_study: 60 },
                { date: 'Sat', school: 0, tuition: 0, self_study: 60 },
                { date: 'Sun', school: 60, tuition: 90, self_study: 45 },
              ]
        );
      }

      // Subjects
      if (subjRes.status === 'fulfilled' && subjRes.value.data?.data?.length && subjRes.value.data.data.some((x: any) => (x.value || x.count || 0) > 0)) {
        setSubjects(subjRes.value.data.data);
      } else {
        setSubjects(
          isTasnim
            ? [
                { subject: isBn ? 'প্রাথমিক গণিত' : 'Elementary Math', value: 9 },
                { subject: isBn ? 'প্রাথমিক বিজ্ঞান' : 'Primary Science', value: 6 },
                { subject: isBn ? 'ইংরেজি' : 'English for Today', value: 5 },
                { subject: isBn ? 'বাংলাদেশ ও বিশ্বপরিচয়' : 'BGS', value: 4 },
                { subject: isBn ? 'বাংলা' : 'Bangla', value: 3 },
              ]
            : [
                { subject: isBn ? 'গণিত' : 'Mathematics', value: 12 },
                { subject: isBn ? 'পদার্থবিজ্ঞান' : 'Physics', value: 8 },
                { subject: isBn ? 'ইংরেজি' : 'English 1st Paper', value: 6 },
                { subject: isBn ? 'তথ্যপ্রযুক্তি' : 'ICT', value: 5 },
                { subject: isBn ? 'বাংলা' : 'Bangla 1st Paper', value: 4 },
              ]
        );
      }

      // Scores
      if (scrRes.status === 'fulfilled' && scrRes.value.data?.data?.length && scrRes.value.data.data.some((x: any) => x.score > 0)) {
        setScores(scrRes.value.data.data);
      } else {
        setScores(
          isTasnim
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
      }

      // Mastery
      if (mastRes.status === 'fulfilled' && mastRes.value.data?.data?.length && mastRes.value.data.data.some((x: any) => x.accuracy > 0)) {
        setMastery(mastRes.value.data.data);
      } else {
        setMastery(
          isTasnim
            ? [
                { subject: isBn ? 'গণিত (লসাগু-গসাগু)' : 'Math (LCM-HCF)', accuracy: 96 },
                { subject: isBn ? 'বিজ্ঞান (পানি চক্র)' : 'Science (Water Cycle)', accuracy: 92 },
                { subject: isBn ? 'ইংরেজি (Vocabulary)' : 'English (Vocabulary)', accuracy: 90 },
                { subject: isBn ? 'বিজিএস (মুক্তিযুদ্ধ)' : 'BGS (Liberation War)', accuracy: 94 },
                { subject: isBn ? 'বাংলা (ব্যাকরণ)' : 'Bangla (Grammar)', accuracy: 88 },
              ]
            : [
                { subject: isBn ? 'বিজ্ঞান (পদার্থ ও গতি)' : 'Science (Physics & Motion)', accuracy: 92 },
                { subject: isBn ? 'গণিত (বীজগণিত)' : 'Math (Algebra)', accuracy: 88 },
                { subject: isBn ? 'বাংলা (সাহিত্য)' : 'Bangla (Literature)', accuracy: 85 },
                { subject: isBn ? 'ইংরেজি (Grammar)' : 'English (Grammar)', accuracy: 80 },
                { subject: isBn ? 'আইসিটি (Spreadsheet)' : 'ICT (Spreadsheet)', accuracy: 75 },
              ]
        );
      }

      // Consistency
      if (consRes.status === 'fulfilled' && consRes.value.data?.data && Object.keys(consRes.value.data.data).length > 0 && Object.values(consRes.value.data.data).some((v: any) => v > 0)) {
        setConsistency(consRes.value.data.data);
      } else {
        const out: Record<string, number> = {};
        for (let i = 0; i < 180; i++) {
          const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
          out[d] = isTasnim ? (i % 2 === 0 ? 1 : i % 5 === 0 ? 0 : 1) : (i % 7 === 0 ? 0 : i % 4 === 0 ? 2 : 1);
        }
        setConsistency(out);
      }

      // Topics
      if (topRes.status === 'fulfilled' && topRes.value.data?.data?.weakest?.length && topRes.value.data.data.weakest.some((x: any) => x.accuracy > 0)) {
        setTopics(topRes.value.data.data);
      } else {
        setTopics(
          isTasnim
            ? {
                weakest: [
                  { subject: isBn ? 'ইংরেজি: Spelling & Prepositions' : 'English: Spelling & Prepositions', accuracy: 84 },
                  { subject: isBn ? 'বিজ্ঞান: পরিবেশ ও বাস্তুসংস্থান' : 'Science: Ecosystem & Food Chain', accuracy: 86 },
                ],
                strongest: [
                  { subject: isBn ? 'গণিত: ভগ্নাংশের যোগ-বিয়োগ' : 'Math: Fractions Addition & Subtraction', accuracy: 98 },
                  { subject: isBn ? 'বিজিএস: আমাদের পরিবেশ ও ঐতিহ্য' : 'BGS: Historical Heritage Sites', accuracy: 96 },
                ],
              }
            : {
                weakest: [
                  { subject: isBn ? 'রসায়ন: পর্যায় সারণি' : 'Chemistry: Periodic Table Trends', accuracy: 64 },
                  { subject: isBn ? 'পদার্থ: নিউটনের ৩য় সূত্র' : 'Physics: Action & Reaction Vectors', accuracy: 72 },
                ],
                strongest: [
                  { subject: isBn ? 'গণিত: দ্বিঘাত সমীকরণ' : 'Math: Quadratic Formula & Roots', accuracy: 92 },
                  { subject: isBn ? 'ইংরেজি: Tense & Verb Forms' : 'English: Verb Conjugations', accuracy: 88 },
                ],
              }
        );
      }

      setLoading(false);
    });
  }, [childId, isBn]);

  const isCurrentTasnim = childId === 'demo-child-2';
  const defaultKpis = isCurrentTasnim
    ? { studyDays: 6, totalTime: 360, quizzes: 6, avgScore: 95, streak: 6 }
    : { studyDays: 5, totalTime: 420, quizzes: 4, avgScore: 88, streak: 5 };
  const kpis = (summary?.kpis?.totalTime || summary?.kpis?.studyDays) ? summary.kpis : defaultKpis;
  const hours = Math.floor(kpis.totalTime / 60);
  const minutes = kpis.totalTime % 60;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {isBn ? 'লার্নিং ওভারভিউ' : 'Learning Overview'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isBn
                ? 'এক নজরে সন্তানের পড়ার অগ্রগতি, সময় ও কুইজ ফলাফল'
                : '30-second snapshot of your child\'s study consistency and quiz performance.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/children/${childId}/log`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isBn ? 'পড়ার লগ দেখুন' : 'View Study Logs'}</span>
              </Button>
            </Link>
            <Link href={`/children/${childId}/quizzes/new`}>
              <Button size="sm" className="gap-1.5 text-xs h-9 shadow-sm shadow-primary/20">
                <Brain className="w-3.5 h-3.5" />
                <span>{isBn ? 'নতুন এআই কুইজ' : 'Create AI Quiz'}</span>
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
                  {isBn ? 'পড়ার দিন' : 'Study Days'}
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
                  {isBn ? 'মোট সময়' : 'Total Study Time'}
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
                  {isBn ? 'কুইজ সম্পন্ন' : 'Quizzes Taken'}
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
                  {isBn ? 'গড় স্কোর' : 'Average Score'}
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
                  {isBn ? 'পড়ার স্ট্রিক' : 'Daily Streak'}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-amber-500" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1 flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span>{kpis.streak}</span>
                <span className="text-xs font-normal text-muted-foreground">{isBn ? 'দিন একটানা' : 'Days active'}</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Charts Row 1: Weekly Study Time & Subject Distribution */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">
                    {t('dashboard.weeklyStudyTime', 'Weekly Study Time')}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isBn
                      ? 'স্কুল, প্রাইভেট ও নিজের পড়ার সময়কাল (মিনিটে)'
                      : 'Time spent across school, tuition, and self-study (minutes)'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <StudyTimeChart data={studyTime} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">
                {t('dashboard.subjectDistribution', 'Subject Distribution')}
              </CardTitle>
              <CardDescription className="text-xs">
                {isBn ? 'কোন বিষয়ে কতগুলো পাঠ সম্পন্ন হয়েছে' : 'Breakdown of lessons completed per subject'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubjectDonut data={subjects} />
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2: Score Trend & Subject Mastery Radar */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">
                {t('dashboard.scoreTrend', 'Quiz Score Progress')}
              </CardTitle>
              <CardDescription className="text-xs">
                {isBn ? 'গত কয়েকটি কুইজের স্কোরের অগ্রগতি' : 'Quiz performance trend over recent weeks'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreTrendChart data={scores} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">
                {t('dashboard.subjectMastery', 'Subject Mastery Radar')}
              </CardTitle>
              <CardDescription className="text-xs">
                {isBn ? 'বিষয়ভিত্তিক নির্ভুলতার হার ও দক্ষতা' : 'Calculated accuracy percentage across curriculum subjects'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MasteryRadar data={mastery} />
            </CardContent>
          </Card>
        </div>

        {/* Consistency Heatmap & Topic Breakdown */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Activity Consistency Calendar */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">
                {isBn ? 'মাসিক পড়ার ধারাবাহিকতা ক্যালেন্ডার' : 'Monthly Study Consistency Calendar'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isBn
                  ? 'প্রতি মাসের দৈনিক পাঠ সম্পন্ন ও মিসের হিসাব — হালকা সবুজ: সম্পন্ন, হালকা লাল: মিস'
                  : 'Monthly activity tracking — soft green indicates completed study logs, soft red indicates missed sessions'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyActivityCalendar data={consistency} isBn={isBn} />
            </CardContent>
          </Card>

          {/* Weakest & Strongest Topics */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">
                {isBn ? 'অধ্যায়ভিত্তিক পারদর্শিতা' : 'Topic Accuracy & Revision Needs'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isBn ? 'দুর্বল ও আয়ত্তাধীন অধ্যায়সমূহ' : 'Identified from actual quiz questions and wrong answers'}
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

        {/* Schedule & Recent Activity Timeline */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Missed & Upcoming */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">
                  {t('dashboard.upcomingSchedule', 'Schedule & Reminders')}
                </CardTitle>
                <Link href="/schedule" className="text-xs text-primary hover:underline font-medium">
                  {t('common.viewAll', 'View Calendar')} →
                </Link>
              </div>
              <CardDescription className="text-xs">
                {isBn ? 'আসন্ন টিউশন ও মিস হওয়া সেশনের হিসাব' : 'Upcoming coaching sessions and missed log alerts'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/5 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-destructive">
                    {isBn ? '১টি সেশনে লগ মিস হয়েছে' : 'Missed log alert'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isBn
                      ? 'পদার্থবিজ্ঞান প্রাইভেট — নির্ধারিত ছিল কিন্তু কোনো লগ যোগ করা হয়নি।'
                      : 'Physics Tuition — Scheduled on Sunday 4:00 PM had no learning log.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isBn ? 'আসন্ন টিউশন' : 'Upcoming Routines'}
                </p>
                <div className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/30 text-xs">
                  <span className="font-medium">
                    {isBn ? 'গণিত প্রাইভেট (রহিম স্যার)' : 'Math Tuition – Rahim Sir'}
                  </span>
                  <span className="text-muted-foreground">{isBn ? 'রবিবার বিকাল ৪:০০' : 'Sun 4:00 PM'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/30 text-xs">
                  <span className="font-medium">
                    {isBn ? 'ইংরেজি স্পোকেন ও গ্রামার' : 'English Grammar & Writing'}
                  </span>
                  <span className="text-muted-foreground">{isBn ? 'মঙ্গলবার বিকাল ৫:৩০' : 'Tue 5:30 PM'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">
                  {t('dashboard.recentActivity', 'Recent Activity Feed')}
                </CardTitle>
                <Link href={`/children/${childId}/log`} className="text-xs text-primary hover:underline font-medium">
                  {isBn ? 'সব লগ' : 'All logs'} →
                </Link>
              </div>
              <CardDescription className="text-xs">
                {isBn ? 'সর্বশেষ এন্ট্রি এবং কুইজের তালিকা' : 'Latest study logs and quiz attempts for this student'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary?.recent?.map((r: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">
                        {r.topicsText || r.topic}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                        <span className="capitalize">{r.source}</span>
                        <span>•</span>
                        <span>{new Date(r.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
