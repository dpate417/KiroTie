import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import WasteCostBanner from '@/components/WasteCostBanner'
import { apiPost } from '@/api/client'

const TREND_STYLES = {
  growing:  'bg-green-100 text-green-700 border-green-200',
  slowing:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  stagnant: 'bg-gray-100 text-gray-500 border-gray-200',
}
const TREND_LABELS = {
  growing: '↑ Growing', slowing: '↓ Slowing', stagnant: '→ Stagnant',
}

const RISK_CHIP_STYLES = {
  competing_event:   'bg-red-50 text-red-600 border-red-200',
  academic_conflict: 'bg-orange-50 text-orange-600 border-orange-200',
  poor_time_slot:    'bg-yellow-50 text-yellow-600 border-yellow-200',
  low_interest:      'bg-blue-50 text-blue-600 border-blue-200',
}
const RISK_SHORT_LABELS = {
  competing_event:   'Competing event',
  academic_conflict: 'Finals week',
  poor_time_slot:    'Low-traffic day',
  low_interest:      'Low interest',
}

/**
 * Build the list of quick actions to show based on risk factors and no-show rate.
 * Req 2.9–2.12
 *
 * Returns an array of { label, actionType } objects (max 2, deduplicated).
 */
function getQuickActions({ risk_factors = [], signup_trend, predicted_count, signup_count }) {
  const actions = []

  const hasPoorSlot   = risk_factors.some((r) => r.type === 'poor_time_slot')
  const hasAcademic   = risk_factors.some((r) => r.type === 'academic_conflict')
  const hasLowInterest= risk_factors.some((r) => r.type === 'low_interest')

  // Req 2.9 — adjust timing when poor_time_slot or academic_conflict
  if (hasPoorSlot || hasAcademic) {
    actions.push({ label: 'Adjust event timing', actionType: 'adjust_timing' })
  }

  // Req 2.10 — target audience when low_interest
  if (hasLowInterest) {
    actions.push({ label: 'Target a better audience', actionType: 'target_audience' })
  }

  // Req 2.11 — reduce over-preparation when predicted no-show rate > 20%
  const noShowRate = signup_count > 0 ? (signup_count - predicted_count) / signup_count : 0
  if (noShowRate > 0.20) {
    actions.push({ label: 'Reduce over-preparation', actionType: 'reduce_over_preparation' })
  }

  // Req 2.12 — increase outreach when signup_trend is slowing or stagnant
  if (signup_trend === 'slowing' || signup_trend === 'stagnant') {
    actions.push({ label: 'Increase outreach', actionType: 'increase_outreach' })
  }

  // Deduplicate by actionType, cap at 2
  const seen = new Set()
  return actions.filter(({ actionType }) => {
    if (seen.has(actionType)) return false
    seen.add(actionType)
    return true
  }).slice(0, 2)
}

export default function EventCard({ event, prediction, wasteInsight }) {
  const { id, name, date, time, location, signup_count } = event
  const { predicted_count, likelihood, risk_factors = [], signup_trend } = prediction
  const { overPrepGap, wastedCostUsd, recommendedPrep, savingsIfAdjustedUsd, sources = [] } = wasteInsight ?? {}

  const [actionResult, setActionResult]   = useState(null)   // recommendation string
  const [actionError, setActionError]     = useState(null)
  const [pendingAction, setPendingAction] = useState(null)   // actionType currently in-flight

  const formattedDate = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : date

  const dropPct = signup_count > 0
    ? Math.round(((signup_count - predicted_count) / signup_count) * 100)
    : 0

  const quickActions = getQuickActions({ risk_factors, signup_trend, predicted_count, signup_count })

  async function handleAction(actionType) {
    setPendingAction(actionType)
    setActionResult(null)
    setActionError(null)
    try {
      const res = await apiPost(`/events/${id}/actions`, { action_type: actionType })
      const recommendation = res?.data?.recommendation ?? res?.recommendation ?? 'Action submitted.'
      setActionResult(recommendation)
    } catch (err) {
      setActionError('Could not complete action. Please try again.')
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <Card className="w-full bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-snug text-gray-900">{name}</CardTitle>
          {signup_trend && (
            <Badge variant="outline" className={`shrink-0 text-xs border ${TREND_STYLES[signup_trend] ?? TREND_STYLES.stagnant}`}>
              {TREND_LABELS[signup_trend] ?? signup_trend}
            </Badge>
          )}
        </div>
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

        {/* 3. Risk factor chips */}
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

        {/* Quick action buttons — Req 2.8–2.12 */}
        {quickActions.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-gray-100">
            {quickActions.map(({ label, actionType }) => (
              <div key={actionType} className="flex items-center justify-end">
                <button
                  onClick={() => handleAction(actionType)}
                  disabled={pendingAction === actionType}
                  className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors focus:outline-none"
                >
                  {pendingAction === actionType ? 'Loading…' : label}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action result alert */}
        {actionResult && (
          <Alert className="mt-2 border-blue-200 bg-blue-50 text-blue-800">
            <AlertDescription>{actionResult}</AlertDescription>
          </Alert>
        )}

        {/* Action error alert */}
        {actionError && (
          <Alert className="mt-2 border-red-200 bg-red-50 text-red-700">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

      </CardContent>
    </Card>
  )
}
