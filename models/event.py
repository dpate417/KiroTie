"""
Data models for EventWise events and attendance prediction.

Covers Requirements 3.1 (Event data structure) and 3.3 (signal-based prediction inputs).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Event:
    """Represents a campus event with all data needed for attendance prediction."""

    id: str
    name: str
    date: str                          # ISO 8601 date, e.g. "2025-04-15"
    time: str                          # HH:MM 24-hour, e.g. "14:30"
    location: str
    organizer_email: str
    signup_count: int
    registered_students: list[str] = field(default_factory=list)   # student emails
    competing_event_ids: list[str] = field(default_factory=list)
    academic_calendar_flags: list[str] = field(default_factory=list)  # e.g. ["finals"]
    historical_ratio: Optional[float] = None                          # override default 0.65


@dataclass
class RiskFactor:
    """A condition that reduces predicted attendance for an event."""

    type: str    # "competing_event" | "academic_conflict" | "poor_time_slot" | "low_interest"
    label: str   # human-readable label shown on card chip
    detail: str  # longer explanation shown in expanded view


@dataclass
class AttendancePrediction:
    """Computed attendance prediction for a single event."""

    event_id: str
    predicted_count: int
    likelihood: str                          # "High" | "Medium" | "Low"
    signal_breakdown: dict[str, float]       # signal name → weight applied
    risk_factors: list[RiskFactor] = field(default_factory=list)
    signup_trend: str = "stagnant"           # "growing" | "slowing" | "stagnant"
