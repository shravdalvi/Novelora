import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export const Navbar: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Library', path: '/library' },
    { name: 'About', path: '/about' },
  ]

  const handleSignOut = async () => {
    await signOut()
    setIsUserMenuOpen(false)
    navigate('/')
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    // Hunter green navbar
    <nav className="sticky top-0 z-50 border-b-3 border-ink shadow-md" style={{ backgroundColor: '#233126' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">

          {/* Logo: Bordeaux box, bone text */}
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <div
                className="border-2 px-3 py-1 group-hover:-translate-y-0.5 transition-all"
                style={{
                  backgroundColor: '#4A1A23',
                  borderColor: '#D8D0C2',
                  boxShadow: '3px 3px 0 #D8D0C2',
                }}
              >
                <span className="font-bangers text-2xl tracking-comic" style={{ color: '#D8D0C2' }}>
                  NOVELORA
                </span>
              </div>
            </Link>
          </div>

          {/* Center nav links */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-bangers text-xl tracking-comic transition-colors ${
                  isActive(link.path)
                    ? 'underline decoration-4 underline-offset-8'
                    : 'hover:opacity-90'
                }`}
                style={{
                  color: isActive(link.path) ? '#D8D0C2' : '#C4B9A8',
                  textDecorationColor: '#6A7657',
                }}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            {isAdmin && (
              <Link to="/admin">
                <span
                  className="inline-flex items-center justify-center font-bangers text-sm uppercase tracking-comic px-3.5 py-1.5 border-2 cursor-pointer transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: '#8C603E',
                    borderColor: '#D8D0C2',
                    color: '#D8D0C2',
                    boxShadow: '2px 2px 0 #D8D0C2',
                  }}
                >
                  Admin Desk
                </span>
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 border-2 px-3 py-1.5 cursor-pointer transition-colors"
                  style={{ borderColor: '#C4B9A8', color: '#D8D0C2', backgroundColor: 'rgba(255,255,255,0.08)' }}
                >
                  <div
                    className="w-7 h-7 rounded-full border flex items-center justify-center font-bangers text-sm"
                    style={{ backgroundColor: '#8C603E', borderColor: '#D8D0C2', color: '#D8D0C2' }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="font-grotesk font-bold text-sm max-w-[120px] truncate" style={{ color: '#D8D0C2' }}>
                    {user.name}
                  </span>
                  <span className="text-xs" style={{ color: '#C4B9A8' }}>▼</span>
                </button>

                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 py-2 z-50 border-2"
                    style={{
                      backgroundColor: '#233126',
                      borderColor: '#D8D0C2',
                      boxShadow: '6px 6px 0 #1A1A1A',
                    }}
                  >
                    <div className="px-4 py-2 mb-1" style={{ borderBottom: '1px solid rgba(216,208,194,0.2)' }}>
                      <p className="font-grotesk font-bold text-sm truncate" style={{ color: '#D8D0C2' }}>{user.name}</p>
                      <p className="font-grotesk text-xs truncate" style={{ color: '#C4B9A8' }}>{user.email}</p>
                      <span
                        className="inline-block mt-1 font-bangers text-xs px-2 py-0.5 border"
                        style={{
                          backgroundColor: isAdmin ? '#4A1A23' : '#6A7657',
                          borderColor: '#D8D0C2',
                          color: '#D8D0C2',
                        }}
                      >
                        {isAdmin ? 'AUTHOR / ADMIN' : 'READER'}
                      </span>
                    </div>

                    {[
                      { to: '/profile', label: 'My Profile' },
                      { to: '/bookshelf', label: 'My Bookshelf' },
                      ...(isAdmin ? [{ to: '/admin', label: 'Admin Desk' }] : []),
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 font-grotesk font-bold text-sm transition-colors"
                        style={{ color: '#D8D0C2' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6A7657')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {item.label}
                      </Link>
                    ))}

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 font-grotesk font-bold text-sm cursor-pointer transition-colors"
                      style={{ color: '#C4847A', borderTop: '1px solid rgba(216,208,194,0.2)' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(74,26,35,0.3)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <span
                    className="inline-flex items-center justify-center font-bangers text-base uppercase tracking-comic px-4 py-1.5 border-2 cursor-pointer transition-opacity hover:opacity-90"
                    style={{ borderColor: '#C4B9A8', color: '#D8D0C2', backgroundColor: 'transparent' }}
                  >
                    Log In
                  </span>
                </Link>
                <Link to="/signup">
                  <span
                    className="inline-flex items-center justify-center font-bangers text-base uppercase tracking-comic px-4 py-1.5 border-2 cursor-pointer transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: '#8C603E',
                      borderColor: '#D8D0C2',
                      color: '#D8D0C2',
                      boxShadow: '2px 2px 0 #D8D0C2',
                    }}
                  >
                    Sign Up
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            {isAdmin && (
              <Link to="/admin">
                <span
                  className="text-xs font-bangers px-2 py-1 border-2"
                  style={{ backgroundColor: '#8C603E', borderColor: '#D8D0C2', color: '#D8D0C2' }}
                >
                  Admin
                </span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 border-2 font-bold cursor-pointer"
              style={{ borderColor: '#C4B9A8', color: '#D8D0C2', backgroundColor: 'rgba(255,255,255,0.08)' }}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 pt-3 pb-5 space-y-3 border-t-2" style={{ backgroundColor: '#233126', borderColor: 'rgba(216,208,194,0.2)' }}>
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-bangers text-xl tracking-comic py-1 transition-colors"
                style={{ color: isActive(link.path) ? '#D8D0C2' : '#C4B9A8' }}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 flex flex-col gap-2" style={{ borderTop: '2px solid rgba(216,208,194,0.2)' }}>
            {user ? (
              <>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}
                  className="font-grotesk font-bold text-sm py-1" style={{ color: '#D8D0C2' }}>
                  My Profile ({user.name})
                </Link>
                <Link to="/bookshelf" onClick={() => setIsMobileMenuOpen(false)}
                  className="font-grotesk font-bold text-sm py-1" style={{ color: '#D8D0C2' }}>
                  My Bookshelf
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}
                    className="font-grotesk font-bold text-sm py-1" style={{ color: '#D8D0C2' }}>
                    Admin Desk
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => { handleSignOut(); setIsMobileMenuOpen(false) }}
                  className="text-left font-grotesk font-bold text-sm py-1 cursor-pointer"
                  style={{ color: '#C4847A' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex-1">
                  <span className="w-full inline-flex items-center justify-center font-bangers text-base uppercase tracking-comic py-2 border-2 cursor-pointer"
                    style={{ borderColor: '#C4B9A8', color: '#D8D0C2', backgroundColor: 'transparent' }}>
                    Log In
                  </span>
                </Link>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="flex-1">
                  <span className="w-full inline-flex items-center justify-center font-bangers text-base uppercase tracking-comic py-2 border-2 cursor-pointer"
                    style={{ backgroundColor: '#8C603E', borderColor: '#D8D0C2', color: '#D8D0C2' }}>
                    Sign Up
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
