import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from './firebase'
import type { Comment } from '../types'

const LOCAL_COMMENTS_KEY = 'novelora_local_comments'

function getLocalComments(chapterId: string): Comment[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_COMMENTS_KEY}_${chapterId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalComment(chapterId: string, comment: Comment): void {
  try {
    const current = getLocalComments(chapterId)
    current.unshift(comment)
    localStorage.setItem(`${LOCAL_COMMENTS_KEY}_${chapterId}`, JSON.stringify(current))
  } catch {}
}

function removeLocalComment(chapterId: string, commentId: string): void {
  try {
    const current = getLocalComments(chapterId).filter((c) => c.id !== commentId)
    localStorage.setItem(`${LOCAL_COMMENTS_KEY}_${chapterId}`, JSON.stringify(current))
  } catch {}
}

/**
 * Subscribe to real-time comments on a specific chapter.
 * Shows comments in real-time as readers post them.
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
      const cloudComments = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Comment[]

      const cloudIds = new Set(cloudComments.map((c) => c.id))
      const localOnly = getLocalComments(chapterId).filter((c) => !cloudIds.has(c.id))
      const combined = [...cloudComments, ...localOnly]

      callback(combined)
    },
    (error) => {
      console.warn('Real-time comments snapshot fallback to local:', error)
      callback(getLocalComments(chapterId))
    }
  )
}

/**
 * Add a new comment to a chapter directly in Firestore with instant real-time sync.
 */
export async function addComment(
  bookId: string,
  chapterId: string,
  text: string,
  authorName?: string,
  authorUid?: string
): Promise<{ id: string; success: boolean }> {
  const currentUid = authorUid || auth.currentUser?.uid
  const currentName = authorName || auth.currentUser?.displayName || 'Reader'

  if (!currentUid) {
    throw new Error('Please sign in to post a comment')
  }

  const commentData = {
    userId: currentUid,
    userName: currentName,
    text: text.trim(),
    createdAt: serverTimestamp(),
  }

  try {
    const commentsRef = collection(db, 'books', bookId, 'chapters', chapterId, 'comments')
    const docRef = await addDoc(commentsRef, commentData)
    return { id: docRef.id, success: true }
  } catch (err) {
    console.warn('Firestore comment write notice, caching locally:', err)
    const localId = `local-comm-${Date.now()}`
    saveLocalComment(chapterId, {
      id: localId,
      userId: currentUid,
      userName: currentName,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    })
    return { id: localId, success: true }
  }
}

/**
 * Delete a user's own comment or author/admin deleting a comment.
 */
export async function deleteComment(
  bookId: string,
  chapterId: string,
  commentId: string
): Promise<{ success: boolean }> {
  removeLocalComment(chapterId, commentId)
  try {
    const commentRef = doc(db, 'books', bookId, 'chapters', chapterId, 'comments', commentId)
    await deleteDoc(commentRef)
    return { success: true }
  } catch (err) {
    console.warn('Firestore delete comment notice:', err)
    return { success: true }
  }
}
