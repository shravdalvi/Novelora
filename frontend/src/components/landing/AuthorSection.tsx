import React from 'react'
import { SpeechBubble } from '../ui/SpeechBubble'

export const AuthorSection: React.FC = () => {
  return (
    <section className="py-16 border-y-3 border-ink overflow-hidden" style={{ backgroundColor: '#EDE8DF' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-block border-3 border-ink px-4 py-2 shadow-hard" style={{ backgroundColor: '#233126' }}>
            <h2 className="font-bangers text-3xl sm:text-4xl tracking-comic uppercase" style={{ color: '#D8D0C2' }}>
              ABOUT THE AUTHOR
            </h2>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
          {/* Author avatar frame */}
          <div className="relative shrink-0">
            <div
              className="w-40 h-40 border-3 border-ink shadow-hard flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: '#233126' }}
            >
              <span className="font-bangers text-7xl" style={{ color: '#D8D0C2' }}>S</span>
            </div>
            <div className="absolute -bottom-3 -right-2 text-xs font-bangers px-2 py-0.5 border-2 border-ink shadow-hard-sm" style={{ backgroundColor: '#4A1A23', color: '#D8D0C2' }}>
              AUTHOR
            </div>
          </div>

          {/* Speech bubble bio */}
          <div className="max-w-xl">
            <SpeechBubble direction="left">
              <div className="space-y-3">
                <h3 className="font-bangers text-2xl tracking-comic text-ink">
                  HEY THERE, I'M SHRAVANI!
                </h3>
                <p className="font-grotesk text-sm text-ink/90 leading-relaxed">
                  I write story-driven fiction with sharp pacing, intricate lore, and vibrant characters. Novelora is my personal serialized platform where you can read every chapter as soon as it's completed, completely uninterrupted.
                </p>
                <p className="font-grotesk text-sm text-ink/80 italic">
                  "Every panel holds a narrative, every chapter opens a universe."
                </p>
              </div>
            </SpeechBubble>
          </div>
        </div>
      </div>
    </section>
  )
}
