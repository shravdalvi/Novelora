import React from 'react'
import clsx from 'clsx'

export interface MarqueeProps {
  items: string[]
  separator?: string
  speed?: number // seconds per cycle
  className?: string
  textColor?: string
  bgColor?: string
}

export const Marquee: React.FC<MarqueeProps> = ({
  items,
  separator = '✦',
  speed = 25,
  className,
  textColor = '#FFFFFF',
  bgColor = '#4A1A23', // Bordeaux
}) => {
  // Double the items array to create seamless loop
  const content = items.map((item, index) => (
    <span key={index} className="inline-flex items-center gap-4 px-4 whitespace-nowrap">
      <span style={{ color: textColor }}>{item}</span>
      <span className="text-sm opacity-90" style={{ color: textColor }}>{separator}</span>
    </span>
  ))

  return (
    <div
      style={{ backgroundColor: bgColor, color: textColor }}
      className={clsx(
        'w-full overflow-hidden select-none py-2.5 font-bangers tracking-wider text-lg border-y-3 border-ink shadow-hard-sm',
        className
      )}
    >
      <div
        className="animate-marquee flex items-center"
        style={{ animationDuration: `${speed}s` }}
      >
        <div className="flex items-center shrink-0">{content}</div>
        <div className="flex items-center shrink-0">{content}</div>
      </div>
    </div>
  )
}
