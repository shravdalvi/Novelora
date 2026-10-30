import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import { getLocalBookById, getLocalBookBySlug } from './localBooksService'
import type { Book, Bookmark, ReadingProgress } from '../types'

const LOCAL_BOOKMARKS_KEY = 'novelora_local_user_bookmarks'
export const LOCAL_BOOKMARKS_EVENT = 'novelora_local_user_bookmarks_updated'

export interface BookmarkWithBook extends Bookmark {
  book: Book
  progress?: ReadingProgress | null
}

function getLocalBookmarksMap(): Record<string, any> {
  try {
    const raw = localStorage.getItem(LOCAL_BOOKMARKS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveLocalBookmark(book: Book): void {
  try {
    const map = getLocalBookmarksMap()
    map[book.id] = {
      bookId: book.id,
      createdAt: new Date().toISOString(),
      book,
    }
    localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify(map))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(LOCAL_BOOKMARKS_EVENT))
    }
  } catch {}
}

function removeLocalBookmark(bookId: string): void {
  try {
    const map = getLocalBookmarksMap()
    delete map[bookId]
    localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify(map))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(LOCAL_BOOKMARKS_EVENT))
    }
  } catch {}
}

/**
 * Real-time subscription to check whether a specific book is bookmarked.
 * Listens directly on Firestore so any change in any tab updates the button live.
 */
export function subscribeToBookmarkedStatus(
  userId: string,
  bookId: string,
  callback: (isBookmarked: boolean) => void
): Unsubscribe {
  const localMap = getLocalBookmarksMap()
  if (localMap[bookId]) {
    callback(true)
  }

  const bookmarkRef = doc(db, 'users', userId, 'bookmarks', bookId)

  return onSnapshot(
    bookmarkRef,
    (snap) => {
      const exists = snap.exists()
      callback(exists)
    },
    (err) => {
      console.warn('Real-time bookmark status notice:', err)
      callback(Boolean(getLocalBookmarksMap()[bookId]))
    }
  )
}

/**
 * Real-time subscription to all bookmarks on the reader's Bookshelf.
 * Whenever the user bookmarks a book anywhere, this fires in real-time.
 */
export function subscribeToUserBookshelf(
  userId: string,
  callback: (bookmarks: BookmarkWithBook[]) => void
): Unsubscribe {
  const bookmarksRef = collection(db, 'users', userId, 'bookmarks')

  const buildBookshelfItems = async (cloudDocs: any[]) => {
    const loaded: BookmarkWithBook[] = []
    const cloudBookIds = new Set<string>()

    for (const docSnap of cloudDocs) {
      const bookId = docSnap.id
      cloudBookIds.add(bookId)
      const data = docSnap.data()

      let bookData: Book | null = null

      try {
        const bookRef = doc(db, 'books', bookId)
        const bookSnap = await getDoc(bookRef)
        if (bookSnap.exists()) {
          bookData = { id: bookSnap.id, ...bookSnap.data() } as Book
        }
      } catch (err) {
        console.warn('Error reading book for bookmark:', err)
      }

      if (!bookData) {
        bookData =
          getLocalBookById(bookId) ||
          (data.bookSlug ? getLocalBookBySlug(data.bookSlug) : undefined) ||
          (data.bookTitle
            ? ({
                id: bookId,
                title: data.bookTitle,
                slug: data.bookSlug || bookId,
                coverImageUrl: data.coverImageUrl || '',
                status: 'ongoing',
                visibility: 'published',
              } as Book)
            : null)
      }

      if (bookData) {
        let progressData: ReadingProgress | null = null
        try {
          const progressRef = doc(db, 'users', userId, 'progress', bookId)
          const progressSnap = await getDoc(progressRef)
          if (progressSnap.exists()) {
            progressData = progressSnap.data() as ReadingProgress
          }
        } catch {}

        loaded.push({
          bookId,
          createdAt: data.createdAt,
          book: bookData,
          progress: progressData,
        })
      }
    }

    // Merge any local-only bookmarks
    const localMap = getLocalBookmarksMap()
    for (const [localId, localItem] of Object.entries(localMap)) {
      if (!cloudBookIds.has(localId) && localItem?.book) {
        loaded.push({
          bookId: localId,
          createdAt: localItem.createdAt,
          book: localItem.book,
          progress: null,
        })
      }
    }

    callback(loaded)
  }

  const unsubSnapshot = onSnapshot(
    bookmarksRef,
    (snapshot) => {
      buildBookshelfItems(snapshot.docs)
    },
    (err) => {
      console.warn('Real-time bookshelf subscription notice, using local backup:', err)
      buildBookshelfItems([])
    }
  )

  const handleLocalUpdate = () => {
    buildBookshelfItems([])
  }

  if (typeof window !== 'undefined') {
    window.addEventListener(LOCAL_BOOKMARKS_EVENT, handleLocalUpdate)
  }

  return () => {
    unsubSnapshot()
    if (typeof window !== 'undefined') {
      window.removeEventListener(LOCAL_BOOKMARKS_EVENT, handleLocalUpdate)
    }
  }
}

/**
 * Toggles a book on/off the reader's bookshelf with real-time Firestore persistence.
 */
export async function toggleBookmark(
  userId: string,
  book: Book
): Promise<{ isBookmarked: boolean }> {
  const bookmarkRef = doc(db, 'users', userId, 'bookmarks', book.id)

  try {
    const snap = await getDoc(bookmarkRef)
    if (snap.exists()) {
      // Remove bookmark
      removeLocalBookmark(book.id)
      await deleteDoc(bookmarkRef)
      return { isBookmarked: false }
    } else {
      // Add bookmark
      saveLocalBookmark(book)
      await setDoc(bookmarkRef, {
        bookId: book.id,
        bookTitle: book.title,
        bookSlug: book.slug,
        coverImageUrl: book.coverImageUrl || '',
        createdAt: serverTimestamp(),
      })
      return { isBookmarked: true }
    }
  } catch (err) {
    console.warn('Direct Firestore bookmark toggle error, applying local state:', err)
    const localMap = getLocalBookmarksMap()
    const currentlyBookmarked = Boolean(localMap[book.id])
    if (currentlyBookmarked) {
      removeLocalBookmark(book.id)
      return { isBookmarked: false }
    } else {
      saveLocalBookmark(book)
      return { isBookmarked: true }
    }
  }
}

/**
 * Explicitly removes a bookmark.
 */
export async function removeBookmark(userId: string, bookId: string): Promise<void> {
  removeLocalBookmark(bookId)
  try {
    const bookmarkRef = doc(db, 'users', userId, 'bookmarks', bookId)
    await deleteDoc(bookmarkRef)
  } catch (err) {
    console.warn('Error removing bookmark from Firestore:', err)
  }
}

