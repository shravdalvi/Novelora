import type { Book, Chapter } from '../types'

const LOCAL_BOOKS_KEY = 'novelora_local_books'
const LOCAL_CHAPTERS_KEY = 'novelora_local_chapters'
export const LOCAL_BOOKS_EVENT = 'novelora_local_books_updated'
export const LOCAL_CHAPTERS_EVENT = 'novelora_local_chapters_updated'

export const INITIAL_AUTHOR_BOOKS: Book[] = [
  {
    id: 'book-1793291155125',
    title: 'My Overbearing Boss',
    slug: 'my-overbearing-boss',
    coverImageUrl: '/covers/my-overbearing-boss.jpg',
    description:
      "My name is Kathryn Landon, and apparently, I have the worst luck when it comes to men.\n\nEspecially the one signing my paychecks.\n\nKai Havertz. Thirty-two. CEO of Havertz Group. One of the richest, most powerful men in New York, and an arrogant bastard with a face that should honestly be illegal. Women throw themselves at him, yet somehow, I'm the only woman he seems determined to torment.\n\nHe's controlling, infuriating, ridiculously possessive, and has absolutely no business interfering in my personal life. But lately, his attention has become a little too personal, his stares a little too lingering, and his jealousy a little too obvious.\n\n\nBut Kai isn't the only man with a complicated love life.\n\nChristian Young, the thirty-two-year-old CEO of Young Heels, notorious Casanova, and Kai's best friend, has met his match in Nina Black. Twenty-four, brutally unapologetic, and completely immune to his irresistible charm.",
    genres: ['Office Romance', 'Smut', 'Billionaires and CEOs', 'Enemies to Lovers', 'Age gap'],
    tags: [
      'agegap',
      'arrogant',
      'assistant',
      'billionaire boss',
      'casanova',
      'ceo',
      'design',
      'dominating',
      'enemiestolovers',
      'hatelove',
      'heels',
      'jealousy',
      'love',
      'newadult',
      'officeromance',
      'personalassistant',
      'possessive',
      'rich',
      'romance',
    ],
    status: 'ongoing',
    visibility: 'published',
    chapterCount: 8,
    createdAt: '2026-10-30T10:00:00.000Z',
    updatedAt: '2026-10-30T10:00:00.000Z',
  },
]

/**
 * Retrieve all locally saved books from localStorage
 */
export function getLocalBooks(): Book[] {
  try {
    const raw = localStorage.getItem(LOCAL_BOOKS_KEY)
    if (!raw) return INITIAL_AUTHOR_BOOKS
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
    return INITIAL_AUTHOR_BOOKS
  } catch (err) {
    console.warn('[localBooksService] Error reading local books:', err)
    return INITIAL_AUTHOR_BOOKS
  }
}

/**
 * Save a new local book
 */
export function saveLocalBook(book: Book): void {
  try {
    const existing = getLocalBooks()
    const filtered = existing.filter((b) => b.id !== book.id && b.slug !== book.slug)
    filtered.unshift(book)
    localStorage.setItem(LOCAL_BOOKS_KEY, JSON.stringify(filtered))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(LOCAL_BOOKS_EVENT))
    }
  } catch (err) {
    console.error('[localBooksService] Error saving local book:', err)
  }
}

/**
 * Update an existing local book
 */
export function updateLocalBook(updates: Partial<Book> & { id: string }): void {
  try {
    const existing = getLocalBooks()
    const index = existing.findIndex((b) => b.id === updates.id)
    if (index !== -1) {
      existing[index] = { ...existing[index], ...updates, updatedAt: new Date().toISOString() }
      localStorage.setItem(LOCAL_BOOKS_KEY, JSON.stringify(existing))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(LOCAL_BOOKS_EVENT))
      }
    }
  } catch (err) {
    console.error('[localBooksService] Error updating local book:', err)
  }
}

/**
 * Delete a local book
 */
export function deleteLocalBook(bookId: string): void {
  try {
    const existing = getLocalBooks()
    const filtered = existing.filter((b) => b.id !== bookId)
    localStorage.setItem(LOCAL_BOOKS_KEY, JSON.stringify(filtered))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(LOCAL_BOOKS_EVENT))
    }
  } catch (err) {
    console.error('[localBooksService] Error deleting local book:', err)
  }
}

/**
 * Find local book by ID
 */
export function getLocalBookById(id: string): Book | undefined {
  return getLocalBooks().find((b) => b.id === id)
}

/**
 * Find local book by slug
 */
export function getLocalBookBySlug(slug: string): Book | undefined {
  return getLocalBooks().find((b) => b.slug === slug)
}

export const INITIAL_AUTHOR_CHAPTERS: Chapter[] = [
  {
    id: 'ch-boss-001',
    bookId: 'book-1793291155125',
    chapterNumber: 1,
    title: 'Characters',
    status: 'published',
    wordCount: 360,
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Kai Havertz' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'italic' }],
              text: 'CEO of Havertz Group • 32 years old',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "The CEO of Havertz Group. Arrogant, controlling, and dangerously possessive. He is used to getting whatever he wants. His latest obsession is none other than his new personal secretary, Kathryn. He would rather choke than admit he is jealous when anyone gets her attention. After all, he's just her boss, not her boyfriend. At least, that's what he keeps telling himself.",
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Kathryn Landon' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'italic' }],
              text: 'Executive Personal Secretary • 24 years old',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'A 24-year-old ambitious woman, soon to become Mr. Havertz’s personal secretary. Her friends keep trying to set her up on blind dates, but somehow, every single date gets ruined by an urgent late-night task Mr. Havertz conveniently assigns at the exact same time. Coincidence? Or is her handsome, workaholic boss deliberately making sure she stays off the dating market? Either way, someone has a little explaining to do...',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Nina Black' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'italic' }],
              text: "Kathryn's Best Friend • 24 years old",
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "Kathryn's ride-or-die best friend, 24. The living definition of a walking red flag. Savage, unapologetic, and completely allergic to giving a fuck. She plays strictly by her own rules and answers to nobody except herself at Young Heels. Pretty face, filthy attitude, zero regrets, and definitely not interested in Christian Young.",
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Christian Young' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'italic' }],
              text: 'CEO of Young Heels • 32 years old',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "32. CEO of Young Heels and best friend of Kai Havertz. A notorious Casanova with a reputation for breaking hearts and never catching feelings. Every woman wants him, but he only wants what he can't have. Except Nina Black, who couldn't care less about his charm. And that's where the real trouble begins...",
            },
          ],
        },
      ],
    },
    headerImageUrl: '',
    headerVideoUrl: '',
    overlayOpacity: 0,
    likeCount: 0,
    createdAt: '2026-10-30T09:00:00.000Z',
    updatedAt: '2026-10-30T09:00:00.000Z',
  },
  {
    id: 'ch-boss-002',
    bookId: 'book-1793291155125',
    chapterNumber: 2,
    title: 'First day at work',
    status: 'published',
    wordCount: 1209,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Kathryn' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'The fire alarm rang and everybody in the office ran in panic. The firemen came to rescue us and took us to a safe place.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'But wait a minute, why would I hear the fire alarm sound when I was standing far away from the burning building?',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Suddenly, I woke up from my dream.' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"Ah, my god, it\'s my alarm." I opened my eyes and grabbed my phone to check the time. It was 4 p.m.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "I had been reading the CEOs' biographies all night and couldn't sleep, so I took a short nap.",
            },
          ],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'My doorbell rang.' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "It must be her, my best friend Nina Black. Yesterday I told her I got a job at Havertz Group as the CEO's PA.",
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'I went downstairs to open the door. She was excited and hugged me, then walked inside.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '"Why did you come so early?" I yawned.' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'She gave me a bored look and sat on the couch. "Kate, don\'t be lazy. You have your first day at work tomorrow, I want you to be prepared well," she said.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '"What do you mean?"' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"I mean, your sexy boss might be an arrogant beast, but he has eyes that linger longer than they should."',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"Nina! I\'m going there to work, not to flirt!" I said defensively.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"Yeah, yeah, whatever. Let\'s make sure you look stunning. Tomorrow is day one!"',
            },
          ],
        },
      ],
    },
    headerImageUrl: '',
    headerVideoUrl: '',
    overlayOpacity: 0,
    likeCount: 0,
    createdAt: '2026-10-30T10:00:00.000Z',
    updatedAt: '2026-10-30T10:00:00.000Z',
  },
  {
    id: 'ch-boss-003',
    bookId: 'book-1793291155125',
    chapterNumber: 3,
    title: "I'm going to kill him",
    status: 'published',
    wordCount: 1150,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Kathryn' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Suddenly someone opened the office doors and strolled right in. Kill me now.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'I quickly scrambled up from Kai Havertz’s lap, my face burning with unbearable heat.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"I—I\'m so sorry, Mr. Havertz! I didn\'t do it intentionally, I just tripped in my new heels!" I stammered, frantically adjusting my skirt.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"Well, well, what do we have going on here? Did I interrupt something special?" The man who had just entered leaned against the mahogany doorframe, a devilish grin on his face.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'He looked dangerously handsome—dark brown hair, piercing navy blue eyes, and an impeccably tailored black suit. Christian Young.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Christian smirked, walked over, and gently took my hand. Before I could pull away, he pressed a soft, teasing kiss to my knuckles. "And who is this stunning lady?"',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"Kathryn Landon. Mr. Havertz\'s new personal assistant," I whispered, heart hammering.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"Christian. Stop flirting with my employees," Kai\'s voice cut through the air with frigid, lethal authority. His dark eyes narrowed, burning with unfiltered possession.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Before Christian could reply, the double doors slammed open again with a deafening bang.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"N-Nina?!" My jaw dropped. What the hell was my best friend doing storming into Havertz Group\'s executive suite?!',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Nina didn\'t even look at me. Her furious gaze locked directly onto Christian Young. "You. Mr. Young. We need to talk about my designs right now."',
            },
          ],
        },
      ],
    },
    headerImageUrl: '',
    headerVideoUrl: '',
    overlayOpacity: 0,
    likeCount: 0,
    createdAt: '2026-10-30T11:00:00.000Z',
    updatedAt: '2026-10-30T11:00:00.000Z',
  },
  {
    id: 'ch-boss-004',
    bookId: 'book-1793291155125',
    chapterNumber: 4,
    title: 'Nina Black Gets Her Job Back',
    status: 'published',
    wordCount: 1280,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Nina' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"Everyone dismiss," Christian said without breaking eye contact with me. The boardroom cleared in seconds.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"Is this how you run a company, Mr. Young? Restricting my entry badge because a senior designer stole my portfolio?" I threw the copies onto the glass conference table.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"Call me Christian," he responded, a slow smirk playing on his lips.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"Why the hell would I call you by your first name? I will prove that Scarlett Byrne stole my designs. When I do, you will fire her and give me my project back."',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Christian leaned back, crossing his arms. "Take a blank sheet. Both of you draw the prototype sketches right now in front of me."',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Ten minutes later, my intricate pencil work was flawless—every stitch, curve, and arch drawn straight from my soul. Scarlett’s hands were trembling violently, barely able to replicate the shading.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Christian studied both sketches thoughtfully. His expression darkened with cold fury as he looked at Scarlett.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"SCARLETT BYRNE. I am asking you once: did you steal her designs?" His voice was an angry, controlled thunder that made the room freeze.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"I... I\'m so s-sorry, sir! I—" Scarlett broke down sobbing.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"Clean your desk. You\'re fired." Christian turned back to me, his navy eyes gleaming with pure admiration. "Welcome back, Ms. Black. Lead designer of Young Heels."',
            },
          ],
        },
      ],
    },
    headerImageUrl: '',
    headerVideoUrl: '',
    overlayOpacity: 0,
    likeCount: 0,
    createdAt: '2026-10-30T12:00:00.000Z',
    updatedAt: '2026-10-30T12:00:00.000Z',
  },
  {
    id: 'ch-boss-005',
    bookId: 'book-1793291155125',
    chapterNumber: 5,
    title: 'Wild Cat?',
    status: 'published',
    wordCount: 1190,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Kathryn' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'W-what... where should I look? Down at his abs?! Oh god, no—look up!',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Kai Havertz stood in the doorway of his penthouse shirtless, a towel hanging loose around his broad neck, water droplets glistening on his Greek-god chest.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"What are you staring at, Kate?" He smirked, his deep voice vibrating right through me.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"I—nothing! Ms. Leena said you needed these urgent contract files immediately!" I squeaked, gripping my portfolio like a shield.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Before I could take a step back, Kai leaned down, his lips barely a whisper away from my ear: "Don\'t slam the door in my face. Get inside, Kate."',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'I brushed past him into the penthouse, my pulse skyrocketing. Did he just call me Kate?! Nobody at the firm calls me that.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'A few minutes later, he walked into the lounge wearing a soft fitted charcoal sweater and sweatpants, his damp dark hair tousled carelessly. How can a man look this illegally attractive doing absolutely nothing?',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'He sat on the leather sofa right next to me, closing the distance until our thighs almost brushed.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"You\'re nervous, Kate. Are you afraid of me, or afraid of what you\'re feeling?"',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'I snapped my head toward him, eyes blazing with defiance. "I am not afraid of you, Mr. Havertz. Nor am I interested in your games."',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Kai\'s lips curved into a wicked, dangerous smile. "Feisty. A real little wild cat, aren\'t you?"',
            },
          ],
        },
      ],
    },
    headerImageUrl: '',
    headerVideoUrl: '',
    overlayOpacity: 0,
    likeCount: 0,
    createdAt: '2026-10-30T13:00:00.000Z',
    updatedAt: '2026-10-30T13:00:00.000Z',
  },
  {
    id: 'ch-boss-006',
    bookId: 'book-1793291155125',
    chapterNumber: 6,
    title: 'Nina/Kate',
    status: 'published',
    wordCount: 980,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Nina' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "I didn't listen to any word Kate was saying. I just picked a less hot dress because she refused the hottest ones I chose.",
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"Nina, you cannot wear that to a dinner with Daniel Voss. He is his company\'s chairman, not some college boy you\'re trying to impress at a frat party," Kate said, arms folded like a disappointed mother.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"That\'s the point. I want to impress him." I turned in front of the mirror, smoothing the fabric over my hips.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Kate let out a long-suffering sigh. "You\'re impossible." But she helped me with my earrings anyway.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Kathryn' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Helping Nina get ready for a date with another man felt like being an accomplice in my own heartbreak. Not that I\'d ever tell her that.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'She looked stunning, of course. Nina always looked stunning. Dark curls pinned up, red lips, that dress that should have come with a warning label.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"You look beautiful," I told her honestly. "Now please don\'t do anything that ends up in the tabloids."',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Nina grinned. "No promises." She grabbed her clutch and disappeared through the door, leaving behind a cloud of perfume and chaos.',
            },
          ],
        },
      ],
    },
    headerImageUrl: '',
    headerVideoUrl: '',
    overlayOpacity: 0,
    likeCount: 0,
    createdAt: '2026-10-30T14:00:00.000Z',
    updatedAt: '2026-10-30T14:00:00.000Z',
  },
  {
    id: 'ch-boss-007',
    bookId: 'book-1793291155125',
    chapterNumber: 7,
    title: 'Kai/Chris',
    status: 'published',
    wordCount: 870,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Kai' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'There is a fucker who is gonna get beaten up to death today.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'His name is Daniel Voss, and he had the audacity — the sheer, breathtaking audacity — to take Kathryn out to dinner at La Maison, the most exclusive restaurant in Manhattan. The restaurant I had a standing reservation at.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"You\'re staring at your phone like it personally insulted you," Chris said from across my desk, throwing a stress ball up and catching it lazily.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"Shut up, Christian."',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Christian' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Kai was absolutely losing it, and it was the most entertaining thing I\'d witnessed in months.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"She\'s just at dinner," I pointed out helpfully. "With another man. A very rich, very handsome man. Who keeps texting her." I paused. "You should probably calm down before you do something that ends up in the financial news."',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'He stood up so fast his chair rolled back and hit the wall. "I\'m going to that restaurant."',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"Oh this," I grinned, grabbing my jacket, "I have to see."',
            },
          ],
        },
      ],
    },
    headerImageUrl: '',
    headerVideoUrl: '',
    overlayOpacity: 0,
    likeCount: 0,
    createdAt: '2026-10-30T15:00:00.000Z',
    updatedAt: '2026-10-30T15:00:00.000Z',
  },
  {
    id: 'ch-boss-008',
    bookId: 'book-1793291155125',
    chapterNumber: 8,
    title: 'Danny',
    status: 'published',
    wordCount: 920,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Nina' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "I didn't listen to any word Kate was saying. I just picked a less hot dress because she refused the hottest ones I chose. But standing across from Daniel Voss at La Maison, I was starting to think Kate might have had a point about the dress.",
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Danny — he\'d insisted I call him Danny before the appetizers even arrived — was exactly the kind of man who belonged in a place like this. Sharp jaw, sharper eyes, the kind of smile that had probably convinced boardrooms and broken hearts with equal efficiency.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"You\'re not what I expected," he said, swirling his wine slowly. "Christian said you were a handful."',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"Christian is a menace." I took a sip of my own glass. "Whatever he told you, assume the opposite is true."',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Danny laughed — a real laugh, not the polished kind these men usually deployed. "I like you."',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"You don\'t know me yet."',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '"No." His eyes met mine across the candlelight. "But I intend to."',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'The restaurant door swung open at that exact moment. I didn\'t need to look up to know who had just walked in. I could feel it — that particular shift in air pressure that only one infuriating, beautiful, insufferable man caused.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Christian Young, grinning like a cat, and behind him — Kai Havertz, looking like he wanted to commit a felony.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'I slowly set down my wine glass. "Oh, this is going to be a disaster."',
            },
          ],
        },
      ],
    },
    headerImageUrl: '',
    headerVideoUrl: '',
    overlayOpacity: 0,
    likeCount: 0,
    createdAt: '2026-10-30T16:00:00.000Z',
    updatedAt: '2026-10-30T16:00:00.000Z',
  },
]

/**
 * Retrieve all locally saved chapters
 */
export function getLocalChapters(bookId?: string): Chapter[] {
  try {
    const raw = localStorage.getItem(LOCAL_CHAPTERS_KEY)
    const deletedIds = getDeletedChapterIds()
    let list: Chapter[] = []
    if (raw) {
      const parsed = JSON.parse(raw) as Chapter[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed
      }
    }

    // Automatically deduplicate any multiple "First day at work" copies in local storage
    const firstDayChapters = list.filter((c) => c.title.trim().toLowerCase().includes('first day at work'))
    if (firstDayChapters.length > 1) {
      // Keep only one First day at work as Chapter 2
      const firstIndex = list.findIndex((c) => c.title.trim().toLowerCase().includes('first day at work'))
      if (firstIndex !== -1) {
        list.splice(firstIndex, 1)
      }
      const remaining = list.find((c) => c.title.trim().toLowerCase().includes('first day at work'))
      if (remaining) {
        remaining.chapterNumber = 2
      }
    }

    // Ensure baseline published chapters ("Characters" as CH 1, "First day at work" as CH 2) are present
    for (const initCh of INITIAL_AUTHOR_CHAPTERS) {
      const normInit = initCh.title.trim().toLowerCase()
      const alreadyHas = list.some(
        (c) =>
          c.id === initCh.id ||
          c.title.trim().toLowerCase() === normInit ||
          (c.chapterNumber === initCh.chapterNumber && c.bookId === initCh.bookId)
      )
      if (!alreadyHas && !deletedIds.has(initCh.id)) {
        if (initCh.chapterNumber === 1) {
          list.unshift(initCh)
        } else {
          list.push(initCh)
        }
      }
    }

    // Ensure Chapter 1 is always Characters if present
    const charIndex = list.findIndex((c) => c.title.trim().toLowerCase() === 'characters')
    if (charIndex > 0) {
      const [charCh] = list.splice(charIndex, 1)
      charCh.chapterNumber = 1
      list.unshift(charCh)
    }

    const filtered = list.filter((c) => !deletedIds.has(c.id))
    return bookId ? filtered.filter((c) => c.bookId === bookId || c.bookId === 'book-1793291155125') : filtered
  } catch {
    return INITIAL_AUTHOR_CHAPTERS
  }
}

/**
 * Save or update a local chapter (guarantees author work is never lost)
 */
export function saveLocalChapter(chapter: Chapter): void {
  try {
    const existing = getLocalChapters()
    const filtered = existing.filter((c) => c.id !== chapter.id)
    filtered.unshift(chapter)
    localStorage.setItem(LOCAL_CHAPTERS_KEY, JSON.stringify(filtered))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(LOCAL_CHAPTERS_EVENT))
    }
  } catch (err) {
    console.error('[localBooksService] Error saving local chapter:', err)
  }
}

/**
 * Find single local chapter
 */
export function getLocalChapterById(chapterId: string): Chapter | undefined {
  return getLocalChapters().find((c) => c.id === chapterId)
}

/**
 * Delete a local chapter
 */
export function deleteLocalChapter(chapterId: string): void {
  try {
    const existing = getLocalChapters()
    const filtered = existing.filter((c) => c.id !== chapterId)
    localStorage.setItem(LOCAL_CHAPTERS_KEY, JSON.stringify(filtered))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(LOCAL_CHAPTERS_EVENT))
    }
  } catch (err) {
    console.error('[localBooksService] Error deleting local chapter:', err)
  }
}

const LOCAL_DELETED_CHAPTER_IDS_KEY = 'novelora_deleted_chapter_ids'

/**
 * Retrieve the set of all chapter IDs marked as permanently deleted by the author
 */
export function getDeletedChapterIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_CHAPTER_IDS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed) : new Set()
  } catch {
    return new Set()
  }
}

/**
 * Permanently mark a chapter as deleted so it can never reappear from cloud or local sync
 */
export function markChapterAsDeleted(chapterId: string): void {
  try {
    const set = getDeletedChapterIds()
    set.add(chapterId)
    localStorage.setItem(LOCAL_DELETED_CHAPTER_IDS_KEY, JSON.stringify(Array.from(set)))
    deleteLocalChapter(chapterId)
  } catch (err) {
    console.error('[localBooksService] Error marking chapter as deleted:', err)
  }
}

/**
 * Remove all draft chapters for a specific book from local storage
 */
export function purgeAllLocalDraftChapters(bookId: string): void {
  try {
    const existing = getLocalChapters()
    const kept = existing.filter((c) => !(c.bookId === bookId && c.status !== 'published'))
    localStorage.setItem(LOCAL_CHAPTERS_KEY, JSON.stringify(kept))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(LOCAL_CHAPTERS_EVENT))
    }
  } catch (err) {
    console.error('[localBooksService] Error purging draft chapters:', err)
  }
}
