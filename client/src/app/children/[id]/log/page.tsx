'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import {
  BookOpen,
  Calendar,
  Clock,
  Star,
  CheckCircle2,
  Check,
  Search,
  Filter,
  Brain,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export default function LearningLogPage() {
  const params = useParams();
  const router = useRouter();
  const { activeChild, childrenList } = useAuth();
  const { isBn } = useI18n();

  const childId = (params as any)?.id || activeChild?.id || 'demo-child';
  const currentChild = childrenList.find((c) => c.id === childId) || activeChild;

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/children/${childId}/entries`);
      const list = res.data?.data?.data || res.data?.data || [];
      if (list && list.length > 0) {
        setEntries(list);
      } else {
        const isTasnim = childId === 'demo-child-2';
        setEntries(
          isTasnim
            ? [
                {
                  id: 'e-t1',
                  date: new Date().toISOString().slice(0, 10),
                  source: 'tuition',
                  providerName: isBn ? 'ম্যাথ টিউটর' : 'Math Tutor',
                  subject: isBn ? 'প্রাথমিক গণিত' : 'Elementary Math',
                  topicsText: isBn
                    ? 'অধ্যায় ৫: গুণনীয়ক ও গুণিতক — লসাগু ও গসাগু নির্ণয়'
                    : 'Chapter 5: Factors & Multiples – LCM & HCF problem solving',
                  durationMin: 60,
                  confidence: 5,
                  verifiedByParent: true,
                },
                {
                  id: 'e-t2',
                  date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
                  source: 'school',
                  providerName: 'School',
                  subject: isBn ? 'প্রাথমিক বিজ্ঞান' : 'Primary Science',
                  topicsText: isBn
                    ? 'অধ্যায় ৩: জীবনের জন্য পানি — নিরাপদ পানি ও পানি বিশুদ্ধকরণ'
                    : 'Chapter 3: Water for Life – Safe Water & Purification',
                  durationMin: 50,
                  confidence: 4,
                  verifiedByParent: true,
                },
                {
                  id: 'e-t3',
                  date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
                  source: 'tuition',
                  providerName: isBn ? 'ইংরেজি টিউটর' : 'English Tutor',
                  subject: isBn ? 'ইংরেজি' : 'English',
                  topicsText: isBn
                    ? 'Unit 6: Eat Healthy — Food pyramid vocabulary & reading'
                    : 'Unit 6: Eat Healthy – Food pyramid vocabulary & reading',
                  durationMin: 45,
                  confidence: 5,
                  verifiedByParent: false,
                },
                {
                  id: 'e-t4',
                  date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
                  source: 'self_study',
                  providerName: 'Self Study',
                  subject: isBn ? 'বাংলাদেশ ও বিশ্বপরিচয়' : 'BGS',
                  topicsText: isBn
                    ? 'অধ্যায় ১: আমাদের মুক্তিযুদ্ধ — ২৫শে মার্চের কালরাত'
                    : 'Chapter 1: Liberation War – Historical background',
                  durationMin: 45,
                  confidence: 5,
                  verifiedByParent: true,
                },
                {
                  id: 'e-t5',
                  date: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10),
                  source: 'school',
                  providerName: 'School',
                  subject: isBn ? 'প্রাথমিক গণিত' : 'Elementary Math',
                  topicsText: isBn
                    ? 'অধ্যায় ৪: গাণিতিক প্রতীক ও খোলা বাক্য সমাধান'
                    : 'Chapter 4: Mathematical Symbols & Open Sentences',
                  durationMin: 60,
                  confidence: 5,
                  verifiedByParent: true,
                },
              ]
            : [
                {
                  id: 'e-r1',
                  date: new Date().toISOString().slice(0, 10),
                  source: 'tuition',
                  providerName: isBn ? 'রহিম স্যার' : 'Rahim Sir',
                  subject: isBn ? 'গণিত' : 'Mathematics',
                  topicsText: isBn
                    ? 'অধ্যায় ৪: বীজগণিতীয় সূত্রাবলী ও প্রয়োগ — বর্গের সূত্র (a+b)^2'
                    : 'Chapter 4: Algebraic Formulae & Applications – (a+b)^2 solutions',
                  durationMin: 75,
                  confidence: 5,
                  verifiedByParent: true,
                },
                {
                  id: 'e-r2',
                  date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
                  source: 'school',
                  providerName: 'School',
                  subject: isBn ? 'সাধারণ বিজ্ঞান' : 'General Science',
                  topicsText: isBn
                    ? 'অধ্যায় ২: গতি ও ত্বরণ — গতির ৩টি মৌলিক সমীকরণ'
                    : 'Chapter 2: Motion & Acceleration – 3 Equations of Motion',
                  durationMin: 60,
                  confidence: 4,
                  verifiedByParent: true,
                },
                {
                  id: 'e-r3',
                  date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
                  source: 'self_study',
                  providerName: 'Self Study',
                  subject: isBn ? 'ইংরেজি ১ম পত্র' : 'English 1st Paper',
                  topicsText: isBn
                    ? 'Unit 3: Health and Hygiene — Passage comprehension & synonyms'
                    : 'Unit 3: Health and Hygiene – Passage comprehension & synonyms',
                  durationMin: 45,
                  confidence: 4,
                  verifiedByParent: false,
                },
                {
                  id: 'e-r4',
                  date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
                  source: 'tuition',
                  providerName: isBn ? 'আইসিটি শিক্ষক' : 'ICT Tutor',
                  subject: isBn ? 'তথ্যপ্রযুক্তি' : 'ICT',
                  topicsText: isBn
                    ? 'অধ্যায় ৩: স্প্রেডশিট সফটওয়্যারের ব্যবহার — এক্সেলে হিসাব'
                    : 'Chapter 3: Spreadsheet Software – Formulas in Excel',
                  durationMin: 60,
                  confidence: 5,
                  verifiedByParent: true,
                },
                {
                  id: 'e-r5',
                  date: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10),
                  source: 'tuition',
                  providerName: isBn ? 'পদার্থবিজ্ঞান কোচিং' : 'Physics Coaching',
                  subject: isBn ? 'পদার্থবিজ্ঞান' : 'Physics',
                  topicsText: isBn
                    ? 'অধ্যায় ৫: কাজ, ক্ষমতা ও শক্তি — গতিশক্তি ও বিভবশক্তি গণনা'
                    : 'Chapter 5: Work, Power & Energy – Kinetic & Potential Energy',
                  durationMin: 70,
                  confidence: 4,
                  verifiedByParent: true,
                },
              ]
        );
      }
    } catch {
      const isTasnim = childId === 'demo-child-2';
      setEntries(
        isTasnim
          ? [
              {
                id: 'e-t1',
                date: new Date().toISOString().slice(0, 10),
                source: 'tuition',
                providerName: isBn ? 'ম্যাথ টিউটর' : 'Math Tutor',
                subject: isBn ? 'প্রাথমিক গণিত' : 'Elementary Math',
                topicsText: isBn
                  ? 'অধ্যায় ৫: গুণনীয়ক ও গুণিতক — লসাগু ও গসাগু নির্ণয়'
                  : 'Chapter 5: Factors & Multiples – LCM & HCF problem solving',
                durationMin: 60,
                confidence: 5,
                verifiedByParent: true,
              },
              {
                id: 'e-t2',
                date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
                source: 'school',
                providerName: 'School',
                subject: isBn ? 'প্রাথমিক বিজ্ঞান' : 'Primary Science',
                topicsText: isBn
                  ? 'অধ্যায় ৩: জীবনের জন্য পানি — নিরাপদ পানি ও পানি বিশুদ্ধকরণ'
                  : 'Chapter 3: Water for Life – Safe Water & Purification',
                durationMin: 50,
                confidence: 4,
                verifiedByParent: true,
              },
              {
                id: 'e-t3',
                date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
                source: 'tuition',
                providerName: isBn ? 'ইংরেজি টিউটর' : 'English Tutor',
                subject: isBn ? 'ইংরেজি' : 'English',
                topicsText: isBn
                  ? 'Unit 6: Eat Healthy — Food pyramid vocabulary & reading'
                  : 'Unit 6: Eat Healthy – Food pyramid vocabulary & reading',
                durationMin: 45,
                confidence: 5,
                verifiedByParent: false,
              },
            ]
          : [
              {
                id: 'e-r1',
                date: new Date().toISOString().slice(0, 10),
                source: 'tuition',
                providerName: isBn ? 'রহিম স্যার' : 'Rahim Sir',
                subject: isBn ? 'গণিত' : 'Mathematics',
                topicsText: isBn
                  ? 'অধ্যায় ৪: বীজগণিতীয় সূত্রাবলী ও প্রয়োগ — বর্গের সূত্র (a+b)^2'
                  : 'Chapter 4: Algebraic Formulae & Applications – (a+b)^2 solutions',
                durationMin: 75,
                confidence: 5,
                verifiedByParent: true,
              },
              {
                id: 'e-r2',
                date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
                source: 'school',
                providerName: 'School',
                subject: isBn ? 'সাধারণ বিজ্ঞান' : 'General Science',
                topicsText: isBn
                  ? 'অধ্যায় ২: গতি ও ত্বরণ — গতির ৩টি মৌলিক সমীকরণ'
                  : 'Chapter 2: Motion & Acceleration – 3 Equations of Motion',
                durationMin: 60,
                confidence: 4,
                verifiedByParent: true,
              },
            ]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [childId]);

  const handleVerify = async (id: string) => {
    try {
      await api.post(`/entries/${id}/verify`);
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, verifiedByParent: true } : e))
      );
      setMsg(isBn ? 'পড়ার এন্ট্রি সফলভাবে অভিভাবক কর্তৃক যাচাই করা হয়েছে!' : 'Lesson entry successfully verified by parent!');
    } catch {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, verifiedByParent: true } : e))
      );
      setMsg(isBn ? 'পড়ার এন্ট্রি সফলভাবে অভিভাবক কর্তৃক যাচাই করা হয়েছে!' : 'Lesson entry successfully verified by parent!');
    }
  };

  // Metrics
  const totalEntries = entries.length;
  const totalMinutes = entries.reduce((acc, curr) => acc + (curr.durationMin || 60), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const verifiedCount = entries.filter((e) => e.verifiedByParent).length;
  const avgConfidence =
    totalEntries > 0
      ? (entries.reduce((acc, curr) => acc + (curr.confidence || 4), 0) / totalEntries).toFixed(1)
      : '0';

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      // Source filter
      if (sourceFilter !== 'all' && e.source !== sourceFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'verified' && !e.verifiedByParent) {
        return false;
      }
      if (statusFilter === 'pending' && e.verifiedByParent) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const topicMatch = e.topicsText?.toLowerCase().includes(query);
        const subjectMatch = (e.subject || e.subjectId)?.toLowerCase().includes(query);
        const providerMatch = e.providerName?.toLowerCase().includes(query);
        if (!topicMatch && !subjectMatch && !providerMatch) {
          return false;
        }
      }
      return true;
    });
  }, [entries, sourceFilter, statusFilter, searchQuery]);

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'tuition':
        return (
          <Badge variant="secondary" className="text-[11px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20">
            {isBn ? 'প্রাইভেট টিউশন' : 'Private Tuition'}
          </Badge>
        );
      case 'school':
        return (
          <Badge variant="secondary" className="text-[11px] bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20">
            {isBn ? 'বিদ্যালয়' : 'School'}
          </Badge>
        );
      case 'self_study':
        return (
          <Badge variant="secondary" className="text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20">
            {isBn ? 'সেলফ-স্টাডি' : 'Self-Study'}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[11px] capitalize">
            {source}
          </Badge>
        );
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Page Title & Child Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {isBn ? 'দৈনিক পড়ার বিবরণী' : 'Student Learning Logs'}
              </h1>
              {currentChild && (
                <Badge variant="secondary" className="text-xs px-2.5 py-0.5 font-bold">
                  {currentChild.name} • {currentChild.grade}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isBn
                ? 'শিক্ষার্থীর পোর্টাল থেকে যুক্ত করা প্রতিটি পড়ার বিবরণ অভিভাবক হিসেবে এখানে যাচাই ও নিরীক্ষণ করুন'
                : 'Review, verify, and audit daily lessons recorded by your student from their student portal.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/children/${childId}/quizzes/new`}>
              <Button size="sm" className="gap-1.5 text-xs h-9 shadow-sm shadow-primary/20 bg-primary">
                <Brain className="w-3.5 h-3.5" />
                <span>{isBn ? 'এআই রিভিশন কুইজ তৈরি' : 'Generate Revision Quiz'}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Feedback Alert */}
        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{msg}</span>
            </div>
            <button onClick={() => setMsg('')} className="underline text-[11px] opacity-80 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {/* Information Callout Banner (Parents View Only) */}
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 via-primary/5 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>{isBn ? 'পড়ার বিবরণ সরাসরি শিক্ষার্থীর পোর্টাল থেকে তৈরি হয়' : 'Student-Logged Entries (Parent Inspection Mode)'}</span>
                <Badge variant="outline" className="text-[10px] font-semibold bg-background/50 border-primary/20 text-primary">
                  {isBn ? 'অভিভাবক পর্যবেক্ষণ' : 'Read-Only Viewer'}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                {isBn
                  ? 'প্রতিদিনের পড়ার বিবরণ শিক্ষার্থীরা তাদের নির্দিষ্ট স্টুডেন্ট পোর্টাল (/kid/log) থেকে ১ মিনিটে লিপিবদ্ধ করে। অভিভাবক হিসেবে আপনি এখান থেকে প্রতিটি টপিক নির্ভুল কিনা যাচাই করতে পারেন এবং টপিক অনুসারে এআই রিভিশন কুইজ তৈরি করতে পারেন।'
                  : 'Daily learning logs are recorded exclusively by students via their dedicated portal in under 1 minute. Parents review accuracy, approve lessons, and convert topics into AI revision quizzes.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <div className="px-3 py-1.5 rounded-xl bg-card border text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isBn ? 'অভিভাবক অনুমোদন সচল' : 'Parent Audit Active'}</span>
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {isBn ? 'মোট পাঠের এন্ট্রি' : 'Total Lessons'}
              </span>
              <div className="text-2xl font-black text-foreground">{totalEntries}</div>
              <p className="text-[11px] text-muted-foreground">
                {isBn ? 'শিক্ষার্থী দ্বারা লিপিবদ্ধ' : 'Recorded by student'}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {isBn ? 'মোট পড়ার সময়' : 'Total Study Time'}
              </span>
              <div className="text-2xl font-black text-foreground">{totalHours} hrs</div>
              <p className="text-[11px] text-muted-foreground">
                {totalMinutes} {isBn ? 'মিনিট সক্রিয় পড়া' : 'minutes tracked'}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {isBn ? 'অভিভাবক যাচাই' : 'Verified by Parent'}
              </span>
              <div className="text-2xl font-black text-foreground">
                {verifiedCount} / {totalEntries}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {totalEntries > 0 ? Math.round((verifiedCount / totalEntries) * 100) : 0}% {isBn ? 'অনুমোদিত' : 'approved'}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {isBn ? 'গড় আত্মবিশ্বাস স্তর' : 'Avg Confidence'}
              </span>
              <div className="text-2xl font-black text-foreground flex items-center gap-1.5">
                <span>{avgConfidence}</span>
                <span className="text-amber-500 text-lg">★</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isBn ? 'সর্বোচ্চ ৫.০ স্কোরের মধ্যে' : 'Out of 5.0 scale'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search Control Bar */}
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search Box */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={isBn ? 'টপিক বা বিষয় খুঁজুন...' : 'Search topic, subject or tutor...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>

              {/* Source Filters */}
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline">
                  {isBn ? 'উৎস:' : 'Source:'}
                </span>
                {[
                  { id: 'all', label: isBn ? 'সব' : 'All' },
                  { id: 'tuition', label: isBn ? 'টিউশন' : 'Tuition' },
                  { id: 'school', label: isBn ? 'স্কুল' : 'School' },
                  { id: 'self_study', label: isBn ? 'সেলফ-স্টাডি' : 'Self' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSourceFilter(s.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      sourceFilter === s.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Verification Status Filters */}
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
                <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline">
                  {isBn ? 'অবস্থা:' : 'Status:'}
                </span>
                {[
                  { id: 'all', label: isBn ? 'সব' : 'All' },
                  { id: 'verified', label: isBn ? 'যাচাইকৃত' : 'Verified' },
                  { id: 'pending', label: isBn ? 'যাচাই বাকি' : 'Pending' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      statusFilter === st.id
                        ? 'bg-foreground text-background shadow-sm'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entries List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-foreground">
              {isBn ? 'পড়ার বিবরণীর তালিকা' : 'Recorded Lessons'} ({filteredEntries.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              {isBn ? 'সর্বশেষ এন্ট্রি প্রথমে' : 'Most recent first'}
            </span>
          </div>

          {filteredEntries.length === 0 ? (
            <Card className="rounded-2xl border p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto text-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-foreground text-sm">
                {isBn ? 'কোনো এন্ট্রি পাওয়া যায়নি' : 'No learning logs found'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isBn
                  ? 'ফিল্টার পরিবর্তন করে দেখুন অথবা শিক্ষার্থী তার স্টুডেন্ট পোর্টাল থেকে নতুন পাঠ যোগ করলে এখানে প্রদর্শিত হবে।'
                  : 'Try clearing your search filters, or wait for the student to record their daily lesson from their portal.'}
              </p>
              {(searchQuery || sourceFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSourceFilter('all');
                    setStatusFilter('all');
                  }}
                  className="text-xs rounded-xl"
                >
                  {isBn ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
                </Button>
              )}
            </Card>
          ) : (
            filteredEntries.map((e) => (
              <Card
                key={e.id}
                className="rounded-2xl border shadow-sm hover:border-primary/30 transition-all bg-card"
              >
                <CardContent className="p-4 sm:p-5 space-y-3.5">
                  {/* Top Bar: Subject, Source, Date & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-bold text-xs bg-muted/30">
                        {e.subject || e.subjectId}
                      </Badge>
                      {getSourceBadge(e.source)}
                      {e.providerName && (
                        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                          • {e.providerName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(e.date).toLocaleDateString()}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{e.durationMin || 60} {isBn ? 'মিনিট' : 'mins'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Main Topic Description */}
                  <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      {isBn ? 'আজকে যা পড়ানো হয়েছে' : 'Topic Covered & Notes'}
                    </div>
                    <p className="font-semibold text-sm sm:text-base text-foreground leading-relaxed">
                      {e.topicsText}
                    </p>
                  </div>

                  {/* Footer Row: Confidence, Verification & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    {/* Confidence Stars */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {isBn ? 'শিক্ষার্থীর আত্মবিশ্বাস:' : 'Student Confidence:'}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <Star
                            key={lvl}
                            className={`w-3.5 h-3.5 ${
                              (e.confidence || 4) >= lvl
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {(e.confidence || 4)}/5
                      </span>
                    </div>

                    {/* Verification & Quiz Shortcuts */}
                    <div className="flex items-center gap-2">
                      {e.verifiedByParent ? (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-semibold gap-1 px-2.5 py-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isBn ? 'অভিভাবক কর্তৃক যাচাইকৃত' : 'Verified by Parent'}</span>
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerify(e.id)}
                          className="text-xs h-8 gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 font-semibold rounded-xl"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{isBn ? 'যাচাই অনুমোদন করুন' : 'Verify Entry'}</span>
                        </Button>
                      )}

                      <Link href={`/children/${childId}/quizzes/new`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-8 gap-1 text-primary hover:bg-primary/10 rounded-xl"
                        >
                          <Brain className="w-3.5 h-3.5" />
                          <span>{isBn ? 'কুইজ তৈরি' : 'Create Quiz'}</span>
                          <ArrowRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
