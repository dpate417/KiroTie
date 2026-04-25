import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const INTEGRATIONS = [
  { name: 'Handshake',  status: 'Coming soon' },
  { name: 'Meetup',     status: 'In planning' },
  { name: 'ASU Portal', status: 'Coming soon' },
]

const STATUS_BADGE_CLASSES = {
  'Coming soon': 'bg-amber-100 text-amber-700 border border-amber-200',
  'In planning': 'bg-blue-100 text-blue-700 border border-blue-200',
}

function StatusBadge({ status }) {
  const classes = STATUS_BADGE_CLASSES[status] ?? 'bg-gray-100 text-gray-600 border border-gray-200'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>
      {status}
    </span>
  )
}

export default function DashboardSidebar({ onLogout, activePath }) {
  const navigate = useNavigate()

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Events', path: '/events' },
    { label: 'Add Event (Manual)', path: '/add-event' },
  ]

  return (
    <aside className="hidden lg:flex flex-col min-h-screen w-60 bg-white border-r">
      {/* Branding */}
      <div className="px-5 py-5">
        <span className="text-xl font-bold tracking-tight text-gray-900">EventWise</span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ label, path }) => {
          const isActive = path !== null && activePath === path
          return (
            <div
              key={label}
              onClick={() => path && navigate(path)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                path ? 'cursor-pointer' : 'cursor-default select-none'
              } ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {label}
            </div>
          )
        })}

        {/* Integrations section */}
        <div className="pt-4 pb-1 px-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Integrations
          </span>
        </div>

        {INTEGRATIONS.map(({ name, status }) => (
          <div
            key={name}
            className="flex items-center justify-between px-3 py-2 rounded-md text-xs text-gray-500 hover:bg-gray-50"
          >
            <span>{name}</span>
            <StatusBadge status={status} />
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={onLogout}
        >
          Logout
        </Button>
      </div>
    </aside>
  )
}
