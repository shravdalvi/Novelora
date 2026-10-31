import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ChapterList } from '../components/book/ChapterList'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { toast } from '../components/ui/Toast'
import { getBookBySlug } from '../services/bookService'
import { getPublishedChapters } from '../services/chapterService'
import { getLocalChapters } from '../services/localBooksService'
import { subscribeToBookmarkedStatus, toggleBookmark } from '../services/bookmarkService'
import { useAuth } from '../hooks/useAuth'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { doc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { Book, Chapter } from '../types'

export const BookDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const { user, isAdmin } = useAuth()
  const [book, setBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)

  const { progress } = useReadingProgress(book?.id || '')

  useEffect(() => {
    let unsubChapters: (() => void) | undefined
    let unsubBook: (() => void) | undefined
    let unsubBookmark: (() => void) | undefined

    async function loadBookData() {
      if (!slug) return
      setLoading(true)
      try {
        const foundBook = await getBookBySlug(slug)
        if (foundBook) {
          setBook(foundBook)

          // 1. Real-time listener for the book doc itself
          try {
            unsubBook = onSnapshot(doc(db, 'books', foundBook.id), (snap) => {
              if (snap.exists()) {
                setBook({ id: snap.id, ...snap.data() } as Book)
              }
            })
          } catch {}

          // 2. Real-time listener for published chapters
          const chaptersRef = collection(db, 'books', foundBook.id, 'chapters')
          const q = query(
            chaptersRef,
            where('status', '==', 'published'),
            orderBy('chapterNumber', 'asc')
          )

          const mergeWithLocal = (cloudList: Chapter[]) => {
            const cloudIds = new Set(cloudList.map((c) => c.id))
            const localPublished = getLocalChapters(foundBook.id).filter(
              (c) => c.status === 'published' && !cloudIds.has(c.id)
            )
            const combined = [...cloudList, ...localPublished]

            // Deduplicate titles
            const seen = new Set<string>()
            const deduplicated: Chapter[] = []
            for (const ch of combined) {
              const norm = ch.title.trim().toLowerCase()
              if (!seen.has(norm)) {
                seen.add(norm)
                deduplicated.push(ch)
              }
            }

            // Ensure Characters is always first
            deduplicated.sort((a, b) => {
              if (a.title.trim().toLowerCase() === 'characters') return -1
              if (b.title.trim().toLowerCase() === 'characters') return 1
              return (a.chapterNumber || 0) - (b.chapterNumber || 0)
            })

            const numbered = deduplicated.map((ch, idx) => ({
              ...ch,
              chapterNumber: idx + 1,
            }))

            setChapters(numbered)
          }

          unsubChapters = onSnapshot(
            q,
            (snap) => {
              const list = snap.docs.map((d) => ({
                id: d.id,
                bookId: foundBook.id,
                ...d.data(),
              })) as Chapter[]
              mergeWithLocal(list)
            },
            async () => {
              // Fallback
              const fetchedChapters = await getPublishedChapters(foundBook.id)
              mergeWithLocal(fetchedChapters)
            }
          )

          // 3. Real-time bookmark status listener for current user
          if (user) {
            unsubBookmark = subscribeToBookmarkedStatus(user.uid, foundBook.id, (status) => {
              setIsBookmarked(status)
            })
          }
        }
      } catch (err) {
        console.error('Failed to load book detail:', err)
      } finally {
        setLoading(false)
      }
    }

    loadBookData()

    return () => {
      if (unsubChapters) unsubChapters()
      if (unsubBook) unsubBook()
      if (unsubBookmark) unsubBookmark()
    }
  }, [slug, user])

  const handleToggleBookmark = async () => {
    if (!user) {
      toast.info('Sign in to bookmark this story!')
      return
    }
    if (!book) return

    try {
      setBookmarkLoading(true)
      const res = await toggleBookmark(user.uid, book)
      setIsBookmarked(res.isBookmarked)
      if (res.isBookmarked) {
        toast.success('Added to your bookshelf!')
      } else {
        toast.success('Removed from bookmarks')
      }
    } catch (err) {
      toast.error('Failed to update bookmark')
    } finally {
      setBookmarkLoading(false)
    }
  }

  if (loading) {
    return (
      <PageWrapper title="Loading Book...">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="inline-block bg-sage border-3 border-ink p-8 shadow-hard">
            <span className="font-bangers text-3xl tracking-comic text-ink">
              OPENING THE NOVEL...
            </span>
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (!book) {
    return (
      <PageWrapper title="Story Not Found">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-parchment border-3 border-ink p-8 shadow-hard">
            <h2 className="font-bangers text-3xl tracking-comic mb-4">
              STORY NOT FOUND
            </h2>
            <p className="font-grotesk text-sm text-muted mb-6">
              The story you requested may have been relocated or unpublished.
            </p>
            <Link to="/library">
              <Button variant="primary">BACK TO LIBRARY</Button>
            </Link>
          </div>
        </div>
      </PageWrapper>
    )
  }

  const firstChapterNumber = chapters.length > 0 ? chapters[0].chapterNumber : 1
  const continueChapterNumber = progress?.lastChapter || firstChapterNumber

  return (
    <PageWrapper title={book.title}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Book Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start bg-parchment border-3 border-ink shadow-hard p-6 md:p-8">
          {/* Cover */}
          <div className="md:col-span-4 relative aspect-[2/3] border-3 border-ink overflow-hidden bg-sand shadow-hard-sm">
            {book.coverImageUrl ? (
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-sage/30">
                <span className="font-bangers text-2xl tracking-comic text-ink">
                  {book.title}
                </span>
              </div>
            )}
            <div className="absolute top-3 left-3">
              <Badge variant={book.status === 'completed' ? 'mint' : 'red'}>
                {book.status === 'completed' ? 'COMPLETED' : 'ONGOING'}
              </Badge>
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-8 flex flex-col justify-between h-full space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {book.genres?.map((g) => (
                  <span
                    key={g}
                    className="text-xs font-grotesk font-bold bg-sage/40 border border-ink px-2.5 py-1 text-ink"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <h1 className="font-bangers text-4xl sm:text-5xl tracking-comic text-ink mb-4 leading-tight">
                {book.title}
              </h1>

              <div className="flex items-center gap-4 text-xs font-grotesk font-bold text-muted border-y-2 border-ink/20 py-2.5 mb-4">
                <span>{chapters.length} Chapters</span>
                <span>•</span>
                <span>Author: Shravani</span>
              </div>

              <p className="font-grotesk text-base text-ink/90 leading-relaxed whitespace-pre-wrap">
                {book.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t-2 border-ink/20">
              {chapters.length > 0 ? (
                <Link to={`/read/${book.slug}/${continueChapterNumber}`}>
                  <Button variant="primary" size="lg">
                    {progress?.lastChapter
                      ? `CONTINUE CH. ${progress.lastChapter} →`
                      : 'START READING CH. 1 →'}
                  </Button>
                </Link>
              ) : (
                <Button variant="secondary" size="lg" disabled>
                  COMING SOON
                </Button>
              )}

              <Button
                variant={isBookmarked ? 'danger' : 'secondary'}
                size="lg"
                onClick={handleToggleBookmark}
                loading={bookmarkLoading}
              >
                {isBookmarked ? '★ BOOKMARKED' : '☆ ADD TO BOOKMARKS'}
              </Button>

              {isAdmin && (
                <Link to={`/admin/books/${book.id}/edit`}>
                  <Button variant="ghost" size="lg">
                    EDIT BOOK
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-3 border-ink pb-3">
            <h2 className="font-bangers text-3xl tracking-comic text-ink uppercase">
              CHAPTER ARCHIVE ({chapters.length})
            </h2>
            <span className="font-grotesk text-xs text-muted font-bold">
              Chapter 1 is free for everyone
            </span>
          </div>

          <ChapterList
            chapters={chapters}
            bookSlug={book.slug}
            bookId={book.id}
            isAuthenticated={Boolean(user)}
            lastReadChapterNumber={progress?.lastChapter}
          />
        </div>
      </div>
    </PageWrapper>
  )
}

export default BookDetail
