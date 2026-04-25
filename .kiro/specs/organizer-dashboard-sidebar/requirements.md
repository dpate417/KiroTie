# Requirements Document

## Introduction

Refactor the OrganizerDashboard page to replace the current single-column layout (with a right-side IntegrationSidebar) with a two-column layout featuring a persistent left sidebar for navigation. The left sidebar provides app branding, primary navigation links, an integrations section with status badges, and a logout action. The main content area retains all existing event cards at full width. This change makes the app feel like a real product with structured navigation and positions integrations as a future extensibility layer.

## Glossary

- **OrganizerDashboard**: The main page rendered at `/dashboard` for authenticated organizer users.
- **DashboardSidebar**: The new left-side navigation component, fixed at ~240px width, replacing the current right-side IntegrationSidebar.
- **IntegrationSidebar**: The existing right-side component (`IntegrationSidebar.jsx`) to be removed from the dashboard layout.
- **EventCard**: The existing card component that displays event summaries — must not be modified.
- **MainContent**: The right-side area of the two-column layout that renders the event card grid.
- **NavItem**: A single clickable navigation entry in the DashboardSidebar menu.
- **IntegrationNavItem**: A sub-item under the Integrations section in the DashboardSidebar, representing a future platform integration.
- **StatusBadge**: A small inline badge indicating the availability status of an IntegrationNavItem (e.g., "Coming soon", "In planning").

---

## Requirements

### Requirement 1: Two-Column Dashboard Layout

**User Story:** As an organizer, I want the dashboard to have a persistent left sidebar alongside the main content, so that the app feels structured and navigable like a real product.

#### Acceptance Criteria

1. THE OrganizerDashboard SHALL render a two-column layout with the DashboardSidebar on the left and the MainContent on the right.
2. THE DashboardSidebar SHALL have a fixed width of 240px.
3. THE MainContent SHALL occupy the remaining horizontal space to the right of the DashboardSidebar.
4. THE OrganizerDashboard SHALL apply `min-h-screen` so both columns span the full viewport height.
5. WHEN the viewport is below the large breakpoint (`lg`), THE OrganizerDashboard SHALL collapse the DashboardSidebar so it does not overlap or break the MainContent layout.

---

### Requirement 2: Sidebar Branding

**User Story:** As an organizer, I want to see the app name at the top of the sidebar, so that I always know which product I am using.

#### Acceptance Criteria

1. THE DashboardSidebar SHALL display the text "EventWise" at the top of the sidebar.
2. THE DashboardSidebar SHALL render the app name with prominent styling (bold, larger text) that visually distinguishes it from navigation items.

---

### Requirement 3: Sidebar Navigation Menu

**User Story:** As an organizer, I want a vertical navigation menu in the sidebar, so that I can understand the app's structure and navigate between sections.

#### Acceptance Criteria

1. THE DashboardSidebar SHALL render a vertical list of NavItems including "Dashboard" and "Events".
2. THE DashboardSidebar SHALL highlight the "Dashboard" NavItem as the active item when the organizer is on the `/dashboard` route.
3. THE DashboardSidebar SHALL render an "Integrations" section label below the primary NavItems.
4. WHEN a NavItem is active, THE DashboardSidebar SHALL apply a distinct visual style (e.g., highlighted background or bold text) to differentiate it from inactive NavItems.
5. THE DashboardSidebar SHALL render an "Add Event (Manual)" NavItem positioned after "Events" and before the "Integrations" section label.

---

### Requirement 4: Integrations Sub-Section

**User Story:** As an organizer, I want to see upcoming integrations listed in the sidebar, so that I understand the product roadmap and future extensibility.

#### Acceptance Criteria

1. THE DashboardSidebar SHALL render three IntegrationNavItems under the "Integrations" section: "Handshake", "Meetup", and "ASU Portal".
2. EACH IntegrationNavItem SHALL display a StatusBadge indicating its availability status.
3. THE DashboardSidebar SHALL render the "Handshake" IntegrationNavItem with a StatusBadge labeled "Coming soon".
4. THE DashboardSidebar SHALL render the "Meetup" IntegrationNavItem with a StatusBadge labeled "In planning".
5. THE DashboardSidebar SHALL render the "ASU Portal" IntegrationNavItem with a StatusBadge labeled "Coming soon".
6. THE DashboardSidebar SHALL render IntegrationNavItem labels with smaller text than primary NavItems to visually indicate they are sub-items.

---

### Requirement 5: Sidebar Bottom Actions

**User Story:** As an organizer, I want logout and settings actions at the bottom of the sidebar, so that utility actions are consistently placed and out of the way of primary navigation.

#### Acceptance Criteria

1. THE DashboardSidebar SHALL render a "Logout" button at the bottom of the sidebar.
2. WHEN the organizer clicks the "Logout" button, THE DashboardSidebar SHALL invoke the logout handler, clear the session token, and navigate the organizer to `/login`.
3. WHERE a Settings entry is included, THE DashboardSidebar SHALL render a "Settings" NavItem above the "Logout" button at the bottom of the sidebar.

---

### Requirement 6: Sidebar Visual Styling

**User Story:** As an organizer, I want the sidebar to have a clean, professional appearance, so that the dashboard feels polished and easy to read.

#### Acceptance Criteria

1. THE DashboardSidebar SHALL apply a light gray or white background color.
2. THE DashboardSidebar SHALL apply a right-side border to visually separate it from the MainContent area.
3. THE DashboardSidebar SHALL apply consistent vertical spacing between all NavItems and sections.
4. THE DashboardSidebar SHALL apply `min-h-screen` to ensure the sidebar spans the full viewport height regardless of content length.

---

### Requirement 7: Main Content Area

**User Story:** As an organizer, I want the existing event cards to use the full available width in the main content area, so that the dashboard information is easy to scan.

#### Acceptance Criteria

1. THE MainContent SHALL render all existing EventCard components unchanged.
2. THE OrganizerDashboard SHALL remove the IntegrationSidebar component from the layout.
3. THE MainContent SHALL use the full width of the right-side column for the event card grid.
4. THE MainContent SHALL preserve the existing loading skeleton, error state, and event count display.

---

### Requirement 8: No Data or Logic Changes

**User Story:** As a developer, I want the refactor to be layout-only, so that no existing data fetching, API calls, or business logic is affected.

#### Acceptance Criteria

1. THE OrganizerDashboard SHALL retain all existing API calls (`apiGet`, `apiPost`) without modification.
2. THE OrganizerDashboard SHALL retain the `mapEventSummary` and `mapWasteInsight` mapping functions without modification.
3. THE EventCard component SHALL not be modified as part of this refactor.
4. THE OrganizerDashboard SHALL retain the existing logout logic (`apiPost('/auth/logout')`, `sessionStorage.removeItem`) and move it to the DashboardSidebar's logout handler.

---

### Requirement 9: Add Event (Manual) Nav Item

**User Story:** As an organizer, I want to see an "Add Event (Manual)" option in the sidebar navigation, so that I have a clear fallback entry point for manual event creation when no integrations are connected.

#### Acceptance Criteria

1. THE DashboardSidebar SHALL render an "Add Event (Manual)" NavItem in the primary navigation list.
2. THE "Add Event (Manual)" NavItem SHALL be positioned after the "Events" NavItem and before the "Integrations" section label.
3. THE "Add Event (Manual)" NavItem SHALL be styled consistently with other primary NavItems (same font size, spacing, and hover treatment).
4. THE DashboardSidebar SHALL render the "Add Event (Manual)" NavItem as a visual element only, with no routing, click handler, or navigation logic attached.
5. THE OrganizerDashboard SHALL not require any new API calls, state changes, or business logic to support the "Add Event (Manual)" NavItem.
