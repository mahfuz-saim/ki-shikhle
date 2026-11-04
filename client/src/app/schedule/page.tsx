'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { getInstitutionType, getInstitutionInfo } from '@/lib/institution';
import { api } from '@/lib/api';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  RefreshCw,
  Trash2,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  BookOpen,
  School,
  GraduationCap,
  Building2,
  Check,
  UserCheck,
  ChevronDown,
} from 'lucide-react';

const WEEKDAYS = [
  { index: 0, en: 'Sun', bn: 'রবি', fullEn: 'Sunday', fullBn: 'রবিবার' },
  { index: 1, en: 'Mon', bn: 'সোম', fullEn: 'Monday', fullBn: 'সোমবার' },
  { index: 2, en: 'Tue', bn: 'মঙ্গল', fullEn: 'Tuesday', fullBn: 'মঙ্গলবার' },
  { index: 3, en: 'Wed', bn: 'বুধ', fullEn: 'Wednesday', fullBn: 'বুধবার' },
  { index: 4, en: 'Thu', bn: 'বৃহ', fullEn: 'Thursday', fullBn: 'বৃহস্পতিবার' },
  { index: 5, en: 'Fri', bn: 'শুক্র', fullEn: 'Friday', fullBn: 'শুক্রবার' },
  { index: 6, en: 'Sat', bn: 'শনি', fullEn: 'Saturday', fullBn: 'শনিবার' },
];

const BN_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function toBnNum(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

function getWeekDates(offsetWeeks: number = 0, baseDate: Date = new Date()): Date[] {
  const sunday = new Date(baseDate);
  const day = sunday.getDay();
  sunday.setDate(sunday.getDate() - day + (offsetWeeks * 7));
  sunday.setHours(12, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function getWeekOffsetForDate(target: Date, base: Date = new Date()): number {
  const targetSunday = new Date(target);
  targetSunday.setDate(targetSunday.getDate() - targetSunday.getDay());
  targetSunday.setHours(12, 0, 0, 0);

  const baseSunday = new Date(base);
  baseSunday.setDate(baseSunday.getDate() - baseSunday.getDay());
  baseSunday.setHours(12, 0, 0, 0);

  const diffTime = targetSunday.getTime() - baseSunday.getTime();
  return Math.round(diffTime / (7 * 86400000));
}

function formatFullDate(date: Date, isBn: boolean): string {
  const dayObj = WEEKDAYS[date.getDay()];
  const dayName = isBn ? dayObj.fullBn : dayObj.fullEn;
  const monthName = isBn ? BN_MONTHS[date.getMonth()] : EN_MONTHS[date.getMonth()];
  const dateNum = isBn ? toBnNum(date.getDate()) : date.getDate();
  const yearNum = isBn ? toBnNum(date.getFullYear()) : date.getFullYear();

  return isBn
    ? `${dayName}, ${dateNum} ${monthName} ${yearNum}`
    : `${dayName}, ${monthName} ${dateNum}, ${yearNum}`;
}

function getDefaultRoutines(childId: string, isBn: boolean) {
  if (childId === 'demo-child-2') {
    return [
      { id: 'r-t-p1', name: isBn ? '১ম পিরিয়ড: প্রাথমিক বাংলা' : '1st Period: Primary Bangla', periodName: '১ম পিরিয়ড', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '09:30', durationMin: 45, subject: 'Bangla', teacher: 'ফরিদা ইয়াসমিন ম্যাডাম' },
      { id: 'r-t-p2', name: isBn ? '২য় পিরিয়ড: প্রাথমিক ইংরেজি' : '2nd Period: Primary English', periodName: '২য় পিরিয়ড', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '10:15', durationMin: 45, subject: 'English', teacher: 'সায়মা সুলতানা ম্যাডাম' },
      { id: 'r-t-p3', name: isBn ? '৩য় পিরিয়ড: প্রাথমিক গণিত' : '3rd Period: Primary Math', periodName: '৩য় পিরিয়ড', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '11:15', durationMin: 45, subject: 'Mathematics', teacher: 'তানিয়া রহমান ম্যাডাম' },
      { id: 'r-t1', name: isBn ? 'প্রাথমিক গণিত প্রাইভেট' : 'Elementary Math Tuition', periodName: 'প্রাইভেট', source: 'tuition', weekdays: [0, 2, 4], startTime: '16:00', durationMin: 60, subject: 'Mathematics', teacher: 'রোকেয়া আপা' },
      { id: 'r-t2', name: isBn ? 'ইংরেজি টিউটর' : 'English Tutor', periodName: 'প্রাইভেট', source: 'tuition', weekdays: [1, 3], startTime: '17:30', durationMin: 45, subject: 'English', teacher: 'শরীফ স্যার' },
      { id: 'r-t3', name: isBn ? 'সন্ধ্যায় হোমওয়ার্ক ও সেলফ স্টাডি' : 'Evening Homework & Self-Study', periodName: 'সেলফ স্টাডি', source: 'self_study', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '18:30', durationMin: 75, subject: 'Self-Study' },
    ];
  }
  if (childId === 'demo-child-3') {
    return [
      { id: 'r-f-c1', name: isBn ? '১ম পিরিয়ড: পদার্থবিজ্ঞান ১ম পত্র' : '1st Period: Physics 1st Paper', periodName: '১ম পিরিয়ড', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '08:30', durationMin: 50, subject: 'Physics', teacher: 'ড. মাহবুব স্যার' },
      { id: 'r-f-c2', name: isBn ? '২য় পিরিয়ড: রসায়ন ১ম পত্র' : '2nd Period: Chemistry 1st Paper', periodName: '২য় পিরিয়ড', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '09:20', durationMin: 50, subject: 'Chemistry', teacher: 'তাহমিনা ম্যাডাম' },
      { id: 'r-f-c3', name: isBn ? '৩য় পিরিয়ড: উচ্চতর গণিত ১ম পত্র' : '3rd Period: Higher Math 1st Paper', periodName: '৩য় পিরিয়ড', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '10:10', durationMin: 50, subject: 'Higher Mathematics', teacher: 'এনামুল স্যার' },
      { id: 'r-f1', name: isBn ? 'পদার্থবিজ্ঞান কোচিং — গতিবিদ্যা' : 'Physics Coaching', periodName: 'কোচিং', source: 'tuition', weekdays: [0, 2, 4], startTime: '16:30', durationMin: 75, subject: 'Physics', teacher: 'আহমেদ স্যার' },
      { id: 'r-f2', name: isBn ? 'রসায়ন প্রাইভেট' : 'Chemistry Tuition', periodName: 'প্রাইভেট', source: 'tuition', weekdays: [1, 3], startTime: '17:00', durationMin: 60, subject: 'Chemistry', teacher: 'কামরুল স্যার' },
      { id: 'r-f3', name: isBn ? 'উচ্চতর গণিত সেলফ স্টাডি' : 'Higher Math Self-Study', periodName: 'সেলফ স্টাডি', source: 'self_study', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '20:30', durationMin: 60, subject: 'Higher Mathematics' },
    ];
  }
  return [
    { id: 'r-r-p1', name: isBn ? '১ম পিরিয়ড: বাংলা ১ম পত্র' : '1st Period: Bangla 1st Paper', periodName: '১ম পিরিয়ড', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '09:00', durationMin: 45, subject: 'Bangla', teacher: 'কবির আহমেদ স্যার' },
    { id: 'r-r-p2', name: isBn ? '২য় পিরিয়ড: ইংরেজি ১ম পত্র' : '2nd Period: English 1st Paper', periodName: '২য় পিরিয়ড', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '09:45', durationMin: 45, subject: 'English', teacher: 'নাসরিন সুলতানা ম্যাডাম' },
    { id: 'r-r-p3', name: isBn ? '৩য় পিরিয়ড: সাধারণ গণিত' : '3rd Period: Mathematics', periodName: '৩য় পিরিয়ড', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '10:30', durationMin: 45, subject: 'Mathematics', teacher: 'আবুল হোসেন স্যার' },
    { id: 'r1', name: isBn ? 'গণিত প্রাইভেট — রহিম স্যার' : 'Math Tuition – Rahim Sir', periodName: 'প্রাইভেট', source: 'tuition', weekdays: [0, 2, 4], startTime: '16:00', durationMin: 90, subject: 'Mathematics', teacher: 'রহিম স্যার' },
    { id: 'r2', name: isBn ? 'পদার্থবিজ্ঞান কোচিং' : 'Physics Coaching', periodName: 'কোচিং', source: 'tuition', weekdays: [1, 3], startTime: '17:30', durationMin: 60, subject: 'Science', teacher: 'আহমেদ স্যার' },
    { id: 'r3', name: isBn ? 'সন্ধ্যায় সেলফ স্টাডি ও রিভিশন' : 'Evening Self-Study & Revision', periodName: 'সেলফ স্টাডি', source: 'self_study', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '20:00', durationMin: 90, subject: 'Self-Study' },
  ];
}

export default function SchedulePage() {
  const { activeChild, setActiveChild, childrenList } = useAuth();
  const { t, isBn } = useI18n();

  const childId = activeChild?.id || childrenList[0]?.id || 'demo-child-1';
  const currentChild = childrenList.find((c) => c.id === childId) || activeChild || childrenList[0];
  const institutionType = getInstitutionType(currentChild?.grade);
  const instInfo = getInstitutionInfo(institutionType, isBn);

  const [routines, setRoutines] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any>(null);
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  // Date and Slider State
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatDateKey(today), [today]);
  const tomorrowStr = useMemo(() => {
    const tm = new Date(today);
    tm.setDate(tm.getDate() + 1);
    return formatDateKey(tm);
  }, [today]);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [autoAdvancedToTomorrow, setAutoAdvancedToTomorrow] = useState<boolean>(false);
  const [hasUserManuallySelectedDate, setHasUserManuallySelectedDate] = useState<boolean>(false);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Form for new routine
  const [form, setForm] = useState({
    name: '',
    source: 'tuition',
    weekdays: [0, 2, 4],
    startTime: '16:00',
    durationMin: 90,
    startsOn: todayStr,
  });

  // Form for reschedule
  const [rescheduleForm, setRescheduleForm] = useState({
    originalDate: todayStr,
    newDate: tomorrowStr,
    newStartTime: '16:00',
  });

  // Load completed items from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`ki_completed_schedule_${childId}`);
        if (stored) {
          setCompletedMap(JSON.parse(stored));
        } else {
          setCompletedMap({});
        }
      } catch {
        setCompletedMap({});
      }
    }
  }, [childId]);

  // Save completed items to localStorage
  const saveCompletedMap = (newMap: Record<string, boolean>) => {
    setCompletedMap(newMap);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`ki_completed_schedule_${childId}`, JSON.stringify(newMap));
      } catch {}
    }
  };

  // Load routines from API
  const loadRoutines = useCallback(async () => {
    try {
      const r = await api.get(`/children/${childId}/routines`);
      const list = r.data?.data || [];
      if (list && list.length > 0) {
        setRoutines(list);
      } else {
        setRoutines(getDefaultRoutines(childId, isBn));
      }
    } catch {
      setRoutines(getDefaultRoutines(childId, isBn));
    }
  }, [childId, isBn]);

  // Load computed schedule from API
  const loadSchedule = useCallback(async () => {
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14).toISOString().slice(0, 10);
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 28).toISOString().slice(0, 10);

    try {
      const r = await api.get(`/children/${childId}/schedule?from=${from}&to=${to}`);
      if (r.data?.data?.occurrences?.length) {
        setSchedule(r.data.data);
      } else {
        setSchedule(null);
      }
    } catch {
      setSchedule(null);
    }
  }, [childId, today]);

  useEffect(() => {
    loadRoutines();
    loadSchedule();
  }, [loadRoutines, loadSchedule]);

  // Compute 7 days for the current weekOffset
  const weekDates = useMemo(() => {
    return getWeekDates(weekOffset, today);
  }, [weekOffset, today]);

  // Build occurrences for a given date from server schedule or local routines
  const getSessionsForDate = useCallback(
    (dateKey: string) => {
      // 1. Check if server returned computed occurrences for this date
      if (schedule?.occurrences?.length) {
        const serverMatches = schedule.occurrences.filter((o: any) => o.date === dateKey);
        if (serverMatches.length > 0) {
          return [...serverMatches].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
        }
      }

      // 2. Compute directly from active routines
      const date = parseDateKey(dateKey);
      const weekday = date.getDay();

      const matches = (routines || []).filter((r: any) => {
        if (!r) return false;
        const wds = Array.isArray(r.weekdays) ? r.weekdays : [];
        return wds.includes(weekday);
      });

      return matches
        .map((r: any) => ({
          routineId: r.id,
          name: r.name,
          periodName: r.periodName,
          teacher: r.teacher,
          room: r.room,
          subject: r.subject,
          source: r.source || 'tuition',
          date: dateKey,
          startTime: r.startTime || '16:00',
          durationMin: r.durationMin || 60,
          status: 'scheduled',
        }))
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    },
    [schedule, routines]
  );

  const getOccurrenceId = useCallback((childKey: string, session: any) => {
    return `${childKey}_${session.date}_${session.routineId || session.name}_${session.startTime}`;
  }, []);

  const isSessionCompleted = useCallback(
    (session: any) => {
      const key = getOccurrenceId(childId, session);
      return completedMap[key] === true || session.status === 'completed';
    },
    [childId, completedMap, getOccurrenceId]
  );

  const toggleSessionCompletion = (session: any) => {
    const key = getOccurrenceId(childId, session);
    const updated = { ...completedMap, [key]: !completedMap[key] };
    saveCompletedMap(updated);

    // If toggling on today and this completes all of today's classes
    if (session.date === todayStr && updated[key]) {
      const todaySessions = getSessionsForDate(todayStr);
      const isNowAllDone = todaySessions.length > 0 && todaySessions.every((s) => {
        const k = getOccurrenceId(childId, s);
        return updated[k] === true || s.status === 'completed';
      });

      if (isNowAllDone) {
        setMsg(
          isBn
            ? '🎉 আজকের সব শিডিউল সম্পন্ন হয়েছে! চমৎকার কাজ।'
            : "🎉 All of today's schedule is now complete! Great job."
        );
      }
    }
  };

  // Intelligent initialization on page load:
  // "When page loaded it will show today's routine. After all schedule completed of a day, show tomorrow's routine."
  useEffect(() => {
    if (hasUserManuallySelectedDate) return;

    const todaySessions = getSessionsForDate(todayStr);
    if (todaySessions.length > 0) {
      const allTodayCompleted = todaySessions.every((s) => isSessionCompleted(s));
      if (allTodayCompleted) {
        setSelectedDate(tomorrowStr);
        setWeekOffset(getWeekOffsetForDate(parseDateKey(tomorrowStr), today));
        setAutoAdvancedToTomorrow(true);
        return;
      }
    }

    // Default to today
    setSelectedDate(todayStr);
    setWeekOffset(0);
    setAutoAdvancedToTomorrow(false);
  }, [todayStr, tomorrowStr, getSessionsForDate, isSessionCompleted, hasUserManuallySelectedDate, today]);

  // Handle selecting any date from the slider or picker
  const handleSelectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    setHasUserManuallySelectedDate(true);
    const offset = getWeekOffsetForDate(parseDateKey(dateKey), today);
    setWeekOffset(offset);
  };

  const goToToday = () => {
    setSelectedDate(todayStr);
    setWeekOffset(0);
    setHasUserManuallySelectedDate(true);
  };

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
        startsOn: todayStr,
      });
      setMsg(isBn ? 'রুটিন সফলভাবে তৈরি হয়েছে' : 'Routine created successfully');
    } catch {
      setRoutines((prev) => [...prev, { id: 'r-' + Date.now(), ...form }]);
      setCreateModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const openRescheduleModal = (session: any) => {
    setSelectedRoutine(session);
    setRescheduleForm({
      originalDate: session.date || todayStr,
      newDate: tomorrowStr,
      newStartTime: session.startTime || '16:00',
    });
    setRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoutine) return;
    setLoading(true);
    try {
      const routineId = selectedRoutine.routineId || selectedRoutine.id;
      if (routineId) {
        await api.post(`/routines/${routineId}/exceptions`, {
          originalDate: rescheduleForm.originalDate,
          type: 'rescheduled',
          newDate: rescheduleForm.newDate,
          newStartTime: rescheduleForm.newStartTime,
        });
      }
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

  // Sessions for currently selected date
  const selectedSessions = useMemo(() => {
    return getSessionsForDate(selectedDate);
  }, [getSessionsForDate, selectedDate]);

  const selectedDateObj = useMemo(() => {
    return parseDateKey(selectedDate);
  }, [selectedDate]);

  const completedInSelected = useMemo(() => {
    return selectedSessions.filter((s) => isSessionCompleted(s)).length;
  }, [selectedSessions, isSessionCompleted]);

  const totalMinutesInSelected = useMemo(() => {
    return selectedSessions.reduce((acc, s) => acc + (s.durationMin || 45), 0);
  }, [selectedSessions]);

  const isTodayDone = useMemo(() => {
    const todayList = getSessionsForDate(todayStr);
    return todayList.length > 0 && todayList.every((s) => isSessionCompleted(s));
  }, [getSessionsForDate, todayStr, isSessionCompleted]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Page Title & Child Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {t('schedule.title', 'Routine & Schedule')}
              </h1>
              <Badge variant="outline" className="text-xs font-bold text-primary border-primary/30">
                {currentChild?.name || 'Student'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {instInfo.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Child Selector Pills if multiple children exist */}
            {childrenList && childrenList.length > 1 && (
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border">
                {childrenList.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveChild(c)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      c.id === childId
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {c.nickname || c.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}

            <Button
              onClick={() => {
                setForm((prev) => ({ ...prev, weekdays: [selectedDateObj.getDay()] }));
                setCreateModalOpen(true);
              }}
              size="sm"
              className="gap-1.5 text-xs h-9 shadow-sm bg-primary text-primary-foreground font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>{t('schedule.createRoutine', 'Add Routine')}</span>
            </Button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {msg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {msg}
            </span>
            <button onClick={() => setMsg('')} className="underline text-[11px] font-bold">
              Dismiss
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* WEEKLY CALENDAR SLIDER (Above Routine)                   */}
        {/* ========================================================= */}
        <div className="bg-card border rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
          {/* Header Row: Month/Year Info & Navigation Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                    {isBn
                      ? `${BN_MONTHS[weekDates[3].getMonth()]} ${toBnNum(weekDates[3].getFullYear())}`
                      : `${EN_MONTHS[weekDates[3].getMonth()]} ${weekDates[3].getFullYear()}`}
                  </h2>
                  {weekOffset !== 0 && (
                    <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground">
                      {weekOffset > 0
                        ? isBn
                          ? `+${toBnNum(weekOffset)} সপ্তাহ`
                          : `+${weekOffset} wk`
                        : isBn
                        ? `${toBnNum(weekOffset)} সপ্তাহ`
                        : `${weekOffset} wk`}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {isBn
                    ? `${toBnNum(weekDates[0].getDate())} ${BN_MONTHS[weekDates[0].getMonth()]} – ${toBnNum(
                        weekDates[6].getDate()
                      )} ${BN_MONTHS[weekDates[6].getMonth()]}`
                    : `${EN_MONTHS[weekDates[0].getMonth()].slice(0, 3)} ${weekDates[0].getDate()} – ${EN_MONTHS[
                        weekDates[6].getMonth()
                      ].slice(0, 3)} ${weekDates[6].getDate()}`}
                </p>
              </div>
            </div>

            {/* Controls: Prev, Today, Next, Date Picker */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset((prev) => prev - 1)}
                className="h-8 w-8 p-0 rounded-xl"
                title={isBn ? 'পূর্ববর্তী সপ্তাহ' : 'Previous week'}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                variant={selectedDate === todayStr ? 'default' : 'outline'}
                size="sm"
                onClick={goToToday}
                className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 transition-all"
              >
                <span>{isBn ? 'আজ' : 'Today'}</span>
                {selectedDate !== todayStr && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset((prev) => prev + 1)}
                className="h-8 w-8 p-0 rounded-xl"
                title={isBn ? 'পরবর্তী সপ্তাহ' : 'Next week'}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              {/* Native Date Picker Popover Trigger */}
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) handleSelectDate(e.target.value);
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  title={isBn ? 'যেকোনো তারিখ নির্বাচন করুন' : 'Pick any date'}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <CalendarCheck className="w-3.5 h-3.5 text-primary" />
                  <span className="hidden sm:inline font-semibold">{isBn ? 'তারিখ নির্বাচন' : 'Pick Date'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* 7-Day Slider Cards Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-1">
            {weekDates.map((d) => {
              const dateKey = formatDateKey(d);
              const isSelected = selectedDate === dateKey;
              const isTodayDate = dateKey === todayStr;
              const daySessions = getSessionsForDate(dateKey);
              const completedCount = daySessions.filter((s) => isSessionCompleted(s)).length;
              const isDone = daySessions.length > 0 && completedCount === daySessions.length;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => handleSelectDate(dateKey)}
                  className={`py-2 sm:py-3 px-0.5 sm:px-1 rounded-xl sm:rounded-2xl border text-center transition-all flex flex-col items-center justify-between relative group select-none ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/25 scale-[1.02]'
                      : isDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-foreground'
                      : 'bg-muted/20 border-border/70 hover:bg-muted/40 text-foreground'
                  }`}
                >
                  {isTodayDate && (
                    <span
                      className={`absolute -top-2 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                        isSelected ? 'bg-amber-400 text-black' : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      {isBn ? 'আজ' : 'Today'}
                    </span>
                  )}

                  {/* Weekday name */}
                  <span className="text-[10px] sm:text-xs font-semibold opacity-85">
                    {isBn ? WEEKDAYS[d.getDay()].bn : WEEKDAYS[d.getDay()].en}
                  </span>

                  {/* Date number */}
                  <span className="text-base sm:text-xl font-extrabold my-0.5">
                    {isBn ? toBnNum(d.getDate()) : d.getDate()}
                  </span>

                  {/* Scheduled count / completion badge */}
                  <span
                    className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : isDone
                        ? 'bg-emerald-500 text-white'
                        : daySessions.length > 0
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground/60'
                    }`}
                  >
                    {isDone
                      ? isBn
                        ? 'সম্পূর্ণ ✓'
                        : 'Done ✓'
                      : daySessions.length > 0
                      ? isBn
                        ? `${toBnNum(daySessions.length)} ক্লাস`
                        : `${daySessions.length} cls`
                      : isBn
                      ? 'ছুটি'
                      : 'Off'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* AUTO-TOMORROW NOTICE BANNER                              */}
        {/* ========================================================= */}
        {selectedDate === tomorrowStr && isTodayDone && (
          <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  {isBn
                    ? 'আজকের সব শিডিউল সম্পন্ন হয়েছে! আগামীকালের রুটিন প্রদর্শিত হচ্ছে।'
                    : "Today's schedule is 100% completed! Showing tomorrow's routine."}
                </p>
                <p className="text-xs opacity-80 mt-0.5">
                  {isBn
                    ? 'আজকের সব ক্লাস সম্পন্ন হয়েছে। আগামীকালের ক্লাসের রুটিন ও প্রস্তুতি নিচে দেখুন।'
                    : 'All sessions for today are complete. Review upcoming sessions and lesson preparation for tomorrow.'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectDate(todayStr)}
              className="h-8 text-xs font-bold border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-900 dark:text-emerald-100 shrink-0"
            >
              {isBn ? 'আজকের রুটিন দেখুন' : "View Today's Routine"}
            </Button>
          </div>
        )}

        {/* ========================================================= */}
        {/* SELECTED DAY'S ROUTINE VIEW (Single Day, NOT Full Week)   */}
        {/* ========================================================= */}
        <div className="space-y-4">
          {/* Day Header with Stats & Progress */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight">
                  {formatFullDate(selectedDateObj, isBn)}
                </h2>
                {selectedDate === todayStr && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] font-extrabold px-2 py-0.5">
                    {isBn ? 'আজকের রুটিন' : "Today's Routine"}
                  </Badge>
                )}
                {selectedDate === tomorrowStr && (
                  <Badge className="bg-amber-500 text-black text-[10px] font-extrabold px-2 py-0.5">
                    {isBn ? 'আগামীকালের রুটিন' : "Tomorrow's Routine"}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {selectedSessions.length > 0
                  ? isBn
                    ? `মোট ${toBnNum(selectedSessions.length)}টি ক্লাস/সেশন • আনুমানিক ${toBnNum(
                        totalMinutesInSelected
                      )} মিনিট সময়সূচি`
                    : `${selectedSessions.length} session(s) scheduled • approx ${totalMinutesInSelected} mins total`
                  : isBn
                  ? 'এই দিনে কোনো নিয়মিত ক্লাস বা সেশন নির্ধারিত নেই'
                  : 'No classes scheduled for this day'}
              </p>
            </div>

            {selectedSessions.length > 0 && (
              <div className="flex items-center gap-3 bg-card p-2 px-3 rounded-2xl border shadow-xs">
                <div className="text-right">
                  <span className="text-xs font-bold text-foreground block">
                    {isBn
                      ? `${toBnNum(completedInSelected)}/${toBnNum(selectedSessions.length)} সম্পন্ন`
                      : `${completedInSelected}/${selectedSessions.length} Completed`}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {Math.round((completedInSelected / selectedSessions.length) * 100)}%
                  </span>
                </div>
                <div className="w-20 sm:w-28 h-2.5 rounded-full bg-muted overflow-hidden border">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${(completedInSelected / selectedSessions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* List of Sessions for Selected Date */}
          {selectedSessions.length === 0 ? (
            <Card className="rounded-3xl border border-dashed p-8 sm:p-12 text-center bg-muted/10 space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 shadow-xs">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {isBn ? 'এই দিনে কোনো ক্লাস নির্ধারিত নেই' : 'No classes scheduled for this day'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                {isBn
                  ? 'এই বারে কোনো স্কুল পিরিয়ড বা প্রাইভেট ক্লাস নেই। চাইলে নিচের বাটনে ক্লিক করে নতুন রুটিন যোগ করতে পারেন।'
                  : 'There are no sessions scheduled for this day. You can add a period or study routine below.'}
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => {
                    setForm((prev) => ({ ...prev, weekdays: [selectedDateObj.getDay()] }));
                    setCreateModalOpen(true);
                  }}
                  className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground font-bold rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {isBn
                      ? `${WEEKDAYS[selectedDateObj.getDay()].bn} বারে রুটিন যোগ করুন`
                      : `Add routine for ${WEEKDAYS[selectedDateObj.getDay()].en}`}
                  </span>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {selectedSessions.map((session: any, idx: number) => {
                const isCompleted = isSessionCompleted(session);
                const isRescheduled = session.status === 'rescheduled';

                return (
                  <Card
                    key={session.routineId || idx}
                    className={`rounded-2xl sm:rounded-3xl border transition-all overflow-hidden ${
                      isCompleted
                        ? 'bg-emerald-500/[0.04] border-emerald-500/30 shadow-xs'
                        : isRescheduled
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'bg-card hover:border-primary/40 shadow-xs'
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Period, Time, Subject, Details */}
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Period Badge */}
                          <Badge className="bg-primary/15 text-primary border-primary/30 font-bold text-[11px] px-2.5 py-0.5">
                            {session.periodName ||
                              (isBn ? `${toBnNum(idx + 1)}ম পিরিয়ড` : `Period ${idx + 1}`)}
                          </Badge>

                          {/* Time Badge */}
                          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted/40 px-2.5 py-0.5 rounded-lg border">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>{session.startTime}</span>
                            <span>•</span>
                            <span>
                              {isBn
                                ? `${toBnNum(session.durationMin || 45)} মিনিট`
                                : `${session.durationMin || 45}m`}
                            </span>
                          </div>

                          {/* Source Badge */}
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              session.source === 'school'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : session.source === 'college'
                                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                                : session.source === 'tuition'
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
                                : 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30'
                            }`}
                          >
                            {session.source === 'school'
                              ? isBn ? '🏫 স্কুল' : 'School'
                              : session.source === 'college'
                              ? isBn ? '🏛️ কলেজ' : 'College'
                              : session.source === 'tuition'
                              ? isBn ? '📚 টিউশন/কোচিং' : 'Tuition'
                              : isBn ? '📖 সেলফ-স্টাডি' : 'Self-Study'}
                          </Badge>

                          {/* Rescheduled Badge */}
                          {isRescheduled && (
                            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                              {isBn ? 'পুনর্নির্ধারিত' : 'Rescheduled'}
                            </Badge>
                          )}
                        </div>

                        {/* Title & Teacher */}
                        <div>
                          <h3
                            className={`text-base sm:text-lg font-extrabold tracking-tight ${
                              isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {session.name}
                          </h3>

                          {(session.teacher || session.room) && (
                            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                              {session.teacher && (
                                <span className="flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5 text-primary/70" />
                                  <span>{session.teacher}</span>
                                </span>
                              )}
                              {session.room && (
                                <span className="text-muted-foreground/70">
                                  • {isBn ? `কক্ষ: ${session.room}` : `Room: ${session.room}`}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions (Mark Complete, Reschedule) */}
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                        <Button
                          size="sm"
                          variant={isCompleted ? 'outline' : 'default'}
                          onClick={() => toggleSessionCompletion(session)}
                          className={`text-xs h-9 px-3.5 rounded-xl font-bold gap-1.5 transition-all ${
                            isCompleted
                              ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20'
                              : 'bg-primary text-primary-foreground shadow-xs'
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 stroke-[3] ${isCompleted ? 'text-emerald-600' : ''}`} />
                          <span>{isCompleted ? (isBn ? 'সম্পন্ন ✓' : 'Completed ✓') : (isBn ? 'সম্পন্ন করুন' : 'Mark Done')}</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRescheduleModal(session)}
                          className="text-xs h-9 px-3 rounded-xl gap-1 text-muted-foreground hover:text-foreground"
                          title={isBn ? 'সেশন পুনর্নির্ধারণ' : 'Reschedule'}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isBn ? 'পুনর্নির্ধারণ' : 'Reschedule'}</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* RECURRING ROUTINES MANAGEMENT (Collapsible Section)       */}
        {/* ========================================================= */}
        <details className="group rounded-3xl border bg-card shadow-xs overflow-hidden transition-all">
          <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer font-bold text-sm sm:text-base text-foreground select-none hover:bg-muted/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span>{isBn ? 'সকল নিয়মিত রুটিনসমূহ পরিচালনা' : 'Manage All Recurring Routines'}</span>
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  ({routines.length} {isBn ? 'টি রুটিন' : 'routines configured'})
                </span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>

          <div className="p-4 sm:p-5 pt-0 border-t space-y-3">
            <p className="text-xs text-muted-foreground">
              {isBn
                ? 'সপ্তাহভিত্তিক নিয়মিত পিরিয়ড ও প্রাইভেট ক্লাসের রুলস। এখান থেকে নতুন রুটিন যোগ বা মুছতে পারেন।'
                : 'Configured recurring routine templates that automatically generate daily study schedules.'}
            </p>

            <div className="space-y-2.5">
              {routines.map((r: any) => (
                <div
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border bg-card hover:bg-muted/20 transition-colors gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground truncate">{r.name}</span>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {r.source === 'school'
                          ? isBn ? 'স্কুল' : 'School'
                          : r.source === 'college'
                          ? isBn ? 'কলেজ' : 'College'
                          : r.source === 'tuition'
                          ? isBn ? 'টিউশন' : 'Tuition'
                          : isBn ? 'সেলফ-স্টাডি' : 'Self-study'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {r.startTime} ({r.durationMin || 45}m)
                      </span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        {WEEKDAYS.map((w) => {
                          const active = Array.isArray(r.weekdays) && r.weekdays.includes(w.index);
                          return (
                            <span
                              key={w.index}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                active
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground/40 bg-muted/30'
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
                      className="text-xs h-8 gap-1 border-primary/30 text-primary hover:bg-primary/5 rounded-xl"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{isBn ? 'পুনর্নির্ধারণ' : 'Reschedule'}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteRoutine(r.id)}
                      className="text-xs h-8 px-2 text-muted-foreground hover:text-destructive rounded-xl"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>

      {/* ========================================================= */}
      {/* CREATE ROUTINE MODAL                                      */}
      {/* ========================================================= */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t('schedule.createRoutine', 'Add Recurring Routine')}
        description={
          institutionType === 'college'
            ? isBn
              ? 'কলেজ ক্লাস ও প্রাইভেট টিউশনের রুটিন যুক্ত করুন।'
              : 'Set up recurring days and times for college lectures or private tuition.'
            : institutionType === 'admission'
            ? isBn
              ? 'কোচিং, টেস্ট ও সেলফ-স্টাডির রুটিন যুক্ত করুন।'
              : 'Set up recurring days and times for admission coaching or self-study.'
            : isBn
            ? 'স্কুল ক্লাস ও প্রাইভেট টিউশনের রুটিন যুক্ত করুন।'
            : 'Set up recurring days and times for school periods or private tuition.'
        }
      >
        <form onSubmit={handleCreateRoutine} className="space-y-4 pt-1">
          <div>
            <Label className="text-xs font-semibold">{t('schedule.routineName', 'Routine Name')}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={isBn ? 'যেমন: গণিত প্রাইভেট — রহিম স্যার' : 'e.g. Math Tuition – Rahim Sir'}
              required
              className="mt-1 rounded-xl"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">{t('schedule.source', 'Learning Source')}</Label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="h-10 w-full border rounded-xl px-3 bg-background text-sm mt-1"
              >
                {institutionType === 'school' && <option value="school">{isBn ? 'স্কুল' : 'School'}</option>}
                {institutionType === 'college' && <option value="college">{isBn ? 'কলেজ' : 'College'}</option>}
                <option value="tuition">
                  {institutionType === 'admission'
                    ? isBn
                      ? 'কোচিং / প্রাইভেট'
                      : 'Coaching / Tuition'
                    : isBn
                    ? 'প্রাইভেট / কোচিং'
                    : 'Tuition / Private'}
                </option>
                <option value="self_study">
                  {institutionType === 'admission'
                    ? isBn
                      ? 'সেলফ-স্টাডি ও মডেল টেস্ট'
                      : 'Self-Study & Mock Tests'
                    : isBn
                    ? 'সেলফ-স্টাডি'
                    : 'Self-Study'}
                </option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold">{t('schedule.startTime', 'Start Time')}</Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
                className="mt-1 rounded-xl"
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
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {isBn ? w.bn : w.en}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">{t('schedule.duration', 'Duration (mins)')}</Label>
              <Input
                type="number"
                value={form.durationMin}
                onChange={(e) => setForm({ ...form, durationMin: parseInt(e.target.value) || 45 })}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Starts From</Label>
              <Input
                type="date"
                value={form.startsOn}
                onChange={(e) => setForm({ ...form, startsOn: e.target.value })}
                className="mt-1 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)} className="rounded-xl">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="rounded-xl font-bold">
              {loading ? t('common.loading', 'Saving...') : t('common.save', 'Create Routine')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* RESCHEDULE MODAL                                          */}
      {/* ========================================================= */}
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
              className="mt-1 rounded-xl"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">New Date</Label>
              <Input
                type="date"
                value={rescheduleForm.newDate}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, newDate: e.target.value })}
                required
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">New Time</Label>
              <Input
                type="time"
                value={rescheduleForm.newStartTime}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, newStartTime: e.target.value })}
                required
                className="mt-1 rounded-xl"
              />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            The session will appear on your child&apos;s schedule for the newly selected date.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setRescheduleModalOpen(false)} className="rounded-xl">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="rounded-xl font-bold">
              {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
