import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    // Only the catalogue plans may be purchased. The legacy codes ('trial',
    // 'starter', 'standard') are still held by existing subscribers but are no
    // longer sold — `standard` at ৳299 grants five children while `premium` at
    // ৳599 grants two, so leaving it purchasable would undercut the flagship plan.
    planCode: z.enum(['free', 'basic', 'premium', 'pro']),
    childCount: z.number().min(1).max(20).default(1),
    billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
    simulateFailure: z.boolean().optional(),
    method: z.string().optional(),
    walletNumber: z.string().optional(),
  }),
});
