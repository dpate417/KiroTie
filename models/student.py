"""
Student data models for EventWise scoring and email features.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class StudentRecord:
    """A student's profile and attendance history loaded from a dataset."""
    email: str
    name: str
    major: str = ""
    events_attended: int = 0
    events_registered: int = 0
    events_missed: int = 0
    avg_registration_days_before: float = 3.0
    interest_tags: list[str] = field(default_factory=list)
    # Derived — computed by scoring engine
    show_rate: float = 0.0


@dataclass
class StudentScore:
    """Computed engagement score for a student relative to a specific event."""
    email: str
    name: str
    event_id: str
    score: float                    # 0–100
    grade: str                      # "A" | "B" | "C" | "D" | "F"
    likelihood: str                 # "High" | "Medium" | "Low"
    factors: list[dict]             # list of {label, impact, detail}
    email_subject: str = ""
    email_body: str = ""
    has_valid_email: bool = True


@dataclass
class EmailResult:
    """Result of sending an email to one student."""
    email: str
    name: str
    status: str                     # "SENT" | "FAILED" | "SKIPPED"
    reason: str = ""
