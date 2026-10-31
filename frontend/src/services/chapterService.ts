import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  limit,
} from 'firebase/firestore'
import { db } from './firebase'
import { getLocalChapters, getLocalChapterById, getDeletedChapterIds } from './localBooksService'
import type { Chapter } from '../types'

/**
 * Fetch all published chapters for a book, ordered ascending by chapter number
 */
export async function getPublishedChapters(bookId: string): Promise<Chapter[]> {
  let cloudChapters: Chapter[] = []
  try {
    const chaptersRef = collection(db, 'books', bookId, 'chapters')
    const q = query(
      chaptersRef,
      where('status', '==', 'published'),
      orderBy('chapterNumber', 'asc')
    )

    const snapshot = await getDocs(q)
    cloudChapters = snapshot.docs.map((d) => ({
      id: d.id,
      bookId,
      ...d.data(),
    })) as Chapter[]
  } catch (err) {
    console.warn('Error fetching published chapters from Firestore, checking local backup:', err)
  }

  // Merge with local published chapters (filtering out deleted)
  const deletedIds = getDeletedChapterIds()
  const cloudIds = new Set(cloudChapters.map((c) => c.id))
  const localPublished = getLocalChapters(bookId).filter(
    (c) => c.status === 'published' && !cloudIds.has(c.id) && !deletedIds.has(c.id)
  )

  const combined = [...cloudChapters.filter((c) => !deletedIds.has(c.id)), ...localPublished]

  // Deduplicate by normalized title
  const seen = new Set<string>()
  const deduplicated: Chapter[] = []
  for (const ch of combined) {
    const norm = ch.title.trim().toLowerCase()
    if (!seen.has(norm)) {
      seen.add(norm)
      deduplicated.push(ch)
    }
  }

  deduplicated.sort((a, b) => {
    if (a.title.trim().toLowerCase() === 'characters') return -1
    if (b.title.trim().toLowerCase() === 'characters') return 1
    return (a.chapterNumber || 0) - (b.chapterNumber || 0)
  })

  return deduplicated.map((ch, idx) => ({
    ...ch,
    chapterNumber: idx + 1,
  }))
}

/**
 * Fetch a single chapter document by bookId and chapterId (cloud + local fallback)
 */
export async function getChapter(bookId: string, chapterId: string): Promise<Chapter | null> {
  return getChapterById(bookId, chapterId)
}

export async function getChapterById(bookId: string, chapterId: string): Promise<Chapter | null> {
  try {
    const chapterRef = doc(db, 'books', bookId, 'chapters', chapterId)
    const snapshot = await getDoc(chapterRef)

    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        bookId,
        ...snapshot.data(),
      } as Chapter
    }
  } catch (err) {
    console.warn('Error fetching chapter by ID from Firestore, checking local backup:', err)
  }

  const local = getLocalChapterById(chapterId)
  if (local) return local

  return null
}

/**
 * Fetch a single chapter by bookId and chapterNumber (with draft and local backup support)
 */
export async function getChapterByNumber(
  bookId: string,
  chapterNumber: number,
  allowDraft: boolean = false
): Promise<Chapter | null> {
  try {
    const chaptersRef = collection(db, 'books', bookId, 'chapters')
    const q = allowDraft
      ? query(chaptersRef, where('chapterNumber', '==', chapterNumber), limit(1))
      : query(
          chaptersRef,
          where('chapterNumber', '==', chapterNumber),
          where('status', '==', 'published'),
          limit(1)
        )

    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const docSnapshot = snapshot.docs[0]
      return {
        id: docSnapshot.id,
        bookId,
        ...docSnapshot.data(),
      } as Chapter
    }

    // If searching for published didn't find anything, but allowDraft is true or local exists:
    if (!allowDraft) {
      // Also attempt fallback query without status constraint
      const fallbackQ = query(chaptersRef, where('chapterNumber', '==', chapterNumber), limit(1))
      const fallbackSnap = await getDocs(fallbackQ)
      if (!fallbackSnap.empty) {
        const d = fallbackSnap.docs[0]
        return {
          id: d.id,
          bookId,
          ...d.data(),
        } as Chapter
      }
    }
  } catch (err) {
    console.warn('Error fetching chapter by number from Firestore, checking local backup:', err)
  }

  // Fallback to deduplicated chapters list
  const localChapters = await getPublishedChapters(bookId)
  const localMatch = localChapters.find((c) => c.chapterNumber === chapterNumber)
  if (localMatch) return localMatch

  return null
}

/**
 * Fetch all chapters for a book (including drafts), for admin and reader overview
 */
export async function getAllChaptersForBook(bookId: string): Promise<Chapter[]> {
  let cloudChapters: Chapter[] = []
  try {
    const chaptersRef = collection(db, 'books', bookId, 'chapters')
    const q = query(chaptersRef, orderBy('chapterNumber', 'asc'))
    const snapshot = await getDocs(q)
    cloudChapters = snapshot.docs.map((d) => ({
      id: d.id,
      bookId,
      ...d.data(),
    })) as Chapter[]
  } catch (err) {
    console.warn('Error fetching all chapters from Firestore, checking local backup:', err)
  }

  // Merge with local chapters (filtering out deleted)
  const deletedIds = getDeletedChapterIds()
  const cloudIds = new Set(cloudChapters.map((c) => c.id))
  const localChapters = getLocalChapters(bookId).filter((c) => !cloudIds.has(c.id) && !deletedIds.has(c.id))

  const combined = [...cloudChapters.filter((c) => !deletedIds.has(c.id)), ...localChapters]

  // Deduplicate by normalized title
  const seen = new Set<string>()
  const deduplicated: Chapter[] = []
  for (const ch of combined) {
    const norm = ch.title.trim().toLowerCase()
    if (!seen.has(norm)) {
      seen.add(norm)
      deduplicated.push(ch)
    }
  }

  deduplicated.sort((a, b) => {
    if (a.title.trim().toLowerCase() === 'characters') return -1
    if (b.title.trim().toLowerCase() === 'characters') return 1
    return (a.chapterNumber || 0) - (b.chapterNumber || 0)
  })

  return deduplicated.map((ch, idx) => ({
    ...ch,
    chapterNumber: idx + 1,
  }))
}

// Namespace export for components that prefer object-style imports
export const chapterService = {
  getPublishedChapters,
  getChapter,
  getChapterById,
  getChapterByNumber,
  getAllChaptersForBook,
  getChaptersByBookId: getPublishedChapters,
}
