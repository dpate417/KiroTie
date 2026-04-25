/**
 * Thin fetch wrapper for EventWise API calls.
 * Req 7.2, 7.5, 9.4
 *
 * - apiGet(path)        — GET /api/<path>
 * - apiPost(path, body) — POST /api/<path> with JSON body
 * - Attaches Authorization: Bearer <token> from sessionStorage on every request
 * - Dispatches a custom `api-error` event on 500 responses (for ErrorToast in P3)
 * - Global 401 handler: clears token/role from sessionStorage and redirects to /login
 */

function dispatchApiError(status, message) {
  window.dispatchEvent(
    new CustomEvent('api-error', { detail: { status, message } })
  )
}

function authHeaders() {
  const token = sessionStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function handleUnauthorized(status) {
  if (status === 401) {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('role')
    window.location.href = '/login'
  }
}

export async function apiGet(path) {
  const res = await fetch(`/api${path}`, {
    headers: { ...authHeaders() },
  })
  if (res.status >= 500) {
    dispatchApiError(res.status, `Server error on GET ${path}`)
  }
  handleUnauthorized(res.status)
  if (!res.ok) {
    const err = new Error(`GET /api${path} failed with status ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

export async function apiPost(path, body) {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  if (res.status >= 500) {
    dispatchApiError(res.status, `Server error on POST ${path}`)
  }
  handleUnauthorized(res.status)
  if (!res.ok) {
    const err = new Error(`POST /api${path} failed with status ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}
