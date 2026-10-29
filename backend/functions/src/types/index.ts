export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export type BookStatus = 'ongoing' | 'completed';
export type BookVisibility = 'draft' | 'published';
export type ChapterStatus = 'draft' | 'published';

export interface Book {
  id: string;
  title: string;
  slug: string;
  description: string;
  genres: string[];
  tags: string[];
  status: BookStatus;
  visibility: BookVisibility;
  coverImageUrl?: string;
  chapterCount: number;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface Chapter {
  id: string;
  bookId: string;
  chapterNumber: number;
  title: string;
  content: unknown;
  wordCount: number;
  likeCount: number;
  backgroundImageUrl?: string;
  overlayOpacity: number;
  status: ChapterStatus;
  scheduledPublishAt?: string | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface Comment {
  id: string;
  bookId: string;
  chapterId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  text: string;
  createdAt: unknown;
}

export interface AdminStats {
  totalBooks: number;
  publishedBooks: number;
  draftBooks: number;
  totalChapters: number;
  publishedChapters: number;
  draftChapters: number;
  recentComments: Comment[];
}

