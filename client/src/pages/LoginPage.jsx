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
    /* Full-page background: image with dark overlay, fallback to dark slate */
    <div
      className="relative min-h-screen flex items-center justify-center bg-slate-900"
      style={{
        backgroundImage: 'url(/images/login-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="bg-white rounded-2xl shadow-2xl px-8 py-10 space-y-6">

          {/* Header */}
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">EventWise</h1>
            <p className="text-sm text-gray-500">AI-powered attendance intelligence</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="email-input">
                ASU Email
              </label>
              <Input
                id="email-input"
                type="email"
                placeholder="you@asu.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                aria-label="ASU email address"
              />
              <p className="text-xs text-gray-400">Use your ASU email to continue</p>
              {error && (
                <p className="text-sm text-red-600 font-medium" role="alert">
                  {error}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Continue'}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="space-y-2">
            <p className="text-xs text-center text-gray-400">Or use a demo account:</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {[
                { email: 'organizer@asu.edu' },
                { email: 'student@asu.edu' },
              ].map(({ email: demoEmail }) => (
                <button
                  key={demoEmail}
                  type="button"
                  onClick={() => setEmail(demoEmail)}
                  className="px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                >
                  {demoEmail}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
