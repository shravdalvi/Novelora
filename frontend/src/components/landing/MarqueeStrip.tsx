import React from 'react'
import { Marquee } from '../ui/Marquee'

export const MarqueeStrip: React.FC = () => {
  const genres = [
    'FANTASY',
    'ROMANCE',
    'THRILLER',
    'MANGA-STYLE',
    'SCI-FI',
    'MYSTERY',
    'HORROR',
    'ADVENTURE',
    'ACTION',
    'SUPERNATURAL',
  ]

  return (
    <Marquee
      items={genres}
      separator="✦"
      speed={30}
      bgColor="#4A1A23"
      textColor="#FFFFFF"
    />
  )
}
