import React, { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { adminCreateChapter, adminUpdateChapter } from '../../services/functionsService'
import { uploadChapterImage } from '../../services/uploadService'
import { useAutoSave } from '../../hooks/useAutoSave'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
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
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
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
      overlayOpacity: 0.3,
      status: finalStatus,
      wordCount: calculatedWords,
    }

    if (currentChapterIdRef.current === 'new') {
      try {
        const res = await adminCreateChapter(payload)
        currentChapterIdRef.current = res.id
        toast.success('Chapter saved!')
        navigate(`/admin/chapters/${res.id}/edit?bookId=${bookId}`, { replace: true })
      } catch {
        // Direct fallback
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
        toast.success('Chapter created!')
        navigate(`/admin/chapters/${docRef.id}/edit?bookId=${bookId}`, { replace: true })
      }
    } else {
      const chapterId = currentChapterIdRef.current!
      try {
        await adminUpdateChapter({ id: chapterId, ...payload })
      } catch {
        // Direct fallback
        await setDoc(
          doc(db, 'books', bookId, 'chapters', chapterId),
          {
            ...payload,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      }
    }
  }

  // Hook up Auto-Save
  const autoSavePayload = {
    title,
    chapterNumber,
    status,
    content: editor?.getJSON(),
  }

  const { status: autoSaveStatus, lastSaved } = useAutoSave(
    autoSavePayload,
    () => handleSave(),
    5000
  )

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

          {/* Manuscript Canvas */}
          <div className="bg-parchment border-3 border-ink shadow-hard-lg p-8 sm:p-12 mb-16 min-h-[600px]">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default WritingStudio
