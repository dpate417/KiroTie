# EventWise

> EventWise reveals the hidden cost of overestimating attendance and helps organizers make financially better decisions.

EventWise converts the gap between registrations and real attendance into visible economic impact — so organizers stop over-preparing and students show up to events that actually fit their schedule.

---

## Core Features

| Feature | Description |
|---|---|
| **Organizer Event Dashboard** | Card-based view with predicted attendance, risk factors, and quick actions |
| **Attendance Intelligence** | Estimates real attendance using schedule, interest, and timing signals |
| **Waste & Cost Insight** | Converts overestimation into visible economic impact — unused food, wasted cost, CO₂ |
| **Student Calendar View** | Shows recommended and conflicting events based on the student's actual schedule |

---

## The Problem

Campus organizers plan for 100% of signups. On average, only 60–70% show up. The result: wasted food, over-reserved space, excess materials, and staff time that didn't need to be spent.

**Registration does not equal attendance.**

---

## Organizer Side — Event Dashboard

A card-based dashboard where organizers can quickly see which events are at risk and take action.

Each event card shows:
- Predicted attendance (e.g. 68 of 120)
- Signup trend — growing, slowing, or stagnant
- Competing events at the same time slot
- Key risk factors — schedule conflicts, poor timing, low interest match, school calendar conflicts (finals, spring break, midterms)

**Suggested quick actions (triggerable from the card):**

| Action | Trigger |
|---|---|
| Adjust event timing | Poor time slot or calendar conflict |
| Target a better audience | Low interest alignment |
| Reduce over-preparation | High predicted no-show rate |
| Increase outreach | Signup trend slowing or stagnant |

---

## Waste & Cost Insight

EventWise converts predicted no-shows into a concrete economic picture — making the cost of over-preparation visible before it happens.

Each event card shows:
- **Estimated wasted cost** — unused food, over-reserved space, excess materials, unnecessary staff
- **Carbon impact** — food waste converted to CO₂ equivalent
- **Savings opportunity** — what the organizer could save by planning to predicted attendance

**Example savings banner:**
```
🟢 Estimated savings this event: $124
   Based on 18 predicted no-shows × avg. $6.90/person  ⓘ (USDA ERS 2023, ASU Event Services)
```

Every figure cites its source inline. Hovering ⓘ reveals the full breakdown — food ($1.84/lb, USDA ERS 2023), space ($3.50/person), staff ($2.00/person), materials ($1.25/person).

---

## Student Side — Schedule-aware Event View

A calendar view that shows students which events they can realistically attend, based on their actual schedule.

Each event is color-coded:

| Color | Meaning |
|---|---|
| 🟢 Green | High likelihood — good timing + strong interest match |
| 🟡 Yellow | Medium — minor conflict or weaker interest |
| 🔴 Red | Low likelihood — schedule conflict or poor timing |

Students can see at a glance which events fit their day, which ones are risky, and which signups they should reconsider.

---

## Authentication — Mock ASU SSO

Single login for both organizers and students, simulating ASU's CAS SSO.

- Login via ASU email (`@asu.edu`)
- Role assigned automatically — organizer or student
- Redirects to the correct dashboard after login

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python / Flask |
| Frontend | React + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| API | Flask REST (JSON) |
| Data | `data/event_baselines.json` — verified baseline constants |

---

## How to Run

**Backend**
```bash
pip install -r requirements.txt
python app.py
```

**Frontend**
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`

---

Built for the ASU Kiro Spark Challenge · April 2026
