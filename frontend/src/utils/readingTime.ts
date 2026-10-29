/**
 * Estimates reading time from a given word count based on 220 words per minute.
 */
export function estimateReadingTime(wordCount: number): string {
  if (!wordCount || wordCount <= 0) return '1 min read'
  const minutes = Math.ceil(wordCount / 220)
  return `${minutes} min read`
}

/**
 * Helper to count words from a raw string or plain text
 */
export function countWords(text: string): number {
  if (!text) return 0
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!clean) return 0
  return clean.split(' ').filter(Boolean).length
}
