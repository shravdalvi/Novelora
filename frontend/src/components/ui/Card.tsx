import React from 'react'
import clsx from 'clsx'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hoverable?: boolean
  className?: string
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-parchment border-3 border-ink shadow-hard rounded-none transition-all duration-150',
        hoverable && 'hover:-translate-x-1 hover:-translate-y-1 hover:shadow-hard-lg cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
