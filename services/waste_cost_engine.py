"""
Waste_Cost_Engine — computes over-preparation gap, wasted cost, recommended
prep level, and carbon savings for a campus event.

Covers Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 4.3, 4.4, 4.8.
"""

from __future__ import annotations

from dataclasses import fields as dataclass_fields

from models.baselines import Baselines
from models.event import AttendancePrediction, Event
from models.waste import WasteInsight


def compute_waste(
    event: Event,
    prediction: AttendancePrediction,
    baselines: Baselines,
) -> WasteInsight:
    """Compute waste and cost insight by comparing RSVP count to predicted attendance.

    When predicted_count >= rsvp_count all waste figures are zero — the event
    is not over-prepared.

    Args:
        event: The campus event (provides rsvp / signup_count).
        prediction: Attendance prediction for the event.
        baselines: Loaded economic/environmental constants.

    Returns:
        A WasteInsight dataclass populated with all computed fields.
    """
    rsvp_count = event.signup_count
    predicted_count = prediction.predicted_count
    per_person_cost = baselines.per_person_cost

    recommended_prep = round(predicted_count * 1.10)

    # Deduplicated list of source strings from all baseline constants
    sources: list[str] = list(
        dict.fromkeys(
            getattr(baselines, f.name).source
            for f in dataclass_fields(baselines)
        )
    )

    if predicted_count >= rsvp_count:
        return WasteInsight(
            rsvp_count=rsvp_count,
            predicted_count=predicted_count,
            over_prep_gap=0,
            wasted_cost_usd=0.0,
            recommended_prep=recommended_prep,
            savings_if_adjusted_usd=0.0,
            carbon_savings_kg=0.0,
            per_person_cost_usd=per_person_cost,
            sources=sources,
        )

    over_prep_gap = rsvp_count - predicted_count
    wasted_cost_usd = over_prep_gap * per_person_cost
    carbon_savings_kg = (
        over_prep_gap
        * baselines.food_waste_lbs_per_person.value
        * baselines.carbon_per_lb_food_waste_kg.value
    )

    return WasteInsight(
        rsvp_count=rsvp_count,
        predicted_count=predicted_count,
        over_prep_gap=over_prep_gap,
        wasted_cost_usd=wasted_cost_usd,
        recommended_prep=recommended_prep,
        savings_if_adjusted_usd=wasted_cost_usd,
        carbon_savings_kg=carbon_savings_kg,
        per_person_cost_usd=per_person_cost,
        sources=sources,
    )
