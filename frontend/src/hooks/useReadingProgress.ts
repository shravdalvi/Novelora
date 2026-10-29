import { useState, useCallback, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from './useAuth'
import type { ReadingProgress } from '../types'

export function useReadingProgress(bookId: string) {
  const { user } = useAuth()
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const getProgress = useCallback(async (): Promise<ReadingProgress | null> => {
    if (!user || !bookId) {
      setLoading(false)
      return null
    }

    try {
      const progressRef = doc(db, 'users', user.uid, 'progress', bookId)
      const snapshot = await getDoc(progressRef)

      if (snapshot.exists()) {
        const data = snapshot.data() as ReadingProgress
        setProgress(data)
        setLoading(false)
        return data
      }
    } catch (err) {
      console.error('Error getting reading progress:', err)
    }

    setLoading(false)
    return null
  }, [user, bookId])

  const saveProgress = useCallback(
    async (chapterNumber: number, scrollPosition: number): Promise<void> => {
      if (!user || !bookId) return

      try {
        const progressRef = doc(db, 'users', user.uid, 'progress', bookId)
        const updatedData = {
          lastChapter: chapterNumber,
          scrollPosition,
          updatedAt: serverTimestamp(),
        }

        await setDoc(progressRef, updatedData, { merge: true })
        setProgress({
          lastChapter: chapterNumber,
          scrollPosition,
          updatedAt: new Date(),
        })
      } catch (err) {
        console.error('Error saving reading progress:', err)
      }
    },
    [user, bookId]
  )

  useEffect(() => {
    getProgress()
  }, [getProgress])

  return { progress, loading, saveProgress, getProgress }
}
