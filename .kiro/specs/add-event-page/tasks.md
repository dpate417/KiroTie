# Implementation Plan: Add Event Page

## Overview

Build the `/add-event` route with a two-column shell (DashboardSidebar + main content), a manual entry form backed by `POST /api/predict`, a CSV upload section backed by `POST /api/upload`, and deterministic mock fallbacks for both workflows. Wire the existing "Add Event (Manual)" sidebar item to navigate to the new route.

## Tasks

- [x] 1. Create mock fallback utilities
  - Create `client/src/utils/mockFallbacks.js` with `mockPredictFallback(payload)` and `mockUploadFallback()`
  - `mockPredictFallback` derives `predicted_attendance` deterministically from `expected_signups` × a fixed show-rate keyed by `event_type` (see SHOW_RATES table in design)
  - `mockUploadFallback` returns a static object with an `events` array of 3 entries and a `summary` object
  - Both functions are pure with no React imports or side effects
  - _Requirements: 6.1, 6.2, 6.3, 9.1, 9.2_

  - [ ]* 1.1 Write property test for `mockPredictFallback` — Property 5
    - **Property 5: Manual mock fallback always returns a complete, deterministic response**
    - Generator: arbitrary `{ expected_signups: integer(1,500), event_type: oneof(five options), planned_quantity: integer(1,500), cost_per_person: float(0,100) }`
    - Assert all required fields present; `factors.length >= 2`; each factor has non-empty `label`, `impact`, `detail`; same inputs → same `predicted_attendance`
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [ ]* 1.2 Write property test for `mockUploadFallback` — Property 8
    - **Property 8: CSV mock fallback always returns a complete response**
    - Generator: none (pure function, no inputs)
    - Assert `events.length >= 3`; each event has non-null `event_name`, `predicted_attendance`, `total_savings_usd`, `status`; `summary` has non-null `total_savings_usd`, `total_co2_saved_kg`, `total_food_waste_lbs`
    - **Validates: Requirements 9.1, 9.2**

- [x] 2. Implement `ManualEntryForm` component
  - Create `client/src/components/ManualEntryForm.jsx`
  - Render all 8 controlled fields: title (text), date (date), time (time), location (text), category (select with exactly `food_social | academic_workshop | career_fair | club_meeting | general`), expectedRsvp (number, min 1), costPerPerson (number, min 0), plannedQuantity (number, min 1)
  - Implement planned-quantity sync: use a `userEditedQty` ref; when `expectedRsvp` changes and `userEditedQty` is false, mirror value into `plannedQuantity`; set `userEditedQty = true` on direct edit of `plannedQuantity`
  - Implement synchronous validation: block submission and show inline errors when any required field is empty, `expectedRsvp < 1` ("Must be at least 1"), or `costPerPerson < 0` ("Cannot be negative")
  - On valid submission call `props.onSubmit` with mapped payload `{ event_type, expected_signups, planned_quantity, cost_per_person }`
  - Disable submit button and show spinner when `props.loading` is true
  - _Requirements: 2.1–2.10, 3.1–3.4, 4.1, 4.2_

  - [ ]* 2.1 Write property test for form validation — Property 1
    - **Property 1: Invalid form inputs are always rejected**
    - Generator: arbitrary form state objects with at least one required field set to `""` or a numeric field below its minimum
    - Assert `onSubmit` is never called; at least one error message is present in the DOM
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 2.2 Write property test for payload shape — Property 2
    - **Property 2: Valid form inputs always produce a correctly shaped API payload**
    - Generator: arbitrary valid form states (non-empty strings, `expectedRsvp` in `[1,1000]`, `costPerPerson` in `[0,500]`, `plannedQuantity` in `[1,1000]`, `category` from the five valid options)
    - Assert `onSubmit` called with `event_type`, `expected_signups`, `planned_quantity`, `cost_per_person` matching form values
    - **Validates: Requirements 3.4, 4.1**

  - [ ]* 2.3 Write property test for planned-quantity sync — Property 3
    - **Property 3: Planned quantity tracks RSVP count until manually overridden**
    - Generator: arbitrary positive integers for `expectedRsvp`
    - Assert that after setting `expectedRsvp` without touching `plannedQuantity`, the `plannedQuantity` field value equals `expectedRsvp`
    - **Validates: Requirements 2.9**

  - [ ]* 2.4 Write unit tests for `ManualEntryForm`
    - Renders all 8 fields and the submit button
    - Clicking submit with empty fields shows validation errors and does not call `onSubmit`
    - `expectedRsvp < 1` shows "Must be at least 1"; `costPerPerson < 0` shows "Cannot be negative"
    - Loading state disables submit button
    - _Requirements: 2.1–2.10, 3.1–3.4_

- [x] 3. Implement `PredictionResultPanel` component
  - Create `client/src/components/PredictionResultPanel.jsx`
  - Return null when `props.data` is null (panel is invisible before first prediction)
  - Display `predicted_attendance`, `planned_quantity`, `food_waste_lbs`, `total_savings_usd` from `data`
  - When `data.factors` is non-empty, render each factor as a labelled item showing `label`, `impact`, and `detail`
  - When `props.isMock` is true, render a yellow notice banner ("Live prediction unavailable — showing mock data")
  - _Requirements: 5.1–5.6_

  - [ ]* 3.1 Write property test for result panel rendering — Property 4
    - **Property 4: Prediction result panel renders all required fields for any valid response**
    - Generator: arbitrary prediction response objects with valid numeric fields and a `factors` array of 1–5 entries
    - Assert rendered output contains string representations of `predicted_attendance`, `food_waste_lbs`, `total_savings_usd`, and each factor's `label`
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

  - [ ]* 3.2 Write unit tests for `PredictionResultPanel`
    - Returns null when `data` is null
    - Renders mock notice banner when `isMock=true`
    - _Requirements: 5.6_

- [x] 4. Implement `CsvUploadSection` component
  - Create `client/src/components/CsvUploadSection.jsx`
  - Render a file input with `accept=".csv"` and a "Upload & Predict" button
  - Track selected file in local state
  - On button click with no file selected, show inline "Please select a CSV file" error and do not call `props.onUpload`
  - On button click with a valid `.csv` file, call `props.onUpload(file)`
  - Disable button and show spinner when `props.loading` is true
  - _Requirements: 7.1–7.5_

  - [ ]* 4.1 Write unit tests for `CsvUploadSection`
    - File input has `accept=".csv"`
    - Clicking "Upload & Predict" with no file shows "Please select a CSV file"
    - Loading state disables button
    - _Requirements: 7.1–7.3_

- [x] 5. Implement `BulkResultsTable` component
  - Create `client/src/components/BulkResultsTable.jsx`
  - Return null when `props.data` is null
  - Render one row per entry in `data.events` showing `event_name`, `predicted_attendance`, `total_savings_usd`, `status`
  - Render a summary row from `data.summary` showing `total_savings_usd`, `total_co2_saved_kg`, `total_food_waste_lbs`
  - When `props.isMock` is true, render a yellow notice banner ("Live upload unavailable — showing mock data")
  - _Requirements: 8.1–8.3_

  - [ ]* 5.1 Write property test for bulk results table — Property 7
    - **Property 7: Bulk results table renders correct rows and summary for any bulk response**
    - Generator: arbitrary `{ events: array(1,20, eventObject), summary: summaryObject }` where each event has the required fields
    - Assert rendered table has exactly `events.length` data rows; each row contains the event's `event_name`; summary row contains `summary.total_savings_usd`
    - **Validates: Requirements 8.1, 8.2**

  - [ ]* 5.2 Write unit tests for `BulkResultsTable`
    - Returns null when `data` is null
    - Renders mock notice banner when `isMock=true`
    - _Requirements: 8.3_

- [x] 6. Implement `AddEventPage` and wire async handlers
  - Create `client/src/pages/AddEventPage.jsx`
  - Replicate the two-column shell from `OrganizerDashboard`: `<div className="min-h-screen flex">` with `DashboardSidebar` on the left and `<main>` on the right; pass `activePath="/add-event"` and `onLogout={handleLogout}` to `DashboardSidebar`
  - Render two labelled sections: "Manual Entry" (containing `ManualEntryForm` and conditionally `PredictionResultPanel`) and "CSV Upload" (containing `CsvUploadSection` and conditionally `BulkResultsTable`)
  - Implement `handlePredict(formValues)`: call `apiPost('/predict', payload)`, on error call `mockPredictFallback(payload)` and set `predictMock=true`; set `prediction` state and `predictLoading` accordingly
  - Implement `handleUpload(file)`: build `FormData`, call native `fetch('/api/upload', { method:'POST', headers:{ Authorization: Bearer token from sessionStorage }, body: formData })`, check `res.ok`, on error call `mockUploadFallback()` and set `uploadMock=true`; set `bulkResult` state and `uploadLoading` accordingly
  - Implement `handleLogout` following the same pattern as `OrganizerDashboard`
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 4.2–4.5, 7.5–7.8, 10.4, 10.5_

  - [ ]* 6.1 Write property test for CSV upload FormData — Property 6
    - **Property 6: CSV upload always sends the file under the correct field name**
    - Generator: mock `File` objects with `.csv` names and arbitrary string content
    - Assert the `FormData` passed to `fetch` contains a `"file"` entry matching the input file; the `Authorization` header is present
    - **Validates: Requirements 7.4, 10.5**

  - [ ]* 6.2 Write unit tests for `AddEventPage`
    - Renders `DashboardSidebar` and both section labels ("Manual Entry", "CSV Upload")
    - `DashboardSidebar` receives `activePath="/add-event"`
    - `PredictionResultPanel` is not visible on initial render
    - `BulkResultsTable` is not visible on initial render
    - On successful predict call, `PredictionResultPanel` becomes visible
    - On failed predict call, mock notice banner is shown
    - On successful upload call, `BulkResultsTable` becomes visible
    - On failed upload call, mock notice banner is shown
    - _Requirements: 1.2, 1.4, 1.5, 4.3–4.5, 7.6–7.8_

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Wire route and sidebar navigation
  - Modify `client/src/App.jsx`: import `AddEventPage` and add `<Route path="/add-event" element={<AddEventPage />} />` inside the existing `ProtectedRoute` block
  - Modify `client/src/components/DashboardSidebar.jsx`: import `useNavigate` from `react-router-dom`; change the "Add Event (Manual)" nav item from a visual-only `div` to a clickable element that calls `navigate('/add-event')` on click; set its `path` to `'/add-event'` so `activePath` highlighting works
  - Do not modify `EventCard`, `OrganizerDashboard`, or any other existing component
  - _Requirements: 1.1, 1.3, 1.4, 10.1, 10.2, 10.3_

  - [ ]* 8.1 Write unit tests for `DashboardSidebar` navigation
    - "Add Event (Manual)" navigates to `/add-event` when clicked
    - `activePath="/dashboard"` highlights "Dashboard" and not "Add Event (Manual)" (non-regression)
    - `activePath="/add-event"` highlights "Add Event (Manual)"
    - _Requirements: 1.3, 1.4, 10.3_

  - [ ]* 8.2 Write route tests
    - `/add-event` redirects to `/login` when unauthenticated
    - `/add-event` renders `AddEventPage` when authenticated
    - _Requirements: 1.1_

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with a minimum of 100 iterations per property
- Unit tests use Vitest + React Testing Library
- The upload handler uses native `fetch` (not `apiPost`) to support multipart `FormData` with the `Authorization` header from `sessionStorage`
- `mockPredictFallback` and `mockUploadFallback` are pure functions — safe to import in both app code and tests
