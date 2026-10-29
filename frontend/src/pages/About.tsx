import React from 'react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { SpeechBubble } from '../components/ui/SpeechBubble'
import { Panel } from '../components/ui/Panel'

export const About: React.FC = () => {
  return (
    <PageWrapper title="About">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Title */}
        <div className="text-center space-y-3">
          <div className="inline-block border-3 border-ink px-4 py-2 shadow-hard" style={{ backgroundColor: '#233126' }}>
            <h1 className="font-bangers text-4xl sm:text-5xl tracking-comic text-bone uppercase">
              ABOUT NOVELORA
            </h1>
          </div>
          <p className="font-grotesk text-base sm:text-lg text-ink font-bold max-w-xl mx-auto">
            A serialized reading experience designed to bring back the thrill of chapter-by-chapter storytelling.
          </p>
        </div>

        {/* The Mission Panel */}
        <Panel title="THE MANIFESTO">
          <div className="space-y-4 font-grotesk text-base text-ink/90 leading-relaxed">
            <p>
              In a digital reading landscape clogged with paywalls, micro-transactions, and predatory coin systems, Novelora exists for one simple purpose: <strong>pure, direct storytelling</strong>.
            </p>
            <p>
              Every novel, short story, and manga-style serial on this platform is crafted by a single author. Readers get to follow character arcs, unravel mystery threads, and react directly on each panel and chapter as they are written and released.
            </p>
          </div>
        </Panel>

        {/* Author Bio & Art */}
        <div className="border-3 border-ink shadow-hard p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8" style={{ backgroundColor: '#EDE8DF' }}>
          <div className="w-44 h-44 border-3 border-ink flex items-center justify-center shrink-0 shadow-hard-sm" style={{ backgroundColor: '#233126' }}>
            <span className="font-bangers text-8xl text-bone">S</span>
          </div>

          <div className="space-y-4">
            <SpeechBubble direction="left">
              <span className="font-bangers text-xl text-ink">
                "Writing is worldbuilding in slow motion."
              </span>
            </SpeechBubble>

            <h3 className="font-bangers text-2xl tracking-comic text-ink">
              WRITTEN BY SHRAVANI
            </h3>

            <p className="font-grotesk text-sm text-ink/80 leading-relaxed">
              Based in the intersection of speculative fantasy and sequential art, I've spent years developing expansive fictional universes. When not writing chapter cliffhangers, I'm analyzing classic manga panel pacing and mythic lore.
            </p>
          </div>
        </div>

        {/* FAQ Grid */}
        <div className="space-y-6">
          <h2 className="font-bangers text-3xl tracking-comic text-ink border-b-3 border-ink pb-2">
            FREQUENTLY ASKED QUESTIONS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-sand border-3 border-ink p-5 shadow-hard-sm space-y-2">
              <h4 className="font-bangers text-xl text-ink">
                IS NOVELORA REALLY FREE?
              </h4>
              <p className="font-grotesk text-sm text-ink/70">
                Yes! Every reader can enjoy Chapter 1 without even creating an account. Creating a free account unlocks all serialized chapters, progress tracking, and comments.
              </p>
            </div>

            <div className="bg-sand border-3 border-ink p-5 shadow-hard-sm space-y-2">
              <h4 className="font-bangers text-xl text-ink">
                HOW OFTEN ARE CHAPTERS RELEASED?
              </h4>
              <p className="font-grotesk text-sm text-ink/70">
                New chapters are dropped weekly. Subscribe to the newsletter on the home page or footer to receive immediate drop alerts.
              </p>
            </div>

            <div className="bg-sand border-3 border-ink p-5 shadow-hard-sm space-y-2">
              <h4 className="font-bangers text-xl text-ink">
                CAN I READ OFFLINE?
              </h4>
              <p className="font-grotesk text-sm text-ink/70">
                Chapters remain cached in your browser session for seamless reading even on flaky mobile connections.
              </p>
            </div>

            <div className="bg-sand border-3 border-ink p-5 shadow-hard-sm space-y-2">
              <h4 className="font-bangers text-xl text-ink">
                HOW DO I SUPPORT THE STORIES?
              </h4>
              <p className="font-grotesk text-sm text-ink/70">
                Leave likes and comments on chapters, bookmark your favorite serials, and share your favorite quotes with fellow readers!
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
