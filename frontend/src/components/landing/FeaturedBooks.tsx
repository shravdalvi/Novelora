import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { subscribeToFeaturedBooks } from '../../services/bookService'
import { BookCard } from '../book/BookCard'
import { Skeleton } from '../ui/Skeleton'
import type { Book } from '../../types'

export const FeaturedBooks: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToFeaturedBooks((data) => {
      setBooks(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title Caption Box */}
      <div className="flex items-center justify-between mb-8">
        <div className="inline-block border-3 border-ink px-4 py-2 shadow-hard" style={{ backgroundColor: '#8C603E' }}>
          <h2 className="font-bangers text-3xl sm:text-4xl tracking-comic uppercase" style={{ color: '#D8D0C2' }}>
            FEATURED STORIES
          </h2>
        </div>
        <Link
          to="/library"
          className="font-bangers text-xl tracking-comic text-ink hover:opacity-70 underline decoration-cedar decoration-4 transition-opacity"
        >
          VIEW ALL STORIES →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        /* Fallback when no books are seeded yet */
        <div className="border-3 border-ink p-8 text-center shadow-hard" style={{ backgroundColor: '#C4B9A8' }}>
          <h3 className="font-bangers text-2xl tracking-comic text-ink mb-1">
            ORIGINAL STORIES COMING SOON
          </h3>
          <p className="font-grotesk text-sm text-ink/70 max-w-md mx-auto mb-4">
            The author is currently publishing stories. Check back in a moment or visit the library.
          </p>
          <Link
            to="/library"
            className="inline-block px-4 py-2 border-2 border-ink font-bangers tracking-comic text-sm shadow-hard-sm"
            style={{ backgroundColor: '#233126', color: '#D8D0C2' }}
          >
            BROWSE LIBRARY
          </Link>
        </div>
      )}
    </section>
  )
}
