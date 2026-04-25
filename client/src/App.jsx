import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import OrganizerDashboard from '@/pages/OrganizerDashboard'
import StudentCalendar from '@/pages/StudentCalendar'
import AddEventPage from '@/pages/AddEventPage'
import ErrorToast from '@/components/ErrorToast'

/**
 * Guards routes that require authentication.
 * Reads token from sessionStorage; redirects to /login if absent.
 * Req 1.4, 1.5, 1.8
 */
function ProtectedRoute() {
  const token = sessionStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

function App() {
  return (
    <BrowserRouter>
      <ErrorToast />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<OrganizerDashboard />} />
          <Route path="/calendar" element={<StudentCalendar />} />
          <Route path="/add-event" element={<AddEventPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
