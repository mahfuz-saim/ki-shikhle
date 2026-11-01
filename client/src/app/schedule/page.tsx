'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  BookOpen,
  CalendarCheck,
} from 'lucide-react';

const WEEKDAYS = [
  { index: 0, en: 'Sun', bn: 'রবি' },
  { index: 1, en: 'Mon', bn: 'সোম' },
  { index: 2, en: 'Tue', bn: 'মঙ্গল' },
  { index: 3, en: 'Wed', bn: 'বুধ' },
  { index: 4, en: 'Thu', bn: 'বৃহ' },
  { index: 5, en: 'Fri', bn: 'শুক্র' },
  { index: 6, en: 'Sat', bn: 'শনি' },
];

export default function SchedulePage() {
  const { activeChild } = useAuth();
  const { t, isBn } = useI18n();

  const childId = activeChild?.id || 'demo-child';

  const [routines, setRoutines] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [quickLogModalOpen, setQuickLogModalOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);

  // Form for new routine
  const [form, setForm] = useState({
    name: '',
    source: 'tuition',
    weekdays: [0, 2, 4], // Sun, Tue, Thu
    startTime: '16:00',
    durationMin: 90,
    startsOn: new Date().toISOString().slice(0, 10),
  });

  // Form for reschedule
  const [rescheduleForm, setRescheduleForm] = useState({
    originalDate: new Date().toISOString().slice(0, 10),
    newDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    newStartTime: '16:00',
  });

  // Quick log form
  const [quickLogForm, setQuickLogForm] = useState({
    topic: '',
    source: 'tuition',
    duration: 60,
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Load routines
  const loadRoutines = async () => {
    try {
      const r = await api.get(`/children/${childId}/routines`);
      setRoutines(r.data.data || []);
    } catch {
      setRoutines([
        {
          id: 'r1',
          name: isBn ? 'গণিত প্রাইভেট — রহিম স্যার' : 'Math Tuition – Rahim Sir',
          source: 'tuition',
          weekdays: [0, 2, 5],
          startTime: '16:00',
          durationMin: 90,
        },
        {
          id: 'r2',
          name: isBn ? 'পদার্থবিজ্ঞান কোচিং' : 'Physics Coaching',
          source: 'tuition',
          weekdays: [1, 3],
          startTime: '17:30',
          durationMin: 60,
        },
      ]);
    }
  };

  // Load computed schedule
  const loadSchedule = async () => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2).toISOString().slice(0, 10);
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5).toISOString().slice(0, 10);

    try {
      const r = await api.get(`/children/${childId}/schedule?from=${from}&to=${to}`);
      setSchedule(r.data.data);
    } catch {
      setSchedule({
        occurrences: [
          {
            date: new Date().toISOString().slice(0, 10),
            name: isBn ? 'গণিত প্রাইভেট' : 'Math Tuition',
            status: 'scheduled',
            startTime: '16:00',
            durationMin: 90,
            source: 'tuition',
          },
          {
            date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            name: isBn ? 'পদার্থবিজ্ঞান কোচিং' : 'Physics Coaching',
            status: 'scheduled',
            startTime: '17:30',
            durationMin: 60,
            source: 'tuition',
          },
          {
            date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
            name: isBn ? 'গণিত অতিরিক্ত ক্লাস (পুনর্নির্ধারিত)' : 'Math Extra Session (Rescheduled)',
            status: 'rescheduled',
            startTime: '16:00',
            durationMin: 90,
            source: 'tuition',
          },
        ],
        missed: [
          {
            date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
            name: isBn ? 'বিজ্ঞান ক্লাস' : 'General Science',
            source: 'school',
          },
        ],
      });
    }
  };

  useEffect(() => {
    loadRoutines();
    loadSchedule();
  }, [childId]);

  const toggleWeekday = (idx: number) => {
    if (form.weekdays.includes(idx)) {
      setForm({ ...form, weekdays: form.weekdays.filter((i) => i !== idx) });
    } else {
      setForm({ ...form, weekdays: [...form.weekdays, idx].sort() });
    }
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/children/${childId}/routines`, form);
      await loadRoutines();
      await loadSchedule();
      setCreateModalOpen(false);
      setForm({
        name: '',
        source: 'tuition',
        weekdays: [0, 2, 4],
        startTime: '16:00',
        durationMin: 90,
        startsOn: new Date().toISOString().slice(0, 10),
      });
      setMsg(isBn ? 'রুটিন সফলভাবে তৈরি হয়েছে' : 'Routine created successfully');
    } catch {
      // Fallback
      setRoutines((prev) => [...prev, { id: 'r-' + Date.now(), ...form }]);
      setCreateModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const openRescheduleModal = (routine: any) => {
    setSelectedRoutine(routine);
    setRescheduleForm({
      originalDate: new Date().toISOString().slice(0, 10),
      newDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      newStartTime: routine.startTime || '16:00',
    });
    setRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoutine) return;
    setLoading(true);
    try {
      await api.post(`/routines/${selectedRoutine.id}/exceptions`, {
        originalDate: rescheduleForm.originalDate,
        type: 'rescheduled',
        newDate: rescheduleForm.newDate,
        newStartTime: rescheduleForm.newStartTime,
      });
      await loadSchedule();
      setRescheduleModalOpen(false);
      setMsg(isBn ? 'সেশন পুনর্নির্ধারণ করা হয়েছে' : 'Session rescheduled successfully');
    } catch {
      setRescheduleModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    if (!confirm(isBn ? 'এই রুটিনটি মুছে ফেলতে চান?' : 'Delete this routine?')) return;
    try {
      await api.delete(`/routines/${id}`);
      loadRoutines();
      loadSchedule();
    } catch {
      setRoutines((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/children/${childId}/entries`, {
        source: quickLogForm.source,
        topicsText: quickLogForm.topic,
        durationMin: quickLogForm.duration,
        date: new Date().toISOString().slice(0, 10),
      });
      setQuickLogModalOpen(false);
      setQuickLogForm({ topic: '', source: 'tuition', duration: 60 });
      setMsg(isBn ? 'পড়ার লগ সংরক্ষিত হয়েছে!' : 'Study log recorded successfully!');
    } catch {
      setQuickLogModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Title & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t('schedule.title', 'Routine & Schedule')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isBn
                ? 'সাপ্তাহিক রুটিন, ক্লাসের সময় ও সেশন পুনর্নির্ধারণের হিসাব'
                : 'Manage recurring school/tuition routines, reschedule sessions, and detect missed classes.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setQuickLogForm({ topic: '', source: 'tuition', duration: 60 });
                setQuickLogModalOpen(true);
              }}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-9"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isBn ? 'কুইক লগ' : 'Quick Log'}</span>
            </Button>
            <Button
              onClick={() => setCreateModalOpen(true)}
              size="sm"
              className="gap-1.5 text-xs h-9 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{t('schedule.createRoutine', 'Add Routine')}</span>
            </Button>
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

        {/* Weekly Occurrences View */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-primary" />
                  <span>{isBn ? 'এই সপ্তাহের সময়সূচি' : 'This Week\'s Scheduled Sessions'}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isBn
                    ? 'পুনর্নির্ধারিত ও নির্ধারিত ক্লাস স্বয়ংক্রিয়ভাবে হিসাবকৃত'
                    : 'Computed sessions with reschedule exceptions and missed logs.'}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={loadSchedule} className="h-8 text-xs gap-1">
                <RefreshCw className="w-3 h-3" />
                Refresh
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {schedule?.occurrences?.length ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {schedule.occurrences.map((o: any, idx: number) => {
                  const isRescheduled = o.status === 'rescheduled';
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-colors ${
                        isRescheduled ? 'border-amber-500/30 bg-amber-500/5' : 'bg-muted/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-foreground truncate">{o.name}</span>
                        <Badge
                          variant={isRescheduled ? 'secondary' : 'outline'}
                          className={`text-[10px] uppercase font-semibold ${
                            isRescheduled ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400' : ''
                          }`}
                        >
                          {o.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium">
                          <CalendarIcon className="w-3 h-3 text-primary" />
                          {o.date}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {o.startTime}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">No scheduled occurrences for this period.</p>
            )}

            {/* Missed Sessions Notification */}
            {schedule?.missed?.length > 0 && (
              <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/5 space-y-1">
                <p className="text-xs font-bold text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isBn ? 'মিস হওয়া ক্লাস' : 'Missed Learning Logs'}</span>
                </p>
                {schedule.missed.map((m: any, idx: number) => (
                  <p key={idx} className="text-xs text-muted-foreground pl-5">
                    {m.date}: <span className="font-semibold text-foreground">{m.name}</span> ({m.source}) —{' '}
                    {isBn ? 'নির্ধারিত সময় পার হয়েছে কিন্তু কোনো পাঠ্য বিবরণ নেই।' : 'Scheduled time passed without a logged lesson.'}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Routines List */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">
              {isBn ? 'নিয়মিত রুটিনসমূহ' : 'Active Recurring Routines'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isBn
                ? 'সপ্তাহভিত্তিক পুনরাবৃত্তিমূলক টিউশন ও কোচিং'
                : 'Configured recurring sessions that generate daily schedules.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {routines.map((r: any) => (
                <div
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border bg-card hover:bg-muted/30 transition-colors gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground truncate">{r.name}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {r.source}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {r.startTime} ({r.durationMin || 90}m)
                      </span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        {WEEKDAYS.map((w) => {
                          const active = r.weekdays?.includes(w.index);
                          return (
                            <span
                              key={w.index}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                active
                                  ? 'bg-primary text-primary-foreground font-bold'
                                  : 'text-muted-foreground/40'
                              }`}
                            >
                              {isBn ? w.bn : w.en}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRescheduleModal(r)}
                      className="text-xs h-8 gap-1 border-primary/30 text-primary hover:bg-primary/5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{isBn ? 'পুনর্নির্ধারণ' : 'Reschedule'}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteRoutine(r.id)}
                      className="text-xs h-8 px-2 text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Routine Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t('schedule.createRoutine', 'Add Recurring Routine')}
        description="Set up recurring days and times for school or private tuition."
      >
        <form onSubmit={handleCreateRoutine} className="space-y-4 pt-1">
          <div>
            <Label className="text-xs font-semibold">{t('schedule.routineName', 'Routine Name')}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={isBn ? 'যেমন: গণিত প্রাইভেট — রহিম স্যার' : 'e.g. Math Tuition – Rahim Sir'}
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">{t('schedule.source', 'Learning Source')}</Label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="h-10 w-full border rounded-xl px-3 bg-background text-sm mt-1"
              >
                <option value="tuition">Tuition / Private</option>
                <option value="school">School</option>
                <option value="college">College</option>
                <option value="self_study">Self-Study</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold">{t('schedule.startTime', 'Start Time')}</Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
                className="mt-1"
              />
            </div>
          </div>

          {/* Weekday selector */}
          <div>
            <Label className="text-xs font-semibold block mb-1.5">{t('schedule.weekdays', 'Days of Week')}</Label>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((w) => {
                const isSelected = form.weekdays.includes(w.index);
                return (
                  <button
                    type="button"
                    key={w.index}
                    onClick={() => toggleWeekday(w.index)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {isBn ? w.bn : w.en}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">{t('schedule.duration', 'Duration (mins)')}</Label>
              <Input
                type="number"
                value={form.durationMin}
                onChange={(e) => setForm({ ...form, durationMin: parseInt(e.target.value) || 60 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Starts From</Label>
              <Input
                type="date"
                value={form.startsOn}
                onChange={(e) => setForm({ ...form, startsOn: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? t('common.loading', 'Saving...') : t('common.save', 'Create Routine')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        title={t('schedule.reschedule', 'Reschedule Session')}
        description={`Move a specific class of "${selectedRoutine?.name}" to a different date or time.`}
        maxWidth="sm"
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4 pt-1">
          <div>
            <Label className="text-xs font-semibold">Original Scheduled Date</Label>
            <Input
              type="date"
              value={rescheduleForm.originalDate}
              onChange={(e) => setRescheduleForm({ ...rescheduleForm, originalDate: e.target.value })}
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">New Date</Label>
              <Input
                type="date"
                value={rescheduleForm.newDate}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, newDate: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">New Time</Label>
              <Input
                type="time"
                value={rescheduleForm.newStartTime}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, newStartTime: e.target.value })}
                required
                className="mt-1"
              />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            The original date will be marked as moved and the new occurrence will appear on your child&apos;s schedule.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setRescheduleModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Log Modal */}
      <Modal
        isOpen={quickLogModalOpen}
        onClose={() => setQuickLogModalOpen(false)}
        title="Quick Log Lesson"
        description="Log today's study topic in under 1 minute."
        maxWidth="sm"
      >
        <form onSubmit={handleQuickLog} className="space-y-4 pt-1">
          <div>
            <Label className="text-xs font-semibold">What was learned today? (Topic)</Label>
            <Input
              value={quickLogForm.topic}
              onChange={(e) => setQuickLogForm({ ...quickLogForm, topic: e.target.value })}
              placeholder={isBn ? 'যেমন: ত্রিভুজের ক্ষেত্রফল সূত্র' : 'e.g. Newton 2nd Law F=ma'}
              required
              className="mt-1"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Source</Label>
              <select
                value={quickLogForm.source}
                onChange={(e) => setQuickLogForm({ ...quickLogForm, source: e.target.value })}
                className="h-10 w-full border rounded-xl px-3 bg-background text-sm mt-1"
              >
                <option value="tuition">Tuition</option>
                <option value="school">School</option>
                <option value="self_study">Self-Study</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Duration (min)</Label>
              <Input
                type="number"
                value={quickLogForm.duration}
                onChange={(e) => setQuickLogForm({ ...quickLogForm, duration: parseInt(e.target.value) || 60 })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setQuickLogModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !quickLogForm.topic}>
              {loading ? 'Saving...' : 'Save Log'}
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
