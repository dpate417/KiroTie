import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiPost } from '@/api/client'

/**
 * Mock ASU SSO login page.
 * Req 1.1, 1.2, 1.3, 1.4, 1.5
 */
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await apiPost('/auth/login', { email })
      const { token, role } = res.data
      sessionStorage.setItem('token', token)
      sessionStorage.setItem('role', role)
      navigate(role === 'organizer' ? '/dashboard' : '/calendar')
    } catch (err) {
      // Surface the error message from the API response if available
      let message = 'Login failed. Please try again.'
      try {
        const body = await err.response?.json()
        if (body?.error) message = body.error
      } catch {
        // ignore parse errors
      }
      if (err.status === 400 || err.status === 401) {
        message = 'Please use a valid @asu.edu email address.'
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">EventWise</h1>
          <p className="text-sm text-muted-foreground">Sign in with your ASU email</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="you@asu.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              aria-label="ASU email address"
            />
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        {/* Demo accounts */}
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Demo accounts</p>
          {[
            { email: 'organizer@asu.edu', role: 'Organizer', dest: '/dashboard' },
            { email: 'student@asu.edu',   role: 'Student',   dest: '/calendar'  },
          ].map(({ email: demoEmail, role, dest }) => (
            <button
              key={demoEmail}
              type="button"
              onClick={() => setEmail(demoEmail)}
              className="w-full flex items-center justify-between rounded-md bg-white border border-gray-200 px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
            >
              <span className="font-mono text-gray-700">{demoEmail}</span>
              <span className="text-xs text-gray-400">{role} → {dest}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
