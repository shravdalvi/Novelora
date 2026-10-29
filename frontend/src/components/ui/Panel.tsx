import React from 'react'
import clsx from 'clsx'

export interface PanelProps {
  children: React.ReactNode
  title?: string
  className?: string
  badge?: string
}

export const Panel: React.FC<PanelProps> = ({
  children,
  title,
  badge,
  className,
}) => {
  return (
    <div
      className={clsx(
        'relative bg-parchment border-3 border-ink shadow-hard overflow-hidden',
        className
      )}
    >
      {(title || badge) && (
        <div className="flex items-center justify-between border-b-3 border-ink px-4 py-2" style={{ backgroundColor: '#233126', color: '#D8D0C2' }}>
          {title && (
            <h3 className="font-bangers text-xl tracking-comic uppercase" style={{ color: '#D8D0C2' }}>
              {title}
            </h3>
          )}
          {badge && (
            <span className="text-xs font-bangers uppercase px-2 py-0.5 border-2 border-ink shadow-hard-sm" style={{ backgroundColor: '#8C603E', color: '#D8D0C2' }}>
              {badge}
            </span>
          )}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}
