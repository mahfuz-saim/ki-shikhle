'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { KidShell } from '@/components/layout/kid-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useChildScope } from '@/components/auth/use-child-scope';
import { useI18n } from '@/lib/i18n-context';
import { getInstitutionType, getInstitutionInfo } from '@/lib/institution';
import { api } from '@/lib/api';
import { schoolDate, loadClassLogs, findClassLog, findLogQuiz } from '@/lib/class-logs';
import { StudyTimeChart } from '@/components/charts/study-time-chart';
import {
  RefreshCw,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  CalendarCheck,
  Flame,
  School,
  Building2,
  UserCheck,
  Edit3,
  Mic,
  MicOff,
  Volume2,
  ListChecks,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Award,
  Layers,
  BookMarked,
  Filter,
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

function toBnNum(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
}

function safeString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val.name || val.title || val.subject || JSON.stringify(val);
  }
  return String(val);
}

function parseWeekdays(val: any): number[] {
  if (Array.isArray(val)) {
    return val.map((x) => Number(x)).filter((x) => !isNaN(x));
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.map((x) => Number(x)).filter((x) => !isNaN(x));
      }
    } catch {
      return val.split(',').map((x) => Number(x.trim())).filter((x) => !isNaN(x));
    }
  }
  return [];
}

function unpackList(resData: any): any[] {
  if (!resData) return [];
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData.data)) return resData.data;
  if (Array.isArray(resData.data?.data)) return resData.data.data;
  if (Array.isArray(resData.items)) return resData.items;
  return [];
}

// Subject color helpers for vibrant school routine tags
const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  bangla: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/30', badge: 'bg-emerald-500' },
  english: { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500/30', badge: 'bg-blue-500' },
  mathematics: { bg: 'bg-indigo-500/10', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-500/30', badge: 'bg-indigo-500' },
  math: { bg: 'bg-indigo-500/10', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-500/30', badge: 'bg-indigo-500' },
  science: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-500/30', badge: 'bg-amber-500' },
  physics: { bg: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-500/30', badge: 'bg-violet-500' },
  chemistry: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-500/30', badge: 'bg-rose-500' },
  biology: { bg: 'bg-teal-500/10', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-500/30', badge: 'bg-teal-500' },
  ict: { bg: 'bg-cyan-500/10', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-500/30', badge: 'bg-cyan-500' },
  bgs: { bg: 'bg-orange-500/10', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-500/30', badge: 'bg-orange-500' },
};

function getSubjectColor(subjectName: any = '') {
  const lower = safeString(subjectName).toLowerCase();
  for (const [key, val] of Object.entries(SUBJECT_COLORS)) {
    if (lower.includes(key)) return val;
  }
  return { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30', badge: 'bg-primary' };
}

export default function KidSchedulePage() {
  const { activeChild, user } = useAuth();
  const { t, isBn } = useI18n();

  const studentGrade = user?.grade || activeChild?.grade || 'Class 8';
  const institutionType = getInstitutionType(studentGrade);
  const instInfo = getInstitutionInfo(institutionType, t);

  // The child whose schedule this is, and the demo dataset that applies (if any).
  const { childId, isTasnim, isFahim, isDemoChild } = useChildScope();
  // A college-grade student is treated like Fahim for the preset routines, even when
  // they are not a demo child — the grade is the real signal there.
  const isCollegeTrack =
    isFahim || studentGrade.includes('11') || studentGrade.includes('12') || institutionType === 'college';

  const [routines, setRoutines] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [occurrences, setOccurrences] = useState<any[] | null>(null);
  const [scheduleRevision, setScheduleRevision] = useState(0);
  const [rescheduleClass, setRescheduleClass] = useState<any>(null);
  const [rescheduleForm, setRescheduleForm] = useState({ newDate: '', newStartTime: '' });
  const [studyTime, setStudyTime] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected Weekday (0=Sun .. 6=Sat) & Selected Date
  const today = new Date();
  const [selectedWeekday, setSelectedWeekday] = useState<number>(today.getDay());
  const [selectedDate, setSelectedDate] = useState<string>(schoolDate(today));

  // Category filter: 'all' | 'school' | 'tuition'
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'school' | 'tuition'>('all');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Currently active class being logged
  const [activeRoutineForLog, setActiveRoutineForLog] = useState<any>(null);
  const [existingEntryForLog, setExistingEntryForLog] = useState<any>(null);

  // Class Log Form state
  const [logForm, setLogForm] = useState({
    topicsText: '',
    homeworkAssigned: '',
    confidence: 4,
    notes: '',
  });

  // Speech Recognition state inside Class Log Modal
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Create Routine Form state
  const [routineForm, setRoutineForm] = useState({
    name: '',
    periodName: '১ম পিরিয়ড',
    subject: 'Mathematics',
    teacher: '',
    room: '',
    source: 'school',
    weekdays: [0, 1, 2, 3, 4], // Sun to Thu
    startTime: '09:00',
    durationMin: 45,
    startsOn: new Date().toISOString().slice(0, 10),
  });

  // Quick routine presets for easy 1-click routine addition
  //
  // These are **suggestions**, chosen by the child's grade rather than by their name:
  // a college-track student gets the college routine, a primary-school student gets
  // the primary one, everyone else gets the middle-school one. The old code branched
  // on `isFahim` / `isTasnim` — the two demo children — so every real child was given
  // the demo student's preset list.
  const isPrimaryTrack = /Class\s*[45](|$)/.test(studentGrade);
  const routinePresets = isCollegeTrack
    ? [
        { name: t('childSchedule.text'), periodName: '১ম পিরিয়ড', subject: 'Physics 1st Paper', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '08:30', durationMin: 50 },
        { name: t('childSchedule.text_2'), periodName: '২য় পিরিয়ড', subject: 'Chemistry 1st Paper', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '09:20', durationMin: 50 },
        { name: t('childSchedule.text_3'), periodName: 'কোচিং', subject: 'Physics 1st Paper', source: 'tuition', weekdays: [0, 2, 4], startTime: '16:30', durationMin: 75 },
        { name: t('childSchedule.text_4'), periodName: 'প্রাইভেট', subject: 'Chemistry 1st Paper', source: 'tuition', weekdays: [1, 3], startTime: '17:00', durationMin: 60 },
        { name: t('childSchedule.text_5'), periodName: 'সেলফ স্টাডি', subject: 'Higher Mathematics', source: 'self_study', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '20:30', durationMin: 60 },
      ]
    : isPrimaryTrack
    ? [
        { name: t('childSchedule.text_6'), periodName: '১ম পিরিয়ড', subject: 'Bangla', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '09:30', durationMin: 45 },
        { name: t('childSchedule.text_7'), periodName: '২য় পিরিয়ড', subject: 'English', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '10:15', durationMin: 45 },
        { name: t('childSchedule.text_8'), periodName: 'প্রাইভেট', subject: 'Mathematics', source: 'tuition', weekdays: [0, 2, 4], startTime: '16:00', durationMin: 60 },
        { name: t('childSchedule.text_9'), periodName: 'প্রাইভেট', subject: 'English', source: 'tuition', weekdays: [1, 3], startTime: '17:30', durationMin: 45 },
        { name: t('childSchedule.text_10'), periodName: 'সেলফ স্টাডি', subject: 'General Science', source: 'self_study', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '18:30', durationMin: 75 },
      ]
    : [
        { name: t('childSchedule.text_11'), periodName: '১ম পিরিয়ড', subject: 'Bangla 1st Paper', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '09:00', durationMin: 45 },
        { name: t('childSchedule.text_12'), periodName: '২য় পিরিয়ড', subject: 'English 1st Paper', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '09:45', durationMin: 45 },
        { name: t('childSchedule.text_13'), periodName: 'প্রাইভেট', subject: 'Mathematics', source: 'tuition', weekdays: [0, 2, 5], startTime: '16:00', durationMin: 90 },
        { name: t('childSchedule.text_3'), periodName: 'কোচিং', subject: 'General Science', source: 'tuition', weekdays: [1, 3], startTime: '17:30', durationMin: 60 },
        { name: t('childSchedule.text_14'), periodName: '৬ষ্ঠ পিরিয়ড', subject: 'ICT', source: 'school', weekdays: [1, 4], startTime: '15:00', durationMin: 60 },
        { name: t('childSchedule.text_15'), periodName: 'সেলফ স্টাডি', subject: 'Mathematics', source: 'self_study', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '20:00', durationMin: 90 },
      ];

  const defaultStudyTimeList = isCollegeTrack
    ? [
        { date: 'Mon', college: 100, tuition: 75, self_study: 60 },
        { date: 'Tue', college: 100, tuition: 60, self_study: 60 },
        { date: 'Wed', college: 100, tuition: 75, self_study: 45 },
        { date: 'Thu', college: 100, tuition: 60, self_study: 60 },
        { date: 'Fri', college: 0, tuition: 90, self_study: 75 },
        { date: 'Sat', college: 0, tuition: 0, self_study: 90 },
        { date: 'Sun', college: 100, tuition: 75, self_study: 60 },
      ]
    : isPrimaryTrack
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
      ];

  const currentStudyTime = (Array.isArray(studyTime) && studyTime.length > 0) ? studyTime : defaultStudyTimeList;
  // The fallback totals are the demo dataset's numbers — they only apply to a demo
  // child. A real child's totals come from their own logged study time, and stay at
  // zero when there is none.
  const collegeMin = currentStudyTime.reduce((sum, d) => sum + (d?.college || 0), 0) || (isDemoChild && isCollegeTrack ? 500 : 0);
  const schoolMin =
    currentStudyTime.reduce((sum, d) => sum + (d?.school || 0), 0) ||
    (isDemoChild && institutionType === 'school' ? (isPrimaryTrack ? 220 : 380) : 0);
  const tuitionMin =
    currentStudyTime.reduce((sum, d) => sum + (d?.tuition || 0), 0) ||
    (isDemoChild ? (isCollegeTrack ? 435 : isPrimaryTrack ? 280 : 405) : 0);
  const selfStudyMin =
    currentStudyTime.reduce((sum, d) => sum + (d?.self_study || 0), 0) ||
    (isDemoChild ? (isCollegeTrack ? 450 : isPrimaryTrack ? 250 : 340) : 0);

  const collegeHours = Math.floor(collegeMin / 60);
  const collegeRemMin = collegeMin % 60;
  const schoolHours = Math.floor(schoolMin / 60);
  const schoolRemMin = schoolMin % 60;
  const tuitionHours = Math.floor(tuitionMin / 60);
  const tuitionRemMin = tuitionMin % 60;
  const selfStudyHours = Math.floor(selfStudyMin / 60);
  const selfStudyRemMin = selfStudyMin % 60;

  // Load routines, entries, and study-time from backend
  const loadData = async () => {
    // No child to load for — there is nothing to fetch and nothing to fake.
    if (!childId) {
      setRoutines([]);
      setEntries([]);
      setStudyTime([]);
      return;
    }
    try {
      const routinesRes = await api.get(`/children/${childId}/routines`);

      const routineList = unpackList(routinesRes?.data);
      if (routineList.length > 0) {
        setRoutines(routineList);
      } else if (isDemoChild) {
        // The default routine is a demo fixture — only shown to a demo child.
        setDefaultRoutines();
      } else {
        setRoutines([]);
      }
    } catch {
      if (isDemoChild) setDefaultRoutines();
      else {
        setRoutines([]);
        setErrorMsg('Could not load class routines. Please refresh.');
      }
    }

    // Load weekly study time
    api
      .get(`/children/${childId}/dashboard/study-time`)
      .then((r) => {
        const list = unpackList(r.data);
        if (list.length > 0) {
          setStudyTime(list);
        } else {
          setStudyTime(isDemoChild ? defaultStudyTimeList : []);
        }
      })
      .catch(() => setStudyTime(isDemoChild ? defaultStudyTimeList : []));
  };

  const setDefaultRoutines = () => {
    // Keyed on the grade track, not on the demo children's names — a real Class 11
    // student gets the college routine, a real Class 4 student gets the primary one.
    if (isCollegeTrack) {
      setRoutines([
        {
          id: 'rt-f1',
          name: t('childSchedule.text_16'),
          periodName: '১ম পিরিয়ড',
          subject: 'Physics 1st Paper',
          teacher: 'ড. মাহবুব স্যার',
          room: 'ল্যাব ৪',
          source: 'college',
          weekdays: [0, 1, 2, 3, 4],
          startTime: '08:30',
          durationMin: 50,
        },
        {
          id: 'rt-f2',
          name: t('childSchedule.text_17'),
          periodName: '২য় পিরিয়ড',
          subject: 'Chemistry 1st Paper',
          teacher: 'তাহমিনা ম্যাডাম',
          room: 'কেমিস্ট্রি ল্যাব',
          source: 'college',
          weekdays: [0, 1, 2, 3, 4],
          startTime: '09:20',
          durationMin: 50,
        },
        {
          id: 'rt-f3',
          name: t('childSchedule.text_18'),
          periodName: '৩য় পিরিয়ড',
          subject: 'Higher Mathematics',
          teacher: 'এনামুল স্যার',
          room: 'রুম ৪০১',
          source: 'college',
          weekdays: [0, 1, 2, 3, 4],
          startTime: '10:10',
          durationMin: 50,
        },
        {
          id: 'rt-f4',
          name: t('childSchedule.text_19'),
          periodName: '৪র্থ পিরিয়ড',
          subject: 'Biology 1st Paper',
          teacher: 'ফারহানা ম্যাডাম',
          room: 'বায়োলজি ল্যাব',
          source: 'college',
          weekdays: [0, 1, 2, 3, 4],
          startTime: '11:20',
          durationMin: 50,
        },
        {
          id: 'rt-f5',
          name: t('childSchedule.text_20'),
          periodName: '৫ম পিরিয়ড',
          subject: 'ICT',
          teacher: 'রাকিবুল হাসান',
          room: 'কম্পিউটার ল্যাব',
          source: 'college',
          weekdays: [0, 1, 2, 3, 4],
          startTime: '12:10',
          durationMin: 50,
        },
        {
          id: 'rt-f-t1',
          name: t('childSchedule.text_21'),
          periodName: 'কোচিং',
          subject: 'Physics 1st Paper',
          teacher: 'আহমেদ স্যার',
          room: 'ইউসিসি ব্রাঞ্চ',
          source: 'tuition',
          weekdays: [0, 2, 4],
          startTime: '16:30',
          durationMin: 75,
        },
        {
          id: 'rt-f-t2',
          name: t('childSchedule.text_22'),
          periodName: 'প্রাইভেট',
          subject: 'Chemistry 1st Paper',
          teacher: 'শফিক স্যার',
          room: 'টিউটর হোম',
          source: 'tuition',
          weekdays: [1, 3],
          startTime: '17:00',
          durationMin: 60,
        },
        {
          id: 'rt-f-s1',
          name: t('childSchedule.text_5'),
          periodName: 'সেলফ স্টাডি',
          subject: 'Higher Mathematics',
          teacher: 'নিজে',
          room: 'পড়ার টেবিল',
          source: 'self_study',
          weekdays: [0, 1, 2, 3, 4, 5, 6],
          startTime: '20:30',
          durationMin: 60,
        },
      ]);
    } else if (isPrimaryTrack) {
      setRoutines([
        {
          id: 'rt-p1',
          name: '১ম পিরিয়ড: প্রাথমিক বাংলা',
          periodName: '১ম পিরিয়ড',
          subject: 'Bangla',
          teacher: 'ফরিদা ইয়াসমিন ম্যাডাম',
          room: 'রুম ২০৩',
          source: 'school',
          weekdays: [0, 1, 2, 3, 4],
          startTime: '09:30',
          durationMin: 45,
        },
        {
          id: 'rt-p2',
          name: '২য় পিরিয়ড: প্রাথমিক ইংরেজি',
          periodName: '২য় পিরিয়ড',
          subject: 'English',
          teacher: 'সায়মা সুলতানা ম্যাডাম',
          room: 'রুম ২০৩',
          source: 'school',
          weekdays: [0, 1, 2, 3, 4],
          startTime: '10:15',
          durationMin: 45,
        },
        {
          id: 'rt-p3',
          name: '৩য় পিরিয়ড: প্রাথমিক গণিত',
          periodName: '৩য় পিরিয়ড',
          subject: 'Mathematics',
          teacher: 'মোশাররফ হোসেন স্যার',
          room: 'রুম ২০৩',
          source: 'school',
          weekdays: [0, 1, 2, 3, 4],
          startTime: '11:00',
          durationMin: 45,
        },
        {
          id: 'rt-p4',
          name: '৪র্থ পিরিয়ড: প্রাথমিক বিজ্ঞান',
          periodName: '৪র্থ পিরিয়ড',
          subject: 'General Science',
          teacher: 'নুরুল ইসলাম স্যার',
          room: 'রুম ২০৩',
          source: 'school',
          weekdays: [0, 1, 2, 3, 4],
          startTime: '12:15',
          durationMin: 45,
        },
        {
          id: 'rt-p5',
          name: '৫ম পিরিয়ড: বাংলাদেশ ও বিশ্বপরিচয়',
          periodName: '৫ম পিরিয়ড',
          subject: 'Bangladesh & Global Studies',
          teacher: 'রোকসানা আক্তার ম্যাডাম',
          room: 'রুম ২০৩',
          source: 'school',
          weekdays: [0, 1, 2, 3, 4],
          startTime: '13:00',
          durationMin: 45,
        },
        {
          id: 'rt-t1',
          name: 'প্রাথমিক গণিত ও ইংরেজি প্রাইভেট',
          periodName: 'প্রাইভেট',
          subject: 'Mathematics',
          teacher: 'শামীমা ম্যাডাম',
          room: 'গৃহশিক্ষক',
          source: 'tuition',
          weekdays: [0, 2, 5],
          startTime: '16:30',
          durationMin: 60,
        },
      ]);
    } else {
      setRoutines([
        {
          id: 'rr-p1',
          name: '১ম পিরিয়ড: বাংলা ১ম পত্র (Bangla 1st)',
          periodName: '১ম পিরিয়ড',
          subject: 'Bangla 1st Paper',
          teacher: 'কবির আহমেদ স্যার',
          room: 'রুম ৩০২',
          source: 'school',
          weekdays: [0, 1, 2, 3, 4],
          startTime: '09:00',
          durationMin: 45,
        },
        {
          id: 'rr-p2',
          name: '২য় পিরিয়ড: ইংরেজি ১ম পত্র (English 1st)',
          periodName: '২য় পিরিয়ড',
          subject: 'English 1st Paper',
          teacher: 'নাসরিন সুলতানা ম্যাডাম',
          room: 'রুম ৩০২',
          source: 'school',
          weekdays: [0, 1, 2, 3, 4],
          startTime: '09:45',
          durationMin: 45,
        },
        {
          id: 'rr-p3',
          name: '৩য় পিরিয়ড: সাধারণ গণিত (Mathematics)',
          periodName: '৩য় পিরিয়ড',
          subject: 'Mathematics',
          teacher: 'আবুল হোসেন স্যার',
          room: 'রুম ৩০২',
          source: 'school',
          weekdays: [0, 1, 2, 3, 4],
          startTime: '10:30',
          durationMin: 45,
        },
        {
          id: 'rr-p4',
          name: '৪র্থ পিরিয়ড: সাধারণ বিজ্ঞান (General Science)',
          periodName: '৪র্থ পিরিয়ড',
          subject: 'General Science',
          teacher: 'ড. রফিকুল ইসলাম',
          room: 'বিজ্ঞান ল্যাব',
          source: 'school',
          weekdays: [0, 1, 2, 3, 4],
          startTime: '11:45',
          durationMin: 45,
        },
        {
          id: 'rr-p5',
          name: '৫ম পিরিয়ড: বাংলাদেশ ও বিশ্বপরিচয় (BGS)',
          periodName: '৫ম পিরিয়ড',
          subject: 'Bangladesh & Global Studies',
          teacher: 'মাহমুদা বেগম ম্যাডাম',
          room: 'রুম ৩০২',
          source: 'school',
          weekdays: [0, 1, 2, 3, 4],
          startTime: '12:30',
          durationMin: 45,
        },
        {
          id: 'rr-p6',
          name: '৬ষ্ঠ পিরিয়ড: তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
          periodName: '৬ষ্ঠ পিরিয়ড',
          subject: 'ICT',
          teacher: 'তানভীর আহমেদ স্যার',
          room: 'কম্পিউটার ল্যাব',
          source: 'school',
          weekdays: [0, 1, 2, 3, 4],
          startTime: '13:15',
          durationMin: 45,
        },
        {
          id: 'rr-t1',
          name: 'গণিত প্রাইভেট — রহিম স্যার',
          periodName: 'প্রাইভেট',
          subject: 'Mathematics',
          teacher: 'রহিম স্যার',
          room: 'টিউটর হোম',
          source: 'tuition',
          weekdays: [0, 2, 4],
          startTime: '16:00',
          durationMin: 90,
        },
        {
          id: 'rr-t2',
          name: 'বিজ্ঞান ও পদার্থ কোচিং',
          periodName: 'কোচিং',
          subject: 'General Science',
          teacher: 'আহমেদ স্যার',
          room: 'মাস্টারমাইন্ড ব্রাঞ্চ',
          source: 'tuition',
          weekdays: [1, 3],
          startTime: '17:30',
          durationMin: 75,
        },
      ]);
    }
  };

  useEffect(() => {
    loadData();
    // `isBn` is intentionally not a dependency — it re-fires every request on a locale
    // toggle. The locale is read inside the render instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, isDemoChild, isCollegeTrack, isPrimaryTrack]);

  useEffect(() => {
    let cancelled = false;
    setEntries([]);
    if (childId) {
      loadClassLogs(childId, selectedDate)
        .then((logs) => {
          if (!cancelled) setEntries(logs);
        })
        .catch(() => {
          if (!cancelled) setErrorMsg(isBn ? 'ক্লাস লগ লোড করা যায়নি।' : 'Could not load class logs.');
        });
    }
    return () => {
      cancelled = true;
    };
    // Locale changes do not need another request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, selectedDate]);

  useEffect(() => {
    let cancelled = false;
    setOccurrences(null);
    if (childId) {
      api.get(`/children/${childId}/schedule`, { params: { from: selectedDate, to: selectedDate } })
        .then((response) => {
          if (!cancelled) setOccurrences(response.data?.data?.occurrences || []);
        })
        .catch(() => {
          if (!cancelled) setErrorMsg(isBn ? 'রুটিন লোড করা যায়নি।' : 'Could not load the updated schedule.');
        });
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, selectedDate, scheduleRevision, routines]);

  useEffect(() => {
    let cancelled = false;
    setQuizzes([]);
    if (!childId) return;
    const refresh = async () => {
      try {
        const response = await api.get(`/children/${childId}/quizzes`);
        if (!cancelled) setQuizzes(response.data?.data || []);
      } catch { /* No quiz action is shown without a confirmed assignment. */ }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    void refresh();
    window.addEventListener('focus', refreshWhenVisible);
    const interval = window.setInterval(refreshWhenVisible, 30000);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', refreshWhenVisible);
      window.clearInterval(interval);
    };
  }, [childId]);

  const handleReschedule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rescheduleClass || loading) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await api.post(`/routines/${rescheduleClass.id}/exceptions`, {
        type: 'rescheduled', originalDate: rescheduleClass.originalDate || selectedDate,
        newDate: rescheduleForm.newDate, newStartTime: rescheduleForm.newStartTime,
      });
      const destination = new Date(`${rescheduleForm.newDate}T12:00:00`);
      setSelectedDate(rescheduleForm.newDate);
      setSelectedWeekday(destination.getDay());
      setCategoryFilter('all');
      setScheduleRevision((revision) => revision + 1);
      setRescheduleClass(null);
      setSuccessMsg(isBn ? 'ক্লাসের সময় পরিবর্তন করা হয়েছে।' : 'Class rescheduled.');
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.error?.message || 'Could not reschedule the class.');
    } finally {
      setLoading(false);
    }
  };

  // Speech Recognition initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.lang = speechLang;

          // A result can be reported repeatedly as recognition updates it.
          // Only append finalized results, once per index in each session.
          const appendedResults = new Set<number>();
          recognition.onstart = () => appendedResults.clear();
          recognition.onresult = (event: any) => {
            const transcripts: string[] = [];
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (!event.results[i].isFinal || appendedResults.has(i)) continue;
              appendedResults.add(i);
              transcripts.push(event.results[i][0].transcript.trim());
            }
            const currentTranscript = transcripts.filter(Boolean).join(' ');
            if (currentTranscript) {
              setLogForm((prev) => ({
                ...prev,
                topicsText: prev.topicsText ? `${prev.topicsText} ${currentTranscript}` : currentTranscript,
              }));
            }
          };

          recognition.onerror = () => {
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
          setSpeechSupported(true);
          setIsListening(false);

          return () => {
            recognition.onstart = null;
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            recognition.abort();
            recognitionRef.current = null;
          };
        } else {
          setSpeechSupported(false);
        }
      } catch {
        setSpeechSupported(false);
      }
    }
  }, [speechLang]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop error
      }
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = speechLang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // Filter routines by selected weekday & category
  const routineList = Array.isArray(routines) ? routines : [];
  const dailyRoutines = occurrences === null
    ? routineList.filter((r) => r && r.active !== false && parseWeekdays(r.weekdays).includes(selectedWeekday)
      && (!r.startsOn || String(r.startsOn).slice(0, 10) <= selectedDate)
      && (!r.endsOn || String(r.endsOn).slice(0, 10) >= selectedDate))
    : occurrences.filter((occurrence) => occurrence.status !== 'rescheduled').map((occurrence) => ({
      ...routineList.find((routine) => routine.id === occurrence.routineId),
      ...occurrence, id: occurrence.routineId,
    }));
  const filteredRoutines = dailyRoutines
    .filter((r) => {
      if (!r) return false;
      if (categoryFilter === 'school') {
        if (institutionType === 'college') return r?.source === 'college';
        if (institutionType === 'admission') return r?.source === 'tuition';
        return r?.source === 'school';
      }
      if (categoryFilter === 'tuition') {
        if (institutionType === 'admission') return r?.source === 'self_study';
        return r?.source === 'tuition' || r?.source === 'self_study';
      }
      return true;
    })
    .sort((a, b) => safeString(a?.startTime || '00:00').localeCompare(safeString(b?.startTime || '00:00')));

  // Find if an entry exists for a routine on selectedDate
  const findEntryForRoutine = (routine: any) =>
    findClassLog(entries, routine?.id, selectedDate);

  // Daily statistics for selected day
  const totalClassesToday = filteredRoutines.length;
  const loggedClassesToday = filteredRoutines.filter((r) => !!findEntryForRoutine(r)).length;
  const pendingClassesToday = Math.max(0, totalClassesToday - loggedClassesToday);
  const completionPercentage = totalClassesToday > 0 ? Math.round((loggedClassesToday / totalClassesToday) * 100) : 0;

  // Open Log Modal for a specific class
  const handleOpenLogModal = (routine: any) => {
    const existing = findEntryForRoutine(routine);
    setActiveRoutineForLog(routine);
    setExistingEntryForLog(existing || null);

    if (existing) {
      setLogForm({
        topicsText: existing.topicsText || '',
        homeworkAssigned: existing.homeworkAssigned || '',
        confidence: existing.confidence || 4,
        notes: existing.notes || '',
      });
    } else {
      setLogForm({
        topicsText: '',
        homeworkAssigned: '',
        confidence: 4,
        notes: '',
      });
    }

    setLogModalOpen(true);
  };

  // Submit class log
  const handleSaveClassLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoutineForLog || !logForm.topicsText.trim()) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }

    setLoading(true);

    const payload = {
      subject: activeRoutineForLog.subject || activeRoutineForLog.name || 'Class',
      subjectName: activeRoutineForLog.name || activeRoutineForLog.subject || 'Class',
      periodName: activeRoutineForLog.periodName || 'ক্লাস',
      providerName: activeRoutineForLog.teacher || (activeRoutineForLog.source === 'school' ? 'স্কুল ক্লাস' : 'টিউটর'),
      source: activeRoutineForLog.source || 'school',
      routineId: activeRoutineForLog.id,
      date: selectedDate,
      durationMin: activeRoutineForLog.durationMin || 45,
      topicsText: logForm.topicsText.trim(),
      homeworkAssigned: logForm.homeworkAssigned.trim() || undefined,
      confidence: logForm.confidence,
      notes: logForm.notes.trim() || undefined,
    };

    try {
      if (existingEntryForLog?.id) {
        const res = await api.patch(`/entries/${existingEntryForLog.id}`, payload);
        const updated = res.data?.data || { ...existingEntryForLog, ...payload };
        setEntries((prev) => (Array.isArray(prev) ? prev.map((item) => (item.id === existingEntryForLog.id ? updated : item)) : [updated]));
        setSuccessMsg(t('childSchedule.text_23'));
      } else {
        const res = await api.post(`/children/${childId}/entries`, payload);
        // The server's row is the entry. Inventing one locally produced a class log
        // that looked saved and existed nowhere on the server.
        const created = res.data?.data;
        if (!created) throw new Error('The server did not return the saved entry');
        setEntries((prev) => (Array.isArray(prev) ? [created, ...prev] : [created]));
        setSuccessMsg(t('childSchedule.text_24'));
      }

      setLogModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (e: any) {
      // The class log was NOT saved. The old code invented an entry and reported
      // success, so the parent saw a class log that the server had never heard of.
      setErrorMsg(e?.response?.data?.error?.message || 'The class log could not be saved.');
    } finally {
      setLoading(false);
    }
  };

  // Create new routine / class period
  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineForm.name.trim()) return;
    setLoading(true);

    try {
      const res = await api.post(`/children/${childId}/routines`, routineForm);
      const created = res.data?.data;
      if (!created) throw new Error('The server did not return the created routine');
      setRoutines((prev) => (Array.isArray(prev) ? [created, ...prev] : [created]));
      setCreateModalOpen(false);
      setSuccessMsg(t('childSchedule.text_26'));
      setTimeout(() => setSuccessMsg(''), 4000);
      setRoutineForm({
        name: '',
        periodName: '১ম পিরিয়ড',
        subject: 'Mathematics',
        teacher: '',
        room: '',
        source: 'school',
        weekdays: [0, 1, 2, 3, 4],
        startTime: '09:00',
        durationMin: 45,
        startsOn: new Date().toISOString().slice(0, 10),
      });
    } catch (e: any) {
      // The routine was NOT created. Adding a local copy and reporting success meant
      // a class that appeared in the timetable but was never scheduled.
      setErrorMsg(e?.response?.data?.error?.message || 'The routine could not be created.');
    } finally {
      setLoading(false);
    }
  };

  // Delete routine
  const handleDeleteRoutine = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && !window.confirm(t('childSchedule.text_28'))) return;
    try {
      await api.delete(`/routines/${id}`);
      setRoutines((prev) => (Array.isArray(prev) ? prev.filter((r) => r.id !== id) : []));
      setSuccessMsg(t('childSchedule.text_29'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      // Removing it from the list after a failed delete hid a routine that still
      // existed on the server.
      setErrorMsg(e?.response?.data?.error?.message || 'The routine could not be deleted.');
    }
  };

  // 1-Click Load Routine Templates
  const handleApplyTemplate = async (type: 'school_8' | 'school_5' | 'college_science' | 'college_commerce') => {
    let newItems: any[] = [];
    if (type === 'school_8') {
      newItems = [
        { name: '১ম পিরিয়ড: বাংলা ১ম পত্র', periodName: '১ম পিরিয়ড', subject: 'Bangla 1st Paper', teacher: 'কবির স্যার', room: '৩০২', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '09:00', durationMin: 45 },
        { name: '২য় পিরিয়ড: English 1st Paper', periodName: '২য় পিরিয়ড', subject: 'English 1st Paper', teacher: 'নাসরিন ম্যাডাম', room: '৩০২', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '09:45', durationMin: 45 },
        { name: '৩য় পিরিয়ড: সাধারণ গণিত', periodName: '৩য় পিরিয়ড', subject: 'Mathematics', teacher: 'আবুল হোসেন স্যার', room: '৩০২', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '10:30', durationMin: 45 },
        { name: '৪র্থ পিরিয়ড: সাধারণ বিজ্ঞান', periodName: '৪র্থ পিরিয়ড', subject: 'General Science', teacher: 'ড. রফিকুল ইসলাম', room: 'বিজ্ঞান ল্যাব', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '11:45', durationMin: 45 },
        { name: '৫ম পিরিয়ড: বাংলাদেশ ও বিশ্বপরিচয়', periodName: '৫ম পিরিয়ড', subject: 'Bangladesh & Global Studies', teacher: 'মাহমুদা ম্যাডাম', room: '৩০২', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '12:30', durationMin: 45 },
        { name: '৬ষ্ঠ পিরিয়ড: তথ্য ও যোগাযোগ প্রযুক্তি', periodName: '৬ষ্ঠ পিরিয়ড', subject: 'ICT', teacher: 'তানভীর আহমেদ', room: 'কম্পিউটার ল্যাব', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '13:15', durationMin: 45 },
      ];
    } else if (type === 'school_5') {
      newItems = [
        { name: '১ম পিরিয়ড: প্রাথমিক বাংলা', periodName: '১ম পিরিয়ড', subject: 'Bangla', teacher: 'ফরিদা ম্যাডাম', room: '২০৩', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '09:30', durationMin: 45 },
        { name: '২য় পিরিয়ড: প্রাথমিক ইংরেজি', periodName: '২য় পিরিয়ড', subject: 'English', teacher: 'সায়মা ম্যাডাম', room: '২০৩', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '10:15', durationMin: 45 },
        { name: '৩য় পিরিয়ড: প্রাথমিক গণিত', periodName: '৩য় পিরিয়ড', subject: 'Mathematics', teacher: 'মোশাররফ স্যার', room: '২০৩', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '11:00', durationMin: 45 },
        { name: '৪র্থ পিরিয়ড: প্রাথমিক বিজ্ঞান', periodName: '৪র্থ পিরিয়ড', subject: 'General Science', teacher: 'নুরুল ইসলাম স্যার', room: '২০৩', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '12:15', durationMin: 45 },
        { name: '৫ম পিরিয়ড: বাংলাদেশ ও বিশ্বপরিচয়', periodName: '৫ম পিরিয়ড', subject: 'Bangladesh & Global Studies', teacher: 'রোকসানা ম্যাডাম', room: '২০৩', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '13:00', durationMin: 45 },
      ];
    } else if (type === 'college_science') {
      newItems = [
        { name: '১ম পিরিয়ড: পদার্থবিজ্ঞান ১ম পত্র', periodName: '১ম পিরিয়ড', subject: 'Physics', teacher: 'ড. মাহবুব স্যার', room: 'ল্যাব ৪', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '08:30', durationMin: 50 },
        { name: '২য় পিরিয়ড: রসায়ন ১ম পত্র', periodName: '২য় পিরিয়ড', subject: 'Chemistry', teacher: 'তাহমিনা ম্যাডাম', room: 'কেমিস্ট্রি ল্যাব', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '09:20', durationMin: 50 },
        { name: '৩য় পিরিয়ড: উচ্চতর গণিত', periodName: '৩য় পিরিয়ড', subject: 'Mathematics', teacher: 'এনামুল স্যার', room: '৪০১', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '10:10', durationMin: 50 },
        { name: '৪র্থ পিরিয়ড: জীববিজ্ঞান ১ম পত্র', periodName: '৪র্থ পিরিয়ড', subject: 'Biology', teacher: 'ফারহানা ম্যাডাম', room: 'বায়োলজি ল্যাব', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '11:20', durationMin: 50 },
        { name: '৫ম পিরিয়ড: আইসিটি ল্যাব', periodName: '৫ম পিরিয়ড', subject: 'ICT', teacher: 'রাকিবুল হাসান', room: 'কম্পিউটার ল্যাব', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '12:10', durationMin: 50 },
      ];
    } else {
      newItems = [
        { name: '১ম পিরিয়ড: হিসাববিজ্ঞান ১ম পত্র', periodName: '১ম পিরিয়ড', subject: 'Accounting', teacher: 'জাকির স্যার', room: '২০১', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '08:30', durationMin: 50 },
        { name: '২য় পিরিয়ড: ব্যবসায় সংগঠন ও ব্যবস্থাপনা', periodName: '২য় পিরিয়ড', subject: 'Business', teacher: 'শাহিনুর ম্যাডাম', room: '২০১', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '09:20', durationMin: 50 },
        { name: '৩য় পিরিয়ড: ফিন্যান্স ও ব্যাংকিং', periodName: '৩য় পিরিয়ড', subject: 'Finance', teacher: 'আনোয়ার স্যার', room: '২০১', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '10:10', durationMin: 50 },
        { name: '৪র্থ পিরিয়ড: অর্থনীতি ১ম পত্র', periodName: '৪র্থ পিরিয়ড', subject: 'Economics', teacher: 'সেলিনা ম্যাডাম', room: '২০১', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '11:20', durationMin: 50 },
      ];
    }

    if (!childId || loading) return;
    setLoading(true);
    try {
      const missingItems = newItems.filter((item) => !routines.some((routine) =>
        routine.source === item.source && routine.startTime === item.startTime
        && routine.subject === item.subject
        && JSON.stringify([...parseWeekdays(routine.weekdays)].sort()) === JSON.stringify([...item.weekdays].sort())
      ));
      await Promise.all(missingItems.map((item) =>
        api.post(`/children/${childId}/routines`, { ...item, startsOn: schoolDate() })
      ));
      await loadData();
      setTemplateModalOpen(false);
      setSuccessMsg(t('childSchedule.text_30'));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.error?.message || 'The routine template could not be saved.');
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  const selectedWeekdayObj = WEEKDAYS.find((w) => w.index === selectedWeekday) || WEEKDAYS[0];

  return (
    <KidShell>
      <div className="space-y-6 pb-12">
        {/* ======================================================== */}
        {/* 1. Page Header */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <School className="w-3.5 h-3.5" />
                {instInfo.routineTitle}
              </span>
              <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border border-primary/25 font-bold">
                {t('childSchedule.scheduled_classes', { p0: isBn ? toBnNum(routines.length) : routines.length }, `${routines.length} Scheduled Classes`)}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <span>{instInfo.classesHeading}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              {t('childSchedule.text_31')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setTemplateModalOpen(true)}
              className="rounded-2xl h-10 px-3.5 text-xs font-bold gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t('childSchedule.text_32')}</span>
            </Button>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl shadow-md h-10 px-4 text-xs sm:text-sm gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('childSchedule.text_33')}</span>
            </Button>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert — a failed request is never reported as a success. */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="ml-auto underline underline-offset-2 shrink-0"
            >
              {t('common.close')}
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. Weekday Bar (Sun to Sat) with Quick Today Indicator */}
        {/* ======================================================== */}
        <Card className="rounded-3xl border shadow-xs bg-card/60 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {t('childSchedule.s_schedule', { p0: isBn ? selectedWeekdayObj.fullBn : selectedWeekdayObj.fullEn }, `${selectedWeekdayObj.fullEn}'s Schedule`)}
                </span>
                <span className="text-xs text-muted-foreground">({selectedDate})</span>
              </div>

              {/* View / Category Filter Pills */}
              <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-2xl border text-xs max-w-full overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('school')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    categoryFilter === 'school'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {instInfo.categoryFilterPill}
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('tuition')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    categoryFilter === 'tuition'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  📚 {t('childSchedule.text_35')}
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    categoryFilter === 'all'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  📑 {t('childSchedule.text_36')}
                </button>
              </div>
            </div>

            {/* 7-Weekday Switcher Buttons */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {WEEKDAYS.map((w) => {
                const isSelected = selectedWeekday === w.index;
                const isTodayWeekday = today.getDay() === w.index;
                const countOnDay = routineList.filter((r) => r && parseWeekdays(r?.weekdays).includes(w.index)).length;
                const diff = w.index - today.getDay();
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() + diff);

                return (
                  <button
                    key={w.index}
                    type="button"
                    onClick={() => {
                      setSelectedWeekday(w.index);
                      setSelectedDate(schoolDate(targetDate));
                    }}
                    className={`py-2 sm:py-3 px-0.5 sm:px-1 rounded-xl sm:rounded-2xl border text-center transition-all flex flex-col items-center justify-between relative group ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20 scale-[1.02]'
                        : 'bg-muted/20 border-border/70 hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    {isTodayWeekday && (
                      <span
                        className={`absolute -top-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          isSelected ? 'bg-amber-400 text-black' : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        {t('childSchedule.text_37')}
                      </span>
                    )}

                    <span className="text-[11px] sm:text-xs font-semibold opacity-85">
                      {isBn ? w.bn : w.en}
                    </span>

                    <span className="text-sm sm:text-base font-extrabold my-0.5">
                      {isBn ? toBnNum(targetDate.getDate()) : targetDate.getDate()}
                    </span>

                    <span
                      className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : countOnDay > 0
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground/60'
                      }`}
                    >
                      {countOnDay > 0
                        ? t('childSchedule.cls', { p0: isBn ? toBnNum(countOnDay) : countOnDay }, `${countOnDay} cls`)
                        : t('childSchedule.text_38')}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ======================================================== */}
        {/* 3. Daily Logging Progress Tracker */}
        {/* ======================================================== */}
        <Card className="rounded-3xl border shadow-xs bg-gradient-to-r from-primary/5 via-card to-emerald-500/5">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-emerald-500" />
                    <span>
                      {t('childSchedule.class_log_progress', { p0: isBn ? selectedWeekdayObj.fullBn : selectedWeekdayObj.fullEn }, `${selectedWeekdayObj.fullEn} Class Log Progress`)}
                    </span>
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-bold ${
                      completionPercentage === 100
                        ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                        : 'bg-primary/15 text-primary border-primary/30'
                    }`}
                  >
                    {t('childSchedule.logged', { p0: isBn ? toBnNum(loggedClassesToday) : loggedClassesToday, p1: isBn ? toBnNum(totalClassesToday) : totalClassesToday, p2: isBn ? toBnNum(completionPercentage) : completionPercentage }, `${loggedClassesToday}/${totalClassesToday} Logged (${completionPercentage}%)`)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {completionPercentage === 100
                    ? t('childSchedule.text_39')
                    : t('childSchedule.class_es_pending_click_log_what_was_taught_after', { p0: isBn ? toBnNum(pendingClassesToday) : pendingClassesToday }, `${pendingClassesToday} class(es) pending. Click "Log What Was Taught" after each class to protect your streak.`)}
                </p>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full sm:w-48 shrink-0 space-y-1.5">
                <div className="w-full h-3 bg-muted/60 rounded-full overflow-hidden p-0.5 border">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-semibold px-0.5">
                  <span>০%</span>
                  <span>{t('childSchedule.done', { p0: isBn ? toBnNum(completionPercentage) : completionPercentage }, `${completionPercentage}% Done`)}</span>
                  <span>১০০%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ======================================================== */}
        {/* 4. Class-by-Class Schedule List */}
        {/* ======================================================== */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary" />
              <span>
                {t('childSchedule.class_by_class_schedule', { p0: isBn ? selectedWeekdayObj.fullBn : selectedWeekdayObj.fullEn }, `Class-by-Class Schedule (${selectedWeekdayObj.fullEn})`)}
              </span>
            </h2>

            <span className="text-xs text-muted-foreground font-medium">
              {t('childSchedule.period_s_scheduled', { p0: isBn ? toBnNum(filteredRoutines.length) : filteredRoutines.length }, `${filteredRoutines.length} Period(s) scheduled`)}
            </span>
          </div>

          {occurrences?.filter((occurrence) => occurrence.status === 'rescheduled').map((occurrence) => (
            <div key={`moved-${occurrence.routineId}-${occurrence.date}`} className="p-3 rounded-xl border bg-amber-500/10 text-sm mb-3">
              {occurrence.name} — {isBn ? 'পরিবর্তিত সময়' : 'Rescheduled to'} {occurrence.newDate} {occurrence.newStartTime}
            </div>
          ))}
          {filteredRoutines.length === 0 ? (
            <Card className="rounded-3xl border border-dashed p-8 text-center bg-muted/10">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/60 mb-3" />
              <h3 className="text-sm font-bold text-foreground">
                {t('childSchedule.no_classes_scheduled_for', { p0: isBn ? selectedWeekdayObj.fullBn : selectedWeekdayObj.fullEn }, `No classes scheduled for ${selectedWeekdayObj.fullEn}`)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {t('childSchedule.text_40')}
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTemplateModalOpen(true)}
                  className="rounded-xl text-xs gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('childSchedule.text_41')}</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setRoutineForm((prev) => ({ ...prev, weekdays: [selectedWeekday] }));
                    setCreateModalOpen(true);
                  }}
                  className="rounded-xl text-xs gap-1 bg-primary text-primary-foreground font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('childSchedule.text_42')}</span>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3.5">
              {filteredRoutines.map((routine, idx) => {
                const loggedEntry = findEntryForRoutine(routine);
                const isLogged = !!loggedEntry;
                const assignedQuiz = findLogQuiz(quizzes, loggedEntry?.id);
                const subjectColor = getSubjectColor(routine.subject || routine.name);

                return (
                  <Card
                    key={routine.id || idx}
                    className={`rounded-3xl border transition-all overflow-hidden ${
                      isLogged
                        ? 'bg-card border-emerald-500/30 shadow-xs ring-1 ring-emerald-500/20'
                        : 'bg-card hover:border-primary/40 shadow-xs'
                    }`}
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        {/* Left Info: Period, Subject, Teacher & Time */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Period Tag */}
                            <Badge className="bg-primary/15 text-primary border-primary/30 font-bold text-[11px] px-2.5 py-0.5">
                              {routine.periodName || (t('childSchedule.period', { p0: isBn ? toBnNum(idx + 1) : idx + 1 }, `Period ${idx + 1}`))}
                            </Badge>

                            {/* Time Badge */}
                            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted/40 px-2.5 py-0.5 rounded-lg border">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span>{routine.startTime || '09:00'}</span>
                              <span>•</span>
                              <span>{t('childSchedule.m', { p0: isBn ? toBnNum(routine.durationMin || 45) : routine.durationMin || 45 }, `${routine.durationMin || 45}m`)}</span>
                            </div>

                            {/* Source Badge (School / College / Tuition) */}
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                routine.source === 'school'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                  : routine.source === 'college'
                                  ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                                  : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
                              }`}
                            >
                              {routine.source === 'school'
                                ? t('childSchedule.text_43')
                                : routine.source === 'college'
                                ? t('childSchedule.text_44')
                                : t('childSchedule.text_45')}
                            </Badge>

                            {/* Status Badge */}
                            {isLogged ? (
                              <Badge className="bg-emerald-500 text-white font-bold text-[10px] px-2 py-0.5 flex items-center gap-1 shadow-xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>{t('childSchedule.text_46')}</span>
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] font-bold border-amber-500/40 text-amber-600 bg-amber-500/10">
                                {t('childSchedule.text_47')}
                              </Badge>
                            )}
                          </div>

                          {/* Subject & Teacher Header */}
                          <div>
                            <h3 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                              {routine.name}
                            </h3>
                            {(routine.teacher || routine.room) && (
                              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                {routine.teacher && (
                                  <span className="flex items-center gap-1">
                                    <UserCheck className="w-3 h-3 text-primary/70" />
                                    <span>{routine.teacher}</span>
                                  </span>
                                )}
                                {routine.room && (
                                  <span className="text-muted-foreground/70">
                                    • {t('childSchedule.room', { p0: routine.room }, `Room: ${routine.room}`)}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>

                          {/* Logged Content Display (If Logged) */}
                          {isLogged && (
                            <div className="mt-3 p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                              <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-0.5">
                                  {t('childSchedule.text_48')}
                                </span>
                                <p className="text-xs sm:text-sm text-foreground leading-relaxed font-medium">
                                  {loggedEntry.topicsText}
                                </p>
                              </div>

                              {/* Homework Assigned callout */}
                              {loggedEntry.homeworkAssigned && (
                                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                                  <Award className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                                  <div>
                                    <span className="font-bold">{t('childSchedule.text_49')}</span>
                                    <span>{loggedEntry.homeworkAssigned}</span>
                                  </div>
                                </div>
                              )}

                              {/* Understanding / Confidence Level */}
                              <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-500/15">
                                <span className="text-muted-foreground">
                                  {t('childSchedule.text_50')}
                                </span>
                                <div className="flex items-center gap-1 text-amber-500 font-bold">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3.5 h-3.5 ${
                                        i < (loggedEntry.confidence || 4)
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-muted-foreground/30'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-[11px] ml-1 text-foreground">
                                    ({loggedEntry.confidence || 4}/5)
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Pending Prompt (If Not Logged Yet) */}
                          {!isLogged && (
                            <div className="p-3 rounded-2xl bg-amber-500/5 border border-dashed border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                              <p className="text-muted-foreground">
                                {t('childSchedule.text_51')}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Right Actions: Log Button / Edit / Delete */}
                        <div className="flex flex-wrap md:flex-col items-center justify-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
                          {isLogged ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenLogModal(routine)}
                                className="h-9 px-3 text-xs font-bold rounded-xl border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 gap-1.5 flex-1 md:flex-none w-auto"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{t('childSchedule.text_52')}</span>
                              </Button>

                              {assignedQuiz && (
                                <Link href={`/child/quiz/${assignedQuiz.id}`} className="flex-1 md:flex-none w-auto">
                                  <Button size="sm" className="h-9 px-3 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-1 w-full">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>{t('childSchedule.text_53')}</span>
                                  </Button>
                                </Link>
                              )}
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleOpenLogModal(routine)}
                              className="h-10 px-4 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm gap-2 w-full md:w-auto"
                            >
                              <BookOpen className="w-4 h-4" />
                              <span>{t('childSchedule.text_54')}</span>
                              <Mic className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
                            </Button>
                          )}

                          {!isLogged && (
                            <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1.5 text-xs"
                              onClick={() => {
                                setRescheduleClass(routine);
                                setRescheduleForm({ newDate: selectedDate, newStartTime: routine.startTime || '09:00' });
                              }}>
                              <RefreshCw className="w-3.5 h-3.5" />
                              {isBn ? 'সময় পরিবর্তন' : 'Reschedule'}
                            </Button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteRoutine(routine.id, e)}
                            className="text-muted-foreground/60 hover:text-destructive p-1.5 rounded-lg transition-colors ml-auto md:ml-0"
                            title={t('childSchedule.text_55')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 5. Weekly Study Time & Source Hours Breakdown */}
        {/* ======================================================== */}
        <div className="grid lg:grid-cols-3 gap-6 min-w-0">
          <Card className="rounded-3xl border shadow-sm lg:col-span-2 min-w-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{t('childSchedule.text_56')}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {institutionType === 'college'
                      ? (t('childSchedule.text_57'))
                      : (t('childSchedule.text_58'))}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-1">
              <StudyTimeChart data={currentStudyTime} institutionType={institutionType} isBn={isBn} />
            </CardContent>
          </Card>

          <Card className="rounded-3xl border shadow-sm flex flex-col justify-between min-w-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="text-base font-bold">
                {t('childSchedule.text_59')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('childSchedule.text_60')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-2.5">
              {institutionType === 'college' && (
                <div className="p-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 dark:bg-cyan-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-sm">
                      🏛️
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{t('childSchedule.text_61')}</p>
                      <p className="text-[10px] text-muted-foreground">{t('childSchedule.text_62')}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-cyan-600 dark:text-cyan-400">
                    {t('childSchedule.h_m', { p0: isBn ? toBnNum(collegeHours) : collegeHours, p1: isBn ? toBnNum(collegeRemMin) : collegeRemMin }, `${collegeHours}h ${collegeRemMin}m`)}
                  </span>
                </div>
              )}
              {institutionType === 'school' && (
                <div className="p-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 dark:bg-indigo-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                      🏫
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{t('childSchedule.text_63')}</p>
                      <p className="text-[10px] text-muted-foreground">{t('childSchedule.text_64')}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                    {t('childSchedule.h_m', { p0: isBn ? toBnNum(collegeHours) : collegeHours, p1: isBn ? toBnNum(collegeRemMin) : collegeRemMin }, `${collegeHours}h ${collegeRemMin}m`)}
                  </span>
                </div>
              )}
              <div className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                    📚
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{institutionType === 'admission' ? (t('childSchedule.text_65')) : (t('childSchedule.text_35'))}</p>
                    <p className="text-[10px] text-muted-foreground">{t('childSchedule.text_66')}</p>
                  </div>
                </div>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  {t('childSchedule.h_m', { p0: isBn ? toBnNum(collegeHours) : collegeHours, p1: isBn ? toBnNum(collegeRemMin) : collegeRemMin }, `${collegeHours}h ${collegeRemMin}m`)}
                </span>
              </div>
              <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                    📖
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{t('childSchedule.text_67')}</p>
                    <p className="text-[10px] text-muted-foreground">{t('childSchedule.text_68')}</p>
                  </div>
                </div>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {t('childSchedule.h_m', { p0: isBn ? toBnNum(collegeHours) : collegeHours, p1: isBn ? toBnNum(collegeRemMin) : collegeRemMin }, `${collegeHours}h ${collegeRemMin}m`)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* 6. Helpful Schedule Tips at bottom */}
        {/* ======================================================== */}
        <Card className="rounded-3xl border shadow-xs bg-muted/15">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t('childSchedule.text_69')}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {t('childSchedule.text_70')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* 7. Class-by-Class Logging Modal Dialog */}
      {/* ======================================================== */}
      <Modal
        isOpen={logModalOpen}
        onClose={() => {
          if (isListening && recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch {}
            setIsListening(false);
          }
          setLogModalOpen(false);
        }}
        title={
          t('childSchedule.log_class', { p0: isBn ? activeRoutineForLog?.periodName || 'ক্লাস' : activeRoutineForLog?.periodName || 'Period' }, `Log Class: ${activeRoutineForLog?.periodName || 'Period'}`)
        }
        description={
          activeRoutineForLog
            ? `${activeRoutineForLog.name} • ${activeRoutineForLog.startTime} (${selectedDate})`
            : ''
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSaveClassLog} className="space-y-4 pt-1">
          {/* Class Summary Banner */}
          {activeRoutineForLog && (
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-foreground">
                  {activeRoutineForLog.name}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {activeRoutineForLog.teacher ? `${activeRoutineForLog.teacher} • ` : ''}
                  {t('childSchedule.mins', { p0: isBn ? toBnNum(activeRoutineForLog.durationMin || 45) : activeRoutineForLog.durationMin || 45 }, `${activeRoutineForLog.durationMin || 45} mins`)}
                </p>
              </div>
              <Badge className="bg-primary text-primary-foreground font-bold text-[10px]">
                {selectedDate}
              </Badge>
            </div>
          )}

          {/* Real-time Voice Entry Option */}
          <div className="p-3 rounded-2xl bg-muted/40 border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-rose-500" />
                <span>{t('childSchedule.text_71')}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSpeechLang(speechLang === 'bn-BD' ? 'en-US' : 'bn-BD')}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-card text-foreground hover:bg-muted"
                >
                  {speechLang === 'bn-BD' ? 'বাংলা' : 'English'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={toggleListening}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>{t('childSchedule.text_72')}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>{t('childSchedule.text_73')}</span>
                  </>
                )}
              </button>
              <span className="text-[11px] text-muted-foreground">
                {isListening
                  ? t('childSchedule.text_74')
                  : t('childSchedule.text_75')}
              </span>
            </div>

            {/* Quick Sample Voice Chips */}
            <div className="pt-1 flex flex-wrap gap-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground self-center">
                {t('childSchedule.text_76')}
              </span>
              <button
                type="button"
                onClick={() =>
                  setLogForm((p) => ({
                    ...p,
                    topicsText: t('childSchedule.text_77'),
                  }))
                }
                className="text-[10px] px-2 py-0.5 rounded-lg border bg-card hover:bg-muted text-foreground transition-colors"
              >
                {t('childSchedule.text_78')}
              </button>
              <button
                type="button"
                onClick={() =>
                  setLogForm((p) => ({
                    ...p,
                    topicsText: t('childSchedule.text_79'),
                  }))
                }
                className="text-[10px] px-2 py-0.5 rounded-lg border bg-card hover:bg-muted text-foreground transition-colors"
              >
                {t('childSchedule.text_80')}
              </button>
            </div>
          </div>

          {/* Topics Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs font-bold text-foreground">
                {t('childSchedule.text_81')}
              </Label>
              <span className="text-[10px] text-muted-foreground">
                {t('childSchedule.text_82')}
              </span>
            </div>
            <textarea
              value={logForm.topicsText}
              onChange={(e) => setLogForm({ ...logForm, topicsText: e.target.value })}
              placeholder={
                t('childSchedule.text_83')
              }
              rows={4}
              required
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-2xl border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />

            {/* Quick Keyword Helper Tags */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {[
                { bn: 'অনুশীলনী সমাধান', en: 'Exercises Solved' },
                { bn: 'নতুন অধ্যায় শুরু', en: 'New Chapter' },
                { bn: 'সূত্র ও নিয়মাবলী', en: 'Formulas & Rules' },
                { bn: 'বোর্ড প্রশ্ন সমাধান', en: 'Board Questions' },
                { bn: 'ক্লাস টেস্ট নেওয়া হয়েছে', en: 'Class Test' },
                { bn: 'ব্যবহারিক / ল্যাব কাজ', en: 'Lab Work' },
              ].map((chip, cIdx) => (
                <button
                  key={cIdx}
                  type="button"
                  onClick={() =>
                    setLogForm((prev) => ({
                      ...prev,
                      topicsText: prev.topicsText
                        ? `${prev.topicsText} (${isBn ? chip.bn : chip.en})`
                        : `${isBn ? chip.bn : chip.en}: `,
                    }))
                  }
                  className="text-[10px] px-2 py-0.5 rounded-md border bg-muted/30 hover:bg-primary/10 hover:border-primary/30 text-foreground transition-colors"
                >
                  + {isBn ? chip.bn : chip.en}
                </button>
              ))}
            </div>
          </div>

          {/* Homework / Assignment Input */}
          <div>
            <Label className="text-xs font-bold text-foreground block mb-1">
              {t('childSchedule.text_84')}
            </Label>
            <Input
              value={logForm.homeworkAssigned}
              onChange={(e) => setLogForm({ ...logForm, homeworkAssigned: e.target.value })}
              placeholder={t('childSchedule.text_85')}
              className="text-xs"
            />
          </div>

          {/* Confidence / Understanding Stars */}
          <div>
            <Label className="text-xs font-bold text-foreground block mb-1.5">
              {t('childSchedule.text_86')}
            </Label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {[
                { val: 1, labelBn: 'বুঝতে কষ্ট', labelEn: 'Struggled' },
                { val: 2, labelBn: 'কিছুটা', labelEn: 'A bit' },
                { val: 3, labelBn: 'মোটামুটি', labelEn: 'Moderate' },
                { val: 4, labelBn: 'ভালো বুঝেছি', labelEn: 'Good' },
                { val: 5, labelBn: 'খুব চমৎকার', labelEn: 'Mastered' },
              ].map((lvl) => {
                const active = logForm.confidence === lvl.val;
                return (
                  <button
                    key={lvl.val}
                    type="button"
                    onClick={() => setLogForm({ ...logForm, confidence: lvl.val })}
                    className={`py-2 px-1 rounded-xl border text-center transition-all ${
                      active
                        ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30'
                        : 'bg-muted/20 border-border hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    <div className="flex justify-center text-amber-500 mb-0.5">
                      <Star className={`w-3.5 h-3.5 ${active ? 'fill-amber-400' : ''}`} />
                    </div>
                    <span className="text-[10px] font-bold block">
                      {isBn ? lvl.labelBn : lvl.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (isListening && recognitionRef.current) {
                  try {
                    recognitionRef.current.stop();
                  } catch {}
                  setIsListening(false);
                }
                setLogModalOpen(false);
              }}
            >
              {t('childSchedule.text_87')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !logForm.topicsText.trim()}
              className="bg-primary text-primary-foreground font-bold rounded-xl px-4 gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>
                {loading
                  ? t('childSchedule.text_88')
                  : t('childSchedule.text_89')}
              </span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* 8. Create Routine Modal (Add Class Period to Schedule) */}
      {/* ======================================================== */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t('childSchedule.text_90')}
        description={
          t('childSchedule.text_91')
        }
        maxWidth="md"
      >
        <form onSubmit={handleCreateRoutine} className="space-y-4 pt-1">
          {/* Quick Presets inside modal */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground mb-1 block">
              {t('childSchedule.text_92')}
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {routinePresets.map((p, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() =>
                    setRoutineForm({
                      name: p.name,
                      periodName: p.periodName || 'ক্লাস',
                      subject: p.subject || 'General',
                      teacher: '',
                      room: '',
                      source: p.source,
                      weekdays: p.weekdays,
                      startTime: p.startTime,
                      durationMin: p.durationMin,
                      startsOn: new Date().toISOString().slice(0, 10),
                    })
                  }
                  className="text-[10px] font-medium px-2.5 py-1 rounded-lg border bg-muted/40 hover:bg-primary/10 hover:border-primary/30 text-foreground transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">{t('childSchedule.text_93')}</Label>
              <select
                value={routineForm.periodName}
                onChange={(e) => setRoutineForm({ ...routineForm, periodName: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border bg-background text-foreground"
              >
                <option value="১ম পিরিয়ড">১ম পিরিয়ড (1st Period)</option>
                <option value="২য় পিরিয়ড">২য় পিরিয়ড (2nd Period)</option>
                <option value="৩য় পিরিয়ড">৩য় পিরিয়ড (3rd Period)</option>
                <option value="৪র্থ পিরিয়ড">৪র্থ পিরিয়ড (4th Period)</option>
                <option value="৫ম পিরিয়ড">৫ম পিরিয়ড (5th Period)</option>
                <option value="৬ষ্ঠ পিরিয়ড">৬ষ্ঠ পিরিয়ড (6th Period)</option>
                <option value="ল্যাব সেশন">ল্যাব সেশন (Lab Session)</option>
                <option value="প্রাইভেট">প্রাইভেট টিউটর (Tuition)</option>
                <option value="কোচিং ক্লাস">কোচিং ক্লাস (Coaching)</option>
                <option value="সেলফ স্টাডি">সেলফ স্টাডি (Self-Study)</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold">{t('childSchedule.text_94')}</Label>
              <select
                value={routineForm.source}
                onChange={(e) => setRoutineForm({ ...routineForm, source: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border bg-background text-foreground"
              >
                {institutionType === 'school' && (
                  <option value="school">{t('childSchedule.school')}</option>
                )}
                {institutionType === 'college' && (
                  <option value="college">{t('childSchedule.college')}</option>
                )}
                <option value="tuition">{institutionType === 'admission' ? (t('childSchedule.text_95')) : (t('childSchedule.text_96'))}</option>
                <option value="self_study">{institutionType === 'admission' ? (t('childSchedule.text_97')) : (t('childSchedule.text_98'))}</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">{t('childSchedule.text_99')}</Label>
            <Input
              value={routineForm.name}
              onChange={(e) => setRoutineForm({ ...routineForm, name: e.target.value })}
              placeholder={t('childSchedule.text_100')}
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">{t('childSchedule.text_101')}</Label>
              <Input
                value={routineForm.teacher}
                onChange={(e) => setRoutineForm({ ...routineForm, teacher: e.target.value })}
                placeholder={t('childSchedule.text_102')}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">{t('childSchedule.text_103')}</Label>
              <Input
                value={routineForm.room}
                onChange={(e) => setRoutineForm({ ...routineForm, room: e.target.value })}
                placeholder={t('childSchedule.text_104')}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          {/* Weekday selector */}
          <div>
            <Label className="text-xs font-semibold block mb-1">
              {t('childSchedule.text_105')}
            </Label>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((w) => {
                const isSelected = parseWeekdays(routineForm?.weekdays).includes(w.index);
                return (
                  <button
                    type="button"
                    key={w.index}
                    onClick={() => {
                      const current = parseWeekdays(routineForm?.weekdays);
                      if (current.includes(w.index)) {
                        setRoutineForm({ ...routineForm, weekdays: current.filter((i) => i !== w.index) });
                      } else {
                        setRoutineForm({ ...routineForm, weekdays: [...current, w.index].sort() });
                      }
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-muted/30 text-muted-foreground border-border'
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
              <Label className="text-xs font-semibold">{t('childSchedule.text_106')}</Label>
              <Input
                type="time"
                value={routineForm.startTime}
                onChange={(e) => setRoutineForm({ ...routineForm, startTime: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">{t('childSchedule.text_107')}</Label>
              <Input
                type="number"
                value={routineForm.durationMin}
                onChange={(e) => setRoutineForm({ ...routineForm, durationMin: parseInt(e.target.value, 10) || 45 })}
                min={15}
                max={300}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              {t('childSchedule.text_87')}
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-primary text-primary-foreground font-bold">
              {loading ? (t('childSchedule.text_88')) : (t('childSchedule.text_108'))}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* 9. Routine Template Picker Modal */}
      {/* ======================================================== */}
      <Modal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        title={t('childSchedule.text_109')}
        description={
          t('childSchedule.text_110')
        }
        maxWidth="md"
      >
        <div className="space-y-3 pt-1">
          {institutionType === 'school' && (
            <>
              <button
                type="button"
                onClick={() => handleApplyTemplate('school_8')}
                className="w-full p-4 rounded-2xl border bg-card hover:bg-primary/5 hover:border-primary/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                    <School className="w-4 h-4 text-primary" />
                    {t('childSchedule.class_8')}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {t('childSchedule.text_111')}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('childSchedule.text_112')}
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyTemplate('school_5')}
                className="w-full p-4 rounded-2xl border bg-card hover:bg-primary/5 hover:border-primary/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                    <School className="w-4 h-4 text-emerald-500" />
                    {t('childSchedule.class_5')}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {t('childSchedule.text_113')}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('childSchedule.text_114')}
                </p>
              </button>
            </>
          )}

          {/* College Templates: Only shown for Class 11-12 */}
          {institutionType === 'college' && (
            <>
              <button
                type="button"
                onClick={() => handleApplyTemplate('college_science')}
                className="w-full p-4 rounded-2xl border bg-card hover:bg-primary/5 hover:border-primary/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-purple-500" />
                    {t('childSchedule.hsc_science')}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {t('childSchedule.text_113')}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('childSchedule.text_115')}
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyTemplate('college_commerce')}
                className="w-full p-4 rounded-2xl border bg-card hover:bg-primary/5 hover:border-primary/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    {t('childSchedule.hsc_commerce')}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {t('childSchedule.text_116')}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('childSchedule.text_117')}
                </p>
              </button>
            </>
          )}

          {/* Admission Templates: Only shown for Admission Prep */}
          {institutionType === 'admission' && (
            <>
              <button
                type="button"
                onClick={() => handleApplyTemplate('college_science')}
                className="w-full p-4 rounded-2xl border bg-card hover:bg-primary/5 hover:border-primary/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-amber-500" />
                    {t('childSchedule.text_118')}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {t('childSchedule.text_119')}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('childSchedule.text_120')}
                </p>
              </button>
            </>
          )}
        </div>
      </Modal>
      <Modal isOpen={!!rescheduleClass} onClose={() => setRescheduleClass(null)}
        title={isBn ? 'ক্লাসের সময় পরিবর্তন' : 'Reschedule class'} maxWidth="sm">
        <form onSubmit={handleReschedule} className="space-y-4 pt-2">
          <p className="text-sm font-semibold">{rescheduleClass?.name}</p>
          <div>
            <Label>{isBn ? 'নতুন তারিখ' : 'New date'}</Label>
            <Input type="date" required value={rescheduleForm.newDate}
              onChange={(event) => setRescheduleForm({ ...rescheduleForm, newDate: event.target.value })} />
          </div>
          <div>
            <Label>{isBn ? 'নতুন সময়' : 'New time'}</Label>
            <Input type="time" required value={rescheduleForm.newStartTime}
              onChange={(event) => setRescheduleForm({ ...rescheduleForm, newStartTime: event.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRescheduleClass(null)}>{t('common.cancel', 'Cancel')}</Button>
            <Button type="submit" disabled={loading}>{loading ? t('common.saving', 'Saving…') : (isBn ? 'সময় পরিবর্তন করুন' : 'Confirm reschedule')}</Button>
          </div>
        </form>
      </Modal>
    </KidShell>
  );
}
