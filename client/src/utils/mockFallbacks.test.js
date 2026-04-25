import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { mockPredictFallback, mockUploadFallback } from './mockFallbacks.js'

const EVENT_TYPES = ['food_social', 'academic_workshop', 'career_fair', 'club_meeting', 'general']

const payloadArb = fc.record({
  expected_signups: fc.integer({ min: 1, max: 500 }),
  event_type:       fc.oneof(...EVENT_TYPES.map(fc.constant)),
  planned_quantity: fc.integer({ min: 1, max: 500 }),
  cost_per_person:  fc.float({ min: 0, max: 100, noNaN: true }),
})

/**
 * Property 5: Manual mock fallback always returns a complete, deterministic response
 * Validates: Requirements 6.1, 6.2, 6.3
 */
describe('mockPredictFallback — Property 5', () => {
  it('returns all required fields for any valid payload', () => {
    fc.assert(
      fc.property(payloadArb, (payload) => {
        const result = mockPredictFallback(payload)

        // All required fields present (Req 6.1)
        expect(result).toHaveProperty('predicted_attendance')
        expect(result).toHaveProperty('confidence_low')
        expect(result).toHaveProperty('confidence_high')
        expect(result).toHaveProperty('confidence_level')
        expect(result).toHaveProperty('show_rate_pct')
        expect(result).toHaveProperty('expected_signups')
        expect(result).toHaveProperty('planned_quantity')
        expect(result).toHaveProperty('food_waste_lbs')
        expect(result).toHaveProperty('total_savings_usd')
        expect(result).toHaveProperty('factors')

        // factors has at least 2 entries, each with non-empty label, impact, detail (Req 6.3)
        expect(result.factors.length).toBeGreaterThanOrEqual(2)
        for (const factor of result.factors) {
          expect(factor.label).toBeTruthy()
          expect(factor.impact).toBeTruthy()
          expect(factor.detail).toBeTruthy()
        }
      }),
      { numRuns: 100 },
    )
  })

  it('is deterministic — same inputs always produce the same predicted_attendance (Req 6.2)', () => {
    fc.assert(
      fc.property(payloadArb, (payload) => {
        const r1 = mockPredictFallback(payload)
        const r2 = mockPredictFallback(payload)
        expect(r1.predicted_attendance).toBe(r2.predicted_attendance)
      }),
      { numRuns: 100 },
    )
  })
})

/**
 * Property 8: CSV mock fallback always returns a complete response
 * Validates: Requirements 9.1, 9.2
 */
describe('mockUploadFallback — Property 8', () => {
  it('returns a complete response with at least 3 events and a valid summary', () => {
    // Pure function with no inputs — run once and assert structural completeness
    const result = mockUploadFallback()

    // events array has at least 3 entries (Req 9.1)
    expect(Array.isArray(result.events)).toBe(true)
    expect(result.events.length).toBeGreaterThanOrEqual(3)

    // Each event has required fields (Req 9.2)
    for (const event of result.events) {
      expect(event.event_name).not.toBeNull()
      expect(event.event_name).toBeTruthy()
      expect(event.predicted_attendance).not.toBeNull()
      expect(event.total_savings_usd).not.toBeNull()
      expect(event.status).not.toBeNull()
    }

    // summary has required fields (Req 9.1)
    expect(result.summary).toBeDefined()
    expect(result.summary.total_savings_usd).not.toBeNull()
    expect(result.summary.total_co2_saved_kg).not.toBeNull()
    expect(result.summary.total_food_waste_lbs).not.toBeNull()
  })

  it('is idempotent — repeated calls return structurally identical responses', () => {
    // Property: calling with no inputs always yields the same shape
    fc.assert(
      fc.property(fc.constant(null), () => {
        const r1 = mockUploadFallback()
        const r2 = mockUploadFallback()
        expect(r1.events.length).toBe(r2.events.length)
        expect(r1.summary.total_savings_usd).toBe(r2.summary.total_savings_usd)
        expect(r1.summary.total_co2_saved_kg).toBe(r2.summary.total_co2_saved_kg)
        expect(r1.summary.total_food_waste_lbs).toBe(r2.summary.total_food_waste_lbs)
      }),
      { numRuns: 100 },
    )
  })
})
