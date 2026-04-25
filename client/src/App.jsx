import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import OrganizerDashboard from '@/pages/OrganizerDashboard'
import StudentCalendar from '@/pages/StudentCalendar'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<OrganizerDashboard />} />
        <Route path="/calendar" element={<StudentCalendar />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
