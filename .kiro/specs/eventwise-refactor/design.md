# Design Document — EventWise Refactor

## Overview

EventWise is a two-sided campus event intelligence platform for Arizona State University. It surfaces the economic cost of over-preparation by comparing RSVP counts against predicted real attendance, then presents actionable recommendations directly on each event card.

The system is split into two distinct user experiences:
- **Organizer side** — a card-based dashboard showing predicted attendance, risk factors, waste/cost insight, and quick actions.
- **Student side** — a schedule-aware calendar view with color-coded attendance likelihood.

Authentication is handled by a mock ASU SSO that assigns roles from the email domain and redirects users to the appropriate view.

### Design Goals

- Waste & Cost Insight is visible at a glance on the event card — no deep navigation.
- Simple, auditable cost model: fixed per-person constants loaded from a single JSON file.
- Core comparison (RSVP vs predicted, over-prep gap, cost, recommended prep) is the primary value.
- Fast-scanning UI: card layout, minimal text, strong visual hierarchy.
- Clean separation between Flask backend and React frontend via a JSON REST API.

---

## Architecture

The system follows a standard client-server architecture with a stateless REST API boundary.

```
┌─────────────────────────────────────────────────────────────┐
│                        React Frontend                        │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  Login Page  │  │ Organizer        │  │ Student       │  │
│  │  (Mock SSO)  │  │ Event Dashboard  │  │ Calendar View │  │
│  └──────────────┘  └──────────────────┘  └───────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/JSON (REST)
┌────────────────────────────▼────────────────────────────────┐
│                        Flask Backend                         │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ Auth_Service │  │ Attendance_Engine│  │Waste_Cost_    │  │
│  │              │  │                  │  │Engine /       │  │
│  │              │  │                  │  │Savings_Calc   │  │
│  └──────────────┘  └──────────────────┘  └───────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Baseline_Store                           │   │
│  │         data/event_baselines.json                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. User submits ASU email → `POST /api/auth/login` → session token + role returned.
2. Frontend stores token in memory (or sessionStorage) and routes to the correct view.
3. Organizer dashboard fetches `GET /api/events` → list of event summaries.
4. Each event card fetches `GET /api/events/{id}` → full detail including predicted attendance, risk factors, and waste/cost insight.
5. Quick action triggers `POST /api/events/{id}/actions` → recommendation string.
6. Student calendar fetches `GET /api/events` (role-filtered) → events with Attendance_Likelihood and conflict reasons.

---

## Components and Interfaces

### Backend Components

#### Auth_Service

Responsible for validating ASU email, assigning role, issuing session token, and protecting routes.

```
Auth_Service
  validate_email(email: str) -> bool          # must end in @asu.edu
  assign_role(email: str) -> "organizer" | "student"
  create_session(email, role) -> token: str
  invalidate_session(token: str) -> None
  get_session(token: str) -> Session | None
```

Role assignment rule: emails matching a configurable list of organizer addresses (or a domain prefix pattern, e.g. `staff.` or `faculty.`) receive `organizer`; all others receive `student`. For the mock, a hardcoded lookup table is sufficient.

#### Attendance_Engine

Computes predicted attendance and Attendance_Likelihood for a given event.

```
Attendance_Engine
  compute_prediction(event: Event) -> AttendancePrediction
  classify_likelihood(predicted: int, signups: int) -> "High" | "Medium" | "Low"
  compute_risk_factors(event: Event) -> list[RiskFactor]
  get_signup_trend(event: Event) -> "growing" | "slowing" | "stagnant"
```

Signal weights used in prediction (applied multiplicatively to the base signup count):

| Signal | Weight | Notes |
|---|---|---|
| Historical ratio | 0.65 (default) | Overridden by event-specific history if available |
| Time of day | ±0.05 | Peak hours 11am–2pm, 5pm–7pm get +0.05; early morning / late night get −0.05 |
| Day of week | ±0.05 | Tue/Wed/Thu get +0.05; Mon/Fri get −0.05 |
| Competing events | −0.10 per conflict | Capped at −0.20 total |
| Academic calendar conflict | −0.15 | Finals, midterms, spring break, fall break |

Final predicted attendance = `round(signups × aggregated_weight)`, clamped to `[0, signups]`.

Likelihood thresholds:
- `High`: predicted ≥ 80% of signups
- `Medium`: 50% ≤ predicted < 80%
- `Low`: predicted < 50%

#### Waste_Cost_Engine / Savings_Calculator

Loads constants from Baseline_Store at startup. Computes over-preparation gap, wasted cost, recommended prep level, and carbon savings.

```
Waste_Cost_Engine
  load_baselines(path: str) -> Baselines        # called once at startup
  compute_waste(event: Event, prediction: AttendancePrediction) -> WasteInsight
  compute_savings(waste: WasteInsight) -> SavingsEstimate
```

Computation logic:
```
over_prep_gap     = rsvp_count - predicted_attendance
wasted_cost       = over_prep_gap × per_person_cost          # per_person_cost = space + staff + materials
recommended_prep  = round(predicted_attendance × 1.10)       # 10% buffer above prediction
savings_if_adjust = over_prep_gap × per_person_cost
carbon_savings_kg = over_prep_gap × food_waste_lbs_per_person × carbon_per_lb
```

When `predicted_attendance >= rsvp_count`, all waste figures are zero.

#### Baseline_Store

A single JSON file at `data/event_baselines.json`. Loaded once at startup; any missing or non-positive value halts initialization.

```json
{
  "food_waste_cost_per_lb": {
    "value": 1.84,
    "source": "USDA ERS 2023"
  },
  "carbon_per_lb_food_waste_kg": {
    "value": 0.37,
    "source": "EPA WARM Model"
  },
  "space_cost_per_person": {
    "value": 3.50,
    "source": "ASU Event Services"
  },
  "staff_cost_per_person": {
    "value": 2.00,
    "source": "ASU Event Services"
  },
  "materials_cost_per_person": {
    "value": 1.25,
    "source": "ASU Event Services"
  },
  "food_waste_lbs_per_person": {
    "value": 0.75,
    "source": "USDA ERS 2023"
  }
}
```

Derived constant (not stored, computed at load): `per_person_cost = space + staff + materials = $6.75`.

### Frontend Components

#### LoginPage

Single form accepting an ASU email. Calls `POST /api/auth/login`. On success, stores token and navigates to the role-appropriate route (`/dashboard` or `/calendar`).

#### OrganizerDashboard

Fetches event list and renders a grid of `EventCard` components. Handles loading and error states.

#### EventCard

The primary organizer-facing component. Renders two zones:

**At-a-glance zone (always visible):**
- Event name, date/time, location
- Signup count vs predicted attendance (e.g. "68 / 120 expected")
- Signup trend badge (`growing` / `slowing` / `stagnant`)
- Waste & Cost Insight banner (over-prep gap, wasted cost, recommended prep, savings)
- Risk factor chips

**Expanded zone (on click/expand):**
- Full risk factor explanations
- Quick action buttons
- Citation tooltip for savings figures

#### WasteCostBanner

Sub-component of EventCard. Renders the insight inline:

```
⚠️  Prepare for 79 instead of 120
    Est. waste: $277 · Save $277 by adjusting prep  ⓘ
```

The `ⓘ` tooltip lists all source citations from the Baseline_Store.

#### StudentCalendar

Weekly calendar grid. Each event block is colored by Attendance_Likelihood (green/yellow/red). Clicking an event shows a detail panel with the likelihood reason and conflict details. Supports previous/next week navigation.

#### API Client (frontend)

A thin module wrapping `fetch` calls. Attaches the session token as a Bearer header. Handles 401 (redirect to login) and 500 (show error toast) globally.

---

## Data Models

### Session

```typescript
interface Session {
  token: string;
  email: string;
  role: "organizer" | "student";
}
```

### Event

```typescript
interface Event {
  id: string;
  name: string;
  date: string;           // ISO 8601 date
  time: string;           // HH:MM 24h
  location: string;
  organizer_email: string;
  signup_count: number;
  registered_students: string[];   // list of student emails
  competing_event_ids: string[];
  academic_calendar_flags: string[];  // e.g. ["finals", "spring_break"]
  historical_ratio?: number;          // optional override
}
```

### AttendancePrediction

```typescript
interface AttendancePrediction {
  event_id: string;
  predicted_count: number;
  likelihood: "High" | "Medium" | "Low";
  signal_breakdown: Record<string, number>;  // signal name → weight applied
  risk_factors: RiskFactor[];
  signup_trend: "growing" | "slowing" | "stagnant";
}
```

### RiskFactor

```typescript
interface RiskFactor {
  type: "competing_event" | "academic_conflict" | "poor_time_slot" | "low_interest";
  label: string;          // human-readable, shown on card chip
  detail: string;         // shown in expanded view
}
```

### WasteInsight

```typescript
interface WasteInsight {
  rsvp_count: number;
  predicted_count: number;
  over_prep_gap: number;
  wasted_cost_usd: number;
  recommended_prep: number;
  savings_if_adjusted_usd: number;
  carbon_savings_kg: number;
  per_person_cost_usd: number;
  sources: string[];      // list of source names for citation tooltip
}
```

### API Response Envelope

```typescript
interface ApiResponse<T> {
  status: "ok" | "error";
  data: T | null;
  error: string | null;
}
```

### Baselines (Python, loaded at startup)

```python
@dataclass
class BaselineConstant:
    value: float
    source: str

@dataclass
class Baselines:
    food_waste_cost_per_lb: BaselineConstant
    carbon_per_lb_food_waste_kg: BaselineConstant
    space_cost_per_person: BaselineConstant
    staff_cost_per_person: BaselineConstant
    materials_cost_per_person: BaselineConstant
    food_waste_lbs_per_person: BaselineConstant

    @property
    def per_person_cost(self) -> float:
        return (
            self.space_cost_per_person.value
            + self.staff_cost_per_person.value
            + self.materials_cost_per_person.value
        )
```

### API Endpoint Shapes

#### POST /api/auth/login
Request: `{ "email": "user@asu.edu" }`
Response: `{ "status": "ok", "data": { "token": "...", "role": "organizer" }, "error": null }`

#### GET /api/events
Response: `{ "status": "ok", "data": [EventSummary, ...], "error": null }`

`EventSummary` includes: `id`, `name`, `date`, `time`, `location`, `signup_count`, `predicted_count`, `likelihood`, `signup_trend`, `risk_factors[]`, `waste_insight` (WasteInsight).

#### GET /api/events/{event_id}
Response: full `EventSummary` plus `signal_breakdown` and `competing_events[]`.

#### POST /api/events/{event_id}/actions
Request: `{ "action_type": "reduce_over_preparation" | "adjust_timing" | "target_audience" | "increase_outreach" }`
Response: `{ "status": "ok", "data": { "recommendation": "Prepare for 79 instead of 120 to save $277." }, "error": null }`

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

