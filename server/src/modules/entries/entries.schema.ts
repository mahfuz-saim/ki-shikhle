import { z } from 'zod';
export const createEntrySchema = z.object({
  body: z.object({
    subjectId: z.string().optional(),
    source: z.enum(['school', 'college', 'tuition', 'self_study']),
    providerName: z.string().optional(),
    date: z.string(), // YYYY-MM-DD
    topicsText: z.string().min(1),
    durationMin: z.number().min(1).max(600).optional(),
    confidence: z.number().min(1).max(5).optional(),
    routineId: z.string().optional(),
    notes: z.string().optional(),
  }),
  params: z.object({ id: z.string() }), // childId
});
export const updateEntrySchema = z.object({
  body: z.object({
    subjectId: z.string().optional(),
    topicsText: z.string().optional(),
    durationMin: z.number().optional(),
    confidence: z.number().optional(),
    notes: z.string().optional(),
  }),
  params: z.object({ id: z.string() }),
});
export const verifySchema = z.object({ params: z.object({ id: z.string() }) });
