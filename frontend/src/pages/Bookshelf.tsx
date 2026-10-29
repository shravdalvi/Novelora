import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { toast } from '../components/ui/Toast'
import { useAuth } from '../hooks/useAuth'
import type { Book, Bookmark, ReadingProgress } from '../types'

interface BookmarkWithBook extends Bookmark {
  book: Book
  progress?: ReadingProgress | null
}

export const Bookshelf: React.FC = () => {
  const { user } = useAuth()
  const [bookmarks, setBookmarks] = useState<BookmarkWithBook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBookshelf() {
      if (!user) return
      setLoading(true)

      try {
        const bookmarksRef = collection(db, 'users', user.uid, 'bookmarks')
        const snapshot = await getDocs(bookmarksRef)

        const loaded: BookmarkWithBook[] = []

        for (const docSnap of snapshot.docs) {
          const bookId = docSnap.id
          const bookRef = doc(db, 'books', bookId)
          const bookSnap = await getDoc(bookRef)

          if (bookSnap.exists()) {
            const bookData = { id: bookSnap.id, ...bookSnap.data() } as Book

            // Fetch progress for this book
            const progressRef = doc(db, 'users', user.uid, 'progress', bookId)
            const progressSnap = await getDoc(progressRef)
            const progressData = progressSnap.exists()
              ? (progressSnap.data() as ReadingProgress)
              : null

            loaded.push({
              bookId,
              createdAt: docSnap.data().createdAt,
              book: bookData,
              progress: progressData,
            })
          }
        }

        setBookmarks(loaded)
      } catch (err) {
        console.error('Error fetching bookshelf:', err)
      } finally {
        setLoading(false)
      }
    }

    loadBookshelf()
  }, [user])

  const handleRemoveBookmark = async (bookId: string) => {
    if (!user) return
    try {
      const ref = doc(db, 'users', user.uid, 'bookmarks', bookId)
      await deleteDoc(ref)
      setBookmarks((prev) => prev.filter((b) => b.bookId !== bookId))
      toast.success('Removed from bookshelf')
    } catch {
      toast.error('Failed to remove bookmark')
    }
  }

  return (
    <PageWrapper title="My Bookshelf">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="border-b-3 border-ink pb-6 flex items-center justify-between">
          <div>
            <div className="inline-block bg-sage border-3 border-ink px-3 py-1 shadow-hard-sm mb-2">
              <span className="font-bangers text-sm tracking-comic text-ink">
                SAVED STORIES
              </span>
            </div>
            <h1 className="font-bangers text-4xl sm:text-5xl tracking-comic text-ink">
              MY BOOKSHELF
            </h1>
          </div>
          <Link to="/library">
            <Button variant="secondary" size="sm">
              + EXPLORE MORE
            </Button>
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map(({ book, progress }) => {
              const lastChapter = progress?.lastChapter || 1

              return (
                <div
                  key={book.id}
                  className="bg-parchment border-3 border-ink shadow-hard p-5 flex flex-col justify-between"
                >
                  <div className="flex gap-4 mb-4">
                    <div className="w-24 aspect-[2/3] border-2 border-ink overflow-hidden bg-sand shrink-0 shadow-hard-sm">
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

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <Link to={`/book/${book.slug}`}>
                          <h3 className="font-bangers text-2xl tracking-comic text-ink line-clamp-1 hover:text-hunter">
                            {book.title}
                          </h3>
                        </Link>
                        <p className="font-grotesk text-xs text-muted line-clamp-2 mt-1">
                          {book.description}
                        </p>
                      </div>

                      <div className="bg-sand border border-ink px-2.5 py-1 text-xs font-grotesk font-bold text-ink mt-2">
                        {progress?.lastChapter ? (
                          <span>Last Read: Ch. {progress.lastChapter}</span>
                        ) : (
                          <span>Not started yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t-2 border-ink/20 pt-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveBookmark(book.id)}
                      className="text-xs font-grotesk font-bold text-soft-coral hover:underline cursor-pointer"
                    >
                      Remove
                    </button>

                    <Link to={`/read/${book.slug}/${lastChapter}`}>
                      <Button variant="primary" size="sm">
                        CONTINUE CH. {lastChapter} →
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="border-3 border-ink bg-sand p-12 text-center shadow-hard max-w-xl mx-auto my-8">
            <h2 className="font-bangers text-3xl tracking-comic text-ink mb-2">
              YOUR BOOKSHELF IS EMPTY
            </h2>
            <p className="font-grotesk text-sm text-muted mb-6">
              When you find a story you love, click "Add to Bookmarks" to easily track your reading progress and return anytime.
            </p>
            <Link to="/library">
              <Button variant="primary" size="md">
                BROWSE LIBRARY →
              </Button>
            </Link>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

export default Bookshelf
