# Implementation Plan: Integration Sidebar

## Overview

Add a static, purely presentational `IntegrationSidebar` component to the Organizer Dashboard. All content is sourced from a local data array — no API calls or backend changes required.

## Tasks

- [x] 1. Create IntegrationSidebar component
  - Create `client/src/components/IntegrationSidebar.jsx`
  - Define the `INTEGRATIONS` static data array with entries for Handshake, Meetup, and ASU Portal (each with `name`, `icon`, `description`, `status`, `tooltip`)
  - Define the `STATUS_COLORS` lookup object mapping `"Coming Soon"`, `"In Planning"`, and `"Beta"` to distinct Tailwind badge class strings
  - Render the sidebar heading, intro sentence, and one card per `INTEGRATIONS` entry using shadcn/ui `Card`, `Badge`, `Tooltip`/`TooltipProvider`/`TooltipTrigger`/`TooltipContent`
  - Each card must show: platform icon, name, description, `Status_Badge` (using `STATUS_COLORS`), and a pulsing dot indicator
  - Wrap all `Tooltip` components in a single `TooltipProvider` at the sidebar root
  - Render a fallback message `"No integrations are currently planned for display."` when `INTEGRATIONS` is empty
  - Apply `hidden lg:flex flex-col` so the sidebar is invisible below 1024px
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 1.1 Write property test: all integration entries are complete
    - **Property 1: All integration entries are complete**
    - Assert every entry in `INTEGRATIONS` has non-empty string values for `name`, `icon`, `description`, `status`, and `tooltip`
    - Use fast-check to generate arbitrary arrays of integration-shaped objects and verify the contract
    - `// Feature: integration-sidebar, Property 1: All integration entries are complete`
    - **Validates: Requirements 6.1**

  - [ ]* 1.2 Write property test: status values are within the allowed set
    - **Property 2: Status values are within the allowed set**
    - Assert each entry's `status` is one of `"Coming Soon"`, `"In Planning"`, or `"Beta"`
    - `// Feature: integration-sidebar, Property 2: Status values are within the allowed set`
    - **Validates: Requirements 3.1**

  - [ ]* 1.3 Write property test: STATUS_COLORS mapping is total and injective
    - **Property 3: Status color mapping is total and injective**
    - Assert `STATUS_COLORS[status]` returns a non-empty string for each valid status label
    - Assert all three labels map to distinct strings
    - `// Feature: integration-sidebar, Property 3: Status color mapping is total and injective`
    - **Validates: Requirements 3.5**

- [x] 2. Wire IntegrationSidebar into OrganizerDashboard
  - Import `IntegrationSidebar` into `client/src/pages/OrganizerDashboard.jsx`
  - Wrap the existing event grid and the new sidebar in a `<div className="flex flex-col lg:flex-row gap-6">` container
  - Place the event grid in a `<div className="flex-1 ...">` so it continues to fill available space
  - Render `<IntegrationSidebar />` as the second child of the flex container
  - Verify the existing event grid, loading skeleton, and error state are all still rendered correctly inside the new wrapper
  - _Requirements: 1.1, 1.3, 1.4_

  - [ ]* 2.1 Write property test: rendered card contains name and description
    - **Property 4: Rendered card contains name and description**
    - Use fast-check to generate random `{name, description}` pairs; render `IntegrationSidebar` with a mocked `INTEGRATIONS` array and assert both strings appear in the output
    - `// Feature: integration-sidebar, Property 4: Rendered card contains name and description`
    - **Validates: Requirements 2.2**

  - [ ]* 2.2 Write property test: rendered card contains status badge text
    - **Property 5: Rendered card contains status badge text**
    - Use fast-check to generate random valid status strings; render a card and assert the badge text matches the status value
    - `// Feature: integration-sidebar, Property 5: Rendered card contains status badge text`
    - **Validates: Requirements 2.4**

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check (minimum 100 iterations per property)
- Unit tests use Vitest + React Testing Library
