import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as fc from 'fast-check'
import PredictionResultPanel from './PredictionResultPanel'

const sampleData = {
  predicted_attendance: 58,
  planned_quantity: 80,
  food_waste_lbs: 11.0,
  total_savings_usd: 110.0,
  factors: [
    { label: 'Event Type', impact: 'medium', detail: 'food_social events average 72% show rate' },
    { label: 'Registration', impact: 'low', detail: 'No registration timing data available' },
  ],
}

// --- Unit tests (Requirements 5.6) ---

describe('PredictionResultPanel', () => {
  it('returns null when data is null', () => {
    const { container } = render(<PredictionResultPanel data={null} isMock={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders mock notice banner when isMock=true', () => {
    render(<PredictionResultPanel data={sampleData} isMock={true} />)
    expect(
      screen.getByText('Live prediction unavailable — showing mock data'),
    ).toBeInTheDocument()
  })

  it('does not render mock notice banner when isMock=false', () => {
    render(<PredictionResultPanel data={sampleData} isMock={false} />)
    expect(
      screen.queryByText('Live prediction unavailable — showing mock data'),
    ).not.toBeInTheDocument()
  })

  it('renders all four metric fields', () => {
    render(<PredictionResultPanel data={sampleData} isMock={false} />)
    expect(screen.getByText('58')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText('11')).toBeInTheDocument()
  })

  it('renders factors when factors array is non-empty', () => {
    render(<PredictionResultPanel data={sampleData} isMock={false} />)
    expect(screen.getByText('Event Type')).toBeInTheDocument()
    expect(screen.getByText('Registration')).toBeInTheDocument()
  })

  it('does not render factors section when factors array is empty', () => {
    const data = { ...sampleData, factors: [] }
    render(<PredictionResultPanel data={data} isMock={false} />)
    expect(screen.queryByText('Contributing Factors')).not.toBeInTheDocument()
  })
})

// --- Property test (Requirements 5.1, 5.2, 5.3, 5.4, 5.5) ---
// Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5

describe('Property 4: Prediction result panel renders all required fields for any valid response', () => {
  it('renders predicted_attendance, food_waste_lbs, total_savings_usd, and each factor label', () => {
    const factorArb = fc.record({
      label: fc.string({ minLength: 1, maxLength: 30 }),
      impact: fc.constantFrom('low', 'medium', 'high'),
      detail: fc.string({ minLength: 1, maxLength: 80 }),
    })

    const predictionArb = fc.record({
      predicted_attendance: fc.integer({ min: 0, max: 1000 }),
      planned_quantity: fc.integer({ min: 1, max: 1000 }),
      food_waste_lbs: fc.float({ min: 0, max: 500, noNaN: true }),
      total_savings_usd: fc.float({ min: 0, max: 10000, noNaN: true }),
      factors: fc.array(factorArb, { minLength: 1, maxLength: 5 }),
    })

    fc.assert(
      fc.property(predictionArb, (data) => {
        const { container, unmount } = render(
          <PredictionResultPanel data={data} isMock={false} />,
        )
        const text = container.textContent

        // predicted_attendance must appear
        expect(text).toContain(String(data.predicted_attendance))
        // food_waste_lbs must appear
        expect(text).toContain(String(data.food_waste_lbs))
        // total_savings_usd must appear
        expect(text).toContain(String(data.total_savings_usd))
        // each factor label must appear
        for (const factor of data.factors) {
          expect(text).toContain(factor.label)
        }

        unmount()
      }),
      { numRuns: 100 },
    )
  })
})
