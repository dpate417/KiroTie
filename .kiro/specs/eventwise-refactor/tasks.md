# Implementation Plan: EventWise Refactor

## Overview

Tasks are sequenced for a demo-first delivery. P0 produces a fully working organizer card + student calendar in the browser with no backend, no API, and no auth. P1 wires in the Flask backend. P2 adds mock SSO login. P3 polishes for production-demo quality.

## Tasks

---

## P0 — Core Demo (mock data → calculations → UI)

Goal: working organizer card + student calendar with no Flask, no API, no auth.

- [x] 1. Project scaffolding (frontend only)
  - [x] 1.1 Create React/Vite frontend structure
    - Run `npm create vite@latest client -- --template react` (or scaffold manually)
    - Install dependencies: `tailwindcss`, `postcss`, `autoprefixer`, `shadcn/ui`, `react-router-dom`
    - Configure `tailwind.config.js` and `postcss.config.js`
    - Initialize shadcn/ui (`npx shadcn-ui@latest init`)
    - Create `client/src/utils/`, `client/src/components/`, `client/src/pages/` directories
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 2. Mock event data
  - [x] 2.1 Create `client/src/data/mockEvents.js`
    - Define 4–6 hardcoded event objects as a JS array matching the `Event` shape from the design
    - Cover varied scenarios: competing events, academic conflicts, different time slots, different signup counts
    - Include `registered_students` arrays so the student calendar can filter by email
    - _Requirements: 2.1, 3.1, 6.1_

- [x] 3. Pure JS calculation utilities
  - [x] 3.1 Implement `client/src/utils/attendanceEngine.js`
    - Implement `computePrediction(event)` — apply signal weights (historical ratio 0.65, time of day ±0.05, day of week ±0.05, competing events −0.10 each capped −0.20, academic conflict −0.15), clamp to `[0, signup_count]`
    - Implement `classifyLikelihood(predicted, signups)` — `High` ≥80%, `Medium` 50–79%, `Low` <50%
    - Implement `computeRiskFactors(event)` — return array of `{ type, label, detail }` objects
    - Implement `getSignupTrend(event)` — return `"growing" | "slowing" | "stagnant"`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.2 Write unit tests for attendanceEngine.js
    - Test default ratio (0.65) when no historical data
    - Test each signal weight in isolation
    - Test clamping to `[0, signup_count]`
    - Test likelihood thresholds at boundaries (80%, 50%)
    - _Requirements: 3.2, 3.4, 3.5_

  - [x] 3.3 Implement `client/src/utils/wasteCostEngine.js`
    - Define inline baseline constants object (mirrors `data/event_baselines.json` values)
    - Implement `computeWaste(event, predictedCount)` — returns `{ overPrepGap, wastedCostUsd, recommendedPrep, savingsIfAdjustedUsd, carbonSavingsKg, perPersonCostUsd, sources }`
    - `over_prep_gap = rsvp_count - predicted_count`; when `predicted >= rsvp`, all waste figures are zero
    - `recommended_prep = round(predicted_count × 1.10)`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 4.2, 4.3, 4.4_

  - [ ]* 3.4 Write unit tests for wasteCostEngine.js
    - Test zero-waste case (`predicted >= rsvp`)
    - Test correct `per_person_cost` ($6.75) and `recommended_prep` (10% buffer)
    - Test `sources` list is populated
    - _Requirements: 5.5, 4.3, 5.2_

- [x] 4. WasteCostBanner component
  - [x] 4.1 Implement `client/src/components/WasteCostBanner.jsx`
    - Props: `{ overPrepGap, wastedCostUsd, recommendedPrep, savingsUsd, rsvpCount, sources }`
    - Render: "⚠️ Prepare for {recommendedPrep} instead of {rsvpCount}" as primary line
    - Render: "Est. waste: ${wastedCostUsd} · Save ${savingsUsd} by adjusting prep" with shadcn/ui `Tooltip` on ⓘ listing all sources
    - When `overPrepGap === 0`: render a green "No over-preparation expected" state
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 4.5, 4.6_

- [x] 5. EventCard component
  - [x] 5.1 Implement `client/src/components/EventCard.jsx`
    - Props: full event object + pre-computed `prediction` and `wasteInsight`
    - At-a-glance zone (always visible): event name, date/time/location, signup count vs predicted (e.g. "68 / 120 expected"), signup trend badge, `WasteCostBanner`, risk factor chips
    - Expanded zone (toggle on click): full risk factor detail text, placeholder Quick_Action buttons (no API call yet)
    - Use shadcn/ui `Card`, `Badge`, `Button`
    - Trend badge colors: growing=green, slowing=yellow, stagnant=gray
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 5.1_

- [x] 6. OrganizerDashboard page (mock data)
  - [x] 6.1 Implement `client/src/pages/OrganizerDashboard.jsx`
    - Import mock events from `mockEvents.js`
    - For each event, call `computePrediction` and `computeWaste` from utils
    - Render responsive grid of `EventCard` components
    - No API calls, no auth guard
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 7. StudentCalendar page (mock data)
  - [x] 7.1 Implement `client/src/pages/StudentCalendar.jsx`
    - Import mock events from `mockEvents.js`, filter to a hardcoded demo student email
    - For each event, call `computePrediction` and `classifyLikelihood` from utils
    - Render a 7-column weekly grid (Mon–Sun) with time slots
    - Default to current week; add previous/next week navigation buttons
    - Color-code event blocks: green (`High`), yellow (`Medium`), red (`Low`) using Tailwind classes
    - _Requirements: 6.1, 6.2, 6.5, 6.6_

  - [x] 7.2 Implement event detail panel in `StudentCalendar.jsx`
    - On event block click: show a shadcn/ui `Sheet` or inline panel with event name, date, time, location, likelihood classification, and reason text from `risk_factors[].detail`
    - _Requirements: 6.3, 6.4_

- [x] 8. Wire up React Router (no auth)
  - [x] 8.1 Set up `client/src/App.jsx` with React Router routes
    - Routes: `/` → redirect to `/dashboard`, `/dashboard` → `OrganizerDashboard`, `/calendar` → `StudentCalendar`
    - No `ProtectedRoute` yet — all routes open
    - _Requirements: 9.1_

- [x] 9. P0 demo checkpoint
  - Open `/dashboard` in browser and confirm organizer cards render with WasteCostBanner and risk factor chips. Open `/calendar` and confirm color-coded weekly view renders from mock data. No Flask, no API, no login required. Ask the user if questions arise.

---

## P1 — Flask Backend + API Wiring

Goal: replace mock data with real Flask backend.

- [x] 10. Flask project structure + baseline JSON
  - [x] 10.1 Create Flask backend structure
    - Create `app.py` (Flask app factory), `requirements.txt` (flask, flask-cors, pytest, hypothesis)
    - Create package directories: `services/`, `models/`, `routes/`, `data/`
    - Add `.env.example` with `FLASK_ENV`, `SECRET_KEY`
    - _Requirements: 7.1, 8.1, 9.4_

  - [x] 10.2 Create `data/event_baselines.json`
    - Write the JSON file with all six constants: `food_waste_cost_per_lb`, `carbon_per_lb_food_waste_kg`, `space_cost_per_person`, `staff_cost_per_person`, `materials_cost_per_person`, `food_waste_lbs_per_person`
    - Each entry must have `value` (positive float) and `source` (string) fields
    - _Requirements: 4.2, 8.1, 8.5_

- [x] 11. Python attendance engine
  - [x] 11.1 Define `models/event.py` — Event and related dataclasses
    - Implement `Event`, `AttendancePrediction`, `RiskFactor` dataclasses matching the design data models
    - _Requirements: 3.1, 3.3_

  - [x] 11.2 Implement `services/attendance_engine.py`
    - Port the same signal-weight logic from `attendanceEngine.js` to Python
    - Implement `compute_prediction(event)`, `classify_likelihood(predicted, signups)`, `compute_risk_factors(event)`, `get_signup_trend(event)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 11.3 Write unit tests for Attendance_Engine (Python)
    - Test default ratio (0.65), each signal weight, clamping, likelihood thresholds
    - _Requirements: 3.2, 3.4, 3.5_

- [x] 12. Python waste/cost engine
  - [x] 12.1 Implement `models/baselines.py` — Baseline_Store loader
    - Define `BaselineConstant` and `Baselines` dataclasses
    - Implement `load_baselines(path)` — reads JSON, validates all values are positive numbers, halts with logged error on missing file or invalid value
    - Expose `per_person_cost` property (`space + staff + materials = $6.75`)
    - _Requirements: 4.1, 8.2, 8.3, 8.4_

  - [x] 12.2 Implement `services/waste_cost_engine.py`
    - Implement `WasteInsight` dataclass in `models/waste.py`
    - Implement `compute_waste(event, prediction, baselines)` — same logic as JS util
    - Populate `sources` list from `BaselineConstant.source` fields
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 4.3, 4.4, 4.8_

  - [ ]* 12.3 Write unit tests for Waste_Cost_Engine (Python)
    - Test zero-waste case, correct `per_person_cost`, `recommended_prep`, `sources` list
    - _Requirements: 5.5, 4.3, 5.2_

  - [ ]* 12.4 Write property test for baseline round-trip consistency
    - **Property: Round-trip consistency** — serialize loaded `Baselines` back to JSON and reload; all values must be equal
    - **Validates: Requirement 8.6**
    - Use `hypothesis` in `tests/test_baselines.py`

- [x] 13. Flask REST API routes
  - [x] 13.1 Create seed event data in `data/events_seed.py`
    - Define 4–6 hardcoded `Event` objects (same scenarios as `mockEvents.js`)
    - This is the in-memory data store used by all event routes
    - _Requirements: 2.1, 3.1_

  - [x] 13.2 Implement `GET /api/events` in `routes/events.py`
    - No auth guard yet (added in P2)
    - Accept optional `role` query param (`organizer` or `student`) and `email` query param for filtering
    - Return full `EventSummary` list with computed prediction and waste insight
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 7.2_

  - [x] 13.3 Implement `GET /api/events/{event_id}` in `routes/events.py`
    - Return full `EventSummary` plus `signal_breakdown` and `competing_events[]`
    - Return 404 if event not found
    - _Requirements: 7.3, 2.2, 3.1_

  - [x] 13.4 Implement `POST /api/events/{event_id}/actions` in `routes/events.py`
    - Accept `action_type` from request body
    - Return recommendation string based on action type and event data
    - "Reduce over-preparation" → "Prepare for {recommended_prep} instead of {rsvp_count} to save ${savings}."
    - _Requirements: 2.8, 2.9, 2.10, 2.11, 2.12, 7.4_

  - [x] 13.5 Register blueprints in `app.py`, add CORS and global 500 handler
    - Wire `events` blueprint under `/api`
    - Add `@app.errorhandler(500)` returning JSON error envelope and logging error
    - Enable CORS for `http://localhost:5173`
    - _Requirements: 7.7, 7.8, 9.4_

- [x] 14. Vite proxy + replace frontend mock data with API calls
  - [x] 14.1 Add `server.proxy` in `client/vite.config.js`
    - Proxy `/api` to `http://localhost:5000`
    - _Requirements: 7.1, 9.4_

  - [x] 14.2 Implement `client/src/api/client.js`
    - Thin `fetch` wrapper; export `apiGet(path)`, `apiPost(path, body)`
    - No auth header yet (added in P2)
    - _Requirements: 7.2, 9.4_

  - [x] 14.3 Replace mock data in `OrganizerDashboard.jsx` with `GET /api/events`
    - Add loading skeleton (shadcn/ui `Skeleton`) while fetching
    - Add error state if fetch fails
    - Pass `role=organizer` and a hardcoded demo email as query params (no real auth yet)
    - _Requirements: 2.1, 7.2_

  - [x] 14.4 Replace mock data in `StudentCalendar.jsx` with `GET /api/events`
    - Pass `role=student` and a hardcoded demo student email as query params
    - _Requirements: 6.1, 7.2_

  - [x] 14.5 Wire Quick_Action buttons in `EventCard.jsx` to `POST /api/events/{id}/actions`
    - On click: call API, display returned `recommendation` string in a shadcn/ui `Alert` below the card
    - Show correct actions based on risk factors and no-show rate per requirements 2.9–2.12
    - _Requirements: 2.8, 2.9, 2.10, 2.11, 2.12_

- [~] 15. P1 checkpoint — full stack working end-to-end
  - Run `pytest` and confirm all backend tests pass. Start Flask and Vite dev server, confirm organizer dashboard and student calendar load from live API with no mock data. Ask the user if questions arise.

---

## P2 — Mock ASU SSO Auth

Goal: add login flow after core demo works.

- [x] 16. Auth_Service (Python)
  - [x] 16.1 Implement `services/auth_service.py`
    - Implement `validate_email(email)`, `assign_role(email)`, `create_session(email, role)`, `get_session(token)`, `invalidate_session(token)`
    - Define `Session` dataclass in `models/session.py`
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7_

  - [ ]* 16.2 Write unit tests for Auth_Service
    - Test non-`@asu.edu` rejection, role assignment, session lifecycle
    - _Requirements: 1.2, 1.3, 1.6, 1.7_

- [x] 17. POST /api/auth/login route
  - [x] 17.1 Implement `routes/auth.py` — `POST /api/auth/login` and `POST /api/auth/logout`
    - Validate email, create session, return `{ status, data: { token, role }, error }`
    - Return 400 for invalid email format
    - Logout: invalidate session, return 200
    - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.7_

  - [x] 17.2 Implement auth middleware in `routes/middleware.py`
    - `require_auth` decorator: reads `Authorization: Bearer <token>` header, returns 401 if missing/invalid
    - `require_role(role)` decorator: returns 403 if session role doesn't match
    - Apply decorators to all event routes
    - _Requirements: 1.6, 1.8, 7.5, 7.6_

- [x] 18. LoginPage (React)
  - [x] 18.1 Implement `client/src/pages/LoginPage.jsx`
    - Single email input form using shadcn/ui `Input` and `Button`
    - On submit: call `POST /api/auth/login` via API client
    - On success: store token in `sessionStorage`, navigate to `/dashboard` (organizer) or `/calendar` (student)
    - On error: display inline error message
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 19. ProtectedRoute wrapper
  - [x] 19.1 Add `ProtectedRoute` to `client/src/App.jsx`
    - Reads token from sessionStorage; redirects to `/login` if absent
    - Add `/login` route → `LoginPage`
    - Wrap `/dashboard` and `/calendar` routes with `ProtectedRoute`
    - _Requirements: 1.4, 1.5, 1.8_

  - [x] 19.2 Update `client/src/api/client.js` to attach Bearer token
    - Attach `Authorization: Bearer <token>` from sessionStorage on every request
    - Global 401 handler: clear token, redirect to `/login`
    - _Requirements: 7.5, 9.4_

- [x] 20. Logout wiring
  - [x] 20.1 Add logout button in dashboard and calendar headers
    - On click: call `POST /api/auth/logout`, clear sessionStorage token, navigate to `/login`
    - _Requirements: 1.7_

- [~] 21. P2 checkpoint — auth flow working
  - Confirm login as organizer → dashboard, login as student → calendar, logout → login page. Confirm protected routes redirect unauthenticated requests. Ask the user if questions arise.

---

## P3 — Polish and Error Handling

Goal: production-ready demo quality.

- [x] 22. Global error toast
  - [x] 22.1 Implement `client/src/components/ErrorToast.jsx`
    - Use shadcn/ui `Toast`
    - Subscribe to error event dispatched by API client on 500 responses
    - Mount in `App.jsx`
    - _Requirements: 7.8_

- [x] 23. Loading skeletons
  - [x] 23.1 Add shadcn/ui `Skeleton` loading states to `OrganizerDashboard.jsx` and `StudentCalendar.jsx`
    - Show skeleton while API fetch is in flight
    - _Requirements: 2.1, 6.1_

- [x] 24. Baseline error handling end-to-end
  - [x] 24.1 Verify Baseline_Store error handling
    - Confirm that if `data/event_baselines.json` is missing or has an invalid value, Flask logs the error and refuses to start
    - Confirm that `EventCard` displays "savings data unavailable" when the engine returns an error
    - _Requirements: 4.7, 5.6, 8.3, 8.4_

- [x] 25. Quick action handler polish
  - [x] 25.1 Ensure all four Quick_Action types are wired and return correct recommendation strings
    - "Adjust event timing", "Target a better audience", "Reduce over-preparation", "Increase outreach"
    - Verify correct actions surface based on risk factors per requirements 2.9–2.12
    - _Requirements: 2.8, 2.9, 2.10, 2.11, 2.12_

- [~] 26. Final checkpoint
  - Run `pytest` (backend) and `npm run build` (frontend) with no errors. Confirm the full user journey: login as organizer → event cards with waste/cost banners → quick action; login as student → color-coded calendar. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- P0 produces a fully runnable demo with zero backend dependencies
- P1 replaces mock data with Flask; P0 JS utils and P1 Python engines share the same logic
- Seed event data (task 13.1) mirrors `mockEvents.js` so the demo looks identical before and after the API swap
- `per_person_cost` ($6.75) is always derived at runtime from baseline constants, never hardcoded
- Carbon savings are computed and stored in `WasteInsight` but the MVP card only surfaces financial figures
