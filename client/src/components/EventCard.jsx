import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import WasteCostBanner from '@/components/WasteCostBanner'

const TREND_STYLES = {
  growing:  'bg-green-100 text-green-700 border-green-200',
  slowing:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  stagnant: 'bg-gray-100 text-gray-500 border-gray-200',
}
const TREND_LABELS = {
  growing: '↑ Growing', slowing: '↓ Slowing', stagnant: '→ Stagnant',
}

// Short chip labels — no long sentences
const RISK_CHIP_STYLES = {
  competing_event:  'bg-red-50 text-red-600 border-red-200',
  academic_conflict:'bg-orange-50 text-orange-600 border-orange-200',
  poor_time_slot:   'bg-yellow-50 text-yellow-600 border-yellow-200',
  low_interest:     'bg-blue-50 text-blue-600 border-blue-200',
}
const RISK_SHORT_LABELS = {
  competing_event:  'Competing event',
  academic_conflict:'Finals week',
  poor_time_slot:   'Low-traffic day',
  low_interest:     'Low interest',
}

/**
 * Derive up to 2 insight→action pairs from prediction signals.
 * Priority order matches the mapping rules.
 */
function getInsightActions({ risk_factors, signup_trend, predicted_count, signup_count }) {
  const pairs = []

  const hasCompeting  = risk_factors.some((r) => r.type === 'competing_event')
  const hasAcademic   = risk_factors.some((r) => r.type === 'academic_conflict')
  const hasPoorSlot   = risk_factors.some((r) => r.type === 'poor_time_slot')
  const hasLowInterest= risk_factors.some((r) => r.type === 'low_interest')
  const dropPct       = signup_count > 0 ? (signup_count - predicted_count) / signup_count : 0

  if (hasCompeting) {
    pairs.push({ insight: 'Competing events at this time', action: 'Adjust timing', impact: '+10–15%', sub: 'reduces conflicts' })
  }
  if (hasAcademic || hasPoorSlot) {
    pairs.push({ insight: 'Schedule conflict for many attendees', action: 'Adjust timing', impact: '+10–15%', sub: 'reduces conflicts' })
  }
  if (signup_trend === 'slowing' || signup_trend === 'stagnant') {
    pairs.push({ insight: 'Signups are slowing down', action: 'Increase outreach', impact: '+10–20%', sub: `~${Math.round(signup_count * 0.12)} more attendees` })
  }
  if (hasLowInterest) {
    pairs.push({ insight: 'Low audience match', action: 'Target better audience', impact: '+15%', sub: 'better-fit attendees' })
  }
  if (dropPct >= 0.25) {
    pairs.push({ insight: 'Large attendance drop expected', action: 'Send reminders', impact: '+10%', sub: `~${Math.round(signup_count * 0.10)} recovered` })
  }

  // Deduplicate by action, cap at 2
  const seen = new Set()
  return pairs.filter(({ action }) => {
    if (seen.has(action)) return false
    seen.add(action)
    return true
  }).slice(0, 2)
}

export default function EventCard({ event, prediction, wasteInsight }) {
  const { name, date, time, location, signup_count } = event
  const { predicted_count, likelihood, risk_factors = [], signup_trend } = prediction
  const { overPrepGap, wastedCostUsd, recommendedPrep, savingsIfAdjustedUsd, sources = [] } = wasteInsight

  const formattedDate = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : date

  const dropPct = signup_count > 0
    ? Math.round(((signup_count - predicted_count) / signup_count) * 100)
    : 0

  const insightActions = getInsightActions({ risk_factors, signup_trend, predicted_count, signup_count })

  return (
    <Card className="w-full bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        {/* Event title + trend badge */}
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-snug text-gray-900">{name}</CardTitle>
          {signup_trend && (
            <Badge variant="outline" className={`shrink-0 text-xs border ${TREND_STYLES[signup_trend] ?? TREND_STYLES.stagnant}`}>
              {TREND_LABELS[signup_trend] ?? signup_trend}
            </Badge>
          )}
        </div>
        {/* Meta — small, light */}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-0.5">
          {formattedDate && <span>{formattedDate}</span>}
          {time && <span>{time}</span>}
          {location && <span>{location}</span>}
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5">

        {/* 1. PRIMARY: Recommendation + savings */}
        <WasteCostBanner
          overPrepGap={overPrepGap}
          wastedCostUsd={wastedCostUsd}
          recommendedPrep={recommendedPrep}
          savingsUsd={savingsIfAdjustedUsd}
          rsvpCount={signup_count}
          sources={sources}
        />

        {/* 2. SUPPORTING: Expected engaged attendees + RSVP context */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <span className="text-xs text-gray-400">Expected:</span>
          <span className="font-semibold text-gray-700">{predicted_count} engaged attendees</span>
          {dropPct > 0 && (
            <span className="text-xs text-gray-400 font-normal">({signup_count} RSVPs, −{dropPct}%)</span>
          )}
          {/* Risk level — minimal */}
          {likelihood && (
            <span className={`ml-auto text-xs font-medium px-1.5 py-0.5 rounded ${
              likelihood === 'High'   ? 'text-green-600 bg-green-50' :
              likelihood === 'Medium' ? 'text-yellow-600 bg-yellow-50' :
                                        'text-red-500 bg-red-50'
            }`}>
              {likelihood === 'High' ? 'Low risk' : likelihood === 'Medium' ? 'Med risk' : 'High risk'}
            </span>
          )}
        </div>

        {/* 3. Risk factor chips — short labels only */}
        {risk_factors.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {risk_factors.map((rf, i) => (
              <span
                key={i}
                className={`inline-block text-xs px-2 py-0.5 rounded-full border ${RISK_CHIP_STYLES[rf.type] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}
              >
                {RISK_SHORT_LABELS[rf.type] ?? rf.label}
              </span>
            ))}
          </div>
        )}

        {/* Opportunity nudge */}
        {dropPct >= 20 && (
          <p className="text-xs text-blue-600 font-medium">
            💡 Opportunity: improve turnout with better targeting
          </p>
        )}

        {/* Insight → Action pairs (max 2, always visible) */}
        {insightActions.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-gray-100">
            {insightActions.map(({ insight, action, impact, sub }) => (
              <div key={action} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500 leading-tight">{insight}</span>
                <button
                  onClick={() => console.log('Action:', action)}
                  className="shrink-0 flex flex-col items-end text-right focus:outline-none group"
                >
                  <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-800 transition-colors">
                    {action} <span className="text-green-600">{impact}</span>
                  </span>
                  {sub && <span className="text-[10px] text-gray-400">{sub}</span>}
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
