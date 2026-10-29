import React from 'react'
import { Chip } from '../ui/Chip'

export const DEFAULT_GENRES = [
  'All',
  'Fantasy',
  'Romance',
  'Thriller',
  'Sci-Fi',
  'Manga-Style',
  'Mystery',
  'Horror',
  'Adventure',
]

export interface GenreFilterProps {
  genres?: string[]
  selectedGenre: string
  onSelect: (genre: string) => void
  className?: string
}

export const GenreFilter: React.FC<GenreFilterProps> = ({
  genres = DEFAULT_GENRES,
  selectedGenre,
  onSelect,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {genres.map((genre) => (
        <Chip
          key={genre}
          label={genre}
          selected={selectedGenre.toLowerCase() === genre.toLowerCase()}
          onClick={() => onSelect(genre)}
        />
      ))}
    </div>
  )
}
