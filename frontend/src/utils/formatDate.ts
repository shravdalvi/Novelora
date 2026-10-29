import { format, formatDistanceToNow, isValid } from 'date-fns'

function toDate(timestamp: any): Date | null {
  if (!timestamp) return null
  if (timestamp instanceof Date) return timestamp
  if (typeof timestamp.toDate === 'function') return timestamp.toDate()
  if (typeof timestamp.seconds === 'number') return new Date(timestamp.seconds * 1000)
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const d = new Date(timestamp)
    return isValid(d) ? d : null
  }
  return null
}

/**
 * Format a timestamp into 'MMM d, yyyy' (e.g., Oct 29, 2026)
 */
export function formatDate(timestamp: any): string {
  const date = toDate(timestamp)
  if (!date || !isValid(date)) return 'Recently'
  return format(date, 'MMM d, yyyy')
}

/**
 * Format relative to now (e.g. '3 days ago')
 */
export function formatRelativeDate(timestamp: any): string {
  const date = toDate(timestamp)
  if (!date || !isValid(date)) return 'Recently'
  return `${formatDistanceToNow(date)} ago`
}

/**
 * Format full date with time (e.g., October 29, 2026 at 3:30 PM)
 */
export function formatDateLong(timestamp: any): string {
  const date = toDate(timestamp)
  if (!date || !isValid(date)) return 'Recently'
  return format(date, "MMMM d, yyyy 'at' h:mm a")
}
