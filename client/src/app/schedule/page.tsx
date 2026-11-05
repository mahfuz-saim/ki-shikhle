'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n, type Translator } from '@/lib/i18n-context';
import { getInstitutionType, getInstitutionInfo } from '@/lib/institution';
import { api } from '@/lib/api';
import { demoProfileOf, type DemoProfile } from '@/lib/child-scope';
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
  AlertCircle,
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

/**
 * The full date, in the locale's format.
 *
 * `t` is passed in rather than read from `useI18n()`: this is a module-level
 * function, and a hook cannot be called outside a component.
 */
function formatFullDate(date: Date, isBn: boolean, t: Translator): string {
  const dayObj = WEEKDAYS[date.getDay()];
  const dayName = isBn ? dayObj.fullBn : dayObj.fullEn;
  const monthName = isBn ? BN_MONTHS[date.getMonth()] : EN_MONTHS[date.getMonth()];
  const dateNum = isBn ? toBnNum(date.getDate()) : date.getDate();
  const yearNum = isBn ? toBnNum(date.getFullYear()) : date.getFullYear();

  return t(
    'schedule.full_date',
    { p0: dayName, p1: dateNum, p2: monthName, p3: yearNum },
    `${dayName}, ${monthName} ${dateNum}, ${yearNum}`
  );
}

/**
 * The key that identifies one scheduled session.
 *
 * It must match the server's occurrence key — `(date, startTime)` — because the
 * server stores the completion under exactly that pair (it is the unique index
 * on `routine_completions`). Using a different key here would make the page
 * and the server disagree about what is completed.
 */
function completionKey(date: string, startTime: string): string {
  return `${date}_${startTime}`;
}

/**
 * The demo timetable for a child profile.
 *
 * Selected by the server-assigned `demoProfile` — the ids moved to UUIDs, so
 * `childId === 'demo-child-2'` never matched and every demo child saw Rahim's
 * timetable.
 *
 * `t` is passed in rather than read from `useI18n()`: this is a module-level
 * function, and a hook cannot be called outside a component.
 */
function getDefaultRoutines(profile: DemoProfile | null, isBn: boolean, t: Translator) {
  if (profile === 'tasnim') {
    return [
      { id: 'r-t-p1', name: t('schedule.text'), periodName: '১ম পিরিয়ড', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '09:30', durationMin: 45, subject: 'Bangla', teacher: 'ফরিদা ইয়াসমিন ম্যাডাম' },
      { id: 'r-t-p2', name: t('schedule.text_2'), periodName: '২য় পিরিয়ড', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '10:15', durationMin: 45, subject: 'English', teacher: 'সায়মা সুলতানা ম্যাডাম' },
      { id: 'r-t-p3', name: t('schedule.text_3'), periodName: '৩য় পিরিয়ড', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '11:15', durationMin: 45, subject: 'Mathematics', teacher: 'তানিয়া রহমান ম্যাডাম' },
      { id: 'r-t1', name: t('schedule.text_4'), periodName: 'প্রাইভেট', source: 'tuition', weekdays: [0, 2, 4], startTime: '16:00', durationMin: 60, subject: 'Mathematics', teacher: 'রোকেয়া আপা' },
      { id: 'r-t2', name: t('schedule.text_5'), periodName: 'প্রাইভেট', source: 'tuition', weekdays: [1, 3], startTime: '17:30', durationMin: 45, subject: 'English', teacher: 'শরীফ স্যার' },
      { id: 'r-t3', name: t('schedule.text_6'), periodName: 'সেলফ স্টাডি', source: 'self_study', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '18:30', durationMin: 75, subject: 'Self-Study' },
    ];
  }
  if (profile === 'fahim') {
    return [
      { id: 'r-f-c1', name: t('schedule.text_7'), periodName: '১ম পিরিয়ড', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '08:30', durationMin: 50, subject: 'Physics', teacher: 'ড. মাহবুব স্যার' },
      { id: 'r-f-c2', name: t('schedule.text_8'), periodName: '২য় পিরিয়ড', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '09:20', durationMin: 50, subject: 'Chemistry', teacher: 'তাহমিনা ম্যাডাম' },
      { id: 'r-f-c3', name: t('schedule.text_9'), periodName: '৩য় পিরিয়ড', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '10:10', durationMin: 50, subject: 'Higher Mathematics', teacher: 'এনামুল স্যার' },
      { id: 'r-f1', name: t('schedule.text_10'), periodName: 'কোচিং', source: 'tuition', weekdays: [0, 2, 4], startTime: '16:30', durationMin: 75, subject: 'Physics', teacher: 'আহমেদ স্যার' },
      { id: 'r-f2', name: t('schedule.text_11'), periodName: 'প্রাইভেট', source: 'tuition', weekdays: [1, 3], startTime: '17:00', durationMin: 60, subject: 'Chemistry', teacher: 'কামরুল স্যার' },
      { id: 'r-f3', name: t('schedule.text_12'), periodName: 'সেলফ স্টাডি', source: 'self_study', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '20:30', durationMin: 60, subject: 'Higher Mathematics' },
    ];
  }
  return [
    { id: 'r-r-p1', name: t('schedule.text_13'), periodName: '১ম পিরিয়ড', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '09:00', durationMin: 45, subject: 'Bangla', teacher: 'কবির আহমেদ স্যার' },
    { id: 'r-r-p2', name: t('schedule.text_14'), periodName: '২য় পিরিয়ড', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '09:45', durationMin: 45, subject: 'English', teacher: 'নাসরিন সুলতানা ম্যাডাম' },
    { id: 'r-r-p3', name: t('schedule.text_15'), periodName: '৩য় পিরিয়ড', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '10:30', durationMin: 45, subject: 'Mathematics', teacher: 'আবুল হোসেন স্যার' },
    { id: 'r1', name: t('schedule.text_16'), periodName: 'প্রাইভেট', source: 'tuition', weekdays: [0, 2, 4], startTime: '16:00', durationMin: 90, subject: 'Mathematics', teacher: 'রহিম স্যার' },
    { id: 'r2', name: t('schedule.text_17'), periodName: 'কোচিং', source: 'tuition', weekdays: [1, 3], startTime: '17:30', durationMin: 60, subject: 'Science', teacher: 'আহমেদ স্যার' },
    { id: 'r3', name: t('schedule.text_18'), periodName: 'সেলফ স্টাডি', source: 'self_study', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '20:00', durationMin: 90, subject: 'Self-Study' },
  ];
}

export default function SchedulePage() {
  const { activeChild, setActiveChild, childrenList } = useAuth();
  const { t, isBn } = useI18n();

  // No hardcoded fallback id: an account with no children gets no child, and
  // the page renders its empty state instead of the demo tenant's data.
  const childId = activeChild?.id || childrenList[0]?.id || null;
  const currentChild = activeChild || childrenList[0] || null;
  const demoProfile = demoProfileOf(currentChild);
  const isDemoChild = demoProfile !== null;
  const institutionType = getInstitutionType(currentChild?.grade);
  const instInfo = getInstitutionInfo(institutionType, t);

  const [routines, setRoutines] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any>(null);
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  /**
   * The locale is read through a ref rather than as an effect dependency.
   *
   * `isBn` was a dependency of `loadRoutines`, so switching the UI language
   * re-fetched the timetable. The locale only affects the *copy* of the demo
   * fixture, so it is read at call time.
   *
   * `t` is held the same way: it is a new function whenever the locale changes, and
   * putting it in the dependency list would re-fetch on every language toggle.
   */
  const isBnRef = useRef(isBn);
  const tRef = useRef(t);
  useEffect(() => {
    isBnRef.current = isBn;
    tRef.current = t;
  }, [isBn, t]);

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
  const [errorMsg, setErrorMsg] = useState('');

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
        if (!childId) {
          setCompletedMap({});
          return;
        }
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
    if (typeof window !== 'undefined' && childId) {
      try {
        localStorage.setItem(`ki_completed_schedule_${childId}`, JSON.stringify(newMap));
      } catch {}
    }
  };

  /**
   * Load the completions the server knows about.
   *
   * The schedule page used to keep completions in `localStorage` only, so the
   * server never learned which sessions a child actually finished and the
   * parent's dashboard could not reflect it. The server is now the source of
   * truth; `localStorage` is only a cache for the offline case.
   */
  const loadCompletions = useCallback(async () => {
    if (!childId) {
      setCompletedMap({});
      return;
    }
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 60)
      .toISOString()
      .slice(0, 10);
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 60)
      .toISOString()
      .slice(0, 10);

    try {
      const r = await api.get(`/children/${childId}/routines/completions?from=${from}&to=${to}`);
      const rows: any[] = r.data?.data || [];
      const map: Record<string, boolean> = {};
      for (const row of rows) {
        if (row.completed) map[completionKey(row.date, row.startTime)] = true;
      }
      setCompletedMap(map);
      // Keep the offline cache in step with the server.
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`ki_completed_schedule_${childId}`, JSON.stringify(map));
        } catch {}
      }
    } catch {
      // The server is unreachable — the `localStorage` cache stays in place.
    }
  }, [childId, today]);

  // Load routines from API
  const loadRoutines = useCallback(async () => {
    if (!childId) {
      setRoutines([]);
      return;
    }
    try {
      const r = await api.get(`/children/${childId}/routines`);
      const list = r.data?.data || [];
      if (list && list.length > 0) {
        setRoutines(list);
      } else {
        // Only the demo tenant has a curated timetable fixture.
        setRoutines(isDemoChild ? getDefaultRoutines(demoProfile, isBnRef.current, tRef.current) : []);
      }
    } catch {
      setRoutines(isDemoChild ? getDefaultRoutines(demoProfile, isBnRef.current, tRef.current) : []);
    }
    // `isBn` and `t` are deliberately NOT dependencies — they only affect the copy of
    // the demo fixture, and including them re-fetched the timetable on every locale
    // toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, isDemoChild, demoProfile]);

  // Load computed schedule from API
  const loadSchedule = useCallback(async () => {
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14).toISOString().slice(0, 10);
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 28).toISOString().slice(0, 10);

    if (!childId) {
      setSchedule(null);
      return;
    }
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
    loadCompletions();
  }, [loadRoutines, loadSchedule, loadCompletions]);

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

  const isSessionCompleted = useCallback(
    (session: any) => {
      const key = completionKey(session.date, session.startTime);
      return completedMap[key] === true || session.status === 'completed';
    },
    [completedMap]
  );

  const toggleSessionCompletion = async (session: any) => {
    const key = completionKey(session.date, session.startTime);
    const next = completedMap[key] !== true;
    const optimistic = { ...completedMap, [key]: next };

    // Optimistic update, reverted if the server rejects it.
    saveCompletedMap(optimistic);

    if (childId) {
      try {
        await api.post(`/children/${childId}/routines/completions`, {
          date: session.date,
          startTime: session.startTime,
          routineId: session.routineId || null,
          completed: next,
        });
      } catch {
        // The server is the source of truth — put the checkbox back.
        saveCompletedMap(completedMap);
        setMsg(
          t('schedule.text_19')
        );
        return;
      }
    }

    // If toggling on today and this completes all of today's classes
    if (session.date === todayStr && next) {
      const todaySessions = getSessionsForDate(todayStr);
      const isNowAllDone =
        todaySessions.length > 0 &&
        todaySessions.every(
          (s) => optimistic[completionKey(s.date, s.startTime)] === true || s.status === 'completed'
        );

      if (isNowAllDone) {
        setMsg(
          t('schedule.all_of_today_s_schedule_is_now_complete_great_jo')
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
      setMsg(t('schedule.text_20'));
    } catch (e: any) {
      // The routine was NOT created. Adding a local copy put a class in the
      // timetable that the server had never heard of.
      setErrorMsg(e?.response?.data?.error?.message || 'The routine could not be created.');
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
      setMsg(t('schedule.text_21'));
    } catch (e: any) {
      // The reschedule was NOT recorded. Closing the modal and saying nothing left
      // the parent believing the class had moved.
      setErrorMsg(e?.response?.data?.error?.message || 'The class could not be rescheduled.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    if (!confirm(t('schedule.text_22'))) return;
    try {
      await api.delete(`/routines/${id}`);
      loadRoutines();
      loadSchedule();
    } catch (e: any) {
      // Removing it from the list after a failed delete hid a routine that still
      // existed on the server.
      setErrorMsg(e?.response?.data?.error?.message || 'The routine could not be deleted.');
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
              <span>{t('schedule.add_routine', 'Add Routine')}</span>
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
              {t('common.dismiss')}
            </button>
          </div>
        )}

        {/* Error Banner — a failed request is never shown as a success. */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </span>
            <button onClick={() => setErrorMsg('')} className="underline text-[11px] font-bold">
              {t('common.dismiss')}
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
                    {t('schedule.week_of_month', { p0: isBn ? BN_MONTHS[weekDates[3].getMonth()] : EN_MONTHS[weekDates[3].getMonth()], p1: isBn ? toBnNum(weekDates[3].getFullYear()) : weekDates[3].getFullYear() }, `${EN_MONTHS[weekDates[3].getMonth()]} ${weekDates[3].getFullYear()}`)}
                  </h2>
                  {weekOffset !== 0 && (
                    <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground">
                      {weekOffset > 0
                        ? t('schedule.wk', { p0: isBn ? toBnNum(weekOffset) : weekOffset }, `+${weekOffset} wk`)
                        : t('schedule.wk_2', { p0: isBn ? toBnNum(weekOffset) : weekOffset }, `${weekOffset} wk`)}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {t('schedule.week_date_range', { p0: isBn ? toBnNum(weekDates[0].getDate()) : EN_MONTHS[weekDates[0].getMonth()].slice(0, 3), p1: isBn ? BN_MONTHS[weekDates[0].getMonth()] : weekDates[0].getDate(), p2: isBn ? toBnNum(
                        weekDates[6].getDate()
                      ) : EN_MONTHS[
                        weekDates[6].getMonth()
                      ].slice(0, 3), p3: isBn ? BN_MONTHS[weekDates[6].getMonth()] : weekDates[6].getDate() }, `${EN_MONTHS[weekDates[0].getMonth()].slice(0, 3)} ${weekDates[0].getDate()} – ${EN_MONTHS[
                        weekDates[6].getMonth()
                      ].slice(0, 3)} ${weekDates[6].getDate()}`)}
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
                title={t('schedule.text_23')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                variant={selectedDate === todayStr ? 'default' : 'outline'}
                size="sm"
                onClick={goToToday}
                className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 transition-all"
              >
                <span>{t('schedule.text_24')}</span>
                {selectedDate !== todayStr && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset((prev) => prev + 1)}
                className="h-8 w-8 p-0 rounded-xl"
                title={t('schedule.text_25')}
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
                  title={t('schedule.text_26')}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <CalendarCheck className="w-3.5 h-3.5 text-primary" />
                  <span className="hidden sm:inline font-semibold">{t('schedule.text_27')}</span>
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
                      {t('schedule.text_24')}
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
                      ? t('schedule.text_28')
                      : daySessions.length > 0
                      ? t('schedule.cls', { p0: isBn ? toBnNum(daySessions.length) : daySessions.length }, `${daySessions.length} cls`)
                      : t('schedule.text_29')}
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
                  {t('schedule.today_s_schedule_is_100_completed_showing_tomorr')}
                </p>
                <p className="text-xs opacity-80 mt-0.5">
                  {t('schedule.text_30')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectDate(todayStr)}
              className="h-8 text-xs font-bold border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-900 dark:text-emerald-100 shrink-0"
            >
              {t('schedule.view_today_s_routine')}
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
                  {formatFullDate(selectedDateObj, isBn, t)}
                </h2>
                {selectedDate === todayStr && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] font-extrabold px-2 py-0.5">
                    {t('schedule.today_s_routine')}
                  </Badge>
                )}
                {selectedDate === tomorrowStr && (
                  <Badge className="bg-amber-500 text-black text-[10px] font-extrabold px-2 py-0.5">
                    {t('schedule.tomorrow_s_routine')}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {selectedSessions.length > 0
                  ? t('schedule.session_s_scheduled_approx_mins_total', { p0: isBn ? toBnNum(selectedSessions.length) : selectedSessions.length, p1: isBn ? toBnNum(
                        totalMinutesInSelected
                      ) : totalMinutesInSelected }, `${selectedSessions.length} session(s) scheduled • approx ${totalMinutesInSelected} mins total`)
                  : t('schedule.text_31')}
              </p>
            </div>

            {selectedSessions.length > 0 && (
              <div className="flex items-center gap-3 bg-card p-2 px-3 rounded-2xl border shadow-xs">
                <div className="text-right">
                  <span className="text-xs font-bold text-foreground block">
                    {t('schedule.completed', { p0: isBn ? toBnNum(completedInSelected) : completedInSelected, p1: isBn ? toBnNum(selectedSessions.length) : selectedSessions.length }, `${completedInSelected}/${selectedSessions.length} Completed`)}
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
                {t('schedule.text_32')}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                {t('schedule.text_33')}
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
                    {t('schedule.add_routine_for', { p0: isBn ? WEEKDAYS[selectedDateObj.getDay()].bn : WEEKDAYS[selectedDateObj.getDay()].en }, `Add routine for ${WEEKDAYS[selectedDateObj.getDay()].en}`)}
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
                              (t('schedule.period', { p0: isBn ? toBnNum(idx + 1) : idx + 1 }, `Period ${idx + 1}`))}
                          </Badge>

                          {/* Time Badge */}
                          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted/40 px-2.5 py-0.5 rounded-lg border">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>{session.startTime}</span>
                            <span>•</span>
                            <span>
                              {t('schedule.m', { p0: isBn ? toBnNum(session.durationMin || 45) : session.durationMin || 45 }, `${session.durationMin || 45}m`)}
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
                              ? t('schedule.text_34')
                              : session.source === 'college'
                              ? t('schedule.text_35')
                              : session.source === 'tuition'
                              ? t('schedule.text_36')
                              : t('schedule.text_37')}
                          </Badge>

                          {/* Rescheduled Badge */}
                          {isRescheduled && (
                            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                              {t('schedule.text_38')}
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
                                  • {t('schedule.room', { p0: session.room }, `Room: ${session.room}`)}
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
                          <span>{isCompleted ? (t('schedule.text_39')) : (t('schedule.text_40'))}</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRescheduleModal(session)}
                          className="text-xs h-9 px-3 rounded-xl gap-1 text-muted-foreground hover:text-foreground"
                          title={t('schedule.text_41')}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t('schedule.text_42')}</span>
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
                <span>{t('schedule.text_43')}</span>
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  ({routines.length} {t('schedule.text_44')})
                </span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>

          <div className="p-4 sm:p-5 pt-0 border-t space-y-3">
            <p className="text-xs text-muted-foreground">
              {t('schedule.text_45')}
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
                          ? t('schedule.text_46')
                          : r.source === 'college'
                          ? t('schedule.text_47')
                          : r.source === 'tuition'
                          ? t('schedule.text_48')
                          : t('schedule.text_49')}
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
                      <span>{t('schedule.text_42')}</span>
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
            ? t('schedule.text_50')
            : institutionType === 'admission'
            ? t('schedule.text_51')
            : t('schedule.text_52')
        }
      >
        <form onSubmit={handleCreateRoutine} className="space-y-4 pt-1">
          <div>
            <Label className="text-xs font-semibold">{t('schedule.routineName', 'Routine Name')}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('schedule.text_53')}
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
                {institutionType === 'school' && <option value="school">{t('schedule.text_46')}</option>}
                {institutionType === 'college' && <option value="college">{t('schedule.text_47')}</option>}
                <option value="tuition">
                  {institutionType === 'admission'
                    ? t('schedule.text_54')
                    : t('schedule.text_55')}
                </option>
                <option value="self_study">
                  {institutionType === 'admission'
                    ? t('schedule.text_56')
                    : t('schedule.text_49')}
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
              {loading ? t('common.saving', 'Saving...') : t('schedule.create_routine', 'Create Routine')}
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
