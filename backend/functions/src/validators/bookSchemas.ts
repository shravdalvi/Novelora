import { z } from 'zod';

export const CreateBookSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().min(1, 'Description is required').max(2000, 'Description cannot exceed 2000 characters'),
  genres: z.array(z.string().trim()).min(1, 'At least one genre is required').max(5, 'Maximum of 5 genres allowed'),
  tags: z.array(z.string().trim()).max(10, 'Maximum of 10 tags allowed').default([]),
  status: z.enum(['ongoing', 'completed']),
  visibility: z.enum(['draft', 'published']),
  coverImageUrl: z.string().url('Invalid cover image URL').optional().or(z.literal('')),
});

export const UpdateBookSchema = CreateBookSchema.partial().extend({
  id: z.string().min(1, 'Book ID is required'),
});

export const DeleteBookSchema = z.object({
  id: z.string().min(1, 'Book ID is required'),
});

export type CreateBookInput = z.infer<typeof CreateBookSchema>;
export type UpdateBookInput = z.infer<typeof UpdateBookSchema>;
export type DeleteBookInput = z.infer<typeof DeleteBookSchema>;

