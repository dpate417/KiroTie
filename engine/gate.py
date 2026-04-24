"""
Transparency Gate — Economics Frame Required Guardrail
Blocks prediction if inputs are insufficient to produce a data-backed estimate.
All outputs must be grounded in verifiable data, not assumptions.
"""

REQUIRED_FIELDS = ["event_type", "expected_signups", "planned_quantity"]
VALID_EVENT_TYPES = ["food_social", "academic_workshop", "career_fair", "club_meeting", "general"]


def transparency_gate(data: dict) -> dict:
    """
    Economics frame guardrail.
    Blocks the prediction pipeline if data quality is insufficient.
    Returns APPROVED or BLOCKED with reason.
    """
    missing = [f for f in REQUIRED_FIELDS if not data.get(f)]
    if missing:
        return {
            "status": "BLOCKED",
            "reason": f"Missing required fields: {', '.join(missing)}. "
                      "EventWise requires verifiable inputs to produce a data-backed estimate."
        }

    if data.get("expected_signups", 0) < 1:
        return {
            "status": "BLOCKED",
            "reason": "Expected signups must be at least 1."
        }

    if data.get("planned_quantity", 0) < 1:
        return {
            "status": "BLOCKED",
            "reason": "Planned quantity must be at least 1."
        }

    if data.get("event_type") not in VALID_EVENT_TYPES:
        return {
            "status": "BLOCKED",
            "reason": f"Unknown event type '{data.get('event_type')}'. "
                      f"Valid types: {', '.join(VALID_EVENT_TYPES)}"
        }

    return {
        "status": "APPROVED",
        "message": "Inputs validated. Prediction grounded in USDA/EPA verifiable data."
    }
