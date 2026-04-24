# EventWise — Attendance Prediction to Reduce Waste

> **Kiro Spark Challenge 2025 · Economics Frame · Transparency Guardrail**

EventWise is a two-sided platform that exposes the hidden economic cost of campus event over-preparation. Organizers get data-backed attendance predictions. Students get smart registration checks and personalized nudges to actually show up.

---

## Problem Statement

Campus event organizers at ASU consistently over-prepare for events because they rely on registration numbers alone to plan resources. **Registration does not equal attendance.** Students register for events they never show up to — due to schedule conflicts, competing priorities, or simple disengagement. This leads to significant waste in food, printed materials, reserved space, and staff time. Organizers have no reliable way to anticipate actual turnout, so they default to worst-case preparation every time.

---

## Solution

EventWise is an AI-powered attendance prediction tool that helps ASU event organizers estimate real turnout — not just registrations — so they can plan resources more accurately and reduce waste.

When students register for an event, EventWise analyzes each registrant against multiple signals to predict whether they are likely to actually show up. The aggregated predictions give the organizer a realistic attendance estimate before the event happens.

### Prediction Signals

| Signal | How It Works |
|---|---|
| **ASU Class Schedule** | Checks for conflicts — a class ending 10 min before a cross-campus event = low likelihood |
| **No-Show History** | Repeat no-shows carry a lower attendance probability score |
| **Student Interests & Major** | A CS student registering for a cybersecurity workshop is a stronger signal than a random signup |
| **Event Timing** | Friday afternoons, finals week, and weekends historically see lower turnout |
| **Registration Timing** | Same-day registrations show up more than those made 3 weeks in advance |

### Output to the Organizer
- Predicted attendance count (e.g., "68 of 120 registrants expected")
- Confidence range (e.g., 60–75)
- Suggested resource quantities (food portions, seating, printed materials)
- Breakdown of risk factors driving the estimate

---

## The Hidden Economic Problem (Economics Frame)

Campus event organizers treat registrations as attendance. They don't. The average no-show rate at campus events is **30–40%**, but organizers keep ordering for 100% of signups. The costs they never see:

| Hidden Cost | Source | Per Unused Slot |
|---|---|---|
| Food waste disposal | USDA ERS 2023 | $1.84/lb |
| Space over-reservation | ASU Event Services | ~$3.50/person |
| Staff over-allocation | ASU Event Services | ~$2.00/person |
| Printed materials | ASU Event Services | ~$1.25/person |
| CO₂ from food waste | EPA WARM Model | 0.37 kg/lb |

EventWise makes all of this visible — and quantified — before the event happens.

---

## Features

### Organizer Side
- **Attendance Prediction** — rule-based model using event type, time slot, registration timing, interest alignment, and historical show rates
- **Hidden Cost Reveal** — breaks down every dollar wasted on over-preparation
- **Environmental Impact** — food waste in lbs + CO₂ equivalent saved
- **Semester Projection** — cumulative savings across 20 events
- **Transparency Gate** — blocks prediction if inputs are insufficient to produce a data-backed estimate

### Student Side
- **Smart Registration Warning** — flags schedule conflicts at registration time
- **Personalized Tips** — distance nudges, no-show pattern alerts, logistics advice
- **Attendance Streak** — lightweight motivator for campus involvement
- **Smart Reminders** — timed to the student's actual day, not generic alerts
- **Easy Cancellation Prompt** — turns passive no-shows into useful organizer data

---

## Economics Frame — Transparency Guardrail

The Transparency Gate (`engine/gate.py`) is the required guardrail for the Economics frame. It **blocks the prediction pipeline** if:
- Required fields are missing
- Event type is unrecognized
- Signup or quantity values are invalid

Every number shown to the user traces back to a named, verifiable data source. No estimates based on assumptions.

---

## Tech Stack

- **Backend:** Python / Flask
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Data:** `data/event_baselines.json` — all baseline rates and economic constants
- **No external ML libraries** — rule-based engine, fully transparent logic

---

## Project Structure

```
EventWise/
├── app.py                        # Flask routes
├── engine/
│   ├── gate.py                   # Transparency Gate (Economics guardrail)
│   ├── predictor.py              # Attendance prediction engine
│   ├── economics.py              # Hidden cost calculator
│   └── student.py                # Student insights engine
├── data/
│   └── event_baselines.json      # Verified baseline data (USDA, EPA, ASU)
├── templates/
│   ├── index.html                # Landing page
│   ├── organizer.html            # Organizer dashboard
│   └── student.html              # Student registration check
├── static/
│   ├── css/main.css
│   └── js/
│       ├── organizer.js
│       └── student.js
├── .kiro/steering/
│   └── economics-frame.md        # Kiro steering doc
└── requirements.txt
```

---

## How to Run

```bash
pip install -r requirements.txt
python app.py
```

Open `http://localhost:5000`

---

## How Kiro Was Used

- **Spec-Driven Development** — full spec written before implementation, defining inputs, outputs, and the Transparency Gate as a named spec artifact
- **Steering Docs** — `.kiro/steering/economics-frame.md` keeps all data sources and frame constraints in Kiro's context throughout development
- **Kiro Chat** — used to generate rule weights, validate economic constants against USDA/EPA sources, and iterate on the prediction model
- **Agent Hooks** — data validation hook runs on every engine change to ensure outputs remain data-backed

---

## Data Sources

- **USDA ERS 2023** — food waste cost per pound ($1.84/lb)
- **EPA WARM Model** — CO₂ equivalent per pound of food waste (0.37 kg/lb)
- **ASU Event Services** — space, staff, and materials cost estimates
- **Academic baseline research** — show rates by event type (65–72% for campus events)

---

Built with Kiro · ASU Kiro Spark Challenge · April 2025
