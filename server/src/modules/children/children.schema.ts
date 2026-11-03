import { z } from 'zod';

export const createChildSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    nickname: z.string().max(50).optional(),
    grade: z.string().min(1).max(20),
    curriculum: z.string().default('NCTB'),
    medium: z.enum(['Bangla', 'English']).default('Bangla'),
    avatar: z.string().url().optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    password: z.string().min(4).optional().or(z.literal('')),
    pin: z.string().min(4).max(6).optional(),
    dob: z.string().optional(),
  }),
});

export const updateChildSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    nickname: z.string().max(50).optional(),
    grade: z.string().optional(),
    curriculum: z.string().optional(),
    medium: z.enum(['Bangla', 'English']).optional(),
    avatar: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    password: z.string().min(4).optional().or(z.literal('')),
    pin: z.string().min(4).max(6).optional(),
  }),
  params: z.object({ id: z.string() }),
});

export const pinSchema = z.object({
  body: z.object({ pin: z.string().min(4).max(6) }),
  params: z.object({ id: z.string() }),
});

export const enterSchema = z.object({
  body: z.object({ pin: z.string().min(4).max(6) }),
  params: z.object({ id: z.string() }),
});

export const unloggedAlertSchema = z.object({
  body: z.object({
    enabled: z.boolean().optional(),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    channel: z.enum(['in_app', 'email', 'all']).optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  }),
  params: z.object({ id: z.string() }),
});
