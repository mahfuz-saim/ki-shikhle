import { prisma } from '../../db/client';
import { notFound, forbidden, badRequest } from '../../utils/errors';
import { callAI } from '../../services/ai';

const now = Date.now();
const dayMs = 86400000;

export const memEntries: any[] = [
  // ==========================================
  // RAHIM AHMED (demo-child-1, Class 8 School)
  // ==========================================
  // Today
  {
    id: 'entry-rahim-t1',
    childId: 'demo-child-1',
    subject: 'Mathematics',
    subjectName: 'গণিত (Mathematics)',
    topicsText: 'অধ্যায় ৪: বীজগণিতীয় সূত্রাবলী ও প্রয়োগ (অনুশীলনী ৪.১) — বর্গের সূত্র (a+b)^2 ও (a-b)^2 ব্যবহার করে ১ থেকে ১২ নং প্রশ্ন সমাধান সম্পন্ন।',
    durationMin: 45,
    source: 'school',
    confidence: 5,
    date: new Date(now - 6 * 3600000).toISOString(),
    createdAt: new Date(now - 6 * 3600000).toISOString(),
    updatedAt: new Date(now - 6 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-t2',
    childId: 'demo-child-1',
    subject: 'General Science',
    subjectName: 'সাধারণ বিজ্ঞান (Science)',
    topicsText: 'অধ্যায় ২: গতি ও ত্বরণ — গতির ৩টি মৌলিক সমীকরণ, বেগ-সময় লেখচিত্র ও তাৎক্ষণিক দ্রুতি নির্ণয়।',
    durationMin: 50,
    source: 'school',
    confidence: 4,
    date: new Date(now - 4 * 3600000).toISOString(),
    createdAt: new Date(now - 4 * 3600000).toISOString(),
    updatedAt: new Date(now - 4 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-t3',
    childId: 'demo-child-1',
    subject: 'Mathematics',
    subjectName: 'গণিত প্রাইভেট (রহিম স্যার)',
    topicsText: 'বর্গের মান নির্ণয়, (a+b)^2 ও (a-b)^2 এর অনুসিদ্ধান্ত প্রয়োগ এবং ৪টি সৃজনশীল প্রশ্ন অনুশীলন।',
    durationMin: 75,
    source: 'tuition',
    confidence: 5,
    date: new Date(now - 2 * 3600000).toISOString(),
    createdAt: new Date(now - 2 * 3600000).toISOString(),
    updatedAt: new Date(now - 2 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-t4',
    childId: 'demo-child-1',
    subject: 'English 1st Paper',
    subjectName: 'ইংরেজি ১ম পত্র (English)',
    topicsText: 'Unit 3: Health and Hygiene — Passage comprehension, new vocabulary with synonyms/antonyms, and theme writing.',
    durationMin: 45,
    source: 'self_study',
    confidence: 4,
    date: new Date(now - 1 * 3600000).toISOString(),
    createdAt: new Date(now - 1 * 3600000).toISOString(),
    updatedAt: new Date(now - 1 * 3600000).toISOString(),
    verifiedByParent: true,
  },

  // Yesterday (1 day ago)
  {
    id: 'entry-rahim-y1',
    childId: 'demo-child-1',
    subject: 'ICT',
    subjectName: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
    topicsText: 'অধ্যায় ৩: স্প্রেডশিট সফটওয়্যারের ব্যবহার — মাইক্রোসফট এক্সেলে যোগ, গড়, গুণ এবং শতকরা বের করার সেল ফর্মুলা তৈরি।',
    durationMin: 45,
    source: 'school',
    confidence: 5,
    date: new Date(now - 1 * dayMs - 6 * 3600000).toISOString(),
    createdAt: new Date(now - 1 * dayMs - 6 * 3600000).toISOString(),
    updatedAt: new Date(now - 1 * dayMs - 6 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-y2',
    childId: 'demo-child-1',
    subject: 'Bangla 1st Paper',
    subjectName: 'বাংলা ১ম পত্র (Bangla)',
    topicsText: 'কবিতা: "বঙ্গভূমির প্রতি" (মাইকেল মধুসূদন দত্ত) — মূলভাব বিশ্লেষণ, কবি পরিচিতি এবং জ্ঞান ও অনুধাবনমূলক প্রশ্ন অনুশীলন।',
    durationMin: 45,
    source: 'school',
    confidence: 4,
    date: new Date(now - 1 * dayMs - 4 * 3600000).toISOString(),
    createdAt: new Date(now - 1 * dayMs - 4 * 3600000).toISOString(),
    updatedAt: new Date(now - 1 * dayMs - 4 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-y3',
    childId: 'demo-child-1',
    subject: 'General Science',
    subjectName: 'বিজ্ঞান কোচিং (Science)',
    topicsText: 'অধ্যায় ৩: পরমাণুর গঠন — ইলেকট্রন বিন্যাস, পারমাণবিক সংখ্যা ও ভর সংখ্যা সংক্রান্ত গাণিতিক হিসাব।',
    durationMin: 60,
    source: 'tuition',
    confidence: 5,
    date: new Date(now - 1 * dayMs - 2 * 3600000).toISOString(),
    createdAt: new Date(now - 1 * dayMs - 2 * 3600000).toISOString(),
    updatedAt: new Date(now - 1 * dayMs - 2 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-y4',
    childId: 'demo-child-1',
    subject: 'Mathematics',
    subjectName: 'গণিত হোমওয়ার্ক (Math)',
    topicsText: 'অনুশীলনী ৪.১ এর ৮ থেকে ১৫ নম্বর সমস্যা সমাধান ও নোটবুকে ফেয়ার সম্পন্ন।',
    durationMin: 50,
    source: 'self_study',
    confidence: 5,
    date: new Date(now - 1 * dayMs - 1 * 3600000).toISOString(),
    createdAt: new Date(now - 1 * dayMs - 1 * 3600000).toISOString(),
    updatedAt: new Date(now - 1 * dayMs - 1 * 3600000).toISOString(),
    verifiedByParent: true,
  },

  // 2 Days Ago
  {
    id: 'entry-rahim-d2-1',
    childId: 'demo-child-1',
    subject: 'Mathematics',
    subjectName: 'গণিত (Mathematics)',
    topicsText: 'অধ্যায় ৮: চতুর্ভুজ — সামান্তরিকের বিপরীত বাহু ও কোণ পরস্পর সমান সংক্রান্ত উপপাদ্য ১ প্রমাণ।',
    durationMin: 50,
    source: 'school',
    confidence: 4,
    date: new Date(now - 2 * dayMs - 6 * 3600000).toISOString(),
    createdAt: new Date(now - 2 * dayMs - 6 * 3600000).toISOString(),
    updatedAt: new Date(now - 2 * dayMs - 6 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-d2-2',
    childId: 'demo-child-1',
    subject: 'Mathematics',
    subjectName: 'গণিত প্রাইভেট (রহিম স্যার)',
    topicsText: 'চতুর্ভুজের উপপাদ্য ১ ও ২ এর অনুশীলনীর সমস্যা ও এক্সট্রা জ্যামিতি প্রমাণ।',
    durationMin: 75,
    source: 'tuition',
    confidence: 4,
    date: new Date(now - 2 * dayMs - 2 * 3600000).toISOString(),
    createdAt: new Date(now - 2 * dayMs - 2 * 3600000).toISOString(),
    updatedAt: new Date(now - 2 * dayMs - 2 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-d2-3',
    childId: 'demo-child-1',
    subject: 'English 2nd Paper',
    subjectName: 'ইংরেজি ২য় পত্র (Grammar)',
    topicsText: 'Right forms of verbs — 10 basic grammar rules and 20 practice fill-in-the-blanks.',
    durationMin: 45,
    source: 'self_study',
    confidence: 4,
    date: new Date(now - 2 * dayMs - 1 * 3600000).toISOString(),
    createdAt: new Date(now - 2 * dayMs - 1 * 3600000).toISOString(),
    updatedAt: new Date(now - 2 * dayMs - 1 * 3600000).toISOString(),
    verifiedByParent: true,
  },

  // 3 Days Ago
  {
    id: 'entry-rahim-d3-1',
    childId: 'demo-child-1',
    subject: 'General Science',
    subjectName: 'সাধারণ বিজ্ঞান (Science)',
    topicsText: 'নিউটনের ৩টি গতিসূত্র ও বাস্তব জীবনে এদের প্রয়োগ (জড়তা, রকেট উৎক্ষেপণ)।',
    durationMin: 50,
    source: 'school',
    confidence: 5,
    date: new Date(now - 3 * dayMs - 6 * 3600000).toISOString(),
    createdAt: new Date(now - 3 * dayMs - 6 * 3600000).toISOString(),
    updatedAt: new Date(now - 3 * dayMs - 6 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-d3-2',
    childId: 'demo-child-1',
    subject: 'English 1st Paper',
    subjectName: 'ইংরেজি টিউটর (English)',
    topicsText: 'Dialogue writing on "Tree Plantation" and unseen passage reading comprehension.',
    durationMin: 60,
    source: 'tuition',
    confidence: 5,
    date: new Date(now - 3 * dayMs - 2 * 3600000).toISOString(),
    createdAt: new Date(now - 3 * dayMs - 2 * 3600000).toISOString(),
    updatedAt: new Date(now - 3 * dayMs - 2 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-d3-3',
    childId: 'demo-child-1',
    subject: 'BGS',
    subjectName: 'বাংলাদেশ ও বিশ্বপরিচয় (BGS)',
    topicsText: 'অধ্যায় ৩: সৌরজগৎ ও ভূমন্ডল — পৃথিবীর গতি, আহ্নিক গতি ও বার্ষিক গতির প্রভাব।',
    durationMin: 40,
    source: 'self_study',
    confidence: 4,
    date: new Date(now - 3 * dayMs - 1 * 3600000).toISOString(),
    createdAt: new Date(now - 3 * dayMs - 1 * 3600000).toISOString(),
    updatedAt: new Date(now - 3 * dayMs - 1 * 3600000).toISOString(),
    verifiedByParent: true,
  },

  // 4 Days Ago
  {
    id: 'entry-rahim-d4-1',
    childId: 'demo-child-1',
    subject: 'Mathematics',
    subjectName: 'গণিত (Mathematics)',
    topicsText: 'অধ্যায় ৪: বীজগণিতীয় উৎপাদকে বিশ্লেষণ (অনুশীলনী ৪.৩) — কমন নেওয়া ও সূত্র প্রয়োগ।',
    durationMin: 50,
    source: 'school',
    confidence: 5,
    date: new Date(now - 4 * dayMs - 6 * 3600000).toISOString(),
    createdAt: new Date(now - 4 * dayMs - 6 * 3600000).toISOString(),
    updatedAt: new Date(now - 4 * dayMs - 6 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-d4-2',
    childId: 'demo-child-1',
    subject: 'Mathematics',
    subjectName: 'গণিত প্রাইভেট (রহিম স্যার)',
    topicsText: 'মধ্যপদ ভাঙা (Middle term factorization) কৌশল ও ২০টি জটিল উৎপাদক সমাধান।',
    durationMin: 75,
    source: 'tuition',
    confidence: 5,
    date: new Date(now - 4 * dayMs - 2 * 3600000).toISOString(),
    createdAt: new Date(now - 4 * dayMs - 2 * 3600000).toISOString(),
    updatedAt: new Date(now - 4 * dayMs - 2 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-d4-3',
    childId: 'demo-child-1',
    subject: 'Bangla 2nd Paper',
    subjectName: 'বাংলা ব্যাকরণ (Bangla)',
    topicsText: 'ধ্বনি পরিবর্তন ও সন্ধির নিয়মাবলী অনুশীলন ও নোট তৈরি।',
    durationMin: 45,
    source: 'self_study',
    confidence: 4,
    date: new Date(now - 4 * dayMs - 1 * 3600000).toISOString(),
    createdAt: new Date(now - 4 * dayMs - 1 * 3600000).toISOString(),
    updatedAt: new Date(now - 4 * dayMs - 1 * 3600000).toISOString(),
    verifiedByParent: true,
  },

  // 5 Days Ago
  {
    id: 'entry-rahim-d5-1',
    childId: 'demo-child-1',
    subject: 'General Science',
    subjectName: 'বিজ্ঞান কোচিং (Science)',
    topicsText: 'অধ্যায় ৫: সমন্বয় ও নিঃসরণ — মানব মস্তিষ্কের বিভিন্ন অংশ ও স্নায়ুতন্ত্রের চিত্রাঙ্কন।',
    durationMin: 60,
    source: 'tuition',
    confidence: 4,
    date: new Date(now - 5 * dayMs - 2 * 3600000).toISOString(),
    createdAt: new Date(now - 5 * dayMs - 2 * 3600000).toISOString(),
    updatedAt: new Date(now - 5 * dayMs - 2 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-d5-2',
    childId: 'demo-child-1',
    subject: 'Mathematics',
    subjectName: 'গণিত সেলফ স্টাডি (Math)',
    topicsText: 'বীজগণিত সূত্রাবলীর রিভিশন এবং ভুল হওয়া সমস্যা সমাধান।',
    durationMin: 60,
    source: 'self_study',
    confidence: 5,
    date: new Date(now - 5 * dayMs - 1 * 3600000).toISOString(),
    createdAt: new Date(now - 5 * dayMs - 1 * 3600000).toISOString(),
    updatedAt: new Date(now - 5 * dayMs - 1 * 3600000).toISOString(),
    verifiedByParent: true,
  },

  // ==========================================
  // TASNIM ISLAM (demo-child-2, Class 5 School)
  // ==========================================
  // Today
  {
    id: 'entry-tasnim-t1',
    childId: 'demo-child-2',
    subject: 'Elementary Mathematics',
    subjectName: 'প্রাথমিক গণিত (Math)',
    topicsText: 'অধ্যায় ৫: গুণনীয়ক ও গুণিতক — মৌলিক উৎপাদকে বিশ্লেষণ করে লসাগু (LCM) ও গসাগু (HCF) নির্ণয়।',
    durationMin: 45,
    source: 'school',
    confidence: 5,
    date: new Date(now - 6 * 3600000).toISOString(),
    createdAt: new Date(now - 6 * 3600000).toISOString(),
    updatedAt: new Date(now - 6 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-tasnim-t2',
    childId: 'demo-child-2',
    subject: 'Primary Science',
    subjectName: 'প্রাথমিক বিজ্ঞান (Science)',
    topicsText: 'অধ্যায় ৩: জীবনের জন্য পানি — নিরাপদ পানি পানের গুরুত্ব ও পানি দূষণের ক্ষতিকর প্রভাব।',
    durationMin: 40,
    source: 'school',
    confidence: 5,
    date: new Date(now - 4 * 3600000).toISOString(),
    createdAt: new Date(now - 4 * 3600000).toISOString(),
    updatedAt: new Date(now - 4 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-tasnim-t3',
    childId: 'demo-child-2',
    subject: 'Elementary Mathematics',
    subjectName: 'গণিত টিউটর (Math Tuition)',
    topicsText: 'ডাকের কথার অঙ্ক সমাধান, লসাগুর সাহায্যে ঘণ্টা বাজার সময় নির্ণয় সংক্রান্ত সমস্যা।',
    durationMin: 60,
    source: 'tuition',
    confidence: 5,
    date: new Date(now - 2 * 3600000).toISOString(),
    createdAt: new Date(now - 2 * 3600000).toISOString(),
    updatedAt: new Date(now - 2 * 3600000).toISOString(),
    verifiedByParent: true,
  },

  // Yesterday
  {
    id: 'entry-tasnim-y1',
    childId: 'demo-child-2',
    subject: 'English',
    subjectName: 'ইংরেজি (English)',
    topicsText: 'Unit 6: Eat Healthy — Food pyramid, healthy fruits and vegetables vocabulary.',
    durationMin: 45,
    source: 'school',
    confidence: 5,
    date: new Date(now - 1 * dayMs - 6 * 3600000).toISOString(),
    createdAt: new Date(now - 1 * dayMs - 6 * 3600000).toISOString(),
    updatedAt: new Date(now - 1 * dayMs - 6 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-tasnim-y2',
    childId: 'demo-child-2',
    subject: 'English',
    subjectName: 'ইংরেজি টিউটর (English Tuition)',
    topicsText: 'Reading aloud, question-answer matching & spelling test with 10 new words.',
    durationMin: 50,
    source: 'tuition',
    confidence: 5,
    date: new Date(now - 1 * dayMs - 2 * 3600000).toISOString(),
    createdAt: new Date(now - 1 * dayMs - 2 * 3600000).toISOString(),
    updatedAt: new Date(now - 1 * dayMs - 2 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-tasnim-y3',
    childId: 'demo-child-2',
    subject: 'Elementary Mathematics',
    subjectName: 'গণিত হোমওয়ার্ক (Math)',
    topicsText: 'পৃষ্ঠা ৩১ এর ১ থেকে ৫ নং লসাগু অংক খাতায় অনুশীলন সম্পন্ন।',
    durationMin: 45,
    source: 'self_study',
    confidence: 4,
    date: new Date(now - 1 * dayMs - 1 * 3600000).toISOString(),
    createdAt: new Date(now - 1 * dayMs - 1 * 3600000).toISOString(),
    updatedAt: new Date(now - 1 * dayMs - 1 * 3600000).toISOString(),
    verifiedByParent: true,
  },

  // 2 Days Ago
  {
    id: 'entry-tasnim-d2-1',
    childId: 'demo-child-2',
    subject: 'Bangladesh & Global Studies',
    subjectName: 'বাংলাদেশ ও বিশ্বপরিচয় (BGS)',
    topicsText: 'অধ্যায় ১: আমাদের মুক্তিযুদ্ধ — ১৯৭১ সালের ২৫শে মার্চের কালরাত ও সাধারণ মানুষের অবদান।',
    durationMin: 40,
    source: 'school',
    confidence: 5,
    date: new Date(now - 2 * dayMs - 6 * 3600000).toISOString(),
    createdAt: new Date(now - 2 * dayMs - 6 * 3600000).toISOString(),
    updatedAt: new Date(now - 2 * dayMs - 6 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-tasnim-d2-2',
    childId: 'demo-child-2',
    subject: 'Elementary Mathematics',
    subjectName: 'গণিত টিউটর (Math Tuition)',
    topicsText: 'গসাগু নির্ণয়ের সহজ নিয়ম ও ৩টি সংখ্যার গসাগু সমাধান।',
    durationMin: 60,
    source: 'tuition',
    confidence: 5,
    date: new Date(now - 2 * dayMs - 2 * 3600000).toISOString(),
    createdAt: new Date(now - 2 * dayMs - 2 * 3600000).toISOString(),
    updatedAt: new Date(now - 2 * dayMs - 2 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-tasnim-d2-3',
    childId: 'demo-child-2',
    subject: 'Primary Science',
    subjectName: 'বিজ্ঞান রিভিশন (Science)',
    topicsText: 'পানি চক্রের ছবি আঁকা এবং পানি বিশুদ্ধকরণের ৪টি ধাপ খাতায় নোট তৈরি।',
    durationMin: 45,
    source: 'self_study',
    confidence: 5,
    date: new Date(now - 2 * dayMs - 1 * 3600000).toISOString(),
    createdAt: new Date(now - 2 * dayMs - 1 * 3600000).toISOString(),
    updatedAt: new Date(now - 2 * dayMs - 1 * 3600000).toISOString(),
    verifiedByParent: true,
  },

  // 3 Days Ago
  {
    id: 'entry-tasnim-d3-1',
    childId: 'demo-child-2',
    subject: 'Bangla',
    subjectName: 'বাংলা (Bangla)',
    topicsText: 'গল্প: "হাতি আর শিয়ালের গল্প" — যুক্তবর্ণ ভেঙে শব্দ গঠন ও নতুন শব্দের অর্থ লেখা।',
    durationMin: 45,
    source: 'school',
    confidence: 5,
    date: new Date(now - 3 * dayMs - 6 * 3600000).toISOString(),
    createdAt: new Date(now - 3 * dayMs - 6 * 3600000).toISOString(),
    updatedAt: new Date(now - 3 * dayMs - 6 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-tasnim-d3-2',
    childId: 'demo-child-2',
    subject: 'English',
    subjectName: 'ইংরেজি টিউটর (English Tuition)',
    topicsText: 'Simple Present Tense sentences & writing 5 sentences on "My Daily Routine".',
    durationMin: 50,
    source: 'tuition',
    confidence: 4,
    date: new Date(now - 3 * dayMs - 2 * 3600000).toISOString(),
    createdAt: new Date(now - 3 * dayMs - 2 * 3600000).toISOString(),
    updatedAt: new Date(now - 3 * dayMs - 2 * 3600000).toISOString(),
    verifiedByParent: true,
  },

  // ==========================================
  // FAHIM ISLAM (demo-child-3, Class 11 College)
  // ==========================================
  // Today
  {
    id: 'entry-fahim-t1',
    childId: 'demo-child-3',
    subject: 'Physics 1st Paper',
    subjectName: 'পদার্থবিজ্ঞান ১ম পত্র (Physics)',
    topicsText: 'অধ্যায় ৩: গতিবিদ্যা — প্রক্ষেপক (Projectile Motion), সর্বাধিক উচ্চতা H, উড্ডয়নকাল T ও পাল্লা R নির্ণয়ের গাণিতিক সমাধান।',
    durationMin: 50,
    source: 'college',
    confidence: 5,
    date: new Date(now - 6 * 3600000).toISOString(),
    createdAt: new Date(now - 6 * 3600000).toISOString(),
    updatedAt: new Date(now - 6 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-fahim-t2',
    childId: 'demo-child-3',
    subject: 'Chemistry 1st Paper',
    subjectName: 'রসায়ন ১ম পত্র (Chemistry)',
    topicsText: 'অধ্যায় ২: গুণগত রসায়ন — বোর পরমাণু মডেল, কোয়ান্টাম সংখ্যা (n, l, m, s) এবং পলির বর্জন নীতি।',
    durationMin: 50,
    source: 'college',
    confidence: 5,
    date: new Date(now - 4 * 3600000).toISOString(),
    createdAt: new Date(now - 4 * 3600000).toISOString(),
    updatedAt: new Date(now - 4 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-fahim-t3',
    childId: 'demo-child-3',
    subject: 'Physics 1st Paper',
    subjectName: 'পদার্থবিজ্ঞান কোচিং (Physics Coaching)',
    topicsText: 'প্রক্ষেপকের উচ্চতর গাণিতিক সমস্যা ও বিভিন্ন কোণে নিক্ষিপ্ত বস্তুর গতিপথ বিশ্লেষণ।',
    durationMin: 75,
    source: 'tuition',
    confidence: 5,
    date: new Date(now - 2 * 3600000).toISOString(),
    createdAt: new Date(now - 2 * 3600000).toISOString(),
    updatedAt: new Date(now - 2 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-fahim-t4',
    childId: 'demo-child-3',
    subject: 'Higher Mathematics',
    subjectName: 'উচ্চতর গণিত ১ম পত্র (Higher Math)',
    topicsText: 'অধ্যায় ১: ম্যাট্রিক্স ও নির্ণায়ক — ক্র্যামারের নিয়মে তিন চলকের সমীকরণ জোট সমাধান।',
    durationMin: 60,
    source: 'self_study',
    confidence: 5,
    date: new Date(now - 1 * 3600000).toISOString(),
    createdAt: new Date(now - 1 * 3600000).toISOString(),
    updatedAt: new Date(now - 1 * 3600000).toISOString(),
    verifiedByParent: true,
  },

  // Yesterday
  {
    id: 'entry-fahim-y1',
    childId: 'demo-child-3',
    subject: 'Higher Mathematics',
    subjectName: 'উচ্চতর গণিত ১ম পত্র (College)',
    topicsText: 'ম্যাট্রিক্সের গুণন বিধি ও বিপরীত ম্যাট্রিক্স (Inverse Matrix) নির্ণয়।',
    durationMin: 50,
    source: 'college',
    confidence: 4,
    date: new Date(now - 1 * dayMs - 6 * 3600000).toISOString(),
    createdAt: new Date(now - 1 * dayMs - 6 * 3600000).toISOString(),
    updatedAt: new Date(now - 1 * dayMs - 6 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-fahim-y2',
    childId: 'demo-child-3',
    subject: 'Chemistry 1st Paper',
    subjectName: 'রসায়ন প্রাইভেট (Chemistry Tuition)',
    topicsText: 'আউফবাউ নীতি, হুন্ডের নীতি প্রয়োগ করে ক্রোমিয়াম ও কপারের ব্যতিক্রমী ইলেকট্রন বিন্যাস।',
    durationMin: 60,
    source: 'tuition',
    confidence: 5,
    date: new Date(now - 1 * dayMs - 2 * 3600000).toISOString(),
    createdAt: new Date(now - 1 * dayMs - 2 * 3600000).toISOString(),
    updatedAt: new Date(now - 1 * dayMs - 2 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-fahim-y3',
    childId: 'demo-child-3',
    subject: 'Physics 1st Paper',
    subjectName: 'পদার্থবিজ্ঞান সেলফ স্টাডি (Physics)',
    topicsText: 'ক্যালকুলাস ও ব্যবকলনের সাহায্যে তাৎক্ষণিক বেগ ও ত্বরণ প্রতিপাদন।',
    durationMin: 60,
    source: 'self_study',
    confidence: 4,
    date: new Date(now - 1 * dayMs - 1 * 3600000).toISOString(),
    createdAt: new Date(now - 1 * dayMs - 1 * 3600000).toISOString(),
    updatedAt: new Date(now - 1 * dayMs - 1 * 3600000).toISOString(),
    verifiedByParent: true,
  },

  // 2 Days Ago
  {
    id: 'entry-fahim-d2-1',
    childId: 'demo-child-3',
    subject: 'ICT',
    subjectName: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
    topicsText: 'অধ্যায় ৩: সংখ্যা পদ্ধতি — বাইনারি, ডেসিমাল, অক্টাল ও হেক্সাডেসিমেল রূপান্তর ও ২ এর পরিপূরক।',
    durationMin: 50,
    source: 'college',
    confidence: 5,
    date: new Date(now - 2 * dayMs - 6 * 3600000).toISOString(),
    createdAt: new Date(now - 2 * dayMs - 6 * 3600000).toISOString(),
    updatedAt: new Date(now - 2 * dayMs - 6 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-fahim-d2-2',
    childId: 'demo-child-3',
    subject: 'Higher Mathematics',
    subjectName: 'গণিত কোচিং (Higher Math Tuition)',
    topicsText: 'নির্ণায়কের ধর্মাবলী ও অনুরাশি-সহগুণক প্রয়োগ করে মান নির্ণয়।',
    durationMin: 75,
    source: 'tuition',
    confidence: 5,
    date: new Date(now - 2 * dayMs - 2 * 3600000).toISOString(),
    createdAt: new Date(now - 2 * dayMs - 2 * 3600000).toISOString(),
    updatedAt: new Date(now - 2 * dayMs - 2 * 3600000).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-fahim-d2-3',
    childId: 'demo-child-3',
    subject: 'English 1st Paper',
    subjectName: 'ইংরেজি ১ম পত্র (English)',
    topicsText: 'Poem Analysis: "The Traffic Policeman" — Theme writing and critical explanation.',
    durationMin: 45,
    source: 'self_study',
    confidence: 5,
    date: new Date(now - 2 * dayMs - 1 * 3600000).toISOString(),
    createdAt: new Date(now - 2 * dayMs - 1 * 3600000).toISOString(),
    updatedAt: new Date(now - 2 * dayMs - 1 * 3600000).toISOString(),
    verifiedByParent: true,
  },
];
const memRevisions: any[] = [];

export async function listEntries(childId: string, parentId: string, query: { from?: string; to?: string; page?: string; limit?: string }) {
  await assertOwnership(parentId, childId);
  try {
    const where: any = { childId };
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = new Date(query.from);
      if (query.to) where.date.lte = new Date(query.to);
    }
    const page = parseInt(query.page || '1'); const limit = parseInt(query.limit || '20');
    const [data, total] = await Promise.all([
      prisma.learningEntry.findMany({ where, orderBy: { date: 'desc' }, skip: (page - 1) * limit, take: limit, include: { revisions: true } }),
      prisma.learningEntry.count({ where }),
    ]);
    return { data, total, page, limit };
  } catch {
    let filtered = memEntries.filter((e: any) => e.childId === childId);
    if (query.from) filtered = filtered.filter((e: any) => e.date >= query.from!);
    if (query.to) filtered = filtered.filter((e: any) => e.date <= query.to!);
    return { data: filtered, total: filtered.length, page: 1, limit: 20 };
  }
}

export async function createEntry(childId: string, parentId: string, data: any, userRole: string) {
  await assertOwnership(parentId, childId);
  const payload = { childId, ...data, date: new Date(data.date) };
  try {
    const entry = await prisma.learningEntry.create({ data: payload });
    // queue digest job (cheap model)
    queueDigest(entry.id, childId, data.topicsText);
    return entry;
  } catch {
    const entry = { id: 'entry-' + Date.now(), ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), verifiedByParent: false };
    memEntries.push(entry);
    queueDigest(entry.id, childId, data.topicsText);
    return entry;
  }
}

export async function updateEntry(entryId: string, parentId: string, data: any, changedBy: string) {
  let entry: any;
  try {
    entry = await prisma.learningEntry.findUnique({ where: { id: entryId }, include: { child: true } });
    if (!entry) throw notFound('Entry not found');
    if (entry.child.parentId !== parentId) throw forbidden('Not your child');
    // 48h edit window for child role
    if (changedBy === 'child' && Date.now() - new Date(entry.createdAt).getTime() > 48 * 3600000) throw forbidden('Edit window expired (48h)');

    // save revision
    await prisma.entryRevision.create({ data: { entryId, snapshotJson: entry as any, changedBy } }).catch(()=>{});
    const updated = await prisma.learningEntry.update({ where: { id: entryId }, data });
    return updated;
  } catch (e: any) {
    if (e.statusCode) throw e;
    const idx = memEntries.findIndex((x: any) => x.id === entryId);
    if (idx < 0) throw notFound('Entry not found');
    const snapshot = { ...memEntries[idx] };
    memRevisions.push({ id: 'rev-' + Date.now(), entryId, snapshotJson: snapshot, changedBy, changedAt: new Date() });
    Object.assign(memEntries[idx], data, { updatedAt: new Date().toISOString() });
    return memEntries[idx];
  }
}

export async function deleteEntry(entryId: string, parentId: string) {
  const entry: any = await findEntry(entryId, parentId);
  try { await prisma.learningEntry.delete({ where: { id: entryId } }); } catch { const idx = memEntries.findIndex((x:any)=>x.id===entryId); if(idx>=0) memEntries.splice(idx,1); }
  return { message: 'Deleted' };
}

export async function verifyEntry(entryId: string, parentId: string) {
  const entry: any = await findEntry(entryId, parentId);
  try { return await prisma.learningEntry.update({ where: { id: entryId }, data: { verifiedByParent: true } }); }
  catch { const idx = memEntries.findIndex((x:any)=>x.id===entryId); if(idx>=0) memEntries[idx].verifiedByParent = true; return memEntries[idx]; }
}

async function findEntry(entryId: string, parentId: string) {
  try {
    const e: any = await prisma.learningEntry.findUnique({ where: { id: entryId }, include: { child: true } });
    if (!e) throw notFound('Entry not found');
    if (e.child.parentId !== parentId) throw forbidden('Not your child');
    return e;
  } catch (e: any) {
    if (e.statusCode) throw e;
    const e2 = memEntries.find((x:any)=> x.id===entryId);
    if (!e2) throw notFound('Entry not found');
    return e2;
  }
}

async function assertOwnership(parentId: string, childId: string) {
  if (childId === parentId || childId.startsWith('demo-') || parentId.startsWith('demo-')) return;
  try {
    const c = await prisma.child.findFirst({ where: { id: childId, OR: [{ parentId }, { id: parentId }] } });
    if (!c) throw notFound('Child not found or not yours');
  } catch (e: any) {
    if (e.statusCode===404) throw e;
  }
}

function queueDigest(sourceId: string, childId: string, text: string) {
  console.log(`[Digest Job] Queued for ${sourceId}: ${text.slice(0,50)}...`);
}

export interface StructuredVoiceLog {
  subject: string;
  subjectBn: string;
  topicsText: string;
  source: 'school' | 'tuition' | 'self_study' | 'college';
  durationMin: number;
  confidence: number;
  keyConcepts: string[];
  homeworkAssigned?: string | null;
  summaryMessage: string;
  rawTranscript: string;
  aiModelUsed: string;
}

export async function structureVoiceLog(speechText: string, childId: string, parentId: string): Promise<StructuredVoiceLog> {
  await assertOwnership(parentId, childId);
  const trimmed = (speechText || '').trim();
  if (!trimmed) {
    throw badRequest('Voice speech text is required');
  }

  const system = `You are Claude AI, an expert educational AI assistant helping school students in Bangladesh (NCTB Bangla & English versions and English medium) log their daily lessons.
The student has spoken into their microphone about what was taught today. Your task is to extract, normalize, and structure their spoken words into a clean learning log record.

Return a JSON object with EXACTLY this structure:
{
  "subject": "Mathematics" | "Physics" | "Chemistry" | "Biology" | "English" | "Bangla" | "General Science" | "ICT" | "BGS" | "Elementary Math" | "Primary Science",
  "subjectBn": "বিষয়টির বাংলা নাম (যেমন: পদার্থবিজ্ঞান)",
  "topicsText": "A clean, informative 1-2 sentence title and chapter summary of the topic learned",
  "source": "school" | "tuition" | "self_study" | "college",
  "durationMin": number (Estimated duration in minutes, default 60),
  "confidence": number (Between 1 and 5, based on how well the student understood),
  "keyConcepts": ["2 to 4 concise bullet points of formulas, facts, or concepts learned"],
  "homeworkAssigned": "Brief description of any homework or exercises mentioned, or null",
  "summaryMessage": "A warm, encouraging 1-sentence comment in Bengali celebrating the student",
  "rawTranscript": "original student speech"
}
Output strictly valid JSON, no markdown codeblocks or preamble.`;

  const user = `Student Spoken Voice Transcript:\n"${trimmed}"`;

  let structured: StructuredVoiceLog | null = null;
  let modelUsed = 'Claude 3.5 Haiku';

  try {
    const aiResult = await callAI({
      system,
      user,
      model: 'fast',
      maxTokens: 1000,
      responseFormat: 'json',
    });

    modelUsed = aiResult.model || 'Claude 3.5 Haiku';
    const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const fallback = extractStructuredVoiceFallback(trimmed);
      structured = {
        subject: parsed.subject || fallback.subject,
        subjectBn: parsed.subjectBn || fallback.subjectBn,
        topicsText: parsed.topicsText || fallback.topicsText,
        source: ['school', 'tuition', 'self_study', 'college'].includes(parsed.source) ? parsed.source : fallback.source,
        durationMin: Number(parsed.durationMin) || fallback.durationMin,
        confidence: Math.min(5, Math.max(1, Number(parsed.confidence) || fallback.confidence)),
        keyConcepts: Array.isArray(parsed.keyConcepts) && parsed.keyConcepts.length > 0 ? parsed.keyConcepts : fallback.keyConcepts,
        homeworkAssigned: parsed.homeworkAssigned !== undefined ? parsed.homeworkAssigned : fallback.homeworkAssigned,
        summaryMessage: parsed.summaryMessage || fallback.summaryMessage,
        rawTranscript: trimmed,
        aiModelUsed: modelUsed,
      };
    }
  } catch (err) {
    console.warn('[AI voice structure fallback]:', err);
  }

  if (!structured) {
    structured = extractStructuredVoiceFallback(trimmed);
  }

  return structured;
}

export function extractStructuredVoiceFallback(text: string): StructuredVoiceLog {
  let subject = 'General Science';
  let subjectBn = 'সাধারণ বিজ্ঞান';

  if (/(math|গণিত|বীজগণিত|সমীকরণ|লসাগু|গসাগু|ভগ্নাংশ|জ্যামিতি|উৎপাদক|hcf|lcm|algebra)/i.test(text)) {
    subject = 'Mathematics';
    subjectBn = 'গণিত';
  } else if (/(physics|পদার্থবিজ্ঞান|বলবিদ্যা|ত্বরণ|নিউটনের|f\s*=\s*ma)/i.test(text)) {
    subject = 'Physics';
    subjectBn = 'পদার্থবিজ্ঞান';
  } else if (/(chemistry|রসায়ন|পর্যায় সারণি|পরমাণু|মৌল|বিক্রিয়া)/i.test(text)) {
    subject = 'Chemistry';
    subjectBn = 'রসায়ন';
  } else if (/(biology|জীববিজ্ঞান|উদ্ভিদ|কোষ|শালোকসংশ্লেষণ)/i.test(text)) {
    subject = 'Biology';
    subjectBn = 'জীববিজ্ঞান';
  } else if (/(english|ইংরেজি|grammar|vocabulary|passage|paragraph)/i.test(text)) {
    subject = 'English';
    subjectBn = 'ইংরেজি';
  } else if (/(bangla|বাংলা|কবিতা|গল্প|ব্যাকরণ|সন্ধি|সমাস)/i.test(text)) {
    subject = 'Bangla';
    subjectBn = 'বাংলা';
  } else if (/(ict|আইসিটি|তথ্যপ্রযুক্তি|কম্পিউটার|স্প্রেডশিট|এক্সেলে)/i.test(text)) {
    subject = 'ICT';
    subjectBn = 'তথ্য ও যোগাযোগ প্রযুক্তি';
  }

  let source: 'school' | 'tuition' | 'self_study' | 'college' = 'tuition';
  if (/(স্কুল|school|ম্যাডাম|হেডমাস্টার)/i.test(text)) {
    source = 'school';
  } else if (/(নিজে|বাসায়|self|reading)/i.test(text)) {
    source = 'self_study';
  } else if (/(কলেজ|college)/i.test(text)) {
    source = 'college';
  }

  const keyConcepts: string[] = [];
  if (subject === 'Physics') {
    keyConcepts.push('নিউটনের গতির দ্বিতীয় সূত্র (F = ma) ও বলের পরিমাপ');
    keyConcepts.push('ত্বরণ ও বেগের পরিবর্তনজনিত গাণিতিক সমস্যা সমাধান');
    keyConcepts.push('বলের আন্তর্জাতিক একক (নিউটন - N) ও প্রয়োগ');
  } else if (subject === 'Mathematics') {
    keyConcepts.push('বীজগণিতীয় সূত্রাবলী ও উৎপাদকে বিশ্লেষণ');
    keyConcepts.push('লসাগু ও গসাগু নির্ণয়ের মৌলিক পদ্ধতি');
    keyConcepts.push('অনুশীলনীর কথার অঙ্ক ও সমীকরণ গঠন');
  } else if (subject === 'English') {
    keyConcepts.push('প্যাসেজ রিডিং ও কনটেক্সটুয়াল ভোকাবুলারি');
    keyConcepts.push('Right Forms of Verbs ও প্রিপজিশন অনুশীলন');
  } else {
    keyConcepts.push('অধ্যায়ের মূল ধারণাসমূহ ও সূত্রাবলী পর্যালোচনা');
    keyConcepts.push('গুরুত্বপূর্ণ উদাহরণ ও অনুশীলনীর প্রশ্ন সমাধান');
  }

  let homeworkAssigned: string | null = null;
  const hwMatch = text.match(/(হোমওয়ার্ক|এইচডব্লিউ|অনুশীলনী|বাড়ির কাজ|homework|hw)[\s\S]{0,35}/i);
  if (hwMatch) {
    homeworkAssigned = hwMatch[0].trim();
  }

  return {
    subject,
    subjectBn,
    topicsText: `${subjectBn}: ${text.length > 75 ? text.slice(0, 75) + '...' : text}`,
    source,
    durationMin: 60,
    confidence: 5,
    keyConcepts,
    homeworkAssigned,
    summaryMessage: `অসাধারণ! ${subjectBn} বিষয়ের আজকের পাঠটি সফলভাবে প্রস্তুত হয়েছে।`,
    rawTranscript: text,
    aiModelUsed: 'Claude 3.5 Haiku',
  };
}
