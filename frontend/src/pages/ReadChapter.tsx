import React, { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ChapterContent } from '../components/reader/ChapterContent'
import { ReaderToolbar } from '../components/reader/ReaderToolbar'
import { ReaderProgressBar } from '../components/reader/ReaderProgressBar'
import { LikeButton } from '../components/reader/LikeButton'
import { CommentSection } from '../components/reader/CommentSection'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { toast } from '../components/ui/Toast'
import { getBookBySlug } from '../services/bookService'
import {
  getChapterByNumber,
  getPublishedChapters,
  getChapterById,
  getAllChaptersForBook,
} from '../services/chapterService'
import { subscribeToBookmarkedStatus, toggleBookmark } from '../services/bookmarkService'
import { useAuth } from '../hooks/useAuth'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { useReaderSettings } from '../context/ReaderSettingsContext'
import { getYouTubeEmbedUrl } from '../utils/youtube'
import type { Book, Chapter } from '../types'

export const ReadChapter: React.FC = () => {
  const { bookSlug, chapterNumber } = useParams<{ bookSlug: string; chapterNumber: string }>()
  const [searchParams] = useSearchParams()
  const chapterIdParam = searchParams.get('chapterId')
  const navigate = useNavigate()
  const { user, isAdmin, isLoading: authLoading } = useAuth()
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

        // 1. Fetch exact chapter: either by chapterId query param or by number
        let currChapter: Chapter | null = null
        if (chapterIdParam) {
          currChapter = await getChapterById(foundBook.id, chapterIdParam)
        }
        if (!currChapter) {
          currChapter = await getChapterByNumber(foundBook.id, parsedChapterNumber, true)
        }

        // 2. Fetch list of chapters for navigation
        const isAuthorUser = Boolean(isAdmin || user?.role === 'admin')
        const chaptersList = isAuthorUser
          ? await getAllChaptersForBook(foundBook.id)
          : await getPublishedChapters(foundBook.id)

        if (!currChapter && chaptersList.length > 0) {
          currChapter = chaptersList.find((c) => c.chapterNumber === parsedChapterNumber) || chaptersList[0]
        }

        setChapter(currChapter)
        setAllChapters(chaptersList)
      } catch (err) {
        console.error('Error loading chapter:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [bookSlug, parsedChapterNumber, chapterIdParam, isAdmin, user])

  // Real-time subscription to current user's bookmark status for this book
  useEffect(() => {
    if (!user || !book?.id) {
      setIsBookmarked(false)
      return
    }
    const unsub = subscribeToBookmarkedStatus(user.uid, book.id, (status) => {
      setIsBookmarked(status)
    })
    return () => unsub()
  }, [user, book?.id])

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
      const res = await toggleBookmark(user.uid, book)
      setIsBookmarked(res.isBookmarked)
      if (res.isBookmarked) {
        toast.success('Saved to bookshelf!')
      } else {
        toast.success('Removed from bookshelf')
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

  const isDark = theme === 'dark'
  const isSepia = theme === 'sepia'
  const pageBgClass = isDark
    ? 'bg-[#141A15] text-[#D8D0C2]'
    : isSepia
    ? 'bg-[#C4B9A8] text-ink'
    : 'bg-bone text-ink'

  const cardBgClass = isDark
    ? 'bg-[#233126] border-3 border-[#6A7657] shadow-hard-lg text-[#D8D0C2]'
    : 'bg-parchment border-3 border-ink shadow-hard-lg text-ink'

  const dividerClass = isDark ? 'border-current/20' : 'border-ink/20'

  const isAuthorOrAdmin = Boolean(isAdmin || user?.role === 'admin')

  return (
    <PageWrapper title={`${book.title} - Ch. ${chapter.chapterNumber}`} className={pageBgClass}>
      <ReaderProgressBar />

      {/* Reader Floating Toolbar */}
      <ReaderToolbar
        onToggleDrawer={() => setIsDrawerOpen(true)}
        onToggleBookmark={handleToggleBookmark}
        isBookmarked={isBookmarked}
        editUrl={
          isAuthorOrAdmin && book && chapter
            ? `/admin/chapters/${chapter.id}/edit?bookId=${book.id}`
            : undefined
        }
      />

      <div className="max-w-4xl mx-auto w-full px-4 pt-6 pb-16">
        {/* Manuscript Canvas (Identical to Writing Studio layout) */}
        <div className={`${cardBgClass} px-6 py-8 sm:px-12 sm:py-12 mb-12 relative transition-colors duration-200`}>
          {/* ── BREADCRUMB BAR (Matching Studio & Reader format) ── */}
          <div className={`flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b-2 ${dividerClass} text-xs font-grotesk font-bold select-none`}>
            <div className="flex items-center gap-2">
              <Link to={`/book/${book.slug}`} className="hover:underline flex items-center gap-1">
                ← {book.title}
              </Link>
              {isAuthorOrAdmin && (
                <Link
                  to={`/admin/books/${book.id}/chapters`}
                  className="hover:underline opacity-60 hover:opacity-100 hidden sm:inline"
                >
                  / Manage Chapters
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span>
                Chapter {chapter.chapterNumber} of {allChapters.length}
              </span>
            </div>
          </div>

          {/* ── CHAPTER BRANDING HEADER ── */}
          <header className="mb-10 text-center space-y-3">
            <div className="inline-block bg-sage text-ink border-2 border-ink px-4 py-1 font-bangers text-sm sm:text-base shadow-hard-sm uppercase tracking-wider">
              CHAPTER {chapter.chapterNumber}
            </div>
            <h1 className="font-bangers text-4xl sm:text-5xl md:text-6xl tracking-comic leading-tight text-center uppercase max-w-3xl mx-auto">
              {chapter.title}
            </h1>
            {chapter.wordCount && (
              <p className="text-xs sm:text-sm font-grotesk font-bold opacity-75 text-center">
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

          {/* Subtle Divider before chapter prose */}
          <div className={`border-b-2 ${dividerClass} mb-8`} />

          {/* TipTap Chapter Content */}
          <div className="min-h-[50vh] font-reading-sans text-base sm:text-lg leading-relaxed">
            <ChapterContent content={chapter.content} />
          </div>

          {/* Like and Reactions */}
          <div className={`my-10 pt-6 border-t-2 ${dividerClass} flex flex-col sm:flex-row items-center justify-between gap-4`}>
            <LikeButton
              chapterId={chapter.id}
              bookId={book.id}
              initialCount={chapter.likeCount || 0}
            />
            <span className="font-grotesk text-xs opacity-75 font-bold">
              Enjoyed this chapter? Drop a like for the author!
            </span>
          </div>

          {/* Next / Previous Chapter Navigation */}
          <nav
            aria-label="Chapter navigation"
            className={`flex items-center justify-between gap-4 pt-4 border-t-2 ${
              isDark ? 'border-current/10' : 'border-ink/10'
            }`}
          >
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
                <span className="font-bangers text-base text-hunter block">
                  END OF RELEASES
                </span>
                <span className="text-xs font-grotesk opacity-75">More coming soon</span>
              </div>
            )}
          </nav>
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <CommentSection bookId={book.id} chapterId={chapter.id} />
        </div>
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
