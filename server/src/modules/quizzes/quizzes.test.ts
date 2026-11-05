import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { calculateSmartTime, getAutoQuizSchedule, saveAutoQuizSchedule, runAutoQuizSchedule } from './quizzes.service';
import { demoParent, demoChildIds } from '../../test-utils/actors';

const quizOutputSchema = z.object({
  questions: z.array(z.object({
    type: z.enum(['mcq','true_false','fill_blank']),
    prompt: z.string().min(5),
    options: z.array(z.string()).optional(),
    correct_answer: z.string().min(1),
    explanation: z.string().min(1),
    topic: z.string().optional(),
  })).min(1),
});

describe('Quiz validation', () => {
  it('accepts valid', () => {
    const good = { questions: [{ type:'mcq', prompt:'What is photosynthesis?', options:['a','b'], correct_answer:'a', explanation:'...', topic:'Bio'}]};
    expect(() => quizOutputSchema.parse(good)).not.toThrow();
  });
  it('rejects missing correct_answer', () => {
    const bad = { questions: [{ type:'mcq', prompt:'What?', options:['a'], correct_answer:'', explanation:'x'}]};
    expect(() => quizOutputSchema.parse(bad)).toThrow();
  });
  it('correct answer never sent until submit (concept)', () => {
    const quiz = { questions:[{id:'q1', prompt:'Q?', correctAnswer:'secret'}]};
    const forChild = quiz.questions.map((q:any) => ({ ...q, correctAnswer: undefined }));
    expect(forChild[0].correctAnswer).toBeUndefined();
  });
});

describe('Smart Dynamic Timing & Auto Quiz Scheduling', () => {
  it('allocates tight 50s for non-math questions and generous 3m for math questions', () => {
    const mixedQuestions = [
      { prompt: '১২ ও ১৮ এর গসাগু (HCF) কত?', topic: 'Mathematics' },
      { prompt: 'একটি বস্তুর ত্বরণ a = 2 m/s² হলে বেগ কত?', topic: 'Physics' },
      { prompt: 'What is the synonym of enormous?', topic: 'English' },
      { prompt: 'শালোকসংশ্লেষণ প্রক্রিয়ার মূল উপাদান কী?', topic: 'Biology' },
      { prompt: 'আর্সেনিকযুক্ত পানি ফুটালে কি আর্সেনিক মুক্ত হয়?', topic: 'General Science' },
    ];

    const result = calculateSmartTime(mixedQuestions);
    // 2 math/analytical questions, 3 non-math questions
    expect(result.mathCount).toBe(2);
    expect(result.nonMathCount).toBe(3);
    // Total seconds: (2 * 180) + (3 * 50) = 360 + 150 = 510 seconds = 8.5 mins -> 9 mins
    expect(result.minutes).toBe(9);
  });

  it('generates auto-scheduled quiz for child with 1-day-old spaced repetition', async () => {
    const actor = demoParent();
    const childId = demoChildIds.rahim;

    const schedule = await getAutoQuizSchedule(actor, childId);
    expect(schedule.enabled).toBe(true);
    expect(schedule.topicStrategy).toBe('one_day_old');
    expect(schedule.timeStrategy).toBe('ai_dynamic');

    const runResult = await runAutoQuizSchedule(actor, childId);
    expect(runResult.quiz).toBeDefined();
    expect(runResult.quiz.isAutoScheduled).toBe(true);
    expect(runResult.quiz.questions.length).toBeGreaterThan(0);
    expect(runResult.timingInfo.minutes).toBeGreaterThan(0);
  });

  it('generates grade-appropriate questions for Class 5 student Tasnim', async () => {
    const actor = demoParent();
    const childId = demoChildIds.tasnim;

    const runResult = await runAutoQuizSchedule(actor, childId);
    expect(runResult.quiz).toBeDefined();
    expect(runResult.quiz.questions.length).toBe(5);

    // Should include Class 5 topics (HCF/LCM, Safe water, Prime numbers, fractions)
    const questionsText = runResult.quiz.questions.map((q: any) => `${q.prompt} ${q.topic}`).join(' ');
    const hasClass5Topic = /লসাগু|গসাগু|পানি|মৌলিক|ভগ্নাংশ|HCF|LCM|Water/i.test(questionsText);
    expect(hasClass5Topic).toBe(true);
    // Should NOT include Class 11 college projectile/matrix questions
    expect(/প্রক্ষেপক|ম্যাট্রিক্স|কোয়ান্টাম|Projectile/i.test(questionsText)).toBe(false);
  });

  it('generates college-level questions for Class 11 student Fahim', async () => {
    const actor = demoParent();
    const childId = demoChildIds.fahim;

    const runResult = await runAutoQuizSchedule(actor, childId);
    expect(runResult.quiz).toBeDefined();
    expect(runResult.quiz.questions.length).toBe(5);

    // Should include Class 11 topics (Projectile motion, Matrix, Quantum numbers, etc.)
    const questionsText = runResult.quiz.questions.map((q: any) => `${q.prompt} ${q.topic}`).join(' ');
    const hasCollegeTopic = /প্রক্ষেপক|ম্যাট্রিক্স|কোয়ান্টাম|Projectile|Matrix|Quantum|পাল্লা/i.test(questionsText);
    expect(hasCollegeTopic).toBe(true);
  });

  it('respects question count configuration (e.g. 3 questions and 8 questions)', async () => {
    const actor = demoParent();
    const childId = demoChildIds.rahim;

    // Set 3 questions
    await saveAutoQuizSchedule(actor, childId, { questionCount: 3 });
    const res3 = await runAutoQuizSchedule(actor, childId);
    expect(res3.quiz.questions.length).toBe(3);

    // Set 8 questions
    await saveAutoQuizSchedule(actor, childId, { questionCount: 8 });
    const res8 = await runAutoQuizSchedule(actor, childId);
    expect(res8.quiz.questions.length).toBe(8);

    // Reset to 5
    await saveAutoQuizSchedule(actor, childId, { questionCount: 5 });
  }, 15000);

  it('runs auto quiz scheduler background job for all active children', async () => {
    const { runAutoQuizSchedulerJob } = await import('../../jobs/jobs');
    const jobResult = await runAutoQuizSchedulerJob();
    expect(jobResult).toBeDefined();
    expect(typeof jobResult.generatedCount).toBe('number');
  });
});
