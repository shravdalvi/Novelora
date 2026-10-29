import React, { useEffect, useState } from 'react'

export const ReaderProgressBar: React.FC = () => {
  const [scrollPercentage, setScrollPercentage] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight
      if (scrollHeight > 0) {
        const progress = (scrollTop / scrollHeight) * 100
        setScrollPercentage(Math.min(100, Math.max(0, progress)))
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 h-1.5 z-50 bg-ink/20 pointer-events-none">
      <div
        className="h-full bg-cedar/40 transition-all duration-75 ease-out"
        style={{ width: `${scrollPercentage}%` }}
      />
    </div>
  )
}
