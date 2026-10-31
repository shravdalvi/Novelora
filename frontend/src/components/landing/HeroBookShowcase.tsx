import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { subscribeToPublishedBooks } from '../../services/bookService'
import { getLocalBooks, getLocalChapters } from '../../services/localBooksService'

interface ShowcaseBook {
  id: string
  title: string
  slug: string
  coverImageUrl?: string
  description?: string
  genres?: string[]
  chapterCount?: number
  status?: string
}

// Fallback real author books so reload NEVER shows an empty card
const DEFAULT_AUTHOR_BOOKS: ShowcaseBook[] = [
  {
    id: 'book-1793291155125',
    title: 'My Overbearing Boss',
    slug: 'my-overbearing-boss',
    coverImageUrl: '/covers/my-overbearing-boss.jpg',
    description:
      "My name is Kathryn Landon, and apparently, I have the worst luck when it comes to men.\n\nEspecially the one signing my paychecks.\n\nKai Havertz. Thirty-two. CEO of Havertz Group. One of the richest, most powerful men in New York, and an arrogant bastard with a face that should honestly be illegal. Women throw themselves at him, yet somehow, I'm the only woman he seems determined to torment.\n\nHe's controlling, infuriating, ridiculously possessive, and has absolutely no business interfering in my personal life. But lately, his attention has become a little too personal, his stares a little too lingering, and his jealousy a little too obvious.\n\n\nBut Kai isn't the only man with a complicated love life.\n\nChristian Young, the thirty-two-year-old CEO of Young Heels, notorious Casanova, and Kai's best friend, has met his match in Nina Black. Twenty-four, brutally unapologetic, and completely immune to his irresistible charm.",
    genres: ['Office Romance', 'Smut', 'Billionaires and CEOs'],
    chapterCount: 8,
    status: 'ongoing',
  },
  {
    id: 'author-echoes-02',
    title: 'Echoes of the Forgotten Realm',
    slug: 'echoes-of-the-forgotten-realm',
    coverImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    description: 'In an ancient world where basalt spires pierce storm-torn skies, an outcast cartographer uncovers an obsidian monolith that whispers forbidden arcana.',
    genres: ['Fantasy', 'Adventure'],
    chapterCount: 0,
    status: 'ongoing',
  },
  {
    id: 'author-manor-03',
    title: 'Whispers of the Crimson Manor',
    slug: 'whispers-of-the-crimson-manor',
    coverImageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    description: 'An inherited Gothic estate holds locked archives and century-old secrets waiting behind velvet curtains.',
    genres: ['Mystery', 'Thriller'],
    chapterCount: 0,
    status: 'completed',
  },
]

export const HeroBookShowcase: React.FC = () => {
  // Synchronously initialize with local storage books so reload is instant
  const [books, setBooks] = useState<ShowcaseBook[]>(() => {
    try {
      const local = getLocalBooks()
      if (local && local.length > 0) return local
    } catch {
      // fallback
    }
    return DEFAULT_AUTHOR_BOOKS
  })

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Listen to real-time author books from Firestore / local storage
  useEffect(() => {
    const unsubscribe = subscribeToPublishedBooks((published) => {
      if (published && published.length > 0) {
        setBooks(published)
      } else {
        const local = getLocalBooks()
        if (local && local.length > 0) {
          setBooks(local)
        } else {
          setBooks(DEFAULT_AUTHOR_BOOKS)
        }
      }
    })
    return () => unsubscribe()
  }, [])

  const activeBooks = books.length > 0 ? books : DEFAULT_AUTHOR_BOOKS
  const currentBook = activeBooks[currentIndex % activeBooks.length]

  // Real-time chapter listener for the active showcase book
  const [liveChapterCount, setLiveChapterCount] = useState<number | null>(null)

  useEffect(() => {
    if (!currentBook?.id) {
      setLiveChapterCount(null)
      return
    }

    setLiveChapterCount(currentBook.chapterCount ?? 0)

    try {
      const chaptersRef = collection(db, 'books', currentBook.id, 'chapters')
      const q = query(chaptersRef, where('status', '==', 'published'))
      const unsub = onSnapshot(
        q,
        (snap) => {
          const cloudIds = new Set(snap.docs.map((d) => d.id))
          const localList = getLocalChapters(currentBook.id).filter(
            (c) => c.status === 'published' && !cloudIds.has(c.id)
          )
          const total = snap.docs.length + localList.length
          const baseline = currentBook.slug === 'my-overbearing-boss' ? 8 : (currentBook.chapterCount || 1)
          setLiveChapterCount(Math.max(total, baseline))
        },
        (err) => {
          console.warn('Real-time chapters check fallback:', err)
          const localList = getLocalChapters(currentBook.id).filter((c) => c.status === 'published')
          const baseline = currentBook.slug === 'my-overbearing-boss' ? 8 : (currentBook.chapterCount || 1)
          setLiveChapterCount(Math.max(localList.length, baseline))
        }
      )
      return () => unsub()
    } catch {
      const baseline = currentBook.slug === 'my-overbearing-boss' ? 8 : (currentBook.chapterCount || 1)
      setLiveChapterCount(baseline)
    }
  }, [currentBook?.id, currentBook?.chapterCount])

  const displayChapterCount =
    liveChapterCount !== null ? liveChapterCount : (currentBook.chapterCount ?? 0)

  // Auto-slide every 5.5s when not hovered or flipped
  useEffect(() => {
    if (activeBooks.length <= 1 || isHovered || isFlipped) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBooks.length)
      setIsFlipped(false)
    }, 5500)
    return () => clearInterval(timer)
  }, [activeBooks.length, isHovered, isFlipped])

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % activeBooks.length)
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + activeBooks.length) % activeBooks.length)
  }

  const handleCardClick = () => {
    setIsFlipped((prev) => !prev)
  }

  return (
    <div
      className="relative flex flex-col items-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsFlipped(false)
      }}
    >
      {/* ── THE NOVEL CARD (Clean, standalone 3D card) ── */}
      <div
        className="w-[270px] sm:w-[290px] h-[410px] cursor-pointer transition-transform duration-300 hover:-translate-y-1"
        style={{ perspective: '1000px' }}
        onClick={handleCardClick}
        title="Click to flip card"
      >
        <div
          className="w-full h-full relative transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* ── CARD FRONT (Book Cover Art) ── */}
          <div
            className="absolute inset-0 w-full h-full border-3 border-ink shadow-hard-lg flex flex-col overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              backgroundColor: '#EDE8DF',
            }}
          >
            {/* Badges Overlay */}
            <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
              <span
                className="font-bangers text-xs px-2.5 py-0.5 border-2 border-ink shadow-hard-sm"
                style={{
                  backgroundColor: currentBook.status === 'completed' ? '#6A7657' : '#4A1A23',
                  color: '#D8D0C2',
                }}
              >
                {currentBook.status === 'completed' ? 'COMPLETED' : 'ONGOING'}
              </span>
              <span
                className="font-bangers text-xs px-2 py-0.5 border-2 border-ink shadow-hard-sm"
                style={{ backgroundColor: '#233126', color: '#D8D0C2' }}
              >
                {displayChapterCount} CHS
              </span>
            </div>

            {/* Real Book Cover Image */}
            <div className="relative w-full h-[300px] border-b-3 border-ink overflow-hidden bg-sand">
              <img
                src={currentBook.coverImageUrl || '/covers/my-overbearing-boss.jpg'}
                alt={currentBook.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* Title & genres footer */}
            <div className="p-3 flex-1 flex flex-col justify-between" style={{ backgroundColor: '#D8D0C2' }}>
              <div>
                <h3 className="font-bangers text-xl tracking-comic text-ink line-clamp-1 leading-tight">
                  {currentBook.title}
                </h3>
                {currentBook.genres && currentBook.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentBook.genres.slice(0, 2).map((g) => (
                      <span
                        key={g}
                        className="text-[10px] font-grotesk font-bold border border-ink px-1.5 py-0.2"
                        style={{ backgroundColor: '#EDE8DF', color: '#1A1A1A' }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-ink/20 text-xs font-grotesk font-bold text-ink/70">
                <span className="flex items-center gap-1">
                  <span>↻</span> Click to flip synopsis
                </span>
                <span className="font-bangers text-sm" style={{ color: '#4A1A23' }}>
                  FLIP →
                </span>
              </div>
            </div>
          </div>

          {/* ── CARD BACK (Synopsis & Read CTA) ── */}
          <div
            className="absolute inset-0 w-full h-full border-3 border-ink shadow-hard-lg flex flex-col justify-between p-5"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              backgroundColor: '#233126',
              color: '#FFFFFF',
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-bone/20 pb-1.5">
                <span
                  className="font-bangers text-xs px-2 py-0.5 border-2 border-bone/40 shadow-hard-sm"
                  style={{ backgroundColor: '#4A1A23', color: '#D8D0C2' }}
                >
                  NOVEL SYNOPSIS
                </span>
                <span className="font-grotesk text-xs text-bone/70 font-bold">
                  By Shravani Dalvi
                </span>
              </div>

              <h3 className="font-bangers text-2xl tracking-comic leading-tight" style={{ color: '#D8D0C2' }}>
                {currentBook.title}
              </h3>

              <p className="font-grotesk text-xs sm:text-sm leading-relaxed text-bone/90 line-clamp-5">
                {currentBook.description ||
                  'Step into an expansive fictional realm. Read chapter cliffhangers, unravel deep lore, and bookmark your progress.'}
              </p>

              {currentBook.genres && currentBook.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {currentBook.genres.map((g) => (
                    <span
                      key={g}
                      className="text-[10px] font-grotesk font-bold border border-bone/50 px-1.5 py-0.5 text-bone"
                      style={{ backgroundColor: 'rgba(216,208,194,0.15)' }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-bone/20" onClick={(e) => e.stopPropagation()}>
              <Link
                to={displayChapterCount > 0 ? `/read/${currentBook.slug}/1` : `/book/${currentBook.slug}`}
                className="w-full block text-center py-2.5 font-bangers text-base tracking-comic border-3 border-ink shadow-hard transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer"
                style={{ backgroundColor: '#8C603E', color: '#FFFFFF' }}
              >
                {displayChapterCount > 0 ? 'START READING CHAPTER 1 →' : 'EXPLORE STORY DETAILS →'}
              </Link>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsFlipped(false)}
                  className="text-xs font-grotesk text-bone/70 underline hover:text-bone cursor-pointer"
                >
                  ← Flip back to book cover
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PREV / NEXT NOVEL BUTTONS ── */}
      {activeBooks.length > 1 && (
        <div className="flex items-center justify-between w-[270px] sm:w-[290px] mt-4 z-30">
          <button
            type="button"
            onClick={handlePrev}
            className="px-3 py-1 border-2 border-ink font-bangers text-xs sm:text-sm shadow-hard-sm transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            style={{ backgroundColor: '#D8D0C2', color: '#1A1A1A' }}
            aria-label="Previous Novel"
          >
            ← PREV
          </button>

          <div className="flex items-center gap-1.5">
            {activeBooks.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIsFlipped(false)
                  setCurrentIndex(idx)
                }}
                className="w-2.5 h-2.5 border border-ink transition-all cursor-pointer"
                style={{
                  backgroundColor: idx === currentIndex % activeBooks.length ? '#4A1A23' : '#D8D0C2',
                  transform: idx === currentIndex % activeBooks.length ? 'scale(1.2)' : 'scale(1)',
                }}
                aria-label={`Novel ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="px-3 py-1 border-2 border-ink font-bangers text-xs sm:text-sm shadow-hard-sm transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            style={{ backgroundColor: '#D8D0C2', color: '#1A1A1A' }}
            aria-label="Next Novel"
          >
            NEXT →
          </button>
        </div>
      )}
    </div>
  )
}
