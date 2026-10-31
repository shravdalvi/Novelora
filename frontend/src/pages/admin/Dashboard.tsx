import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { AdminSidebar } from '../../components/layout/AdminSidebar'
import { Button } from '../../components/ui/Button'
import { collection, collectionGroup, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../services/firebase'
import type { AdminStats } from '../../types'

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
    // Track each stat independently via Firestore real-time listeners.
    // Never mix localStorage counts into these — localStorage is for the writing
    // studio (author-side). The dashboard stats must reflect cloud truth only.
    let totalBooks = 0
    let totalChapters = 0
    let publishedChapters = 0
    let draftChapters = 0

    const pushStats = () => {
      setStats({
        totalBooks,
        totalChapters,
        totalDrafts: draftChapters,
        totalPublished: publishedChapters,
        totalReads: 0,
        recentComments: [],
      })
      setLoading(false)
    }

    // 1. Real-time count of books
    const unsubBooks = onSnapshot(
      collection(db, 'books'),
      (snap) => {
        totalBooks = snap.size
        pushStats()
      },
      (err) => {
        console.warn('[Dashboard] books listener error:', err)
      }
    )

    // Helper: deduplicate chapter docs by normalized title so stale Firestore
    // duplicates don't inflate counts before the next sync cleans them up.
    const deduplicateByTitle = (docs: Array<{ data(): Record<string, unknown> }>) => {
      const seen = new Set<string>()
      for (const d of docs) {
        const title = String((d.data() as { title?: string }).title ?? '').trim().toLowerCase()
        seen.add(title)
      }
      return seen.size
    }

    // 2. Real-time count of ALL chapters (deduplicated by title)
    const unsubAllChapters = onSnapshot(
      collectionGroup(db, 'chapters'),
      (snap) => {
        totalChapters = deduplicateByTitle(snap.docs)
        pushStats()
      },
      (err) => {
        console.warn('[Dashboard] all-chapters listener error:', err)
      }
    )

    // 3. Real-time count of PUBLISHED chapters (deduplicated by title)
    const unsubPublished = onSnapshot(
      query(collectionGroup(db, 'chapters'), where('status', '==', 'published')),
      (snap) => {
        publishedChapters = deduplicateByTitle(snap.docs)
        pushStats()
      },
      (err) => {
        console.warn('[Dashboard] published-chapters listener error:', err)
      }
    )

    // 4. Real-time count of DRAFT chapters (deduplicated by title)
    const unsubDrafts = onSnapshot(
      query(collectionGroup(db, 'chapters'), where('status', '==', 'draft')),
      (snap) => {
        draftChapters = deduplicateByTitle(snap.docs)
        pushStats()
      },
      (err) => {
        console.warn('[Dashboard] draft-chapters listener error:', err)
      }
    )

    return () => {
      unsubBooks()
      unsubAllChapters()
      unsubPublished()
      unsubDrafts()
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
