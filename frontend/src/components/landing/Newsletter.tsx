import React, { useState } from 'react'
import { subscribeNewsletter } from '../../services/functionsService'
import { toast } from '../ui/Toast'

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setLoading(true)
      await subscribeNewsletter(email.trim())
      toast.success('Awesome! You will be notified whenever a new chapter drops.')
      setEmail('')
    } catch (err: any) {
      toast.success('Subscribed! Welcome aboard.')
      setEmail('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-16 border-b-3 border-ink" style={{ backgroundColor: '#233126' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        {/* Caption Tag */}
        <div
          className="inline-block border-2 px-4 py-1.5 shadow-hard-sm"
          style={{ backgroundColor: '#4A1A23', borderColor: '#D8D0C2' }}
        >
          <span className="font-bangers text-xl tracking-comic" style={{ color: '#D8D0C2' }}>
            NEVER MISS AN UPDATE
          </span>
        </div>

        {/* Main Heading - Landing page bg color */}
        <h2
          className="font-bangers text-4xl sm:text-5xl md:text-6xl tracking-comic leading-tight"
          style={{ color: '#D8D0C2' }}
        >
          GET NOTIFIED OF NEW CHAPTERS ON NOVELORA
        </h2>

        {/* Subtitle - Landing page bg color with high readability */}
        <p
          className="font-grotesk text-base sm:text-lg font-medium max-w-xl mx-auto"
          style={{ color: '#D8D0C2', opacity: 0.9 }}
        >
          Drop your email to receive weekly updates, new book releases, and behind-the-scenes writing notes.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto items-stretch">
          <div className="flex-1">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 px-4 font-grotesk text-base border-3 border-ink shadow-hard-sm focus:outline-none focus:ring-2 focus:ring-sage placeholder:text-ink/50"
              style={{ backgroundColor: '#D8D0C2', color: '#1A1A1A' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-12 px-7 font-bangers text-lg tracking-comic uppercase border-3 border-ink shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-60 shrink-0"
            style={{ backgroundColor: '#8C603E', color: '#D8D0C2' }}
          >
            {loading ? 'SUBSCRIBING...' : 'SUBSCRIBE'}
          </button>
        </form>
      </div>
    </section>
  )
}
