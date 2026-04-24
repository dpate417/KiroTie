# EventWise

> AI-powered attendance intelligence for campus events.

EventWise helps organizers estimate real turnout — not just registrations — and helps students actually show up.

---

## The Problem

Campus event organizers plan for 100% of signups. On average, only 60–70% show up. The result: wasted food, over-reserved space, excess printed materials, and staff time that didn't need to be spent.

Registration does not equal attendance.

---

## The Solution

EventWise is a two-sided tool. Organizers get data-backed attendance predictions. Students get smart, context-aware nudges that close the gap between signing up and showing up.

---

## Organizer Side — Event Dashboard

EventWise gives organizers a card-based view of all their events, so they can quickly understand performance and take action.

Each event card shows:

- **Predicted attendance** (e.g. 68 of 120)
- **Signup trend** — growing, slowing, or stagnant
- **Competing events** at the same time slot
- **Key risk factors** — schedule conflicts, poor timing, low interest match, school calendar conflicts (finals, spring break, midterms, holiday weekends)

### Suggested actions

Instead of just showing data, EventWise surfaces immediate actions directly on each card:

| Action | When it's suggested |
|---|---|
| Adjust event timing | Poor time slot or school calendar conflict |
| Target a better audience | Low interest alignment across registrants |
| Reduce over-preparation | High predicted no-show rate |
| Increase outreach | Signup trend slowing or stagnant |

Each suggestion is a quick action — triggerable directly from the event card without leaving the dashboard.

### Goal

Help organizers quickly see which events are at risk and take simple steps to improve real attendance before it's too late.

---

## Student Side — Schedule-aware Event View

EventWise helps students understand which events they are realistically able to attend by showing events directly in the context of their schedule.

Instead of sending reminders, the system provides a simple calendar view that highlights recommended and conflicting events based on each student's actual day.

Each event is annotated using:

- **Schedule availability** — does the event fit naturally around the student's classes?
- **Interest alignment** — does the event topic match the student's declared interests or major?
- **Potential conflicts** — overlapping classes, tight transitions, or high-stress academic periods

### Color coding

| Color | Meaning |
|---|---|
| 🟢 Green | High likelihood — good timing + strong interest match |
| 🟡 Yellow | Medium — minor conflict or weaker interest |
| 🔴 Red | Low likelihood — schedule conflict or poor timing |

Students can quickly see:
- Which events fit naturally into their day
- Which events may be difficult to attend
- Which signups they should reconsider

---

## Authentication — Mock ASU SSO

EventWise uses a single login entry point for both organizers and students, simulating ASU's CAS (Central Authentication Service) SSO.

- All users log in via a single `/login` page using their ASU email (`@asu.edu`)
- Role is automatically assigned based on the account type:
  - **Organizer** — accounts flagged as organizers at login
  - **Student** — all other ASU accounts
- After login, users are redirected to their respective dashboard (organizer view or student view)
- No real CAS integration — mock flow designed for demo purposes

---

## Economics Frame — Savings as a Feature

Instead of showing raw cost tables, EventWise surfaces the economics as a value proposition — what the organizer *saved* by planning smarter.

### Savings Banner (per event card)
Each event card shows an estimated savings figure based on predicted no-shows:

```
🟢 Estimated savings this event: $124
   Based on 18 predicted no-shows × avg. $6.90/person waste cost
```

### Inline Citation Tooltips
Every cost figure includes a small inline citation so the data is traceable without cluttering the UI:

```
Predicted waste cost: $47.20  ⓘ  (USDA ERS 2023, ASU Event Services)
```

Hovering the ⓘ icon reveals the full source — food waste disposal ($1.84/lb, USDA ERS 2023), space over-reservation (~$3.50/person, ASU Event Services), staff (~$2.00/person), and printed materials (~$1.25/person).

This satisfies the Economics Frame transparency guardrail while making the data feel like a product feature, not a compliance footnote.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python / Flask |
| Frontend | React + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| API | Flask REST (JSON) |
| Data | `data/event_baselines.json` — verified baseline rates and economic constants |

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
