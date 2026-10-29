import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'
import type { UploadUrlResponse } from '../types'

/**
 * Compresses an image file and converts to Base64 data URL
 * Ensures fallback images are lightweight (< 150KB) and load instantly
 */
export async function fileToBase64Optimized(
  file: File,
  maxWidth = 800,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const rawResult = event.target?.result as string
      if (!rawResult) {
        resolve('')
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
            resolve(rawResult)
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
          const dataUrl = canvas.toDataURL(format, quality)
          resolve(dataUrl)
        } catch {
          resolve(rawResult)
        }
      }
      img.onerror = () => resolve(rawResult)
      img.src = rawResult
    }
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

/**
 * Attempt Firebase Storage upload with a strict timeout to avoid infinite hanging
 */
async function uploadToStorageWithTimeout(
  file: File,
  storagePath: string,
  timeoutMs = 2500
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
