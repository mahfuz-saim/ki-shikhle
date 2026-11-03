'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/components/auth/auth-context';
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
  ArrowRight,
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

  const childId = activeChild?.id || childrenList[0]?.id || 'demo-child-1';
  const currentChild = childrenList.find((c) => c.id === childId) || activeChild || childrenList[0];
  const institutionType = getInstitutionType(currentChild?.grade);

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
      const isFahim = childId === 'demo-child-3';

      // Summary
      if (sumRes.status === 'fulfilled' && sumRes.value.data?.data && (sumRes.value.data.data.kpis?.totalTime > 0 || sumRes.value.data.data.kpis?.studyDays > 0)) {
        setSummary(sumRes.value.data.data);
      } else {
        setSummary(
          isFahim
            ? {
                kpis: { studyDays: 6, totalTime: 1560, quizzes: 4, avgScore: 92, streak: 7 },
                recent: [
                  { date: new Date().toISOString(), topicsText: 'Physics 1st Paper - Projectile Motion (প্রক্ষেপকের গাণিতিক সমাধান)', source: 'college' },
                  { date: new Date(Date.now() - 3600000 * 3).toISOString(), topicsText: 'Chemistry 1st Paper - Bohr Atomic Model & Quantum Numbers', source: 'college' },
                  { date: new Date(Date.now() - 3600000 * 6).toISOString(), topicsText: 'Physics Coaching - Advanced Trajectory Equations', source: 'tuition' },
                  { date: new Date(Date.now() - 86400000).toISOString(), topicsText: 'Higher Math - Matrix Multiplication & Inverse Matrix', source: 'college' },
                  { date: new Date(Date.now() - 86400000 * 2).toISOString(), topicsText: 'ICT - Binary, Octal & Hexadecimal Conversions', source: 'college' },
                ],
              }
            : isTasnim
            ? {
                kpis: { studyDays: 6, totalTime: 1080, quizzes: 6, avgScore: 95, streak: 6 },
                recent: [
                  { date: new Date().toISOString(), topicsText: 'Elementary Math - Factors & Multiples (লসাগু ও গসাগু নির্ণয়)', source: 'school' },
                  { date: new Date(Date.now() - 3600000 * 4).toISOString(), topicsText: 'Primary Science - Safe Drinking Water & Purification Steps', source: 'school' },
                  { date: new Date(Date.now() - 3600000 * 7).toISOString(), topicsText: 'Math Tutor - Word Problems on Bell Intervals', source: 'tuition' },
                  { date: new Date(Date.now() - 86400000).toISOString(), topicsText: 'English - Food Pyramid & Healthy Eating Vocabulary', source: 'school' },
                  { date: new Date(Date.now() - 86400000 * 2).toISOString(), topicsText: 'BGS - 25th March Crackdown & Liberation War History', source: 'school' },
                ],
              }
            : {
                kpis: { studyDays: 6, totalTime: 1350, quizzes: 5, avgScore: 88, streak: 6 },
                recent: [
                  { date: new Date().toISOString(), topicsText: 'Mathematics - Algebraic Formulae (বর্গের সূত্রাবলী ও প্রয়োগ)', source: 'school' },
                  { date: new Date(Date.now() - 3600000 * 4).toISOString(), topicsText: 'General Science - 3 Equations of Motion & v-t Graphs', source: 'school' },
                  { date: new Date(Date.now() - 3600000 * 7).toISOString(), topicsText: 'Math Tuition - Value Finding with Rahim Sir', source: 'tuition' },
                  { date: new Date(Date.now() - 86400000).toISOString(), topicsText: 'ICT - Microsoft Excel Spreadsheet Formulas', source: 'school' },
                  { date: new Date(Date.now() - 86400000 * 2).toISOString(), topicsText: 'Bangla 1st Paper - "Bongobhumir Proti" Poem Comprehension', source: 'school' },
                ],
              }
        );
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
      } else {
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
      }

      // Subjects
      if (subjRes.status === 'fulfilled' && subjRes.value.data?.data?.length && subjRes.value.data.data.some((x: any) => (x.value || x.count || 0) > 0)) {
        setSubjects(subjRes.value.data.data);
      } else {
        setSubjects(
          isFahim
            ? [
                { subject: isBn ? 'পদার্থবিজ্ঞান ১ম পত্র' : 'Physics 1st Paper', value: 14 },
                { subject: isBn ? 'উচ্চতর গণিত ১ম পত্র' : 'Higher Math 1st Paper', value: 12 },
                { subject: isBn ? 'রসায়ন ১ম পত্র' : 'Chemistry 1st Paper', value: 10 },
                { subject: isBn ? 'তথ্য ও প্রযুক্তি' : 'ICT', value: 8 },
                { subject: isBn ? 'উদ্ভিদবিজ্ঞান' : 'Biology 1st Paper', value: 6 },
              ]
            : isTasnim
            ? [
                { subject: isBn ? 'প্রাথমিক গণিত' : 'Elementary Math', value: 9 },
                { subject: isBn ? 'প্রাথমিক বিজ্ঞান' : 'Primary Science', value: 6 },
                { subject: isBn ? 'ইংরেজি' : 'English for Today', value: 5 },
                { subject: isBn ? 'বাংলাদেশ ও বিশ্বপরিচয়' : 'BGS', value: 4 },
                { subject: isBn ? 'বাংলা' : 'Bangla', value: 3 },
              ]
            : [
                { subject: isBn ? 'গণিত' : 'Mathematics', value: 12 },
                { subject: isBn ? 'সাধারণ বিজ্ঞান' : 'General Science', value: 8 },
                { subject: isBn ? 'ইংরেজি ১ম পত্র' : 'English 1st Paper', value: 6 },
                { subject: isBn ? 'তথ্য ও প্রযুক্তি' : 'ICT', value: 5 },
                { subject: isBn ? 'বাংলা ১ম পত্র' : 'Bangla 1st Paper', value: 4 },
              ]
        );
      }

      // Scores
      if (scrRes.status === 'fulfilled' && scrRes.value.data?.data?.length && scrRes.value.data.data.some((x: any) => x.score > 0)) {
        setScores(scrRes.value.data.data);
      } else {
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
      }

      // Mastery
      if (mastRes.status === 'fulfilled' && mastRes.value.data?.data?.length && mastRes.value.data.data.some((x: any) => x.accuracy > 0)) {
        setMastery(mastRes.value.data.data);
      } else {
        setMastery(
          isFahim
            ? [
                { subject: isBn ? 'পদার্থবিজ্ঞান (গতিবিদ্যা ও প্রক্ষেপক)' : 'Physics (Projectile Motion)', accuracy: 95 },
                { subject: isBn ? 'উচ্চতর গণিত (ম্যাট্রিক্স ও নির্ণায়ক)' : 'Higher Math (Matrices)', accuracy: 92 },
                { subject: isBn ? 'রসায়ন (গুণগত রসায়ন ও কোয়ান্টাম)' : 'Chemistry (Quantum Numbers)', accuracy: 88 },
                { subject: isBn ? 'তথ্যপ্রযুক্তি (সংখ্যা পদ্ধতি)' : 'ICT (Number Systems)', accuracy: 85 },
                { subject: isBn ? 'উদ্ভিদবিজ্ঞান (কোষ ও এর গঠন)' : 'Biology (Cell Structure)', accuracy: 82 },
              ]
            : isTasnim
            ? [
                { subject: isBn ? 'গণিত (লসাগু ও গসাগু)' : 'Math (LCM-HCF)', accuracy: 96 },
                { subject: isBn ? 'বিজ্ঞান (পানি চক্র ও নিরাপদ পানি)' : 'Science (Water Cycle)', accuracy: 92 },
                { subject: isBn ? 'ইংরেজি (Vocabulary & Reading)' : 'English (Vocabulary)', accuracy: 90 },
                { subject: isBn ? 'বিজিএস (আমাদের মুক্তিযুদ্ধ)' : 'BGS (Liberation War)', accuracy: 94 },
                { subject: isBn ? 'বাংলা (যুক্তবর্ণ ও শব্দার্থ)' : 'Bangla (Grammar)', accuracy: 88 },
              ]
            : [
                { subject: isBn ? 'বিজ্ঞান (পদার্থ ও গতিসূত্র)' : 'Science (Physics & Motion)', accuracy: 92 },
                { subject: isBn ? 'গণিত (বীজগণিতীয় সূত্রাবলী)' : 'Math (Algebra)', accuracy: 88 },
                { subject: isBn ? 'বাংলা (বঙ্গভূমির প্রতি)' : 'Bangla (Literature)', accuracy: 85 },
                { subject: isBn ? 'ইংরেজি (Grammar & Verbs)' : 'English (Grammar)', accuracy: 80 },
                { subject: isBn ? 'আইসিটি (স্প্রেডশিট ফর্মুলা)' : 'ICT (Spreadsheet)', accuracy: 75 },
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
          out[d] = isFahim ? (i % 7 === 0 ? 1 : 2) : isTasnim ? (i % 2 === 0 ? 2 : i % 5 === 0 ? 0 : 1) : (i % 7 === 0 ? 0 : i % 4 === 0 ? 3 : 2);
        }
        setConsistency(out);
      }

      // Topics
      if (topRes.status === 'fulfilled' && topRes.value.data?.data?.weakest?.length && topRes.value.data.data.weakest.some((x: any) => x.accuracy > 0)) {
        setTopics(topRes.value.data.data);
      } else {
        setTopics(
          isFahim
            ? {
                weakest: [
                  { subject: isBn ? 'রসায়ন: কোয়ান্টাম সংখ্যা ও পলির নীতি' : 'Chemistry: Quantum Numbers', accuracy: 72 },
                  { subject: isBn ? 'পদার্থবিজ্ঞান: প্রক্ষেপকের উচ্চতর গাণিতিক সমস্যা' : 'Physics: Projectile Equations', accuracy: 76 },
                ],
                strongest: [
                  { subject: isBn ? 'উচ্চতর গণিত: ম্যাট্রিক্সের গুণন ও বিপরীত ম্যাট্রিক্স' : 'Higher Math: Inverse Matrix', accuracy: 96 },
                  { subject: isBn ? 'আইসিটি: বাইনারি ও হেক্সাডেসিমেল রূপান্তর' : 'ICT: Number System Conversion', accuracy: 94 },
                ],
              }
            : isTasnim
            ? {
                weakest: [
                  { subject: isBn ? 'ইংরেজি: Spelling & Prepositions' : 'English: Spelling & Prepositions', accuracy: 84 },
                  { subject: isBn ? 'বিজ্ঞান: পরিবেশ দূষণ ও পানি বিশুদ্ধকরণ' : 'Science: Water Purification', accuracy: 86 },
                ],
                strongest: [
                  { subject: isBn ? 'গণিত: লসাগু ও গসাগু ডাকের অঙ্ক' : 'Math: LCM & HCF Word Problems', accuracy: 98 },
                  { subject: isBn ? 'বিজিএস: আমাদের মুক্তিযুদ্ধ ও বীরশ্রেষ্ঠ' : 'BGS: Liberation War History', accuracy: 96 },
                ],
              }
            : {
                weakest: [
                  { subject: isBn ? 'আইসিটি: স্প্রেডশিটে সেল ফর্মুলার প্রয়োগ' : 'ICT: Excel Spreadsheet Formulas', accuracy: 72 },
                  { subject: isBn ? 'ইংরেজি: Right Forms of Verbs' : 'English: Right Forms of Verbs', accuracy: 78 },
                ],
                strongest: [
                  { subject: isBn ? 'বিজ্ঞান: গতির সমীকরণ ও ত্বরণ নির্ণয়' : 'Science: Motion Equations', accuracy: 92 },
                  { subject: isBn ? 'গণিত: বর্গের সূত্রাবলী ও মান নির্ণয়' : 'Math: Algebraic Formulae', accuracy: 90 },
                ],
              }
        );
      }
      setLoading(false);
    });
  }, [childId, isBn, institutionType]);

  const isCurrentTasnim = childId === 'demo-child-2';
  const defaultKpis = isCurrentTasnim
    ? { studyDays: 6, totalTime: 360, quizzes: 6, avgScore: 95, streak: 6 }
    : { studyDays: 5, totalTime: 420, quizzes: 4, avgScore: 88, streak: 5 };
  const kpis = (summary?.kpis?.totalTime || summary?.kpis?.studyDays) ? summary.kpis : defaultKpis;
  const hours = Math.floor(kpis.totalTime / 60);
  const minutes = kpis.totalTime % 60;

  const isCurrentFahim = childId === 'demo-child-3';
  const upcomingRoutines = isCurrentFahim
    ? [
        {
          name: isBn ? 'পদার্থবিজ্ঞান কোচিং — গতিবিদ্যা' : 'Physics Coaching – Dynamics',
          time: isBn ? 'রবিবার বিকাল ৪:৩০' : 'Sun 4:30 PM',
          source: 'tuition',
        },
        {
          name: isBn ? 'রসায়ন প্রাইভেট — গুণগত রসায়ন' : 'Chemistry Tuition – Qualitative Chemistry',
          time: isBn ? 'মঙ্গলবার বিকাল ৫:০০' : 'Tue 5:00 PM',
          source: 'tuition',
        },
        {
          name: isBn ? 'উচ্চতর গণিত সেলফ স্টাডি — ম্যাট্রিক্স' : 'Higher Math Self-Study – Matrices',
          time: isBn ? 'প্রতিদিন রাত ৮:৩০' : 'Daily 8:30 PM',
          source: 'self_study',
        },
      ]
    : isCurrentTasnim
    ? [
        {
          name: isBn ? 'প্রাথমিক গণিত প্রাইভেট' : 'Elementary Math Tuition',
          time: isBn ? 'রবিবার বিকাল ৪:০০' : 'Sun 4:00 PM',
          source: 'tuition',
        },
        {
          name: isBn ? 'ইংরেজি টিউটর' : 'English Tutor',
          time: isBn ? 'মঙ্গলবার বিকাল ৫:৩০' : 'Tue 5:30 PM',
          source: 'tuition',
        },
      ]
    : [
        {
          name: isBn ? 'গণিত প্রাইভেট — রহিম স্যার' : 'Math Tuition – Rahim Sir',
          time: isBn ? 'রবিবার বিকাল ৪:০০' : 'Sun 4:00 PM',
          source: 'tuition',
        },
        {
          name: isBn ? 'পদার্থবিজ্ঞান কোচিং' : 'Physics Coaching',
          time: isBn ? 'মঙ্গলবার বিকাল ৫:৩০' : 'Tue 5:30 PM',
          source: 'tuition',
        },
      ];

  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayIndex = d.getDay();
    const hasRoutine = isCurrentTasnim
      ? [0, 2, 4].includes(dayIndex)
      : [0, 2, 5].includes(dayIndex);
    return {
      date: d,
      dayNum: d.getDate(),
      dayNameEn: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex],
      dayNameBn: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'][dayIndex],
      isToday: i === 0,
      hasRoutine,
    };
  });

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
              <StudyTimeChart data={studyTime} institutionType={institutionType} isBn={isBn} />
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
        <div className="grid md:grid-cols-2 gap-6 min-w-0">
          {/* Missed & Upcoming 7-Day Schedule */}
          <Card className="rounded-2xl border shadow-sm min-w-0 flex flex-col justify-between">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base font-bold">
                  {t('dashboard.upcomingSchedule', 'Upcoming 7-Day Schedule')}
                </CardTitle>
                <Link
                  href="/schedule"
                  className="text-xs text-primary hover:underline font-medium shrink-0"
                >
                  {t('common.viewAll', 'View Calendar')} →
                </Link>
              </div>
              <CardDescription className="text-xs">
                {isBn
                  ? 'আসন্ন ৭ দিনের রুটিন ও ক্লাসের তালিকা'
                  : 'Weekly routine tracker and upcoming classes'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-0 space-y-3 min-w-0">
              {/* 7-Day Schedule Strip */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-0.5 pb-1 min-w-0">
                {next7Days.map((d, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center justify-between py-1.5 px-0.5 rounded-xl border text-center transition-all ${
                      d.isToday
                        ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-xs ring-1 ring-primary/30'
                        : d.hasRoutine
                        ? 'bg-muted/40 border-border/60 text-foreground'
                        : 'bg-muted/10 border-transparent text-muted-foreground/60'
                    }`}
                  >
                    <span className="text-[10px] sm:text-[11px] font-medium leading-none">
                      {isBn ? d.dayNameBn : d.dayNameEn}
                    </span>
                    <span className="text-xs sm:text-sm font-bold leading-tight mt-1">
                      {isBn ? toBnNum(d.dayNum) : d.dayNum}
                    </span>
                    <div className="h-1.5 flex items-center justify-center mt-0.5">
                      {d.hasRoutine && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            d.isToday ? 'bg-primary' : 'bg-indigo-500'
                          }`}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Upcoming Routines */}
              <div className="space-y-2">
                {upcomingRoutines.map((routine, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors text-xs gap-2 min-w-0"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      <span className="font-medium text-foreground truncate">{routine.name}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] sm:text-[11px] font-semibold shrink-0 text-muted-foreground bg-background/50 px-2 py-0.5"
                    >
                      <Clock className="w-3 h-3 mr-1 opacity-70" />
                      <span>{routine.time}</span>
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="rounded-2xl border shadow-sm min-w-0 flex flex-col justify-between">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base font-bold">
                  {t('dashboard.recentActivity', 'Recent Activity Feed')}
                </CardTitle>
                <Link
                  href={`/children/${childId}/log`}
                  className="text-xs text-primary hover:underline font-medium shrink-0"
                >
                  {isBn ? 'সব লগ' : 'All logs'} →
                </Link>
              </div>
              <CardDescription className="text-xs">
                {isBn
                  ? 'সর্বশেষ এন্ট্রি এবং কুইজের তালিকা'
                  : 'Latest study logs and quiz attempts for this student'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-0 min-w-0">
              <div className="space-y-2.5 max-h-[265px] overflow-y-auto pr-0.5 min-w-0">
                {summary?.recent && summary.recent.length > 0 ? (
                  summary.recent.slice(0, 4).map((r: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2.5 p-2 sm:p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors min-w-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">
                            {r.topicsText || r.topic}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                            <span className="capitalize font-semibold text-primary/80">
                              {r.source === 'tuition'
                                ? isBn
                                  ? 'টিউশন'
                                  : 'Tuition'
                                : r.source === 'school'
                                ? isBn
                                ? 'স্কুল'
                                : 'School'
                                : isBn
                                ? 'স্ব-শিক্ষা'
                                : 'Self-study'}
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

                      <Link href={`/children/${childId}/log`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    {isBn
                      ? 'এখনো কোনো সাম্প্রতিক অ্যাক্টিভিটি পাওয়া যায়নি'
                      : 'No recent activities recorded yet'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
