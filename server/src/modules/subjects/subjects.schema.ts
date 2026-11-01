import { z } from 'zod';
export const createSubjectSchema = z.object({
  body: z.object({
    nameEn: z.string().min(1),
    nameBn: z.string().optional(),
    curriculum: z.string().default('NCTB'),
    grade: z.string().optional(),
  }),
});
export const updateSubjectSchema = z.object({
  body: z.object({ nameEn: z.string().min(1).optional(), nameBn: z.string().optional() }),
  params: z.object({ id: z.string() }),
});
