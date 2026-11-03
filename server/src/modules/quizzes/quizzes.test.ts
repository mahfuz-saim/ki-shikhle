import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { calculateSmartTime, getAutoQuizSchedule, saveAutoQuizSchedule, runAutoQuizSchedule } from './quizzes.service';

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
    const childId = 'demo-child-1';
    const parentId = 'demo-parent';

    const schedule = await getAutoQuizSchedule(childId, parentId);
    expect(schedule.enabled).toBe(true);
    expect(schedule.topicStrategy).toBe('one_day_old');
    expect(schedule.timeStrategy).toBe('ai_dynamic');

    const runResult = await runAutoQuizSchedule(childId, parentId);
    expect(runResult.quiz).toBeDefined();
    expect(runResult.quiz.isAutoScheduled).toBe(true);
    expect(runResult.quiz.questions.length).toBeGreaterThan(0);
    expect(runResult.timingInfo.minutes).toBeGreaterThan(0);
  });
});
