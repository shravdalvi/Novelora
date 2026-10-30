import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { AdminSidebar } from '../../components/layout/AdminSidebar'
import { Button } from '../../components/ui/Button'
import { collection, collectionGroup, onSnapshot, query } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { getLocalBooks, LOCAL_BOOKS_EVENT } from '../../services/localBooksService'
import type { AdminStats, Book, Chapter } from '../../types'

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalBooks: 0,
    totalChapters: 0,
    totalDrafts: 0,
    totalPublished: 0,
    totalReads: 0,
    recentComments: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cloudBooks: Book[] = []
    let cloudChapters: Chapter[] = []

    const recalculateStats = () => {
      // Merge Firestore cloud books with any local storage books
      const cloudIds = new Set(cloudBooks.map((b) => b.id))
      const localOnlyBooks = getLocalBooks().filter((b) => !cloudIds.has(b.id))
      const allBooks = [...cloudBooks, ...localOnlyBooks]

      const totalBooks = allBooks.length
      const publishedBooks = allBooks.filter((b) => b.visibility === 'published').length
      const draftBooks = allBooks.filter((b) => b.visibility !== 'published').length

      // Count chapters & drafts
      const totalChapters = cloudChapters.length
      const draftChapters = cloudChapters.filter((c) => c.status !== 'published').length

      // Total drafts include both unpublished books and unpublished chapters
      const totalDrafts = draftBooks + draftChapters
      const totalPublished = publishedBooks + (totalChapters - draftChapters)

      setStats({
        totalBooks,
        totalChapters,
        totalDrafts,
        totalPublished,
        totalReads: 0,
        recentComments: [],
      })
      setLoading(false)
    }

    // 1. Initial calculation from local storage right away
    recalculateStats()

    // 2. Real-time listener on the 'books' collection
    const booksQuery = query(collection(db, 'books'))
    const unsubBooks = onSnapshot(
      booksQuery,
      (snapshot) => {
        cloudBooks = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Book[]
        recalculateStats()
      },
      (err) => {
        console.warn('Realtime books listener error:', err)
        recalculateStats()
      }
    )

    // 3. Real-time listener on all 'chapters' across all books via collectionGroup
    const chaptersQuery = query(collectionGroup(db, 'chapters'))
    const unsubChapters = onSnapshot(
      chaptersQuery,
      (snapshot) => {
        cloudChapters = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Chapter[]
        recalculateStats()
      },
      (err) => {
        console.warn('Realtime chapters listener error:', err)
        recalculateStats()
      }
    )

    // 4. Local storage event listener (for offline/instant local book changes)
    const handleLocalUpdate = () => {
      recalculateStats()
    }
    window.addEventListener(LOCAL_BOOKS_EVENT, handleLocalUpdate)
    window.addEventListener('storage', handleLocalUpdate)

    return () => {
      unsubBooks()
      unsubChapters()
      window.removeEventListener(LOCAL_BOOKS_EVENT, handleLocalUpdate)
      window.removeEventListener('storage', handleLocalUpdate)
    }
  }, [])

  const statCards = [
    { label: 'TOTAL BOOKS', value: stats.totalBooks, bg: '#4A1A23', text: '#D8D0C2' },       // Bordeaux
    { label: 'TOTAL CHAPTERS', value: stats.totalChapters, bg: '#6A7657', text: '#D8D0C2' },   // Sage
    { label: 'PUBLISHED RELEASES', value: stats.totalPublished, bg: '#EDE8DF', text: '#1A1A1A' }, // Bone / Parchment
    { label: 'ACTIVE DRAFTS', value: stats.totalDrafts, bg: '#8C603E', text: '#D8D0C2' },       // Cedar
  ]

  return (
    <PageWrapper title="Admin Dashboard">
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
        <AdminSidebar />

        <div className="flex-1 p-6 sm:p-10 space-y-8 bg-bone">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-ink pb-6">
            <div>
              <h1 className="font-bangers text-4xl sm:text-5xl tracking-comic text-ink">
                AUTHOR DASHBOARD
              </h1>
            </div>

            <div className="flex gap-3">
              <Link to="/admin/books/new">
                <Button variant="primary" size="md">
                  + CREATE NEW BOOK
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="border-3 border-ink p-6 shadow-hard flex flex-col justify-between transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: card.bg, color: card.text }}
              >
                <span
                  className="font-bangers text-sm sm:text-base tracking-comic mb-2"
                  style={{ color: card.text }}
                >
                  {card.label}
                </span>
                <span
                  className="font-bangers text-4xl sm:text-5xl"
                  style={{ color: card.text }}
                >
                  {loading ? '...' : card.value}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="bg-parchment border-3 border-ink shadow-hard p-6 space-y-4">
              <h3 className="font-bangers text-2xl tracking-comic text-ink">
                MANAGE YOUR ARCHIVES
              </h3>
              <p className="font-grotesk text-sm text-muted">
                Create new serialized books, manage ongoing arcs, set cover art, and organize chapters.
              </p>
              <div className="flex gap-3 pt-2">
                <Link to="/admin/books">
                  <Button variant="secondary" size="sm">
                    VIEW ALL BOOKS →
                  </Button>
                </Link>
                <Link to="/admin/books/new">
                  <Button variant="primary" size="sm">
                    NEW BOOK
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-parchment border-3 border-ink shadow-hard p-6 space-y-4">
              <h3 className="font-bangers text-2xl tracking-comic text-ink">
                LIVE READER SITE
              </h3>
              <p className="font-grotesk text-sm text-muted">
                Preview how your audience experiences your story chapters, reader fonts, themes, and comments.
              </p>
              <div className="flex gap-3 pt-2">
                <Link to="/library">
                  <Button variant="secondary" size="sm">
                    VIEW LIBRARY
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="ghost" size="sm">
                    VISIT HOMEPAGE
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default Dashboard
