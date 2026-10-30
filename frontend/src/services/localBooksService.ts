import type { Book, Chapter } from '../types'

const LOCAL_BOOKS_KEY = 'novelora_local_books'
const LOCAL_CHAPTERS_KEY = 'novelora_local_chapters'
export const LOCAL_BOOKS_EVENT = 'novelora_local_books_updated'
export const LOCAL_CHAPTERS_EVENT = 'novelora_local_chapters_updated'

/**
 * Retrieve all locally saved books from localStorage
 */
export function getLocalBooks(): Book[] {
  try {
    const raw = localStorage.getItem(LOCAL_BOOKS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn('[localBooksService] Error reading local books:', err)
    return []
  }
}

/**
 * Save a new local book
 */
export function saveLocalBook(book: Book): void {
  try {
    const existing = getLocalBooks()
    const filtered = existing.filter((b) => b.id !== book.id && b.slug !== book.slug)
    filtered.unshift(book)
    localStorage.setItem(LOCAL_BOOKS_KEY, JSON.stringify(filtered))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(LOCAL_BOOKS_EVENT))
    }
  } catch (err) {
    console.error('[localBooksService] Error saving local book:', err)
  }
}

/**
 * Update an existing local book
 */
export function updateLocalBook(updates: Partial<Book> & { id: string }): void {
  try {
    const existing = getLocalBooks()
    const index = existing.findIndex((b) => b.id === updates.id)
    if (index !== -1) {
      existing[index] = { ...existing[index], ...updates, updatedAt: new Date().toISOString() }
      localStorage.setItem(LOCAL_BOOKS_KEY, JSON.stringify(existing))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(LOCAL_BOOKS_EVENT))
      }
    }
  } catch (err) {
    console.error('[localBooksService] Error updating local book:', err)
  }
}

/**
 * Delete a local book
 */
export function deleteLocalBook(bookId: string): void {
  try {
    const existing = getLocalBooks()
    const filtered = existing.filter((b) => b.id !== bookId)
    localStorage.setItem(LOCAL_BOOKS_KEY, JSON.stringify(filtered))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(LOCAL_BOOKS_EVENT))
    }
  } catch (err) {
    console.error('[localBooksService] Error deleting local book:', err)
  }
}

/**
 * Find local book by ID
 */
export function getLocalBookById(id: string): Book | undefined {
  return getLocalBooks().find((b) => b.id === id)
}

/**
 * Find local book by slug
 */
export function getLocalBookBySlug(slug: string): Book | undefined {
  return getLocalBooks().find((b) => b.slug === slug)
}

/**
 * Retrieve all locally saved chapters
 */
export function getLocalChapters(bookId?: string): Chapter[] {
  try {
    const raw = localStorage.getItem(LOCAL_CHAPTERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Chapter[]
    if (!Array.isArray(parsed)) return []
    return bookId ? parsed.filter((c) => c.bookId === bookId) : parsed
  } catch {
    return []
  }
}

/**
 * Save or update a local chapter (guarantees author work is never lost)
 */
export function saveLocalChapter(chapter: Chapter): void {
  try {
    const existing = getLocalChapters()
    const filtered = existing.filter((c) => c.id !== chapter.id)
    filtered.unshift(chapter)
    localStorage.setItem(LOCAL_CHAPTERS_KEY, JSON.stringify(filtered))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(LOCAL_CHAPTERS_EVENT))
    }
  } catch (err) {
    console.error('[localBooksService] Error saving local chapter:', err)
  }
}

/**
 * Find single local chapter
 */
export function getLocalChapterById(chapterId: string): Chapter | undefined {
  return getLocalChapters().find((c) => c.id === chapterId)
}

/**
 * Delete a local chapter
 */
export function deleteLocalChapter(chapterId: string): void {
  try {
    const existing = getLocalChapters()
    const filtered = existing.filter((c) => c.id !== chapterId)
    localStorage.setItem(LOCAL_CHAPTERS_KEY, JSON.stringify(filtered))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(LOCAL_CHAPTERS_EVENT))
    }
  } catch (err) {
    console.error('[localBooksService] Error deleting local chapter:', err)
  }
}

const LOCAL_DELETED_CHAPTER_IDS_KEY = 'novelora_deleted_chapter_ids'

/**
 * Retrieve the set of all chapter IDs marked as permanently deleted by the author
 */
export function getDeletedChapterIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_CHAPTER_IDS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed) : new Set()
  } catch {
    return new Set()
  }
}

/**
 * Permanently mark a chapter as deleted so it can never reappear from cloud or local sync
 */
export function markChapterAsDeleted(chapterId: string): void {
  try {
    const set = getDeletedChapterIds()
    set.add(chapterId)
    localStorage.setItem(LOCAL_DELETED_CHAPTER_IDS_KEY, JSON.stringify(Array.from(set)))
    deleteLocalChapter(chapterId)
  } catch (err) {
    console.error('[localBooksService] Error marking chapter as deleted:', err)
  }
}

/**
 * Remove all draft chapters for a specific book from local storage
 */
export function purgeAllLocalDraftChapters(bookId: string): void {
  try {
    const existing = getLocalChapters()
    const kept = existing.filter((c) => !(c.bookId === bookId && c.status !== 'published'))
    localStorage.setItem(LOCAL_CHAPTERS_KEY, JSON.stringify(kept))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(LOCAL_CHAPTERS_EVENT))
    }
  } catch (err) {
    console.error('[localBooksService] Error purging draft chapters:', err)
  }
}
