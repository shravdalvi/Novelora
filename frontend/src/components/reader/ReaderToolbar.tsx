import React from 'react'
import { Link } from 'react-router-dom'
import { useReaderSettings } from '../../context/ReaderSettingsContext'

export interface ReaderToolbarProps {
  onToggleDrawer?: () => void
  onToggleBookmark?: () => void
  isBookmarked?: boolean
  editUrl?: string
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  onToggleDrawer,
  onToggleBookmark,
  isBookmarked = false,
  editUrl,
}) => {
  const { theme, font, fontSize, setTheme, setFont, setFontSize } = useReaderSettings()

  return (
    <aside
      aria-label="Reader Controls"
      className="fixed z-40 right-2 sm:right-5 top-1/2 -translate-y-1/2 border-3 border-ink shadow-hard py-2.5 px-1.5 sm:px-2 flex flex-col items-center gap-1.5 select-none"
      style={{ backgroundColor: '#EDE8DF' }}
    >
      {/* Font Size increase */}
      <button
        type="button"
        title="Increase font size"
        onClick={() => setFontSize((s) => Math.min(24, s + 2))}
        className="w-8 h-8 flex items-center justify-center border-2 border-ink text-ink font-grotesk font-bold text-xs shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 hover:opacity-80 transition-opacity"
        style={{ backgroundColor: '#C4B9A8' }}
      >
        A+
      </button>

      {/* Font Size indicator */}
      <span className="text-[11px] font-grotesk font-bold text-center text-ink leading-none">
        {fontSize}
      </span>

      {/* Font Size decrease */}
      <button
        type="button"
        title="Decrease font size"
        onClick={() => setFontSize((s) => Math.max(14, s - 2))}
        className="w-8 h-8 flex items-center justify-center border-2 border-ink text-ink font-grotesk font-bold text-xs shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 hover:opacity-80 transition-opacity"
        style={{ backgroundColor: '#C4B9A8' }}
      >
        A-
      </button>

      <div className="w-5 h-[2px] bg-ink my-0.5" />

      {/* Font Family Toggle */}
      <button
        type="button"
        title={`Switch to ${font === 'serif' ? 'Sans-serif' : 'Serif'} font`}
        onClick={() => setFont(font === 'serif' ? 'sans' : 'serif')}
        className="w-8 h-8 flex items-center justify-center border-2 border-ink text-ink font-grotesk font-bold text-[10px] shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 hover:opacity-80 transition-opacity uppercase"
        style={{ backgroundColor: '#C4B9A8' }}
      >
        {font === 'serif' ? 'Ser' : 'San'}
      </button>

      <div className="w-5 h-[2px] bg-ink my-0.5" />

      {/* Theme Toggles (P, S, D stacked vertically) */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          title="Bone/Paper theme"
          onClick={() => setTheme('paper')}
          className="w-7 h-7 flex items-center justify-center border-2 border-ink font-grotesk font-bold text-xs transition-transform text-ink"
          style={{
            backgroundColor: theme === 'paper' ? '#6A7657' : '#D8D0C2',
            color: theme === 'paper' ? '#D8D0C2' : '#1A1A1A',
            transform: theme === 'paper' ? 'scale(1.08)' : 'scale(1)',
          }}
        >
          P
        </button>
        <button
          type="button"
          title="Sand/Sepia theme"
          onClick={() => setTheme('sepia')}
          className="w-7 h-7 flex items-center justify-center border-2 border-ink font-grotesk font-bold text-xs transition-transform text-ink"
          style={{
            backgroundColor: theme === 'sepia' ? '#6A7657' : '#C4B9A8',
            color: theme === 'sepia' ? '#D8D0C2' : '#1A1A1A',
            transform: theme === 'sepia' ? 'scale(1.08)' : 'scale(1)',
          }}
        >
          S
        </button>
        <button
          type="button"
          title="Dark/Night theme"
          onClick={() => setTheme('dark')}
          className="w-7 h-7 flex items-center justify-center border-2 border-ink font-grotesk font-bold text-xs transition-transform"
          style={{
            backgroundColor: theme === 'dark' ? '#6A7657' : '#1A1A1A',
            color: '#D8D0C2',
            transform: theme === 'dark' ? 'scale(1.08)' : 'scale(1)',
          }}
        >
          D
        </button>
      </div>

      <div className="w-5 h-[2px] bg-ink my-0.5" />

      {/* Bookmark button */}
      {onToggleBookmark && (
        <button
          type="button"
          title={isBookmarked ? 'Bookmarked' : 'Add to Bookmarks'}
          onClick={onToggleBookmark}
          className="w-8 h-8 flex items-center justify-center border-2 border-ink font-bold text-sm shadow-hard-sm transition-colors"
          style={{
            backgroundColor: isBookmarked ? '#8C603E' : '#C4B9A8',
            color: isBookmarked ? '#D8D0C2' : '#1A1A1A',
          }}
        >
          {isBookmarked ? '★' : '☆'}
        </button>
      )}

      {/* Drawer Toggle */}
      {onToggleDrawer && (
        <button
          type="button"
          title="Chapter list"
          onClick={onToggleDrawer}
          className="w-8 h-8 flex items-center justify-center border-2 border-ink font-bold text-base shadow-hard-sm hover:opacity-80 transition-opacity text-bone"
          style={{ backgroundColor: '#233126' }}
        >
          ☰
        </button>
      )}

      {/* Just One Author Edit Button */}
      {editUrl && (
        <>
          <div className="w-5 h-[2px] bg-ink my-0.5" />
          <Link
            to={editUrl}
            title="Edit this chapter in writing studio"
            className="w-8 h-10 flex flex-col items-center justify-center border-2 border-ink font-bangers text-[10px] leading-tight shadow-hard-sm hover:bg-parchment transition-all bg-sage text-ink text-center pt-0.5"
          >
            <span className="text-xs">✏️</span>
            <span>EDIT</span>
          </Link>
        </>
      )}
    </aside>
  )
}
