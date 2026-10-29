import React from 'react'
import clsx from 'clsx'

export type SkeletonVariant = 'text' | 'card' | 'cover' | 'circle' | 'button'

export interface SkeletonProps {
  variant?: SkeletonVariant
  className?: string
  lines?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  className,
  lines = 3,
}) => {
  const baseShimmer =
    'animate-pulse bg-ink/10 border-2 border-ink/20 rounded-none'

  if (variant === 'text') {
    return (
      <div className={clsx('space-y-2.5 w-full', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              baseShimmer,
              'h-4',
              i === lines - 1 ? 'w-3/5' : 'w-full'
            )}
          />
        ))}
      </div>
    )
  }

  if (variant === 'cover') {
    return (
      <div
        className={clsx(
          baseShimmer,
          'aspect-[2/3] w-full border-3 border-ink shadow-hard-sm',
          className
        )}
      />
    )
  }

  if (variant === 'circle') {
    return (
      <div
        className={clsx(
          baseShimmer,
          'w-10 h-10 rounded-full border-2 border-ink',
          className
        )}
      />
    )
  }

  if (variant === 'button') {
    return (
      <div
        className={clsx(
          baseShimmer,
          'h-11 w-32 border-3 border-ink shadow-hard-sm',
          className
        )}
      />
    )
  }

  // 'card' variant
  return (
    <div
      className={clsx(
        'bg-bone border-3 border-ink shadow-hard p-4 space-y-4',
        className
      )}
    >
      <div className={clsx(baseShimmer, 'aspect-[2/3] w-full')} />
      <div className={clsx(baseShimmer, 'h-6 w-3/4')} />
      <div className="space-y-2">
        <div className={clsx(baseShimmer, 'h-3.5 w-full')} />
        <div className={clsx(baseShimmer, 'h-3.5 w-4/5')} />
      </div>
    </div>
  )
}
