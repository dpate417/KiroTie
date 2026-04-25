import { useState, useRef, useEffect } from 'react'

const CATEGORIES = [
  { value: 'food_social',        label: 'Food & Social' },
  { value: 'academic_workshop',  label: 'Academic Workshop' },
  { value: 'career_fair',        label: 'Career Fair' },
  { value: 'club_meeting',       label: 'Club Meeting' },
  { value: 'general',            label: 'General' },
]

const INITIAL_FORM = {
  title:           '',
  date:            '',
  time:            '',
  location:        '',
  category:        '',
  expectedRsvp:    '',
  costPerPerson:   '',
  plannedQuantity: '',
}

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-600">{message}</p>
}

export default function ManualEntryForm({ onSubmit, loading }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const userEditedQty = useRef(false)

  // Sync plannedQuantity with expectedRsvp until user manually edits qty
  useEffect(() => {
    if (!userEditedQty.current && form.expectedRsvp !== '') {
      setForm(prev => ({ ...prev, plannedQuantity: form.expectedRsvp }))
    }
  }, [form.expectedRsvp])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  function handleQtyChange(e) {
    userEditedQty.current = true
    handleChange(e)
  }

  function validate() {
    const errs = {}

    if (!form.title.trim())    errs.title    = 'Required'
    if (!form.date.trim())     errs.date     = 'Required'
    if (!form.time.trim())     errs.time     = 'Required'
    if (!form.location.trim()) errs.location = 'Required'
    if (!form.category)        errs.category = 'Required'

    if (form.expectedRsvp === '' || form.expectedRsvp === null) {
      errs.expectedRsvp = 'Required'
    } else if (Number(form.expectedRsvp) < 1) {
      errs.expectedRsvp = 'Must be at least 1'
    }

    if (form.costPerPerson === '' || form.costPerPerson === null) {
      errs.costPerPerson = 'Required'
    } else if (Number(form.costPerPerson) < 0) {
      errs.costPerPerson = 'Cannot be negative'
    }

    if (form.plannedQuantity === '' || form.plannedQuantity === null) {
      errs.plannedQuantity = 'Required'
    } else if (Number(form.plannedQuantity) < 1) {
      errs.plannedQuantity = 'Must be at least 1'
    }

    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    onSubmit({
      event_type:       form.category,
      expected_signups: Number(form.expectedRsvp),
      planned_quantity: Number(form.plannedQuantity),
      cost_per_person:  Number(form.costPerPerson),
    })
  }

  const inputClass = (field) =>
    `w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 ${
      errors[field] ? 'border-red-400' : 'border-gray-300'
    }`

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
          Event Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          className={inputClass('title')}
          placeholder="e.g. Spring Mixer"
        />
        <FieldError message={errors.title} />
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="date">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className={inputClass('date')}
          />
          <FieldError message={errors.date} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="time">
            Time <span className="text-red-500">*</span>
          </label>
          <input
            id="time"
            name="time"
            type="time"
            value={form.time}
            onChange={handleChange}
            className={inputClass('time')}
          />
          <FieldError message={errors.time} />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="location">
          Location <span className="text-red-500">*</span>
        </label>
        <input
          id="location"
          name="location"
          type="text"
          value={form.location}
          onChange={handleChange}
          className={inputClass('location')}
          placeholder="e.g. Student Union Room 201"
        />
        <FieldError message={errors.location} />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          name="category"
          value={form.category}
          onChange={handleChange}
          className={inputClass('category')}
        >
          <option value="">Select a category</option>
          {CATEGORIES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <FieldError message={errors.category} />
      </div>

      {/* Expected RSVP + Cost Per Person */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="expectedRsvp">
            Expected RSVPs <span className="text-red-500">*</span>
          </label>
          <input
            id="expectedRsvp"
            name="expectedRsvp"
            type="number"
            min="1"
            value={form.expectedRsvp}
            onChange={handleChange}
            className={inputClass('expectedRsvp')}
            placeholder="e.g. 100"
          />
          <FieldError message={errors.expectedRsvp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="costPerPerson">
            Cost Per Person (USD) <span className="text-red-500">*</span>
          </label>
          <input
            id="costPerPerson"
            name="costPerPerson"
            type="number"
            min="0"
            step="0.01"
            value={form.costPerPerson}
            onChange={handleChange}
            className={inputClass('costPerPerson')}
            placeholder="e.g. 12.50"
          />
          <FieldError message={errors.costPerPerson} />
        </div>
      </div>

      {/* Planned Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="plannedQuantity">
          Planned Quantity <span className="text-red-500">*</span>
        </label>
        <input
          id="plannedQuantity"
          name="plannedQuantity"
          type="number"
          min="1"
          value={form.plannedQuantity}
          onChange={handleQtyChange}
          className={inputClass('plannedQuantity')}
          placeholder="e.g. 100"
        />
        <FieldError message={errors.plannedQuantity} />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        Predict Attendance
      </button>
    </form>
  )
}
