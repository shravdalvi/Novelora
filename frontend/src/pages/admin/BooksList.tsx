import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { adminDeleteBook } from '../../services/functionsService'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { AdminSidebar } from '../../components/layout/AdminSidebar'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { toast } from '../../components/ui/Toast'
import { getLocalBooks, deleteLocalBook } from '../../services/localBooksService'
import type { Book } from '../../types'

export const BooksList: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    // Instant initial display from local storage
    const initialLocal = getLocalBooks()
    if (initialLocal.length > 0) {
      setBooks(initialLocal)
      setLoading(false)
    }

    const unsubscribe = onSnapshot(
      collection(db, 'books'),
      (snap) => {
        const cloudList = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Book[]
        const cloudIds = new Set(cloudList.map((b) => b.id))
        const localOnly = getLocalBooks().filter((b) => !cloudIds.has(b.id))
        setBooks([...cloudList, ...localOnly])
        setLoading(false)
      },
      (err) => {
        console.warn('Could not listen to cloud books; using local books:', err)
        setBooks(getLocalBooks())
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      try {
        await adminDeleteBook(deleteTarget.id)
      } catch {
        // Fallback direct delete
        await deleteDoc(doc(db, 'books', deleteTarget.id))
      }
      deleteLocalBook(deleteTarget.id)
      setBooks((prev) => prev.filter((b) => b.id !== deleteTarget.id))
      toast.success(`Book "${deleteTarget.title}" deleted`)
      setDeleteTarget(null)
    } catch (err: any) {
      // Even if cloud delete fails, clean up local
      deleteLocalBook(deleteTarget.id)
      setBooks((prev) => prev.filter((b) => b.id !== deleteTarget.id))
      toast.success(`Book "${deleteTarget.title}" removed`)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PageWrapper title="Admin - Books">
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
        <AdminSidebar />

        <div className="flex-1 p-6 sm:p-10 space-y-8 bg-bone">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-ink pb-6">
            <div>
              <div className="inline-block bg-sage border-3 border-ink px-3 py-1 shadow-hard-sm mb-2">
                <span className="font-bangers text-sm tracking-comic text-ink">
                  INVENTORY
                </span>
              </div>
              <h1 className="font-bangers text-4xl sm:text-5xl tracking-comic text-ink">
                ALL BOOKS & SERIALS
              </h1>
            </div>

            <Link to="/admin/books/new">
              <Button variant="primary" size="md">
                + NEW BOOK
              </Button>
            </Link>
          </div>

          {/* Books List Table / Cards */}
          {loading ? (
            <div className="p-12 text-center font-bangers text-2xl text-ink">
              LOADING ARCHIVE...
            </div>
          ) : books.length > 0 ? (
            <div className="space-y-4">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-parchment border-3 border-ink shadow-hard p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  {/* Left: Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-24 border-2 border-ink overflow-hidden bg-sand shrink-0">
                      {book.coverImageUrl ? (
                        <img
                          src={book.coverImageUrl}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bangers text-xs text-center p-1 text-ink bg-sage/30">
                          {book.title}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bangers text-2xl tracking-comic text-ink">
                          {book.title}
                        </h3>
                        <Badge
                          variant={book.visibility === 'published' ? 'mint' : 'yellow'}
                        >
                          {book.visibility}
                        </Badge>
                        <Badge
                          variant={book.status === 'completed' ? 'blue' : 'red'}
                        >
                          {book.status}
                        </Badge>
                      </div>

                      <p className="font-grotesk text-xs text-muted">
                        Slug: /{book.slug} • {book.chapterCount || 0} Chapters
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {book.genres?.map((g) => (
                          <span
                            key={g}
                            className="text-[10px] font-grotesk font-bold bg-sage/30 border border-ink px-1.5 py-0.2 text-ink"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Link to={`/admin/books/${book.id}/chapters`}>
                      <Button variant="secondary" size="sm">
                        CHAPTERS ({book.chapterCount || 0})
                      </Button>
                    </Link>
                    <Link to={`/admin/books/${book.id}/edit`}>
                      <Button variant="primary" size="sm">
                        EDIT
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteTarget(book)}
                    >
                      DELETE
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-3 border-ink bg-parchment p-12 text-center shadow-hard max-w-lg mx-auto">
              <h3 className="font-bangers text-3xl tracking-comic text-ink mb-2">
                NO BOOKS YET
              </h3>
              <p className="font-grotesk text-sm text-muted mb-6">
                Get started by creating your first serialized novel.
              </p>
              <Link to="/admin/books/new">
                <Button variant="primary" size="md">
                  CREATE YOUR FIRST BOOK →
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="DELETE STORY"
        isConfirm
        confirmText="YES, DELETE BOOK"
        confirmLoading={deleting}
        onConfirm={handleDeleteConfirm}
      >
        <p className="font-grotesk text-sm">
          Are you sure you want to permanently delete{' '}
          <strong>"{deleteTarget?.title}"</strong>? This will remove all associated
          chapters and cannot be undone.
        </p>
      </Modal>
    </PageWrapper>
  )
}

export default BooksList
