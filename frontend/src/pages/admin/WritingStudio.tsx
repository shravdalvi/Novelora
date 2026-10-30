import React, { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { VideoExtension } from '../../utils/tiptapVideo'
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, updateDoc, increment } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { uploadChapterImage } from '../../services/uploadService'
import { useAutoSave } from '../../hooks/useAutoSave'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { toast } from '../../components/ui/Toast'
import type { Chapter, ChapterStatus } from '../../types'

export const WritingStudio: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const bookId = searchParams.get('bookId') || ''
  const isNew = id === 'new'
  const nextNumParam = searchParams.get('nextNumber')

  const [title, setTitle] = useState('')
  const [chapterNumber, setChapterNumber] = useState(
    nextNumParam ? parseInt(nextNumParam, 10) : 1
  )
  const [status, setStatus] = useState<ChapterStatus>('draft')
  const [wordCount, setWordCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!isNew)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Chapter Header Media (Photo & Video like Wattpad)
  const [headerImageUrl, setHeaderImageUrl] = useState<string>('')
  const [headerVideoUrl, setHeaderVideoUrl] = useState<string>('')
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [videoInputUrl, setVideoInputUrl] = useState('')
  const inlineImageInputRef = useRef<HTMLInputElement>(null)

  const currentChapterIdRef = useRef(id)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      VideoExtension,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    editorProps: {
      attributes: {
        class: 'focus:outline-none max-w-none min-h-[500px]',
      },
    },
    content: '<p>Start writing your chapter here...</p>',
    onUpdate: ({ editor: ed }) => {
      // Calculate word count
      const text = ed.getText()
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      setWordCount(words)
    },
  })

  // Load existing chapter
  useEffect(() => {
    async function loadChapter() {
      if (isNew || !bookId || !id) return
      setFetching(true)

      try {
        const chapterRef = doc(db, 'books', bookId, 'chapters', id)
        const snap = await getDoc(chapterRef)

        if (snap.exists()) {
          const data = snap.data() as Chapter
          setTitle(data.title || '')
          setChapterNumber(data.chapterNumber || 1)
          setStatus(data.status || 'draft')
          setWordCount(data.wordCount || 0)
          setHeaderImageUrl(data.headerImageUrl || '')
          setHeaderVideoUrl(data.headerVideoUrl || '')

          if (editor && data.content) {
            editor.commands.setContent(data.content)
          }
        }
      } catch (err) {
        toast.error('Failed to load chapter content')
      } finally {
        setFetching(false)
      }
    }

    if (editor) {
      loadChapter()
    }
  }, [isNew, bookId, id, editor])

  // Save function for auto-save and manual saves
  const handleSave = async (overrideStatus?: ChapterStatus) => {
    if (!bookId) {
      toast.error('Missing bookId')
      return
    }

    const finalStatus = overrideStatus || status
    const contentJson = editor ? editor.getJSON() : {}
    const text = editor ? editor.getText() : ''
    const calculatedWords = text.trim() ? text.trim().split(/\s+/).length : 0

    const payload = {
      bookId,
      title: title.trim() || `Chapter ${chapterNumber}`,
      chapterNumber,
      content: contentJson,
      headerImageUrl: headerImageUrl.trim() || '',
      headerVideoUrl: headerVideoUrl.trim() || '',
      overlayOpacity: 0.3,
      status: finalStatus,
      wordCount: calculatedWords,
    }

    if (currentChapterIdRef.current === 'new') {
      try {
        const docRef = await addDoc(
          collection(db, 'books', bookId, 'chapters'),
          {
            ...payload,
            likeCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        )
        currentChapterIdRef.current = docRef.id
        if (finalStatus === 'published') {
          await updateDoc(doc(db, 'books', bookId), {
            chapterCount: increment(1),
            updatedAt: serverTimestamp(),
          }).catch(console.warn)
        }
        toast.success(finalStatus === 'published' ? 'Chapter published to database!' : 'Chapter created!')
        navigate(`/admin/chapters/${docRef.id}/edit?bookId=${bookId}`, { replace: true })
      } catch (err: any) {
        console.error('Failed to create chapter in Firestore:', err)
        toast.error(err.message || 'Failed to save chapter to database')
      }
    } else {
      const chapterId = currentChapterIdRef.current!
      try {
        await setDoc(
          doc(db, 'books', bookId, 'chapters', chapterId),
          {
            ...payload,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
        toast.success(finalStatus === 'published' ? 'Chapter published to database!' : 'Draft saved to database!')
      } catch (err: any) {
        console.error('Failed to update chapter in Firestore:', err)
        toast.error(err.message || 'Failed to update chapter in database')
      }
    }
  }

  // Hook up Auto-Save
  const autoSavePayload = {
    title,
    chapterNumber,
    status,
    headerImageUrl,
    headerVideoUrl,
    content: editor?.getJSON(),
  }

  const { status: autoSaveStatus, lastSaved } = useAutoSave(
    autoSavePayload,
    () => handleSave(),
    5000
  )

  const handleSaveVideoUrl = () => {
    if (!videoInputUrl.trim() || !editor) {
      toast.error('Please enter a video URL')
      return
    }
    const cleanUrl = videoInputUrl.trim()
    editor.chain().focus().setVideo({ src: cleanUrl }).run()
    setIsVideoModalOpen(false)
    setVideoInputUrl('')
    toast.success('Video inserted into chapter!')
  }

  const handleInsertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    try {
      setUploadingImage(true)
      const url = await uploadChapterImage(file)
      editor.chain().focus().setImage({ src: url }).run()
      toast.success('Image inserted into story!')
    } catch {
      toast.error('Failed to upload chapter image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleManualPublish = async () => {
    try {
      setLoading(true)
      setStatus('published')
      await handleSave('published')
      toast.success('Chapter published live!')
    } catch {
      toast.error('Failed to publish chapter')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <PageWrapper title="Loading Writing Studio...">
        <div className="p-12 text-center font-bangers text-3xl">
          PREPARING MANUSCRIPT...
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Writing Studio" noFooter>
      <div className="min-h-screen bg-bone flex flex-col">
        {/* Studio Top Control Bar */}
        <header className="sticky top-16 z-30 bg-parchment border-b-3 border-ink px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to={`/admin/books/${bookId}/chapters`}
              className="px-3 py-1.5 border-2 border-ink bg-parchment font-bangers text-sm text-ink shadow-hard-sm hover:bg-sage"
            >
              ← CHAPTERS
            </Link>

            {/* AutoSave Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-parchment border-2 border-ink text-xs font-grotesk font-bold">
              {autoSaveStatus === 'saving' && (
                <span className="text-muted animate-pulse">● Saving...</span>
              )}
              {autoSaveStatus === 'saved' && (
                <span className="text-cedar">
                  ✓ Saved {lastSaved ? lastSaved.toLocaleTimeString() : ''}
                </span>
              )}
              {autoSaveStatus === 'error' && (
                <span className="text-soft-coral">✕ Error saving</span>
              )}
              {autoSaveStatus === 'idle' && (
                <span className="text-muted">Draft ready</span>
              )}
            </div>

            <span className="text-xs font-grotesk font-bold text-muted">
              {wordCount} words
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSave('draft')}
              loading={loading}
            >
              SAVE DRAFT
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleManualPublish}
              loading={loading}
            >
              PUBLISH NOW
            </Button>
          </div>
        </header>

        {/* Studio Meta Form */}
        <div className="max-w-4xl mx-auto w-full px-4 pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-parchment border-3 border-ink shadow-hard-sm p-4">
            <div className="sm:col-span-3">
              <Input
                label="Chapter #"
                type="number"
                value={chapterNumber}
                onChange={(e) => setChapterNumber(parseInt(e.target.value, 10) || 1)}
                min={1}
                required
              />
            </div>
            <div className="sm:col-span-6">
              <Input
                label="Chapter Title"
                placeholder="e.g. The Awakening"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-3">
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ChapterStatus)}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Published' },
                ]}
              />
            </div>
          </div>

          {/* TipTap Toolbar */}
          {editor && (
            <div className="bg-parchment border-3 border-ink shadow-hard-sm p-2 flex flex-wrap items-center gap-1.5 select-none">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`w-8 h-8 border-2 border-ink font-bold text-sm text-ink ${
                  editor.isActive('bold') ? 'bg-sage' : 'bg-sand hover:bg-sage/30'
                }`}
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`w-8 h-8 border-2 border-ink italic font-bold text-sm text-ink ${
                  editor.isActive('italic') ? 'bg-sage' : 'bg-sand hover:bg-sage/30'
                }`}
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`w-8 h-8 border-2 border-ink underline font-bold text-sm text-ink ${
                  editor.isActive('underline') ? 'bg-sage' : 'bg-sand hover:bg-sage/30'
                }`}
                title="Underline"
              >
                U
              </button>

              <div className="w-[2px] h-6 bg-ink mx-1" />

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`px-2.5 h-8 border-2 border-ink font-bangers text-base text-ink ${
                  editor.isActive('heading', { level: 1 }) ? 'bg-sage' : 'bg-sand hover:bg-sage/30'
                }`}
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`px-2.5 h-8 border-2 border-ink font-bangers text-base text-ink ${
                  editor.isActive('heading', { level: 2 }) ? 'bg-sage' : 'bg-sand hover:bg-sage/30'
                }`}
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`px-2.5 h-8 border-2 border-ink font-bangers text-base text-ink ${
                  editor.isActive('heading', { level: 3 }) ? 'bg-sage' : 'bg-sand hover:bg-sage/30'
                }`}
              >
                H3
              </button>

              <div className="w-[2px] h-6 bg-ink mx-1" />

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`px-2 h-8 border-2 border-ink font-bold text-xs text-ink ${
                  editor.isActive('blockquote') ? 'bg-sage' : 'bg-sand hover:bg-sage/30'
                }`}
                title="Blockquote"
              >
                “ ”
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`w-8 h-8 border-2 border-ink font-bold text-xs text-ink ${
                  editor.isActive('bulletList') ? 'bg-sage' : 'bg-sand hover:bg-sage/30'
                }`}
                title="Bullet List"
              >
                •—
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`w-8 h-8 border-2 border-ink font-bold text-xs text-ink ${
                  editor.isActive('orderedList') ? 'bg-sage' : 'bg-sand hover:bg-sage/30'
                }`}
                title="Numbered List"
              >
                1.
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                className="px-2 h-8 border-2 border-ink font-bold text-xs text-ink bg-sand hover:bg-sage/30"
                title="Scene Divider (✦ ✦ ✦)"
              >
                ✦✦✦
              </button>

              <div className="w-[2px] h-6 bg-ink mx-1" />

              {/* Text Align */}
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`w-8 h-8 border-2 border-ink text-xs text-ink ${
                  editor.isActive({ textAlign: 'left' }) ? 'bg-sage' : 'bg-sand hover:bg-sage/30'
                }`}
              >
                ⇤
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`w-8 h-8 border-2 border-ink text-xs text-ink ${
                  editor.isActive({ textAlign: 'center' }) ? 'bg-sage' : 'bg-sand hover:bg-sage/30'
                }`}
              >
                ≡
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`w-8 h-8 border-2 border-ink text-xs text-ink ${
                  editor.isActive({ textAlign: 'right' }) ? 'bg-sage' : 'bg-sand hover:bg-sage/30'
                }`}
              >
                ⇥
              </button>

              <div className="w-[2px] h-6 bg-ink mx-1" />

              {/* Inline Illustration Upload */}
              <label className="h-8 px-2.5 border-2 border-ink bg-sage font-bangers text-xs text-ink flex items-center cursor-pointer shadow-hard-sm hover:bg-parchment transition-colors">
                <span>+IMAGE</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleInsertImage}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
              {uploadingImage && (
                <span className="text-xs font-bold text-hunter">Uploading...</span>
              )}
            </div>
          )}

          {/* Floating Bubble Menu on text selection (Image 1) */}
          {editor && (
            <BubbleMenu
              editor={editor}
              tippyOptions={{
                duration: 150,
                placement: 'top',
                offset: [0, 10],
              }}
              className="relative flex items-center bg-[#282726] border-2 border-ink rounded-lg shadow-2xl p-1.5 gap-1 z-50 text-bone select-none"
            >
              {/* Bold */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`w-8 h-8 rounded flex items-center justify-center font-bold text-base transition-colors ${
                  editor.isActive('bold')
                    ? 'bg-[#00a8a8] text-white shadow-sm'
                    : 'text-[#00c4c4] hover:bg-white/10'
                }`}
                title="Bold"
              >
                B
              </button>

              {/* Italic */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`w-8 h-8 rounded flex items-center justify-center italic font-serif font-bold text-base transition-colors ${
                  editor.isActive('italic')
                    ? 'bg-[#00a8a8] text-white shadow-sm'
                    : 'text-[#00c4c4] hover:bg-white/10'
                }`}
                title="Italic"
              >
                I
              </button>

              {/* Underline */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`w-8 h-8 rounded flex items-center justify-center underline font-bold text-base transition-colors ${
                  editor.isActive('underline')
                    ? 'bg-[#00a8a8] text-white shadow-sm'
                    : 'text-[#00c4c4] hover:bg-white/10'
                }`}
                title="Underline"
              >
                U
              </button>

              <div className="w-[1.5px] h-5 bg-white/20 mx-1" />

              {/* Align Left */}
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                  editor.isActive({ textAlign: 'left' })
                    ? 'bg-[#00a8a8] text-white shadow-sm'
                    : 'text-[#00c4c4] hover:bg-white/10'
                }`}
                title="Align Left"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M3 5h18v2H3V5zm0 4h12v2H3V9zm0 4h18v2H3v-2zm0 4h12v2H3v-2z" />
                </svg>
              </button>

              {/* Align Center */}
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                  editor.isActive({ textAlign: 'center' })
                    ? 'bg-[#00a8a8] text-white shadow-sm'
                    : 'text-[#00c4c4] hover:bg-white/10'
                }`}
                title="Align Center"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M3 5h18v2H3V5zm3 4h12v2H6V9zm-3 4h18v2H3v-2zm3 4h12v2H6v-2z" />
                </svg>
              </button>

              {/* Align Right */}
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                  editor.isActive({ textAlign: 'right' })
                    ? 'bg-[#00a8a8] text-white shadow-sm'
                    : 'text-[#00c4c4] hover:bg-white/10'
                }`}
                title="Align Right"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M3 5h18v2H3V5zm6 4h12v2H9V9zm-6 4h18v2H3v-2zm6 4h12v2H9v-2z" />
                </svg>
              </button>

              {/* Downward indicator arrow */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#282726] rotate-45 border-r-2 border-b-2 border-ink pointer-events-none" />
            </BubbleMenu>
          )}

          {/* Manuscript Canvas */}
          <div className="bg-parchment border-3 border-ink shadow-hard-lg pl-14 pr-8 py-8 sm:pl-16 sm:pr-12 sm:py-12 mb-16 min-h-[600px] relative">
            {/* ── FLOATING MENU (Vertical column on each Enter / empty line - Image 2) ── */}
            {editor && (
              <FloatingMenu
                editor={editor}
                tippyOptions={{
                  duration: 150,
                  placement: 'left',
                  offset: [0, 10],
                }}
                className="flex flex-col items-center gap-1.5 select-none z-40 bg-transparent py-0.5"
              >
                {/* Photo Icon (Image 2) */}
                <button
                  type="button"
                  onClick={() => inlineImageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-7 h-7 rounded hover:bg-ink/10 flex items-center justify-center text-ink/65 hover:text-ink transition-colors cursor-pointer"
                  title="Insert Photo"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                </button>

                {/* Video Icon (Image 2) */}
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="w-7 h-7 rounded hover:bg-ink/10 flex items-center justify-center text-ink/65 hover:text-ink transition-colors cursor-pointer"
                  title="Insert Video"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                  </svg>
                </button>
              </FloatingMenu>
            )}

            {/* Hidden File Picker for inline photo upload */}
            <input
              ref={inlineImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleInsertImage}
              disabled={uploadingImage}
              className="hidden"
            />

            {/* TipTap Editor Content */}
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Video URL Modal */}
        <Modal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          title="INSERT VIDEO"
          isConfirm
          confirmText="INSERT VIDEO"
          onConfirm={handleSaveVideoUrl}
        >
          <div className="space-y-4">
            <p className="font-grotesk text-sm">
              Paste a YouTube video link or direct MP4 URL to insert into this chapter:
            </p>
            <Input
              placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
              value={videoInputUrl}
              onChange={(e) => setVideoInputUrl(e.target.value)}
              autoFocus
            />
          </div>
        </Modal>
      </div>
    </PageWrapper>
  )
}

export default WritingStudio
