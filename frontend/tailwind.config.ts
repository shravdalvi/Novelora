import type { Config } from 'tailwindcss'

// ──────────────────────────────────────────────────────────
//  NOVELORA  –  Bordeaux · Hunter · Sage · Bone · Cedar
// ──────────────────────────────────────────────────────────
const P = {
  bordeaux : '#4A1A23',   // deep wine-red   → danger, delete, logo box
  hunter   : '#233126',   // dark forest green → navbar, footer, primary buttons
  sage     : '#6A7657',   // muted sage green  → accents, active badges
  bone     : '#D8D0C2',   // warm off-white    → page background, cards
  cedar    : '#8C603E',   // earthy brown      → secondary buttons, captions
  ink      : '#1A1A1A',   // near-black        → text, borders, shadows
  parchment: '#EDE8DF',   // lighter warm bg   → alternate sections
  sand     : '#C4B9A8',   // mid bone          → inputs, frost, muted sections
}

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Core palette ──────────────────────────────────
        'bordeaux' : P.bordeaux,
        'hunter'   : P.hunter,
        'sage'     : P.sage,
        'bone'     : P.bone,
        'cedar'    : P.cedar,
        'parchment': P.parchment,
        'sand'     : P.sand,
        'ink'      : P.ink,

        // ── Semantic aliases used throughout components ───
        'paper'         : P.bone,       // main page bg
        'white'         : P.bone,       // "white" panels → warm bone
        'pure-white'    : '#FFFFFF',
        'frost'         : P.sand,       // inputs / alt sections
        'midnight-ink'  : P.ink,
        'muted'         : '#6B6560',

        // Northern-lights → palette aliases (keeps old class names working)
        'aurora-blue'     : P.sage,       // primary accent
        'aurora-mint'     : P.sage,
        'aurora-lavender' : P.cedar,
        'deep-sky'        : P.hunter,
        'aurora-pink'     : '#B89B8A',
        'soft-coral'      : P.bordeaux,
        'comic-yellow'    : P.cedar,      // primary button fill
        'pop-red'         : P.bordeaux,
        'sky-blue'        : P.sage,
        'mint-green'      : P.sage,
        'slate-grey'      : '#6B6560',
        'slate-navy'      : P.hunter,

        // Reader dark theme
        'dark-bg'     : '#141A15',
        'dark-card'   : P.hunter,
        'dark-text'   : P.bone,
        'dark-border' : P.sage,
      },
      fontFamily: {
        bangers  : ['Bangers', 'cursive'],
        grotesk  : ['Space Grotesk', 'sans-serif'],
        literata : ['Literata', 'serif'],
      },
      boxShadow: {
        'hard'    : `6px 6px 0 ${P.ink}`,
        'hard-sm' : `4px 4px 0 ${P.ink}`,
        'hard-lg' : `8px 8px 0 ${P.ink}`,
        'hard-hunter': `6px 6px 0 ${P.hunter}`,
        'hard-cedar' : `6px 6px 0 ${P.cedar}`,
        'none'    : 'none',
      },
      borderWidth: { '3': '3px' },
      letterSpacing: { 'comic': '1px' },
    },
  },
  plugins: [],
}

export default config
