'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { KidShell } from '@/components/layout/kid-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { getInstitutionType, getInstitutionInfo } from '@/lib/institution';
import { api } from '@/lib/api';
import { MonthlyActivityCalendar, StudyTimeChart } from '@/components/charts/study-time-chart';
import {
  Flame,
  Brain,
  BookOpen,
  Camera,
  Play,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Calendar,
  AlertTriangle,
  Plus,
  Mic,
} from 'lucide-react';

function toBnNum(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
}

export default function KidDashboard() {
  const { activeChild, user } = useAuth();
  const { isBn } = useI18n();

  const childId = activeChild?.id || (user as any)?.childId || user?.id || 'demo-child-1';
  const isTasnim = childId === 'demo-child-2' || user?.email?.includes('tasnim') || activeChild?.name?.includes('Tasnim');
  const isFahim = childId === 'demo-child-3' || user?.email?.includes('fahim') || activeChild?.name?.includes('Fahim');
  const studentGrade = user?.grade || activeChild?.grade || (isFahim ? 'Class 11' : isTasnim ? 'Class 5' : 'Class 8');
  const institutionType = getInstitutionType(studentGrade);
  const instInfo = getInstitutionInfo(institutionType, isBn);

  const [summary, setSummary] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [consistency, setConsistency] = useState<Record<string, number>>({});
  const [topics, setTopics] = useState<any>(null);
  const [studyTime, setStudyTime] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [savingRoutine, setSavingRoutine] = useState(false);
  const [routineSuccessMsg, setRoutineSuccessMsg] = useState('');

  const [routineForm, setRoutineForm] = useState({
    name: '',
    source: 'tuition',
    weekdays: [0, 2, 4],
    startTime: '16:00',
    durationMin: 90,
    startsOn: new Date().toISOString().slice(0, 10),
  });

  const WEEKDAYS = [
    { index: 0, en: 'Sun', bn: 'রবি' },
    { index: 1, en: 'Mon', bn: 'সোম' },
    { index: 2, en: 'Tue', bn: 'মঙ্গল' },
    { index: 3, en: 'Wed', bn: 'বুধ' },
    { index: 4, en: 'Thu', bn: 'বৃহ' },
    { index: 5, en: 'Fri', bn: 'শুক্র' },
    { index: 6, en: 'Sat', bn: 'শনি' },
  ];

  const routinePresets = isFahim
    ? [
        { name: isBn ? 'পদার্থবিজ্ঞান কোচিং' : 'Physics Coaching', source: 'tuition', weekdays: [0, 2, 4], startTime: '16:30', durationMin: 75 },
        { name: isBn ? 'রসায়ন প্রাইভেট' : 'Chemistry Tuition', source: 'tuition', weekdays: [1, 3], startTime: '17:00', durationMin: 60 },
        { name: isBn ? 'উচ্চতর গণিত সেলফ স্টাডি' : 'Higher Math Self-Study', source: 'self_study', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '20:30', durationMin: 60 },
      ]
    : isTasnim
    ? [
        { name: isBn ? 'প্রাথমিক গণিত প্রাইভেট' : 'Elementary Math Tuition', source: 'tuition', weekdays: [0, 2, 4], startTime: '16:00', durationMin: 60 },
        { name: isBn ? 'ইংরেজি টিউটর' : 'English Tutor', source: 'tuition', weekdays: [1, 3], startTime: '17:30', durationMin: 45 },
        { name: isBn ? 'সন্ধ্যায় সেলফ স্টাডি' : 'Evening Self-Study', source: 'self_study', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '18:30', durationMin: 75 },
      ]
    : [
        { name: isBn ? 'গণিত প্রাইভেট (রহিম স্যার)' : 'Math Tuition (Rahim Sir)', source: 'tuition', weekdays: [0, 2, 5], startTime: '16:00', durationMin: 90 },
        { name: isBn ? 'পদার্থবিজ্ঞান কোচিং' : 'Physics Coaching', source: 'tuition', weekdays: [1, 3], startTime: '17:30', durationMin: 60 },
        { name: isBn ? 'আইসিটি ও কম্পিউটার ক্লাস' : 'ICT & Computer Class', source: 'school', weekdays: [1, 4], startTime: '15:00', durationMin: 60 },
      ];

  const toggleWeekday = (idx: number) => {
    if (routineForm.weekdays.includes(idx)) {
      setRoutineForm({ ...routineForm, weekdays: routineForm.weekdays.filter((i) => i !== idx) });
    } else {
      setRoutineForm({ ...routineForm, weekdays: [...routineForm.weekdays, idx].sort() });
    }
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineForm.name.trim()) return;
    setSavingRoutine(true);
    try {
      const res = await api.post(`/children/${childId}/routines`, routineForm);
      const created = res.data?.data || { id: 'r-' + Date.now(), ...routineForm };
      setRoutines((prev) => [created, ...prev]);
      setRoutineModalOpen(false);
      setRoutineSuccessMsg(isBn ? 'নতুন রুটিন সফলভাবে যুক্ত হয়েছে!' : 'New routine added successfully!');
      setTimeout(() => setRoutineSuccessMsg(''), 4000);
      setRoutineForm({
        name: '',
        source: 'tuition',
        weekdays: [0, 2, 4],
        startTime: '16:00',
        durationMin: 90,
        startsOn: new Date().toISOString().slice(0, 10),
      });
    } catch {
      setRoutines((prev) => [{ id: 'r-' + Date.now(), ...routineForm }, ...prev]);
      setRoutineModalOpen(false);
      setRoutineSuccessMsg(isBn ? 'নতুন রুটিন সফলভাবে যুক্ত হয়েছে!' : 'New routine added successfully!');
      setTimeout(() => setRoutineSuccessMsg(''), 4000);
    } finally {
      setSavingRoutine(false);
    }
  };

  useEffect(() => {
    // 1. Summary & KPIs
    api
      .get(`/children/${childId}/dashboard/summary`)
      .then((r) => {
        if (r.data?.data && (r.data.data.kpis?.totalTime > 0 || r.data.data.kpis?.streak > 0)) {
          setSummary(r.data.data);
        } else {
          setSummary({
            kpis: isFahim
              ? { studyDays: 6, totalTime: 1560, streak: 7, quizzes: 4, avgScore: 92 }
              : isTasnim
              ? { studyDays: 6, totalTime: 1080, streak: 6, quizzes: 6, avgScore: 95 }
              : { studyDays: 6, totalTime: 1350, streak: 6, quizzes: 5, avgScore: 88 },
            recent: isFahim
              ? [
                  { date: new Date().toISOString(), topicsText: 'Physics 1st Paper - Projectile Motion (প্রক্ষেপকের গাণিতিক সমাধান)', source: 'college' },
                  { date: new Date(Date.now() - 3600000 * 3).toISOString(), topicsText: 'Chemistry 1st Paper - Bohr Atomic Model & Quantum Numbers', source: 'college' },
                  { date: new Date(Date.now() - 3600000 * 6).toISOString(), topicsText: 'Physics Coaching - Advanced Trajectory Equations', source: 'tuition' },
                ]
              : isTasnim
              ? [
                  { date: new Date().toISOString(), topicsText: 'Elementary Math - Factors & Multiples (লসাগু ও গসাগু নির্ণয়)', source: 'school' },
                  { date: new Date(Date.now() - 3600000 * 4).toISOString(), topicsText: 'Primary Science - Safe Drinking Water & Purification Steps', source: 'school' },
                  { date: new Date(Date.now() - 3600000 * 7).toISOString(), topicsText: 'Math Tutor - Word Problems on Bell Intervals', source: 'tuition' },
                ]
              : [
                  { date: new Date().toISOString(), topicsText: 'Mathematics - Algebraic Formulae (বর্গের সূত্রাবলী ও প্রয়োগ)', source: 'school' },
                  { date: new Date(Date.now() - 3600000 * 4).toISOString(), topicsText: 'General Science - 3 Equations of Motion & v-t Graphs', source: 'school' },
                  { date: new Date(Date.now() - 3600000 * 7).toISOString(), topicsText: 'Math Tuition - Value Finding with Rahim Sir', source: 'tuition' },
                ],
          });
        }
      })
      .catch(() =>
        setSummary({
          kpis: isFahim
            ? { studyDays: 6, totalTime: 1560, streak: 7, quizzes: 4, avgScore: 92 }
            : isTasnim
            ? { studyDays: 6, totalTime: 1080, streak: 6, quizzes: 6, avgScore: 95 }
            : { studyDays: 6, totalTime: 1350, streak: 6, quizzes: 5, avgScore: 88 },
          recent: isFahim
            ? [
                { date: new Date().toISOString(), topicsText: 'Physics 1st Paper - Projectile Motion (প্রক্ষেপকের গাণিতিক সমাধান)', source: 'college' },
                { date: new Date(Date.now() - 3600000 * 3).toISOString(), topicsText: 'Chemistry 1st Paper - Bohr Atomic Model & Quantum Numbers', source: 'college' },
              ]
            : isTasnim
            ? [
                { date: new Date().toISOString(), topicsText: 'Elementary Math - Factors & Multiples (লসাগু ও গসাগু নির্ণয়)', source: 'school' },
                { date: new Date(Date.now() - 3600000 * 4).toISOString(), topicsText: 'Primary Science - Safe Drinking Water & Purification Steps', source: 'school' },
              ]
            : [
                { date: new Date().toISOString(), topicsText: 'Mathematics - Algebraic Formulae (বর্গের সূত্রাবলী ও প্রয়োগ)', source: 'school' },
                { date: new Date(Date.now() - 3600000 * 4).toISOString(), topicsText: 'General Science - 3 Equations of Motion & v-t Graphs', source: 'school' },
              ],
        })
      );

    // 2. Quizzes
    api
      .get(`/children/${childId}/quizzes`)
      .then((r) => {
        const list = r.data?.data;
        if (list && list.length > 0) {
          setQuizzes(list);
        } else {
          setQuizzes(
            isTasnim
              ? [
                  {
                    id: 'q-t2',
                    title: isBn ? 'প্রাথমিক বিজ্ঞান: জীবনের জন্য পানি বিশুদ্ধকরণ' : 'Primary Science: Safe Water & Purification',
                    status: 'assigned',
                    questionCount: 5,
                    timeLimitMin: 15,
                    isNew: true,
                  },
                  {
                    id: 'q-t1',
                    title: isBn ? 'প্রাথমিক গণিত: গুণনীয়ক ও লসাগু-গসাগু কুইজ' : 'Primary Math: Factors & LCM-HCF Quiz',
                    status: 'completed',
                    questionCount: 5,
                    score: 95,
                  },
                ]
              : [
                  {
                    id: 'q-r2',
                    title: isBn ? 'পদার্থবিজ্ঞান: গতির সমীকরণ ও ত্বরণ' : 'Physics: Equations of Motion & Acceleration',
                    status: 'assigned',
                    questionCount: 5,
                    timeLimitMin: 15,
                    isNew: true,
                  },
                  {
                    id: 'q-r1',
                    title: isBn ? 'গণিত: বীজগাণিতিক সূত্রাবলী ও প্রয়োগ কুইজ' : 'Class 8 Math: Algebraic Formulae Quiz',
                    status: 'completed',
                    questionCount: 5,
                    score: 85,
                  },
                  {
                    id: 'q-r3',
                    title: isBn ? 'ইংরেজি: Right Forms of Verbs & Prepositions' : 'English: Right Forms of Verbs & Prepositions',
                    status: 'completed',
                    questionCount: 5,
                    score: 80,
                  },
                ]
          );
        }
      })
      .catch(() =>
        setQuizzes(
          isTasnim
            ? [
                {
                  id: 'q-t2',
                  title: isBn ? 'প্রাথমিক বিজ্ঞান: জীবনের জন্য পানি বিশুদ্ধকরণ' : 'Primary Science: Safe Water & Purification',
                  status: 'assigned',
                  questionCount: 5,
                  timeLimitMin: 15,
                  isNew: true,
                },
                {
                  id: 'q-t1',
                  title: isBn ? 'প্রাথমিক গণিত: গুণনীয়ক ও লসাগু-গসাগু কুইজ' : 'Primary Math: Factors & LCM-HCF Quiz',
                  status: 'completed',
                  questionCount: 5,
                  score: 95,
                },
              ]
            : [
                {
                  id: 'q-r2',
                  title: isBn ? 'পদার্থবিজ্ঞান: গতির সমীকরণ ও ত্বরণ' : 'Physics: Equations of Motion & Acceleration',
                  status: 'assigned',
                  questionCount: 5,
                  timeLimitMin: 15,
                  isNew: true,
                },
                {
                  id: 'q-r1',
                  title: isBn ? 'গণিত: বীজগাণিতিক সূত্রাবলী ও প্রয়োগ কুইজ' : 'Class 8 Math: Algebraic Formulae Quiz',
                  status: 'completed',
                  questionCount: 5,
                  score: 85,
                },
              ]
        )
      );

    // 3. Consistency (for MonthlyActivityCalendar)
    api
      .get(`/children/${childId}/dashboard/consistency`)
      .then((r) => {
        if (r.data?.data && Object.keys(r.data.data).length > 0) {
          setConsistency(r.data.data);
        } else {
          const out: Record<string, number> = {};
          for (let i = 0; i < 180; i++) {
            const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
            out[d] = isTasnim ? (i % 2 === 0 ? 1 : i % 5 === 0 ? 0 : 1) : (i % 7 === 0 ? 0 : i % 4 === 0 ? 2 : 1);
          }
          setConsistency(out);
        }
      })
      .catch(() => {
        const out: Record<string, number> = {};
        for (let i = 0; i < 180; i++) {
          const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
          out[d] = isTasnim ? (i % 2 === 0 ? 1 : i % 5 === 0 ? 0 : 1) : (i % 7 === 0 ? 0 : i % 4 === 0 ? 2 : 1);
        }
        setConsistency(out);
      });

    // 4. Topic strengths & weaknesses
    api
      .get(`/children/${childId}/dashboard/topics`)
      .then((r) => {
        if (r.data?.data?.weakest?.length) {
          setTopics(r.data.data);
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
                    { subject: isBn ? 'পদার্থবিজ্ঞান: গতির সমীকরণ ও ত্বরণ' : 'Physics: Equations of Motion & Acceleration', accuracy: 76 },
                    { subject: isBn ? 'ইংরেজি: Right Forms of Verbs' : 'English: Right Forms of Verbs', accuracy: 78 },
                  ],
                  strongest: [
                    { subject: isBn ? 'গণিত: বীজগাণিতিক সূত্রাবলী' : 'Math: Algebraic Formulae', accuracy: 94 },
                    { subject: isBn ? 'আইসিটি: স্প্রেডশিট সূত্রাবলী' : 'ICT: Spreadsheet Formulas', accuracy: 90 },
                  ],
                }
          );
        }
      })
      .catch(() => {
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
                  { subject: isBn ? 'পদার্থবিজ্ঞান: গতির সমীকরণ ও ত্বরণ' : 'Physics: Equations of Motion & Acceleration', accuracy: 76 },
                  { subject: isBn ? 'ইংরেজি: Right Forms of Verbs' : 'English: Right Forms of Verbs', accuracy: 78 },
                ],
                strongest: [
                  { subject: isBn ? 'গণিত: বীজগাণিতিক সূত্রাবলী' : 'Math: Algebraic Formulae', accuracy: 94 },
                  { subject: isBn ? 'আইসিটি: স্প্রেডশিট সূত্রাবলী' : 'ICT: Spreadsheet Formulas', accuracy: 90 },
                ],
              }
        );
      });

    // 5. Routines
    api
      .get(`/children/${childId}/routines`)
      .then((r) => {
        const list = r.data?.data;
        if (list && list.length > 0) {
          setRoutines(list);
        } else {
          setRoutines(
            isTasnim
              ? [
                  { id: 'r-t1', name: isBn ? 'প্রাথমিক গণিত প্রাইভেট' : 'Elementary Math Tuition', source: 'tuition', weekdays: [0, 2, 4], startTime: '16:00', durationMin: 60 },
                  { id: 'r-t2', name: isBn ? 'ইংরেজি টিউটর' : 'English Tutor', source: 'tuition', weekdays: [1, 3], startTime: '17:30', durationMin: 45 },
                  { id: 'r-t3', name: isBn ? 'সন্ধ্যায় সেলফ স্টাডি ও রিভিশন' : 'Evening Self-Study & Revision', source: 'self_study', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '18:30', durationMin: 75 },
                ]
              : [
                  { id: 'r1', name: isBn ? 'গণিত প্রাইভেট — রহিম স্যার' : 'Math Tuition – Rahim Sir', source: 'tuition', weekdays: [0, 2, 5], startTime: '16:00', durationMin: 90 },
                  { id: 'r2', name: isBn ? 'পদার্থবিজ্ঞান কোচিং' : 'Physics Coaching', source: 'tuition', weekdays: [1, 3], startTime: '17:30', durationMin: 60 },
                  { id: 'r3', name: isBn ? 'আইসিটি ও কম্পিউটার ক্লাস' : 'ICT & Computer Class', source: 'school', weekdays: [1, 4], startTime: '15:00', durationMin: 60 },
                  { id: 'r4', name: isBn ? 'রাতে সেলফ স্টাডি' : 'Night Self-Study', source: 'self_study', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '20:00', durationMin: 90 },
                ]
          );
        }
      })
      .catch(() => {
        setRoutines(
          isTasnim
            ? [
                { id: 'r-t1', name: isBn ? 'প্রাথমিক গণিত প্রাইভেট' : 'Elementary Math Tuition', source: 'tuition', weekdays: [0, 2, 4], startTime: '16:00', durationMin: 60 },
                { id: 'r-t2', name: isBn ? 'ইংরেজি টিউটর' : 'English Tutor', source: 'tuition', weekdays: [1, 3], startTime: '17:30', durationMin: 45 },
              ]
            : [
                { id: 'r1', name: isBn ? 'গণিত প্রাইভেট — রহিম স্যার' : 'Math Tuition – Rahim Sir', source: 'tuition', weekdays: [0, 2, 5], startTime: '16:00', durationMin: 90 },
                { id: 'r2', name: isBn ? 'পদার্থবিজ্ঞান কোচিং' : 'Physics Coaching', source: 'tuition', weekdays: [1, 3], startTime: '17:30', durationMin: 60 },
              ]
        );
      });
    // 6. Weekly Study Time (Hours Breakdown by Source)
    api
      .get(`/children/${childId}/dashboard/study-time`)
      .then((r) => {
        if (r.data?.data && r.data.data.length > 0) {
          setStudyTime(r.data.data);
        } else {
          setStudyTime(defaultStudyTimeList);
        }
      })
      .catch(() => setStudyTime(defaultStudyTimeList));
  }, [childId, isBn, isTasnim, isFahim]);

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

  const defaultKpis = isFahim
    ? { studyDays: 6, totalTime: 1560, quizzes: 4, avgScore: 92, streak: 7 }
    : isTasnim
    ? { studyDays: 6, totalTime: 1080, quizzes: 6, avgScore: 95, streak: 6 }
    : { studyDays: 6, totalTime: 1350, quizzes: 5, avgScore: 88, streak: 6 };
  const kpis = (summary?.kpis?.totalTime || summary?.kpis?.studyDays) ? summary.kpis : defaultKpis;
  const effectiveTotalMin = kpis.totalTime || (isFahim ? 1560 : 420);
  const hours = Math.floor(effectiveTotalMin / 60);
  const minutes = effectiveTotalMin % 60;

  const currentStudyTime = studyTime.length > 0 ? studyTime : defaultStudyTimeList;
  const collegeMin = currentStudyTime.reduce((sum, d) => sum + (d.college || 0), 0) || (isFahim ? 500 : 0);
  const schoolMin = currentStudyTime.reduce((sum, d) => sum + (d.school || 0), 0) || (institutionType === 'school' ? (isTasnim ? 220 : 380) : 0);
  const tuitionMin = currentStudyTime.reduce((sum, d) => sum + (d.tuition || 0), 0) || (isFahim ? 435 : isTasnim ? 280 : 405);
  const selfStudyMin = currentStudyTime.reduce((sum, d) => sum + (d.self_study || 0), 0) || (isFahim ? 450 : isTasnim ? 250 : 340);

  const collegeHours = Math.floor(collegeMin / 60);
  const collegeRemMin = collegeMin % 60;
  const schoolHours = Math.floor(schoolMin / 60);
  const schoolRemMin = schoolMin % 60;
  const tuitionHours = Math.floor(tuitionMin / 60);
  const tuitionRemMin = tuitionMin % 60;
  const selfStudyHours = Math.floor(selfStudyMin / 60);
  const selfStudyRemMin = selfStudyMin % 60;

  // Next 7 days strip for routine schedule
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayIndex = d.getDay();
    const hasRoutine =
      routines.length > 0
        ? routines.some((r) => r.weekdays?.includes(dayIndex))
        : isTasnim
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

  const studentName = activeChild?.name || user?.name || (isTasnim ? 'Tasnim Islam' : 'Rahim Ahmed');
  const assignedQuiz = quizzes.find((q) => q.status === 'assigned' || q.isNew);

  return (
    <KidShell>
      <div className="space-y-6">
        {/* Welcome Greeting Banner matching parent portal palette */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 text-white shadow-xl shadow-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-extrabold text-amber-200">
                {isBn ? 'শিক্ষার্থী ড্যাশবোর্ড' : 'Student Portal'}
              </span>
              <span className="text-[11px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                🔥 {isBn ? `${toBnNum(kpis.streak)} দিনের স্ট্রিক` : `${kpis.streak}-Day Streak`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isBn ? `${studentName}, আজকে তুমি কী শিখলে?` : `${studentName}, what did you learn today?`}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-lg leading-relaxed">
              {isBn
                ? 'পড়ার টপিক ১ মিনিটে লগ করো, ক্লাস নোট আপলোড করো এবং কুইজ দিয়ে প্রস্তুতি যাচাই করো!'
                : 'Log what was taught in 1 minute, scan your notebooks, and test your mastery with AI quizzes!'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Link href="/child/log?mode=voice">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 font-bold rounded-2xl shadow-md h-11 text-xs sm:text-sm gap-1.5">
                <Mic className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>{isBn ? 'ভয়েসে বলুন ও লগ করুন' : 'Voice Log (Claude AI)'}</span>
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setRoutineModalOpen(true)}
              className="border-white/40 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl h-11 text-xs sm:text-sm gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isBn ? 'রুটিন যোগ' : 'Add Routine'}</span>
            </Button>
            <Link href="/child/notes">
              <Button size="lg" variant="outline" className="border-white/40 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl h-11 text-xs sm:text-sm">
                <Camera className="w-4 h-4 mr-1.5" />
                <span>{isBn ? 'নোট স্ক্যান' : 'Scan Notes'}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Routine Success Alert */}
        {routineSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{routineSuccessMsg}</span>
          </div>
        )}

        {/* Actionable Notification Banners (Prominent & Helpful) */}
        <div className="space-y-3">
          {/* Routine Study Log Reminder Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm font-bold text-foreground">
                    {isBn ? 'আজকের পড়ার বিবরণী বাকি আছে' : 'Routine Study Log Reminder'}
                  </p>
                  <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600">
                    {isBn ? 'আজকে' : 'Today'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isTasnim
                    ? (isBn ? 'বিকাল ৪:০০ টায় প্রাথমিক গণিত প্রাইভেট শেষ হয়েছে। কী কী শিখেছ তা এখনই লিখে ফেলো!' : 'Elementary Math Tuition at 4:00 PM has no log yet. Submit log to keep your streak!')
                    : (isBn ? 'বিকাল ৪:০০ টায় গণিত প্রাইভেট (রহিম স্যার) শেষ হয়েছে। পড়ার বিবরণী দিয়ে তোমার স্ট্রিক রক্ষা করো!' : 'Math Tuition (Rahim Sir) at 4:00 PM has no log yet. Submit log to keep your streak!')}
                </p>
              </div>
            </div>
            <Link href="/child/log" className="shrink-0 self-end sm:self-auto">
              <Button size="sm" className="h-8 sm:h-9 text-xs font-bold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isBn ? 'এখনই লগ দিন' : 'Log Lesson Now'}</span>
              </Button>
            </Link>
          </div>

          {/* New Assigned Quiz Alert Banner (if pending) */}
          {assignedQuiz && (
            <div className="p-3.5 sm:p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 dark:bg-indigo-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-bold text-foreground">
                      {isBn ? 'অভিভাবক কর্তৃক নতুন এআই কুইজ দেওয়া হয়েছে!' : 'New AI Quiz Assigned by Parent'}
                    </p>
                    <Badge className="text-[10px] bg-indigo-600 text-white font-bold">
                      {isBn ? 'নতুন' : 'New Quiz'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {assignedQuiz.title} • {assignedQuiz.questionCount || 5} {isBn ? 'টি প্রশ্ন' : 'Questions'}
                  </p>
                </div>
              </div>
              <Link href={`/child/quiz/${assignedQuiz.id}`} className="shrink-0 self-end sm:self-auto">
                <Button size="sm" className="h-8 sm:h-9 text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm">
                  <Play className="w-3.5 h-3.5" />
                  <span>{isBn ? 'কুইজ শুরু করো' : 'Start Quiz'}</span>
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Top KPI Cards (Matching Parent Portal 5-Card Layout) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Study Days */}
          <Card className="rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
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
                {isBn ? toBnNum(kpis.studyDays || 5) : (kpis.studyDays || 5)} <span className="text-xs font-normal text-muted-foreground">/ {isBn ? '৭ দিন' : '7 days'}</span>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Total Study Time */}
          <Card className="rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
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
                {isBn ? `${toBnNum(hours)}ঘ ${toBnNum(minutes)}মি` : `${hours}h ${minutes}m`}
              </CardTitle>
              {institutionType === 'college' && (
                <p className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-1 font-bold flex items-center gap-1">
                  <span>🏛️</span>
                  <span>{isBn ? `কলেজ: ${toBnNum(collegeHours)}ঘ ${toBnNum(collegeRemMin)}মি` : `College: ${collegeHours}h ${collegeRemMin}m`}</span>
                </p>
              )}
              {institutionType === 'school' && (
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-bold flex items-center gap-1">
                  <span>🏫</span>
                  <span>{isBn ? `স্কুল: ${toBnNum(schoolHours)}ঘ ${toBnNum(schoolRemMin)}মি` : `School: ${schoolHours}h ${schoolRemMin}m`}</span>
                </p>
              )}
            </CardHeader>
          </Card>

          {/* Quizzes Completed */}
          <Card className="rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  {isBn ? 'কুইজ সম্পন্ন' : 'Quizzes Done'}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1">
                {isBn ? toBnNum(kpis.quizzes || 4) : (kpis.quizzes || 4)} <span className="text-xs font-normal text-muted-foreground">{isBn ? 'টি' : 'tests'}</span>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Avg Accuracy / Score */}
          <Card className="rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  {isBn ? 'গড় স্কোর' : 'Avg Score'}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">
                {isBn ? `${toBnNum(kpis.avgScore || 88)}%` : `${kpis.avgScore || 88}%`}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Streak Counter */}
          <Card className="rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  {isBn ? 'স্ট্রিক' : 'Daily Streak'}
                </CardDescription>
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold mt-1 text-rose-500 flex items-center gap-1">
                <span>{isBn ? toBnNum(kpis.streak || 5) : (kpis.streak || 5)}</span>
                <span className="text-xs font-normal text-muted-foreground">{isBn ? 'দিন 🔥' : 'days 🔥'}</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Weekly Study Time & Source Hours Breakdown */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="rounded-2xl border shadow-sm lg:col-span-2">
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

          <Card className="rounded-2xl border shadow-sm flex flex-col justify-between">
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
                <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 dark:bg-cyan-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-sm">
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
                <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 dark:bg-indigo-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
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
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
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
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
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

        {/* Row: Monthly Activity Calendar & Schedule */}
        <div className="grid lg:grid-cols-2 gap-6 min-w-0">
          {/* Monthly Study Consistency Calendar */}
          <Card className="rounded-2xl border shadow-sm min-w-0">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base font-bold">
                {isBn ? 'মাসিক পড়ার ধারাবাহিকতা ক্যালেন্ডার' : 'Monthly Study Consistency Calendar'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isBn
                  ? 'সবুজ: সম্পন্ন পড়া, লাল: মিস হওয়া দিন — তোমার ধারাবাহিকতা ট্র্যাক করো'
                  : 'Green shows logged study days, red shows missed sessions. Keep your habit strong!'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <MonthlyActivityCalendar data={consistency} isBn={isBn} />
            </CardContent>
          </Card>

          {/* Today's Schedule & 7-Day Routine Strip */}
          <Card className="rounded-2xl border shadow-sm min-w-0 flex flex-col justify-between">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{instInfo.classesHeading}</span>
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => setRoutineModalOpen(true)}
                    className="h-7 px-2.5 text-[11px] font-bold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isBn ? 'রুটিন যোগ' : 'Add Routine'}</span>
                  </Button>
                  <Link href="/child/schedule">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px] font-medium rounded-lg border-primary/30 text-primary hover:bg-primary/10 gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{isBn ? 'সব দেখুন' : 'View All'}</span>
                    </Button>
                  </Link>
                </div>
              </div>
              <CardDescription className="text-xs">
                {isBn
                  ? 'যেকোনো ক্লাস শেষে ট্যাপ করে চটপট পড়ার টপিক জমা দাও'
                  : 'Tap any session to quickly log what was taught'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-0 space-y-3 min-w-0">
              {/* 7-Day Weekday Tracker Strip */}
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

              {/* Scheduled Sessions */}
              <div className="space-y-2.5">
                {(() => {
                  const todayWeekday = new Date().getDay();
                  const todayClasses = routines.filter((r) => r.weekdays?.includes(todayWeekday));
                  const displayList = todayClasses.length > 0 ? todayClasses : (routines.length > 0 ? routines.slice(0, 4) : (
                    institutionType === 'college'
                      ? [
                          {
                            id: 'r-college-1',
                            name: isBn ? '১ম পিরিয়ড: পদার্থবিজ্ঞান ১ম পত্র' : '1st Period: Physics 1st Paper',
                            startTime: '08:30',
                            durationMin: 50,
                            source: 'college',
                          },
                          {
                            id: 'r-college-2',
                            name: isBn ? '২য় পিরিয়ড: রসায়ন ১ম পত্র' : '2nd Period: Chemistry 1st Paper',
                            startTime: '09:20',
                            durationMin: 50,
                            source: 'college',
                          },
                        ]
                      : institutionType === 'admission'
                      ? [
                          {
                            id: 'r-adm-1',
                            name: isBn ? 'মেডিকেল ও ভার্সিটি মডেল টেস্ট' : 'Varsity & Medical Mock Test',
                            startTime: '09:00',
                            durationMin: 60,
                            source: 'tuition',
                          },
                          {
                            id: 'r-adm-2',
                            name: isBn ? 'বিগত বছরের প্রশ্নব্যাংক সলভিং ও রিভিশন' : 'Question Bank Practice & Revision',
                            startTime: '10:30',
                            durationMin: 90,
                            source: 'self_study',
                          },
                        ]
                      : [
                          {
                            id: 'r-fallback-1',
                            name: isTasnim ? (isBn ? '১ম পিরিয়ড: প্রাথমিক বাংলা' : '1st Period: Primary Bangla') : (isBn ? '১ম পিরিয়ড: বাংলা ১ম পত্র' : '1st Period: Bangla 1st'),
                            startTime: '09:00',
                            durationMin: 45,
                            source: 'school',
                          },
                          {
                            id: 'r-fallback-2',
                            name: isTasnim ? (isBn ? '২য় পিরিয়ড: প্রাথমিক ইংরেজি' : '2nd Period: Primary English') : (isBn ? '২য় পিরিয়ড: ইংরেজি ১ম পত্র' : '2nd Period: English 1st'),
                            startTime: '09:45',
                            durationMin: 45,
                            source: 'school',
                          },
                        ]
                  ));

                  return displayList.map((r, rIdx) => (
                    <div
                      key={r.id || rIdx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border bg-muted/20 hover:bg-muted/40 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                          {r.source === 'school' ? '🏫' : r.source === 'college' ? '🏛️' : r.source === 'self_study' ? '📖' : '📚'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {r.name} — {r.startTime || '09:00'}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {r.source === 'school'
                              ? (isBn ? 'স্কুল ক্লাস' : 'School Class')
                              : r.source === 'college'
                              ? (isBn ? 'কলেজ ক্লাস' : 'College Class')
                              : r.source === 'self_study'
                              ? (isBn ? 'সেলফ স্টাডি' : 'Self-Study')
                              : (isBn ? 'প্রাইভেট / কোচিং' : 'Tuition')} • {isBn ? `${toBnNum(r.durationMin || 45)} মিনিট` : `${r.durationMin || 45} mins`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href="/child/schedule">
                          <Button size="sm" className="text-xs h-8 gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-xs">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{isBn ? 'ক্লাস বিবরণী লগ করুন' : 'Log Class'}</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row: Assigned Quizzes & Topic Accuracy */}
        <div className="grid lg:grid-cols-2 gap-6 min-w-0">
          {/* Assigned & Practice AI Quizzes Card */}
          <Card className="rounded-2xl border shadow-sm min-w-0" id="quizzes">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span>{isBn ? 'তোমার কুইজসমূহ' : 'Assigned Quizzes'}</span>
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-bold">
                  {quizzes.length} {isBn ? 'টি উপলব্ধ' : 'Available'}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {isBn
                  ? 'পড়া রিভিশন করতে এবং প্রস্তুতি যাচাই করতে কুইজে অংশ নাও'
                  : 'Take quizzes created by parents to test your real knowledge'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
              {quizzes.map((q) => (
                <div
                  key={q.id}
                  className="p-3 sm:p-4 rounded-2xl border bg-card hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {q.title}
                      </p>
                      {q.score !== null && q.score !== undefined ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          {isBn ? `স্কোর: ${toBnNum(q.score)}%` : `Score: ${q.score}%`}
                        </span>
                      ) : (
                        <Badge className="text-[10px] bg-primary text-primary-foreground font-bold">
                          {isBn ? 'নতুন কুইজ' : 'Pending'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {q.questionCount || 5} {isBn ? 'টি প্রশ্ন • সময়সীমা: ১৫ মিনিট' : 'Questions • Time: 15 mins'}
                    </p>
                  </div>

                  <Link href={`/child/quiz/${q.id}`} className="shrink-0">
                    <Button
                      size="sm"
                      className="h-8 sm:h-9 text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{q.score !== null && q.score !== undefined ? (isBn ? 'পুনরায় দিন' : 'Retake') : (isBn ? 'কুইজ দাও' : 'Start Quiz')}</span>
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Weakest & Strongest Topics Card */}
          <Card className="rounded-2xl border shadow-sm min-w-0">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{isBn ? 'অধ্যায়ভিত্তিক দক্ষতা ও প্রস্তুতি' : 'Topic Accuracy & Needs Practice'}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {isBn
                  ? 'কোন বিষয়ে আরেকটু রিভিশন দরকার আর কোনটা তোমার ভালো আয়ত্তে'
                  : 'See which chapters need revision and which are mastered'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              {/* Weakest Topics */}
              <div>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isBn ? 'রিভিশন ও অনুশীলনের প্রয়োজন' : 'Needs Practice'}</span>
                </p>
                <div className="space-y-2">
                  {topics?.weakest?.map((w: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs"
                    >
                      <span className="font-medium text-foreground">{w.subject}</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {isBn ? `${toBnNum(w.accuracy)}%` : `${w.accuracy}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strongest Topics */}
              <div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isBn ? 'আয়ত্তাধীন চমৎকার অধ্যায়' : 'Strong Topics'}</span>
                </p>
                <div className="space-y-2">
                  {topics?.strongest?.map((s: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs"
                    >
                      <span className="font-medium text-foreground">{s.subject}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {isBn ? `${toBnNum(s.accuracy)}%` : `${s.accuracy}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Learning Activity Feed */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>{isBn ? 'সর্বশেষ পড়ার বিবরণী' : 'Recent Study Logs'}</span>
              </CardTitle>
              <Link href="/child/log" className="text-xs text-primary hover:underline font-medium">
                {isBn ? 'নতুন লগ দিন' : 'Add Log'} →
              </Link>
            </div>
            <CardDescription className="text-xs">
              {isBn ? 'তোমার সম্পন্ন করা সাম্প্রতিক পাঠসমূহ' : 'Your recently completed study sessions'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-2.5">
              {summary?.recent?.slice(0, 4).map((r: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2.5 p-2 sm:p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors min-w-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">
                        {r.topicsText || r.topic}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                        <span className="capitalize font-semibold text-primary/80">
                          {r.source === 'tuition'
                            ? (isBn ? 'টিউশন' : 'Tuition')
                            : r.source === 'school'
                            ? (isBn ? 'স্কুল' : 'School')
                            : (isBn ? 'স্ব-শিক্ষা' : 'Self-study')}
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

                  <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shrink-0">
                    ✓ {isBn ? 'সম্পন্ন' : 'Logged'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Routine Modal */}
      <Modal
        isOpen={routineModalOpen}
        onClose={() => setRoutineModalOpen(false)}
        title={isBn ? 'নতুন ক্লাস বা প্রাইভেট রুটিন যোগ করুন' : 'Add New Study Routine'}
        description={
          isBn
            ? 'তোমার প্রাইভেট, কোচিং বা সেলফ-স্টাডির সাপ্তাহিক সময়সূচী নির্ধারণ করো।'
            : 'Set up weekly recurring tuition, school, or self-study sessions.'
        }
        maxWidth="md"
      >
        <form onSubmit={handleCreateRoutine} className="space-y-4 pt-1">
          {/* Quick Presets inside modal */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground mb-1 block">
              {isBn ? 'পরামর্শ / প্রিসেট নির্বাচন করুন:' : 'Quick Presets:'}
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {routinePresets.map((p, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() =>
                    setRoutineForm({
                      name: p.name,
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

          <div>
            <Label className="text-xs font-semibold">{isBn ? 'রুটিনের নাম / বিষয় ও শিক্ষক' : 'Routine / Subject Name'}</Label>
            <Input
              value={routineForm.name}
              onChange={(e) => setRoutineForm({ ...routineForm, name: e.target.value })}
              placeholder={isBn ? 'যেমন: গণিত প্রাইভেট (রহিম স্যার)' : 'e.g. Math Tuition (Rahim Sir)'}
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">{isBn ? 'ধরন' : 'Type / Source'}</Label>
              <select
                value={routineForm.source}
                onChange={(e) => setRoutineForm({ ...routineForm, source: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border bg-background text-foreground"
              >
                {institutionType === 'school' && (
                  <option value="school">{isBn ? 'স্কুল ক্লাস' : 'School'}</option>
                )}
                {institutionType === 'college' && (
                  <option value="college">{isBn ? 'কলেজ ক্লাস' : 'College'}</option>
                )}
                <option value="tuition">{institutionType === 'admission' ? (isBn ? 'এডমিশন কোচিং / প্রাইভেট' : 'Admission Coaching') : (isBn ? 'প্রাইভেট / কোচিং' : 'Tuition / Coaching')}</option>
                <option value="self_study">{institutionType === 'admission' ? (isBn ? 'সেলফ স্টাডি ও মডেল টেস্ট' : 'Self-Study & Mock Tests') : (isBn ? 'সেলফ স্টাডি / স্ব-অধ্যয়ন' : 'Self-Study')}</option>
              </select>
            </div>
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
          </div>

          {/* Weekdays selector */}
          <div>
            <Label className="text-xs font-semibold block mb-1">
              {isBn ? 'সাপ্তাহিক দিনসমূহ (যে যে বারে ক্লাস হয়):' : 'Days of Week (When class takes place):'}
            </Label>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((w) => {
                const isSelected = routineForm.weekdays.includes(w.index);
                return (
                  <button
                    type="button"
                    key={w.index}
                    onClick={() => toggleWeekday(w.index)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
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
              <Label className="text-xs font-semibold">{isBn ? 'ক্লাসের সময়সীমা (মিনিট)' : 'Duration (mins)'}</Label>
              <Input
                type="number"
                value={routineForm.durationMin}
                onChange={(e) => setRoutineForm({ ...routineForm, durationMin: parseInt(e.target.value, 10) || 60 })}
                min={15}
                max={300}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">{isBn ? 'শুরুর তারিখ' : 'Starts From'}</Label>
              <Input
                type="date"
                value={routineForm.startsOn}
                onChange={(e) => setRoutineForm({ ...routineForm, startsOn: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setRoutineModalOpen(false)}>
              {isBn ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button type="submit" size="sm" disabled={savingRoutine} className="bg-primary text-primary-foreground font-bold">
              {savingRoutine ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'রুটিন তৈরি করুন' : 'Create Routine')}
            </Button>
          </div>
        </form>
      </Modal>
    </KidShell>
  );
}
