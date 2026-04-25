# Implementation Plan: Organizer Dashboard Sidebar

## Overview

Refactor `OrganizerDashboard` from a single-column layout to a two-column shell by creating a new `DashboardSidebar` component and updating the page to use it. All existing data logic, API calls, and `EventCard` rendering are preserved unchanged.

## Tasks

- [x] 1. Create `DashboardSidebar` component
  - Create `client/src/components/DashboardSidebar.jsx`
  - Add `hidden lg:flex flex-col min-h-screen` responsive classes to the sidebar root element
  - Apply a fixed `w-60` width, light background (`bg-white` or `bg-gray-50`), and a right border (`border-r`)
  - Render "EventWise" branding text at the top with bold, larger styling
  - Render a vertical nav list: "Dashboard" (active-highlighted when `activePath === "/dashboard"`), "Events", "Add Event (Manual)" — no `onClick` or routing on any item
  - Render an "Integrations" section label below the primary nav items
  - Define the static `INTEGRATIONS` array inline: `[{ name: 'Handshake', status: 'Coming soon' }, { name: 'Meetup', status: 'In planning' }, { name: 'ASU Portal', status: 'Coming soon' }]`
  - Render each integration entry with its name and a `StatusBadge` using the correct color mapping (`Coming soon` → amber, `In planning` → blue)
  - Render a "Logout" `Button` (ghost/outline variant) pinned to the bottom of the sidebar that calls the `onLogout` prop
  - Accept props: `onLogout: () => void`, `activePath: string`
  - _Requirements: 1.2, 1.5, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 1.1 Write property test for DashboardSidebar — every integration item has a status badge
    - Install `fast-check` as a dev dependency if not already present (`npm install --save-dev fast-check` in `client/`)
    - Create `client/src/components/__tests__/DashboardSidebar.property.test.jsx`
    - Use `fc.array(fc.record({ name: fc.string(), status: fc.string() }), { minLength: 1 })` to generate arbitrary integration lists
    - Render `DashboardSidebar` with the generated list (accept an optional `integrations` prop or patch the module constant)
    - Assert that the rendered output contains exactly one status badge element per integration entry
    - Run with minimum 100 iterations
    - **Property 1: Every integration item has a status badge**
    - **Validates: Requirements 4.2**

  - [ ]* 1.2 Write unit tests for DashboardSidebar
    - Create `client/src/components/__tests__/DashboardSidebar.test.jsx`
    - Test: renders "EventWise" branding text
    - Test: renders "Dashboard", "Events", "Add Event (Manual)" nav items in order
    - Test: "Add Event (Manual)" has no `onClick` attribute
    - Test: "Dashboard" nav item has active styling when `activePath="/dashboard"`
    - Test: renders "Handshake", "Meetup", "ASU Portal" with correct badge labels
    - Test: clicking "Logout" button calls `onLogout`
    - Test: sidebar root element has `hidden lg:flex` classes
    - _Requirements: 1.5, 2.1, 3.1, 3.2, 3.5, 4.1, 4.3, 4.4, 4.5, 5.1, 5.2, 9.4_

- [x] 2. Update `OrganizerDashboard` to use the two-column layout
  - Open `client/src/pages/OrganizerDashboard.jsx`
  - Remove the `IntegrationSidebar` import and its JSX usage
  - Add `import DashboardSidebar from '@/components/DashboardSidebar'`
  - Replace the outer background-image `<div>` wrapper with a plain `<div className="min-h-screen flex">` two-column shell
  - Render `<DashboardSidebar onLogout={handleLogout} activePath="/dashboard" />` as the left column
  - Wrap the existing event grid content in `<main className="flex-1 p-6 overflow-y-auto">` as the right column
  - Keep `handleLogout`, `useEffect`/`apiGet`, `mapEventSummary`, `mapWasteInsight`, `items`/`loading`/`error` state, and all `EventCard` usage exactly as-is
  - _Requirements: 1.1, 1.3, 1.4, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 2.1 Write property test for OrganizerDashboard — every event summary produces an EventCard
    - Create `client/src/pages/__tests__/OrganizerDashboard.property.test.jsx`
    - Use `fc.array(fc.record({ id: fc.uuid(), name: fc.string(), date: fc.string(), predicted_count: fc.integer(), likelihood: fc.float(), risk_factors: fc.array(fc.string()), signup_trend: fc.string(), signup_count: fc.integer() }), { minLength: 1 })` to generate arbitrary event summary arrays
    - Mock `apiGet` to resolve with the generated array
    - Render `OrganizerDashboard` inside a `MemoryRouter`
    - Assert that the rendered output contains exactly `items.length` `EventCard` instances (query by test id or component display name)
    - Run with minimum 100 iterations
    - **Property 2: Every event summary produces an EventCard**
    - **Validates: Requirements 7.1**

  - [ ]* 2.2 Write unit tests for OrganizerDashboard layout
    - Create `client/src/pages/__tests__/OrganizerDashboard.test.jsx`
    - Test: `IntegrationSidebar` is not rendered
    - Test: `DashboardSidebar` is rendered
    - Test: loading skeletons are shown when `loading=true`
    - Test: error message is shown when `error` is set
    - Test: event count text is shown when loaded
    - _Requirements: 1.1, 7.2, 7.4_

- [x] 3. Checkpoint — ensure all tests pass
  - Run `npm run test -- --run` (or equivalent) inside `client/` and confirm all tests pass.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- `IntegrationSidebar.jsx` is preserved on disk but no longer imported by `OrganizerDashboard`
- Property tests use fast-check with a minimum of 100 iterations per property
