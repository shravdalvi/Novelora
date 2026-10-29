import { z } from 'zod';

export const SubscribeSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

export type SubscribeInput = z.infer<typeof SubscribeSchema>;

