'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Plus,
  Trash2,
  Check,
} from 'lucide-react';

export default function LearningLogPage() {
  const params = useParams();
  const { activeChild, childrenList } = useAuth();
  const { isBn } = useI18n();

  const childId = (params as any)?.id || activeChild?.id || 'demo-child';
  const currentChild = childrenList.find((c) => c.id === childId) || activeChild;

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    source: 'tuition',
    providerName: isBn ? 'রহিম স্যার' : 'Rahim Sir',
    subject: isBn ? 'গণিত (Mathematics)' : 'Mathematics',
    topicsText: isBn ? 'অধ্যায় ৫: দ্বিঘাত সমীকরণ ও মূল নির্ণয়' : 'Chapter 5: Quadratic Equations & Roots Formula',
    durationMin: 60,
    confidence: 4,
  });

  const subjects = [
    isBn ? 'গণিত (Mathematics)' : 'Mathematics',
    isBn ? 'পদার্থবিজ্ঞান (Physics)' : 'Physics',
    isBn ? 'রসায়ন (Chemistry)' : 'Chemistry',
    isBn ? 'জীববিজ্ঞান (Biology)' : 'Biology',
    isBn ? 'ইংরেজি (English)' : 'English',
    isBn ? 'বাংলা (Bangla)' : 'Bangla',
    isBn ? 'আইসিটি (ICT)' : 'ICT',
  ];

  const loadEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/children/${childId}/entries`);
      const list = res.data?.data?.data || res.data?.data || [];
      setEntries(list);
    } catch {
      setEntries([
        {
          id: 'e1',
          date: new Date().toISOString().slice(0, 10),
          source: 'tuition',
          providerName: isBn ? 'রহিম স্যার' : 'Rahim Sir',
          subject: isBn ? 'গণিত' : 'Mathematics',
          topicsText: isBn ? 'অধ্যায় ৫: দ্বিঘাত সমীকরণ ও মূল নির্ণয়' : 'Chapter 5: Quadratic Equations & Roots Formula',
          durationMin: 60,
          confidence: 5,
          verifiedByParent: true,
        },
        {
          id: 'e2',
          date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
          source: 'school',
          providerName: 'School',
          subject: isBn ? 'পদার্থবিজ্ঞান' : 'Physics',
          topicsText: isBn ? 'নিউটনের গতিসূত্র ও ভরবেগ' : 'Newton\'s Laws of Motion & Momentum Vectors',
          durationMin: 45,
          confidence: 4,
          verifiedByParent: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [childId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/children/${childId}/entries`, {
        ...form,
        subjectId: form.subject,
      });
      setMsg(isBn ? 'পাঠ্য বিবরণ সফলভাবে সংরক্ষিত হয়েছে!' : 'Learning log saved successfully!');
      loadEntries();
      setForm({
        ...form,
        topicsText: '',
      });
    } catch {
      // Local fallback
      setEntries([
        {
          id: 'e-' + Date.now(),
          ...form,
          verifiedByParent: false,
        },
        ...entries,
      ]);
      setMsg(isBn ? 'পাঠ্য বিবরণ সংরক্ষিত হয়েছে!' : 'Learning log recorded!');
      setForm({ ...form, topicsText: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await api.post(`/entries/${id}/verify`);
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, verifiedByParent: true } : e))
      );
    } catch {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, verifiedByParent: true } : e))
      );
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {isBn ? 'দৈনিক পড়ার লগ' : 'Daily Learning Logs'}
              </h1>
              {currentChild && (
                <Badge variant="secondary" className="text-xs">
                  {currentChild.name} • {currentChild.grade}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isBn
                ? 'স্কুল, কোচিং ও প্রাইভেটে আজ কী কী পড়ানো হয়েছে তা লিপিবদ্ধ করুন (১ মিনিটের কম সময়)'
                : 'Log lessons taught at school, coaching, or private tuition in under 1 minute.'}
            </p>
          </div>
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg('')} className="underline text-[11px]">
              Dismiss
            </button>
          </div>
        )}

        {/* Add Entry Card */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              <span>{isBn ? 'নতুন পড়ার এন্ট্রি যোগ করুন' : 'Record Today\'s Lesson'}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {isBn
                ? 'পড়ার বিষয়, টপিক ও সময়কাল নির্বাচন করুন'
                : 'Takes under 1 minute — feed directly into AI quiz generation.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Date</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Learning Source</Label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full h-10 border rounded-xl px-3 bg-background text-sm mt-1"
                  >
                    <option value="tuition">Private Tuition</option>
                    <option value="school">School</option>
                    <option value="college">College</option>
                    <option value="self_study">Self-Study</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Tutor / Institution Name</Label>
                  <Input
                    value={form.providerName}
                    onChange={(e) => setForm({ ...form, providerName: e.target.value })}
                    placeholder="e.g. Rahim Sir, Udvash"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label className="text-xs font-semibold">Subject</Label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full h-10 border rounded-xl px-3 bg-background text-sm mt-1"
                  >
                    {subjects.map((s, idx) => (
                      <option key={idx} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Duration (Minutes)</Label>
                  <Input
                    type="number"
                    value={form.durationMin}
                    onChange={(e) => setForm({ ...form, durationMin: parseInt(e.target.value) || 60 })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Topic(s) Learned (Free Text)</Label>
                <Input
                  value={form.topicsText}
                  onChange={(e) => setForm({ ...form, topicsText: e.target.value })}
                  placeholder={
                    isBn
                      ? 'যেমন: অধ্যায় ৩ — নিউটনের দ্বিতীয় সূত্র ও অংকসমূহ'
                      : 'e.g. Chapter 3 — Newton\'s 2nd Law, derivations & practice problems'
                  }
                  required
                  className="mt-1"
                />
              </div>

              {/* Confidence Stars */}
              <div>
                <Label className="text-xs font-semibold block mb-1">
                  Child Confidence Level (1-5)
                </Label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setForm({ ...form, confidence: lvl })}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                        form.confidence >= lvl
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                          : 'bg-muted/20 border-border text-muted-foreground'
                      }`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          form.confidence >= lvl ? 'fill-amber-500 text-amber-500' : ''
                        }`}
                      />
                      <span>{lvl}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || !form.topicsText}
                className="w-full h-10 text-xs font-semibold shadow-sm"
              >
                {submitting ? 'Saving...' : 'Save Learning Log (under 1 min)'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History List */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">
              {isBn ? 'পড়ার ইতিহাস' : 'Recent Learning Entries'} ({entries.length})
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="p-3.5 rounded-xl border bg-card hover:bg-muted/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {e.topicsText}
                      </span>
                      {e.verifiedByParent && (
                        <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-semibold gap-1">
                          <Check className="w-3 h-3" /> Verified
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{e.subject || e.subjectId}</span>
                      <span>•</span>
                      <span className="capitalize">{e.source}</span>
                      {e.providerName && (
                        <>
                          <span>•</span>
                          <span>{e.providerName}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{e.durationMin || 60} mins</span>
                      <span>•</span>
                      <span>{new Date(e.date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {!e.verifiedByParent && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerify(e.id)}
                      className="text-xs h-8 gap-1 border-primary/30 text-primary hover:bg-primary/5 shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isBn ? 'যাচাই করুন' : 'Verify (Parent)'}</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
