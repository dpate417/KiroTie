import { useEffect, useState } from 'react'
import { Toast, ToastClose, ToastTitle, ToastDescription, ToastViewport } from '@/components/ui/toast'

/**
 * Listens for `api-error` custom events dispatched by the API client on 500 responses
 * and displays them as auto-dismissing toast notifications.
 * Req 7.8
 */
export default function ErrorToast() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    function handleApiError(event) {
      const { status, message } = event.detail
      const id = Date.now()
      setToasts(prev => [...prev, { id, status, message }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 5000)
    }

    window.addEventListener('api-error', handleApiError)
    return () => window.removeEventListener('api-error', handleApiError)
  }, [])

  return (
    <ToastViewport>
      {toasts.map(({ id, status, message }) => (
        <Toast key={id} variant="destructive">
          <div>
            <ToastTitle>Error {status}</ToastTitle>
            <ToastDescription>{message}</ToastDescription>
          </div>
          <ToastClose onClick={() => setToasts(prev => prev.filter(t => t.id !== id))} />
        </Toast>
      ))}
    </ToastViewport>
  )
}
