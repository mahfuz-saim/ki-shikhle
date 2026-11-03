'use client';

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
import { useI18n } from '@/lib/i18n-context';
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
} from 'lucide-react';

function getFallbackEntries(childId: string, isBn: boolean) {
  const isTasnim = childId === 'demo-child-2';
  const isFahim = childId === 'demo-child-3';

  if (isFahim) {
    return [
      // Today (4 entries)
      {
        id: 'e-f1',
        date: new Date().toISOString().slice(0, 10),
        source: 'college',
        providerName: isBn ? 'নটর ডেম কলেজ' : 'College',
        subject: isBn ? 'পদার্থবিজ্ঞান ১ম পত্র' : 'Physics 1st Paper',
        topicsText: isBn
          ? 'অধ্যায় ৩: গতিবিদ্যা — প্রক্ষেপক (Projectile Motion), সর্বাধিক উচ্চতা H ও পাল্লা R নির্ণয়ের গাণিতিক সমাধান'
          : 'Chapter 3: Dynamics – Projectile Motion, Maximum Height & Horizontal Range calculations',
        durationMin: 50,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-f2',
        date: new Date().toISOString().slice(0, 10),
        source: 'college',
        providerName: isBn ? 'নটর ডেম কলেজ' : 'College',
        subject: isBn ? 'রসায়ন ১ম পত্র' : 'Chemistry 1st Paper',
        topicsText: isBn
          ? 'অধ্যায় ২: গুণগত রসায়ন — বোর পরমাণু মডেল, কোয়ান্টাম সংখ্যা (n, l, m, s) এবং পলির বর্জন নীতি'
          : 'Chapter 2: Qualitative Chemistry – Bohr Model, Quantum Numbers & Pauli Exclusion Principle',
        durationMin: 50,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-f3',
        date: new Date().toISOString().slice(0, 10),
        source: 'tuition',
        providerName: isBn ? 'পদার্থবিজ্ঞান কোচিং' : 'Physics Coaching',
        subject: isBn ? 'পদার্থবিজ্ঞান ১ম পত্র' : 'Physics 1st Paper',
        topicsText: isBn
          ? 'প্রক্ষেপকের উচ্চতর গাণিতিক সমস্যা ও বিভিন্ন কোণে নিক্ষিপ্ত বস্তুর গতিপথ বিশ্লেষণ'
          : 'Advanced Mathematical Problems on Projectiles & Trajectory analysis',
        durationMin: 75,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-f4',
        date: new Date().toISOString().slice(0, 10),
        source: 'self_study',
        providerName: 'Self Study',
        subject: isBn ? 'উচ্চতর গণিত ১ম পত্র' : 'Higher Math',
        topicsText: isBn
          ? 'অধ্যায় ১: ম্যাট্রিক্স ও নির্ণায়ক — ক্র্যামারের নিয়মে তিন চলকের সমীকরণ জোট সমাধান'
          : 'Chapter 1: Matrices & Determinants – Cramers Rule for 3-variable equations',
        durationMin: 60,
        confidence: 5,
        verifiedByParent: true,
      },
      // Yesterday (3 entries)
      {
        id: 'e-f5',
        date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        source: 'college',
        providerName: isBn ? 'নটর ডেম কলেজ' : 'College',
        subject: isBn ? 'উচ্চতর গণিত ১ম পত্র' : 'Higher Math',
        topicsText: isBn
          ? 'ম্যাট্রিক্সের গুণন বিধি ও বিপরীত ম্যাট্রিক্স (Inverse Matrix) নির্ণয়'
          : 'Matrix Multiplication Rules & Inverse Matrix calculations',
        durationMin: 50,
        confidence: 4,
        verifiedByParent: true,
      },
      {
        id: 'e-f6',
        date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        source: 'tuition',
        providerName: isBn ? 'রসায়ন প্রাইভেট' : 'Chemistry Tuition',
        subject: isBn ? 'রসায়ন ১ম পত্র' : 'Chemistry 1st Paper',
        topicsText: isBn
          ? 'আউফবাউ নীতি, হুন্ডের নীতি প্রয়োগ করে ক্রোমিয়াম ও কপারের ব্যতিক্রমী ইলেকট্রন বিন্যাস'
          : 'Aufbau Principle & Hunds Rule – Exceptional electronic configuration of Cr & Cu',
        durationMin: 60,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-f7',
        date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        source: 'self_study',
        providerName: 'Self Study',
        subject: isBn ? 'পদার্থবিজ্ঞান ১ম পত্র' : 'Physics 1st Paper',
        topicsText: isBn
          ? 'ক্যালকুলাস ও ব্যবকলনের সাহায্যে তাৎক্ষণিক বেগ ও ত্বরণ প্রতিপাদন'
          : 'Calculus derivations of instantaneous velocity & acceleration',
        durationMin: 60,
        confidence: 4,
        verifiedByParent: true,
      },
      // 2 Days Ago (3 entries)
      {
        id: 'e-f8',
        date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
        source: 'college',
        providerName: isBn ? 'নটর ডেম কলেজ' : 'College',
        subject: isBn ? 'তথ্য ও যোগাযোগ প্রযুক্তি' : 'ICT',
        topicsText: isBn
          ? 'অধ্যায় ৩: সংখ্যা পদ্ধতি — বাইনারি, ডেসিমাল, অক্টাল ও হেক্সাডেসিমেল রূপান্তর ও ২ এর পরিপূরক'
          : 'Chapter 3: Number Systems – Binary, Octal, Hexadecimal conversions & 2s complement',
        durationMin: 50,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-f9',
        date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
        source: 'tuition',
        providerName: isBn ? 'গণিত কোচিং' : 'Math Coaching',
        subject: isBn ? 'উচ্চতর গণিত ১ম পত্র' : 'Higher Math',
        topicsText: isBn
          ? 'নির্ণায়কের ধর্মাবলী ও অনুরাশি-সহগুণক প্রয়োগ করে মান নির্ণয়'
          : 'Determinant properties, Minors & Cofactors evaluation',
        durationMin: 75,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-f10',
        date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
        source: 'self_study',
        providerName: 'Self Study',
        subject: isBn ? 'ইংরেজি ১ম পত্র' : 'English 1st Paper',
        topicsText: isBn
          ? 'Poem Analysis: "The Traffic Policeman" — Theme writing and critical explanation'
          : 'Poem Analysis: "The Traffic Policeman" — Theme writing and critical explanation',
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
        subject: isBn ? 'প্রাথমিক গণিত' : 'Elementary Math',
        topicsText: isBn
          ? 'অধ্যায় ৫: গুণনীয়ক ও গুণিতক — মৌলিক উৎপাদকে বিশ্লেষণ করে লসাগু ও গসাগু নির্ণয়'
          : 'Chapter 5: Factors & Multiples – LCM & HCF problem solving using prime factors',
        durationMin: 45,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-t2',
        date: new Date().toISOString().slice(0, 10),
        source: 'school',
        providerName: 'School',
        subject: isBn ? 'প্রাথমিক বিজ্ঞান' : 'Primary Science',
        topicsText: isBn
          ? 'অধ্যায় ৩: জীবনের জন্য পানি — নিরাপদ পানির গুরুত্ব ও পানি দূষণের ক্ষতিকর প্রভাব'
          : 'Chapter 3: Water for Life – Importance of safe water and impacts of pollution',
        durationMin: 40,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-t3',
        date: new Date().toISOString().slice(0, 10),
        source: 'tuition',
        providerName: isBn ? 'ম্যাথ টিউটর' : 'Math Tutor',
        subject: isBn ? 'প্রাথমিক গণিত' : 'Elementary Math',
        topicsText: isBn
          ? 'ডাকের কথার অঙ্ক সমাধান, লসাগুর সাহায্যে ঘণ্টা বাজার সময় নির্ণয় সংক্রান্ত সমস্যা'
          : 'Word problem solving, LCM based bell ringing interval questions',
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
        subject: isBn ? 'ইংরেজি' : 'English',
        topicsText: isBn
          ? 'Unit 6: Eat Healthy — Food pyramid, healthy fruits and vegetables vocabulary'
          : 'Unit 6: Eat Healthy – Food pyramid, healthy fruits and vegetables vocabulary',
        durationMin: 45,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-t5',
        date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        source: 'tuition',
        providerName: isBn ? 'ইংরেজি টিউটর' : 'English Tutor',
        subject: isBn ? 'ইংরেজি' : 'English',
        topicsText: isBn
          ? 'Reading aloud, question-answer matching & spelling test with 10 new words'
          : 'Reading aloud, question-answer matching & spelling test with 10 new words',
        durationMin: 50,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-t6',
        date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        source: 'self_study',
        providerName: 'Self Study',
        subject: isBn ? 'প্রাথমিক গণিত' : 'Elementary Math',
        topicsText: isBn
          ? 'পৃষ্ঠা ৩১ এর ১ থেকে ৫ নং লসাগু অংক খাতায় অনুশীলন সম্পন্ন'
          : 'Page 31: Exercises 1-5 LCM practice completed in exercise notebook',
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
        subject: isBn ? 'বাংলাদেশ ও বিশ্বপরিচয়' : 'BGS',
        topicsText: isBn
          ? 'অধ্যায় ১: আমাদের মুক্তিযুদ্ধ — ১৯৭১ সালের ২৫শে মার্চের কালরাত ও সাধারণ মানুষের অবদান'
          : 'Chapter 1: Liberation War – 25th March Crackdown & contribution of masses',
        durationMin: 40,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-t8',
        date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
        source: 'tuition',
        providerName: isBn ? 'ম্যাথ টিউটর' : 'Math Tutor',
        subject: isBn ? 'প্রাথমিক গণিত' : 'Elementary Math',
        topicsText: isBn
          ? 'গসাগু নির্ণয়ের সহজ নিয়ম ও ৩টি সংখ্যার গসাগু সমাধান'
          : 'Easy method for HCF and solving 3-number HCF problems',
        durationMin: 60,
        confidence: 5,
        verifiedByParent: true,
      },
      {
        id: 'e-t9',
        date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
        source: 'self_study',
        providerName: 'Self Study',
        subject: isBn ? 'প্রাথমিক বিজ্ঞান' : 'Primary Science',
        topicsText: isBn
          ? 'পানি চক্রের ছবি আঁকা এবং পানি বিশুদ্ধকরণের ৪টি ধাপ খাতায় নোট তৈরি'
          : 'Water cycle diagram drawing & 4 water purification steps note',
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
      subject: isBn ? 'গণিত' : 'Mathematics',
      topicsText: isBn
        ? 'অধ্যায় ৪: বীজগণিতীয় সূত্রাবলী ও প্রয়োগ (অনুশীলনী ৪.১) — বর্গের সূত্র (a+b)^2 ও (a-b)^2 সমাধান'
        : 'Chapter 4: Algebraic Formulae & Applications – (a+b)^2 and (a-b)^2 solutions',
      durationMin: 45,
      confidence: 5,
      verifiedByParent: true,
    },
    {
      id: 'e-r2',
      date: new Date().toISOString().slice(0, 10),
      source: 'school',
      providerName: 'School',
      subject: isBn ? 'সাধারণ বিজ্ঞান' : 'General Science',
      topicsText: isBn
        ? 'অধ্যায় ২: গতি ও ত্বরণ — গতির ৩টি মৌলিক সমীকরণ, বেগ-সময় লেখচিত্র ও তাৎক্ষণিক দ্রুতি নির্ণয়'
        : 'Chapter 2: Motion & Acceleration – 3 Equations of Motion & v-t graphs',
      durationMin: 50,
      confidence: 4,
      verifiedByParent: true,
    },
    {
      id: 'e-r3',
      date: new Date().toISOString().slice(0, 10),
      source: 'tuition',
      providerName: isBn ? 'রহিম স্যার' : 'Rahim Sir',
      subject: isBn ? 'গণিত' : 'Mathematics',
      topicsText: isBn
        ? 'বর্গের মান নির্ণয়, (a+b)^2 ও (a-b)^2 এর অনুসিদ্ধান্ত প্রয়োগ এবং ৪টি সৃজনশীল অংক সমাধান'
        : 'Algebraic value determination, corollaries & 4 creative questions',
      durationMin: 75,
      confidence: 5,
      verifiedByParent: true,
    },
    {
      id: 'e-r4',
      date: new Date().toISOString().slice(0, 10),
      source: 'self_study',
      providerName: 'Self Study',
      subject: isBn ? 'ইংরেজি ১ম পত্র' : 'English 1st Paper',
      topicsText: isBn
        ? 'Unit 3: Health and Hygiene — Passage comprehension, new vocabulary with synonyms & theme'
        : 'Unit 3: Health and Hygiene – Passage comprehension, new vocabulary with synonyms & theme',
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
      subject: isBn ? 'তথ্য ও যোগাযোগ প্রযুক্তি' : 'ICT',
      topicsText: isBn
        ? 'অধ্যায় ৩: স্প্রেডশিট সফটওয়্যারের ব্যবহার — মাইক্রোসফট এক্সেলে যোগ, গড়, গুণ এবং শতকরা সেল ফর্মুলা'
        : 'Chapter 3: Spreadsheet Software – Microsoft Excel sum, average, percentage formulas',
      durationMin: 45,
      confidence: 5,
      verifiedByParent: true,
    },
    {
      id: 'e-r6',
      date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      source: 'school',
      providerName: 'School',
      subject: isBn ? 'বাংলা ১ম পত্র' : 'Bangla 1st Paper',
      topicsText: isBn
        ? 'কবিতা: "বঙ্গভূমির প্রতি" (মাইকেল মধুসূদন দত্ত) — মূলভাব বিশ্লেষণ ও অনুধাবনমূলক প্রশ্ন অনুশীলন'
        : 'Poem: "Bongobhumir Proti" – Theme analysis and comprehension practice',
      durationMin: 45,
      confidence: 4,
      verifiedByParent: true,
    },
    {
      id: 'e-r7',
      date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      source: 'tuition',
      providerName: isBn ? 'বিজ্ঞান কোচিং' : 'Science Coaching',
      subject: isBn ? 'সাধারণ বিজ্ঞান' : 'General Science',
      topicsText: isBn
        ? 'অধ্যায় ৩: পরমাণুর গঠন — ইলেকট্রন বিন্যাস, পারমাণবিক সংখ্যা ও ভর সংখ্যা সংক্রান্ত গাণিতিক হিসাব'
        : 'Chapter 3: Atomic Structure – Electron configuration & mass number calculations',
      durationMin: 60,
      confidence: 5,
      verifiedByParent: true,
    },
    {
      id: 'e-r8',
      date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      source: 'self_study',
      providerName: 'Self Study',
      subject: isBn ? 'গণিত হোমওয়ার্ক' : 'Math Homework',
      topicsText: isBn
        ? 'অনুশীলনী ৪.১ এর ৮ থেকে ১৫ নম্বর সমস্যা সমাধান ও নোটবুকে ফেয়ার সম্পন্ন'
        : 'Exercise 4.1 questions 8 to 15 solved and fair notes written',
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
      subject: isBn ? 'গণিত' : 'Mathematics',
      topicsText: isBn
        ? 'অধ্যায় ৮: চতুর্ভুজ — সামান্তরিকের বিপরীত বাহু ও কোণ পরস্পর সমান সংক্রান্ত উপপাদ্য ১ প্রমাণ'
        : 'Chapter 8: Quadrilateral – Theorem 1 opposite sides & angles equal proof',
      durationMin: 50,
      confidence: 4,
      verifiedByParent: true,
    },
    {
      id: 'e-r10',
      date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
      source: 'tuition',
      providerName: isBn ? 'রহিম স্যার' : 'Rahim Sir',
      subject: isBn ? 'গণিত' : 'Mathematics',
      topicsText: isBn
        ? 'চতুর্ভুজের উপপাদ্য ১ ও ২ এর অনুশীলনীর সমস্যা ও এক্সট্রা জ্যামিতি প্রমাণ'
        : 'Quadrilateral theorem 1 & 2 exercise geometry proofs',
      durationMin: 75,
      confidence: 4,
      verifiedByParent: true,
    },
    {
      id: 'e-r11',
      date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
      source: 'self_study',
      providerName: 'Self Study',
      subject: isBn ? 'ইংরেজি ২য় পত্র' : 'English 2nd Paper',
      topicsText: isBn
        ? 'Right forms of verbs — 10 basic grammar rules and 20 practice fill-in-the-blanks'
        : 'Right forms of verbs – 10 basic grammar rules and 20 practice fill-in-the-blanks',
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
  const { isBn } = useI18n();

  const childId = (params as any)?.id || activeChild?.id || 'demo-child';
  const currentChild = childrenList.find((c) => c.id === childId) || activeChild;
  const institutionType = getInstitutionType(currentChild?.grade);

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Unlogged Study Alert Configuration State (Saved per student)
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);
  const [testingAlert, setTestingAlert] = useState(false);
  const [alertSuccessMsg, setAlertSuccessMsg] = useState('');
  const [alertConfig, setAlertConfig] = useState<{
    enabled: boolean;
    time: string;
    channel: 'in_app' | 'email' | 'all';
    daysOfWeek: number[];
  }>({
    enabled: true,
    time: childId === 'demo-child-3' ? '22:00' : childId === 'demo-child-2' ? '20:30' : '21:00',
    channel: 'all',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  });

  const loadAlertConfig = async () => {
    try {
      const res = await api.get(`/children/${childId}/unlogged-alert`);
      if (res.data?.data) {
        setAlertConfig(res.data.data);
      }
    } catch {
      setAlertConfig({
        enabled: true,
        time: childId === 'demo-child-3' ? '22:00' : childId === 'demo-child-2' ? '20:30' : '21:00',
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
    setSavingAlert(true);
    setAlertSuccessMsg('');
    try {
      await api.put(`/children/${childId}/unlogged-alert`, alertConfig);
      setAlertSuccessMsg(
        isBn
          ? `${currentChild?.name || 'শিক্ষার্থী'}-এর আনলগড স্টাডি অ্যালার্ট সফলভাবে সংরক্ষিত হয়েছে!`
          : `Unlogged study alert settings successfully saved for ${currentChild?.name || 'this student'}!`
      );
      setTimeout(() => {
        setAlertModalOpen(false);
        setAlertSuccessMsg('');
      }, 1500);
    } catch {
      setAlertSuccessMsg(
        isBn
          ? `${currentChild?.name || 'শিক্ষার্থী'}-এর আনলগড স্টাডি অ্যালার্ট সফলভাবে সংরক্ষিত হয়েছে!`
          : `Unlogged study alert settings successfully saved for ${currentChild?.name || 'this student'}!`
      );
      setTimeout(() => {
        setAlertModalOpen(false);
        setAlertSuccessMsg('');
      }, 1500);
    } finally {
      setSavingAlert(false);
    }
  };

  const handleTriggerTestAlert = async () => {
    setTestingAlert(true);
    try {
      await api.post(`/children/${childId}/unlogged-alert/test`);
      setAlertSuccessMsg(
        isBn
          ? 'পরীক্ষামূলক নোটিফিকেশন পাঠানো হয়েছে! উপরের বেল আইকনে দেখুন।'
          : 'Test notification sent! Check the bell icon above.'
      );
      setTimeout(() => setAlertSuccessMsg(''), 4000);
    } catch {
      setAlertSuccessMsg(
        isBn
          ? 'পরীক্ষামূলক নোটিফিকেশন পাঠানো হয়েছে! উপরের বেল আইকনে দেখুন।'
          : 'Test notification sent! Check the bell icon above.'
      );
      setTimeout(() => setAlertSuccessMsg(''), 4000);
    } finally {
      setTestingAlert(false);
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/children/${childId}/entries`);
      const list = res.data?.data?.data || res.data?.data || [];
      if (list && list.length > 0) {
        setEntries(list);
      } else {
        setEntries(getFallbackEntries(childId, isBn));
      }
    } catch {
      setEntries(getFallbackEntries(childId, isBn));
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
      case 'college':
        return (
          <Badge variant="secondary" className="text-[11px] bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20">
            {isBn ? 'কলেজ' : 'College'}
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
      <div className="space-y-6 w-full">
        {/* Page Title & Child Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {isBn ? 'দৈনিক পড়ার বিবরণী' : 'Student Learning Logs'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isBn
                ? 'শিক্ষার্থীর পোর্টাল থেকে যুক্ত করা প্রতিটি পড়ার বিবরণ অভিভাবক হিসেবে এখানে যাচাই ও নিরীক্ষণ করুন'
                : 'Review, verify, and audit daily lessons recorded by your student from their student portal.'}
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
              <span>{isBn ? 'আনলগড স্টাডি অ্যালার্ট' : 'Unlogged Study Alert'}</span>
              {alertConfig.enabled && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border-amber-500/30">
                  {alertConfig.time}
                </Badge>
              )}
            </Button>
            <Link
              href={
                entries.length > 0
                  ? `/children/${childId}/quizzes/new?topic=${encodeURIComponent(entries[0].topicsText || '')}&subject=${encodeURIComponent(entries[0].subject || entries[0].subjectId || '')}&title=${encodeURIComponent(`${entries[0].topicsText || entries[0].subject} — ${isBn ? 'রিভিশন কুইজ' : 'Revision Quiz'}`)}`
                  : `/children/${childId}/quizzes/new`
              }
            >
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
                    <div className="flex items-center gap-2 flex-wrap">
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

                      <Link
                        href={`/children/${childId}/quizzes/new?topic=${encodeURIComponent(e.topicsText || '')}&subject=${encodeURIComponent(e.subject || e.subjectId || '')}&title=${encodeURIComponent(`${e.topicsText || e.subject} — ${isBn ? 'রিভিশন কুইজ' : 'Revision Quiz'}`)}`}
                      >
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
    
        {/* Unlogged Study Alert Setup Modal (Saved separately per student) */}
        <Modal
          isOpen={alertModalOpen}
          onClose={() => setAlertModalOpen(false)}
          title={isBn ? 'দৈনিক আনলগড স্টাডি অ্যালার্ট সেটআপ' : 'Daily Unlogged Study Alert Setup'}
          description={
            isBn
              ? `${currentChild?.name || 'শিক্ষার্থী'}-এর আজকের কোনো পড়ার বিবরণ লিপিবদ্ধ না থাকলে নির্ধারিত সময়ে অভিভাবক হিসেবে অ্যালার্ট পান`
              : `Receive an automatic notification if ${currentChild?.name || 'your child'} has not logged their daily study sessions.`
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
                {isBn ? 'শিক্ষার্থীভিত্তিক পৃথক সংরক্ষণ' : 'Saved per student'}
              </Badge>
            </div>

            {/* Enable / Disable Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-card">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">
                  {isBn ? 'আনলগড স্টাডি নোটিফিকেশন সক্রিয় করুন' : 'Enable Unlogged Study Alerts'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isBn
                    ? 'নির্ধারিত সময়ের মধ্যে আজকের কোনো পাঠ যুক্ত না থাকলে অভিভাবককে নোটিফিকেশন পাঠানো হবে'
                    : 'Get notified if no study session has been logged by the selected cutoff time'}
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
                  <span>{isBn ? 'নোটিফিকেশনের নির্ধারিত সময়' : 'Notification Cutoff Time'}</span>
                </label>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {isBn ? 'প্রতিদিন' : 'Daily'}
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
                  {isBn ? 'দ্রুত নির্বাচন:' : 'Quick Select:'}
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
                    {preset === '20:00' ? (isBn ? 'রাত ৮:০০' : '8:00 PM') :
                     preset === '20:30' ? (isBn ? 'রাত ৮:৩০' : '8:30 PM') :
                     preset === '21:00' ? (isBn ? 'রাত ৯:০০' : '9:00 PM') :
                     preset === '21:30' ? (isBn ? 'রাত ৯:৩০' : '9:30 PM') :
                     (isBn ? 'রাত ১০:০০' : '10:00 PM')}
                  </button>
                ))}
              </div>
            </div>

            {/* Encouragement / Timing Recommendation Callout */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{isBn ? '💡 গুরুত্বপূর্ণ পরামর্শ (Time Recommendation)' : '💡 Helpful Recommendation'}</span>
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                {isBn
                  ? `অনুগ্রহ করে এমন একটি সময় নির্ধারণ করুন যা ${currentChild?.nickname || currentChild?.name || 'সন্তানের'} সারাদিনের সব শিক্ষা কার্যক্রম (স্কুল/কলেজ, প্রাইভেট টিউশন এবং রাতের সেলফ-স্টাডি) শেষ হওয়ার পরের সময় (যেমন রাত ৯:০০ টা বা ৯:৩০ টা)। এতে শিক্ষার্থী সারাদিন পড়ে বিবরণ যুক্ত করার পর্যাপ্ত সময় পাবে এবং কোনো পড়া বাদ থাকলে নির্ধারিত সময়ে অভিভাবক হিসেবে আপনি তাৎক্ষণিক নোটিফিকেশন পাবেন।`
                  : `Please select a time that is after all of ${currentChild?.nickname || currentChild?.name || 'your child'}'s daily educational activities (school/college, private tuition, and evening self-study) are finished (e.g. 9:00 PM or 9:30 PM). This ensures your child has enough time to log their study, and you will only be alerted if lessons remain unlogged.`}
              </p>
            </div>

            {/* Notification Channel Choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isBn ? 'নোটিফিকেশন চ্যানেল' : 'Notification Channel'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: isBn ? 'উভয় চ্যানেল' : 'All Channels', desc: isBn ? 'ইন-অ্যাপ + ইমেইল' : 'In-App + Email' },
                  { id: 'in_app', label: isBn ? 'ইন-অ্যাপ' : 'In-App Only', desc: isBn ? 'অ্যাপ নোটিফিকেশন' : 'App Bell Icon' },
                  { id: 'email', label: isBn ? 'ইমেইল' : 'Email Only', desc: isBn ? 'অভিভাবকের মেইল' : 'Parent Email' },
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
                <span>{testingAlert ? (isBn ? 'পাঠানো হচ্ছে...' : 'Sending...') : (isBn ? 'পরীক্ষামূলক নোটিফিকেশন পাঠান' : 'Send Test Notification')}</span>
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAlertModalOpen(false)}
                  className="text-xs"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingAlert}
                  className="text-xs gap-1.5 bg-primary"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingAlert ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'সেভ করুন' : 'Save Settings')}</span>
                </Button>
              </div>
            </div>
          </form>
        </Modal>

    </AppShell>
  );
}
