import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { uploadCover } from '../../services/uploadService'
import { saveLocalBook, updateLocalBook, getLocalBookById } from '../../services/localBooksService'
import { slugify } from '../../utils/slugify'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { AdminSidebar } from '../../components/layout/AdminSidebar'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'
import type { Book, BookStatus, BookVisibility } from '../../types'

export const BookForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [genres, setGenres] = useState('')
  const [tags, setTags] = useState('')
  const [status, setStatus] = useState<BookStatus>('ongoing')
  const [visibility, setVisibility] = useState<BookVisibility>('published')

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [uploadingCover, setUploadingCover] = useState(false)

  useEffect(() => {
    async function loadExistingBook() {
      if (!id) return
      setFetching(true)
      try {
        const docRef = doc(db, 'books', id)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          const data = snap.data() as Book
          setTitle(data.title || '')
          setSlug(data.slug || '')
          setDescription(data.description || '')
          setCoverImageUrl(data.coverImageUrl || '')
          setGenres((data.genres || []).join(', '))
          setTags((data.tags || []).join(', '))
          setStatus(data.status || 'ongoing')
          setVisibility(data.visibility || 'published')
          setFetching(false)
          return
        }
      } catch (err) {
        console.warn('Could not read book from cloud, checking local storage:', err)
      }

      const local = getLocalBookById(id)
      if (local) {
        setTitle(local.title || '')
        setSlug(local.slug || '')
        setDescription(local.description || '')
        setCoverImageUrl(local.coverImageUrl || '')
        setGenres((local.genres || []).join(', '))
        setTags((local.tags || []).join(', '))
        setStatus(local.status || 'ongoing')
        setVisibility(local.visibility || 'published')
      } else {
        toast.error('Book record not found')
      }
      setFetching(false)
    }
    loadExistingBook()
  }, [id])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTitle(val)
    if (!isEdit && !slug) {
      setSlug(slugify(val))
    }
  }

  const handleAutoSlug = () => {
    setSlug(slugify(title))
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Immediately show high-speed local preview so author sees image immediately
    const tempUrl = URL.createObjectURL(file)
    setLocalPreview(tempUrl)
    setUploadingCover(true)

    try {
      const url = await uploadCover(file)
      setCoverImageUrl(url)
      setLocalPreview(null)
      toast.success('Cover image ready!')
    } catch (err: any) {
      console.error('Cover upload error:', err)
      toast.error('Could not process image: ' + (err?.message || 'Please check file format.'))
    } finally {
      setUploadingCover(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !slug.trim()) {
      toast.error('Title and Slug are required')
      return
    }

    const parsedGenres = genres
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean)
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const finalCover = coverImageUrl.trim() || localPreview || ''

    const payload = {
      title: title.trim(),
      slug: slugify(slug.trim()),
      description: description.trim(),
      coverImageUrl: finalCover,
      genres: parsedGenres,
      tags: parsedTags,
      status,
      visibility,
    }

    try {
      setLoading(true)
      if (isEdit && id) {
        await setDoc(
          doc(db, 'books', id),
          { ...payload, updatedAt: serverTimestamp() },
          { merge: true }
        )
        updateLocalBook({ id, ...payload })
        toast.success('Book updated in database!')
      } else {
        const docRef = await addDoc(collection(db, 'books'), {
          ...payload,
          chapterCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        saveLocalBook({
          id: docRef.id,
          ...payload,
          chapterCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        toast.success('New book created in database!')
      }
      navigate('/admin/books')
    } catch (err: any) {
      console.error('Error saving book:', err)
      toast.error(err.message || 'Failed to save book')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <PageWrapper title="Loading Book Form...">
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
          <AdminSidebar />
          <div className="flex-1 p-10 font-bangers text-2xl">LOADING BOOK DATA...</div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title={isEdit ? 'Edit Book' : 'New Book'}>
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
        <AdminSidebar />

        <div className="flex-1 p-6 sm:p-10 space-y-8 bg-bone">
          {/* Header */}
          <div className="flex items-center justify-between border-b-3 border-ink pb-6">
            <div>
              <div className="inline-block bg-sage border-3 border-ink px-3 py-1 shadow-hard-sm mb-2">
                <span className="font-bangers text-sm tracking-comic text-ink">
                  {isEdit ? 'MANAGE RECORD' : 'NEW NOVEL'}
                </span>
              </div>
              <h1 className="font-bangers text-4xl sm:text-5xl tracking-comic text-ink">
                {isEdit ? `EDIT "${title || 'BOOK'}"` : 'CREATE A NEW STORY'}
              </h1>
            </div>

            <Link to="/admin/books">
              <Button variant="secondary" size="sm">
                ← CANCEL
              </Button>
            </Link>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-parchment border-3 border-ink shadow-hard-lg p-6 sm:p-8 space-y-6 max-w-3xl"
          >
            {/* Title & Slug */}
            <div className="space-y-4">
              <Input
                label="Story Title"
                placeholder="e.g. Chronicles of Avalon"
                value={title}
                onChange={handleTitleChange}
                required
              />

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="URL Slug"
                    placeholder="e.g. chronicles-of-avalon"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    helperText={`Story URL: /book/${slug || 'your-slug'}`}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAutoSlug}
                  className="mb-1"
                >
                  Generate
                </Button>
              </div>
            </div>

            {/* Description */}
            <Textarea
              label="Synopsis / Description"
              placeholder="Introduce the world, characters, and main stakes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />

            {/* Cover Image Upload / URL */}
            <div className="space-y-3">
              <label className="font-bangers tracking-comic text-base text-ink uppercase block">
                Cover Image
              </label>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Preview */}
                <div className="w-28 aspect-[2/3] border-3 border-ink bg-sand shadow-hard-sm overflow-hidden shrink-0 flex items-center justify-center">
                  {localPreview || coverImageUrl ? (
                    <img
                      src={localPreview || coverImageUrl}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bangers text-2xl text-muted">PREVIEW</span>
                  )}
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <Input
                    placeholder="Paste image URL directly (e.g. https://...)"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    helperText="Or select a local image file below to upload to Cloud Storage."
                  />
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      disabled={uploadingCover}
                      className="text-sm font-grotesk font-bold file:mr-4 file:py-2 file:px-4 file:border-2 file:border-ink file:bg-sage file:text-ink file:font-bangers file:cursor-pointer"
                    />
                    {uploadingCover && (
                      <span className="text-xs font-bold text-hunter ml-2">
                        Uploading cover...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Genres & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Genres (comma separated)"
                placeholder="Fantasy, Manga-Style, Adventure"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
              />
              <Input
                label="Tags (comma separated)"
                placeholder="Magic, Reincarnation, Cliffhanger"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            {/* Status & Visibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Publishing Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as BookStatus)}
                options={[
                  { value: 'ongoing', label: 'Ongoing (Active Releases)' },
                  { value: 'completed', label: 'Completed (Full Story Available)' },
                ]}
              />

              <Select
                label="Visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as BookVisibility)}
                options={[
                  { value: 'published', label: 'Published (Publicly Visible)' },
                  { value: 'draft', label: 'Draft (Author Only)' },
                ]}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t-3 border-ink">
              <Link to="/admin/books">
                <Button variant="secondary" size="md">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
              >
                {isEdit ? 'SAVE CHANGES' : 'CREATE BOOK'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  )
}

export default BookForm
