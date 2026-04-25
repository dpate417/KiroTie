import mockEvents from '@/data/mockEvents'
import { computePrediction, classifyLikelihood, computeRiskFactors, getSignupTrend } from '@/utils/attendanceEngine'
import { computeWaste } from '@/utils/wasteCostEngine'
import EventCard from '@/components/EventCard'

/**
 * OrganizerDashboard — Req 2.1–2.4
 *
 * Renders a responsive grid of EventCard components using mock data.
 * No API calls, no auth guard (P0 demo).
 */
export default function OrganizerDashboard() {
  const enrichedEvents = mockEvents.map((event) => {
    const predicted_count = computePrediction(event)
    const likelihood = classifyLikelihood(predicted_count, event.signup_count)
    const risk_factors = computeRiskFactors(event)
    const signup_trend = getSignupTrend(event)

    const prediction = {
      event_id: event.id,
      predicted_count,
      likelihood,
      signal_breakdown: {},
      risk_factors,
      signup_trend,
    }

    const wasteInsight = computeWaste(event, predicted_count)

    return { event, prediction, wasteInsight }
  })

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizer Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {enrichedEvents.length} event{enrichedEvents.length !== 1 ? 's' : ''} · P0 demo
          </p>
        </div>

        {/* Req 2.1 — one EventCard per event, responsive grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {enrichedEvents.map(({ event, prediction, wasteInsight }) => (
            <EventCard
              key={event.id}
              event={event}
              prediction={prediction}
              wasteInsight={wasteInsight}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
