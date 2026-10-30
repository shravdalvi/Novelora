import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ChapterContent } from '../components/reader/ChapterContent'
import { ReaderToolbar } from '../components/reader/ReaderToolbar'
import { ReaderProgressBar } from '../components/reader/ReaderProgressBar'
import { LikeButton } from '../components/reader/LikeButton'
import { CommentSection } from '../components/reader/CommentSection'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { toast } from '../components/ui/Toast'
import { getBookBySlug } from '../../src/services/bookService'
import { getChapterByNumber, getPublishedChapters } from '../../src/services/chapterService'
import { useAuth } from '../hooks/useAuth'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { useReaderSettings } from '../context/ReaderSettingsContext'
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { getYouTubeEmbedUrl } from '../utils/youtube'
import type { Book, Chapter } from '../types'

export const ReadChapter: React.FC = () => {
  const { bookSlug, chapterNumber } = useParams<{ bookSlug: string; chapterNumber: string }>()
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { theme } = useReaderSettings()

  const parsedChapterNumber = parseInt(chapterNumber || '1', 10)
  const isFreeChapter = parsedChapterNumber === 1

  const [book, setBook] = useState<Book | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [allChapters, setAllChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  const { saveProgress } = useReadingProgress(book?.id || '')
  const scrollTimeoutRef = useRef<any>(null)

  // Auth guard: If not authenticated and not chapter 1, redirect to login
  useEffect(() => {
    if (!authLoading && !isFreeChapter && !user) {
      toast.info('Please log in to continue reading chapter 2 and beyond.')
      navigate('/login', { state: { from: `/read/${bookSlug}/${chapterNumber}` } })
    }
  }, [user, authLoading, isFreeChapter, bookSlug, chapterNumber, navigate])

  // Fetch Book and Chapter data
  useEffect(() => {
    async function loadData() {
      if (!bookSlug) return
      setLoading(true)

      try {
        const foundBook = await getBookBySlug(bookSlug)
        if (!foundBook) {
          setLoading(false)
          return
        }
        setBook(foundBook)

        const [currChapter, chaptersList] = await Promise.all([
          getChapterByNumber(foundBook.id, parsedChapterNumber),
          getPublishedChapters(foundBook.id),
        ])

        setChapter(currChapter)
        setAllChapters(chaptersList)

        // Check bookmark status
        if (user) {
          const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', foundBook.id)
          const snap = await getDoc(bookmarkRef)
          setIsBookmarked(snap.exists())
        }
      } catch (err) {
        console.error('Error loading chapter:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [bookSlug, parsedChapterNumber, user])

  // Track scroll position and save reading progress
  useEffect(() => {
    if (!book || !chapter || !user) return

    const handleScroll = () => {
      clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(() => {
        const scrollY = window.scrollY || document.documentElement.scrollTop
        saveProgress(parsedChapterNumber, Math.round(scrollY))
      }, 1500)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeoutRef.current)
    }
  }, [book, chapter, user, parsedChapterNumber, saveProgress])

  const handleToggleBookmark = async () => {
    if (!user) {
      toast.info('Sign in to save bookmarks!')
      return
    }
    if (!book) return

    try {
      const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', book.id)
      if (isBookmarked) {
        await deleteDoc(bookmarkRef)
        setIsBookmarked(false)
        toast.success('Removed bookmark')
      } else {
        await setDoc(bookmarkRef, {
          bookId: book.id,
          createdAt: serverTimestamp(),
        })
        setIsBookmarked(true)
        toast.success('Saved to bookshelf!')
      }
    } catch {
      toast.error('Failed to update bookmark')
    }
  }

  if (loading) {
    return (
      <PageWrapper title="Loading Chapter...">
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <div className="inline-block bg-sage text-ink border-3 border-ink p-8 shadow-hard">
            <h2 className="font-bangers text-3xl tracking-comic">
              TURNING THE PAGE...
            </h2>
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (!book || !chapter) {
    return (
      <PageWrapper title="Chapter Not Found">
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="bg-parchment border-3 border-ink p-8 shadow-hard">
            <h2 className="font-bangers text-3xl tracking-comic mb-4">
              CHAPTER NOT FOUND
            </h2>
            <p className="font-grotesk text-sm text-muted mb-6">
              This chapter may not exist or hasn't been released yet.
            </p>
            <Link to={book ? `/book/${book.slug}` : '/library'}>
              <Button variant="primary">VIEW BOOK ARCHIVE</Button>
            </Link>
          </div>
        </div>
      </PageWrapper>
    )
  }

  const prevChapter = allChapters.find((c) => c.chapterNumber === parsedChapterNumber - 1)
  const nextChapter = allChapters.find((c) => c.chapterNumber === parsedChapterNumber + 1)

  const themeClass =
    theme === 'dark' ? 'bg-[#0B1424] text-[#E6F1FF]' : theme === 'sepia' ? 'bg-[#F2F8FD] text-[#0B1D33]' : 'bg-[#FFFFFF] text-[#0B1D33]'

  return (
    <PageWrapper title={`${book.title} - Ch. ${chapter.chapterNumber}`} className={themeClass}>
      <ReaderProgressBar />

      {/* Reader Floating Toolbar */}
      <ReaderToolbar
        onToggleDrawer={() => setIsDrawerOpen(true)}
        onToggleBookmark={handleToggleBookmark}
        isBookmarked={isBookmarked}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb navigation */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-current/20 text-xs font-grotesk font-bold">
          <Link to={`/book/${book.slug}`} className="hover:underline flex items-center gap-1">
            ← {book.title}
          </Link>
          <span>
            Chapter {chapter.chapterNumber} of {allChapters.length}
          </span>
        </div>

        {/* Chapter Header */}
        <header className="mb-10 text-center space-y-2">
          <div className="inline-block bg-sage text-ink border-2 border-ink px-3 py-1 font-bangers text-sm shadow-hard-sm">
            CHAPTER {chapter.chapterNumber}
          </div>
          <h1 className="font-bangers text-4xl sm:text-5xl tracking-comic leading-tight">
            {chapter.title}
          </h1>
          {chapter.wordCount && (
            <p className="text-xs font-grotesk opacity-75">
              Approx. {chapter.wordCount} words
            </p>
          )}
        </header>

        {/* Wattpad-style Header Media Banner (Photo or Video) */}
        {chapter.headerImageUrl && (
          <div className="mb-10 border-3 border-ink shadow-hard-lg overflow-hidden bg-sand max-h-[500px]">
            <img
              src={chapter.headerImageUrl}
              alt={chapter.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {chapter.headerVideoUrl && (
          <div className="mb-10 border-3 border-ink shadow-hard-lg aspect-video overflow-hidden bg-black">
            {getYouTubeEmbedUrl(chapter.headerVideoUrl) ? (
              <iframe
                src={getYouTubeEmbedUrl(chapter.headerVideoUrl)!}
                title={chapter.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={chapter.headerVideoUrl}
                controls
                className="w-full h-full"
              />
            )}
          </div>
        )}

        {/* TipTap Chapter Content */}
        <div className="min-h-[50vh]">
          <ChapterContent content={chapter.content} />
        </div>

        {/* Like and Reactions */}
        <div className="my-12 py-6 border-y-3 border-current/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <LikeButton
            chapterId={chapter.id}
            bookId={book.id}
            initialCount={chapter.likeCount || 0}
          />
          <span className="font-grotesk text-xs opacity-75">
            Enjoyed this chapter? Drop a like for the author!
          </span>
        </div>

        {/* Next / Previous Chapter Navigation */}
        <nav aria-label="Chapter navigation" className="flex items-center justify-between gap-4 my-10">
          {prevChapter ? (
            <Link to={`/read/${book.slug}/${prevChapter.chapterNumber}`}>
              <Button variant="secondary" size="md">
                ← CH. {prevChapter.chapterNumber}
              </Button>
            </Link>
          ) : (
            <div />
          )}

          {nextChapter ? (
            <Link to={`/read/${book.slug}/${nextChapter.chapterNumber}`}>
              <Button variant="primary" size="md">
                CH. {nextChapter.chapterNumber} →
              </Button>
            </Link>
          ) : (
            <div className="text-right">
              <span className="font-bangers text-sm text-hunter block">
                END OF RELEASES
              </span>
              <span className="text-xs font-grotesk opacity-75">More coming soon</span>
            </div>
          )}
        </nav>

        {/* Comments Section */}
        <CommentSection bookId={book.id} chapterId={chapter.id} />
      </div>

      {/* Chapter Selection Drawer / Modal */}
      <Modal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="CHAPTER DIRECTORY"
      >
        <div className="space-y-2 py-2">
          {allChapters.map((ch) => {
            const isCurrent = ch.chapterNumber === parsedChapterNumber
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false)
                  navigate(`/read/${book.slug}/${ch.chapterNumber}`)
                }}
                className={`w-full text-left px-4 py-2.5 border-2 border-ink font-grotesk text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${
                  isCurrent
                    ? 'bg-sage text-ink shadow-hard-sm'
                    : 'bg-parchment hover:bg-sage/30'
                }`}
              >
                <span>
                  Ch. {ch.chapterNumber}: {ch.title}
                </span>
                {isCurrent && <span className="font-bangers text-xs">READING NOW</span>}
              </button>
            )
          })}
        </div>
      </Modal>
    </PageWrapper>
  )
}

export default ReadChapter
