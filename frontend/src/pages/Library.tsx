import React, { useState, useEffect } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GenreFilter } from '../components/book/GenreFilter'
import { BookGrid } from '../components/book/BookGrid'
import { Input } from '../components/ui/Input'
import { subscribeToPublishedBooks, searchBooks } from '../services/bookService'
import { useDebounce } from '../hooks/useDebounce'
import type { Book } from '../types'

export const Library: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)

  useEffect(() => {
    setLoading(true)
    if (debouncedSearch.trim()) {
      searchBooks(debouncedSearch)
        .then((results) => {
          if (selectedGenre !== 'All') {
            setBooks(
              results.filter((b) =>
                b.genres?.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
              )
            )
          } else {
            setBooks(results)
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
      return
    }

    const unsubscribe = subscribeToPublishedBooks((fetched) => {
      setBooks(fetched)
      setLoading(false)
    }, selectedGenre)

    return () => unsubscribe()
  }, [selectedGenre, debouncedSearch])

  return (
    <PageWrapper title="Library">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="border-b-3 border-ink pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-block bg-sage border-3 border-ink px-3 py-1 shadow-hard-sm mb-2">
              <span className="font-bangers text-sm tracking-comic text-ink">
                THE NOVELORA ARCHIVES
              </span>
            </div>
            <h1 className="font-bangers text-4xl sm:text-5xl tracking-comic text-ink">
              ALL STORIES & SERIALS
            </h1>
          </div>

          {/* Search Bar */}
          <div className="w-full md:w-80">
            <Input
              type="search"
              placeholder="Search by title, tag, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-parchment"
            />
          </div>
        </div>

        {/* Genre Filters */}
        <div className="space-y-2">
          <span className="font-bangers text-sm text-ink uppercase tracking-comic">
            Filter by Genre:
          </span>
          <GenreFilter
            selectedGenre={selectedGenre}
            onSelect={(genre) => setSelectedGenre(genre)}
          />
        </div>

        {/* Books Grid */}
        <BookGrid
          books={books}
          loading={loading}
          emptyMessage="No stories match your filter."
        />
      </div>
    </PageWrapper>
  )
}

export default Library
