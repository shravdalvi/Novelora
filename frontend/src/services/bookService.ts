import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  collectionGroup,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import {
  getLocalBooks,
  getLocalBookBySlug,
  getLocalBookById,
  getLocalChapters,
  getDeletedChapterIds,
  LOCAL_BOOKS_EVENT,
  LOCAL_CHAPTERS_EVENT,
} from './localBooksService'
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
 * Automatically synchronizes with the exact published chapters count in real-time.
 */
export function subscribeToPublishedBooks(
  callback: (books: Book[]) => void,
  genreFilter?: string
): Unsubscribe {
  let cloudBooks: Book[] = []
  let publishedChapterCountsByBook: Record<string, number> = {}

  const dispatchUpdate = () => {
    const cloudIds = new Set(cloudBooks.map((b) => b.id))
    const localPublished = getLocalBooks().filter(
      (b) => b.visibility === 'published' && !cloudIds.has(b.id)
    )

    // Compute realtime chapter count for local chapters too (filtering out deleted)
    const deletedChapterIds = getDeletedChapterIds()
    const localChapters = getLocalChapters().filter((c) => !deletedChapterIds.has(c.id))
    const localChapterCounts: Record<string, number> = {}
    for (const ch of localChapters) {
      if (ch.status === 'published' && ch.bookId) {
        localChapterCounts[ch.bookId] = (localChapterCounts[ch.bookId] || 0) + 1
      }
    }

    const books = [...cloudBooks, ...localPublished].map((b) => {
      // Real-time published chapters count calculation
      const liveCloudCount = publishedChapterCountsByBook[b.id]
      const liveLocalCount =
        localChapterCounts[b.id] ||
        (b.slug === 'my-overbearing-boss' ? localChapterCounts['book-1793291155125'] : 0) ||
        0
      const exactCount = Math.max(liveCloudCount || 0, liveLocalCount, b.chapterCount || 0)

      return {
        ...b,
        chapterCount: exactCount,
      }
    })

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
  }

  // 1. Real-time listener for published books
  const booksRef = collection(db, 'books')
  const qBooks = query(booksRef, where('visibility', '==', 'published'))
  const unsubBooks = onSnapshot(
    qBooks,
    (snapshot) => {
      cloudBooks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Book[]
      dispatchUpdate()
    },
    (err) => {
      console.warn('Real-time cloud books listener blocked or unavailable, using local published books:', err)
      dispatchUpdate()
    }
  )

  // 2. Real-time listener for all published chapters across all books (collectionGroup)
  let unsubChapters: (() => void) | undefined
  try {
    const chaptersQuery = query(
      collectionGroup(db, 'chapters'),
      where('status', '==', 'published')
    )
    unsubChapters = onSnapshot(
      chaptersQuery,
      (snapshot) => {
        const counts: Record<string, number> = {}
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data()
          const bookId = data.bookId || docSnap.ref.parent.parent?.id
          if (bookId) {
            counts[bookId] = (counts[bookId] || 0) + 1
          }
        }
        publishedChapterCountsByBook = counts
        dispatchUpdate()
      },
      (err) => {
        console.warn('Real-time collectionGroup chapters count fallback:', err)
        dispatchUpdate()
      }
    )
  } catch (err) {
    console.warn('Could not attach collectionGroup listener:', err)
  }

  // 3. Local storage listeners
  const handleLocalUpdate = () => dispatchUpdate()
  if (typeof window !== 'undefined') {
    window.addEventListener(LOCAL_BOOKS_EVENT, handleLocalUpdate)
    window.addEventListener(LOCAL_CHAPTERS_EVENT, handleLocalUpdate)
  }

  return () => {
    unsubBooks()
    if (unsubChapters) unsubChapters()
    if (typeof window !== 'undefined') {
      window.removeEventListener(LOCAL_BOOKS_EVENT, handleLocalUpdate)
      window.removeEventListener(LOCAL_CHAPTERS_EVENT, handleLocalUpdate)
    }
  }
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
    where('status', '==', 'published')
  )

  const handleUpdate = (cloudChapters: Chapter[]) => {
    const cloudIds = new Set(cloudChapters.map((c) => c.id))
    const localPublished = getLocalChapters().filter(
      (c) => c.status === 'published' && !cloudIds.has(c.id)
    )
    const combined = [...cloudChapters, ...localPublished]
    combined.sort(
      (a, b) =>
        getMillis(b.updatedAt || b.createdAt) - getMillis(a.updatedAt || a.createdAt)
    )
    callback(combined.slice(0, limitCount))
  }

  const unsub = onSnapshot(
    chaptersQuery,
    (snapshot) => {
      const chapters = snapshot.docs.map((doc) => ({
        id: doc.id,
        bookId: doc.data().bookId || doc.ref.parent.parent?.id,
        ...doc.data(),
      })) as Chapter[]
      handleUpdate(chapters)
    },
    (err) => {
      console.warn('Real-time chapters subscription fallback to local:', err)
      handleUpdate([])
    }
  )

  const handleLocal = () => handleUpdate([])
  if (typeof window !== 'undefined') {
    window.addEventListener(LOCAL_CHAPTERS_EVENT, handleLocal)
  }

  return () => {
    unsub()
    if (typeof window !== 'undefined') {
      window.removeEventListener(LOCAL_CHAPTERS_EVENT, handleLocal)
    }
  }
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
 * Fetch a single book by its slug (or id), supporting both published releases and author drafts
 */
export async function getBookBySlug(slug: string): Promise<Book | null> {
  try {
    const booksRef = collection(db, 'books')
    // 1. First attempt: match slug
    const q = query(booksRef, where('slug', '==', slug), limit(1))
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const docSnapshot = snapshot.docs[0]
      return {
        id: docSnapshot.id,
        ...docSnapshot.data(),
      } as Book
    }

    // 2. Second attempt: match direct document ID
    try {
      const directRef = doc(db, 'books', slug)
      const directSnap = await getDoc(directRef)
      if (directSnap.exists()) {
        return {
          id: directSnap.id,
          ...directSnap.data(),
        } as Book
      }
    } catch {}
  } catch (err) {
    console.warn('Error fetching book from cloud Firestore, checking local registry:', err)
  }

  // 3. Check local books by slug or ID
  const local = getLocalBookBySlug(slug) || getLocalBookById(slug)
  if (local) {
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
