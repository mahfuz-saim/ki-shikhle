import { z } from 'zod';

export const createRoutineSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    subjectId: z.string().optional(),
    subject: z.string().optional(),
    periodName: z.string().optional(),
    teacher: z.string().optional(),
    room: z.string().optional(),
    color: z.string().optional(),
    source: z.enum(['school', 'college', 'tuition', 'self_study']),
    weekdays: z.array(z.number().min(0).max(6)).min(1),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().optional(),
    durationMin: z.number().min(5).max(600),
    startsOn: z.string(),
    endsOn: z.string().optional().nullable(),
    active: z.boolean().optional(),
  }),
  params: z.object({ id: z.string() }),
});

export const exceptionSchema = z.object({
  body: z.object({
    originalDate: z.string(),
    type: z.enum(['rescheduled', 'cancelled', 'extra']),
    newDate: z.string().optional(),
    newStartTime: z.string().optional(),
    note: z.string().optional(),
  }),
  params: z.object({ id: z.string() }),
});
