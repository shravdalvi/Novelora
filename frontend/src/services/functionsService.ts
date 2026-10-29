import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import type { Book, Chapter, AdminStats, UploadUrlResponse } from '../types'

// Helper wrapper for callable functions
async function callFunction<TRequest = any, TResponse = any>(
  name: string,
  data?: TRequest
): Promise<TResponse> {
  const callable = httpsCallable<TRequest, TResponse>(functions, name)
  const result = await callable(data)
  return result.data
}

// ========================
// ADMIN BOOK FUNCTIONS
// ========================

export interface CreateBookData {
  title: string
  slug: string
  description: string
  coverImageUrl: string
  genres: string[]
  tags: string[]
  status: 'ongoing' | 'completed'
  visibility: 'draft' | 'published'
}

export interface UpdateBookData extends Partial<CreateBookData> {
  id: string
}

export async function adminCreateBook(data: CreateBookData): Promise<{ id: string; book: Book }> {
  return await callFunction('adminCreateBook', data)
}

export async function adminUpdateBook(data: UpdateBookData): Promise<{ id: string; success: boolean }> {
  return await callFunction('adminUpdateBook', data)
}

export async function adminDeleteBook(bookId: string): Promise<{ success: boolean }> {
  return await callFunction('adminDeleteBook', { bookId })
}

// ========================
// ADMIN CHAPTER FUNCTIONS
// ========================

export interface CreateChapterData {
  bookId: string
  title: string
  chapterNumber: number
  content: any
  backgroundImageUrl?: string
  overlayOpacity?: number
  status: 'draft' | 'published'
  wordCount?: number
}

export interface UpdateChapterData extends Partial<CreateChapterData> {
  id: string
  bookId: string
}

export interface ScheduleChapterData {
  bookId: string
  chapterId: string
  scheduledPublishAt: string | Date | number
}

export async function adminCreateChapter(data: CreateChapterData): Promise<{ id: string; chapter: Chapter }> {
  return await callFunction('adminCreateChapter', data)
}

export async function adminUpdateChapter(data: UpdateChapterData): Promise<{ id: string; success: boolean }> {
  return await callFunction('adminUpdateChapter', data)
}

export async function adminDeleteChapter(data: { bookId: string; chapterId: string }): Promise<{ success: boolean }> {
  return await callFunction('adminDeleteChapter', data)
}

export async function adminPublishChapter(chapterId: string, bookId: string): Promise<{ success: boolean }> {
  return await callFunction('adminPublishChapter', { chapterId, bookId })
}

export async function adminScheduleChapter(data: ScheduleChapterData): Promise<{ success: boolean }> {
  return await callFunction('adminScheduleChapter', data)
}

export async function adminReorderChapters(
  bookId: string,
  orderedIds: string[]
): Promise<{ success: boolean }> {
  return await callFunction('adminReorderChapters', { bookId, orderedIds })
}

// ========================
// ADMIN ANALYTICS & MEDIA
// ========================

export async function adminGetStats(): Promise<AdminStats> {
  return await callFunction<void, AdminStats>('adminGetStats')
}

export async function adminGetUploadUrl(
  folder: string,
  fileName: string,
  contentType: string
): Promise<UploadUrlResponse> {
  return await callFunction<{ folder: string; fileName: string; contentType: string }, UploadUrlResponse>(
    'adminGetUploadUrl',
    { folder, fileName, contentType }
  )
}

// ========================
// READER INTERACTION FUNCTIONS
// ========================

export async function toggleLike(
  chapterId: string,
  bookId: string
): Promise<{ liked: boolean; likeCount: number }> {
  return await callFunction('toggleLike', { chapterId, bookId })
}

export async function addComment(
  bookId: string,
  chapterId: string,
  text: string
): Promise<{ id: string; success: boolean }> {
  return await callFunction('addComment', { bookId, chapterId, text })
}

export async function deleteOwnComment(
  bookId: string,
  chapterId: string,
  commentId: string
): Promise<{ success: boolean }> {
  return await callFunction('deleteOwnComment', { bookId, chapterId, commentId })
}

export async function subscribeNewsletter(
  email: string
): Promise<{ success: boolean; message: string }> {
  return await callFunction('subscribeNewsletter', { email })
}
