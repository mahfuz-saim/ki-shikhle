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
import { useI18n } from '@/lib/i18n-context';
import { getInstitutionType, getInstitutionInfo } from '@/lib/institution';
import { api } from '@/lib/api';
import { StudyTimeChart } from '@/components/charts/study-time-chart';
import {
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
  const { isBn } = useI18n();

  const studentGrade = user?.grade || activeChild?.grade || 'Class 8';
  const institutionType = getInstitutionType(studentGrade);
  const instInfo = getInstitutionInfo(institutionType, isBn);

  const childId = activeChild?.id || (user as any)?.childId || user?.id || 'demo-child-1';
  const isTasnim = childId === 'demo-child-2' || user?.email?.includes('tasnim') || activeChild?.name?.includes('Tasnim');
  const isFahim = childId === 'demo-child-3' || user?.email?.includes('fahim') || activeChild?.name?.includes('Fahim') || studentGrade.includes('11') || studentGrade.includes('12') || institutionType === 'college';

  const [routines, setRoutines] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [studyTime, setStudyTime] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected Weekday (0=Sun .. 6=Sat) & Selected Date
  const today = new Date();
  const [selectedWeekday, setSelectedWeekday] = useState<number>(today.getDay());
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().slice(0, 10));
  const [autoAdvancedToTomorrow, setAutoAdvancedToTomorrow] = useState<boolean>(false);

  // Category filter: 'all' | 'school' | 'tuition'
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'school' | 'tuition'>('school');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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
  const routinePresets = isFahim
    ? [
        { name: isBn ? 'পদার্থবিজ্ঞান ১ম পত্র' : 'Physics 1st Paper', periodName: '১ম পিরিয়ড', subject: 'Physics 1st Paper', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '08:30', durationMin: 50 },
        { name: isBn ? 'রসায়ন ১ম পত্র' : 'Chemistry 1st Paper', periodName: '২য় পিরিয়ড', subject: 'Chemistry 1st Paper', source: 'college', weekdays: [0, 1, 2, 3, 4], startTime: '09:20', durationMin: 50 },
        { name: isBn ? 'পদার্থবিজ্ঞান কোচিং' : 'Physics Coaching', periodName: 'কোচিং', subject: 'Physics 1st Paper', source: 'tuition', weekdays: [0, 2, 4], startTime: '16:30', durationMin: 75 },
        { name: isBn ? 'রসায়ন প্রাইভেট' : 'Chemistry Tuition', periodName: 'প্রাইভেট', subject: 'Chemistry 1st Paper', source: 'tuition', weekdays: [1, 3], startTime: '17:00', durationMin: 60 },
        { name: isBn ? 'উচ্চতর গণিত সেলফ স্টাডি' : 'Higher Math Self-Study', periodName: 'সেলফ স্টাডি', subject: 'Higher Mathematics', source: 'self_study', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '20:30', durationMin: 60 },
      ]
    : isTasnim
    ? [
        { name: isBn ? 'প্রাথমিক বাংলা' : 'Primary Bangla', periodName: '১ম পিরিয়ড', subject: 'Bangla', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '09:30', durationMin: 45 },
        { name: isBn ? 'প্রাথমিক ইংরেজি' : 'Primary English', periodName: '২য় পিরিয়ড', subject: 'English', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '10:15', durationMin: 45 },
        { name: isBn ? 'প্রাথমিক গণিত প্রাইভেট' : 'Elementary Math Tuition', periodName: 'প্রাইভেট', subject: 'Mathematics', source: 'tuition', weekdays: [0, 2, 4], startTime: '16:00', durationMin: 60 },
        { name: isBn ? 'ইংরেজি টিউটর' : 'English Tutor', periodName: 'প্রাইভেট', subject: 'English', source: 'tuition', weekdays: [1, 3], startTime: '17:30', durationMin: 45 },
        { name: isBn ? 'সন্ধ্যায় সেলফ স্টাডি' : 'Evening Self-Study', periodName: 'সেলফ স্টাডি', subject: 'General Science', source: 'self_study', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '18:30', durationMin: 75 },
      ]
    : [
        { name: isBn ? '১ম পিরিয়ড: বাংলা ১ম পত্র' : '1st Period: Bangla 1st', periodName: '১ম পিরিয়ড', subject: 'Bangla 1st Paper', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '09:00', durationMin: 45 },
        { name: isBn ? '২য় পিরিয়ড: ইংরেজি ১ম পত্র' : '2nd Period: English 1st', periodName: '২য় পিরিয়ড', subject: 'English 1st Paper', source: 'school', weekdays: [0, 1, 2, 3, 4], startTime: '09:45', durationMin: 45 },
        { name: isBn ? 'গণিত প্রাইভেট (রহিম স্যার)' : 'Math Tuition (Rahim Sir)', periodName: 'প্রাইভেট', subject: 'Mathematics', source: 'tuition', weekdays: [0, 2, 5], startTime: '16:00', durationMin: 90 },
        { name: isBn ? 'পদার্থবিজ্ঞান কোচিং' : 'Physics Coaching', periodName: 'কোচিং', subject: 'General Science', source: 'tuition', weekdays: [1, 3], startTime: '17:30', durationMin: 60 },
        { name: isBn ? 'আইসিটি ও কম্পিউটার ক্লাস' : 'ICT & Computer Class', periodName: '৬ষ্ঠ পিরিয়ড', subject: 'ICT', source: 'school', weekdays: [1, 4], startTime: '15:00', durationMin: 60 },
        { name: isBn ? 'রাতে সেলফ স্টাডি' : 'Night Self-Study', periodName: 'সেলফ স্টাডি', subject: 'Mathematics', source: 'self_study', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '20:00', durationMin: 90 },
      ];

  const defaultStudyTimeList = isFahim
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
      ];

  const currentStudyTime = (Array.isArray(studyTime) && studyTime.length > 0) ? studyTime : defaultStudyTimeList;
  const collegeMin = currentStudyTime.reduce((sum, d) => sum + (d?.college || 0), 0) || (isFahim ? 500 : 0);
  const schoolMin = currentStudyTime.reduce((sum, d) => sum + (d?.school || 0), 0) || (institutionType === 'school' ? (isTasnim ? 220 : 380) : 0);
  const tuitionMin = currentStudyTime.reduce((sum, d) => sum + (d?.tuition || 0), 0) || (isFahim ? 435 : isTasnim ? 280 : 405);
  const selfStudyMin = currentStudyTime.reduce((sum, d) => sum + (d?.self_study || 0), 0) || (isFahim ? 450 : isTasnim ? 250 : 340);

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
    try {
      const [routinesRes, entriesRes] = await Promise.all([
        api.get(`/children/${childId}/routines`).catch(() => ({ data: null })),
        api.get(`/children/${childId}/entries`).catch(() => ({ data: null })),
      ]);

      const routineList = unpackList(routinesRes?.data);
      if (routineList.length > 0) {
        setRoutines(routineList);
      } else {
        setDefaultRoutines();
      }

      const entryList = unpackList(entriesRes?.data);
      setEntries(entryList);

      // If today's classes are all logged, auto-show tomorrow's routine
      const todayKey = new Date().toISOString().slice(0, 10);
      const todayDay = new Date().getDay();
      const activeList = routineList.length > 0 ? routineList : [];
      const todayClasses = activeList.filter((r: any) => parseWeekdays(r?.weekdays).includes(todayDay));
      if (todayClasses.length > 0 && Array.isArray(entryList) && entryList.length > 0) {
        const allTodayDone = todayClasses.every((r: any) => {
          const rSub = safeString(r.subject || r.name).toLowerCase();
          return entryList.some((e: any) => {
            const ed = typeof e.date === 'string' ? e.date.slice(0, 10) : '';
            if (ed !== todayKey) return false;
            if (e.routineId && e.routineId === r.id) return true;
            const es = safeString(e.subject || e.subjectName).toLowerCase();
            return (
              (es && rSub && (es.includes(rSub) || rSub.includes(es))) ||
              (r.periodName && e.periodName === r.periodName)
            );
          });
        });

        if (allTodayDone) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          setSelectedWeekday(tomorrow.getDay());
          setSelectedDate(tomorrow.toISOString().slice(0, 10));
          setAutoAdvancedToTomorrow(true);
        }
      }
    } catch {
      setDefaultRoutines();
      setEntries([]);
    }

    // Load weekly study time
    api
      .get(`/children/${childId}/dashboard/study-time`)
      .then((r) => {
        const list = unpackList(r.data);
        if (list.length > 0) {
          setStudyTime(list);
        } else {
          setStudyTime(defaultStudyTimeList);
        }
      })
      .catch(() => setStudyTime(defaultStudyTimeList));
  };

  const setDefaultRoutines = () => {
    if (isFahim) {
      setRoutines([
        {
          id: 'rt-f1',
          name: isBn ? '১ম পিরিয়ড: পদার্থবিজ্ঞান ১ম পত্র' : '1st Period: Physics 1st Paper',
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
          name: isBn ? '২য় পিরিয়ড: রসায়ন ১ম পত্র' : '2nd Period: Chemistry 1st Paper',
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
          name: isBn ? '৩য় পিরিয়ড: উচ্চতর গণিত ১ম পত্র' : '3rd Period: Higher Mathematics',
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
          name: isBn ? '৪র্থ পিরিয়ড: জীববিজ্ঞান ১ম পত্র' : '4th Period: Biology 1st Paper',
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
          name: isBn ? '৫ম পিরিয়ড: আইসিটি ল্যাব' : '5th Period: ICT Lab',
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
          name: isBn ? 'পদার্থবিজ্ঞান কোচিং — গতিবিদ্যা' : 'Physics Coaching – Dynamics',
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
          name: isBn ? 'রসায়ন প্রাইভেট — গুণগত রসায়ন' : 'Chemistry Tuition',
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
          name: isBn ? 'উচ্চতর গণিত সেলফ স্টাডি' : 'Higher Math Self-Study',
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
    } else if (isTasnim) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, isBn, isTasnim]);

  // Speech Recognition initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = speechLang;

          recognition.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript;
            }
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
  const filteredRoutines = routineList
    .filter((r) => r && parseWeekdays(r?.weekdays).includes(selectedWeekday))
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
  const findEntryForRoutine = (routine: any) => {
    if (!routine || !Array.isArray(entries)) return null;
    const routineSubjectLower = safeString(routine.subject || routine.name).toLowerCase();
    return entries.find((e) => {
      if (!e) return false;
      let entryDateKey = '';
      try {
        if (typeof e.date === 'string') {
          entryDateKey = e.date.slice(0, 10);
        } else if (e.date) {
          entryDateKey = new Date(e.date).toISOString().slice(0, 10);
        }
      } catch {
        entryDateKey = '';
      }
      if (entryDateKey !== selectedDate) return false;
      if (e.routineId && e.routineId === routine.id) return true;
      const entrySubLower = safeString(e.subject || e.subjectName).toLowerCase();
      return (
        (entrySubLower && routineSubjectLower && (entrySubLower.includes(routineSubjectLower) || routineSubjectLower.includes(entrySubLower))) ||
        (routine.periodName && e.periodName === routine.periodName)
      );
    });
  };

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
        setSuccessMsg(isBn ? 'ক্লাসের বিবরণী সফলভাবে আপডেট করা হয়েছে! ✨' : 'Class log updated successfully!');
      } else {
        const res = await api.post(`/children/${childId}/entries`, payload);
        const created = res.data?.data || {
          id: 'entry-' + Date.now(),
          childId,
          ...payload,
          createdAt: new Date().toISOString(),
        };
        setEntries((prev) => (Array.isArray(prev) ? [created, ...prev] : [created]));
        setSuccessMsg(isBn ? 'অভিনন্দন! ক্লাসের পড়া সফলভাবে লগ করা হয়েছে 🎉' : 'Awesome! Class log submitted successfully!');
      }

      setLogModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch {
      // Fallback local update
      const fake = {
        id: existingEntryForLog?.id || 'entry-' + Date.now(),
        childId,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      setEntries((prev) => (Array.isArray(prev) ? [fake, ...prev.filter((x) => x.id !== fake.id)] : [fake]));
      setLogModalOpen(false);
      setSuccessMsg(isBn ? 'ক্লাসের পড়া সংরক্ষিত হয়েছে! 🎉' : 'Class log saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4500);
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
      const created = res.data?.data || { id: 'r-' + Date.now(), ...routineForm };
      setRoutines((prev) => (Array.isArray(prev) ? [created, ...prev] : [created]));
      setCreateModalOpen(false);
      setSuccessMsg(isBn ? 'নতুন ক্লাস সফলভাবে রুটিনে যুক্ত হয়েছে!' : 'New class added to schedule!');
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
    } catch {
      const fallback = { id: 'r-' + Date.now(), ...routineForm };
      setRoutines((prev) => (Array.isArray(prev) ? [fallback, ...prev] : [fallback]));
      setCreateModalOpen(false);
      setSuccessMsg(isBn ? 'নতুন ক্লাস রুটিনে যুক্ত হয়েছে!' : 'New class added!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  // Delete routine
  const handleDeleteRoutine = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && !window.confirm(isBn ? 'এই ক্লাসটি রুটিন থেকে মুছে ফেলতে চাও?' : 'Delete this class from routine?')) return;
    try {
      await api.delete(`/routines/${id}`);
      setRoutines((prev) => (Array.isArray(prev) ? prev.filter((r) => r.id !== id) : []));
      setSuccessMsg(isBn ? 'ক্লাস মুছে ফেলা হয়েছে' : 'Class removed from routine');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setRoutines((prev) => (Array.isArray(prev) ? prev.filter((r) => r.id !== id) : []));
    }
  };

  // 1-Click Load Routine Templates
  const handleApplyTemplate = (type: 'school_8' | 'school_5' | 'college_science' | 'college_commerce') => {
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

    const built = newItems.map((item, idx) => ({
      id: 'tmpl-' + Date.now() + '-' + idx,
      ...item,
      startsOn: new Date().toISOString().slice(0, 10),
    }));

    setRoutines((prev) => (Array.isArray(prev) ? [...built, ...prev.filter((r) => r.source !== built[0].source)] : built));
    setTemplateModalOpen(false);
    setSuccessMsg(isBn ? 'রুটিন টেমপ্লেট সফলভাবে লোড হয়েছে! 🌟' : 'Routine template loaded successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
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
                {isBn ? `${toBnNum(routines.length)} টি নির্ধারিত ক্লাস` : `${routines.length} Scheduled Classes`}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <span>{instInfo.classesHeading}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              {isBn
                ? 'সপ্তাহের প্রতিটি দিনের পিরিয়ড অনুযায়ী ক্লাসে কী পড়ানো হয়েছে তা সহজে লিখে বা মুখে বলে লগ করো।'
                : 'Follow your daily period-by-period routine and easily log what was taught in each class!'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setTemplateModalOpen(true)}
              className="rounded-2xl h-10 px-3.5 text-xs font-bold gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isBn ? 'রুটিন টেমপ্লেট' : 'Templates'}</span>
            </Button>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl shadow-md h-10 px-4 text-xs sm:text-sm gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isBn ? 'নতুন ক্লাস যোগ করুন' : 'Add Class'}</span>
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

        {/* Auto-Tomorrow Notification Banner */}
        {autoAdvancedToTomorrow && (
          <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold">
                  {isBn
                    ? 'আজকের সব ক্লাসের পড়া লগ সম্পন্ন হয়েছে! আগামীকালের রুটিন প্রদর্শিত হচ্ছে।'
                    : "All of today's classes have been logged! Showing tomorrow's schedule."}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {isBn
                    ? 'আগামীকালের ক্লাস রুটিন অনুযায়ী পড়ার প্রস্তুতি নাও।'
                    : 'Review upcoming classes and prepare your study materials for tomorrow.'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedWeekday(today.getDay());
                setSelectedDate(today.toISOString().slice(0, 10));
                setAutoAdvancedToTomorrow(false);
              }}
              className="h-8 text-xs font-bold border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-900 dark:text-emerald-100 shrink-0 rounded-xl"
            >
              {isBn ? 'আজকের রুটিন দেখুন' : "View Today's Routine"}
            </Button>
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
                  {isBn ? `${selectedWeekdayObj.fullBn} এর ক্লাস রুটিন` : `${selectedWeekdayObj.fullEn}'s Schedule`}
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
                  📚 {isBn ? 'প্রাইভেট ও কোচিং' : 'Tuition'}
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
                  📑 {isBn ? 'সব' : 'All'}
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
                      setSelectedDate(targetDate.toISOString().slice(0, 10));
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
                        {isBn ? 'আজ' : 'Today'}
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
                        ? isBn
                          ? `${toBnNum(countOnDay)} ক্লাস`
                          : `${countOnDay} cls`
                        : isBn
                        ? 'ছুটি'
                        : 'Off'}
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
                      {isBn
                        ? `${selectedWeekdayObj.fullBn} এর ক্লাসের অগ্রগতি`
                        : `${selectedWeekdayObj.fullEn} Class Log Progress`}
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
                    {isBn
                      ? `${toBnNum(loggedClassesToday)}/${toBnNum(totalClassesToday)} টি সম্পন্ন (${toBnNum(completionPercentage)}%)`
                      : `${loggedClassesToday}/${totalClassesToday} Logged (${completionPercentage}%)`}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {completionPercentage === 100
                    ? isBn
                      ? '🎉 চমৎকার! আজকের সবকটি ক্লাসের বিবরণী সফলভাবে লগ করা হয়েছে। তোমার স্ট্রিক পয়েন্ট বৃদ্ধি পেয়েছে!'
                      : '🎉 Awesome! All classes for this day have been logged. Keep up the high streak!'
                    : isBn
                    ? `বাকি আছে ${toBnNum(pendingClassesToday)} টি ক্লাস। প্রতিটি ক্লাসের পর নিচে "লগ দিন" বাটনে চাপ দিয়ে কী পড়ানো হয়েছে তা সংরক্ষণ করো।`
                    : `${pendingClassesToday} class(es) pending. Click "Log What Was Taught" after each class to protect your streak.`}
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
                  <span>{isBn ? `${toBnNum(completionPercentage)}% সম্পন্ন` : `${completionPercentage}% Done`}</span>
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
                {isBn
                  ? `${selectedWeekdayObj.fullBn} এর পিরিয়ডভিত্তিক ক্লাস ও বিবরণী`
                  : `Class-by-Class Schedule (${selectedWeekdayObj.fullEn})`}
              </span>
            </h2>

            <span className="text-xs text-muted-foreground font-medium">
              {isBn
                ? `মোট ${toBnNum(filteredRoutines.length)} টি পিরিয়ড`
                : `${filteredRoutines.length} Period(s) scheduled`}
            </span>
          </div>

          {filteredRoutines.length === 0 ? (
            <Card className="rounded-3xl border border-dashed p-8 text-center bg-muted/10">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/60 mb-3" />
              <h3 className="text-sm font-bold text-foreground">
                {isBn ? `${selectedWeekdayObj.fullBn} এ কোনো ক্লাস নির্ধারিত নেই` : `No classes scheduled for ${selectedWeekdayObj.fullEn}`}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {isBn
                  ? 'এই বারে তোমার স্কুল বা প্রাইভেট ক্লাসের রুটিন সেট করতে নিচের বাটনে ক্লিক করো অথবা টেমপ্লেট লোড করো।'
                  : 'Add a period or load a routine template to schedule classes for this weekday.'}
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTemplateModalOpen(true)}
                  className="rounded-xl text-xs gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isBn ? 'টেমপ্লেট দেখুন' : 'View Templates'}</span>
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
                  <span>{isBn ? 'এই বারে ক্লাস যোগ করুন' : 'Add Class for this day'}</span>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3.5">
              {filteredRoutines.map((routine, idx) => {
                const loggedEntry = findEntryForRoutine(routine);
                const isLogged = !!loggedEntry;
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
                              {routine.periodName || (isBn ? `${toBnNum(idx + 1)}ম পিরিয়ড` : `Period ${idx + 1}`)}
                            </Badge>

                            {/* Time Badge */}
                            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted/40 px-2.5 py-0.5 rounded-lg border">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span>{routine.startTime || '09:00'}</span>
                              <span>•</span>
                              <span>{isBn ? `${toBnNum(routine.durationMin || 45)} মিনিট` : `${routine.durationMin || 45}m`}</span>
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
                                ? isBn ? '🏫 স্কুল' : 'School'
                                : routine.source === 'college'
                                ? isBn ? '🏛️ কলেজ' : 'College'
                                : isBn ? '📚 প্রাইভেট/কোচিং' : 'Tuition'}
                            </Badge>

                            {/* Status Badge */}
                            {isLogged ? (
                              <Badge className="bg-emerald-500 text-white font-bold text-[10px] px-2 py-0.5 flex items-center gap-1 shadow-xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>{isBn ? 'লগ সম্পন্ন' : 'Logged'}</span>
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] font-bold border-amber-500/40 text-amber-600 bg-amber-500/10">
                                {isBn ? '⏳ লগ বাকি' : 'Pending Log'}
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
                                    • {isBn ? `কক্ষ: ${routine.room}` : `Room: ${routine.room}`}
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
                                  {isBn ? '📖 আজকের ক্লাসে যা পড়ানো হয়েছে:' : '📖 Topics Taught in this Class:'}
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
                                    <span className="font-bold">{isBn ? 'বাড়ির কাজ: ' : 'Homework: '}</span>
                                    <span>{loggedEntry.homeworkAssigned}</span>
                                  </div>
                                </div>
                              )}

                              {/* Understanding / Confidence Level */}
                              <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-500/15">
                                <span className="text-muted-foreground">
                                  {isBn ? 'বোঝার মাত্রা:' : 'Understanding:'}
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
                                {isBn
                                  ? 'এই ক্লাসে কী শেখানো হয়েছে তা এখনই ১ মিনিটে লিখে বা ভয়েসে বলে ফেলো!'
                                  : 'Log what was taught in this class to track your learning & keep your streak!'}
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
                                <span>{isBn ? 'বিবরণী এডিট' : 'Edit Log'}</span>
                              </Button>

                              <Link
                                href="/child/quiz"
                                className="flex-1 md:flex-none w-auto"
                              >
                                <Button
                                  size="sm"
                                  className="h-9 px-3 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-1 w-full"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>{isBn ? 'কুইজ দাও' : 'Quiz'}</span>
                                </Button>
                              </Link>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleOpenLogModal(routine)}
                              className="h-10 px-4 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm gap-2 w-full md:w-auto"
                            >
                              <BookOpen className="w-4 h-4" />
                              <span>{isBn ? 'ক্লাসের পড়া লগ দিন' : 'Log What Was Taught'}</span>
                              <Mic className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
                            </Button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleDeleteRoutine(routine.id, e)}
                            className="text-muted-foreground/60 hover:text-destructive p-1.5 rounded-lg transition-colors ml-auto md:ml-0"
                            title={isBn ? 'রুটিন থেকে সরান' : 'Remove routine'}
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
                    <span>{isBn ? 'সাপ্তাহিক পড়ার সময়কাল (বার চার্ট)' : 'Weekly Study Time Chart'}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {institutionType === 'college'
                      ? (isBn ? 'কলেজ ক্লাস, প্রাইভেট কোচিং ও সেলফ স্টাডির দৈনিক সময়কাল' : 'Daily hours spent across college lectures, tuition, and self-study')
                      : (isBn ? 'স্কুল ক্লাস, প্রাইভেট টিউশন ও সেলফ স্টাডির দৈনিক সময়কাল' : 'Daily hours spent across school classes, tuition, and self-study')}
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
                {isBn ? 'পড়ার সময়ের বিবরণী' : 'Study Hours Breakdown'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isBn ? 'সপ্তাহের মোট সময় কোন মাধ্যমে কতক্ষণ লেগেছে' : 'Time distribution across educational sources'}
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
                      <p className="text-xs font-bold text-foreground">{isBn ? 'কলেজ ক্লাসের সময়' : 'College Lecture Time'}</p>
                      <p className="text-[10px] text-muted-foreground">{isBn ? 'পিরিয়ডভিত্তিক একাডেমিক ক্লাস' : 'Academic periods'}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-cyan-600 dark:text-cyan-400">
                    {isBn ? `${toBnNum(collegeHours)}ঘ ${toBnNum(collegeRemMin)}মি` : `${collegeHours}h ${collegeRemMin}m`}
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
                      <p className="text-xs font-bold text-foreground">{isBn ? 'স্কুল ক্লাসের সময়' : 'School Class Time'}</p>
                      <p className="text-[10px] text-muted-foreground">{isBn ? 'স্কুল পিরিয়ডভিত্তিক ক্লাস' : 'Academic periods'}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                    {isBn ? `${toBnNum(schoolHours)}ঘ ${toBnNum(schoolRemMin)}মি` : `${schoolHours}h ${schoolRemMin}m`}
                  </span>
                </div>
              )}
              <div className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                    📚
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{institutionType === 'admission' ? (isBn ? 'এডমিশন কোচিং ও টেস্ট' : 'Admission Coaching') : (isBn ? 'প্রাইভেট ও কোচিং' : 'Tuition & Coaching')}</p>
                    <p className="text-[10px] text-muted-foreground">{isBn ? 'গৃহশিক্ষক ও প্রাইভেট ক্লাস' : 'Private lessons'}</p>
                  </div>
                </div>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  {isBn ? `${toBnNum(tuitionHours)}ঘ ${toBnNum(tuitionRemMin)}মি` : `${tuitionHours}h ${tuitionRemMin}m`}
                </span>
              </div>
              <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                    📖
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{isBn ? 'সেলফ-স্টাডি ও রিভিশন' : 'Self-Study & Revision'}</p>
                    <p className="text-[10px] text-muted-foreground">{isBn ? 'পড়ার টেবিলে স্ব-শিক্ষা' : 'Independent study'}</p>
                  </div>
                </div>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {isBn ? `${toBnNum(selfStudyHours)}ঘ ${toBnNum(selfStudyRemMin)}মি` : `${selfStudyHours}h ${selfStudyRemMin}m`}
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
              <span>{isBn ? 'রুটিন তৈরি ও পরিবর্তনের সহজ নিয়ম' : 'Helpful Schedule Tips'}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {isBn
                ? 'স্কুল বা কলেজের ক্লাস শেষ হওয়ার সাথে সাথে ১ ক্লিকে ভয়েস বা টেক্সট দিয়ে ক্লাসে যা পড়ানো হয়েছে তা জমা দাও। এটি অভিভাবকের ড্যাশবোর্ডে সাথে সাথে দেখতে পাওয়া যায়।'
                : 'Log lessons right after each class period. Your parents can track your consistency and AI prepares quizzes based on topics taught.'}
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
          isBn
            ? `ক্লাস বিবরণী লগ করুন: ${activeRoutineForLog?.periodName || 'ক্লাস'}`
            : `Log Class: ${activeRoutineForLog?.periodName || 'Period'}`
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
                  {isBn ? `${toBnNum(activeRoutineForLog.durationMin || 45)} মিনিট ক্লাস` : `${activeRoutineForLog.durationMin || 45} mins`}
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
                <span>{isBn ? 'মুখে বলে ক্লাসের পড়া দিন (ভয়েস ইনপুট)' : 'Voice Input (Speak to Log)'}</span>
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
                    <span>{isBn ? 'শুনছি... বলা থামান' : 'Listening... Stop'}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>{isBn ? 'মাইক্রোফোন চালু করুন' : 'Start Speaking'}</span>
                  </>
                )}
              </button>
              <span className="text-[11px] text-muted-foreground">
                {isListening
                  ? isBn
                    ? 'স্পষ্টভাবে বলো, টেক্সট বক্সে স্বয়ংক্রিয়ভাবে লেখা হবে...'
                    : 'Speaking now... text is being typed below'
                  : isBn
                  ? 'মুখে বললে নিচে সরাসরি লেখা হয়ে যাবে'
                  : 'Tap and speak to transcribe automatically'}
              </span>
            </div>

            {/* Quick Sample Voice Chips */}
            <div className="pt-1 flex flex-wrap gap-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground self-center">
                {isBn ? 'নমুনা:' : 'Sample:'}
              </span>
              <button
                type="button"
                onClick={() =>
                  setLogForm((p) => ({
                    ...p,
                    topicsText: isBn
                      ? 'আজকের ক্লাসে বীজগণিতের ৪.১ এর বর্গের সূত্রাবলি বুঝিয়েছেন এবং ১ থেকে ১০ নং অংক সমাধান করিয়েছেন।'
                      : 'Class 8 Math: Chapter 4 Algebraic Formulae (a+b)^2 and exercises 1 to 10 solved.',
                  }))
                }
                className="text-[10px] px-2 py-0.5 rounded-lg border bg-card hover:bg-muted text-foreground transition-colors"
              >
                {isBn ? 'গণিত বর্গের সূত্র ও অনুশীলন' : 'Math Formulas'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setLogForm((p) => ({
                    ...p,
                    topicsText: isBn
                      ? 'বিজ্ঞানের দ্বিতীয় অধ্যায়ের গতির ৩টি সমীকরণ ও ত্বরণ নির্ণয় বিস্তারিত আলোচনা হয়েছে।'
                      : 'Science: Equations of motion and acceleration calculation.',
                  }))
                }
                className="text-[10px] px-2 py-0.5 rounded-lg border bg-card hover:bg-muted text-foreground transition-colors"
              >
                {isBn ? 'বিজ্ঞান গতির সমীকরণ' : 'Science Motion'}
              </button>
            </div>
          </div>

          {/* Topics Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs font-bold text-foreground">
                {isBn ? 'আজ ক্লাসে কী কী পড়ানো হয়েছে? (আবশ্যক)' : 'What was taught in this class? (Required)'}
              </Label>
              <span className="text-[10px] text-muted-foreground">
                {isBn ? 'অধ্যায়, সূত্র বা অনুশীলনীর বিবরণ' : 'Chapter, topics, exercises'}
              </span>
            </div>
            <textarea
              value={logForm.topicsText}
              onChange={(e) => setLogForm({ ...logForm, topicsText: e.target.value })}
              placeholder={
                isBn
                  ? 'যেমন: অধ্যায় ৪ এর বীজগণিতীয় সূত্রাবলী ৪.১ বর্গের সূত্রাবলী প্রয়োগ ও ১ থেকে ১০ নং অংক সমাধান...'
                  : 'e.g. Chapter 4: Algebraic identities, solved problems 1 to 10...'
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
              {isBn ? 'বাড়ির কাজ বা অ্যাসাইনমেন্ট (যদি দিয়ে থাকেন)' : 'Homework / Assignment (Optional)'}
            </Label>
            <Input
              value={logForm.homeworkAssigned}
              onChange={(e) => setLogForm({ ...logForm, homeworkAssigned: e.target.value })}
              placeholder={isBn ? 'যেমন: অনুশীলনী ৪.১ এর ১১ থেকে ১৫ নং অংক খাতায় করে আনা' : 'e.g. Solve exercises 11 to 15 in notebook'}
              className="text-xs"
            />
          </div>

          {/* Confidence / Understanding Stars */}
          <div>
            <Label className="text-xs font-bold text-foreground block mb-1.5">
              {isBn ? 'ক্লাসের পড়া কেমন বুঝতে পেরেছ?' : 'How well did you understand this class?'}
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
              {isBn ? 'বাতিল' : 'Cancel'}
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
                  ? isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'
                  : isBn ? 'ক্লাসের পড়া অনুমোদন ও সংরক্ষণ করুন 🎉' : 'Approve & Save Class Log 🎉'}
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
        title={isBn ? 'রুটিনে নতুন ক্লাস বা পিরিয়ড যোগ করুন' : 'Add Class / Period to Schedule'}
        description={
          isBn
            ? 'তোমার স্কুল বা কলেজের সাপ্তাহিক ক্লাসের সময়সূচী সেট করো।'
            : 'Set up recurring classes for each weekday.'
        }
        maxWidth="md"
      >
        <form onSubmit={handleCreateRoutine} className="space-y-4 pt-1">
          {/* Quick Presets inside modal */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground mb-1 block">
              {isBn ? 'পরামর্শ / দ্রুত প্রিসেট নির্বাচন করুন:' : 'Quick Presets:'}
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
              <Label className="text-xs font-semibold">{isBn ? 'পিরিয়ড নাম' : 'Period Name'}</Label>
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
              <Label className="text-xs font-semibold">{isBn ? 'প্রতিষ্ঠান / উৎস' : 'Institution / Source'}</Label>
              <select
                value={routineForm.source}
                onChange={(e) => setRoutineForm({ ...routineForm, source: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border bg-background text-foreground"
              >
                {institutionType === 'school' && (
                  <option value="school">{isBn ? 'স্কুল (School)' : 'School'}</option>
                )}
                {institutionType === 'college' && (
                  <option value="college">{isBn ? 'কলেজ (College)' : 'College'}</option>
                )}
                <option value="tuition">{institutionType === 'admission' ? (isBn ? 'এডমিশন কোচিং / টেস্ট' : 'Admission Coaching') : (isBn ? 'প্রাইভেট / কোচিং' : 'Tuition / Coaching')}</option>
                <option value="self_study">{institutionType === 'admission' ? (isBn ? 'সেলফ স্টাডি ও প্রশ্নব্যাংক' : 'Self-Study & Question Bank') : (isBn ? 'সেলফ স্টাডি' : 'Self Study')}</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">{isBn ? 'ক্লাস / বিষয়ের নাম' : 'Class / Subject Name'}</Label>
            <Input
              value={routineForm.name}
              onChange={(e) => setRoutineForm({ ...routineForm, name: e.target.value })}
              placeholder={isBn ? 'যেমন: ৩য় পিরিয়ড: সাধারণ গণিত' : 'e.g. 3rd Period: General Mathematics'}
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">{isBn ? 'শিক্ষকের নাম (ঐচ্ছিক)' : 'Teacher Name'}</Label>
              <Input
                value={routineForm.teacher}
                onChange={(e) => setRoutineForm({ ...routineForm, teacher: e.target.value })}
                placeholder={isBn ? 'যেমন: আবুল হোসেন স্যার' : 'e.g. Kabir Sir'}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">{isBn ? 'রুম / ল্যাব (ঐচ্ছিক)' : 'Room / Lab'}</Label>
              <Input
                value={routineForm.room}
                onChange={(e) => setRoutineForm({ ...routineForm, room: e.target.value })}
                placeholder={isBn ? 'যেমন: রুম ৩০২' : 'e.g. Room 302'}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          {/* Weekday selector */}
          <div>
            <Label className="text-xs font-semibold block mb-1">
              {isBn ? 'সাপ্তাহিক দিনসমূহ (যে যে বারে ক্লাস হয়):' : 'Weekdays:'}
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
              <Label className="text-xs font-semibold">{isBn ? 'শুরুর সময়' : 'Start Time'}</Label>
              <Input
                type="time"
                value={routineForm.startTime}
                onChange={(e) => setRoutineForm({ ...routineForm, startTime: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">{isBn ? 'সময়কাল (মিনিট)' : 'Duration (mins)'}</Label>
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
              {isBn ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-primary text-primary-foreground font-bold">
              {loading ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'রুটিনে যোগ করুন' : 'Add to Schedule')}
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
        title={isBn ? 'বাংলাদেশি স্কুল ও কলেজ রুটিন টেমপ্লেট' : 'Schedule Templates'}
        description={
          isBn
            ? 'তোমার শ্রেণি বা বিভাগের প্রস্তুতকৃত সম্পূর্ণ রুটিন এক ক্লিকে লোড করো।'
            : 'Load a standard pre-built schedule for your grade in 1 click.'
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
                    {isBn ? 'অষ্টম শ্রেণি — পূর্ণাঙ্গ স্কুল রুটিন (Class 8)' : 'Class 8 High School Routine'}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {isBn ? '৬টি পিরিয়ড/দিন' : '6 Periods/Day'}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {isBn
                    ? 'রবি-বৃহস্পতি: বাংলা, ইংরেজি, সাধারণ গণিত, সাধারণ বিজ্ঞান, বিজিএস ও আইসিটি।'
                    : 'Sun-Thu: Bangla, English, Math, Science, BGS, ICT.'}
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
                    {isBn ? 'পঞ্চম শ্রেণি — প্রাথমিক বিদ্যালয় রুটিন (Class 5)' : 'Class 5 Primary School Routine'}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {isBn ? '৫টি পিরিয়ড/দিন' : '5 Periods/Day'}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {isBn
                    ? 'রবি-বৃহস্পতি: বাংলা, ইংরেজি, গণিত, প্রাথমিক বিজ্ঞান ও বাংলাদেশ ও বিশ্বপরিচয়।'
                    : 'Sun-Thu: Bangla, English, Math, Science, BGS.'}
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
                    {isBn ? 'এইচএসসি / কলেজ — বিজ্ঞান বিভাগ (HSC Science)' : 'HSC College Science Routine'}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {isBn ? '৫টি পিরিয়ড/দিন' : '5 Periods/Day'}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {isBn
                    ? 'রবি-বৃহস্পতি: পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত, জীববিজ্ঞান ও আইসিটি ল্যাব।'
                    : 'Sun-Thu: Physics, Chemistry, Higher Math, Biology, ICT.'}
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
                    {isBn ? 'এইচএসসি / কলেজ — ব্যবসায় শিক্ষা (HSC Commerce)' : 'HSC Commerce Routine'}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {isBn ? '৪টি পিরিয়ড/দিন' : '4 Periods/Day'}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {isBn
                    ? 'রবি-বৃহস্পতি: হিসাববিজ্ঞান, ব্যবসায় সংগঠন, ফিন্যান্স ও অর্থনীতি।'
                    : 'Sun-Thu: Accounting, Business, Finance, Economics.'}
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
                    {isBn ? 'মেডিকেল ও বিশ্ববিদ্যালয় এডমিশন প্রস্তুতি রুটিন' : 'Medical & Varsity Admission Routine'}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {isBn ? 'মডেল টেস্ট ও রিভিশন' : 'Mock Tests & Revision'}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {isBn
                    ? 'প্রতিদিন: জীববিজ্ঞান ও রসায়ন প্রশ্নব্যাংক, পদার্থবিজ্ঞান ম্যাথ সলভিং ও ডেইলি ফুল-লেংথ মডেল টেস্ট।'
                    : 'Daily: Biology & Chemistry Question Bank, Physics Math Solving, Full-length Mock Tests.'}
                </p>
              </button>
            </>
          )}
        </div>
      </Modal>
    </KidShell>
  );
}
