import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CsvUploadSection from './CsvUploadSection'

describe('CsvUploadSection', () => {
  it('file input has accept=".csv"', () => {
    render(<CsvUploadSection onUpload={vi.fn()} loading={false} />)
    const input = document.querySelector('input[type="file"]')
    expect(input).toBeTruthy()
    expect(input.getAttribute('accept')).toBe('.csv')
  })

  it('shows error and does not call onUpload when no file selected', () => {
    const onUpload = vi.fn()
    render(<CsvUploadSection onUpload={onUpload} loading={false} />)
    fireEvent.click(screen.getByRole('button', { name: /upload & predict/i }))
    expect(screen.getByText('Please select a CSV file')).toBeTruthy()
    expect(onUpload).not.toHaveBeenCalled()
  })

  it('calls onUpload with the file when a file is selected', () => {
    const onUpload = vi.fn()
    render(<CsvUploadSection onUpload={onUpload} loading={false} />)
    const input = document.querySelector('input[type="file"]')
    const file = new File(['a,b'], 'events.csv', { type: 'text/csv' })
    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: /upload & predict/i }))
    expect(onUpload).toHaveBeenCalledWith(file)
  })

  it('disables button when loading is true', () => {
    render(<CsvUploadSection onUpload={vi.fn()} loading={true} />)
    expect(screen.getByRole('button', { name: /upload & predict/i })).toBeDisabled()
  })

  it('does not show error after selecting a file', () => {
    const onUpload = vi.fn()
    render(<CsvUploadSection onUpload={onUpload} loading={false} />)
    // Trigger error first
    fireEvent.click(screen.getByRole('button', { name: /upload & predict/i }))
    expect(screen.getByText('Please select a CSV file')).toBeTruthy()
    // Select a file — error should clear
    const input = document.querySelector('input[type="file"]')
    const file = new File(['x'], 'data.csv', { type: 'text/csv' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(screen.queryByText('Please select a CSV file')).toBeNull()
  })
})
