import { useState, useRef } from 'react'
import { uploadFile } from '@/services/uploadService'
import toast from 'react-hot-toast'

interface BackgroundPickerProps {
  backgroundUrl: string | null
  overlayOpacity: number
  onBackgroundChange: (url: string | null) => void
  onOpacityChange: (opacity: number) => void
}

/**
 * BackgroundPicker — lets the admin upload a chapter background image
 * and adjust the overlay opacity to keep the reading column readable.
 */
export default function BackgroundPicker({
  backgroundUrl,
  overlayOpacity,
  onBackgroundChange,
  onOpacityChange,
}: BackgroundPickerProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.')
      return
    }
    setUploading(true)
    try {
      const url = await uploadFile(file, 'backgrounds')
      onBackgroundChange(url)
      toast.success('Background image set!')
    } catch {
      toast.error('Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <label className="font-grotesk text-xs font-bold uppercase tracking-wide text-muted block">
        Chapter Background
      </label>

      {/* Preview */}
      {backgroundUrl && (
        <div className="relative border-3 border-ink overflow-hidden h-20">
          <img src={backgroundUrl} alt="Background" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onBackgroundChange(null)}
            className="absolute top-1 right-1 w-6 h-6 bg-soft-coral border-2 border-ink
                       text-ink text-xs flex items-center justify-center font-bold
                       hover:opacity-90"
            title="Remove background"
          >×</button>
        </div>
      )}

      {/* Upload button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full border-3 border-ink border-dashed py-2 px-3 font-grotesk text-sm
                   text-muted hover:bg-sand transition-colors disabled:opacity-60"
      >
        {uploading ? 'Uploading…' : backgroundUrl ? 'Change Background' : 'Add Background'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Opacity slider — only shown when a background is set */}
      {backgroundUrl && (
        <div>
          <label className="font-grotesk text-xs text-muted flex justify-between mb-1">
            <span>Overlay Opacity</span>
            <span>{Math.round(overlayOpacity * 100)}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={overlayOpacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="w-full accent-aurora-blue"
          />
          <div className="flex justify-between font-grotesk text-xs text-muted mt-0.5">
            <span>Clear</span>
            <span>Dark</span>
          </div>
        </div>
      )}
    </div>
  )
}
