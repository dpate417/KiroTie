import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '@/api/client'
import EventCard from '@/components/EventCard'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * OrganizerDashboard — Req 2.1, 7.2
 *
 * Fetches event summaries from GET /api/events and renders a grid of EventCards.
 * Shows a loading skeleton while fetching and an error state on failure.
 */

/** Map snake_case waste_insight from API to camelCase expected by EventCard */
function mapWasteInsight(wi) {
  if (!wi) return {}
  return {
    overPrepGap:          wi.over_prep_gap,
    wastedCostUsd:        wi.wasted_cost_usd,
    recommendedPrep:      wi.recommended_prep,
    savingsIfAdjustedUsd: wi.savings_if_adjusted_usd,
    carbonSavingsKg:      wi.carbon_savings_kg,
    perPersonCostUsd:     wi.per_person_cost_usd,
    sources:              wi.sources ?? [],
  }
}

/** Map a flat EventSummary from the API to the { event, prediction, wasteInsight } shape EventCard expects */
function mapEventSummary(summary) {
  const event = {
    id:            summary.id,
    name:          summary.name,
    date:          summary.date,
    time:          summary.time,
    location:      summary.location,
    signup_count:  summary.signup_count,
  }

  const prediction = {
    event_id:        summary.id,
    predicted_count: summary.predicted_count,
    likelihood:      summary.likelihood,
    signal_breakdown: {},
    risk_factors:    summary.risk_factors ?? [],
    signup_trend:    summary.signup_trend,
  }

  const wasteInsight = mapWasteInsight(summary.waste_insight)

  return { event, prediction, wasteInsight }
}

export default function OrganizerDashboard() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const navigate              = useNavigate()

  function handleLogout() {
    apiPost('/auth/logout', {}).catch(() => {})
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('role')
    navigate('/login')
  }

  useEffect(() => {
    apiGet('/events?role=organizer&email=organizer@asu.edu')
      .then((res) => {
        const data = res.data ?? res
        setItems(Array.isArray(data) ? data.map(mapEventSummary) : [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Organizer Dashboard</h1>
            {!loading && !error && (
              <p className="text-muted-foreground text-sm mt-1">
                {items.length} event{items.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Log out
          </button>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            Failed to load events: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map(({ event, prediction, wasteInsight }) => (
              <EventCard
                key={event.id}
                event={event}
                prediction={prediction}
                wasteInsight={wasteInsight}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
