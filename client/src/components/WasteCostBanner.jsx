import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function WasteCostBanner({
  overPrepGap,
  wastedCostUsd,
  recommendedPrep,
  savingsUsd,
  rsvpCount,
  sources = [],
}) {
  if (overPrepGap === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 font-medium">
        ✓ No over-preparation expected
      </div>
    )
  }

  return (
    <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2.5 space-y-1">
      {/* Primary: optimized prep */}
      <div className="text-base font-bold text-green-800">
        Prepare {recommendedPrep}{' '}
        <span className="text-green-600 font-normal text-sm">(optimized)</span>
      </div>

      {/* Secondary: waste avoidance framed as outcome */}
      <div className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
        <span>Avoid ~${savingsUsd.toFixed(0)} waste</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-xs text-green-500 hover:text-green-700 focus:outline-none" aria-label="View sources">
                ⓘ
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-semibold text-xs">Sources</p>
                <ul className="text-xs space-y-0.5">
                  {sources.map((s) => <li key={s}>• {s}</li>)}
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
