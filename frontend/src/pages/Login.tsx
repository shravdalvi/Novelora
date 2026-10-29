import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { toast } from '../components/ui/Toast'
import { useAuth } from '../hooks/useAuth'

export const Login: React.FC = () => {
  const { signIn, signInGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname
  const destination = from && from !== '/' ? from : '/library'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter both email and password')
      return
    }

    try {
      setLoading(true)
      const userCred = await signIn(email, password)
      const emailLower = userCred.email?.toLowerCase() || ''
      const isAuthor = emailLower === 'shravanidalvi70@gmail.com' || emailLower === 'shravanidalvi2606@gmail.com'
      if (isAuthor) {
        toast.success('Welcome back, Author! Opening your writing desk...')
        navigate('/admin', { replace: true })
      } else {
        toast.success('Welcome back to Novelora!')
        navigate(destination, { replace: true })
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true)
      const userCred = await signInGoogle()
      const emailLower = userCred.email?.toLowerCase() || ''
      const isAuthor = emailLower === 'shravanidalvi70@gmail.com' || emailLower === 'shravanidalvi2606@gmail.com'
      if (isAuthor) {
        toast.success('Welcome back, Author! Opening your writing desk...')
        navigate('/admin', { replace: true })
      } else {
        toast.success('Signed in with Google!')
        navigate(destination, { replace: true })
      }
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in was canceled or failed.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <PageWrapper title="Log In" noNavbar>
      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        {/* Top return brand header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-block border-2 border-ink px-3 py-1 shadow-hard-sm hover:-translate-y-0.5 transition-transform" style={{ backgroundColor: '#4A1A23' }}>
            <span className="font-bangers text-xl tracking-comic text-bone">
              NOVELORA
            </span>
          </Link>
          <Link to="/" className="font-bangers text-sm tracking-comic text-ink hover:opacity-70 transition-opacity">
            ← BACK TO HOME
          </Link>
        </div>

        <div className="border-3 border-ink shadow-hard-lg p-6 sm:p-8 space-y-6" style={{ backgroundColor: '#EDE8DF' }}>
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-block border-3 border-ink px-3 py-1 shadow-hard-sm" style={{ backgroundColor: '#8C603E' }}>
              <span className="font-bangers text-sm tracking-comic text-bone">
                MEMBER & AUTHOR ACCESS
              </span>
            </div>
            <h1 className="font-bangers text-4xl tracking-comic text-ink">
              LOG IN TO NOVELORA
            </h1>
            <p className="font-grotesk text-xs text-muted">
              Sign in to your reader library or author writing studio.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              loading={loading}
            >
              LOG IN →
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t-2 border-ink w-full" />
            <span className="bg-white px-3 font-bangers text-sm text-ink uppercase absolute">
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
            SIGN IN WITH GOOGLE
          </Button>

          {/* Footer Link */}
          <div className="text-center pt-2 border-t-2 border-ink/20">
            <p className="font-grotesk text-xs text-muted">
              Don't have an account yet?{' '}
              <Link to="/signup" className="font-bold text-ink underline hover:text-deep-sky">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default Login
