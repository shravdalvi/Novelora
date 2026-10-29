import { useState, useRef } from 'react'
import { uploadFile } from '@/services/uploadService'
import toast from 'react-hot-toast'

interface ImageUploaderProps {
  folder: string
  onInsert: (url: string) => void
  onClose: () => void
  showCaption?: boolean
}

/**
 * ImageUploader — neo-brutalist modal for uploading and inserting images
 * into the TipTap chapter editor or setting book cover images.
 */
export default function ImageUploader({
  folder,
  onInsert,
  onClose,
  showCaption = false,
}: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [size, setSize] = useState<'small' | 'medium' | 'full'>('medium')
  const [caption, setCaption] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }

    if (selected.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB.')
      return
    }

    setFile(selected)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(selected)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)

    try {
      const url = await uploadFile(file, folder)
      onInsert(url)
      toast.success('Image uploaded!')
    } catch {
      toast.error('Failed to upload image.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center p-4 z-50">
      <div className="relative bg-parchment border-3 border-ink shadow-hard-lg max-w-md w-full p-6 z-10">
        <h3 className="font-bangers text-2xl tracking-comic text-ink mb-4">Insert Image</h3>

        {/* Drop zone / File preview */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-3 border-ink border-dashed p-6 text-center cursor-pointer
                     hover:bg-sand transition-colors mb-4 relative"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-48 mx-auto object-contain" />
          ) : (
            <div>
              <p className="font-grotesk text-sm font-bold text-muted">
                Click to browse an image
              </p>
              <p className="font-grotesk text-xs text-muted/80 mt-1">
                PNG, JPG, WebP up to 5MB
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {file && (
          <>
            {/* Size selector */}
            <div className="mb-4">
              <label className="font-grotesk text-sm font-bold block mb-2 text-ink">Size</label>
              <div className="flex gap-2">
                {(['small', 'medium', 'full'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={[
                      'px-4 py-1 border-2 border-ink font-grotesk text-sm capitalize text-ink',
                      size === s ? 'bg-sage shadow-[2px_2px_0_#0B1D33]' : 'bg-parchment',
                    ].join(' ')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption */}
            {showCaption && (
              <div className="mb-4">
                <label className="font-grotesk text-sm font-bold block mb-1 text-ink">Caption (optional)</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption…"
                  className="w-full border-3 border-ink px-3 py-2 font-grotesk text-sm text-ink
                             bg-sand focus:outline-none focus:ring-2 focus:ring-deep-sky"
                />
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border-3 border-ink font-bangers tracking-comic text-lg text-ink
                       bg-parchment shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5
                       hover:shadow-hard active:translate-x-1 active:translate-y-1
                       active:shadow-none transition-all duration-150"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-5 py-2 border-3 border-ink font-bangers tracking-comic text-lg text-ink
                       bg-sage shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5
                       hover:shadow-hard active:translate-x-1 active:translate-y-1
                       active:shadow-none transition-all duration-150
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading…' : 'Insert'}
          </button>
        </div>
      </div>
    </div>
  )
}
