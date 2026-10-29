import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { AdminSidebar } from '../../components/layout/AdminSidebar'
import { Button } from '../../components/ui/Button'
import { adminGetStats } from '../../services/functionsService'
import { collection, getDocs } from 'firebase/firestore'
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
    async function loadStats() {
      try {
        // Try calling cloud function, fallback to client counts if emulator/local
        try {
          const res = await adminGetStats()
          setStats(res)
        } catch {
          // Local fallback Firestore queries
          const booksSnap = await getDocs(collection(db, 'books'))
          const totalBooks = booksSnap.size
          setStats({
            totalBooks,
            totalChapters: 0,
            totalDrafts: 0,
            totalPublished: totalBooks,
            totalReads: 0,
            recentComments: [],
          })
        }
      } catch (err) {
        console.error('Failed to load stats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const statCards = [
    { label: 'TOTAL BOOKS', value: stats.totalBooks, color: 'bg-sage' },
    { label: 'TOTAL CHAPTERS', value: stats.totalChapters, color: 'bg-deep-sky text-white' },
    { label: 'PUBLISHED RELEASES', value: stats.totalPublished, color: 'bg-cedar/40' },
    { label: 'ACTIVE DRAFTS', value: stats.totalDrafts, color: 'bg-aurora-pink' },
  ]

  return (
    <PageWrapper title="Admin Dashboard">
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
        <AdminSidebar />

        <div className="flex-1 p-6 sm:p-10 space-y-8 bg-bone">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-ink pb-6">
            <div>
              <div className="inline-block bg-sage border-3 border-ink px-3 py-1 shadow-hard-sm mb-2">
                <span className="font-bangers text-sm tracking-comic text-ink">
                  COMMAND CENTER
                </span>
              </div>
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
                className={`border-3 border-ink p-6 shadow-hard ${card.color} flex flex-col justify-between`}
              >
                <span className="font-bangers text-sm sm:text-base tracking-comic text-ink mb-2">
                  {card.label}
                </span>
                <span className="font-bangers text-4xl sm:text-5xl text-ink">
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
