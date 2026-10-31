import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { getLocalBooks, getLocalChapters, INITIAL_AUTHOR_CHAPTERS } from './localBooksService'

let hasSynced = false

// The exact canonical chapter IDs we write to Firestore
const CANONICAL_CHAPTER_IDS = new Set(INITIAL_AUTHOR_CHAPTERS.map((c) => c.id))

/**
 * Syncs author books and published chapters to Cloud Firestore.
 * On each force-sync it:
 *   1. Deletes ALL chapter docs for the book that are NOT in the canonical ID set
 *      (removes stale / duplicate docs from old syncs)
 *   2. Upserts exactly the current published chapters with their stable IDs
 * This ensures Firestore always has exactly 8 chapters — no more, no less.
 */
export async function syncAuthorDataToFirestore(force = false): Promise<{ booksSynced: number; chaptersSynced: number }> {
  if (hasSynced && !force) return { booksSynced: 0, chaptersSynced: 0 }
  hasSynced = true

  let booksSynced = 0
  let chaptersSynced = 0

  try {
    const books = getLocalBooks()
    for (const book of books) {
      if (!book.id) continue
      const bookRef = doc(db, 'books', book.id)

      const publishedChapters = getLocalChapters(book.id).filter((c) => c.status === 'published')
      const targetChapterCount = publishedChapters.length || book.chapterCount || 1

      // ── Step 1: Delete stale Firestore chapter docs not in canonical ID set ──
      try {
        const existingSnap = await getDocs(collection(db, 'books', book.id, 'chapters'))
        const deletePromises: Promise<void>[] = []
        existingSnap.forEach((d) => {
          if (!CANONICAL_CHAPTER_IDS.has(d.id)) {
            deletePromises.push(deleteDoc(d.ref))
          }
        })
        if (deletePromises.length > 0) {
          await Promise.all(deletePromises)
          console.log(`[cloudSyncService] Deleted ${deletePromises.length} stale chapter doc(s)`)
        }
      } catch (cleanErr) {
        console.warn('[cloudSyncService] Cleanup step warning:', cleanErr)
      }

      // ── Step 2: Upsert the book document ──
      await setDoc(
        bookRef,
        {
          title: book.title,
          slug: book.slug,
          description: book.description || '',
          coverImageUrl: book.coverImageUrl || '',
          genres: book.genres || [],
          tags: book.tags || [],
          status: book.status || 'ongoing',
          visibility: book.visibility || 'published',
          chapterCount: targetChapterCount,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      booksSynced++

      // ── Step 3: Upsert exactly the canonical published chapters ──
      for (const ch of publishedChapters) {
        if (!ch.id) continue
        const chRef = doc(db, 'books', book.id, 'chapters', ch.id)
        await setDoc(
          chRef,
          {
            bookId: book.id,
            chapterNumber: ch.chapterNumber,
            title: ch.title,
            content: ch.content,
            headerImageUrl: ch.headerImageUrl || '',
            headerVideoUrl: ch.headerVideoUrl || '',
            status: 'published',
            wordCount: ch.wordCount || 0,
            likeCount: ch.likeCount || 0,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
        chaptersSynced++
      }
    }
  } catch (err) {
    console.warn('[cloudSyncService] Sync notice:', err)
  }

  return { booksSynced, chaptersSynced }
}

