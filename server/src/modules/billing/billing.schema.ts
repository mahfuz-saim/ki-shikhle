import { z } from 'zod';
export const checkoutSchema = z.object({
  body: z.object({
    planCode: z.enum(['starter','standard','premium']),
    childCount: z.number().min(1).max(10).default(1),
    billingPeriod: z.enum(['monthly','yearly']).default('monthly'),
    simulateFailure: z.boolean().optional(),
  }),
});
