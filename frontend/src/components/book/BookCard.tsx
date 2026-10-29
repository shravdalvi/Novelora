import React from 'react'
import { Link } from 'react-router-dom'
import type { Book } from '../../types'
import { Badge } from '../ui/Badge'

export interface BookCardProps {
  book: Book
  isAdmin?: boolean
}

export const BookCard: React.FC<BookCardProps> = ({ book, isAdmin = false }) => {
  const isCompleted = book.status === 'completed'

  return (
    <div className="relative group border-3 border-ink shadow-hard transition-all duration-150 hover:-translate-y-1 hover:shadow-hard-lg flex flex-col h-full overflow-hidden" style={{ backgroundColor: '#EDE8DF' }}>
      {/* Admin Quick Action Button */}
      {isAdmin && (
        <div className="absolute top-2 right-2 z-20">
          <Link
            to={`/admin/books/${book.id}/edit`}
            className="px-2.5 py-1 border-2 border-ink font-bangers text-xs shadow-hard-sm hover:opacity-80 transition-opacity"
            style={{ backgroundColor: '#6A7657', color: '#D8D0C2' }}
          >
            EDIT
          </Link>
        </div>
      )}

      {/* Cover Image */}
      <Link to={`/book/${book.slug}`} className="block relative aspect-[2/3] overflow-hidden border-b-3 border-ink" style={{ backgroundColor: '#C4B9A8' }}>
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: '#D8D0C2' }}>
            <span className="font-bangers text-2xl tracking-comic text-ink leading-tight">
              {book.title}
            </span>
          </div>
        )}

        {/* Status Badge overlay */}
        <div className="absolute bottom-2 left-2">
          <Badge variant={isCompleted ? 'mint' : 'yellow'}>
            {isCompleted ? 'COMPLETED' : 'ONGOING'}
          </Badge>
        </div>

        {/* Chapter count pill */}
        <div className="absolute bottom-2 right-2 bg-ink font-bangers text-xs px-2 py-0.5 border border-bone/50" style={{ color: '#D8D0C2' }}>
          {book.chapterCount || 0} CHS
        </div>
      </Link>

      {/* Card Info */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <Link to={`/book/${book.slug}`}>
            <h3 className="font-bangers text-2xl tracking-comic text-ink line-clamp-1 hover:opacity-70 transition-opacity">
              {book.title}
            </h3>
          </Link>
          <p className="font-grotesk text-xs text-ink/60 line-clamp-2 mt-1">
            {book.description || 'No description provided.'}
          </p>
        </div>

        {/* Genres row */}
        {book.genres && book.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {book.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="text-[11px] font-grotesk font-bold border border-ink px-2 py-0.5 text-ink"
                style={{ backgroundColor: '#C4B9A8' }}
              >
                {genre}
              </span>
            ))}
            {book.genres.length > 3 && (
              <span className="text-[11px] font-grotesk font-bold text-ink/50 self-center">
                +{book.genres.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
