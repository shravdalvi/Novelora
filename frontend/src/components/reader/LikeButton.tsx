import React, { useState, useEffect } from 'react'
import {
  subscribeToChapterLikes,
  subscribeToUserLike,
  toggleChapterLike,
} from '../../services/likeService'
import { useAuth } from '../../hooks/useAuth'
import { toast } from '../ui/Toast'

export interface LikeButtonProps {
  chapterId: string
  bookId: string
  initialCount?: number
  initialLiked?: boolean
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  chapterId,
  bookId,
  initialCount = 0,
  initialLiked = false,
}) => {
  const { user } = useAuth()
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  // 1. Real-time subscription to the chapter's live likeCount
  useEffect(() => {
    if (!bookId || !chapterId) return
    const unsub = subscribeToChapterLikes(bookId, chapterId, (liveCount) => {
      setLikeCount(liveCount)
    })
    return () => unsub()
  }, [bookId, chapterId])

  // 2. Real-time subscription to current user's liked status for this chapter
  useEffect(() => {
    if (!user || !chapterId) {
      setLiked(false)
      return
    }
    const unsub = subscribeToUserLike(user.uid, chapterId, (isLiked) => {
      setLiked(isLiked)
    })
    return () => unsub()
  }, [user, chapterId])

  const handleToggle = async () => {
    if (!user) {
      toast.info('Sign in to like chapters!')
      return
    }

    try {
      setLoading(true)
      // Instant optimistic update
      const nextLiked = !liked
      setLiked(nextLiked)
      setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)))

      // Toggle directly in Firestore
      const res = await toggleChapterLike(user.uid, bookId, chapterId)
      setLiked(res.liked)
    } catch (err: any) {
      console.warn('Like toggle error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 border-3 border-ink font-bangers text-lg tracking-comic shadow-hard transition-all duration-150 select-none active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer ${
        liked
          ? 'bg-cedar/30 text-ink'
          : 'bg-parchment text-ink hover:bg-cedar/30/20'
      }`}
    >
      <span>{liked ? 'LIKED' : 'LIKE'}</span>
      <span className="bg-ink text-white px-2 py-0.5 text-xs font-grotesk font-bold ml-1">
        {likeCount}
      </span>
    </button>
  )
}
