import React from 'react'
import clsx from 'clsx'

export interface ProgressBarProps {
  value: number // 0 to 100
  color?: string // Tailwind bg class e.g. 'bg-sage'
  height?: string
  className?: string
  showLabel?: boolean
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'bg-sage',
  height = 'h-2',
  className,
  showLabel = false,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs font-grotesk font-bold text-ink mb-1">
          <span>Progress</span>
          <span>{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div className={clsx('w-full bg-sand border-2 border-ink overflow-hidden', height)}>
        <div
          className={clsx(color, 'h-full transition-all duration-150 ease-out')}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  )
}
