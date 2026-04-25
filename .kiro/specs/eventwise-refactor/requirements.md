# Requirements Document

## Introduction

EventWise reveals the hidden cost of overestimating attendance and helps organizers make financially better decisions.

EventWise is a two-sided campus event attendance intelligence platform for Arizona State University (ASU). It addresses the gap between event registrations and actual attendance — where organizers plan for 100% of signups but only 60–70% show up, resulting in wasted food, over-reserved space, excess materials, and unnecessary staff time.

The platform is built around four core features:
- **Organizer Event Dashboard** — card-based view with predicted attendance, risk factors, and quick actions.
- **Attendance Intelligence** — estimates real attendance using schedule, interest, and timing signals.
- **Waste & Cost Insight** — converts overestimation into visible economic impact: unused food, wasted cost, and CO₂.
- **Student Calendar View** — shows recommended and conflicting events based on the student's actual schedule.

Authentication is handled via a mock ASU SSO that assigns roles automatically based on ASU email address.

---

## Glossary

- **EventWise**: The full platform described in this document.
- **Organizer**: An ASU staff or faculty member who creates and manages campus events.
- **Student**: An ASU student who registers for and attends campus events.
- **Auth_Service**: The mock ASU SSO authentication component.
- **Event_Dashboard**: The organizer-facing card-based event management view.
- **Event_Card**: A single card in the Event_Dashboard representing one event.
- **Attendance_Engine**: The backend component that computes predicted attendance and risk factors.
- **Calendar_View**: The student-facing schedule-aware event calendar.
- **Savings_Calculator**: The backend component that computes estimated cost savings using verified baseline constants.
- **Waste_Cost_Engine**: The backend component that computes per-event waste figures (food, space, staff, materials) and carbon impact, and surfaces them as a savings opportunity banner on each Event_Card.
- **Baseline_Store**: The `data/event_baselines.json` file containing verified economic and environmental constants.
- **Risk_Factor**: A condition that reduces predicted attendance (e.g., schedule conflict, competing event, academic calendar conflict).
- **Attendance_Likelihood**: A three-level classification (High, Medium, Low) assigned to each event for a given student.
- **No-show**: A registered student who does not attend an event.
- **Quick_Action**: An organizer-triggered recommendation to improve event outcomes.
- **ASU_SSO**: ASU's Central Authentication Service, simulated in this platform.
- **API**: The Flask REST JSON interface between frontend and backend.

---

## Requirements

### Requirement 1: Mock ASU SSO Authentication

**User Story:** As an ASU user (organizer or student), I want to log in with my ASU email so that I am automatically directed to the correct dashboard for my role.

#### Acceptance Criteria

1. THE Auth_Service SHALL provide a single `/login` route accessible to both organizers and students.
2. WHEN a user submits an email address that does not end in `@asu.edu`, THE Auth_Service SHALL reject the login attempt and display an error message indicating that an ASU email is required.
3. WHEN a user submits a valid `@asu.edu` email address, THE Auth_Service SHALL assign a role of either `organizer` or `student` based on the email address.
4. WHEN a user is authenticated with the `organizer` role, THE Auth_Service SHALL redirect the user to the Event_Dashboard.
5. WHEN a user is authenticated with the `student` role, THE Auth_Service SHALL redirect the user to the Calendar_View.
6. WHILE a user session is active, THE Auth_Service SHALL maintain the authenticated role for all subsequent API requests.
7. WHEN a user logs out, THE Auth_Service SHALL invalidate the session and redirect the user to the `/login` route.
8. IF an unauthenticated request is made to a protected route, THEN THE Auth_Service SHALL redirect the request to the `/login` route.

---

### Requirement 2: Organizer Event Dashboard

**User Story:** As an organizer, I want a card-based dashboard showing all my events so that I can quickly assess which events are at risk and take corrective action.

#### Acceptance Criteria

1. WHEN an authenticated organizer accesses the Event_Dashboard, THE Event_Dashboard SHALL display one Event_Card for each event owned by that organizer.
2. THE Event_Card SHALL display the event name, date, time, location, total signup count, and predicted attendance count.
3. THE Event_Card SHALL display the signup trend as one of three states: `growing`, `slowing`, or `stagnant`.
4. THE Event_Card SHALL display a list of active Risk_Factors for the event.
5. WHEN an event has one or more competing events in the same time slot, THE Event_Card SHALL identify those competing events as a Risk_Factor.
6. WHEN an event date falls within an ASU academic calendar conflict period (finals, midterms, spring break, or fall break), THE Event_Card SHALL display that period as a Risk_Factor.
7. THE Event_Card SHALL display the estimated savings figure produced by the Savings_Calculator with an inline citation tooltip.
8. WHEN an organizer clicks a Quick_Action on an Event_Card, THE Event_Dashboard SHALL display a contextual recommendation corresponding to that action.
9. THE Event_Dashboard SHALL display a Quick_Action of "Adjust event timing" when the event has a poor time slot or academic calendar conflict Risk_Factor.
10. THE Event_Dashboard SHALL display a Quick_Action of "Target a better audience" when the event has a low interest alignment Risk_Factor.
11. THE Event_Dashboard SHALL display a Quick_Action of "Reduce over-preparation" when the predicted no-show rate exceeds 20%.
12. THE Event_Dashboard SHALL display a Quick_Action of "Increase outreach" when the signup trend is `slowing` or `stagnant`.

---

### Requirement 3: Attendance Prediction

**User Story:** As an organizer, I want to see a predicted attendance count for each event so that I can plan resources based on realistic turnout rather than total signups.

#### Acceptance Criteria

1. WHEN an event is requested by the Event_Dashboard, THE Attendance_Engine SHALL compute a predicted attendance count for that event.
2. THE Attendance_Engine SHALL compute predicted attendance as a value between 0 and the total signup count for the event.
3. WHEN computing predicted attendance, THE Attendance_Engine SHALL incorporate the following signals: time of day, day of week, competing events, academic calendar conflicts, and historical signup-to-attendance ratio for similar events.
4. WHEN no historical data is available for an event, THE Attendance_Engine SHALL apply a default signup-to-attendance ratio of 0.65.
5. THE Attendance_Engine SHALL classify each event's Attendance_Likelihood as `High` when predicted attendance is 80% or more of signups, `Medium` when between 50% and 79%, and `Low` when below 50%.
6. WHEN the predicted attendance changes by 5 or more registrants since the last computation, THE Attendance_Engine SHALL recompute all dependent Risk_Factors and savings estimates.

---

### Requirement 4: Savings Estimation with Cited Sources

**User Story:** As an organizer, I want to see estimated cost savings from reducing over-preparation so that I can justify resource adjustments with credible data.

#### Acceptance Criteria

1. THE Savings_Calculator SHALL compute estimated savings using constants loaded exclusively from the Baseline_Store.
2. THE Baseline_Store SHALL contain the following verified constants with their named sources:
   - Food waste cost: $1.84 per pound (USDA ERS 2023)
   - Carbon emissions: 0.37 kg CO₂ per pound of food waste (EPA WARM Model)
   - Space cost: $3.50 per person (ASU Event Services)
   - Staff cost: $2.00 per person (ASU Event Services)
   - Materials cost: $1.25 per person (ASU Event Services)
3. THE Savings_Calculator SHALL compute the per-person cost as the sum of space cost, staff cost, and materials cost from the Baseline_Store, yielding $6.75 per person.
4. WHEN computing estimated savings for an event, THE Savings_Calculator SHALL multiply the predicted no-show count by the per-person cost.
5. THE Event_Card SHALL display the savings estimate in the format: "Estimated savings this event: $[amount] based on [N] predicted no-shows × $[per-person cost]/person".
6. THE Event_Card SHALL display an inline citation tooltip listing all source names used in the savings computation.
7. IF a constant in the Baseline_Store is missing or malformed, THEN THE Savings_Calculator SHALL return an error and THE Event_Card SHALL display a message indicating that savings data is unavailable.
8. THE Savings_Calculator SHALL compute a carbon savings estimate in kg CO₂ using the EPA WARM Model constant and display it alongside the financial savings figure.

---

### Requirement 5: Waste & Cost Insight

**User Story:** As an organizer, I want to see a clear summary of over-preparation and its estimated cost so that I know how many portions to actually prepare and how much I can save.

#### Acceptance Criteria

1. WHEN an Event_Card is rendered, THE Waste_Cost_Engine SHALL compute and display the gap between the RSVP count and the predicted attendance count as the estimated over-preparation quantity.
2. THE Waste_Cost_Engine SHALL compute an estimated wasted dollar cost by multiplying the over-preparation quantity by the per-person cost constant from the Baseline_Store.
3. THE Waste_Cost_Engine SHALL compute a recommended preparation level as a value slightly above the predicted attendance count to provide a reasonable buffer.
4. THE Event_Card SHALL display the estimated savings an organizer would achieve by preparing at the recommended level instead of the full RSVP count.
5. WHEN the predicted attendance equals or exceeds the RSVP count, THE Waste_Cost_Engine SHALL display a zero waste figure and indicate no over-preparation is expected.
6. IF any required constant is missing or malformed in the Baseline_Store, THEN THE Waste_Cost_Engine SHALL display a fallback message indicating that waste estimates are unavailable.

---

### Requirement 6: Student Schedule-Aware Calendar View

**User Story:** As a student, I want to see my registered events color-coded by attendance likelihood so that I can make informed decisions about which events I can realistically attend.

#### Acceptance Criteria

1. WHEN an authenticated student accesses the Calendar_View, THE Calendar_View SHALL display all events the student has registered for in a calendar layout.
2. THE Calendar_View SHALL color-code each event using the Attendance_Likelihood classification: green for `High`, yellow for `Medium`, and red for `Low`.
3. WHEN a student selects an event in the Calendar_View, THE Calendar_View SHALL display the event name, date, time, location, and the reason for its Attendance_Likelihood classification.
4. WHILE a student has a schedule conflict with an event time slot, THE Calendar_View SHALL classify that event's Attendance_Likelihood as `Low` and display the conflict as the reason.
5. THE Calendar_View SHALL display events across a weekly view, with the ability to navigate to previous and next weeks.
6. WHEN a student's registered events are retrieved, THE Calendar_View SHALL display the current week by default.

---

### Requirement 7: REST API

**User Story:** As a developer, I want a well-defined REST API so that the React frontend and Flask backend can exchange data reliably.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/auth/login` endpoint that accepts an ASU email and returns a session token and assigned role.
2. THE API SHALL expose a `GET /api/events` endpoint that returns all events visible to the authenticated user based on their role.
3. THE API SHALL expose a `GET /api/events/{event_id}` endpoint that returns full event details including predicted attendance, Risk_Factors, and savings estimate for an organizer, or Attendance_Likelihood and conflict reasons for a student.
4. THE API SHALL expose a `POST /api/events/{event_id}/actions` endpoint that accepts a Quick_Action type and returns a contextual recommendation string.
5. WHEN a request is made to any API endpoint without a valid session token, THE API SHALL return an HTTP 401 response.
6. WHEN a request is made to an API endpoint with a valid session token but insufficient role permissions, THE API SHALL return an HTTP 403 response.
7. THE API SHALL return all responses in JSON format with a consistent envelope containing `data`, `error`, and `status` fields.
8. IF an internal server error occurs during request processing, THEN THE API SHALL return an HTTP 500 response with an error message and THE API SHALL log the error details server-side.

---

### Requirement 8: Baseline Data Integrity

**User Story:** As a developer, I want the economic and environmental constants to be loaded from a single verified source file so that all savings calculations remain consistent and auditable.

#### Acceptance Criteria

1. THE Baseline_Store SHALL be a single JSON file located at `data/event_baselines.json`.
2. THE Savings_Calculator SHALL load constants from the Baseline_Store at application startup.
3. WHEN the Baseline_Store file is absent at startup, THE Savings_Calculator SHALL halt initialization and log an error identifying the missing file path.
4. WHEN the Baseline_Store file contains a constant with a value that is not a positive number, THE Savings_Calculator SHALL halt initialization and log an error identifying the invalid field name and value.
5. THE Baseline_Store SHALL include a `sources` field for each constant that names the originating data source.
6. FOR ALL valid Baseline_Store files, loading then serializing then loading the constants SHALL produce an equivalent set of values (round-trip property).

---

### Requirement 9: Frontend Technology Compliance

**User Story:** As a developer, I want the frontend built with the specified technology stack so that the codebase is consistent and maintainable.

#### Acceptance Criteria

1. THE EventWise frontend SHALL be implemented using React with Vite as the build tool.
2. THE EventWise frontend SHALL use Tailwind CSS for all layout and utility styling.
3. THE EventWise frontend SHALL use shadcn/ui components for interactive UI elements including buttons, cards, tooltips, and calendar components.
4. THE API SHALL serve all data as JSON over HTTP to the React frontend, with no server-side HTML rendering.
5. WHEN the frontend is built for production, THE EventWise frontend SHALL produce a static asset bundle compatible with serving from a standard HTTP file server.
