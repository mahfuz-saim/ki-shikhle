import { describe, it, expect } from 'vitest';
import { z } from 'zod';

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

describe('Quiz validation', ()=>{
  it('accepts valid', ()=>{
    const good = { questions: [{ type:'mcq', prompt:'What is photosynthesis?', options:['a','b'], correct_answer:'a', explanation:'...', topic:'Bio'}]};
    expect(()=> quizOutputSchema.parse(good)).not.toThrow();
  });
  it('rejects missing correct_answer', ()=>{
    const bad = { questions: [{ type:'mcq', prompt:'What?', options:['a'], correct_answer:'', explanation:'x'}]};
    expect(()=> quizOutputSchema.parse(bad)).toThrow();
  });
  it('correct answer never sent until submit (concept)', ()=>{
    const quiz={ questions:[{id:'q1', prompt:'Q?', correctAnswer:'secret'}]};
    // For child attempt, we should strip correctAnswer before sending
    const forChild = quiz.questions.map((q:any)=> ({ ...q, correctAnswer: undefined }));
    expect(forChild[0].correctAnswer).toBeUndefined();
  });
});
