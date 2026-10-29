import React from 'react'
import clsx from 'clsx'

export type BadgeVariant =
  | 'yellow'
  | 'mint'
  | 'red'
  | 'blue'
  | 'pink'
  | 'aurora-blue'
  | 'aurora-mint'
  | 'aurora-lavender'
  | 'deep-sky'
  | 'aurora-pink'
  | 'coral'

export interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'aurora-blue',
  className,
}) => {
  const variantColors: Record<BadgeVariant, { bg: string; color: string }> = {
    yellow: { bg: '#8C603E', color: '#D8D0C2' },
    mint: { bg: '#6A7657', color: '#D8D0C2' },
    red: { bg: '#4A1A23', color: '#D8D0C2' },
    blue: { bg: '#233126', color: '#D8D0C2' },
    pink: { bg: '#8C603E', color: '#D8D0C2' },
    'aurora-blue': { bg: '#6A7657', color: '#D8D0C2' },
    'aurora-mint': { bg: '#6A7657', color: '#D8D0C2' },
    'aurora-lavender': { bg: '#8C603E', color: '#D8D0C2' },
    'deep-sky': { bg: '#233126', color: '#D8D0C2' },
    'aurora-pink': { bg: '#4A1A23', color: '#D8D0C2' },
    coral: { bg: '#8C603E', color: '#D8D0C2' },
  }

  return (
    <span
      style={{
        backgroundColor: variantColors[variant].bg,
        color: variantColors[variant].color,
      }}
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 border-2 border-ink text-xs font-bangers uppercase tracking-wider shadow-hard-sm',
        className
      )}
    >
      {children}
    </span>
  )
}
