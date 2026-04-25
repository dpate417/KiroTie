import { useState } from 'react'

export default function CsvUploadSection({ onUpload, loading }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')

  function handleFileChange(e) {
    setFile(e.target.files[0] ?? null)
    setError('')
  }

  function handleClick() {
    if (!file) {
      setError('Please select a CSV file')
      return
    }
    setError('')
    onUpload(file)
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="block text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-200"
      />
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={handleClick}
        className="flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        Upload &amp; Predict
      </button>
    </div>
  )
}
