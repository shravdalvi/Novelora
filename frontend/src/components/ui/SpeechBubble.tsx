import React from 'react'
import clsx from 'clsx'

export type SpeechBubbleDirection = 'left' | 'right' | 'bottom' | 'down'

export interface SpeechBubbleProps {
  children: React.ReactNode
  direction?: SpeechBubbleDirection
  className?: string
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  children,
  direction = 'bottom',
  className,
}) => {
  const isBottom = direction === 'bottom' || direction === 'down'

  return (
    <div className={clsx('relative inline-block', className)}>
      <div className="relative z-10 bg-parchment border-3 border-ink p-4 shadow-hard text-ink font-grotesk">
        {children}
      </div>

      {/* Tail based on direction */}
      {isBottom && (
        <div className="relative left-6 -mt-[3px] z-20">
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-ink" />
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-parchment -mt-[14px] ml-[2px]" />
        </div>
      )}

      {direction === 'left' && (
        <div className="absolute top-4 -left-[14px] z-20">
          <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[14px] border-r-ink" />
          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[12px] border-r-parchment -mt-[14px] ml-[2px]" />
        </div>
      )}

      {direction === 'right' && (
        <div className="absolute top-4 -right-[14px] z-20">
          <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-ink" />
          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[12px] border-l-parchment -mt-[14px] -ml-[2px]" />
        </div>
      )}
    </div>
  )
}
