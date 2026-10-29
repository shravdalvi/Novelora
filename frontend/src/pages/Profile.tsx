import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { toast } from '../components/ui/Toast'
import { useAuth } from '../hooks/useAuth'
import { useAuthContext } from '../context/AuthContext'
import { uploadAvatar } from '../services/uploadService'
import { auth, db } from '../services/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import { formatDate } from '../utils/formatDate'

export const Profile: React.FC = () => {
  const { user, isAdmin } = useAuth()
  const { updateUserProfile } = useAuthContext()

  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    bookmarksCount: 0,
    progressCount: 0,
    booksWrittenCount: 0,
    chaptersWrittenCount: 0,
  })

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setBio(user.bio || '')
      setAvatarUrl(user.avatarUrl || '')

      // Load user activity stats
      const loadUserStats = async () => {
        try {
          // Reader stats
          const bookmarksSnap = await getDocs(collection(db, 'users', user.uid, 'bookmarks'))
          const progressSnap = await getDocs(collection(db, 'users', user.uid, 'progress'))

          let booksCount = 0
          let chaptersCount = 0

          if (isAdmin) {
            const booksSnap = await getDocs(collection(db, 'books'))
            booksCount = booksSnap.size
            for (const b of booksSnap.docs) {
              const chSnap = await getDocs(collection(db, 'books', b.id, 'chapters'))
              chaptersCount += chSnap.size
            }
          }

          setStats({
            bookmarksCount: bookmarksSnap.size,
            progressCount: progressSnap.size,
            booksWrittenCount: booksCount,
            chaptersWrittenCount: chaptersCount,
          })
        } catch (err) {
          console.warn('Could not load user stats:', err)
        }
      }

      loadUserStats()
    }
  }, [user, isAdmin])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar image must be under 5MB.')
      return
    }

    try {
      setIsUploading(true)
      const url = await uploadAvatar(file)
      setAvatarUrl(url)
      await updateUserProfile({ avatarUrl: url })
      toast.success('Avatar updated successfully!')
    } catch (err: any) {
      console.error('Avatar upload failed:', err)
      toast.error('Could not upload avatar image.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name cannot be empty.')
      return
    }

    try {
      setIsSaving(true)
      await updateUserProfile({
        name: name.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
      })
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      console.error('Failed to save profile:', err)
      toast.error('Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    try {
      setIsSendingReset(true)
      await sendPasswordResetEmail(auth, user.email)
      toast.success(`Password reset email sent to ${user.email}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to send password reset email.')
    } finally {
      setIsSendingReset(false)
    }
  }

  if (!user) {
    return (
      <PageWrapper title="My Profile">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="font-bangers text-2xl text-ink">Please log in to view your profile.</p>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="My Profile">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Title Header */}
        <div className="border-b-3 border-ink pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-block bg-sage border-3 border-ink px-3 py-1 shadow-hard-sm mb-2">
              <span className="font-bangers text-sm tracking-comic text-ink">
                ACCOUNT CENTER
              </span>
            </div>
            <h1 className="font-bangers text-4xl sm:text-5xl tracking-comic text-ink">
              MY NOVELORA PROFILE
            </h1>
          </div>

          <div className="flex gap-3">
            {isAdmin ? (
              <Link to="/admin">
                <Button variant="primary" size="sm">
                  ADMIN DESK →
                </Button>
              </Link>
            ) : (
              <Link to="/bookshelf">
                <Button variant="secondary" size="sm">
                  MY BOOKSHELF →
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Profile Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Avatar & Quick Info Card */}
          <div className="bg-parchment border-3 border-ink shadow-hard p-6 flex flex-col items-center text-center space-y-4">
            {/* Avatar Display */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-full border-3 border-ink bg-sage shadow-hard overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bangers text-5xl text-ink select-none">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>

              {/* Upload Overlay Button */}
              <label className="mt-3 block cursor-pointer">
                <span className="inline-block font-bangers text-xs tracking-comic uppercase bg-sand border-2 border-ink px-3 py-1 shadow-hard-sm hover:bg-sage transition-colors">
                  {isUploading ? 'UPLOADING...' : 'CHANGE PHOTO'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* User Title & Badge */}
            <div>
              <h2 className="font-bangers text-2xl tracking-comic text-ink mt-1">
                {user.name}
              </h2>
              <p className="font-grotesk text-xs text-muted font-bold truncate max-w-[220px]">
                {user.email}
              </p>
              <div className="mt-2">
                <Badge variant={isAdmin ? 'yellow' : 'mint'}>
                  {isAdmin ? 'PLATFORM AUTHOR & ADMIN' : 'READER COMMUNITY'}
                </Badge>
              </div>
            </div>

            {/* Account Metadata */}
            <div className="w-full border-t-2 border-ink/20 pt-4 text-left font-grotesk text-xs space-y-2">
              <div className="flex justify-between text-muted">
                <span>Account Role:</span>
                <span className="font-bold text-ink uppercase">{user.role}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Member Since:</span>
                <span className="font-bold text-ink">
                  {user.createdAt ? formatDate(user.createdAt) : 'Active Member'}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>User ID:</span>
                <span className="font-mono text-[10px] text-ink/70 truncate max-w-[120px]">
                  {user.uid}
                </span>
              </div>
            </div>

            {/* Password Reset Action */}
            <div className="w-full pt-2">
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isSendingReset}
                className="w-full py-2 border-2 border-ink font-bangers text-xs tracking-comic bg-sand hover:bg-cedar/30/30 transition-colors shadow-hard-sm text-ink cursor-pointer disabled:opacity-60"
              >
                {isSendingReset ? 'SENDING RESET LINK...' : 'SEND PASSWORD RESET EMAIL'}
              </button>
            </div>
          </div>

          {/* Right Column: Profile Edit Form & Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Activity Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {isAdmin ? (
                <>
                  <div className="bg-sage border-3 border-ink p-4 shadow-hard">
                    <span className="font-bangers text-xs tracking-comic text-ink block mb-1">
                      PUBLISHED BOOKS
                    </span>
                    <span className="font-bangers text-3xl text-ink">
                      {stats.booksWrittenCount}
                    </span>
                  </div>
                  <div className="bg-cedar/30 border-3 border-ink p-4 shadow-hard">
                    <span className="font-bangers text-xs tracking-comic text-ink block mb-1">
                      CHAPTERS INKED
                    </span>
                    <span className="font-bangers text-3xl text-ink">
                      {stats.chaptersWrittenCount}
                    </span>
                  </div>
                  <div className="bg-cedar/40 border-3 border-ink p-4 shadow-hard col-span-2 sm:col-span-1">
                    <span className="font-bangers text-xs tracking-comic text-ink block mb-1">
                      STATUS
                    </span>
                    <span className="font-bangers text-2xl text-ink">
                      ACTIVE AUTHOR
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-sage border-3 border-ink p-4 shadow-hard">
                    <span className="font-bangers text-xs tracking-comic text-ink block mb-1">
                      BOOKMARKS
                    </span>
                    <span className="font-bangers text-3xl text-ink">
                      {stats.bookmarksCount}
                    </span>
                  </div>
                  <div className="bg-cedar/30 border-3 border-ink p-4 shadow-hard">
                    <span className="font-bangers text-xs tracking-comic text-ink block mb-1">
                      STORIES READING
                    </span>
                    <span className="font-bangers text-3xl text-ink">
                      {stats.progressCount}
                    </span>
                  </div>
                  <div className="bg-cedar/40 border-3 border-ink p-4 shadow-hard col-span-2 sm:col-span-1">
                    <span className="font-bangers text-xs tracking-comic text-ink block mb-1">
                      READING PASS
                    </span>
                    <span className="font-bangers text-2xl text-ink">
                      FREE TIER
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Profile Edit Form */}
            <div className="bg-parchment border-3 border-ink shadow-hard p-6 sm:p-8">
              <div className="inline-block bg-sand border-2 border-ink px-3 py-1 shadow-hard-sm mb-4">
                <h3 className="font-bangers text-xl tracking-comic text-ink">
                  EDIT PROFILE DETAILS
                </h3>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="font-grotesk text-xs font-bold uppercase tracking-wider text-muted block mb-1">
                    Display Name
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name or Pseudonym"
                    required
                    className="bg-sand"
                  />
                </div>

                <div>
                  <label className="font-grotesk text-xs font-bold uppercase tracking-wider text-muted block mb-1">
                    Email Address (Registered)
                  </label>
                  <Input
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-gray-100 cursor-not-allowed opacity-80"
                  />
                  <p className="font-grotesk text-[11px] text-muted mt-1">
                    Email is associated with your Firebase authentication and cannot be changed here.
                  </p>
                </div>

                <div>
                  <label className="font-grotesk text-xs font-bold uppercase tracking-wider text-muted block mb-1">
                    Bio / About You
                  </label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={
                      isAdmin
                        ? 'Share your writing background, current projects, or a note to your readers...'
                        : 'Share your favorite genres, books you love, or a quick greeting...'
                    }
                    rows={4}
                    className="bg-sand"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-2 border-ink/20">
                  <p className="font-grotesk text-xs text-muted">
                    Your display name and bio are visible to readers across story discussions.
                  </p>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={isSaving}
                  >
                    SAVE CHANGES
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default Profile

