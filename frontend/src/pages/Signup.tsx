import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { toast } from '../components/ui/Toast'
import { useAuth } from '../hooks/useAuth'

export const Signup: React.FC = () => {
  const { signUp, signInGoogle } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email || !password) {
      toast.error('Please fill in all required fields')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      await signUp(email, password, name)
      toast.success('Account created! Welcome to Novelora.')
      navigate('/library', { replace: true })
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true)
      await signInGoogle()
      toast.success('Signed in with Google!')
      navigate('/library', { replace: true })
    } catch (err: any) {
      toast.error(err.message || 'Google registration was canceled or failed.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <PageWrapper title="Sign Up" noNavbar>
      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        {/* Top return brand header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-block bg-sage border-2 border-ink px-3 py-1 shadow-hard-sm hover:-translate-y-0.5 transition-transform">
            <span className="font-bangers text-xl tracking-comic text-ink">
              NOVELORA
            </span>
          </Link>
          <Link to="/" className="font-bangers text-sm tracking-comic text-ink hover:text-hunter">
            ← BACK TO HOME
          </Link>
        </div>

        <div className="bg-parchment border-3 border-ink shadow-hard-lg p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-block bg-sage border-3 border-ink px-3 py-1 shadow-hard-sm">
              <span className="font-bangers text-sm tracking-comic text-ink">
                JOIN THE AUDIENCE
              </span>
            </div>
            <h1 className="font-bangers text-4xl tracking-comic text-ink">
              CREATE YOUR ACCOUNT
            </h1>
            <p className="font-grotesk text-xs text-muted">
              Get access to every chapter, save reading progress, and enter your library dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Your Name / Pen Name"
              type="text"
              placeholder="e.g. Luna Reader"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="reader@novelora.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password (min. 6 chars)"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              loading={loading}
            >
              CREATE ACCOUNT & ENTER LIBRARY →
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t-2 border-ink w-full" />
            <span className="bg-parchment px-3 font-bangers text-sm text-ink uppercase absolute">
              OR
            </span>
          </div>

          {/* Google Button */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full"
            loading={googleLoading}
            onClick={handleGoogleSignIn}
          >
            SIGN UP WITH GOOGLE
          </Button>

          {/* Footer Link */}
          <div className="text-center pt-2 border-t-2 border-ink/20">
            <p className="font-grotesk text-xs text-muted">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-ink underline hover:text-hunter">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default Signup
