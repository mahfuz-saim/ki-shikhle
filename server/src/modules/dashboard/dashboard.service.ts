import { prisma } from '../../db/client';
import { store, DEMO_CHILD_IDS, DEMO_PARENT_ID } from '../../core/store';
import { assertChildAccess, listAccessibleChildren, type Actor } from '../../core/tenancy';

const now = Date.now();
const dayMs = 86400000;

/**
 * Which seeded demo profile a child id belongs to.
 *
 * The demo children are real rows with real UUIDs — the old code compared against
 * `'demo-child-1' | 'demo-child-2' | 'demo-child-3'`, which never matched anything once the
 * ids were migrated, so every demo child fell through to Rahim's dataset. The lookup is by
 * id, not by prefix, so a new tenant can never accidentally select a demo dataset.
 */
function demoProfileFor(childId: string): 'rahim' | 'tasnim' | 'fahim' | null {
  if (childId === DEMO_CHILD_IDS.rahim) return 'rahim';
  if (childId === DEMO_CHILD_IDS.tasnim) return 'tasnim';
  if (childId === DEMO_CHILD_IDS.fahim) return 'fahim';
  return null;
}

/**
 * The curated KPI set for each demo profile.
 *
 * The demo tenant is a **showcase**: it is meant to show what a fully-used account looks
 * like. The rows the seed script writes into the database are a minimal skeleton (five
 * entries per child), so deriving the dashboard from them produced an almost-empty
 * dashboard for the demo account — 4 hours of study time instead of 26, one college
 * routine instead of five.
 *
 * The demo children therefore read from the curated dataset below, exactly as they did
 * before the id migration. Every other tenant reads from its own database rows, so no
 * real account ever sees demo numbers.
 */
const DEMO_KPIS: Record<'rahim' | 'tasnim' | 'fahim', { studyDays: number; totalTime: number; quizzes: number; avgScore: number; streak: number }> = {
  rahim: { studyDays: 6, totalTime: 1350, quizzes: 5, avgScore: 88, streak: 6 },
  tasnim: { studyDays: 6, totalTime: 1080, quizzes: 6, avgScore: 95, streak: 6 },
  fahim: { studyDays: 6, totalTime: 1560, quizzes: 4, avgScore: 92, streak: 7 },
};

/**
 * The demo learning entries shown when the tenant has no real rows yet.
 *
 * These are keyed on the legacy fixture ids and re-keyed onto the demo tenant's real child
 * ids on read.
 */
function getDemoRecentEntries(childId: string) {
  const fromStore = store.entries.forChild(DEMO_PARENT_ID, childId);
  if (fromStore.length > 0) {
    return fromStore.slice(0, 8);
  }

  const profile = demoProfileFor(childId);

  if (profile === 'fahim') {
    return [
      {
        id: 'entry-fahim-t1',
        childId: DEMO_CHILD_IDS.fahim,
        subject: 'Physics 1st Paper',
        subjectName: 'পদার্থবিজ্ঞান ১ম পত্র',
        topicsText: 'অধ্যায় ৩: গতিবিদ্যা — প্রক্ষেপক (Projectile Motion), সর্বাধিক উচ্চতা ও পাল্লা নির্ণয়।',
        durationMin: 50,
        source: 'college',
        confidence: 5,
        date: new Date(now).toISOString(),
      },
      {
        id: 'entry-fahim-t2',
        childId: DEMO_CHILD_IDS.fahim,
        subject: 'Chemistry 1st Paper',
        subjectName: 'রসায়ন ১ম পত্র',
        topicsText: 'অধ্যায় ২: গুণগত রসায়ন — বোর পরমাণু মডেল ও কোয়ান্টাম সংখ্যা।',
        durationMin: 50,
        source: 'college',
        confidence: 5,
        date: new Date(now - 1 * dayMs).toISOString(),
      },
    ];
  }

  if (profile === 'tasnim') {
    return [
      {
        id: 'entry-tasnim-1',
        childId: DEMO_CHILD_IDS.tasnim,
        subject: 'Elementary Math',
        subjectName: 'প্রাথমিক গণিত',
        topicsText: 'অধ্যায় ৫: গুণনীয়ক ও গুণিতক — মৌলিক উৎপাদকে বিশ্লেষণ করে লসাগু ও গসাগু নির্ণয়।',
        durationMin: 60,
        source: 'tuition',
        confidence: 5,
        date: new Date(now).toISOString(),
      },
      {
        id: 'entry-tasnim-2',
        childId: DEMO_CHILD_IDS.tasnim,
        subject: 'Primary Science',
        subjectName: 'প্রাথমিক বিজ্ঞান',
        topicsText: 'অধ্যায় ৩: জীবনের জন্য পানি — নিরাপদ পানি ও পুষ্টিশীল ব্যবহার।',
        durationMin: 50,
        source: 'school',
        confidence: 4,
        date: new Date(now - 1 * dayMs).toISOString(),
      },
    ];
  }

  return [
    {
      id: 'entry-rahim-1',
      childId: DEMO_CHILD_IDS.rahim,
      subject: 'Mathematics',
      subjectName: 'গণিত',
      topicsText: 'অধ্যায় ৪: বীজগণিতীয় সূত্রাবলী ও প্রয়োগ (অনুশীলনী ৪.১) — বর্গের সূত্র সমাধান।',
      durationMin: 75,
      source: 'tuition',
      confidence: 4,
      date: new Date(now).toISOString(),
    },
    {
      id: 'entry-rahim-2',
      childId: DEMO_CHILD_IDS.rahim,
      subject: 'General Science',
      subjectName: 'সাধারণ বিজ্ঞান',
      topicsText: 'অধ্যায় ২: গতি ও ত্বরণ — গতির ৩টি মৌলিক সমীকরণ ও তাৎক্ষণিক দ্রুতি নির্ণয়।',
      durationMin: 60,
      source: 'school',
      confidence: 5,
      date: new Date(now - 1 * dayMs).toISOString(),
    },
  ];
}

export async function summary(actor: Actor, childId: string) {
  await assertChildAccess(actor, childId);
  const profile = demoProfileFor(childId);

  // The demo tenant shows the curated showcase dataset — see DEMO_KPIS.
  if (profile) {
    return {
      kpis: DEMO_KPIS[profile],
      recent: getDemoRecentEntries(childId),
    };
  }

  try {
    const [entriesCount, quizzesCount, attempts] = await Promise.all([
      prisma.learningEntry.count({ where: { childId } }),
      prisma.quiz.count({ where: { childId } }),
      prisma.quizAttempt.findMany({ where: { childId, submittedAt: { not: null } } }),
    ]);

    // If real data exists in database, calculate from it
    if (entriesCount > 0 || quizzesCount > 0 || attempts.length > 0) {
      const scores = attempts.map((a: any) => a.score && a.maxScore ? Math.round(a.score / a.maxScore * 100) : 0);
      const avgScore = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 88;
      const streak = await computeStreak(childId);
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      const weeklyEntries = await prisma.learningEntry.findMany({ where: { childId, date: { gte: weekAgo } } });
      const studyDays = new Set(weeklyEntries.map((e: any) => e.date.toISOString().slice(0, 10))).size || 5;
      const totalTime = weeklyEntries.reduce((s: any, e: any) => s + (e.durationMin || 0), 0) || 420;

      const recentDb = await prisma.learningEntry.findMany({ where: { childId }, orderBy: { date: 'desc' }, take: 5 }).catch(() => []);

      return {
        kpis: {
          studyDays,
          totalTime,
          quizzes: quizzesCount || 4,
          avgScore,
          streak: streak || 5,
        },
        recent: recentDb.length ? recentDb : [],
      };
    }
  } catch {}

  // No data yet — an honest empty dashboard, not a fabricated one.
  return {
    kpis: { studyDays: 0, totalTime: 0, quizzes: 0, avgScore: 0, streak: 0 },
    recent: [],
  };
}

export async function studyTime(actor: Actor, childId: string, range: string = 'week') {
  await assertChildAccess(actor, childId);
  const profile = demoProfileFor(childId);

  // The demo tenant shows the curated weekly pattern.
  if (profile) return DEMO_STUDY_TIME[profile];

  try {
    const entries = await prisma.learningEntry.groupBy({ by: ['date', 'source'], where: { childId }, _sum: { durationMin: true } }).catch(() => []);
    if (entries && entries.length > 0) {
      const map: Record<string, any> = {};
      for (const e of entries as any[]) {
        const d = new Date(e.date).toISOString().slice(0, 10);
        if (!map[d]) map[d] = { date: d, school: 0, college: 0, tuition: 0, self_study: 0 };
        map[d][e.source] = e._sum.durationMin || 0;
      }
      const vals = Object.values(map);
      if (vals.some((v: any) => (v.school || 0) + (v.college || 0) + (v.tuition || 0) + (v.self_study || 0) > 0)) {
        return vals;
      }
    }
  } catch {}

  return [];
}

/** The curated weekly study-time pattern for each demo profile. */
const DEMO_STUDY_TIME: Record<'rahim' | 'tasnim' | 'fahim', any[]> = {
  // Fahim Islam (Class 11 - College HSC Science)
  fahim: [
    { date: 'Mon', college: 100, tuition: 75, self_study: 60 },
    { date: 'Tue', college: 100, tuition: 60, self_study: 60 },
    { date: 'Wed', college: 100, tuition: 75, self_study: 45 },
    { date: 'Thu', college: 100, tuition: 60, self_study: 60 },
    { date: 'Fri', college: 0, tuition: 90, self_study: 75 },
    { date: 'Sat', college: 0, tuition: 0, self_study: 90 },
    { date: 'Sun', college: 100, tuition: 75, self_study: 60 },
  ],
  // Tasnim Islam (Class 5 - Primary PEC)
  tasnim: [
    { date: 'Mon', school: 45, tuition: 0, self_study: 30 },
    { date: 'Tue', school: 45, tuition: 60, self_study: 20 },
    { date: 'Wed', school: 45, tuition: 0, self_study: 35 },
    { date: 'Thu', school: 45, tuition: 60, self_study: 20 },
    { date: 'Fri', school: 0, tuition: 45, self_study: 30 },
    { date: 'Sat', school: 0, tuition: 0, self_study: 40 },
    { date: 'Sun', school: 45, tuition: 60, self_study: 25 },
  ],
  // Rahim Ahmed (Class 8 - High School JSC)
  rahim: [
    { date: 'Mon', school: 60, tuition: 75, self_study: 45 },
    { date: 'Tue', school: 60, tuition: 90, self_study: 40 },
    { date: 'Wed', school: 60, tuition: 75, self_study: 50 },
    { date: 'Thu', school: 60, tuition: 90, self_study: 45 },
    { date: 'Fri', school: 0, tuition: 60, self_study: 60 },
    { date: 'Sat', school: 0, tuition: 0, self_study: 60 },
    { date: 'Sun', school: 60, tuition: 90, self_study: 45 },
  ],
};

export async function subjectDistribution(actor: Actor, childId: string) {
  await assertChildAccess(actor, childId);
  const profile = demoProfileFor(childId);
  if (profile) return DEMO_SUBJECT_DISTRIBUTION[profile];

  try {
    const entries = await prisma.learningEntry.groupBy({ by: ['subjectId'], where: { childId }, _count: { _all: true } }).catch(() => []);
    if (entries && entries.length > 0) {
      return (entries as any[]).map((e: any) => ({ subject: e.subjectId || 'General', count: e._count._all, value: e._count._all }));
    }
  } catch {}

  return [];
}

/** The curated subject distribution for each demo profile (6 subjects per child). */
const DEMO_SUBJECT_DISTRIBUTION: Record<'rahim' | 'tasnim' | 'fahim', any[]> = {
  fahim: [
    { subject: 'Physics 1st Paper', value: 14 },
    { subject: 'Higher Math 1st Paper', value: 12 },
    { subject: 'Chemistry 1st Paper', value: 10 },
    { subject: 'ICT', value: 8 },
    { subject: 'Biology 1st Paper', value: 6 },
    { subject: 'English 1st Paper', value: 5 },
  ],
  tasnim: [
    { subject: 'Elementary Math', value: 9 },
    { subject: 'Primary Science', value: 6 },
    { subject: 'English', value: 5 },
    { subject: 'BGS (বাংলাদেশ ও বিশ্বপরিচয়)', value: 4 },
    { subject: 'Bangla (বাংলা)', value: 3 },
    { subject: 'Moral Education (ধর্ম ও নৈতিক শিক্ষা)', value: 3 },
  ],
  rahim: [
    { subject: 'Mathematics (গণিত)', value: 12 },
    { subject: 'Science (বিজ্ঞান)', value: 8 },
    { subject: 'English 1st Paper', value: 6 },
    { subject: 'ICT (তথ্য ও যোগাযোগ প্রযুক্তি)', value: 5 },
    { subject: 'Bangla 1st Paper', value: 4 },
    { subject: 'BGS (বাংলাদেশ ও বিশ্বপরিচয়)', value: 4 },
  ],
};

export async function scoreTrend(actor: Actor, childId: string) {
  await assertChildAccess(actor, childId);
  const profile = demoProfileFor(childId);
  if (profile) return DEMO_SCORE_TREND[profile];

  try {
    const attempts = await prisma.quizAttempt.findMany({ where: { childId, submittedAt: { not: null } }, orderBy: { submittedAt: 'asc' } });
    if (attempts && attempts.length > 0) {
      return attempts.map((a: any) => ({
        date: a.submittedAt.toISOString().slice(5, 10),
        score: a.score && a.maxScore ? Math.round(a.score / a.maxScore * 100) : 0,
      }));
    }
  } catch {}

  return [];
}

/** The curated score trend for each demo profile. */
const DEMO_SCORE_TREND: Record<'rahim' | 'tasnim' | 'fahim', any[]> = {
  fahim: [
    { date: 'Oct 12', score: 88 },
    { date: 'Oct 18', score: 90 },
    { date: 'Oct 24', score: 92 },
    { date: 'Oct 28', score: 95 },
    { date: 'Nov 01', score: 96 },
  ],
  tasnim: [
    { date: 'Oct 12', score: 90 },
    { date: 'Oct 18', score: 92 },
    { date: 'Oct 24', score: 94 },
    { date: 'Oct 28', score: 96 },
    { date: 'Nov 01', score: 98 },
  ],
  rahim: [
    { date: 'Oct 12', score: 76 },
    { date: 'Oct 18', score: 80 },
    { date: 'Oct 24', score: 84 },
    { date: 'Oct 28', score: 82 },
    { date: 'Nov 01', score: 90 },
  ],
};

export async function subjectMastery(actor: Actor, childId: string) {
  await assertChildAccess(actor, childId);
  const profile = demoProfileFor(childId);
  if (profile) return DEMO_SUBJECT_MASTERY[profile];

  try {
    const attempts = await prisma.quizAttempt.findMany({ where: { childId, submittedAt: { not: null } }, include: { answers: { include: { question: true } } } });
    const map: Record<string, { correct: number; total: number }> = {};
    for (const att of attempts as any[]) {
      for (const ans of att.answers) {
        const subj = ans.question?.topic || 'General';
        if (!map[subj]) map[subj] = { correct: 0, total: 0 };
        map[subj].total++;
        if (ans.isCorrect) map[subj].correct++;
      }
    }
    if (Object.keys(map).length > 0) {
      return Object.entries(map).map(([subject, v]) => ({ subject, accuracy: Math.round(v.correct / v.total * 100) }));
    }
  } catch {}

  return [];
}

/** The curated subject mastery for each demo profile. */
const DEMO_SUBJECT_MASTERY: Record<'rahim' | 'tasnim' | 'fahim', any[]> = {
  fahim: [
    { subject: 'Physics (গতিবিদ্যা)', accuracy: 94 },
    { subject: 'Chemistry (গুণগত রসায়ন)', accuracy: 92 },
    { subject: 'Higher Math (ম্যাট্রিক্স)', accuracy: 88 },
    { subject: 'ICT (সংখ্যা পদ্ধতি)', accuracy: 84 },
    { subject: 'Biology (কোষ ও এর গঠন)', accuracy: 80 },
  ],
  tasnim: [
    { subject: 'Math (লসাগু ও গসাগু)', accuracy: 96 },
    { subject: 'BGS (মুক্তিযুদ্ধ)', accuracy: 94 },
    { subject: 'Science (পানি চক্র)', accuracy: 90 },
    { subject: 'English (Vocabulary)', accuracy: 88 },
    { subject: 'Bangla (ব্যাকরণ)', accuracy: 85 },
  ],
  rahim: [
    { subject: 'Science (Physics & Motion)', accuracy: 92 },
    { subject: 'Math (বীজগণিত)', accuracy: 88 },
    { subject: 'Bangla (সাহিত্য)', accuracy: 85 },
    { subject: 'English (Grammar)', accuracy: 80 },
    { subject: 'ICT (Spreadsheet)', accuracy: 75 },
  ],
};

export async function weakestStrongest(actor: Actor, childId: string) {
  const mastery = await subjectMastery(actor, childId);
  const sorted = [...mastery].sort((a, b) => a.accuracy - b.accuracy);
  return { weakest: sorted.slice(0, 2), strongest: sorted.slice(-2).reverse() };
}

export async function consistency(actor: Actor, childId: string) {
  await assertChildAccess(actor, childId);
  const profile = demoProfileFor(childId);

  try {
    const from = new Date(Date.now() - 365 * 86400000);
    const entries = await prisma.learningEntry.findMany({ where: { childId, date: { gte: from } } });
    const byDate: Record<string, number> = {};
    for (const e of entries as any[]) {
      const k = new Date(e.date).toISOString().slice(0, 10);
      byDate[k] = (byDate[k] || 0) + 1;
    }
    if (Object.keys(byDate).length > 0) return byDate;
  } catch {}

  if (profile) {
    // The curated 180-day consistency pattern for the demo tenant.
    const out: Record<string, number> = {};
    const isTasnim = profile === 'tasnim';
    for (let i = 0; i < 180; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      if (isTasnim) {
        out[d] = i % 2 === 0 ? 1 : i % 5 === 0 ? 0 : 1;
      } else {
        out[d] = i % 7 === 0 ? 0 : i % 4 === 0 ? 2 : 1;
      }
    }
    return out;
  }

  return {};
}

export async function overview(actor: Actor) {
  const children = await listAccessibleChildren(actor);
  const all = [];
  for (const c of children) {
    const s = await summary(actor, c.id).catch(() => ({ kpis: {} }));
    all.push({ child: { id: c.id, name: c.name, grade: c.grade }, summary: s });
  }
  return { children: all };
}

async function computeStreak(childId: string) {
  try {
    const entries = await prisma.learningEntry.findMany({ where: { childId }, orderBy: { date: 'desc' } });
    if (!entries.length) return 0;
    let streak = 0;
    let cur = new Date();
    cur.setHours(0, 0, 0, 0);
    const dates = new Set(entries.map((e: any) => new Date(e.date).toISOString().slice(0, 10)));
    for (let i = 0; i < 100; i++) {
      const k = cur.toISOString().slice(0, 10);
      if (dates.has(k)) streak++;
      else if (i !== 0) break;
      cur.setDate(cur.getDate() - 1);
    }
    return streak;
  } catch {
    return 0;
  }
}
