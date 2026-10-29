import React from 'react'
import { useReaderSettings } from '../../context/ReaderSettingsContext'

export interface ReaderToolbarProps {
  onToggleDrawer?: () => void
  onToggleBookmark?: () => void
  isBookmarked?: boolean
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  onToggleDrawer,
  onToggleBookmark,
  isBookmarked = false,
}) => {
  const { theme, font, fontSize, setTheme, setFont, setFontSize } = useReaderSettings()

  return (
    <aside
      aria-label="Reader Controls"
      className="fixed z-40 bottom-4 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:top-24 md:right-6 md:bottom-auto border-3 border-ink shadow-hard px-3 py-2 flex items-center gap-2 select-none"
      style={{ backgroundColor: '#EDE8DF' }}
    >
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

      {/* Font Size indicator */}
      <span className="text-xs font-grotesk font-bold px-1 min-w-[20px] text-center text-ink">
        {fontSize}
      </span>

      {/* Font Size increase */}
      <button
        type="button"
        title="Increase font size"
        onClick={() => setFontSize((s) => Math.min(24, s + 2))}
        className="w-8 h-8 flex items-center justify-center border-2 border-ink text-ink font-grotesk font-bold text-sm shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 hover:opacity-80 transition-opacity"
        style={{ backgroundColor: '#C4B9A8' }}
      >
        A+
      </button>

      <div className="w-[2px] h-6 bg-ink mx-1" />

      {/* Font Family Toggle */}
      <button
        type="button"
        title={`Switch to ${font === 'serif' ? 'Sans-serif' : 'Serif'} font`}
        onClick={() => setFont(font === 'serif' ? 'sans' : 'serif')}
        className="px-2.5 h-8 flex items-center justify-center border-2 border-ink text-ink font-grotesk font-bold text-xs shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 hover:opacity-80 transition-opacity"
        style={{ backgroundColor: '#C4B9A8' }}
      >
        {font === 'serif' ? 'Serif' : 'Sans'}
      </button>

      <div className="w-[2px] h-6 bg-ink mx-1" />

      {/* Theme Toggles */}
      <div className="flex items-center gap-1 font-grotesk font-bold text-xs">
        <button
          type="button"
          title="Bone/Paper theme"
          onClick={() => setTheme('paper')}
          className="w-7 h-7 flex items-center justify-center border-2 border-ink transition-transform text-ink"
          style={{
            backgroundColor: theme === 'paper' ? '#6A7657' : '#D8D0C2',
            color: theme === 'paper' ? '#D8D0C2' : '#1A1A1A',
            transform: theme === 'paper' ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          P
        </button>
        <button
          type="button"
          title="Sand theme"
          onClick={() => setTheme('sepia')}
          className="w-7 h-7 flex items-center justify-center border-2 border-ink transition-transform text-ink"
          style={{
            backgroundColor: theme === 'sepia' ? '#6A7657' : '#C4B9A8',
            color: theme === 'sepia' ? '#D8D0C2' : '#1A1A1A',
            transform: theme === 'sepia' ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          S
        </button>
        <button
          type="button"
          title="Dark/Night theme"
          onClick={() => setTheme('dark')}
          className="w-7 h-7 flex items-center justify-center border-2 border-ink transition-transform"
          style={{
            backgroundColor: theme === 'dark' ? '#6A7657' : '#1A1A1A',
            color: '#D8D0C2',
            transform: theme === 'dark' ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          D
        </button>
      </div>

      <div className="w-[2px] h-6 bg-ink mx-1" />

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
    </aside>
  )
}
