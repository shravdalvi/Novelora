import React, { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { VideoExtension } from '../../utils/tiptapVideo'
import { getYouTubeEmbedUrl } from '../../utils/youtube'
import { doc, getDoc, setDoc, addDoc, collection, getDocs, serverTimestamp, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { uploadChapterImage, compressDataUrlIfNeeded } from '../../services/uploadService'
import { getLocalBooks, getLocalChapterById, saveLocalChapter, deleteLocalChapter, updateLocalBook } from '../../services/localBooksService'
import { syncAuthorDataToFirestore } from '../../services/cloudSyncService'
import { useAuth } from '../../hooks/useAuth'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { toast } from '../../components/ui/Toast'
import type { Chapter, ChapterStatus, Book } from '../../types'

export const WritingStudio: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const paramBookId = searchParams.get('bookId') || ''
  const [bookId, setBookId] = useState(paramBookId)
  const [availableBooks, setAvailableBooks] = useState<Book[]>([])
  const isNew = id === 'new'
  const nextNumParam = searchParams.get('nextNumber')

  const [title, setTitle] = useState('')
  const [chapterNumber, setChapterNumber] = useState(
    nextNumParam ? parseInt(nextNumParam, 10) : 1
  )
  const [status, setStatus] = useState<ChapterStatus>('draft')
  const [wordCount, setWordCount] = useState(0)
  const [savingDraft, setSavingDraft] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const isSaving = savingDraft || publishing
  const [fetching, setFetching] = useState(!isNew)
  const { user } = useAuth()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

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
        class:
          'focus:outline-none max-w-none min-h-[500px] font-reading-sans text-base sm:text-lg leading-relaxed text-ink',
      },
    },
    content: '<p>Start writing your chapter here...</p>',
    onUpdate: ({ editor: ed }) => {
      // Calculate word count
      const text = ed.getText()
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      setWordCount(words)
      setHasUnsavedChanges(true)
    },
  })

  // Load existing chapter
  useEffect(() => {
    // 1. Fetch available books if bookId is not in URL
    const loadBooks = async () => {
      try {
        const snap = await getDocs(collection(db, 'books'))
        const cloudList = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Book[]
        const cloudIds = new Set(cloudList.map((b) => b.id))
        const localList = getLocalBooks().filter((b) => !cloudIds.has(b.id))
        const all = [...cloudList, ...localList]
        setAvailableBooks(all)
        if (!bookId && all.length > 0) {
          setBookId(all[0].id)
        }
      } catch {
        const local = getLocalBooks()
        setAvailableBooks(local)
        if (!bookId && local.length > 0) {
          setBookId(local[0].id)
        }
      }
    }
    loadBooks()
    syncAuthorDataToFirestore().catch(console.warn)
  }, [])

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
        } else {
          // Check local chapter backup
          const local = getLocalChapterById(id)
          if (local) {
            setTitle(local.title || '')
            setChapterNumber(local.chapterNumber || 1)
            setStatus(local.status || 'draft')
            setWordCount(local.wordCount || 0)
            setHeaderImageUrl(local.headerImageUrl || '')
            setHeaderVideoUrl(local.headerVideoUrl || '')
            if (editor && local.content) {
              editor.commands.setContent(local.content)
            }
          }
        }
      } catch (err) {
        // Fallback local backup on network issue
        const local = getLocalChapterById(id)
        if (local) {
          setTitle(local.title || '')
          setChapterNumber(local.chapterNumber || 1)
          setStatus(local.status || 'draft')
          setWordCount(local.wordCount || 0)
          setHeaderImageUrl(local.headerImageUrl || '')
          setHeaderVideoUrl(local.headerVideoUrl || '')
          if (editor && local.content) {
            editor.commands.setContent(local.content)
          }
        } else {
          toast.error('Failed to load chapter content')
        }
      } finally {
        setFetching(false)
      }
    }

    if (editor) {
      loadChapter()
    }
  }, [isNew, bookId, id, editor])

  // Recursively compress any oversized base64 images inside editor content before saving to Firestore
  const sanitizeContentImages = async (node: any): Promise<any> => {
    if (!node || typeof node !== 'object') return node

    if (node.type === 'image' && node.attrs?.src && typeof node.attrs.src === 'string') {
      const src = node.attrs.src as string
      if (src.startsWith('data:image/')) {
        try {
          const compressed = await compressDataUrlIfNeeded(src)
          return {
            ...node,
            attrs: {
              ...node.attrs,
              src: compressed,
            },
          }
        } catch {
          return node
        }
      }
    }

    if (Array.isArray(node.content)) {
      const sanitizedChildren = await Promise.all(node.content.map(sanitizeContentImages))
      return { ...node, content: sanitizedChildren }
    }

    return node
  }

  // Helper to re-count published chapters and keep book.chapterCount in exact sync
  const syncBookChapterCount = async (targetBookId: string) => {
    try {
      const pubSnap = await getDocs(
        query(
          collection(db, 'books', targetBookId, 'chapters'),
          where('status', '==', 'published')
        )
      )
      const exactCount = pubSnap.size
      await updateDoc(doc(db, 'books', targetBookId), {
        chapterCount: exactCount,
        updatedAt: serverTimestamp(),
      }).catch(console.warn)
      updateLocalBook({ id: targetBookId, chapterCount: exactCount })
    } catch (e) {
      console.warn('Could not sync exact book chapterCount:', e)
    }
  }

  // Save function executed ONLY when author explicitly clicks "SAVE DRAFT" or "PUBLISH NOW"
  const handleSave = async (overrideStatus?: ChapterStatus) => {
    if (!bookId) {
      toast.error('Please select a target novel before saving the chapter')
      return
    }

    const finalStatus = overrideStatus || status
    const rawContentJson = editor ? editor.getJSON() : {}
    const contentJson = await sanitizeContentImages(rawContentJson)
    const text = editor ? editor.getText() : ''
    const calculatedWords = text.trim() ? text.trim().split(/\s+/).length : 0

    const payload = {
      bookId,
      authorId: user?.uid || '',
      authorEmail: user?.email || '',
      title: title.trim() || `Chapter ${chapterNumber}`,
      chapterNumber,
      content: contentJson,
      headerImageUrl: headerImageUrl.trim() || '',
      headerVideoUrl: headerVideoUrl.trim() || '',
      overlayOpacity: 0.3,
      status: finalStatus,
      wordCount: calculatedWords,
    }

    // Guard against Firestore 1MB document limit
    const payloadSize = JSON.stringify(payload).length
    if (payloadSize > 950_000) {
      toast.error('Chapter content is too large (>950KB). Please remove or replace heavy images.')
      return
    }

    if (currentChapterIdRef.current === 'new') {
      try {
        // Ensure parent book exists in Firestore so queries succeed everywhere
        try {
          const bookRef = doc(db, 'books', bookId)
          const bookSnap = await getDoc(bookRef)
          if (!bookSnap.exists()) {
            const localBook = getLocalBooks().find((b) => b.id === bookId)
            if (localBook) {
              await setDoc(
                bookRef,
                {
                  ...localBook,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              )
            }
          }
        } catch (e) {
          console.warn('Book check notice:', e)
        }

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
        saveLocalChapter({
          id: docRef.id,
          ...payload,
          likeCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

        if (finalStatus === 'published') {
          syncBookChapterCount(bookId)
        }

        setHasUnsavedChanges(false)
        setLastSaved(new Date())
        toast.success(finalStatus === 'published' ? 'Chapter published to database!' : 'Draft saved to database!')
        navigate(`/admin/chapters/${docRef.id}/edit?bookId=${bookId}`, { replace: true })
      } catch (err: any) {
        console.error('Failed to create chapter in Firestore, saving local backup:', err)
        const localId = `chapter-${Date.now()}`
        currentChapterIdRef.current = localId
        saveLocalChapter({
          id: localId,
          ...payload,
          likeCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        setHasUnsavedChanges(false)
        setLastSaved(new Date())
        if (err.code === 'permission-denied') {
          toast.info('Draft saved locally. Note: Update Firestore rules in Firebase Console to sync cloud.')
        } else {
          toast.success(finalStatus === 'published' ? 'Chapter published locally!' : 'Draft saved locally!')
        }
        navigate(`/admin/chapters/${localId}/edit?bookId=${bookId}`, { replace: true })
      }
    } else {
      const chapterId = currentChapterIdRef.current!
      try {
        // Also persist locally
        saveLocalChapter({
          id: chapterId,
          ...payload,
          likeCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

        // Ensure parent book exists in Firestore
        try {
          const bookRef = doc(db, 'books', bookId)
          const bookSnap = await getDoc(bookRef)
          if (!bookSnap.exists()) {
            const localBook = getLocalBooks().find((b) => b.id === bookId)
            if (localBook) {
              await setDoc(
                bookRef,
                {
                  ...localBook,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              )
            }
          }
        } catch (e) {
          console.warn('Parent book check:', e)
        }

        // Always save to Firestore
        await setDoc(
          doc(db, 'books', bookId, 'chapters', chapterId),
          {
            ...payload,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )

        if (finalStatus === 'published') {
          syncBookChapterCount(bookId)
        }

        setHasUnsavedChanges(false)
        setLastSaved(new Date())
        toast.success(finalStatus === 'published' ? 'Chapter published to database!' : 'Draft saved to database!')
      } catch (err: any) {
        console.error('Failed to update chapter in Firestore:', err)
        setHasUnsavedChanges(false)
        setLastSaved(new Date())
        toast.success('Draft saved locally!')
      }
    }
  }

  const handleDeleteChapter = async () => {
    if (isNew || !bookId || !id) return
    const isLocalOnly = id.startsWith('chapter-')
    try {
      setDeleting(true)
      deleteLocalChapter(id)
      if (!isLocalOnly) {
        await deleteDoc(doc(db, 'books', bookId, 'chapters', id)).catch(console.warn)
      }
      await syncBookChapterCount(bookId)
      toast.success(isLocalOnly ? 'Draft removed' : 'Chapter deleted from database')
      navigate(`/admin/books/${bookId}/chapters`)
    } catch (err: any) {
      deleteLocalChapter(id)
      toast.info('Chapter removed locally')
      navigate(`/admin/books/${bookId}/chapters`)
    } finally {
      setDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }

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

  const handleSaveDraft = async () => {
    if (isSaving) return
    try {
      setSavingDraft(true)
      setStatus('draft')
      await handleSave('draft')
    } finally {
      setSavingDraft(false)
    }
  }

  const handleManualPublish = async () => {
    if (isSaving) return
    try {
      setPublishing(true)
      setStatus('published')
      await handleSave('published')
    } finally {
      setPublishing(false)
    }
  }

  const currentBook = availableBooks.find((b) => b.id === bookId)
  const totalChaptersCount = Math.max(currentBook?.chapterCount || 1, chapterNumber)

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

            {/* Save Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-parchment border-2 border-ink text-xs font-grotesk font-bold">
              {isSaving && (
                <span className="text-muted animate-pulse">
                  ● {publishing ? 'Publishing...' : 'Saving draft...'}
                </span>
              )}
              {!isSaving && hasUnsavedChanges && (
                <span className="text-muted">
                  ● Unsaved edits (Click Save Draft)
                </span>
              )}
              {!isSaving && !hasUnsavedChanges && lastSaved && (
                <span className="text-cedar">
                  ✓ Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {!isSaving && !hasUnsavedChanges && !lastSaved && (
                <span className="text-muted">
                  {isNew ? 'New Chapter (Unsaved)' : 'Saved'}
                </span>
              )}
            </div>

            <span className="text-xs font-grotesk font-bold text-muted">
              {wordCount} words
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isNew && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isSaving || deleting}
              >
                DELETE CHAPTER
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveDraft}
              loading={savingDraft}
              disabled={isSaving || deleting}
            >
              SAVE DRAFT
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleManualPublish}
              loading={publishing}
              disabled={isSaving || deleting}
            >
              PUBLISH NOW
            </Button>
          </div>
        </header>

        {/* Studio Meta Form */}
        <div className="max-w-4xl mx-auto w-full px-4 pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-parchment border-3 border-ink shadow-hard-sm p-4">
            <div className="sm:col-span-4">
              <Select
                label="Target Novel"
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                options={
                  availableBooks.length > 0
                    ? availableBooks.map((b) => ({ value: b.id, label: b.title }))
                    : [{ value: bookId, label: 'Default Novel' }]
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Chapter #"
                type="number"
                value={chapterNumber}
                onChange={(e) => setChapterNumber(parseInt(e.target.value, 10) || 1)}
                min={1}
                required
              />
            </div>
            <div className="sm:col-span-4">
              <Input
                label="Chapter Title"
                placeholder="e.g. The Awakening"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
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

          {/* Manuscript Canvas (Formatted Chapter Layout matching Reader View) */}
          <div className="bg-parchment border-3 border-ink shadow-hard-lg px-6 py-8 sm:px-12 sm:py-12 mb-16 min-h-[700px] relative">
            {/* ── BREADCRUMB BAR (Matching Reader layout) ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b-2 border-ink/20 text-xs font-grotesk font-bold select-none">
              <div className="flex items-center gap-2">
                <Link
                  to={bookId ? `/admin/books/${bookId}/chapters` : '/admin/books'}
                  className="hover:underline flex items-center gap-1 text-ink"
                >
                  ← {currentBook?.title || 'Selected Novel'}
                </Link>
                <Link
                  to={bookId ? `/admin/books/${bookId}/chapters` : '/admin/books'}
                  className="hover:underline opacity-60 hover:opacity-100 hidden sm:inline text-ink"
                >
                  / Manage Chapters
                </Link>
              </div>

              <div className="flex items-center gap-3 text-ink">
                <span>
                  Chapter {chapterNumber} of {totalChaptersCount}
                </span>
              </div>
            </div>

            {/* ── CHAPTER BRANDING HEADER (Matching Reader layout) ── */}
            <header className="mb-10 text-center space-y-3">
              {/* Centered CHAPTER badge */}
              <div className="inline-block bg-sage text-ink border-2 border-ink px-4 py-1 font-bangers text-sm sm:text-base shadow-hard-sm uppercase tracking-wider">
                CHAPTER {chapterNumber}
              </div>

              {/* Centered Comic Title (Clickable & Editable directly) */}
              <div className="w-full">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setHasUnsavedChanges(true)
                  }}
                  placeholder="UNTITLED CHAPTER"
                  className="font-bangers text-4xl sm:text-5xl md:text-6xl tracking-comic leading-tight text-ink text-center uppercase bg-transparent border-b-2 border-transparent hover:border-ink/25 focus:border-ink focus:outline-none w-full max-w-3xl mx-auto placeholder:text-ink/30 transition-all cursor-text"
                  title="Click to edit chapter title"
                />
              </div>

              {/* Live dynamic word count */}
              <p className="text-xs sm:text-sm font-grotesk font-bold text-ink/75">
                Approx. {wordCount} words
              </p>

              {/* Header Banner controls */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <label className="text-[11px] font-bangers text-ink bg-parchment hover:bg-sage border-2 border-ink px-2.5 py-1 shadow-hard-sm cursor-pointer transition-colors">
                  {headerImageUrl ? 'CHANGE BANNER IMAGE' : '+ ADD HEADER PHOTO'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        try {
                          const url = await uploadChapterImage(f)
                          setHeaderImageUrl(url)
                          setHasUnsavedChanges(true)
                          toast.success('Header image attached!')
                        } catch {
                          toast.error('Failed to upload image')
                        }
                      }
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const url = window.prompt(
                      'Enter YouTube or MP4 Video URL for Chapter Banner:',
                      headerVideoUrl
                    )
                    if (url !== null) {
                      setHeaderVideoUrl(url.trim())
                      setHasUnsavedChanges(true)
                    }
                  }}
                  className="text-[11px] font-bangers text-ink bg-parchment hover:bg-sage border-2 border-ink px-2.5 py-1 shadow-hard-sm transition-colors"
                >
                  {headerVideoUrl ? 'CHANGE HEADER VIDEO' : '+ ADD HEADER VIDEO'}
                </button>
              </div>
            </header>

            {/* Header Media Banner Preview (Photo or Video) */}
            {headerImageUrl && (
              <div className="mb-10 border-3 border-ink shadow-hard-lg overflow-hidden bg-sand max-h-[480px] relative group">
                <img
                  src={headerImageUrl}
                  alt={title || 'Chapter header'}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setHeaderImageUrl('')
                    setHasUnsavedChanges(true)
                  }}
                  className="absolute top-3 right-3 px-2.5 py-1 bg-crimson text-white font-bangers text-xs border-2 border-ink shadow-hard-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  REMOVE BANNER
                </button>
              </div>
            )}

            {headerVideoUrl && (
              <div className="mb-10 border-3 border-ink shadow-hard-lg aspect-video overflow-hidden bg-black relative group">
                {getYouTubeEmbedUrl(headerVideoUrl) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(headerVideoUrl)!}
                    title={title || 'Chapter video'}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={headerVideoUrl}
                    controls
                    className="w-full h-full"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setHeaderVideoUrl('')
                    setHasUnsavedChanges(true)
                  }}
                  className="absolute top-3 right-3 px-2.5 py-1 bg-crimson text-white font-bangers text-xs border-2 border-ink shadow-hard-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  REMOVE VIDEO
                </button>
              </div>
            )}

            {/* Subtle Divider before text content */}
            <div className="border-b-2 border-ink/20 mb-8" />

            {/* ── EDITOR BODY WITH FLOATING INLINE MENU ── */}
            <div className="relative pl-12 sm:pl-14">
              {/* ── FLOATING MENU (Vertical column on each Enter / empty line - Image 2) ── */}
              {editor && (
                <FloatingMenu
                  editor={editor}
                  tippyOptions={{
                    duration: 150,
                    placement: 'left',
                    offset: [0, 14],
                    popperOptions: {
                      modifiers: [
                        {
                          name: 'preventOverflow',
                          options: {
                            padding: 12,
                            boundary: 'clippingParents',
                          },
                        },
                      ],
                    },
                  }}
                  className="flex flex-col items-center gap-1.5 select-none z-40 bg-sand/80 backdrop-blur-sm border border-ink/30 shadow-sm p-1 rounded-md"
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

        {/* Delete Chapter Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="CONFIRM DELETION"
        >
          <div className="space-y-4">
            <p className="font-grotesk text-sm text-ink">
              Are you sure you want to permanently delete{' '}
              <strong>Chapter {chapterNumber}: "{title || 'Untitled'}"</strong>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-ink">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
              >
                CANCEL
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteChapter}
                loading={deleting}
              >
                DELETE PERMANENTLY
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageWrapper>
  )
}

export default WritingStudio
