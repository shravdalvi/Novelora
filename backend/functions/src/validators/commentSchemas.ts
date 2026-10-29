import { z } from 'zod';

export const AddCommentSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  chapterId: z.string().min(1, 'Chapter ID is required'),
  text: z.string().trim().min(1, 'Comment cannot be empty').max(1000, 'Comment cannot exceed 1000 characters'),
});

export const DeleteCommentSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  chapterId: z.string().min(1, 'Chapter ID is required'),
  commentId: z.string().min(1, 'Comment ID is required'),
});

export type AddCommentInput = z.infer<typeof AddCommentSchema>;
export type DeleteCommentInput = z.infer<typeof DeleteCommentSchema>;

