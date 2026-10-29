import { useState, useEffect, useRef } from 'react'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface UseAutoSaveReturn {
  status: AutoSaveStatus
  lastSaved: Date | null
}

export function useAutoSave<T>(
  content: T,
  saveFn: (data: T) => Promise<any>,
  debounceMs = 5000
): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const isFirstMount = useRef(true)
  const contentRef = useRef(content)
  const saveFnRef = useRef(saveFn)

  useEffect(() => {
    contentRef.current = content
  }, [content])

  useEffect(() => {
    saveFnRef.current = saveFn
  }, [saveFn])

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    setStatus('idle')

    const timer = setTimeout(async () => {
      try {
        setStatus('saving')
        await saveFnRef.current(contentRef.current)
        setStatus('saved')
        setLastSaved(new Date())
      } catch (err) {
        console.error('AutoSave error:', err)
        setStatus('error')
      }
    }, debounceMs)

    return () => {
      clearTimeout(timer)
    }
  }, [content, debounceMs])

  return { status, lastSaved }
}
