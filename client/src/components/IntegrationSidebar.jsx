import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const INTEGRATIONS = [
  {
    name: 'Handshake',
    icon: '🤝',
    description: 'Automatically post events to Handshake to reach students actively seeking opportunities.',
    status: 'Coming Soon',
    tooltip: 'Sync your EventWise events directly to Handshake so students browsing career and campus opportunities discover them without extra effort.',
  },
  {
    name: 'Meetup',
    icon: '📍',
    description: 'Publish campus events to Meetup to grow attendance from the broader local community.',
    status: 'In Planning',
    tooltip: 'Extend your event reach beyond campus by publishing to Meetup, connecting with local professionals and community members.',
  },
  {
    name: 'ASU Portal',
    icon: '🏫',
    description: 'Surface EventWise event data directly within the ASU student and staff portal.',
    status: 'Coming Soon',
    tooltip: 'Make your events visible inside the ASU Portal so students and staff see them in the tools they already use every day.',
  },
]

const STATUS_COLORS = {
  'Coming Soon': 'bg-amber-100 text-amber-700 border-amber-200',
  'In Planning': 'bg-blue-100  text-blue-700  border-blue-200',
  'Beta':        'bg-green-100 text-green-700 border-green-200',
}

export default function IntegrationSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Integrations</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Expand your event reach with these upcoming platform integrations on the EventWise roadmap.
        </p>
      </div>

      {INTEGRATIONS.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No integrations are currently planned for display.
        </p>
      ) : (
        <TooltipProvider>
          <div className="flex flex-col gap-3">
            {INTEGRATIONS.map((integration) => (
              <Tooltip key={integration.name}>
                <TooltipTrigger asChild>
                  <Card className="cursor-default">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl leading-none mt-0.5" aria-hidden="true">
                          {integration.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-foreground">
                              {integration.name}
                            </span>
                            <span
                              className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"
                              aria-hidden="true"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                            {integration.description}
                          </p>
                          <Badge
                            className={STATUS_COLORS[integration.status]}
                            variant="outline"
                          >
                            {integration.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p>{integration.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      )}
    </aside>
  )
}
