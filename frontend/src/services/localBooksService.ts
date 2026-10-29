import type { Book } from '../types'

const LOCAL_BOOKS_KEY = 'novelora_local_books'

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

