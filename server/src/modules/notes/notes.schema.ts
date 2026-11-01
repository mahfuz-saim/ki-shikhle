import { z } from 'zod';
export const aiOcrSchema = z.object({ params: z.object({ id: z.string() }) });
