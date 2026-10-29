import React, { useState } from 'react'
import { toggleLike } from '../../services/functionsService'
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

  const handleToggle = async () => {
    if (!user) {
      toast.info('Sign in to like chapters!')
      return
    }

    try {
      setLoading(true)
      // Optimistic update
      const nextLiked = !liked
      setLiked(nextLiked)
      setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)))

      const res = await toggleLike(chapterId, bookId)
      if (res && typeof res.likeCount === 'number') {
        setLikeCount(res.likeCount)
        setLiked(res.liked)
      }
    } catch (err: any) {
      // Revert on error
      setLiked(liked)
      setLikeCount(likeCount)
      toast.error('Could not update like')
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
