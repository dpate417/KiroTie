import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { apiPost } from '@/api/client'

const TREND_STYLES = {
  growing:  'bg-green-100 text-green-700 border-green-200',
  slowing:  'bg-amber-100 text-amber-700 border-amber-200',
  stagnant: 'bg-gray-100 text-gray-500 border-gray-200',
}
const TREND_LABELS = {
  growing: '↑ Growing', slowing: '↓ Slowing', stagnant: '→ Stagnant',
}

const RISK_CHIP_STYLES = {
  competing_event:   'bg-red-50 text-red-500 border-red-100',
  academic_conflict: 'bg-orange-50 text-orange-500 border-orange-100',
  poor_time_slot:    'bg-yellow-50 text-yellow-600 border-yellow-100',
  low_interest:      'bg-blue-50 text-blue-500 border-blue-100',
}
const RISK_SHORT_LABELS = {
  competing_event:   'Competing event',
  academic_conflict: 'Finals week',
  poor_time_slot:    'Low-traffic day',
  low_interest:      'Low interest',
}

const LIKELIHOOD_STYLES = {
  High:   'text-emerald-700 bg-emerald-50',
  Medium: 'text-amber-600 bg-amber-50',
  Low:    'text-red-500 bg-red-50',
}
const LIKELIHOOD_LABELS = {
  High: 'Low risk', Medium: 'Med risk', Low: 'High risk',
}

/**
 * Build quick actions — same logic, updated labels per spec.
 * Req 2.9–2.12
 */
function getQuickActions({ risk_factors = [], signup_trend, predicted_count, signup_count }) {
  const actions = []
  const hasPoorSlot    = risk_factors.some((r) => r.type === 'poor_time_slot')
  const hasAcademic    = risk_factors.some((r) => r.type === 'academic_conflict')
  const hasLowInterest = risk_factors.some((r) => r.type === 'low_interest')
  const noShowRate     = signup_count > 0 ? (signup_count - predicted_count) / signup_count : 0

  if (hasPoorSlot || hasAcademic)
    actions.push({ label: 'Adjust timing', hint: '+10%', actionType: 'adjust_timing', primary: false })
  if (hasLowInterest)
    actions.push({ label: 'Target audience', hint: '+15%', actionType: 'target_audience', primary: false })
  if (noShowRate > 0.20)
    actions.push({ label: 'Optimize preparation', hint: 'save waste', actionType: 'reduce_over_preparation', primary: false })
  if (signup_trend === 'slowing' || signup_trend === 'stagnant')
    actions.push({ label: 'Increase outreach', hint: '+15%', actionType: 'increase_outreach', primary: true })

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

  const [actionResult, setActionResult] = useState(null)
  const [actionError, setActionError]   = useState(null)
  const [pendingAction, setPendingAction] = useState(null)

  const formattedDate = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : date

  const dropPct = signup_count > 0
    ? Math.round(((signup_count - predicted_count) / signup_count) * 100)
    : 0

  const quickActions = getQuickActions({ risk_factors, signup_trend, predicted_count, signup_count })

  const hasOpportunity = dropPct >= 20

  async function handleAction(actionType) {
    setPendingAction(actionType)
    setActionResult(null)
    setActionError(null)
    try {
      const res = await apiPost(`/events/${id}/actions`, { action_type: actionType })
      const recommendation = res?.data?.recommendation ?? res?.recommendation ?? 'Action submitted.'
      setActionResult(recommendation)
    } catch {
      setActionError('Could not complete action. Please try again.')
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <Card className="w-full bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">

      {/* ── Header ── */}
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg font-bold leading-snug text-gray-900">{name}</CardTitle>
          {signup_trend && (
            <Badge variant="outline" className={`shrink-0 text-xs font-medium border rounded-full px-2.5 py-0.5 ${TREND_STYLES[signup_trend] ?? TREND_STYLES.stagnant}`}>
              {TREND_LABELS[signup_trend] ?? signup_trend}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-1">
          {formattedDate && <span>{formattedDate}</span>}
          {time && <span>{time}</span>}
          {location && <span className="truncate max-w-[180px]">{location}</span>}
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 space-y-4">

        {/* ── 1. Main recommendation panel ── */}
        {overPrepGap != null && overPrepGap > 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 space-y-0.5">
            <p className="text-3xl font-bold text-emerald-800 leading-tight">
              Prepare {recommendedPrep}
            </p>
            <p className="text-xl font-semibold text-emerald-700">
              Save ${savingsIfAdjustedUsd != null ? Math.round(savingsIfAdjustedUsd) : 0}
            </p>
            {sources.length > 0 && (
              <p className="text-xs text-emerald-500 pt-1">Sources: {sources.join(' · ')}</p>
            )}
          </div>
        ) : overPrepGap === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
            <p className="text-sm font-semibold text-emerald-700">✓ No over-preparation expected</p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
            <p className="text-sm text-gray-400">Savings data unavailable</p>
          </div>
        )}

        {/* ── 2. Metrics row ── */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Expected</p>
            <p className="text-base font-bold text-gray-800">{predicted_count}</p>
            <p className="text-[10px] text-gray-400">attendees</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">RSVP Gap</p>
            <p className="text-base font-bold text-gray-800">{signup_count} → {predicted_count}</p>
            {dropPct > 0 && <p className="text-[10px] text-gray-400">−{dropPct}%</p>}
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Risk</p>
            <p className={`text-sm font-bold ${
              likelihood === 'High' ? 'text-emerald-600' :
              likelihood === 'Medium' ? 'text-amber-600' : 'text-red-500'
            }`}>
              {likelihood ?? '—'}
            </p>
          </div>
        </div>

        {/* ── 3. Risk chips ── */}
        {risk_factors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {risk_factors.map((rf, i) => (
              <span
                key={i}
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${RISK_CHIP_STYLES[rf.type] ?? 'bg-gray-50 text-gray-400 border-gray-100'}`}
              >
                {RISK_SHORT_LABELS[rf.type] ?? rf.label}
              </span>
            ))}
          </div>
        )}

        {/* ── 4. Opportunity panel ── */}
        {hasOpportunity && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
            <p className="text-sm font-medium text-blue-800">
              💡 Improve turnout with better targeting
            </p>
          </div>
        )}

        {/* ── 5. Action buttons ── */}
        {quickActions.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {quickActions.map(({ label, hint, actionType, primary }) => (
              <button
                key={actionType}
                onClick={() => handleAction(actionType)}
                disabled={pendingAction === actionType}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 focus:outline-none ${
                  primary
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                {pendingAction === actionType ? 'Loading…' : `${label} ${hint}`}
              </button>
            ))}
          </div>
        )}

        {/* ── Action result ── */}
        {actionResult && (
          <Alert className="border-blue-200 bg-blue-50 text-blue-800 rounded-xl">
            <AlertDescription className="text-sm">{actionResult}</AlertDescription>
          </Alert>
        )}

        {actionError && (
          <Alert className="border-red-200 bg-red-50 text-red-700 rounded-xl">
            <AlertDescription className="text-sm">{actionError}</AlertDescription>
          </Alert>
        )}

      </CardContent>
    </Card>
  )
}
