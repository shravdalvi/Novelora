import { z } from 'zod';

export const CreateChapterSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  title: z.string().trim().min(1, 'Chapter title is required').max(200, 'Title cannot exceed 200 characters'),
  content: z.unknown(),
  backgroundImageUrl: z.string().url('Invalid background image URL').optional().or(z.literal('')),
  overlayOpacity: z.number().min(0).max(1).default(0.5),
  status: z.enum(['draft', 'published']).default('draft'),
  scheduledPublishAt: z.string().datetime({ message: 'scheduledPublishAt must be a valid ISO 8601 date string' }).optional().nullable(),
});

export const UpdateChapterSchema = z.object({
  id: z.string().min(1, 'Chapter ID is required'),
  bookId: z.string().min(1, 'Book ID is required'),
  title: z.string().trim().min(1).max(200).optional(),
  content: z.unknown().optional(),
  backgroundImageUrl: z.string().url('Invalid background image URL').optional().nullable().or(z.literal('')),
  overlayOpacity: z.number().min(0).max(1).optional(),
  status: z.enum(['draft', 'published']).optional(),
  scheduledPublishAt: z.string().datetime({ message: 'scheduledPublishAt must be a valid ISO 8601 date string' }).optional().nullable(),
});

export const PublishChapterSchema = z.object({
  id: z.string().min(1, 'Chapter ID is required'),
  bookId: z.string().min(1, 'Book ID is required'),
});

export const ScheduleChapterSchema = z.object({
  id: z.string().min(1, 'Chapter ID is required'),
  bookId: z.string().min(1, 'Book ID is required'),
  scheduledPublishAt: z.string().datetime({ message: 'scheduledPublishAt must be a valid ISO 8601 date string' }),
});

export const ReorderChaptersSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  orderedIds: z.array(z.string().min(1)).min(1, 'orderedIds must contain at least one chapter ID'),
});

export const DeleteChapterSchema = z.object({
  id: z.string().min(1, 'Chapter ID is required'),
  bookId: z.string().min(1, 'Book ID is required'),
});

export const GetUploadUrlSchema = z.object({
  folder: z.enum(['covers', 'chapter-images', 'backgrounds', 'avatars']),
  fileName: z.string().min(1, 'File name is required'),
  contentType: z.string().refine((val) => val.startsWith('image/'), {
    message: "Content type must start with 'image/'",
  }),
});

export type CreateChapterInput = z.infer<typeof CreateChapterSchema>;
export type UpdateChapterInput = z.infer<typeof UpdateChapterSchema>;
export type PublishChapterInput = z.infer<typeof PublishChapterSchema>;
export type ScheduleChapterInput = z.infer<typeof ScheduleChapterSchema>;
export type ReorderChaptersInput = z.infer<typeof ReorderChaptersSchema>;
export type DeleteChapterInput = z.infer<typeof DeleteChapterSchema>;
export type GetUploadUrlInput = z.infer<typeof GetUploadUrlSchema>;

