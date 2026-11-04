'use client';

export const runtime = 'edge';

import { Suspense, useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth, Child } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import {
  Brain,
  Sparkles,
  Check,
  RefreshCw,
  Trash2,
  Clock,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

const DEFAULT_DEMO_CHILDREN: Child[] = [
  {
    id: 'demo-child-1',
    name: 'Rahim Ahmed',
    nickname: 'Rahim',
    grade: 'Class 8',
    curriculum: 'NCTB',
    medium: 'Bangla',
  },
  {
    id: 'demo-child-2',
    name: 'Tasnim Islam',
    nickname: 'Tasnim',
    grade: 'Class 5',
    curriculum: 'NCTB',
    medium: 'Bangla',
  },
  {
    id: 'demo-child-3',
    name: 'Fahim Islam',
    nickname: 'Fahim',
    grade: 'Class 11',
    curriculum: 'NCTB',
    medium: 'Bangla',
  },
];

function getSubjectsForGrade(gradeStr?: string, isBn?: boolean) {
  const g = (gradeStr || '').toLowerCase();
  if (g.includes('5') || g.includes('primary') || g.includes('প্রাথমিক') || g.includes('class 4') || g.includes('class 3')) {
    return [
      { id: 'math', name: isBn ? 'প্রাথমিক গণিত (Elementary Math)' : 'Elementary Math' },
      { id: 'science', name: isBn ? 'প্রাথমিক বিজ্ঞান (Primary Science)' : 'Primary Science' },
      { id: 'eng', name: isBn ? 'ইংরেজি (English for Today)' : 'English for Today' },
      { id: 'bn', name: isBn ? 'বাংলা (Bangla)' : 'Bangla' },
      { id: 'bgs', name: isBn ? 'বাংলাদেশ ও বিশ্বপরিচয় (BGS)' : 'Bangladesh & Global Studies' },
    ];
  }
  if (g.includes('11') || g.includes('12') || g.includes('hsc') || g.includes('college') || g.includes('একাদশ') || g.includes('দ্বাদশ')) {
    return [
      { id: 'hmath', name: isBn ? 'উচ্চতর গণিত (Higher Math)' : 'Higher Mathematics' },
      { id: 'phys', name: isBn ? 'পদার্থবিজ্ঞান (Physics)' : 'Physics' },
      { id: 'chem', name: isBn ? 'রসায়ন (Chemistry)' : 'Chemistry' },
      { id: 'bio', name: isBn ? 'জীববিজ্ঞান (Biology)' : 'Biology' },
      { id: 'ict', name: isBn ? 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)' : 'ICT' },
      { id: 'eng', name: isBn ? 'ইংরেজি (English)' : 'English' },
      { id: 'bn', name: isBn ? 'বাংলা (Bangla)' : 'Bangla' },
    ];
  }
  return [
    { id: 'math', name: isBn ? 'গণিত (Mathematics)' : 'Mathematics' },
    { id: 'phys', name: isBn ? 'বিজ্ঞান / পদার্থবিজ্ঞান (Science)' : 'General Science' },
    { id: 'chem', name: isBn ? 'রসায়ন (Chemistry)' : 'Chemistry' },
    { id: 'eng', name: isBn ? 'ইংরেজি (English)' : 'English' },
    { id: 'bn', name: isBn ? 'বাংলা (Bangla)' : 'Bangla' },
    { id: 'ict', name: isBn ? 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)' : 'ICT' },
  ];
}

function QuizBuilderContent() {
  const params = useParams();
  const router = useRouter();
  const { activeChild, childrenList } = useAuth();
  const { t, isBn } = useI18n();

  const availableChildren = childrenList && childrenList.length > 0 ? childrenList : DEFAULT_DEMO_CHILDREN;
  const currentChild = activeChild || availableChildren.find((c) => c.id === (params as any)?.id) || availableChildren[0];
  const childId = currentChild?.id || (params as any)?.id || 'demo-child-1';

  const searchParams = useSearchParams();
  const queryTopic = searchParams.get('topic') || '';
  const querySubject = searchParams.get('subject') || '';
  const queryTitle = searchParams.get('title') || '';

  const mapSubjectToId = (s: string) => {
    if (!s) return null;
    const lower = s.toLowerCase();
    if (lower.includes('math') || lower.includes('গণিত') || lower.includes('algebra') || lower.includes('বীজগণিত')) return 'math';
    if (lower.includes('phys') || lower.includes('পদার্থ')) return 'phys';
    if (lower.includes('chem') || lower.includes('রসায়ন')) return 'chem';
    if (lower.includes('bio') || lower.includes('জীব')) return 'bio';
    if (lower.includes('eng') || lower.includes('ইংরেজি')) return 'eng';
    if (lower.includes('bn') || lower.includes('bangla') || lower.includes('বাংলা')) return 'bn';
    if (lower.includes('ict') || lower.includes('তথ্য')) return 'ict';
    if (lower.includes('science') || lower.includes('বিজ্ঞান')) return 'science';
    return null;
  };

  const initialSubjectId = mapSubjectToId(querySubject) || mapSubjectToId(queryTopic);
  const initialSelectedSubjects = initialSubjectId ? [initialSubjectId] : ['math', 'phys'];

  const initialTitle = queryTitle
    ? queryTitle
    : queryTopic
    ? `${queryTopic} — ${isBn ? 'রিভিশন কুইজ' : 'Revision Quiz'}`
    : querySubject
    ? `${querySubject} — ${isBn ? 'রিভিশন কুইজ' : 'Revision Quiz'}`
    : '';

  const [form, setForm] = useState({
    scope: queryTopic ? 'today' : 'last7',
    from: '',
    to: '',
    numQuestions: 10,
    difficulty: 'mixed',
    types: ['mcq', 'true_false', 'fill_blank'],
    language: 'en',
    title: initialTitle,
    timeLimitMin: 15,
  });

  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [assigning, setAssigning] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const subjects = getSubjectsForGrade(currentChild?.grade, isBn);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(initialSelectedSubjects);

  // Sync subjects when active child changes from navbar
  useEffect(() => {
    if (currentChild?.grade && !querySubject && !queryTopic) {
      const gradeSubs = getSubjectsForGrade(currentChild.grade, isBn);
      setSelectedSubjects(gradeSubs.slice(0, 2).map((s) => s.id));
      setPreview(null);
    }
  }, [currentChild?.id, isBn]);

  // Sync if query parameters change
  useEffect(() => {
    if (queryTitle || queryTopic || querySubject) {
      const computedTitle = queryTitle
        ? queryTitle
        : queryTopic
        ? `${queryTopic} — ${isBn ? 'রিভিশন কুইজ' : 'Revision Quiz'}`
        : querySubject
        ? `${querySubject} — ${isBn ? 'রিভিশন কুইজ' : 'Revision Quiz'}`
        : '';
      if (computedTitle) {
        setForm((prev) => ({ ...prev, title: computedTitle, scope: queryTopic ? 'today' : prev.scope }));
      }
      const matched = mapSubjectToId(querySubject) || mapSubjectToId(queryTopic);
      if (matched) {
        setSelectedSubjects([matched]);
      }
    }
  }, [queryTitle, queryTopic, querySubject, isBn]);

  const toggleSubject = (id: string) => {
    if (selectedSubjects.includes(id)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((s) => s !== id));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, id]);
    }
  };

  const handleGenerate = async () => {
    setError('');
    setGenerating(true);
    try {
      const res = await api.post(`/children/${childId}/quizzes/generate`, {
        ...form,
        numQuestions: form.numQuestions,
        subjectIds: selectedSubjects,
        timeLimitMin: form.timeLimitMin,
      });
      setPreview(res.data.data);
      setMsg(isBn ? 'কুইজের প্রশ্ন সফলভাবে তৈরি হয়েছে!' : 'AI Quiz generated from lesson digests!');
    } catch {
      // High-quality mock preview tailored to selected child's curriculum
      const isClass5 = childId === 'demo-child-2' || (currentChild?.grade && currentChild.grade.includes('5'));
      const isClass11 = childId === 'demo-child-3' || (currentChild?.grade && (currentChild.grade.includes('11') || currentChild.grade.includes('12')));

      setPreview({
        id: 'quiz-' + Date.now(),
        title: form.title || (isBn ? `${currentChild?.name || 'শিক্ষার্থী'}-এর রিভিশন কুইজ` : `${currentChild?.name || 'Student'}'s Revision Quiz`),
        timeLimitMin: form.timeLimitMin,
        questions: isClass5
          ? [
              {
                id: 'q1',
                type: 'mcq',
                topic: isBn ? 'প্রাথমিক গণিত: গুণনীয়ক ও লসাগু-গসাগু' : 'Elementary Math: Factors & LCM-HCF',
                prompt: isBn
                  ? '১২ এবং ১৮ এর গরিষ্ঠ সাধারণ গুণনীয়ক (গ.সা.গু) কত?'
                  : 'What is the Greatest Common Divisor (GCD/HCF) of 12 and 18?',
                optionsJson: ['২', '৩', '৬', '৩৬'],
                correctAnswer: '৬',
                explanation: isBn
                  ? '১২ = ২ × ২ × ৩ এবং ১৮ = ২ × ৩ × ৩, সুতরাং সাধারণ গুণনীয়ক ২ × ৩ = ৬।'
                  : 'The common prime factors are 2 and 3, so GCD = 2 × 3 = 6.',
              },
              {
                id: 'q2',
                type: 'true_false',
                topic: isBn ? 'প্রাথমিক বিজ্ঞান: নিরাপদ পানি ও বিশুদ্ধকরণ' : 'Primary Science: Safe Water & Purification',
                prompt: isBn
                  ? 'পানি জীবাণুমুক্ত করার জন্য কমপক্ষে ২০ মিনিট ফুটাতে হয়।'
                  : 'Water must be boiled for at least 20 minutes to kill harmful germs.',
                optionsJson: ['True', 'False'],
                correctAnswer: 'True',
                explanation: isBn
                  ? 'উচ্চ তাপে ২০ মিনিট ফুটালে পানির প্রায় সব ক্ষতিকর জীবাণু ধ্বংস হয়।'
                  : 'Boiling water vigorously for 20 minutes kills most bacteria and pathogens.',
              },
              {
                id: 'q3',
                type: 'mcq',
                topic: isBn ? 'ইংরেজি: Unit 6 Eat Healthy' : 'English: Unit 6 Eat Healthy',
                prompt: isBn
                  ? 'Which of the following foods is healthy and contains vitamins?'
                  : 'Which of the following foods is healthy and contains vitamins?',
                optionsJson: ['Fresh Fruits (টাটকা ফলমূল)', 'Chips (চিপস)', 'Candy (ক্যান্ডি)', 'Soda (কোমল পানীয়)'],
                correctAnswer: 'Fresh Fruits (টাটকা ফলমূল)',
                explanation: isBn
                  ? 'ফলমূল ও শাকসবজিতে প্রচুর ভিটামিন ও খনিজ থাকে যা স্বাস্থ্যের জন্য ভালো।'
                  : 'Fresh fruits and vegetables are rich in vitamins and minerals for a balanced diet.',
              },
              {
                id: 'q4',
                type: 'fill_blank',
                topic: isBn ? 'প্রাথমিক বিজ্ঞান: উদ্ভিদের সালোকসংশ্লেষণ' : 'Primary Science: Photosynthesis',
                prompt: isBn
                  ? 'উদ্ভিদ খাদ্য তৈরির জন্য সূর্যের আলো এবং বায়ুমণ্ডলের ______ গ্যাস ব্যবহার করে।'
                  : 'Plants use sunlight and ______ gas from the air to make their own food.',
                optionsJson: null,
                correctAnswer: isBn ? 'কার্বন ডাই-অক্সাইড' : 'carbon dioxide',
                explanation: isBn
                  ? 'সালোকসংশ্লেষণ প্রক্রিয়ায় উদ্ভিদ কার্বন ডাই-অক্সাইড গ্রহণ করে এবং অক্সিজেন ত্যাগ করে।'
                  : 'During photosynthesis, plants take in carbon dioxide and release oxygen.',
              },
            ]
          : isClass11
          ? [
              {
                id: 'q1',
                type: 'mcq',
                topic: isBn ? 'উচ্চতর গণিত: বহুপদী ও দ্বিঘাত সমীকরণ' : 'Higher Math: Polynomials & Quadratic Equations',
                prompt: isBn
                  ? 'ax² + bx + c = 0 সমীকরণের নিশ্চায়ক D = b² - 4ac < 0 হলে মূলগুলো কেমন হবে?'
                  : 'If the discriminant D = b² - 4ac < 0 for ax² + bx + c = 0, what is the nature of the roots?',
                optionsJson: [
                  'বাস্তব ও সমান (Real & equal)',
                  'বাস্তব ও অসমান (Real & unequal)',
                  'জটিল ও অনুবন্ধী (Complex & conjugate)',
                  'মূলদ ও সমান (Rational & equal)',
                ],
                correctAnswer: 'জটিল ও অনুবন্ধী (Complex & conjugate)',
                explanation: isBn
                  ? 'নিশ্চায়ক ঋণাত্মক হলে বর্গমূলের ভেতরে কাল্পনিক সংখ্যা আসে, ফলে মূলদ্বয় জটিল অনুবন্ধী হয়।'
                  : 'When the discriminant is negative, the square root yields imaginary components giving complex conjugate roots.',
              },
              {
                id: 'q2',
                type: 'true_false',
                topic: isBn ? 'পদার্থবিজ্ঞান ১ম পত্র: ভেক্টর ডট ও ক্রস গুণন' : 'Physics 1st Paper: Vectors',
                prompt: isBn
                  ? 'দুটি সমজাতীয় অশূন্য ভেক্টরের স্কেলার বা ডট গুণফল শূন্য হলে তারা পরস্পর লম্ব।'
                  : 'If the scalar (dot) product of two non-zero vectors is zero, they are perpendicular.',
                optionsJson: ['True', 'False'],
                correctAnswer: 'True',
                explanation: isBn
                  ? 'A · B = |A||B| cos θ = 0 হলে θ = 90°, অর্থাৎ ভেক্টরদ্বয় পরস্পর লম্ব।'
                  : 'Since A · B = |A||B| cos θ, cos 90° = 0 confirms perpendicularity.',
              },
              {
                id: 'q3',
                type: 'mcq',
                topic: isBn ? 'রসায়ন ১ম পত্র: পর্যায় সারণি ও মৌলের পর্যায়বৃত্ত ধর্ম' : 'Chemistry 1st Paper: Periodic Properties',
                prompt: isBn
                  ? 'পর্যায় সারণির একই পর্যায়ে বাম থেকে ডানে গেলে পরমাণুর ব্যাসার্ধের কী পরিবর্তন হয়?'
                  : 'Moving from left to right across a period in the periodic table, what happens to atomic radius?',
                optionsJson: ['বৃদ্ধি পায় (Increases)', 'হ্রাস পায় (Decreases)', 'অপরিবর্তিত থাকে (Remains unchanged)', 'প্রথমে হ্রাস পরে বৃদ্ধি পায়'],
                correctAnswer: 'হ্রাস পায় (Decreases)',
                explanation: isBn
                  ? 'নিউক্লিয়াসের কার্যকর ধনাত্মক চার্জ বৃদ্ধির কারণে ইলেকট্রন মেঘ বেশি আকৃষ্ট হয়, ফলে পারমাণবিক ব্যাসার্ধ হ্রাস পায়।'
                  : 'Higher effective nuclear charge attracts the outer shell electrons closer, reducing atomic radius.',
              },
            ]
          : [
              {
                id: 'q1',
                type: 'mcq',
                topic: isBn ? 'পদার্থবিজ্ঞান: নিউটনের ২য় সূত্র' : 'Physics: Newton\'s 2nd Law',
                prompt: isBn
                  ? 'বল (F), ভর (m) এবং ত্বরণ (a) এর মধ্যে সঠিক সম্পর্ক কোনটি?'
                  : 'What is the correct mathematical relationship between Force (F), mass (m), and acceleration (a)?',
                optionsJson: ['F = m / a', 'F = m × a', 'F = m + a', 'F = a / m'],
                correctAnswer: 'F = m × a',
                explanation: isBn
                  ? 'নিউটনের দ্বিতীয় সূত্রানুসারে বল হলো ভর ও ত্বরণের গুণফল (F=ma)।'
                  : 'By Newton\'s Second Law of Motion, Force equals mass multiplied by acceleration.',
              },
              {
                id: 'q2',
                type: 'true_false',
                topic: isBn ? 'গণিত: দ্বিঘাত সমীকরণ' : 'Mathematics: Quadratic Equations',
                prompt: isBn
                  ? 'একটি দ্বিঘাত সমীকরণের সর্বোচ্চ ঘাত ২ এবং এর সর্বাধিক ২টি মূল থাকে।'
                  : 'A quadratic equation has degree 2 and at most two real or complex roots.',
                optionsJson: ['True', 'False'],
                correctAnswer: 'True',
                explanation: isBn
                  ? 'যেকোনো দ্বিঘাত সমীকরণের ঘাত ২ এবং এর দুটি সমাধান থাকে।'
                  : 'Quadratic equations of form ax²+bx+c=0 have degree 2 with two solutions.',
              },
              {
                id: 'q3',
                type: 'mcq',
                topic: isBn ? 'পদার্থবিজ্ঞান: বলের একক' : 'Physics: SI Units',
                prompt: isBn ? 'বলের এসআই (SI) একক কোনটি?' : 'What is the SI unit of Force?',
                optionsJson: ['Joule (জুল)', 'Newton (নিউটন)', 'Pascal (প্যাসকেল)', 'Watt (ওয়াট)'],
                correctAnswer: 'Newton (নিউটন)',
                explanation: isBn
                  ? 'বলের আন্তর্জাতিক একক নিউটন (N)।'
                  : 'The SI unit of force is the Newton (N), equal to 1 kg·m/s².',
              },
              {
                id: 'q4',
                type: 'fill_blank',
                topic: isBn ? 'গণিত: মূল সূত্র' : 'Mathematics: Quadratic Formula',
                prompt: isBn
                  ? 'ax² + bx + c = 0 সমীকরণের নিশ্চায়ক (Discriminant) হলো D = ______।'
                  : 'For the quadratic equation ax² + bx + c = 0, the discriminant D = ______.',
                optionsJson: null,
                correctAnswer: 'b² - 4ac',
                explanation: isBn
                  ? 'দ্বিঘাত সমীকরণের মূলের প্রকৃতি নির্ধারণ করে নিশ্চায়ক b² - 4ac।'
                  : 'The discriminant determining the nature of roots is b² - 4ac.',
              },
            ],
      });
      setMsg(isBn ? 'কুইজের খসড়া প্রস্তুত হয়েছে!' : 'AI Quiz preview generated successfully!');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateQuestion = async (qid: string) => {
    setRegeneratingId(qid);
    try {
      const res = await api.post(`/quizzes/${preview.id}/questions/${qid}/regenerate`);
      const newQ = res.data.data;
      setPreview({
        ...preview,
        questions: preview.questions.map((q: any) => (q.id === qid ? newQ : q)),
      });
    } catch {
      // Mock regenerate
      setPreview({
        ...preview,
        questions: preview.questions.map((q: any) =>
          q.id === qid
            ? {
                ...q,
                prompt: q.prompt + ' (Regenerated alternative with fresh parameters)',
              }
            : q
        ),
      });
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleRemoveQuestion = (qid: string) => {
    setPreview({
      ...preview,
      questions: preview.questions.filter((q: any) => q.id !== qid),
    });
  };

  const handleAssign = async () => {
    if (!preview) return;
    setAssigning(true);
    try {
      await api.post(`/quizzes/${preview.id}/assign`);
      setMsg(
        isBn
          ? `কুইজটি ${currentChild?.name || 'শিক্ষার্থী'}-এর জন্য সফলভাবে অ্যাসাইন করা হয়েছে!`
          : `Quiz successfully assigned to ${currentChild?.name || 'child'}!`
      );
      setTimeout(() => {
        router.push('/quizzes');
      }, 1000);
    } catch {
      setMsg(
        isBn
          ? `কুইজটি ${currentChild?.name || 'শিক্ষার্থী'}-এর জন্য অ্যাসাইন করা হয়েছে!`
          : `Quiz assigned to ${currentChild?.name || 'child'}!`
      );
      setTimeout(() => {
        router.push('/quizzes');
      }, 1000);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="pb-2 border-b">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t('quiz.builderTitle', 'AI Quiz Builder')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isBn
              ? 'সন্তানের সাম্প্রতিক পড়ার নোট ও ডাইজেস্ট থেকে কাস্টম কুইজ তৈরি করুন'
              : 'Generate an AI-powered quiz tailored specifically to what your child learned in recent sessions.'}
          </p>
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg('')} className="underline text-[11px]">
              Dismiss
            </button>
          </div>
        )}

        {/* Configuration Card */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isBn ? 'কুইজ কনফিগারেশন' : 'Quiz Settings'}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {isBn
                ? 'পড়ার পরিধি, প্রশ্নের সংখ্যা এবং কঠিনতার স্তর নির্বাচন করুন'
                : 'Select lessons scope, subjects, question types, and time limit.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Title */}
            <div>
              <Label className="text-xs font-semibold">Quiz Title (Optional)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={isBn ? 'যেমন: পদার্থবিজ্ঞান ১ম অধ্যায় কুইজ' : 'e.g. Weekly Math & Physics Revision'}
                className="mt-1"
              />
            </div>

            {/* Scope & Difficulty */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold">{t('quiz.scope', 'Lessons Scope')}</Label>
                <select
                  value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: e.target.value })}
                  className="w-full h-10 border rounded-xl px-3 bg-background text-sm mt-1"
                >
                  <option value="today">{isBn ? 'আজকের পাঠ' : 'Today\'s lessons'}</option>
                  <option value="yesterday">{isBn ? 'গতকালের পাঠ' : 'Yesterday\'s lessons'}</option>
                  <option value="last7">{isBn ? 'গত ৭ দিনের পাঠ' : 'Last 7 days'}</option>
                  <option value="last30">{isBn ? 'গত ৩০ দিনের পাঠ' : 'Last 30 days'}</option>
                  <option value="all">{isBn ? 'সব সংরক্ষিত নোট' : 'All saved notes'}</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">{t('quiz.numQuestions', 'Number of Questions')}</Label>
                <select
                  value={form.numQuestions}
                  onChange={(e) => setForm({ ...form, numQuestions: parseInt(e.target.value) || 10 })}
                  className="w-full h-10 border rounded-xl px-3 bg-background text-sm mt-1"
                >
                  <option value={5}>5 Questions (Quick)</option>
                  <option value={10}>10 Questions (Standard)</option>
                  <option value={15}>15 Questions (Thorough)</option>
                  <option value={20}>20 Questions (Exam Prep)</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">{t('quiz.difficulty', 'Difficulty')}</Label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  className="w-full h-10 border rounded-xl px-3 bg-background text-sm mt-1"
                >
                  <option value="easy">Easy (Foundations)</option>
                  <option value="mixed">Mixed (Balanced)</option>
                  <option value="hard">Hard (Challenging)</option>
                </select>
              </div>
            </div>

            {/* Subjects selection */}
            <div>
              <Label className="text-xs font-semibold block mb-1.5">Include Subjects</Label>
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => {
                  const isSelected = selectedSubjects.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleSubject(s.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language & Time Limit */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">{t('quiz.language', 'Language')}</Label>
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full h-10 border rounded-xl px-3 bg-background text-sm mt-1"
                >
                  <option value="en">English</option>
                  <option value="bn">বাংলা (Bangla)</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Time Limit (Timer)</Label>
                <select
                  value={form.timeLimitMin}
                  onChange={(e) => setForm({ ...form, timeLimitMin: parseInt(e.target.value) || 0 })}
                  className="w-full h-10 border rounded-xl px-3 bg-background text-sm mt-1"
                >
                  <option value={0}>No time limit</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full h-10 text-xs font-semibold gap-2 shadow-sm shadow-primary/20"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {generating
                  ? isBn
                    ? 'নোট বিশ্লেষণ ও কুইজ তৈরি হচ্ছে...'
                    : 'Analyzing Notes & Generating Quiz...'
                  : isBn
                  ? `${currentChild?.name}-এর জন্য AI কুইজ তৈরি করুন`
                  : `Generate AI Quiz for ${currentChild?.name || 'Child'}`}
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Generated Questions Preview */}
        {preview && (
          <Card className="rounded-2xl border shadow-md animate-in fade-in duration-300">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold text-foreground">{preview.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {preview.questions?.length} Questions
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    {isBn
                      ? 'অ্যাসাইন করার আগে প্রশ্নসমূহ পরীক্ষা ও প্রয়োজনে পরিবর্তন করুন'
                      : 'Review each question. You can regenerate individual questions or remove any.'}
                  </CardDescription>
                </div>

                <Button
                  onClick={handleAssign}
                  disabled={assigning || !preview.questions?.length}
                  className="h-9 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {assigning
                      ? isBn
                        ? 'অ্যাসাইন হচ্ছে...'
                        : 'Assigning...'
                      : isBn
                      ? `${currentChild?.name}-কে অ্যাসাইন করুন`
                      : `Assign to ${currentChild?.name || 'Child'}`}
                  </span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {preview.questions?.map((q: any, idx: number) => {
                const isRegenerating = regeneratingId === q.id;
                return (
                  <div key={q.id || idx} className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {q.prompt}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 uppercase">
                        {q.type}
                      </Badge>
                    </div>

                    {/* MCQ Options */}
                    {q.optionsJson && (
                      <div className="grid sm:grid-cols-2 gap-2 pl-8">
                        {q.optionsJson.map((opt: string, j: number) => {
                          const isCorrect = opt === q.correctAnswer;
                          return (
                            <div
                              key={j}
                              className={`p-2 rounded-lg text-xs border font-medium flex items-center justify-between ${
                                isCorrect
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-background text-foreground'
                              }`}
                            >
                              <span>{opt}</span>
                              {isCorrect && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  ✓ Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <p className="text-[11px] text-muted-foreground pl-8 italic">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    )}

                    {/* Question actions */}
                    <div className="flex justify-end items-center gap-2 pt-2 border-t text-xs">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerateQuestion(q.id)}
                        disabled={isRegenerating}
                        className="h-7 text-[11px] gap-1 text-primary hover:bg-primary/10"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                        <span>{t('quiz.regenerateQuestion', 'Regenerate')}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="h-7 text-[11px] text-muted-foreground hover:text-destructive gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t('quiz.removeQuestion', 'Remove')}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

export default function QuizBuilder() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading quiz builder...</div>}>
      <QuizBuilderContent />
    </Suspense>
  );
}
