import React from 'react'
import clsx from 'clsx'

export interface ChipProps {
  label: string
  selected?: boolean
  onClick?: () => void
  className?: string
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onClick,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center justify-center px-3.5 py-1 text-sm font-grotesk font-bold border-2 border-ink shadow-hard-sm transition-all duration-100 cursor-pointer select-none active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
        selected
          ? 'bg-sage text-bone'
          : 'bg-bone text-ink hover:bg-sage/30',
        className
      )}
    >
      {label}
    </button>
  )
}
