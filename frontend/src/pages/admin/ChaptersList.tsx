import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doc, onSnapshot, collection, orderBy, query, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../../services/firebase'
import {
  getLocalChapters,
  deleteLocalChapter,
  LOCAL_CHAPTERS_EVENT,
  updateLocalBook,
  getDeletedChapterIds,
  markChapterAsDeleted,
  getLocalBookById,
  getLocalBookBySlug,
  INITIAL_AUTHOR_CHAPTERS,
} from '../../services/localBooksService'
import { syncAuthorDataToFirestore } from '../../services/cloudSyncService'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { AdminSidebar } from '../../components/layout/AdminSidebar'
import { ChapterList } from '../../components/book/ChapterList'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { toast } from '../../components/ui/Toast'
import type { Book, Chapter } from '../../types'

export const ChaptersList: React.FC = () => {
  const { id: bookId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)

  const [deleteTarget, setDeleteTarget] = useState<Chapter | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const handleSyncToCloud = async () => {
    setSyncing(true)
    try {
      const res = await syncAuthorDataToFirestore(true)
      toast.success(
        res.chaptersSynced > 0
          ? `Synced ${res.chaptersSynced} chapter(s) to Cloud Firestore! Readers on any device can now view them.`
          : 'All chapters are already synced with Cloud Firestore!'
      )
    } catch (err: any) {
      toast.error('Sync failed: ' + (err?.message || 'Check Firestore permissions'))
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    if (!bookId) return
    setLoading(true)

    const bookRef = doc(db, 'books', bookId)
    const unsubBook = onSnapshot(bookRef, (snap) => {
      if (snap.exists()) {
        setBook({ id: snap.id, ...snap.data() } as Book)
      } else {
        const local = getLocalBookById(bookId) || getLocalBookBySlug(bookId)
        if (local) setBook(local)
      }
    })

    syncAuthorDataToFirestore().catch(console.warn)

    const chaptersRef = collection(db, 'books', bookId, 'chapters')
    const q = query(chaptersRef, orderBy('chapterNumber', 'asc'))
    let latestCloudList: Chapter[] = []

    const mergeWithLocal = (cloudList: Chapter[]) => {
      latestCloudList = cloudList
      const deletedIds = getDeletedChapterIds()
      const cloudIds = new Set(cloudList.map((c) => c.id))
      const localList = getLocalChapters(bookId).filter((c) => {
        if (cloudIds.has(c.id) || deletedIds.has(c.id)) return false
        // Purge orphaned local chapter duplicates if already saved to cloud
        const isDuplicate = cloudList.some(
          (cloudCh) =>
            cloudCh.chapterNumber === c.chapterNumber ||
            cloudCh.title.trim().toLowerCase() === c.title.trim().toLowerCase()
        )
        if (isDuplicate) {
          deleteLocalChapter(c.id)
          return false
        }
        return true
      })
      const filteredCloud = cloudList.filter((c) => !deletedIds.has(c.id))
      const combined = [...filteredCloud, ...localList]

      // Deduplicate chapters by normalized title to prevent duplicate "First day at work"
      const seenTitles = new Set<string>()
      const deduplicated: Chapter[] = []
      for (const ch of combined) {
        const norm = ch.title.trim().toLowerCase()
        if (!seenTitles.has(norm)) {
          seenTitles.add(norm)
          deduplicated.push(ch)
        }
      }

      // Ensure Chapter 1 "Characters" is always present if not explicitly deleted
      if (!seenTitles.has('characters') && !deletedIds.has('ch-boss-001')) {
        deduplicated.unshift({
          ...INITIAL_AUTHOR_CHAPTERS[0],
          bookId: bookId || 'book-1793291155125',
        })
      }

      // Order chapters: "Characters" first, followed by numeric sequence
      deduplicated.sort((a, b) => {
        if (a.title.trim().toLowerCase() === 'characters') return -1
        if (b.title.trim().toLowerCase() === 'characters') return 1
        return (a.chapterNumber || 0) - (b.chapterNumber || 0)
      })

      // Assign continuous clean chapter numbers (1, 2, 3...)
      const numbered = deduplicated.map((ch, idx) => ({
        ...ch,
        chapterNumber: idx + 1,
      }))

      setChapters(numbered)
      setLoading(false)
    }

    const unsubChapters = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, bookId, ...d.data() })) as Chapter[]
        mergeWithLocal(list)
      },
      (err) => {
        console.error('Failed to load chapters:', err)
        mergeWithLocal([])
      }
    )

    const handleLocalUpdate = () => {
      mergeWithLocal(latestCloudList)
    }
    window.addEventListener(LOCAL_CHAPTERS_EVENT, handleLocalUpdate)

    return () => {
      unsubBook()
      unsubChapters()
      window.removeEventListener(LOCAL_CHAPTERS_EVENT, handleLocalUpdate)
    }
  }, [bookId])

  const handleReorder = async (reordered: Chapter[]) => {
    // Update local state immediately
    const updatedWithIndices = reordered.map((ch, idx) => ({
      ...ch,
      chapterNumber: idx + 1,
    }))
    setChapters(updatedWithIndices)

    try {
      if (bookId) {
        const batch = writeBatch(db)
        for (const ch of updatedWithIndices) {
          batch.update(doc(db, 'books', bookId, 'chapters', ch.id), {
            chapterNumber: ch.chapterNumber,
          })
        }
        await batch.commit()
        toast.success('Chapter order updated in database!')
      }
    } catch (err) {
      console.error('Failed to reorder chapters:', err)
      toast.error('Failed to save new chapter order')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !bookId) return
    const target = deleteTarget
    const isLocalOnly = target.id.startsWith('chapter-')

    try {
      setDeleting(true)
      // 1. Permanently record as deleted so it can never reappear from cloud or local sync
      markChapterAsDeleted(target.id)

      // 2. If it is stored in Firestore, delete from cloud Firestore
      if (!isLocalOnly) {
        await deleteDoc(doc(db, 'books', bookId, 'chapters', target.id)).catch(console.warn)
      }

      // 3. Recalculate exact remaining published chapters count
      const remainingPublished = chapters.filter(c => c.id !== target.id && c.status === 'published').length
      updateLocalBook({ id: bookId, chapterCount: remainingPublished })
      await updateDoc(doc(db, 'books', bookId), {
        chapterCount: remainingPublished,
      }).catch(console.warn)

      // 4. Update UI list
      setChapters((prev) => prev.filter((c) => c.id !== target.id))
      toast.success(isLocalOnly ? `Draft "${target.title}" removed` : `Chapter ${target.chapterNumber}: "${target.title}" deleted`)
      setDeleteTarget(null)
    } catch (err: any) {
      console.warn('Firestore chapter delete:', err)
      markChapterAsDeleted(target.id)
      setChapters((prev) => prev.filter((c) => c.id !== target.id))
      setDeleteTarget(null)
      toast.success(`Chapter ${target.chapterNumber} removed`)
    } finally {
      setDeleting(false)
    }
  }

  const handleCreateNewChapter = () => {
    // Navigate to writing studio with 'new' chapter parameter
    const nextChapterNum = chapters.length + 1
    navigate(`/admin/chapters/new/edit?bookId=${bookId}&nextNumber=${nextChapterNum}`)
  }

  return (
    <PageWrapper title="Manage Chapters">
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
        <AdminSidebar />

        <div className="flex-1 p-6 sm:p-10 space-y-8 bg-bone">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-ink pb-6">
            <div>
              <div className="inline-block bg-sage border-3 border-ink px-3 py-1 shadow-hard-sm mb-2">
                <span className="font-bangers text-sm tracking-comic text-ink">
                  TABLE OF CONTENTS
                </span>
              </div>
              <h1 className="font-bangers text-4xl sm:text-5xl tracking-comic text-ink">
                {book?.title || 'MANAGE CHAPTERS'}
              </h1>
              <p className="font-grotesk text-xs text-muted">
                Drag rows by the ⠿ handle to reorder chapter numbers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={handleSyncToCloud}
                disabled={syncing}
                title="Sync all chapters to Cloud Database so readers on any device see them in real-time"
              >
                {syncing ? 'SYNCING...' : '☁️ SYNC TO CLOUD'}
              </Button>
              <Link to="/admin/books">
                <Button variant="secondary" size="md">
                  ← BACK TO BOOKS
                </Button>
              </Link>
              <Button
                variant="primary"
                size="md"
                onClick={handleCreateNewChapter}
              >
                + WRITE NEW CHAPTER
              </Button>
            </div>
          </div>

          {/* Chapters List */}
          {loading ? (
            <div className="p-12 text-center font-bangers text-2xl text-ink">
              LOADING CHAPTERS...
            </div>
          ) : chapters.length > 0 ? (
            <div className="max-w-4xl">
              <ChapterList
                chapters={chapters}
                bookSlug={book?.slug || ''}
                bookId={bookId || ''}
                isAdmin={true}
                onReorder={handleReorder}
                onDelete={(ch) => setDeleteTarget(ch)}
              />
            </div>
          ) : (
            <div className="border-3 border-ink bg-parchment p-12 text-center shadow-hard max-w-lg mx-auto">
              <h3 className="font-bangers text-3xl tracking-comic text-ink mb-2">
                NO CHAPTERS WRITTEN YET
              </h3>
              <p className="font-grotesk text-sm text-muted mb-6">
                Start writing Chapter 1 in the author studio.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={handleCreateNewChapter}
              >
                START CHAPTER 1 →
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="DELETE CHAPTER"
        isConfirm
        confirmText="YES, DELETE CHAPTER"
        confirmLoading={deleting}
        onConfirm={handleDeleteConfirm}
      >
        <p className="font-grotesk text-sm">
          Are you sure you want to delete{' '}
          <strong>"Chapter {deleteTarget?.chapterNumber}: {deleteTarget?.title}"</strong>?
          This action cannot be undone.
        </p>
      </Modal>
    </PageWrapper>
  )
}

export default ChaptersList
