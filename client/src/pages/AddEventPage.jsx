import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '@/api/client'
import DashboardSidebar from '@/components/DashboardSidebar'
import ManualEntryForm from '@/components/ManualEntryForm'
import PredictionResultPanel from '@/components/PredictionResultPanel'
import CsvUploadSection from '@/components/CsvUploadSection'
import BulkResultsTable from '@/components/BulkResultsTable'
import { mockPredictFallback, mockUploadFallback } from '@/utils/mockFallbacks'

export default function AddEventPage() {
  const navigate = useNavigate()

  const [prediction, setPrediction]       = useState(null)
  const [predictLoading, setPredictLoading] = useState(false)
  const [predictMock, setPredictMock]     = useState(false)

  const [bulkResult, setBulkResult]       = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadMock, setUploadMock]       = useState(false)

  function handleLogout() {
    apiPost('/auth/logout', {}).catch(() => {})
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('role')
    navigate('/login')
  }

  async function handlePredict(formValues) {
    const payload = {
      event_type:       formValues.event_type,
      expected_signups: formValues.expected_signups,
      planned_quantity: formValues.planned_quantity,
      cost_per_person:  formValues.cost_per_person,
    }
    setPredictLoading(true)
    setPredictMock(false)
    try {
      const result = await apiPost('/predict', payload)
      setPrediction(result)
    } catch {
      const mock = mockPredictFallback(payload)
      setPrediction(mock)
      setPredictMock(true)
    } finally {
      setPredictLoading(false)
    }
  }

  async function handleUpload(file) {
    const formData = new FormData()
    formData.append('file', file)
    const token = sessionStorage.getItem('token')
    setUploadLoading(true)
    setUploadMock(false)
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error(`Upload failed with status ${res.status}`)
      const result = await res.json()
      setBulkResult(result)
    } catch {
      const mock = mockUploadFallback()
      setBulkResult(mock)
      setUploadMock(true)
    } finally {
      setUploadLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <DashboardSidebar onLogout={handleLogout} activePath="/add-event" />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-8 max-w-3xl">
          {/* Manual Entry */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual Entry</h2>
            <ManualEntryForm onSubmit={handlePredict} loading={predictLoading} />
            <PredictionResultPanel data={prediction} isMock={predictMock} />
          </section>

          {/* CSV Upload */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">CSV Upload</h2>
            <CsvUploadSection onUpload={handleUpload} loading={uploadLoading} />
            <BulkResultsTable data={bulkResult} isMock={uploadMock} />
          </section>
        </div>
      </main>
    </div>
  )
}
