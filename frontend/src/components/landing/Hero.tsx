import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { HeroBookShowcase } from './HeroBookShowcase'
import { useAuth } from '../../hooks/useAuth'

export const Hero: React.FC = () => {
  const { user } = useAuth()

  return (
    <section className="relative overflow-hidden border-b-3 border-ink pb-16 lg:pb-24" style={{ backgroundColor: '#D8D0C2' }}>
      {/* Subtle halftone background overlay */}
      <div className="halftone absolute inset-0 pointer-events-none" />

      {/* Top Header on Landing Page (since main Navbar is hidden) */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6 flex items-center justify-between border-b-2 border-ink/10 mb-10">
        <Link to="/" className="flex items-center gap-2 group">
          <div
            className="border-3 border-ink px-3.5 py-1 shadow-hard-sm group-hover:-translate-y-0.5 group-hover:shadow-hard transition-all"
            style={{ backgroundColor: '#4A1A23' }}
          >
            <span className="font-bangers text-2xl sm:text-3xl tracking-comic" style={{ color: '#D8D0C2' }}>
              NOVELORA
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/library">
              <Button variant="primary" size="sm">
                ENTER LIBRARY DASHBOARD →
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="secondary" size="sm">
                  LOG IN
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">
                  SIGN UP FREE
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-block border-3 border-ink px-3 py-1 shadow-hard-sm" style={{ backgroundColor: '#8C603E' }}>
              <span className="font-bangers text-base tracking-comic" style={{ color: '#D8D0C2' }}>
                ★ SERIALIZED ORIGINAL NOVELS & STORIES ★
              </span>
            </div>

            <h1 className="font-bangers text-5xl sm:text-6xl md:text-7xl tracking-comic text-ink leading-[0.95]">
              WELCOME TO <span className="underline decoration-ink" style={{ color: '#233126' }}>NOVELORA.</span>
            </h1>

            <p className="font-grotesk text-lg sm:text-xl text-ink/90 font-medium max-w-xl leading-relaxed">
              Read my original novels and manga-style serials, released chapter by chapter. Fast-paced fantasy, deep mysteries, and action-packed arcs.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/library">
                <Button variant="primary" size="lg">
                  START READING →
                </Button>
              </Link>
              <Link to="/library">
                <Button variant="secondary" size="lg">
                  BROWSE LIBRARY
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Real-Time Flipping / Sliding Book Showcase */}
          <div className="lg:col-span-5 relative flex justify-center">
            <HeroBookShowcase />
          </div>
        </div>
      </div>
    </section>
  )
}
