import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    planCode: z.enum(['free', 'basic', 'premium', 'pro', 'starter', 'standard', 'trial']),
    childCount: z.number().min(1).max(20).default(1),
    billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
    simulateFailure: z.boolean().optional(),
    method: z.string().optional(),
    walletNumber: z.string().optional(),
  }),
});
