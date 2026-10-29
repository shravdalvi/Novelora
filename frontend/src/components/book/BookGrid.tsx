import React from 'react'
import type { Book } from '../../types'
import { BookCard } from './BookCard'
import { Skeleton } from '../ui/Skeleton'

export interface BookGridProps {
  books: Book[]
  isAdmin?: boolean
  loading?: boolean
  emptyMessage?: string
}

export const BookGrid: React.FC<BookGridProps> = ({
  books,
  isAdmin = false,
  loading = false,
  emptyMessage = 'No books found.',
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="border-3 border-ink p-12 text-center shadow-hard my-6" style={{ backgroundColor: '#EDE8DF' }}>
        <h3 className="font-bangers text-2xl tracking-comic text-ink mb-1">
          {emptyMessage}
        </h3>
        <p className="font-grotesk text-sm text-ink/60">
          Check back soon or explore other categories!
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} isAdmin={isAdmin} />
      ))}
    </div>
  )
}
