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
import type { Chapter } from '../types'

/**
 * Fetch all published chapters for a book, ordered ascending by chapter number
 */
export async function getPublishedChapters(bookId: string): Promise<Chapter[]> {
  try {
    const chaptersRef = collection(db, 'books', bookId, 'chapters')
    const q = query(
      chaptersRef,
      where('status', '==', 'published'),
      orderBy('chapterNumber', 'asc')
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({
      id: d.id,
      bookId,
      ...d.data(),
    })) as Chapter[]
  } catch (err) {
    console.error('Error fetching published chapters:', err)
    return []
  }
}

/**
 * Fetch a single chapter document by bookId and chapterId
 */
export async function getChapter(bookId: string, chapterId: string): Promise<Chapter | null> {
  try {
    const chapterRef = doc(db, 'books', bookId, 'chapters', chapterId)
    const snapshot = await getDoc(chapterRef)

    if (!snapshot.exists()) return null

    return {
      id: snapshot.id,
      bookId,
      ...snapshot.data(),
    } as Chapter
  } catch (err) {
    console.error('Error fetching chapter:', err)
    return null
  }
}

/**
 * Fetch a single published chapter by bookId and chapterNumber
 */
export async function getChapterByNumber(bookId: string, chapterNumber: number): Promise<Chapter | null> {
  try {
    const chaptersRef = collection(db, 'books', bookId, 'chapters')
    const q = query(
      chaptersRef,
      where('chapterNumber', '==', chapterNumber),
      where('status', '==', 'published'),
      limit(1)
    )

    const snapshot = await getDocs(q)
    if (snapshot.empty) return null

    const docSnapshot = snapshot.docs[0]
    return {
      id: docSnapshot.id,
      bookId,
      ...docSnapshot.data(),
    } as Chapter
  } catch (err) {
    console.error('Error fetching chapter by number:', err)
    return null
  }
}

/**
 * Fetch all chapters for a book (including drafts), for admin use
 */
export async function getAllChaptersForBook(bookId: string): Promise<Chapter[]> {
  try {
    const chaptersRef = collection(db, 'books', bookId, 'chapters')
    const q = query(chaptersRef, orderBy('chapterNumber', 'asc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({
      id: d.id,
      bookId,
      ...d.data(),
    })) as Chapter[]
  } catch (err) {
    console.error('Error fetching all chapters:', err)
    return []
  }
}


// Namespace export for components that prefer object-style imports
// Also aliases for common patterns used in pages
export const chapterService = {
  getPublishedChapters,
  getChapter,
  getChapterByNumber,
  getAllChaptersForBook,
  /** Alias: get published chapters for a book */
  getChaptersByBookId: getPublishedChapters,
}
