import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'

export const AdminSidebar: React.FC = () => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const links = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Books', path: '/admin/books' },
    { label: 'New Book', path: '/admin/books/new' },
  ]

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Mobile toggle button */}
      <div className="md:hidden p-4 border-b-3 border-ink flex items-center justify-between" style={{ backgroundColor: '#D8D0C2' }}>
        <span className="font-bangers text-xl tracking-comic text-ink">Admin Navigation</span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="border-2 border-ink px-3 py-1 font-bangers text-sm shadow-hard-sm text-bone"
          style={{ backgroundColor: '#6A7657' }}
        >
          {isOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Sidebar container */}
      <aside
        className={clsx(
          'w-64 border-r-3 border-ink flex flex-col shrink-0 min-h-[calc(100vh-4rem)]',
          isOpen ? 'block' : 'hidden md:flex'
        )}
        style={{ backgroundColor: '#EDE8DF' }}
      >
        <div className="p-4 border-b-3 border-ink" style={{ backgroundColor: '#233126' }}>
          <h2 className="font-bangers text-2xl tracking-comic text-bone">
            WRITING DESK
          </h2>
          <p className="font-grotesk text-xs text-bone/70 font-bold">
            Author Administration
          </p>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {links.map((link) => {
            const active = isActive(link.path)
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  'block px-4 py-3 font-bangers text-lg tracking-comic border-2 border-ink transition-all',
                  active
                    ? 'text-bone shadow-hard translate-x-1'
                    : 'text-ink shadow-hard-sm hover:translate-x-0.5'
                )}
                style={active
                  ? { backgroundColor: '#6A7657' }
                  : { backgroundColor: '#D8D0C2' }
                }
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t-3 border-ink" style={{ backgroundColor: '#D8D0C2' }}>
          <Link
            to="/"
            className="flex items-center justify-center w-full py-2 border-2 border-ink font-bangers text-sm text-ink shadow-hard-sm hover:opacity-80 transition-opacity"
            style={{ backgroundColor: '#C4B9A8' }}
          >
            ← View Live Reader Site
          </Link>
        </div>
      </aside>
    </>
  )
}
