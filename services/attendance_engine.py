"""
Attendance Engine — computes predicted attendance, likelihood classification,
risk factors, and signup trend for EventWise events.

Implements Requirements 3.1–3.5 (Attendance Prediction).
"""

from __future__ import annotations

from datetime import date as _date
from models.event import AttendancePrediction, Event, RiskFactor

DEFAULT_HISTORICAL_RATIO = 0.65


def _parse_hour(time: str) -> int:
    """Parse the hour from an HH:MM 24-hour time string."""
    return int(time.split(":")[0])


def _parse_day_of_week(date_str: str) -> int:
    """
    Parse the day of week from an ISO 8601 date string.
    Returns 0=Monday … 6=Sunday (Python's weekday() convention).
    """
    return _date.fromisoformat(date_str).weekday()


def compute_prediction(event: Event) -> int:
    """
    Compute predicted attendance for an event by applying signal weights.

    Returns the predicted attendance count clamped to [0, signup_count].
    """
    base_ratio = (
        event.historical_ratio
        if event.historical_ratio is not None
        else DEFAULT_HISTORICAL_RATIO
    )

    # Time of day adjustment
    hour = _parse_hour(event.time)
    if (11 <= hour < 14) or (17 <= hour < 19):
        time_adj = 0.05   # peak hours
    elif hour < 9 or hour >= 21:
        time_adj = -0.05  # early morning / late night
    else:
        time_adj = 0.0

    # Day of week adjustment (Python weekday: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri)
    dow = _parse_day_of_week(event.date)
    if dow in (1, 2, 3):   # Tue/Wed/Thu
        day_adj = 0.05
    elif dow in (0, 4):    # Mon/Fri
        day_adj = -0.05
    else:
        day_adj = 0.0

    # Competing events adjustment (capped at -0.20)
    competing_adj = max(-0.20, len(event.competing_event_ids) * -0.10)

    # Academic calendar conflict adjustment
    academic_adj = -0.15 if event.academic_calendar_flags else 0.0

    aggregated_weight = base_ratio + time_adj + day_adj + competing_adj + academic_adj

    predicted = round(event.signup_count * aggregated_weight)

    # Clamp to [0, signup_count]
    return max(0, min(event.signup_count, predicted))


def classify_likelihood(predicted: int, signups: int) -> str:
    """
    Classify attendance likelihood based on predicted vs signup count.

    Returns "High", "Medium", or "Low".
    """
    if signups == 0:
        return "Low"
    ratio = predicted / signups
    if ratio >= 0.80:
        return "High"
    if ratio >= 0.50:
        return "Medium"
    return "Low"


def compute_risk_factors(event: Event) -> list[RiskFactor]:
    """Compute risk factors for an event."""
    factors: list[RiskFactor] = []

    if event.competing_event_ids:
        count = len(event.competing_event_ids)
        factors.append(
            RiskFactor(
                type="competing_event",
                label="Competing Events",
                detail=f"{count} competing event(s) in the same time slot reduce expected turnout.",
            )
        )

    if event.academic_calendar_flags:
        factors.append(
            RiskFactor(
                type="academic_conflict",
                label="Academic Calendar Conflict",
                detail=f"Event falls during: {', '.join(event.academic_calendar_flags)}.",
            )
        )

    hour = _parse_hour(event.time)
    dow = _parse_day_of_week(event.date)

    is_poor_time = hour < 9 or hour >= 21
    is_poor_day = dow in (0, 4)  # Mon or Fri

    if is_poor_time:
        factors.append(
            RiskFactor(
                type="poor_time_slot",
                label="Poor Time Slot",
                detail="Event is scheduled outside peak attendance hours.",
            )
        )
    elif is_poor_day:
        factors.append(
            RiskFactor(
                type="poor_time_slot",
                label="Low-Traffic Day",
                detail="Monday and Friday events typically see lower turnout.",
            )
        )

    return factors


def get_signup_trend(event: Event) -> str:
    """
    Get the signup trend for an event.

    Returns "growing", "slowing", or "stagnant".
    """
    # signup_trend may be set as an optional override on the event object
    signup_trend_override = getattr(event, "signup_trend", None)
    if signup_trend_override is not None:
        return signup_trend_override

    if (
        event.signup_count > 0
        and event.historical_ratio is not None
        and event.historical_ratio > 0.70
    ):
        return "growing"
    if event.historical_ratio is not None and event.historical_ratio < 0.55:
        return "slowing"
    return "stagnant"
