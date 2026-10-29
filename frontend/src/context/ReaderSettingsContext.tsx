import React, { createContext, useContext, useState, ReactNode } from 'react'
import type { ReaderFont, ReaderSettings, ReaderTheme } from '../types'

interface ReaderSettingsContextType extends ReaderSettings {
  setTheme: (theme: ReaderTheme) => void
  setFont: (font: ReaderFont) => void
  setFontSize: (size: number | ((prev: number) => number)) => void
}

const ReaderSettingsContext = createContext<ReaderSettingsContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'novelora_reader_theme'
const FONT_STORAGE_KEY = 'novelora_reader_font'
const FONT_SIZE_STORAGE_KEY = 'novelora_reader_fontsize'

export const ReaderSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ReaderTheme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'paper' || saved === 'sepia' || saved === 'dark') {
      return saved
    }
    return 'paper'
  })

  const [font, setFontState] = useState<ReaderFont>(() => {
    const saved = localStorage.getItem(FONT_STORAGE_KEY)
    if (saved === 'serif' || saved === 'sans') {
      return saved
    }
    return 'serif'
  })

  const [fontSize, setFontSizeState] = useState<number>(() => {
    const saved = localStorage.getItem(FONT_SIZE_STORAGE_KEY)
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed) && parsed >= 14 && parsed <= 24) {
        return parsed
      }
    }
    return 18
  })

  const setTheme = (newTheme: ReaderTheme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }

  const setFont = (newFont: ReaderFont) => {
    setFontState(newFont)
    localStorage.setItem(FONT_STORAGE_KEY, newFont)
  }

  const setFontSize = (sizeOrUpdater: number | ((prev: number) => number)) => {
    setFontSizeState((prev) => {
      const next = typeof sizeOrUpdater === 'function' ? sizeOrUpdater(prev) : sizeOrUpdater
      const clamped = Math.min(24, Math.max(14, next))
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, clamped.toString())
      return clamped
    })
  }

  return (
    <ReaderSettingsContext.Provider
      value={{
        theme,
        font,
        fontSize,
        setTheme,
        setFont,
        setFontSize,
      }}
    >
      {children}
    </ReaderSettingsContext.Provider>
  )
}

export function useReaderSettings(): ReaderSettingsContextType {
  const context = useContext(ReaderSettingsContext)
  if (!context) {
    throw new Error('useReaderSettings must be used within a ReaderSettingsProvider')
  }
  return context
}
