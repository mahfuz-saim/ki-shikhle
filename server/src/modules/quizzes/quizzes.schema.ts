import { z } from 'zod';
export const generateQuizSchema = z.object({
  body: z.object({
    subjectIds: z.array(z.string()).optional(),
    subject: z.string().optional(), // alias
    scope: z.enum(['yesterday','today','last7','last30','custom','entries','notes']).default('last7'),
    from: z.string().optional(),
    to: z.string().optional(),
    entryIds: z.array(z.string()).optional(),
    noteIds: z.array(z.string()).optional(),
    numQuestions: z.enum(['5','10','15','20']).or(z.number()).default(10),
    difficulty: z.enum(['easy','mixed','hard']).default('mixed'),
    types: z.array(z.enum(['mcq','true_false','fill_blank'])).default(['mcq','true_false','fill_blank']),
    language: z.enum(['en','bn']).default('en'),
    timeLimitMin: z.number().optional(),
    title: z.string().optional(),
  }),
  params: z.object({ id: z.string() }),
});
export const quizIdParam = z.object({ params: z.object({ id: z.string() }) });
export const questionPatchSchema = z.object({
  params: z.object({ id: z.string(), qid: z.string() }),
  body: z.object({ prompt: z.string().optional(), options: z.array(z.string()).optional(), correct_answer: z.string().optional(), explanation: z.string().optional() }),
});
export const attemptSchema = z.object({ params: z.object({ id: z.string() }) });
export const answerSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ answers: z.array(z.object({ questionId: z.string(), answer: z.string() })) }),
});
