import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getComments, addComment, deleteComment } from '../../services/commentService'
import { formatRelativeDate } from '../../utils/formatDate'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'
import { toast } from '../ui/Toast'
import type { Comment } from '../../types'

export interface CommentSectionProps {
  bookId: string
  chapterId: string
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  bookId,
  chapterId,
}) => {
  const { user, isAdmin } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!bookId || !chapterId) return

    const unsubscribe = getComments(bookId, chapterId, (fetched) => {
      setComments(fetched)
    })

    return () => unsubscribe()
  }, [bookId, chapterId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    if (!user) {
      toast.error('You must be signed in to comment')
      return
    }

    try {
      setSubmitting(true)
      await addComment(bookId, chapterId, newComment.trim())
      setNewComment('')
      toast.success('Comment posted!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      setDeletingId(commentId)
      await deleteComment(bookId, chapterId, commentId)
      toast.success('Comment deleted')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete comment')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="mt-12 pt-8 border-t-3 border-ink">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bangers text-3xl tracking-comic text-ink">
          COMMENTS ({comments.length})
        </h3>
      </div>

      {/* Add Comment Form or Login Banner */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8 space-y-3">
          <Textarea
            placeholder="Share your thoughts on this chapter..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            required
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={!newComment.trim()}
            >
              POST COMMENT
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-sage/20 border-3 border-ink text-center shadow-hard-sm">
          <p className="font-grotesk font-bold text-sm text-ink mb-2">
            Join the conversation! Log in to leave a comment.
          </p>
          <Link to="/login">
            <Button variant="primary" size="sm">
              LOG IN TO COMMENT
            </Button>
          </Link>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-ink/40 text-center bg-parchment/40">
            <p className="font-bangers text-xl text-muted">
              Be the first to comment on this chapter!
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isOwn = user?.uid === comment.userId
            const canDelete = isOwn || isAdmin

            return (
              <div
                key={comment.id}
                className="bg-parchment border-3 border-ink shadow-hard-sm p-4 flex gap-3 transition-all"
              >
                {/* Avatar initial */}
                <div className="w-9 h-9 rounded-full bg-sage border-2 border-ink flex items-center justify-center font-bangers text-base text-ink shrink-0">
                  {comment.userName ? comment.userName.charAt(0).toUpperCase() : 'U'}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-grotesk font-bold text-sm text-ink">
                      {comment.userName || 'Anonymous Reader'}
                    </span>
                    <span className="font-grotesk text-xs text-muted">
                      {formatRelativeDate(comment.createdAt)}
                    </span>
                  </div>

                  <p className="font-grotesk text-sm text-ink/90 whitespace-pre-wrap leading-relaxed">
                    {comment.text}
                  </p>

                  {canDelete && (
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="text-xs font-grotesk font-bold text-soft-coral hover:underline cursor-pointer"
                      >
                        {deletingId === comment.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
