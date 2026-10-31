import type { Timestamp } from 'firebase/firestore'

export type UserRole = 'reader' | 'admin'

export interface User {
  uid: string
  name: string
  email: string
  avatarUrl?: string
  bio?: string
  role: UserRole
  createdAt: Timestamp | string | number | Date | null
}

export type BookStatus = 'ongoing' | 'completed'
export type BookVisibility = 'draft' | 'published'

export interface Book {
  id: string
  title: string
  slug: string
  coverImageUrl: string
  description: string
  genres: string[]
  tags: string[]
  status: BookStatus
  visibility: BookVisibility
  chapterCount: number
  createdAt: Timestamp | string | number | Date | null
  updatedAt: Timestamp | string | number | Date | null
}

export type ChapterStatus = 'draft' | 'published'

export interface Chapter {
  id: string
  bookId: string
  chapterNumber: number
  title: string
  content: any // TipTap JSON format
  headerImageUrl?: string
  headerVideoUrl?: string
  backgroundImageUrl?: string
  overlayOpacity?: number
  status: ChapterStatus
  scheduledPublishAt?: Timestamp | string | number | Date | null
  wordCount: number
  likeCount: number
  createdAt: Timestamp | string | number | Date | null
  updatedAt: Timestamp | string | number | Date | null
}

export interface Comment {
  id: string
  userId: string
  userName: string
  text: string
  createdAt: Timestamp | string | number | Date | null
}

export interface Bookmark {
  bookId: string
  createdAt: Timestamp | string | number | Date | null
  book?: Book
}

export interface ReadingProgress {
  lastChapter: number
  scrollPosition: number
  updatedAt: Timestamp | string | number | Date | null
}

export interface AdminStats {
  totalBooks: number
  totalChapters: number
  totalDrafts: number
  totalPublished: number
  totalReads: number
  recentComments: Comment[]
}

export type ReaderTheme = 'paper' | 'sepia' | 'dark'
export type ReaderFont = 'serif' | 'sans'

export interface ReaderSettings {
  theme: ReaderTheme
  font: ReaderFont
  fontSize: number
}

export interface UploadUrlResponse {
  uploadUrl: string
  filePath: string
  publicUrl: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}
