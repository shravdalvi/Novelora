import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'

const LOCAL_USER_LIKES_KEY = 'novelora_local_user_likes'

function getLocalUserLikes(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LOCAL_USER_LIKES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setLocalUserLike(chapterId: string, liked: boolean): void {
  try {
    const map = getLocalUserLikes()
    if (liked) {
      map[chapterId] = true
    } else {
      delete map[chapterId]
    }
    localStorage.setItem(LOCAL_USER_LIKES_KEY, JSON.stringify(map))
  } catch {}
}

/**
 * Real-time subscription to a chapter's live likeCount.
 * Automatically notifies when anyone likes/unlikes this chapter.
 */
export function subscribeToChapterLikes(
  bookId: string,
  chapterId: string,
  callback: (likeCount: number) => void
): Unsubscribe {
  const chapterRef = doc(db, 'books', bookId, 'chapters', chapterId)

  return onSnapshot(
    chapterRef,
    (snap) => {
      if (snap.exists()) {
        const count = snap.data()?.likeCount
        callback(typeof count === 'number' ? Math.max(0, count) : 0)
      }
    },
    (err) => {
      console.warn('Real-time chapter likeCount subscription notice:', err)
    }
  )
}

/**
 * Real-time subscription to check if current user liked this chapter.
 */
export function subscribeToUserLike(
  userId: string,
  chapterId: string,
  callback: (liked: boolean) => void
): Unsubscribe {
  // Check local cache first for instant feedback
  const localLikes = getLocalUserLikes()
  if (localLikes[chapterId]) {
    callback(true)
  }

  const likeRef = doc(db, 'users', userId, 'likes', chapterId)

  return onSnapshot(
    likeRef,
    (snap) => {
      const isLiked = snap.exists()
      setLocalUserLike(chapterId, isLiked)
      callback(isLiked)
    },
    (err) => {
      console.warn('User like status subscription notice:', err)
      callback(Boolean(getLocalUserLikes()[chapterId]))
    }
  )
}

/**
 * Toggles a user's like directly on Firestore in real-time.
 */
export async function toggleChapterLike(
  userId: string,
  bookId: string,
  chapterId: string
): Promise<{ liked: boolean }> {
  const likeRef = doc(db, 'users', userId, 'likes', chapterId)
  const chapterRef = doc(db, 'books', bookId, 'chapters', chapterId)

  try {
    const snap = await getDoc(likeRef)
    if (snap.exists()) {
      // User already liked -> unlike
      setLocalUserLike(chapterId, false)
      await deleteDoc(likeRef)
      await updateDoc(chapterRef, {
        likeCount: increment(-1),
      }).catch(console.warn)

      return { liked: false }
    } else {
      // User has not liked yet -> like
      setLocalUserLike(chapterId, true)
      await setDoc(likeRef, {
        bookId,
        chapterId,
        createdAt: serverTimestamp(),
      })
      await updateDoc(chapterRef, {
        likeCount: increment(1),
      }).catch(console.warn)

      return { liked: true }
    }
  } catch (err) {
    console.warn('Direct Firestore toggleLike error, toggling local state:', err)
    const localLiked = Boolean(getLocalUserLikes()[chapterId])
    const nextState = !localLiked
    setLocalUserLike(chapterId, nextState)
    return { liked: nextState }
  }
}

