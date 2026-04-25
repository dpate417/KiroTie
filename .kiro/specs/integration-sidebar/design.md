# Design Document — Integration Sidebar

## Overview

The Integration Sidebar is a static, purely presentational panel added to the right side of `OrganizerDashboard`. It displays three planned platform integrations (Handshake, Meetup, ASU Portal) as cards with status badges and hover tooltips. All content is sourced from a local data array — no API calls, no backend changes.

The component lives at `client/src/components/IntegrationSidebar.jsx` and is imported directly into `OrganizerDashboard`.

---

## Architecture

No new architectural layers are introduced. The sidebar is a leaf component that reads from a module-level constant.

```
OrganizerDashboard
  ├── event grid (existing)
  └── IntegrationSidebar (new, right column, lg+ only)
        └── INTEGRATIONS[] (static data array, same file or co-located)
```

The dashboard layout shifts from a full-width event grid to a two-column layout on `lg` (1024px+) breakpoints: the event grid occupies the left column and the sidebar occupies a fixed-width right column.

---

## Components and Interfaces

### IntegrationSidebar

**File:** `client/src/components/IntegrationSidebar.jsx`

**Props:** none

**Responsibilities:**
- Render the sidebar heading and intro sentence
- Map over `INTEGRATIONS` and render one card per entry
- Wrap each card in a shadcn/ui `Tooltip` for hover detail
- Render a fallback message when `INTEGRATIONS` is empty

**Imports used:**
- `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` from `@/components/ui/tooltip`
- `Badge` from `@/components/ui/badge`

### OrganizerDashboard changes

The outer content wrapper gains a two-column grid at `lg`:

```jsx
// before
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

// after — wrap event grid + sidebar in a flex/grid container
<div className="flex flex-col lg:flex-row gap-6">
  <div className="flex-1 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {/* existing EventCards */}
  </div>
  <IntegrationSidebar />
</div>
```

`IntegrationSidebar` itself uses `hidden lg:flex` so it is invisible below 1024px without affecting the event grid.

---

## Data Models

### INTEGRATIONS array

Defined as a module-level constant inside `IntegrationSidebar.jsx`:

```js
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
```

Each entry has the shape:

```ts
interface Integration {
  name: string        // platform display name
  icon: string        // emoji used as logo stand-in
  description: string // one-sentence value prop shown on card
  status: 'Coming Soon' | 'In Planning' | 'Beta'
  tooltip: string     // hover detail text
}
```

### STATUS_COLORS mapping

A pure function / lookup object mapping status labels to Tailwind badge classes:

```js
const STATUS_COLORS = {
  'Coming Soon': 'bg-amber-100 text-amber-700 border-amber-200',
  'In Planning': 'bg-blue-100  text-blue-700  border-blue-200',
  'Beta':        'bg-green-100 text-green-700 border-green-200',
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: All integration entries are complete

*For any* entry in the `INTEGRATIONS` array, every required field (`name`, `icon`, `description`, `status`, `tooltip`) must be a non-empty string.

**Validates: Requirements 6.1**

### Property 2: Status values are within the allowed set

*For any* entry in the `INTEGRATIONS` array, its `status` field must be one of `"Coming Soon"`, `"In Planning"`, or `"Beta"`.

**Validates: Requirements 3.1**

### Property 3: Status color mapping is total and injective

*For any* valid status label (`"Coming Soon"`, `"In Planning"`, `"Beta"`), `STATUS_COLORS[status]` must return a non-empty string, and all three labels must map to distinct strings.

**Validates: Requirements 3.5**

### Property 4: Rendered card contains name and description

*For any* integration object with a non-empty `name` and `description`, the rendered `IntegrationSidebar` output must contain both strings.

**Validates: Requirements 2.2**

### Property 5: Rendered card contains status badge text

*For any* integration object with a valid `status`, the rendered card must contain a badge element whose text matches the `status` value.

**Validates: Requirements 2.4**

---

## Error Handling

- If `INTEGRATIONS` is empty (e.g., during development or future config change), the sidebar renders a single fallback line: *"No integrations are currently planned for display."*
- No runtime errors are possible from the data layer since the array is a compile-time constant.
- The `Tooltip` components are wrapped in a single `TooltipProvider` at the sidebar root to avoid provider-nesting issues.

---

## Testing Strategy

This feature is a static UI component with a pure data layer. Testing focuses on:

**Unit / example-based tests** (Vitest + React Testing Library):
- Sidebar renders all three platform names
- Each card shows the correct status badge label
- Fallback message renders when data array is empty
- Tooltip content is present in the DOM on hover (simulate with `userEvent.hover`)
- Sidebar has `hidden lg:flex` classes (responsive behavior)

**Property-based tests** (fast-check, minimum 100 iterations per property):

Each property test references its design property via a comment tag:
`// Feature: integration-sidebar, Property N: <property text>`

- **Property 1** — Generate arbitrary arrays of integration-shaped objects; assert all required fields are non-empty strings. *(Validates the data contract of INTEGRATIONS)*
- **Property 2** — For each entry in INTEGRATIONS, assert `status` is in the allowed set.
- **Property 3** — For each valid status string, assert `STATUS_COLORS[status]` is a non-empty string and all three map to distinct values.
- **Property 4** — Generate random `{name, description}` pairs; render a card and assert both appear in the output.
- **Property 5** — Generate random valid status strings; render a card and assert the badge text matches.

PBT is appropriate here because `STATUS_COLORS` and the `INTEGRATIONS` data contract are pure mappings where input variation (different status strings, different field values) meaningfully exercises the logic and edge cases (empty strings, unknown status values) are worth catching automatically.
