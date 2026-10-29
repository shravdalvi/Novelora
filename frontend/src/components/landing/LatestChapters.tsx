import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { subscribeToLatestChapters } from '../../services/bookService'
import { formatDate } from '../../utils/formatDate'
import { Skeleton } from '../ui/Skeleton'
import type { Chapter } from '../../types'

export const LatestChapters: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToLatestChapters((data) => {
      setChapters(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  return (
    <section className="py-16 border-y-3 border-ink" style={{ backgroundColor: '#C4B9A8' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="inline-block border-3 border-ink px-4 py-2 shadow-hard" style={{ backgroundColor: '#4A1A23' }}>
            <h2 className="font-bangers text-3xl sm:text-4xl tracking-comic uppercase" style={{ color: '#D8D0C2' }}>
              LATEST RELEASES
            </h2>
          </div>
          <span className="font-grotesk text-sm font-bold text-ink/60">
            Updated frequently
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton variant="text" lines={4} />
          </div>
        ) : chapters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chapters.map((ch) => (
              <div
                key={ch.id}
                className="flex items-center justify-between p-4 border-3 border-ink shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard transition-all"
                style={{ backgroundColor: '#EDE8DF' }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bangers text-xs px-2 py-0.5 border border-ink shadow-hard-sm" style={{ backgroundColor: '#8C603E', color: '#D8D0C2' }}>
                    NEW!
                  </span>
                  <div>
                    <h4 className="font-bangers text-xl tracking-comic text-ink">
                      Ch. {ch.chapterNumber}: {ch.title}
                    </h4>
                    <span className="text-xs font-grotesk text-ink/60">
                      {formatDate(ch.updatedAt || ch.createdAt)}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/read/${ch.bookId}/${ch.chapterNumber}`}
                  className="px-3 py-1.5 border-2 border-ink font-bangers text-sm shadow-hard-sm hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: '#233126', color: '#D8D0C2' }}
                >
                  READ →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-ink/30 text-center" style={{ backgroundColor: '#EDE8DF' }}>
            <p className="font-bangers text-xl text-ink/60">
              New chapters will appear here as they are published!
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
