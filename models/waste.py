"""
Data model for waste and cost insight.

Covers Requirements 5.1, 5.2, 5.3, 5.4, 5.5.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class WasteInsight:
    """Computed waste and cost insight for a single event."""

    rsvp_count: int
    predicted_count: int
    over_prep_gap: int
    wasted_cost_usd: float
    recommended_prep: int
    savings_if_adjusted_usd: float
    carbon_savings_kg: float
    per_person_cost_usd: float
    sources: list[str] = field(default_factory=list)
