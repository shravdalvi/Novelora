import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import { addComment as funcAddComment, deleteOwnComment as funcDeleteComment } from './functionsService'
import type { Comment } from '../types'

/**
 * Subscribe to real-time comments on a specific chapter
 */
export function getComments(
  bookId: string,
  chapterId: string,
  callback: (comments: Comment[]) => void
): Unsubscribe {
  const commentsRef = collection(db, 'books', bookId, 'chapters', chapterId, 'comments')
  const q = query(commentsRef, orderBy('createdAt', 'desc'))

  return onSnapshot(
    q,
    (snapshot) => {
      const comments = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Comment[]
      callback(comments)
    },
    (error) => {
      console.error('Error listening to comments:', error)
      callback([])
    }
  )
}

/**
 * Add a new comment to a chapter
 */
export async function addComment(
  bookId: string,
  chapterId: string,
  text: string
): Promise<{ id: string; success: boolean }> {
  return await funcAddComment(bookId, chapterId, text)
}

/**
 * Delete a user's own comment
 */
export async function deleteComment(
  bookId: string,
  chapterId: string,
  commentId: string
): Promise<{ success: boolean }> {
  return await funcDeleteComment(bookId, chapterId, commentId)
}
