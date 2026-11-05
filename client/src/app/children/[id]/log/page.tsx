'use client';

export const runtime = 'edge';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/components/auth/auth-context';
import { demoProfileOf, type DemoProfile } from '@/lib/child-scope';
import { useI18n, type Translator } from '@/lib/i18n-context';
import { getInstitutionType } from '@/lib/institution';
import { api } from '@/lib/api';
import {
  BookOpen,
  Bell,
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
  AlertCircle,
} from 'lucide-react';

/**
 * The demo dataset for a child profile.
 *
 * `t` is passed in rather than read from `useI18n()`: this is a module-level
 * function, and a hook cannot be called outside a component.
 */
function getFallbackEntries(profile: DemoProfile | null, isBn: boolean, t: Translator) {
  // The demo dataset is selected by the server-assigned `demoProfile`, not by a
  // hardcoded child id. The ids moved to UUIDs, so `childId === 'demo-child-2'`
  // never matched anything and every viewer saw Rahim's rows.
  const isTasnim = profile === 'tasnim';
  const isFahim = profile === 'fahim';

  if (isFahim) {
    return [
      // Today (4 entries)
      {
        id: 'e-f1',
        date: new Date().toISOString().slice(0, 10),
        source: 'college',
        providerName: t('childLog.text'),
        subject: t('childLog.text_2'),
        topicsText: t('childLog.projectile_motion_h_r'),
        durationMin: 50,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-f2',
        date: new Date().toISOString().slice(0, 10),
        source: 'college',
        providerName: t('childLog.text'),
        subject: t('childLog.text_3'),
        topicsText: t('childLog.n_l_m_s'),
        durationMin: 50,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-f3',
        date: new Date().toISOString().slice(0, 10),
        source: 'tuition',
        providerName: t('childLog.text_4'),
        subject: t('childLog.text_2'),
        topicsText: t('childLog.text_5'),
        durationMin: 75,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-f4',
        date: new Date().toISOString().slice(0, 10),
        source: 'self_study',
        providerName: 'Self Study',
        subject: t('childLog.text_6'),
        topicsText: t('childLog.text_7'),
        durationMin: 60,
        confidence: 5,
        verifiedByParent: true,
      },
      // Yesterday (3 entries)
      {
        id: 'e-f5',
        date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        source: 'college',
        providerName: t('childLog.text'),
        subject: t('childLog.text_6'),
        topicsText: t('childLog.inverse_matrix'),
        durationMin: 50,
        confidence: 4,
        verifiedByParent: true,
      },
      {
        id: 'e-f6',
        date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        source: 'tuition',
        providerName: t('childLog.text_8'),
        subject: t('childLog.text_3'),
        topicsText: t('childLog.text_9'),
        durationMin: 60,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-f7',
        date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        source: 'self_study',
        providerName: 'Self Study',
        subject: t('childLog.text_2'),
        topicsText: t('childLog.text_10'),
        durationMin: 60,
        confidence: 4,
        verifiedByParent: true,
      },
      // 2 Days Ago (3 entries)
      {
        id: 'e-f8',
        date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
        source: 'college',
        providerName: t('childLog.text'),
        subject: t('childLog.text_11'),
        topicsText: t('childLog.text_12'),
        durationMin: 50,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-f9',
        date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
        source: 'tuition',
        providerName: t('childLog.text_13'),
        subject: t('childLog.text_6'),
        topicsText: t('childLog.text_14'),
        durationMin: 75,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-f10',
        date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
        source: 'self_study',
        providerName: 'Self Study',
        subject: t('childLog.text_15'),
        topicsText: t('childLog.poem_analysis_the_traffic_policeman_theme_writin'),
        durationMin: 45,
        confidence: 5,
        verifiedByParent: true,
      },
    ];
  }

  if (isTasnim) {
    return [
      // Today (3 entries)
      {
        id: 'e-t1',
        date: new Date().toISOString().slice(0, 10),
        source: 'school',
        providerName: 'School',
        subject: t('childLog.text_16'),
        topicsText: t('childLog.text_17'),
        durationMin: 45,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-t2',
        date: new Date().toISOString().slice(0, 10),
        source: 'school',
        providerName: 'School',
        subject: t('childLog.text_18'),
        topicsText: t('childLog.text_19'),
        durationMin: 40,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-t3',
        date: new Date().toISOString().slice(0, 10),
        source: 'tuition',
        providerName: t('childLog.text_20'),
        subject: t('childLog.text_16'),
        topicsText: t('childLog.text_21'),
        durationMin: 60,
        confidence: 5,
        verifiedByParent: true,
      },
      // Yesterday (3 entries)
      {
        id: 'e-t4',
        date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        source: 'school',
        providerName: 'School',
        subject: t('childLog.text_22'),
        topicsText: t('childLog.unit_6_eat_healthy_food_pyramid_healthy_fruits_a'),
        durationMin: 45,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-t5',
        date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        source: 'tuition',
        providerName: t('childLog.text_23'),
        subject: t('childLog.text_22'),
        topicsText: t('childLog.reading_aloud_question_answer_matching_spelling_'),
        durationMin: 50,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-t6',
        date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        source: 'self_study',
        providerName: 'Self Study',
        subject: t('childLog.text_16'),
        topicsText: t('childLog.text_24'),
        durationMin: 45,
        confidence: 4,
        verifiedByParent: true,
      },
      // 2 Days Ago (3 entries)
      {
        id: 'e-t7',
        date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
        source: 'school',
        providerName: 'School',
        subject: t('childLog.text_25'),
        topicsText: t('childLog.text_26'),
        durationMin: 40,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-t8',
        date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
        source: 'tuition',
        providerName: t('childLog.text_20'),
        subject: t('childLog.text_16'),
        topicsText: t('childLog.text_27'),
        durationMin: 60,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-t9',
        date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
        source: 'self_study',
        providerName: 'Self Study',
        subject: t('childLog.text_18'),
        topicsText: t('childLog.text_28'),
        durationMin: 45,
        confidence: 5,
        verifiedByParent: true,
      },
    ];
  }

  // Default: Rahim Ahmed (Class 8)
  return [
    // Today (4 entries)
    {
      id: 'e-r1',
      date: new Date().toISOString().slice(0, 10),
      source: 'school',
      providerName: 'School',
      subject: t('childLog.text_29'),
      topicsText: t('childLog.a_b_2_a_b_2'),
      durationMin: 45,
      confidence: 5,
      verifiedByParent: true,
    },
    {
      id: 'e-r2',
      date: new Date().toISOString().slice(0, 10),
      source: 'school',
      providerName: 'School',
      subject: t('childLog.text_30'),
      topicsText: t('childLog.text_31'),
      durationMin: 50,
      confidence: 4,
      verifiedByParent: true,
    },
    {
      id: 'e-r3',
      date: new Date().toISOString().slice(0, 10),
      source: 'tuition',
      providerName: t('childLog.text_32'),
      subject: t('childLog.text_29'),
      topicsText: t('childLog.a_b_2_a_b_2_2'),
      durationMin: 75,
      confidence: 5,
      verifiedByParent: true,
    },
    {
      id: 'e-r4',
      date: new Date().toISOString().slice(0, 10),
      source: 'self_study',
      providerName: 'Self Study',
      subject: t('childLog.text_15'),
      topicsText: t('childLog.unit_3_health_and_hygiene_passage_comprehension_'),
      durationMin: 45,
      confidence: 4,
      verifiedByParent: true,
    },
    // Yesterday (4 entries)
    {
      id: 'e-r5',
      date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      source: 'school',
      providerName: 'School',
      subject: t('childLog.text_11'),
      topicsText: t('childLog.text_33'),
      durationMin: 45,
      confidence: 5,
      verifiedByParent: true,
    },
    {
      id: 'e-r6',
      date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      source: 'school',
      providerName: 'School',
      subject: t('childLog.text_34'),
      topicsText: t('childLog.text_35'),
      durationMin: 45,
      confidence: 4,
      verifiedByParent: true,
    },
    {
      id: 'e-r7',
      date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      source: 'tuition',
      providerName: t('childLog.text_36'),
      subject: t('childLog.text_30'),
      topicsText: t('childLog.text_37'),
      durationMin: 60,
      confidence: 5,
      verifiedByParent: true,
    },
    {
      id: 'e-r8',
      date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      source: 'self_study',
      providerName: 'Self Study',
      subject: t('childLog.text_38'),
      topicsText: t('childLog.text_39'),
      durationMin: 50,
      confidence: 5,
      verifiedByParent: true,
    },
    // 2 Days Ago (3 entries)
    {
      id: 'e-r9',
      date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
      source: 'school',
      providerName: 'School',
      subject: t('childLog.text_29'),
      topicsText: t('childLog.text_40'),
      durationMin: 50,
      confidence: 4,
      verifiedByParent: true,
    },
    {
      id: 'e-r10',
      date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
      source: 'tuition',
      providerName: t('childLog.text_32'),
      subject: t('childLog.text_29'),
      topicsText: t('childLog.text_41'),
      durationMin: 75,
      confidence: 4,
      verifiedByParent: true,
    },
    {
      id: 'e-r11',
      date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
      source: 'self_study',
      providerName: 'Self Study',
      subject: t('childLog.text_42'),
      topicsText: t('childLog.right_forms_of_verbs_10_basic_grammar_rules_and_'),
      durationMin: 45,
      confidence: 4,
      verifiedByParent: true,
    },
  ];
}

export default function LearningLogPage() {
  const params = useParams();
  const router = useRouter();
  const { activeChild, childrenList } = useAuth();
  const { t, isBn } = useI18n();

  // The route segment wins over the active child, and an account with no child
  // gets NO child id — the old `'demo-child'` fallback was not a real id, so the
  // server answered 404 and the page rendered an empty shell.
  const routeChildId = (params as any)?.id as string | undefined;
  const childId = routeChildId || activeChild?.id || null;
  const currentChild =
    (routeChildId ? childrenList.find((c) => c.id === routeChildId) : null) || activeChild || null;
  const demoProfile = demoProfileOf(currentChild);
  const isDemoChild = demoProfile !== null;
  const institutionType = getInstitutionType(currentChild?.grade);

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Unlogged Study Alert Configuration State (Saved per student)
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);
  const [testingAlert, setTestingAlert] = useState(false);
  const [alertSuccessMsg, setAlertSuccessMsg] = useState('');
  const [alertErrorMsg, setAlertErrorMsg] = useState('');
  const [alertConfig, setAlertConfig] = useState<{
    enabled: boolean;
    time: string;
    channel: 'in_app' | 'email' | 'all';
    daysOfWeek: number[];
  }>({
    enabled: true,
    time: demoProfile === 'fahim' ? '22:00' : demoProfile === 'tasnim' ? '20:30' : '21:00',
    channel: 'all',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  });

  const loadAlertConfig = async () => {
    if (!childId) return;
    try {
      const res = await api.get(`/children/${childId}/unlogged-alert`);
      if (res.data?.data) {
        setAlertConfig(res.data.data);
      }
    } catch {
      setAlertConfig({
        enabled: true,
        time: demoProfile === 'fahim' ? '22:00' : demoProfile === 'tasnim' ? '20:30' : '21:00',
        channel: 'all',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      });
    }
  };

  useEffect(() => {
    loadAlertConfig();
  }, [childId]);

  const handleSaveAlertConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childId) return;
    setSavingAlert(true);
    setAlertSuccessMsg('');
    setAlertErrorMsg('');
    try {
      await api.put(`/children/${childId}/unlogged-alert`, alertConfig);
      setAlertSuccessMsg(
        t('childLog.unlogged_study_alert_settings_successfully_saved', { p0: isBn ? currentChild?.name || 'শিক্ষার্থী' : currentChild?.name || 'this student' }, `Unlogged study alert settings successfully saved for ${currentChild?.name || 'this student'}!`)
      );
      setTimeout(() => {
        setAlertModalOpen(false);
        setAlertSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      // The old code reported "successfully saved" on failure too, so the parent
      // believed the alert was configured when the server had rejected it.
      const serverMsg = err?.response?.data?.error?.message;
      setAlertErrorMsg(
        serverMsg ||
          (t('childLog.text_43'))
      );
    } finally {
      setSavingAlert(false);
    }
  };

  const handleTriggerTestAlert = async () => {
    if (!childId) return;
    setTestingAlert(true);
    setAlertErrorMsg('');
    try {
      await api.post(`/children/${childId}/unlogged-alert/test`);
      setAlertSuccessMsg(
        t('childLog.text_44')
      );
      setTimeout(() => setAlertSuccessMsg(''), 4000);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error?.message;
      setAlertErrorMsg(
        serverMsg ||
          (t('childLog.text_45'))
      );
    } finally {
      setTestingAlert(false);
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    try {
      if (!childId) {
        setEntries([]);
        return;
      }
      const res = await api.get(`/children/${childId}/entries`);
      const list = res.data?.data?.data || res.data?.data || [];
      if (list && list.length > 0) {
        setEntries(list);
      } else {
        // Only the demo tenant has a curated fixture. A real account with no
        // entries gets an honest empty list, not someone else's study log.
        setEntries(isDemoChild ? getFallbackEntries(demoProfile, isBn, t) : []);
      }
    } catch {
      setEntries(isDemoChild ? getFallbackEntries(demoProfile, isBn, t) : []);
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
      setMsg(t('childLog.text_46'));
    } catch (e: any) {
      // The entry was NOT verified. The old code marked it verified anyway and
      // showed the success message, so the parent's verification count included
      // entries the server had never accepted.
      setErrorMsg(e?.response?.data?.error?.message || 'The entry could not be verified.');
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
            {t('childLog.text_47')}
          </Badge>
        );
      case 'college':
        return (
          <Badge variant="secondary" className="text-[11px] bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20">
            {t('childLog.text_48')}
          </Badge>
        );
      case 'school':
        return (
          <Badge variant="secondary" className="text-[11px] bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20">
            {t('childLog.text_49')}
          </Badge>
        );
      case 'self_study':
        return (
          <Badge variant="secondary" className="text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20">
            {t('childLog.text_50')}
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
      <div className="space-y-6 w-full">
        {/* Page Title & Child Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t('childLog.text_51')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('childLog.text_52')}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Unlogged Study Notification Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAlertModalOpen(true)}
              className="gap-1.5 text-xs h-9 font-semibold border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
            >
              <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{t('childLog.text_53')}</span>
              {alertConfig.enabled && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border-amber-500/30">
                  {alertConfig.time}
                </Badge>
              )}
            </Button>
            <Link
              href={
                entries.length > 0
                  ? `/children/${childId ?? ''}/quizzes/new?topic=${encodeURIComponent(entries[0].topicsText || '')}&subject=${encodeURIComponent(entries[0].subject || entries[0].subjectId || '')}&title=${encodeURIComponent(`${entries[0].topicsText || entries[0].subject} — ${t('childLog.text_54')}`)}`
                  : `/children/${childId ?? ''}/quizzes/new`
              }
            >
              <Button size="sm" className="gap-1.5 text-xs h-9 shadow-sm shadow-primary/20 bg-primary">
                <Brain className="w-3.5 h-3.5" />
                <span>{t('childLog.text_55')}</span>
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
              {t('common.dismiss')}
            </button>
          </div>
        )}

        {/* Error Alert — a failed request is never shown in the success banner. */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="underline text-[11px] opacity-80 hover:opacity-100">
              {t('common.dismiss')}
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
                <span>{t('childLog.text_56')}</span>
                <Badge variant="outline" className="text-[10px] font-semibold bg-background/50 border-primary/20 text-primary">
                  {t('childLog.text_57')}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                {t('childLog.kid_log')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <div className="px-3 py-1.5 rounded-xl bg-card border text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('childLog.text_58')}</span>
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t('childLog.text_59')}
              </span>
              <div className="text-2xl font-black text-foreground">{totalEntries}</div>
              <p className="text-[11px] text-muted-foreground">
                {t('childLog.text_60')}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t('childLog.text_61')}
              </span>
              <div className="text-2xl font-black text-foreground">{totalHours} hrs</div>
              <p className="text-[11px] text-muted-foreground">
                {totalMinutes} {t('childLog.text_62')}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t('childLog.text_63')}
              </span>
              <div className="text-2xl font-black text-foreground">
                {verifiedCount} / {totalEntries}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {totalEntries > 0 ? Math.round((verifiedCount / totalEntries) * 100) : 0}% {t('childLog.text_64')}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t('childLog.text_65')}
              </span>
              <div className="text-2xl font-black text-foreground flex items-center gap-1.5">
                <span>{avgConfidence}</span>
                <span className="text-amber-500 text-lg">★</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t('childLog.text_66')}
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
                  placeholder={t('childLog.text_67')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>

              {/* Source Filters */}
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline">
                  {t('childLog.text_68')}
                </span>
                {[
                  { id: 'all', label: t('childLog.text_69') },
                  { id: 'tuition', label: t('childLog.text_70') },
                  { id: 'school', label: t('childLog.text_71') },
                  { id: 'self_study', label: t('childLog.text_50') },
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
                  {t('childLog.text_72')}
                </span>
                {[
                  { id: 'all', label: t('childLog.text_69') },
                  { id: 'verified', label: t('childLog.text_73') },
                  { id: 'pending', label: t('childLog.text_74') },
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
              {t('childLog.text_75')} ({filteredEntries.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              {t('childLog.text_76')}
            </span>
          </div>

          {filteredEntries.length === 0 ? (
            <Card className="rounded-2xl border p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto text-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-foreground text-sm">
                {t('childLog.text_77')}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {t('childLog.text_78')}
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
                  {t('childLog.text_79')}
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
                        <span>{e.durationMin || 60} {t('childLog.text_80')}</span>
                      </span>
                    </div>
                  </div>

                  {/* Main Topic Description */}
                  <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      {t('childLog.text_81')}
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
                        {t('childLog.text_82')}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      {e.verifiedByParent ? (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-semibold gap-1 px-2.5 py-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('childLog.text_83')}</span>
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerify(e.id)}
                          className="text-xs h-8 gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 font-semibold rounded-xl"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{t('childLog.text_84')}</span>
                        </Button>
                      )}

                      <Link
                        href={`/children/${childId ?? ''}/quizzes/new?topic=${encodeURIComponent(e.topicsText || '')}&subject=${encodeURIComponent(e.subject || e.subjectId || '')}&title=${encodeURIComponent(`${e.topicsText || e.subject} — ${t('childLog.text_54')}`)}`}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-8 gap-1 text-primary hover:bg-primary/10 rounded-xl"
                        >
                          <Brain className="w-3.5 h-3.5" />
                          <span>{t('childLog.text_85')}</span>
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
    
        {/* Unlogged Study Alert Setup Modal (Saved separately per student) */}
        <Modal
          isOpen={alertModalOpen}
          onClose={() => setAlertModalOpen(false)}
          title={t('childLog.text_86')}
          description={
            t('childLog.receive_an_automatic_notification_if_has_not_log', { p0: isBn ? currentChild?.name || 'শিক্ষার্থী' : currentChild?.name || 'your child' }, `Receive an automatic notification if ${currentChild?.name || 'your child'} has not logged their daily study sessions.`)
          }
          maxWidth="lg"
        >
          <form onSubmit={handleSaveAlertConfig} className="space-y-4 pt-1">
            {/* Student context pill */}
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  {currentChild?.name?.slice(0, 1) || 'S'}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{currentChild?.name || 'শিক্ষার্থী'}</p>
                  <p className="text-[11px] text-muted-foreground">{currentChild?.grade || 'Class 8'} • {currentChild?.curriculum || 'NCTB'}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/20 bg-primary/5 font-semibold">
                {t('childLog.text_87')}
              </Badge>
            </div>

            {/* Enable / Disable Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-card">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">
                  {t('childLog.text_88')}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t('childLog.text_89')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={alertConfig.enabled}
                onChange={(e) => setAlertConfig({ ...alertConfig, enabled: e.target.checked })}
                className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            {/* Time Picker & Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{t('childLog.text_90')}</span>
                </label>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {t('childLog.text_91')}
                </span>
              </div>
              <Input
                type="time"
                value={alertConfig.time}
                onChange={(e) => setAlertConfig({ ...alertConfig, time: e.target.value })}
                className="h-10 text-sm font-semibold"
                disabled={!alertConfig.enabled}
                required
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-muted-foreground mr-1">
                  {t('childLog.text_92')}
                </span>
                {['20:00', '20:30', '21:00', '21:30', '22:00'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={!alertConfig.enabled}
                    onClick={() => setAlertConfig({ ...alertConfig, time: preset })}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                      alertConfig.time === preset
                        ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                        : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border/60'
                    }`}
                  >
                    {preset === '20:00' ? (t('childLog.text_93')) :
                     preset === '20:30' ? (t('childLog.text_94')) :
                     preset === '21:00' ? (t('childLog.text_95')) :
                     preset === '21:30' ? (t('childLog.text_96')) :
                     (t('childLog.text_97'))}
                  </button>
                ))}
              </div>
            </div>

            {/* Encouragement / Timing Recommendation Callout */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{t('childLog.time_recommendation')}</span>
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                {t('childLog.please_select_a_time_that_is_after_all_of_s_dail', { p0: isBn ? currentChild?.nickname || currentChild?.name || 'সন্তানের' : currentChild?.nickname || currentChild?.name || 'your child' }, `Please select a time that is after all of ${currentChild?.nickname || currentChild?.name || 'your child'}'s daily educational activities (school/college, private tuition, and evening self-study) are finished (e.g. 9:00 PM or 9:30 PM). This ensures your child has enough time to log their study, and you will only be alerted if lessons remain unlogged.`)}
              </p>
            </div>

            {/* Notification Channel Choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {t('childLog.text_98')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: t('childLog.text_99'), desc: t('childLog.text_100') },
                  { id: 'in_app', label: t('childLog.text_101'), desc: t('childLog.text_102') },
                  { id: 'email', label: t('childLog.text_103'), desc: t('childLog.text_104') },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!alertConfig.enabled}
                    onClick={() => setAlertConfig({ ...alertConfig, channel: c.id as any })}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      alertConfig.channel === c.id
                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/30'
                        : 'border-border/60 hover:bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    <p className="text-xs font-bold text-foreground">{c.label}</p>
                    <p className="text-[10px] text-muted-foreground">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Success Message Banner */}
            {alertSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{alertSuccessMsg}</span>
              </div>
            )}

            {/* Error Message Banner */}
            {alertErrorMsg && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <span>{alertErrorMsg}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={testingAlert || !alertConfig.enabled}
                onClick={handleTriggerTestAlert}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>{testingAlert ? (t('childLog.text_105')) : (t('childLog.text_106'))}</span>
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAlertModalOpen(false)}
                  className="text-xs"
                >
                  {t('childLog.text_107')}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingAlert}
                  className="text-xs gap-1.5 bg-primary"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingAlert ? (t('childLog.text_108')) : (t('childLog.text_109'))}</span>
                </Button>
              </div>
            </div>
          </form>
        </Modal>

    </AppShell>
  );
}
