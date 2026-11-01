import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().toLowerCase(),
    password: z.string().min(8),
    language: z.enum(['en', 'bn']).default('en'),
    country: z.string().default('BD'),
    timezone: z.string().default('Asia/Dhaka'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1),
  }),
});

export const refreshSchema = z.object({ body: z.object({}).passthrough() });
export const verifyEmailSchema = z.object({ body: z.object({ token: z.string().min(10) }) });
export const resendVerificationSchema = z.object({ body: z.object({ email: z.string().email() }) });
export const forgotPasswordSchema = z.object({ body: z.object({ email: z.string().email() }) });
export const resetPasswordSchema = z.object({ body: z.object({ token: z.string().min(10), password: z.string().min(8) }) });
export const changePasswordSchema = z.object({ body: z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) }) });
