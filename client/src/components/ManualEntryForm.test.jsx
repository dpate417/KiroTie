import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as fc from 'fast-check'
import ManualEntryForm from './ManualEntryForm.jsx'

const CATEGORIES = ['food_social', 'academic_workshop', 'career_fair', 'club_meeting', 'general']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderForm(props = {}) {
  const onSubmit = props.onSubmit ?? vi.fn()
  const loading  = props.loading  ?? false
  render(<ManualEntryForm onSubmit={onSubmit} loading={loading} />)
  return { onSubmit }
}

function fillValidForm(overrides = {}) {
  const values = {
    title:           'Spring Mixer',
    date:            '2025-06-01',
    time:            '18:00',
    location:        'Student Union',
    category:        'food_social',
    expectedRsvp:    '80',
    costPerPerson:   '12',
    plannedQuantity: '80',
    ...overrides,
  }

  fireEvent.change(screen.getByLabelText(/event title/i), { target: { value: values.title } })
  fireEvent.change(screen.getByLabelText(/date/i),        { target: { value: values.date } })
  fireEvent.change(screen.getByLabelText(/time/i),        { target: { value: values.time } })
  fireEvent.change(screen.getByLabelText(/location/i),    { target: { value: values.location } })
  fireEvent.change(screen.getByLabelText(/category/i),    { target: { value: values.category } })
  fireEvent.change(screen.getByLabelText(/expected rsvps/i), { target: { value: values.expectedRsvp } })
  fireEvent.change(screen.getByLabelText(/cost per person/i), { target: { value: values.costPerPerson } })
  // Planned quantity: simulate direct user edit so sync doesn't override
  fireEvent.change(screen.getByLabelText(/planned quantity/i), { target: { value: values.plannedQuantity } })

  return values
}

// ---------------------------------------------------------------------------
// Unit tests — Task 2.4
// ---------------------------------------------------------------------------

describe('ManualEntryForm — unit tests', () => {
  it('renders all 8 fields and the submit button', () => {
    renderForm()
    expect(screen.getByLabelText(/event title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/time/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/expected rsvps/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cost per person/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/planned quantity/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /predict attendance/i })).toBeInTheDocument()
  })

  it('shows validation errors and does not call onSubmit when fields are empty', () => {
    const { onSubmit } = renderForm()
    fireEvent.click(screen.getByRole('button', { name: /predict attendance/i }))
    expect(onSubmit).not.toHaveBeenCalled()
    // At least one "Required" error should appear
    expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0)
  })

  it('shows "Must be at least 1" when expectedRsvp < 1', () => {
    const { onSubmit } = renderForm()
    fillValidForm({ expectedRsvp: '0' })
    fireEvent.click(screen.getByRole('button', { name: /predict attendance/i }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Must be at least 1')).toBeInTheDocument()
  })

  it('shows "Cannot be negative" when costPerPerson < 0', () => {
    const { onSubmit } = renderForm()
    fillValidForm({ costPerPerson: '-1' })
    fireEvent.click(screen.getByRole('button', { name: /predict attendance/i }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Cannot be negative')).toBeInTheDocument()
  })

  it('disables submit button when loading is true', () => {
    renderForm({ loading: true })
    expect(screen.getByRole('button', { name: /predict attendance/i })).toBeDisabled()
  })

  it('calls onSubmit with correctly mapped payload on valid submission', () => {
    const { onSubmit } = renderForm()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /predict attendance/i }))
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit).toHaveBeenCalledWith({
      event_type:       'food_social',
      expected_signups: 80,
      planned_quantity: 80,
      cost_per_person:  12,
    })
  })

  it('category select has exactly the five required options', () => {
    renderForm()
    const select = screen.getByLabelText(/category/i)
    const optionValues = Array.from(select.options)
      .map(o => o.value)
      .filter(v => v !== '') // exclude placeholder
    expect(optionValues).toEqual(CATEGORIES)
  })
})

// ---------------------------------------------------------------------------
// Property 1: Invalid form inputs are always rejected
// Validates: Requirements 3.1, 3.2, 3.3
// ---------------------------------------------------------------------------

describe('ManualEntryForm — Property 1: invalid form inputs are always rejected', () => {
  it('never calls onSubmit and always shows an error when at least one field is invalid', () => {
    // Arbitrary invalid form: at least one required field is empty or a numeric field is below minimum
    const invalidFormArb = fc.record({
      title:           fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 20 })),
      date:            fc.oneof(fc.constant(''), fc.constant('2025-06-01')),
      time:            fc.oneof(fc.constant(''), fc.constant('18:00')),
      location:        fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 20 })),
      category:        fc.oneof(fc.constant(''), fc.oneof(...CATEGORIES.map(fc.constant))),
      expectedRsvp:    fc.oneof(fc.constant(''), fc.integer({ min: -10, max: 0 }).map(String)),
      costPerPerson:   fc.oneof(fc.constant(''), fc.integer({ min: -100, max: -1 }).map(String)),
      plannedQuantity: fc.oneof(fc.constant(''), fc.integer({ min: -10, max: 0 }).map(String)),
    }).filter(f =>
      // Ensure at least one field is actually invalid
      f.title === '' ||
      f.date === '' ||
      f.time === '' ||
      f.location === '' ||
      f.category === '' ||
      f.expectedRsvp === '' || Number(f.expectedRsvp) < 1 ||
      f.costPerPerson === '' || Number(f.costPerPerson) < 0 ||
      f.plannedQuantity === '' || Number(f.plannedQuantity) < 1
    )

    fc.assert(
      fc.property(invalidFormArb, (formValues) => {
        const onSubmit = vi.fn()
        const { unmount, container } = render(<ManualEntryForm onSubmit={onSubmit} loading={false} />)
        const q = within(container)

        // Fill fields with the generated (potentially invalid) values
        fireEvent.change(q.getByLabelText(/event title/i),     { target: { value: formValues.title } })
        fireEvent.change(q.getByLabelText(/date/i),            { target: { value: formValues.date } })
        fireEvent.change(q.getByLabelText(/time/i),            { target: { value: formValues.time } })
        fireEvent.change(q.getByLabelText(/location/i),        { target: { value: formValues.location } })
        fireEvent.change(q.getByLabelText(/category/i),        { target: { value: formValues.category } })
        fireEvent.change(q.getByLabelText(/expected rsvps/i),  { target: { value: formValues.expectedRsvp } })
        fireEvent.change(q.getByLabelText(/cost per person/i), { target: { value: formValues.costPerPerson } })
        fireEvent.change(q.getByLabelText(/planned quantity/i),{ target: { value: formValues.plannedQuantity } })

        fireEvent.click(q.getByRole('button', { name: /predict attendance/i }))

        expect(onSubmit).not.toHaveBeenCalled()
        // At least one error message should be visible
        const errorMessages = q.queryAllByText(/required|must be at least 1|cannot be negative/i)
        expect(errorMessages.length).toBeGreaterThan(0)

        unmount()
      }),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 2: Valid form inputs always produce a correctly shaped API payload
// Validates: Requirements 3.4, 4.1
// ---------------------------------------------------------------------------

describe('ManualEntryForm — Property 2: valid form inputs always produce a correctly shaped API payload', () => {
  it('calls onSubmit with correctly mapped payload for any valid form state', () => {
    const validFormArb = fc.record({
      title:           fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
      date:            fc.constant('2025-06-01'),
      time:            fc.constant('18:00'),
      location:        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
      category:        fc.oneof(...CATEGORIES.map(fc.constant)),
      expectedRsvp:    fc.integer({ min: 1, max: 1000 }),
      costPerPerson:   fc.float({ min: 0, max: 500, noNaN: true }),
      plannedQuantity: fc.integer({ min: 1, max: 1000 }),
    })

    fc.assert(
      fc.property(validFormArb, (formValues) => {
        const onSubmit = vi.fn()
        const { unmount, container } = render(<ManualEntryForm onSubmit={onSubmit} loading={false} />)
        const q = within(container)

        fireEvent.change(q.getByLabelText(/event title/i),     { target: { value: formValues.title } })
        fireEvent.change(q.getByLabelText(/date/i),            { target: { value: formValues.date } })
        fireEvent.change(q.getByLabelText(/time/i),            { target: { value: formValues.time } })
        fireEvent.change(q.getByLabelText(/location/i),        { target: { value: formValues.location } })
        fireEvent.change(q.getByLabelText(/category/i),        { target: { value: formValues.category } })
        fireEvent.change(q.getByLabelText(/expected rsvps/i),  { target: { value: String(formValues.expectedRsvp) } })
        fireEvent.change(q.getByLabelText(/cost per person/i), { target: { value: String(formValues.costPerPerson) } })
        fireEvent.change(q.getByLabelText(/planned quantity/i),{ target: { value: String(formValues.plannedQuantity) } })

        fireEvent.click(q.getByRole('button', { name: /predict attendance/i }))

        expect(onSubmit).toHaveBeenCalledOnce()
        const payload = onSubmit.mock.calls[0][0]
        expect(payload.event_type).toBe(formValues.category)
        expect(payload.expected_signups).toBe(formValues.expectedRsvp)
        expect(payload.planned_quantity).toBe(formValues.plannedQuantity)
        expect(typeof payload.cost_per_person).toBe('number')

        unmount()
      }),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 3: Planned quantity tracks RSVP count until manually overridden
// Validates: Requirements 2.9
// ---------------------------------------------------------------------------

describe('ManualEntryForm — Property 3: planned quantity tracks RSVP count until manually overridden', () => {
  it('mirrors expectedRsvp into plannedQuantity when user has not edited plannedQuantity', () => {
    const rsvpArb = fc.integer({ min: 1, max: 1000 })

    fc.assert(
      fc.property(rsvpArb, (rsvpValue) => {
        const { unmount, container } = render(<ManualEntryForm onSubmit={vi.fn()} loading={false} />)
        const q = within(container)

        // Only change expectedRsvp — do NOT touch plannedQuantity
        fireEvent.change(q.getByLabelText(/expected rsvps/i), {
          target: { value: String(rsvpValue) },
        })

        const qtyInput = q.getByLabelText(/planned quantity/i)
        expect(qtyInput.value).toBe(String(rsvpValue))

        unmount()
      }),
      { numRuns: 100 },
    )
  })
})
