import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { subscribeNewsletter } from '../../services/functionsService'
import { toast } from '../ui/Toast'

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setLoading(true)
      await subscribeNewsletter(email.trim())
      toast.success('Subscribed! You will receive updates on new chapters.')
      setEmail('')
    } catch (err: any) {
      toast.success('Subscribed! Welcome to Novelora.')
      setEmail('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer
      style={{ backgroundColor: '#C4B9A8', color: '#1A1A1A' }}
      className="border-t-3 border-ink pt-12 pb-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10"
          style={{ borderBottom: '2px solid rgba(26, 26, 26, 0.2)' }}
        >
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <div
              className="inline-block border-3 border-ink px-3 py-1 shadow-hard-sm"
              style={{ backgroundColor: '#4A1A23' }}
            >
              <span className="font-bangers text-2xl tracking-comic" style={{ color: '#D8D0C2' }}>
                NOVELORA
              </span>
            </div>
            <p className="font-grotesk text-sm" style={{ color: '#1A1A1A', opacity: 0.85 }}>
              Stories, panel by panel. Dive into serialized fantasy, manga-style fiction, and original epics.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 border-2 border-ink flex items-center justify-center transition-all hover:-translate-y-0.5 shadow-hard-sm"
                style={{
                  backgroundColor: '#EDE8DF',
                  color: '#1A1A1A',
                }}
                aria-label="Twitter / X"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" style={{ color: '#1A1A1A' }}>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 border-2 border-ink flex items-center justify-center transition-all hover:-translate-y-0.5 shadow-hard-sm"
                style={{
                  backgroundColor: '#EDE8DF',
                  color: '#1A1A1A',
                }}
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" style={{ color: '#1A1A1A' }}>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://wattpad.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 border-2 border-ink flex items-center justify-center font-bangers text-sm transition-all hover:-translate-y-0.5 shadow-hard-sm"
                style={{
                  backgroundColor: '#EDE8DF',
                  color: '#1A1A1A',
                }}
                aria-label="Wattpad"
              >
                W
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="font-bangers text-xl tracking-comic mb-3" style={{ color: '#1A1A1A' }}>
              EXPLORE
            </h4>
            <ul className="space-y-2 font-grotesk text-sm">
              <li>
                <Link to="/" className="hover:underline transition-all" style={{ color: '#1A1A1A', opacity: 0.85 }}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/library" className="hover:underline transition-all" style={{ color: '#1A1A1A', opacity: 0.85 }}>
                  Library
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:underline transition-all" style={{ color: '#1A1A1A', opacity: 0.85 }}>
                  About
                </Link>
              </li>
              <li>
                <Link to="/bookshelf" className="hover:underline transition-all" style={{ color: '#1A1A1A', opacity: 0.85 }}>
                  My Bookshelf
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Account Links */}
          <div>
            <h4 className="font-bangers text-xl tracking-comic mb-3" style={{ color: '#1A1A1A' }}>
              ACCOUNT
            </h4>
            <ul className="space-y-2 font-grotesk text-sm">
              <li>
                <Link to="/login" className="hover:underline transition-all" style={{ color: '#1A1A1A', opacity: 0.85 }}>
                  Log In
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:underline transition-all" style={{ color: '#1A1A1A', opacity: 0.85 }}>
                  Sign Up Free
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:underline transition-all" style={{ color: '#1A1A1A', opacity: 0.85 }}>
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div>
            <h4 className="font-bangers text-xl tracking-comic mb-3" style={{ color: '#1A1A1A' }}>
              STAY UPDATED
            </h4>
            <p className="font-grotesk text-xs mb-3" style={{ color: '#1A1A1A', opacity: 0.85 }}>
              Get notified when new chapters drop. No spam.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="your.email@novelora.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 font-grotesk text-sm border-2 border-ink focus:outline-none focus:ring-2 focus:ring-sage placeholder:text-ink/50 shadow-hard-sm"
                style={{
                  backgroundColor: '#EDE8DF',
                  color: '#1A1A1A',
                }}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full font-bangers text-base tracking-comic py-2 border-2 border-ink transition-all cursor-pointer disabled:opacity-60 shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5"
                style={{
                  backgroundColor: '#8C603E',
                  color: '#FFFFFF',
                }}
              >
                {loading ? 'Subscribing...' : 'SUBSCRIBE'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 text-center text-xs font-grotesk" style={{ color: '#1A1A1A', opacity: 0.75 }}>
          <p>© 2026 Novelora. Written by Shravani. All stories are original works.</p>
        </div>
      </div>
    </footer>
  )
}
