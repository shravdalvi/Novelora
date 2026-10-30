/**
 * Parses various YouTube link formats and extracts an embeddable URL.
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export function getYouTubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null
  const cleanUrl = url.trim()
  try {
    const regExp =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = cleanUrl.match(regExp)
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`
    }
  } catch {
    // ignore
  }
  return null
}

