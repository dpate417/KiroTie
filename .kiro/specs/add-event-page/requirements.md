# Requirements Document

## Introduction

The Add Event page extends the Organizer Dashboard with a dedicated route (`/add-event`) that lets organizers predict attendance and estimate food waste before an event takes place. It exposes two workflows: manual single-event entry (backed by `POST /api/predict`) and bulk CSV upload (backed by `POST /api/upload`). When the real backend endpoints are unavailable, the page falls back to deterministic mock responses so the demo remains fully functional. The page reuses the existing two-column shell (DashboardSidebar + main content) and wires up the currently visual-only "Add Event (Manual)" sidebar item.

## Glossary

- **Add_Event_Page**: The React page component rendered at `/add-event`, containing both the Manual Entry and CSV Upload sections.
- **Manual_Entry_Form**: The sub-section of Add_Event_Page where an organizer fills in fields for a single event and requests a prediction.
- **CSV_Upload_Section**: The sub-section of Add_Event_Page where an organizer uploads a CSV file for bulk prediction.
- **Prediction_Result_Panel**: The UI region that appears below Manual_Entry_Form after a successful prediction call, displaying attendance and waste metrics.
- **Bulk_Results_Table**: The table rendered in CSV_Upload_Section after a successful upload, showing per-event predictions and a summary row.
- **Predict_API**: The backend endpoint `POST /api/predict` that accepts event parameters and returns attendance prediction plus economics data.
- **Upload_API**: The backend endpoint `POST /api/upload` that accepts a multipart CSV file and returns bulk prediction results.
- **Mock_Fallback**: A deterministic in-browser function that returns a realistic response when Predict_API or Upload_API is unreachable (non-2xx or network error).
- **DashboardSidebar**: The existing left-side navigation component shared by OrganizerDashboard and Add_Event_Page.
- **ProtectedRoute**: The existing React Router guard that redirects unauthenticated users to `/login`.
- **apiPost**: The existing fetch wrapper in `client/src/api/client.js` used for all JSON POST requests.
- **EventCard**: The existing card component used on OrganizerDashboard; must not be modified.

---

## Requirements

### Requirement 1: Route and Page Shell

**User Story:** As an organizer, I want a dedicated Add Event page accessible from the sidebar, so that I can reach the prediction workflow without leaving the dashboard layout.

#### Acceptance Criteria

1. THE Add_Event_Page SHALL be rendered at the `/add-event` route, protected by ProtectedRoute.
2. WHEN an organizer navigates to `/add-event`, THE Add_Event_Page SHALL display DashboardSidebar on the left and the main content area on the right, matching the two-column layout of OrganizerDashboard.
3. WHEN the "Add Event (Manual)" item is clicked in DashboardSidebar, THE DashboardSidebar SHALL navigate the browser to `/add-event`.
4. WHEN Add_Event_Page is active, THE DashboardSidebar SHALL highlight the "Add Event (Manual)" nav item as active.
5. THE Add_Event_Page SHALL render two clearly labelled sections: "Manual Entry" and "CSV Upload".

---

### Requirement 2: Manual Entry Form Fields

**User Story:** As an organizer, I want to fill in event details in a form, so that I can submit them for an attendance prediction.

#### Acceptance Criteria

1. THE Manual_Entry_Form SHALL include a text input for event title.
2. THE Manual_Entry_Form SHALL include a date input for event date.
3. THE Manual_Entry_Form SHALL include a time input for event time.
4. THE Manual_Entry_Form SHALL include a text input for event location.
5. THE Manual_Entry_Form SHALL include a dropdown (select) for category with exactly the options: `food_social`, `academic_workshop`, `career_fair`, `club_meeting`, `general`.
6. THE Manual_Entry_Form SHALL include a numeric input for expected RSVP count (minimum value: 1).
7. THE Manual_Entry_Form SHALL include a numeric input for estimated cost per attendee in USD (minimum value: 0).
8. THE Manual_Entry_Form SHALL include a numeric input for planned quantity that defaults to the current value of the expected RSVP count field.
9. WHEN the expected RSVP count field value changes AND the organizer has not manually edited the planned quantity field, THE Manual_Entry_Form SHALL update the planned quantity field to match the new expected RSVP count value.
10. THE Manual_Entry_Form SHALL include a submit button labelled "Predict Attendance".

---

### Requirement 3: Manual Entry Validation

**User Story:** As an organizer, I want the form to catch missing or invalid inputs before submission, so that I don't receive confusing API errors.

#### Acceptance Criteria

1. WHEN the organizer clicks "Predict Attendance" and any required field (event title, date, time, location, category, expected RSVP count, planned quantity) is empty or invalid, THE Manual_Entry_Form SHALL display an inline validation message adjacent to each offending field and SHALL NOT call Predict_API.
2. WHEN the organizer clicks "Predict Attendance" and expected RSVP count is less than 1, THE Manual_Entry_Form SHALL display the message "Must be at least 1" adjacent to that field and SHALL NOT call Predict_API.
3. WHEN the organizer clicks "Predict Attendance" and estimated cost per attendee is less than 0, THE Manual_Entry_Form SHALL display the message "Cannot be negative" adjacent to that field and SHALL NOT call Predict_API.
4. WHEN all required fields are valid, THE Manual_Entry_Form SHALL allow the submission to proceed.

---

### Requirement 4: Manual Entry Prediction Call

**User Story:** As an organizer, I want the form to call the prediction API on valid submission, so that I receive an attendance forecast.

#### Acceptance Criteria

1. WHEN the organizer submits a valid Manual_Entry_Form, THE Add_Event_Page SHALL call Predict_API with a JSON body containing at minimum: `event_type` (from category), `expected_signups` (from RSVP count), `planned_quantity`, and `cost_per_person` (from cost per attendee).
2. WHILE a Predict_API call is in progress, THE Add_Event_Page SHALL display a loading indicator and SHALL disable the "Predict Attendance" button.
3. WHEN Predict_API returns a 2xx response, THE Add_Event_Page SHALL pass the response body to Prediction_Result_Panel for display.
4. IF Predict_API returns a non-2xx response or a network error occurs, THE Add_Event_Page SHALL invoke Mock_Fallback and pass its output to Prediction_Result_Panel for display.
5. IF Predict_API returns a non-2xx response or a network error occurs, THE Add_Event_Page SHALL display a non-blocking notice informing the organizer that live prediction is unavailable and mock data is shown.

---

### Requirement 5: Prediction Result Panel

**User Story:** As an organizer, I want to see the prediction results clearly after submitting the form, so that I can make informed decisions about event preparation.

#### Acceptance Criteria

1. WHEN a prediction response is available, THE Prediction_Result_Panel SHALL display the predicted attendance value from the `predicted_attendance` field.
2. WHEN a prediction response is available, THE Prediction_Result_Panel SHALL display the recommended preparation quantity from the `planned_quantity` field of the response.
3. WHEN a prediction response is available, THE Prediction_Result_Panel SHALL display the estimated food waste in pounds from the `food_waste_lbs` field.
4. WHEN a prediction response is available, THE Prediction_Result_Panel SHALL display the estimated total savings in USD from the `total_savings_usd` field.
5. WHEN a prediction response is available AND the `factors` array is non-empty, THE Prediction_Result_Panel SHALL render each factor as a labelled item showing the factor's `label`, `impact`, and `detail` values.
6. WHEN no prediction has been requested yet, THE Prediction_Result_Panel SHALL not be visible.

---

### Requirement 6: Mock Fallback — Manual Entry

**User Story:** As a demo presenter, I want the page to show realistic data even when the backend is not running, so that the demo is not blocked by infrastructure gaps.

#### Acceptance Criteria

1. THE Mock_Fallback for manual entry SHALL accept the same input shape as Predict_API and SHALL return an object containing: `predicted_attendance`, `confidence_low`, `confidence_high`, `confidence_level`, `show_rate_pct`, `expected_signups`, `factors`, `food_waste_lbs`, `total_savings_usd`, and `planned_quantity`.
2. THE Mock_Fallback SHALL derive `predicted_attendance` as a deterministic value based on `expected_signups` and `event_type` so that the same inputs always produce the same output.
3. THE Mock_Fallback SHALL include at least two entries in the `factors` array, each with non-empty `label`, `impact`, and `detail` fields.

---

### Requirement 7: CSV Upload Section

**User Story:** As an organizer, I want to upload a CSV file of events for bulk prediction, so that I can forecast attendance for multiple events at once.

#### Acceptance Criteria

1. THE CSV_Upload_Section SHALL include a file input that accepts files with the `.csv` extension only.
2. THE CSV_Upload_Section SHALL include a submit button labelled "Upload & Predict".
3. WHEN the organizer clicks "Upload & Predict" and no file has been selected, THE CSV_Upload_Section SHALL display the message "Please select a CSV file" and SHALL NOT call Upload_API.
4. WHEN the organizer clicks "Upload & Predict" and a `.csv` file is selected, THE Add_Event_Page SHALL call Upload_API with a multipart form body containing the file under the field name `file`.
5. WHILE an Upload_API call is in progress, THE Add_Event_Page SHALL display a loading indicator and SHALL disable the "Upload & Predict" button.
6. WHEN Upload_API returns a 2xx response, THE Add_Event_Page SHALL pass the response body to Bulk_Results_Table for display.
7. IF Upload_API returns a non-2xx response or a network error occurs, THE Add_Event_Page SHALL invoke Mock_Fallback for CSV upload and pass its output to Bulk_Results_Table for display.
8. IF Upload_API returns a non-2xx response or a network error occurs, THE Add_Event_Page SHALL display a non-blocking notice informing the organizer that live upload is unavailable and mock data is shown.

---

### Requirement 8: Bulk Results Table

**User Story:** As an organizer, I want to see a table of per-event predictions after uploading a CSV, so that I can review all events at a glance.

#### Acceptance Criteria

1. WHEN bulk results are available, THE Bulk_Results_Table SHALL render one row per event in the `events` array, showing at minimum: event name, predicted attendance, estimated savings (USD), and processing status.
2. WHEN bulk results are available, THE Bulk_Results_Table SHALL render a summary row at the bottom showing: total savings (USD), total CO2 saved (kg), and total food waste (lbs) from the `summary` object.
3. WHEN no upload has been performed yet, THE Bulk_Results_Table SHALL not be visible.

---

### Requirement 9: Mock Fallback — CSV Upload

**User Story:** As a demo presenter, I want the CSV upload section to show realistic bulk results even when the backend is not running, so that the demo flow is uninterrupted.

#### Acceptance Criteria

1. THE Mock_Fallback for CSV upload SHALL return an object with an `events` array of at least three entries and a `summary` object containing `total_savings_usd`, `total_co2_saved_kg`, and `total_food_waste_lbs`.
2. EACH entry in the mock `events` array SHALL contain: `event_name`, `predicted_attendance`, `total_savings_usd`, and `status`.

---

### Requirement 10: Non-Regression Constraints

**User Story:** As a developer, I want the new page to be additive only, so that existing functionality is not broken.

#### Acceptance Criteria

1. THE Add_Event_Page SHALL NOT modify the EventCard component.
2. THE Add_Event_Page SHALL NOT modify the OrganizerDashboard component.
3. WHEN DashboardSidebar is rendered with `activePath="/dashboard"`, THE DashboardSidebar SHALL continue to highlight the "Dashboard" item and SHALL NOT highlight "Add Event (Manual)".
4. THE Add_Event_Page SHALL use apiPost from `client/src/api/client.js` for all JSON POST requests to Predict_API.
5. THE CSV_Upload_Section SHALL use the native `fetch` API directly (not apiPost) for the multipart Upload_API call, attaching the Authorization header from sessionStorage.
