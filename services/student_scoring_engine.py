"""
Student Scoring Engine
Computes an engagement score (0–100) for each student relative to an event.

Scoring factors:
  - Historical show rate          (40% weight)
  - Registration timing           (20% weight)
  - Interest / major alignment    (20% weight)
  - Event timing fit              (10% weight)
  - Attendance streak             (10% weight)

Research backing:
  - Free campus events: 40–50% no-show rate (appendment.com, tixfox.co)
  - Personalized reminders reduce no-shows by up to 35% (hitemupapp.com)
  - Students attending 10+ events/semester are 13% more likely to persist (moderncampus.com)
"""
from __future__ import annotations

from models.student import StudentRecord, StudentScore
from models.event import Event


# Grade thresholds
_GRADE_MAP = [
    (90, "A"),
    (75, "B"),
    (60, "C"),
    (45, "D"),
    (0,  "F"),
]

_LIKELIHOOD_MAP = [
    (70, "High"),
    (45, "Medium"),
    (0,  "Low"),
]


def score_student(student: StudentRecord, event: Event) -> StudentScore:
    """
    Compute an engagement score for a student relative to a specific event.
    Returns a StudentScore with score, grade, likelihood, and factor breakdown.
    """
    factors = []
    total = 0.0

    # ── Factor 1: Historical show rate (40 pts) ──────────────────────────────
    show_rate = student.show_rate
    if student.events_registered > 0:
        show_rate = student.events_attended / student.events_registered
    show_pts = round(show_rate * 40, 1)
    total += show_pts
    factors.append({
        "label": "Historical show rate",
        "impact": "positive" if show_rate >= 0.65 else "negative",
        "detail": f"{round(show_rate * 100)}% of registered events attended ({student.events_attended}/{student.events_registered})",
        "points": show_pts,
        "max": 40,
    })

    # ── Factor 2: Registration timing (20 pts) ───────────────────────────────
    days = student.avg_registration_days_before
    if days <= 1:
        timing_pts = 20.0
        timing_detail = "Registers same-day or day-before — high follow-through"
        timing_impact = "positive"
    elif days <= 7:
        timing_pts = 14.0
        timing_detail = f"Registers ~{round(days)} days before — moderate follow-through"
        timing_impact = "neutral"
    elif days <= 14:
        timing_pts = 8.0
        timing_detail = f"Registers ~{round(days)} days before — lower follow-through"
        timing_impact = "negative"
    else:
        timing_pts = 4.0
        timing_detail = f"Registers {round(days)}+ days before — lowest follow-through"
        timing_impact = "negative"
    total += timing_pts
    factors.append({
        "label": "Registration timing",
        "impact": timing_impact,
        "detail": timing_detail,
        "points": timing_pts,
        "max": 20,
    })

    # ── Factor 3: Interest / major alignment (20 pts) ────────────────────────
    event_name_lower = event.name.lower()
    interest_match = any(
        tag.lower() in event_name_lower or event_name_lower in tag.lower()
        for tag in student.interest_tags
    )
    interest_pts = 20.0 if interest_match else 10.0
    total += interest_pts
    factors.append({
        "label": "Interest alignment",
        "impact": "positive" if interest_match else "neutral",
        "detail": f"Interest tags match event topic" if interest_match
                  else "No direct interest tag match — using baseline",
        "points": interest_pts,
        "max": 20,
    })

    # ── Factor 4: Event timing fit (10 pts) ──────────────────────────────────
    try:
        hour = int(event.time.split(":")[0])
        if 11 <= hour < 14 or 17 <= hour < 19:
            timing_fit_pts = 10.0
            timing_fit_detail = "Prime time slot — higher campus engagement"
            timing_fit_impact = "positive"
        elif hour < 9 or hour >= 20:
            timing_fit_pts = 4.0
            timing_fit_detail = "Off-peak hours — lower campus engagement"
            timing_fit_impact = "negative"
        else:
            timing_fit_pts = 7.0
            timing_fit_detail = "Standard time slot"
            timing_fit_impact = "neutral"
    except Exception:
        timing_fit_pts = 7.0
        timing_fit_detail = "Time not parsed"
        timing_fit_impact = "neutral"
    total += timing_fit_pts
    factors.append({
        "label": "Event timing fit",
        "impact": timing_fit_impact,
        "detail": timing_fit_detail,
        "points": timing_fit_pts,
        "max": 10,
    })

    # ── Factor 5: Attendance streak (10 pts) ─────────────────────────────────
    # Infer streak from recent attended vs missed ratio
    if student.events_attended >= 5 and student.events_missed == 0:
        streak_pts = 10.0
        streak_detail = f"Strong streak — {student.events_attended} events attended, no recent misses"
        streak_impact = "positive"
    elif student.events_attended >= 3:
        streak_pts = 7.0
        streak_detail = f"{student.events_attended} events attended recently"
        streak_impact = "positive"
    elif student.events_missed > student.events_attended:
        streak_pts = 2.0
        streak_detail = f"More misses ({student.events_missed}) than attended ({student.events_attended})"
        streak_impact = "negative"
    else:
        streak_pts = 5.0
        streak_detail = "Average engagement history"
        streak_impact = "neutral"
    total += streak_pts
    factors.append({
        "label": "Attendance streak",
        "impact": streak_impact,
        "detail": streak_detail,
        "points": streak_pts,
        "max": 10,
    })

    score = round(min(100.0, max(0.0, total)), 1)
    grade = next(g for threshold, g in _GRADE_MAP if score >= threshold)
    likelihood = next(lbl for threshold, lbl in _LIKELIHOOD_MAP if score >= threshold)

    email_subject, email_body = _generate_email(student, event, score, likelihood, factors)

    return StudentScore(
        email=student.email,
        name=student.name,
        event_id=event.id,
        score=score,
        grade=grade,
        likelihood=likelihood,
        factors=factors,
        email_subject=email_subject,
        email_body=email_body,
        has_valid_email=bool(student.email and "@" in student.email),
    )


def score_all_students(students: list[StudentRecord], event: Event) -> list[StudentScore]:
    """Score all students for a given event, sorted by score descending."""
    scores = [score_student(s, event) for s in students]
    return sorted(scores, key=lambda x: x.score, reverse=True)


def _generate_email(student: StudentRecord, event: Event,
                    score: float, likelihood: str, factors: list[dict]) -> tuple[str, str]:
    """Generate a personalized email subject and body for a student."""
    subject = f"Don't forget — {event.name} is coming up"

    positive = [f for f in factors if f["impact"] == "positive"]
    negative = [f for f in factors if f["impact"] == "negative"]

    lines = [
        f"Hi {student.name.split()[0] if student.name else 'there'},",
        "",
        f"You're registered for {event.name} on {event.date} at {event.time}.",
        "",
    ]

    if positive:
        lines.append(f"🎯 Based on your history, you're a {likelihood.lower()} likelihood attendee for this event.")
        if any("Interest" in f["label"] for f in positive):
            lines.append(f"   This event aligns with your interests — students like you tend to find it valuable.")
        lines.append("")

    if negative:
        lines.append("⚠️ A few things to keep in mind:")
        for f in negative[:2]:
            lines.append(f"   • {f['detail']}")
        lines.append("")

    lines += [
        f"📍 Location: {event.location}",
        f"🕐 Time: {event.time}",
        "",
        "Hope to see you there!",
        "",
        "— EventWise",
        "",
        "Can't make it? Cancel your spot in one tap — it helps the organizer plan better.",
    ]

    return subject, "\n".join(lines)
