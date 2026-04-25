import { useState } from 'react'
import mockEvents from '@/data/mockEvents'
import { computePrediction, classifyLikelihood, computeRiskFactors } from '@/utils/attendanceEngine'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

const DEMO_STUDENT_EMAIL = 'student@asu.edu'

// ── Hardcoded class schedule (visual only, P0 demo) ──────────────────────────
// dayOfWeek: 0=Mon … 6=Sun  |  startHour/endHour in 24h
const CLASS_SCHEDULE = [
  { id: 'cls-1', title: 'CS 101', dayOfWeek: 0, startHour: 9,  endHour: 10 },   // Mon 9–10
  { id: 'cls-2', title: 'MAT 265', dayOfWeek: 1, startHour: 11, endHour: 12 },  // Tue 11–12
  { id: 'cls-3', title: 'ENG 102', dayOfWeek: 2, startHour: 11, endHour: 12 },  // Wed 11–12
  { id: 'cls-4', title: 'CS 101', dayOfWeek: 3, startHour: 9,  endHour: 10 },   // Thu 9–10
  { id: 'cls-5', title: 'MAT 265', dayOfWeek: 4, startHour: 13, endHour: 14 },  // Fri 13–14
]

// ── Helpers ──────────────────────────────────────────────────────────────────
const START_HOUR = 8
const END_HOUR   = 20
const HOURS      = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CELL_HEIGHT = 56 // px per hour

function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDayLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatHour(hour) {
  if (hour === 0)  return '12 AM'
  if (hour < 12)   return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return { hour: h, minute: m }
}

/** Returns true if event (start = event.time, duration 1h) overlaps any class on the same day-of-week */
function hasClassConflict(event, colDayOfWeek) {
  const { hour: evtStart } = parseTime(event.time)
  const evtEnd = evtStart + 1
  return CLASS_SCHEDULE.some(
    (cls) =>
      cls.dayOfWeek === colDayOfWeek &&
      evtStart < cls.endHour &&
      evtEnd > cls.startHour
  )
}

// Event status derives from: registered (always true here) + conflict + likelihood
// Priority: conflict > good fit > registered
function getEventStatus(event, conflict) {
  if (conflict) return 'conflict'
  if (event.likelihood === 'High') return 'good_fit'
  return 'registered'
}

const STATUS_BLOCK_STYLES = {
  conflict:   'bg-red-500 text-white border-2 border-red-700',
  good_fit:   'bg-green-500 text-white border border-green-600',
  registered: 'bg-blue-500 text-white border border-blue-600',
}

const STATUS_BADGE = {
  conflict:   { label: '⚠ Conflict',    cls: 'bg-red-100 text-red-700 border border-red-300' },
  good_fit:   { label: '✓ Good fit',    cls: 'bg-green-100 text-green-700 border border-green-300' },
  registered: { label: '● Registered',  cls: 'bg-blue-100 text-blue-700 border border-blue-300' },
}

const LIKELIHOOD_BADGE = {
  High:   'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low:    'bg-red-100 text-red-800',
}

// ── Component ────────────────────────────────────────────────────────────────
export default function StudentCalendar() {
  const [weekStart, setWeekStart]     = useState(() => getMondayOf(new Date()))
  const [selectedEvent, setSelectedEvent] = useState(null)

  const weekDates       = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
  const weekDateStrings = weekDates.map(toDateString)

  const studentEvents = mockEvents
    .filter(
      (e) =>
        e.registered_students.includes(DEMO_STUDENT_EMAIL) &&
        weekDateStrings.includes(e.date)
    )
    .map((e) => {
      const predicted   = computePrediction(e)
      const likelihood  = classifyLikelihood(predicted, e.signup_count)
      const riskFactors = computeRiskFactors(e)
      return { ...e, predicted, likelihood, riskFactors }
    })

  const prevWeek = () => setWeekStart((p) => { const d = new Date(p); d.setDate(d.getDate() - 7); return d })
  const nextWeek = () => setWeekStart((p) => { const d = new Date(p); d.setDate(d.getDate() + 7); return d })

  const weekEnd   = weekDates[6]
  const weekLabel = `${formatDayLabel(weekStart)} – ${formatDayLabel(weekEnd)}, ${weekEnd.getFullYear()}`

  // Summary counts
  const conflictCount  = studentEvents.filter((e) => {
    const colIdx = weekDates.findIndex((d) => toDateString(d) === e.date)
    return colIdx !== -1 && hasClassConflict(e, colIdx)
  }).length
  const goodFitCount   = studentEvents.filter((e) => {
    const colIdx = weekDates.findIndex((d) => toDateString(d) === e.date)
    const conflict = colIdx !== -1 && hasClassConflict(e, colIdx)
    return !conflict && e.likelihood === 'High'
  }).length
  const registeredCount = studentEvents.length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing events for <span className="font-medium">{DEMO_STUDENT_EMAIL}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevWeek} className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">← Prev</button>
          <span className="text-sm font-semibold text-gray-700 min-w-[180px] text-center">{weekLabel}</span>
          <button onClick={nextWeek} className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Next →</button>
        </div>
      </div>

      {/* ── My Events summary panel ── */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2">
            <span className="text-xl font-bold text-blue-700">{registeredCount}</span>
            <span className="text-sm text-blue-600 font-medium">Registered</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2">
            <span className="text-xl font-bold text-red-600">{conflictCount}</span>
            <span className="text-sm text-red-500 font-medium">Conflicts</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2">
            <span className="text-xl font-bold text-green-700">{goodFitCount}</span>
            <span className="text-sm text-green-600 font-medium">Good fits</span>
          </div>
        </div>
        {conflictCount > 0 && (
          <button
            onClick={() => console.log('Review conflicts clicked')}
            className="ml-auto px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
          >
            Review conflicts →
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />Registered</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-green-500" />Good fit</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-red-500" />Conflict</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-gray-300" />Class</span>
      </div>

      {/* ── Two-column layout: calendar + commitments sidebar ── */}
      <div className="flex gap-4 items-start">

      {/* Calendar grid — takes remaining width */}
      <div className="flex-1 min-w-0">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Day header */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-gray-200">
          <div className="border-r border-gray-200" />
          {weekDates.map((d, i) => (
            <div key={i} className="py-2 text-center border-r border-gray-200 last:border-r-0">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{DAY_LABELS[i]}</div>
              <div className="text-sm font-bold text-gray-800">{formatDayLabel(d)}</div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="relative grid grid-cols-[56px_repeat(7,1fr)]">
          {/* Hour labels */}
          <div className="border-r border-gray-200">
            {HOURS.map((hour) => (
              <div key={hour} style={{ height: CELL_HEIGHT }} className="border-b border-gray-100 flex items-start justify-end pr-2 pt-1">
                <span className="text-xs text-gray-400">{formatHour(hour)}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDates.map((d, colIdx) => {
            const dateStr    = toDateString(d)
            const dayOfWeek  = colIdx // 0=Mon
            const dayEvents  = studentEvents.filter((e) => e.date === dateStr)
            const dayClasses = CLASS_SCHEDULE.filter((c) => c.dayOfWeek === dayOfWeek)

            return (
              <div
                key={colIdx}
                className="relative border-r border-gray-200 last:border-r-0"
                style={{ height: CELL_HEIGHT * HOURS.length }}
              >
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div key={hour} style={{ top: (hour - START_HOUR) * CELL_HEIGHT, height: CELL_HEIGHT }} className="absolute inset-x-0 border-b border-gray-100" />
                ))}

                {/* ── Class blocks (gray, visual only) ── */}
                {dayClasses.map((cls) => {
                  const top    = (cls.startHour - START_HOUR) * CELL_HEIGHT
                  const height = (cls.endHour - cls.startHour) * CELL_HEIGHT - 4
                  return (
                    <div
                      key={cls.id}
                      style={{ top: top + 2, height }}
                      className="absolute inset-x-1 rounded bg-gray-200 border border-gray-300 px-1.5 py-0.5 text-xs text-gray-600 font-medium overflow-hidden select-none"
                    >
                      <div className="font-semibold truncate">{cls.title}</div>
                      <div className="opacity-70">{formatHour(cls.startHour)}–{formatHour(cls.endHour)}</div>
                    </div>
                  )
                })}

                {/* ── Event blocks ── */}
                {dayEvents.map((event) => {
                  const { hour, minute } = parseTime(event.time)
                  if (hour < START_HOUR || hour >= END_HOUR) return null

                  const topOffset   = (hour - START_HOUR + minute / 60) * CELL_HEIGHT
                  const blockHeight = CELL_HEIGHT - 4
                  const conflict    = hasClassConflict(event, dayOfWeek)
                  const status      = getEventStatus(event, conflict)

                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      style={{ top: topOffset + 2, height: blockHeight }}
                      className={[
                        'absolute inset-x-1 rounded text-left px-1.5 py-0.5 text-xs font-medium overflow-hidden cursor-pointer hover:opacity-90 transition-opacity',
                        STATUS_BLOCK_STYLES[status],
                      ].join(' ')}
                    >
                      <div className="font-semibold truncate leading-tight">{event.name}</div>
                      {conflict && (
                        <div className="text-[10px] font-bold opacity-90">⚠ Conflict</div>
                      )}
                      {!conflict && status === 'good_fit' && (
                        <div className="text-[10px] opacity-90">✓ Good fit</div>
                      )}
                      {!conflict && status === 'registered' && (
                        <div className="text-[10px] opacity-80">● Registered</div>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
      {/* end calendar grid */}
      </div>

      {/* ── My Commitments sidebar ── */}
      <div className="w-64 shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-sm font-bold text-gray-800 mb-3">My Commitments</h2>
          {studentEvents.length === 0 ? (
            <p className="text-xs text-gray-400">No registered events this week.</p>
          ) : (
            <ul className="space-y-2">
              {studentEvents.map((event) => {
                const colIdx = weekDates.findIndex((d) => toDateString(d) === event.date)
                const conflict = colIdx !== -1 && hasClassConflict(event, colIdx)
                const status   = getEventStatus(event, conflict)
                const badge    = STATUS_BADGE[status]
                return (
                  <li key={event.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 space-y-1">
                    <div className="text-xs font-semibold text-gray-800 leading-snug">{event.name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {event.time}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <button
                        onClick={() => console.log('Dropped:', event.name)}
                        className="text-[11px] text-gray-400 hover:text-red-500 transition-colors font-medium"
                      >
                        Drop
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* end two-column layout */}
      </div>
      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {selectedEvent && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-lg leading-snug">{selectedEvent.name}</SheetTitle>
                <SheetDescription asChild>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div><span className="font-medium text-gray-700">Date:</span>{' '}
                      {new Date(selectedEvent.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div><span className="font-medium text-gray-700">Time:</span> {selectedEvent.time}</div>
                    <div><span className="font-medium text-gray-700">Location:</span> {selectedEvent.location}</div>
                  </div>
                </SheetDescription>
              </SheetHeader>

              {/* Status badge */}
              <div className="mb-4">
                {(() => {
                  const colIdx = weekDates.findIndex((d) => toDateString(d) === selectedEvent.date)
                  const conflict = colIdx !== -1 && hasClassConflict(selectedEvent, colIdx)
                  const status = getEventStatus(selectedEvent, conflict)
                  const badge = STATUS_BADGE[status]
                  return (
                    <span className={`inline-block px-2.5 py-1 rounded-full text-sm font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )
                })()}
              </div>

              {/* Conflict warning */}
              {hasClassConflict(selectedEvent, weekDates.findIndex((d) => toDateString(d) === selectedEvent.date)) && (
                <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 font-medium">
                  ⚠ This event conflicts with a class
                </div>
              )}

              {/* Risk factors */}
              {selectedEvent.riskFactors.length > 0 ? (
                <div className="mb-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Risk Factors</span>
                  <ul className="space-y-2">
                    {selectedEvent.riskFactors.map((rf, i) => (
                      <li key={i} className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2">
                        <div className="text-xs font-semibold text-gray-700 mb-0.5">{rf.label}</div>
                        <div className="text-sm text-gray-600">{rf.detail}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                  No risk factors — this event looks good to attend!
                </div>
              )}

              {/* ── Register / Skip action buttons ── */}
              <div className="flex gap-3 pt-2 border-t">
                <button
                  onClick={() => { console.log('Registered for:', selectedEvent.name); setSelectedEvent(null) }}
                  className="flex-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 transition-colors"
                >
                  ✓ Register
                </button>
                <button
                  onClick={() => { console.log('Skipped:', selectedEvent.name); setSelectedEvent(null) }}
                  className="flex-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold py-2 transition-colors"
                >
                  ✕ Skip
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
