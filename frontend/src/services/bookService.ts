import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  collectionGroup,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import { getLocalBooks, getLocalBookBySlug } from './localBooksService'
import type { Book, Chapter } from '../types'

function getMillis(val: unknown): number {
  if (!val) return 0
  if (typeof val === 'object' && val !== null && 'toMillis' in val && typeof (val as any).toMillis === 'function') {
    return (val as any).toMillis()
  }
  return new Date(val as any).getTime() || 0
}

/**
 * Real-time subscription to published books for Library & Home.
 * Automatically updates reader views when author publishes, edits, or adds books!
 */
export function subscribeToPublishedBooks(
  callback: (books: Book[]) => void,
  genreFilter?: string
): Unsubscribe {
  const booksRef = collection(db, 'books')
  const q = query(
    booksRef,
    where('visibility', '==', 'published')
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const cloudBooks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Book[]

      const cloudIds = new Set(cloudBooks.map((b) => b.id))
      const localPublished = getLocalBooks().filter(
        (b) => b.visibility === 'published' && !cloudIds.has(b.id)
      )
      const books = [...cloudBooks, ...localPublished]

      books.sort((a, b) => getMillis(b.updatedAt) - getMillis(a.updatedAt))

      if (genreFilter && genreFilter !== 'All') {
        callback(
          books.filter(
            (b) => b.genres && b.genres.some((g) => g.toLowerCase() === genreFilter.toLowerCase())
          )
        )
      } else {
        callback(books)
      }
    },
    (err) => {
      console.warn('Real-time cloud books listener blocked or unavailable, using local published books:', err)
      const localBooks = getLocalBooks().filter((b) => b.visibility === 'published')
      if (genreFilter && genreFilter !== 'All') {
        callback(
          localBooks.filter(
            (b) => b.genres && b.genres.some((g) => g.toLowerCase() === genreFilter.toLowerCase())
          )
        )
      } else {
        callback(localBooks)
      }
    }
  )
}

/**
 * Real-time subscription to featured books (top 4 published books).
 */
export function subscribeToFeaturedBooks(callback: (books: Book[]) => void): Unsubscribe {
  return subscribeToPublishedBooks((books) => {
    callback(books.slice(0, 4))
  })
}

/**
 * Real-time subscription to latest published chapters across all books.
 */
export function subscribeToLatestChapters(
  callback: (chapters: Chapter[]) => void,
  limitCount = 6
): Unsubscribe {
  const chaptersQuery = query(
    collectionGroup(db, 'chapters'),
    where('status', '==', 'published'),
    limit(limitCount)
  )

  return onSnapshot(
    chaptersQuery,
    (snapshot) => {
      const chapters = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Chapter[]

      chapters.sort((a, b) => getMillis(b.updatedAt) - getMillis(a.updatedAt))
      callback(chapters)
    },
    (err) => {
      console.error('Error in real-time chapters subscription:', err)
      callback([])
    }
  )
}

/**
 * Fetch all published books, with optional genre filtering
 */
export async function getPublishedBooks(genreFilter?: string): Promise<Book[]> {
  try {
    const booksRef = collection(db, 'books')
    let snapshot
    try {
      const q = query(
        booksRef,
        where('visibility', '==', 'published'),
        orderBy('updatedAt', 'desc')
      )
      snapshot = await getDocs(q)
    } catch (indexError) {
      // Fallback in case Firestore composite index is still building
      console.warn('Composite index query fallback, fetching without server order:', indexError)
      const fallbackQuery = query(
        booksRef,
        where('visibility', '==', 'published')
      )
      snapshot = await getDocs(fallbackQuery)
    }

    const books = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Book[]

    // Client-side sort by updatedAt as guaranteed fallback
    books.sort((a, b) => {
      const getMillis = (val: unknown): number => {
        if (!val) return 0
        if (typeof val === 'object' && val !== null && 'toMillis' in val && typeof (val as any).toMillis === 'function') {
          return (val as any).toMillis()
        }
        return new Date(val as any).getTime() || 0
      }
      return getMillis(b.updatedAt) - getMillis(a.updatedAt)
    })

    if (genreFilter && genreFilter !== 'All') {
      return books.filter((b) =>
        b.genres && b.genres.some((g) => g.toLowerCase() === genreFilter.toLowerCase())
      )
    }

    return books
  } catch (err) {
    console.error('Error fetching published books:', err)
    return []
  }
}

/**
 * Fetch a single published book by its slug
 */
export async function getBookBySlug(slug: string): Promise<Book | null> {
  try {
    const booksRef = collection(db, 'books')
    const q = query(
      booksRef,
      where('slug', '==', slug),
      where('visibility', '==', 'published'),
      limit(1)
    )

    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
      } as Book
    }
  } catch (err) {
    console.warn('Error fetching book from cloud Firestore, checking local registry:', err)
  }

  const local = getLocalBookBySlug(slug)
  if (local && local.visibility === 'published') {
    return local
  }
  return null
}

/**
 * Fetch featured books (up to 4 published books)
 */
export async function getFeaturedBooks(): Promise<Book[]> {
  try {
    const books = await getPublishedBooks()
    return books.slice(0, 4)
  } catch (err) {
    console.error('Error fetching featured books:', err)
    return []
  }
}

/**
 * Fetch latest published chapters across all books via collectionGroup
 */
export async function getLatestChapters(limitCount = 6): Promise<Chapter[]> {
  try {
    let snapshot
    try {
      const chaptersQuery = query(
        collectionGroup(db, 'chapters'),
        where('status', '==', 'published'),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      )
      snapshot = await getDocs(chaptersQuery)
    } catch (indexErr) {
      console.warn('CollectionGroup index query fallback:', indexErr)
      const fallbackQuery = query(
        collectionGroup(db, 'chapters'),
        where('status', '==', 'published'),
        limit(limitCount)
      )
      snapshot = await getDocs(fallbackQuery)
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Chapter[]
  } catch (err) {
    console.error('Error fetching latest chapters:', err)
    return []
  }
}

/**
 * Client-side search of published books by title or description
 */
export async function searchBooks(searchQuery: string): Promise<Book[]> {
  const books = await getPublishedBooks()
  if (!searchQuery.trim()) return books

  const term = searchQuery.toLowerCase().trim()
  return books.filter((book) => {
    const titleMatch = book.title?.toLowerCase().includes(term)
    const descMatch = book.description?.toLowerCase().includes(term)
    const tagsMatch = book.tags?.some((t) => t.toLowerCase().includes(term))
    const genreMatch = book.genres?.some((g) => g.toLowerCase().includes(term))
    return titleMatch || descMatch || tagsMatch || genreMatch
  })
}


// Namespace export for components that prefer object-style imports
export const bookService = {
  getPublishedBooks,
  getBookBySlug,
  getFeaturedBooks,
  getLatestChapters,
  searchBooks,
  subscribeToPublishedBooks,
  subscribeToFeaturedBooks,
  subscribeToLatestChapters,
}
