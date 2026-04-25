# Requirements Document

## Introduction

The Integration Sidebar is a visual-only panel added to the Organizer Dashboard that communicates EventWise's planned integrations with external platforms — Handshake, Meetup, and the ASU Portal. This is a demo and marketing feature intended to demonstrate the platform's roadmap to stakeholders. No real integration logic, API calls, or data exchange with external platforms is required. The sidebar surfaces each planned integration in a polished, informative way that builds confidence in the platform's future direction.

---

## Glossary

- **Integration_Sidebar**: The visual panel rendered on the right side of the Organizer Dashboard that displays planned external platform integrations.
- **Integration_Card**: A single entry within the Integration_Sidebar representing one planned external platform.
- **Platform**: An external service that EventWise plans to integrate with in the future (Handshake, Meetup, or ASU Portal).
- **Status_Badge**: A visual label on each Integration_Card indicating the integration's roadmap status (e.g., "Coming Soon", "In Planning").
- **Organizer_Dashboard**: The existing card-based event management view accessible to authenticated organizers.
- **Tooltip**: A small overlay that appears on hover, providing additional context about a Platform or its planned integration.

---

## Requirements

### Requirement 1: Integration Sidebar Presence on Organizer Dashboard

**User Story:** As an organizer, I want to see a sidebar on my dashboard that shows planned platform integrations so that I understand what future capabilities are coming to EventWise.

#### Acceptance Criteria

1. WHEN an authenticated organizer accesses the Organizer_Dashboard, THE Integration_Sidebar SHALL be rendered in the right-hand region of the dashboard layout.
2. THE Integration_Sidebar SHALL display a section heading that clearly identifies it as showing future or planned integrations.
3. THE Integration_Sidebar SHALL remain visible alongside the existing event card grid without obscuring or displacing any existing dashboard content.
4. WHILE the Organizer_Dashboard is displayed on a viewport narrower than 1024px, THE Integration_Sidebar SHALL collapse or reposition to avoid degrading the event card layout.

---

### Requirement 2: Integration Cards

**User Story:** As an organizer, I want each planned integration displayed as a distinct card so that I can quickly scan which platforms are on the roadmap.

#### Acceptance Criteria

1. THE Integration_Sidebar SHALL display one Integration_Card for each of the following platforms: Handshake, Meetup, and ASU Portal.
2. THE Integration_Card SHALL display the platform name and a brief one-sentence description of what the integration will enable.
3. THE Integration_Card SHALL display a platform logo or representative icon alongside the platform name.
4. THE Integration_Card SHALL display a Status_Badge indicating the integration's roadmap status.
5. THE Integration_Sidebar SHALL display all three Integration_Cards in a consistent visual style using the existing EventWise design system (Tailwind CSS and shadcn/ui components).

---

### Requirement 3: Status Badges

**User Story:** As an organizer, I want each integration card to show a status label so that I can tell at a glance how far along each integration is in the roadmap.

#### Acceptance Criteria

1. THE Status_Badge SHALL display one of the following labels: "Coming Soon", "In Planning", or "Beta".
2. THE Status_Badge for Handshake SHALL display "Coming Soon".
3. THE Status_Badge for Meetup SHALL display "In Planning".
4. THE Status_Badge for ASU Portal SHALL display "Coming Soon".
5. THE Status_Badge SHALL use a distinct background color per label to allow quick visual differentiation: a muted gold or amber tone for "Coming Soon", a muted blue tone for "In Planning", and a muted green tone for "Beta".

---

### Requirement 4: Hover Tooltips

**User Story:** As an organizer, I want to hover over an integration card and see more detail about the planned integration so that I can understand the value it will bring.

#### Acceptance Criteria

1. WHEN an organizer hovers over an Integration_Card, THE Tooltip SHALL appear and display a short description of the planned integration's benefit to the organizer workflow.
2. THE Tooltip SHALL be implemented using the existing shadcn/ui Tooltip component already present in the codebase.
3. WHEN the organizer moves the cursor away from the Integration_Card, THE Tooltip SHALL dismiss without requiring any additional interaction.
4. THE Tooltip content for Handshake SHALL describe syncing event postings to reach students actively seeking opportunities.
5. THE Tooltip content for Meetup SHALL describe publishing campus events to a broader local community audience.
6. THE Tooltip content for ASU Portal SHALL describe surfacing EventWise event data directly within the ASU student and staff portal.

---

### Requirement 5: Visual Polish and Roadmap Framing

**User Story:** As a stakeholder viewing a demo, I want the sidebar to look intentional and polished so that it communicates a credible product roadmap rather than a placeholder.

#### Acceptance Criteria

1. THE Integration_Sidebar SHALL include a short introductory sentence above the Integration_Cards that frames the section as part of EventWise's integration roadmap.
2. THE Integration_Sidebar SHALL use visual styling consistent with the existing Organizer_Dashboard, including matching border radius, shadow, and color palette.
3. THE Integration_Card SHALL display a subtle animated or static visual indicator (such as a pulsing dot or lock icon) that reinforces the "coming soon" nature of the integration without implying it is currently active.
4. IF the Integration_Sidebar is rendered in a context where no Integration_Cards are defined, THEN THE Integration_Sidebar SHALL display a fallback message indicating that no integrations are currently planned for display.

---

### Requirement 6: No Real Integration Logic

**User Story:** As a developer, I want the sidebar to be entirely static and data-driven from a local configuration so that no external API calls or authentication flows are introduced.

#### Acceptance Criteria

1. THE Integration_Sidebar SHALL source all displayed content (platform names, descriptions, statuses, tooltip text) from a static local data structure defined within the frontend codebase.
2. THE Integration_Sidebar SHALL make no HTTP requests to any external platform API.
3. THE Integration_Sidebar SHALL introduce no new backend routes, Flask endpoints, or server-side logic.
4. WHEN the Integration_Sidebar is rendered, THE Integration_Sidebar SHALL not require any authenticated session data beyond what is already available on the Organizer_Dashboard.
