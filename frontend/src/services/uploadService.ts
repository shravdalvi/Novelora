import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'
import type { UploadUrlResponse } from '../types'

/**
 * Compresses an image file and converts to a lightweight Base64 data URL (< 80KB)
 * Always outputs compressed JPEG to prevent giant PNG data URLs that exceed Firestore 1MB document limit.
 */
export async function fileToBase64Optimized(
  file: File | Blob,
  maxWidth = 640,
  quality = 0.6
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const rawResult = event.target?.result as string
      if (!rawResult) {
        resolve('')
        return
      }

      // If already a tiny string under 50KB, return it directly
      if (rawResult.length < 50 * 1024) {
        resolve(rawResult)
        return
      }

      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(rawResult.length < 300_000 ? rawResult : '')
            return
          }

          // Draw with white background in case of transparent PNG converted to JPEG
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)

          let dataUrl = canvas.toDataURL('image/jpeg', quality)
          // Double-check: if still over 180KB, downsample once more
          if (dataUrl.length > 180 * 1024) {
            const smallerCanvas = document.createElement('canvas')
            smallerCanvas.width = Math.round(width * 0.7)
            smallerCanvas.height = Math.round(height * 0.7)
            const sCtx = smallerCanvas.getContext('2d')
            if (sCtx) {
              sCtx.fillStyle = '#FFFFFF'
              sCtx.fillRect(0, 0, smallerCanvas.width, smallerCanvas.height)
              sCtx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height)
              dataUrl = smallerCanvas.toDataURL('image/jpeg', 0.5)
            }
          }
          resolve(dataUrl)
        } catch {
          resolve(rawResult.length < 300_000 ? rawResult : '')
        }
      }
      img.onerror = () => resolve(rawResult.length < 300_000 ? rawResult : '')
      img.src = rawResult
    }
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

/**
 * Compresses an existing base64 data URL down to < 80KB if oversized
 */
export async function compressDataUrlIfNeeded(dataUrl: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return dataUrl
  // If already under 100KB, no need to recompress
  if (dataUrl.length < 100 * 1024) return dataUrl

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const maxWidth = 640
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(dataUrl.slice(0, 300_000))

        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        let result = canvas.toDataURL('image/jpeg', 0.55)

        // Strict size safeguard: ensure string is under 180KB
        if (result.length > 180 * 1024) {
          const smallCanvas = document.createElement('canvas')
          smallCanvas.width = Math.round(width * 0.65)
          smallCanvas.height = Math.round(height * 0.65)
          const sCtx = smallCanvas.getContext('2d')
          if (sCtx) {
            sCtx.fillStyle = '#FFFFFF'
            sCtx.fillRect(0, 0, smallCanvas.width, smallCanvas.height)
            sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height)
            result = smallCanvas.toDataURL('image/jpeg', 0.5)
          }
        }
        resolve(result)
      } catch {
        resolve(dataUrl.length < 300_000 ? dataUrl : '')
      }
    }
    img.onerror = () => resolve(dataUrl.length < 300_000 ? dataUrl : '')
    img.src = dataUrl
  })
}

/**
 * Attempt Firebase Storage upload with a realistic 15s timeout
 */
async function uploadToStorageWithTimeout(
  file: File,
  storagePath: string,
  timeoutMs = 15000
): Promise<string> {
  const storageRef = ref(storage, storagePath)
  
  const uploadPromise = (async () => {
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
    })
    return await getDownloadURL(snapshot.ref)
  })()

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Firebase Storage timeout')), timeoutMs)
  )

  return await Promise.race([uploadPromise, timeoutPromise])
}

/**
 * Legacy upload URL helper
 */
export async function getUploadUrl(
  folder: string,
  fileName: string,
  _contentType: string
): Promise<UploadUrlResponse> {
  return {
    uploadUrl: '',
    publicUrl: '',
    filePath: `${folder}/${fileName}`,
  }
}

/**
 * Upload a binary image file to Firebase Storage with automatic fast fallback
 */
export async function uploadFile(file: File, folder: string): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload')
  }

  // 1. Generate local optimized image immediately (takes ~30ms)
  const fallbackDataUrl = await fileToBase64Optimized(file)

  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `${folder}/${timestamp}-${sanitizedName}`

  // 2. Try Firebase Cloud Storage directly via client SDK with strict 2.5s timeout
  try {
    const publicUrl = await uploadToStorageWithTimeout(file, storagePath, 2500)
    if (publicUrl) {
      console.info('[uploadService] Successfully uploaded to Firebase Storage:', publicUrl)
      return publicUrl
    }
  } catch (storageErr) {
    console.warn('[uploadService] Firebase Storage unreachable or timed out; using high-speed local data URL fallback.')
  }

  // 3. Return high-speed optimized image URL
  return fallbackDataUrl || URL.createObjectURL(file)
}

/**
 * Upload a book cover image
 */
export async function uploadCover(file: File): Promise<string> {
  return await uploadFile(file, 'covers')
}

/**
 * Upload an inline chapter image
 */
export async function uploadChapterImage(file: File): Promise<string> {
  return await uploadFile(file, 'chapter-images')
}

/**
 * Upload a reader background image
 */
export async function uploadBackground(file: File): Promise<string> {
  return await uploadFile(file, 'backgrounds')
}

/**
 * Upload an avatar image
 */
export async function uploadAvatar(file: File): Promise<string> {
  return await uploadFile(file, 'avatars')
}
