"""
Flask routes for event endpoints.

Implements:
  - GET  /api/events              (13.2) Requirements 2.1, 2.2, 2.3, 2.4, 6.1, 7.2
  - GET  /api/events/<event_id>   (13.3) Requirements 7.3, 2.2, 3.1
  - POST /api/events/<event_id>/actions (13.4) Requirements 2.8–2.12, 7.4
"""

from __future__ import annotations

from dataclasses import asdict

from flask import Blueprint, current_app, jsonify, request

from data.events_seed import EVENTS, get_event_by_id
from routes.middleware import require_auth
from services.attendance_engine import (
    classify_likelihood,
    compute_prediction,
    compute_risk_factors,
    get_signup_trend,
)
from services.waste_cost_engine import compute_waste

events_bp = Blueprint("events", __name__)


def _baselines():
    """Return baselines loaded at app startup (stored in app.config)."""
    return current_app.config["BASELINES"]


def _build_event_summary(event, include_signal_breakdown: bool = False) -> dict:
    """Build an EventSummary dict for a single event."""
    from models.event import AttendancePrediction

    predicted_count = compute_prediction(event)
    likelihood = classify_likelihood(predicted_count, event.signup_count)
    risk_factors = compute_risk_factors(event)
    signup_trend = get_signup_trend(event)

    prediction = AttendancePrediction(
        event_id=event.id,
        predicted_count=predicted_count,
        likelihood=likelihood,
        signal_breakdown={},
        risk_factors=risk_factors,
        signup_trend=signup_trend,
    )

    waste = compute_waste(event, prediction, _baselines())

    summary = {
        "id": event.id,
        "name": event.name,
        "date": event.date,
        "time": event.time,
        "location": event.location,
        "signup_count": event.signup_count,
        "predicted_count": predicted_count,
        "likelihood": likelihood,
        "signup_trend": signup_trend,
        "risk_factors": [asdict(rf) for rf in risk_factors],
        "waste_insight": asdict(waste),
    }

    if include_signal_breakdown:
        summary["signal_breakdown"] = prediction.signal_breakdown
        competing = [
            {
                "id": e.id,
                "name": e.name,
                "date": e.date,
                "time": e.time,
                "location": e.location,
            }
            for e in EVENTS
            if e.id in event.competing_event_ids
        ]
        summary["competing_events"] = competing

    return summary


def _ok(data) -> tuple:
    return jsonify({"status": "ok", "data": data, "error": None}), 200


def _not_found(msg: str) -> tuple:
    return jsonify({"status": "error", "data": None, "error": msg}), 404


def _bad_request(msg: str) -> tuple:
    return jsonify({"status": "error", "data": None, "error": msg}), 400


# ---------------------------------------------------------------------------
# GET /api/events
# ---------------------------------------------------------------------------

@events_bp.route("/events", methods=["GET"])
@require_auth
def list_events():
    role = request.args.get("role")
    email = request.args.get("email")

    events = list(EVENTS)

    if role == "student" and email:
        events = [e for e in events if email in e.registered_students]
    elif role == "organizer" and email:
        events = [e for e in events if e.organizer_email == email]

    return _ok([_build_event_summary(e) for e in events])


# ---------------------------------------------------------------------------
# GET /api/events/<event_id>
# ---------------------------------------------------------------------------

@events_bp.route("/events/<event_id>", methods=["GET"])
@require_auth
def get_event(event_id: str):
    event = get_event_by_id(event_id)
    if event is None:
        return _not_found(f"Event '{event_id}' not found.")
    return _ok(_build_event_summary(event, include_signal_breakdown=True))


# ---------------------------------------------------------------------------
# POST /api/events/<event_id>/actions
# ---------------------------------------------------------------------------

@events_bp.route("/events/<event_id>/actions", methods=["POST"])
@require_auth
def event_action(event_id: str):
    from models.event import AttendancePrediction
    from services.attendance_engine import _parse_hour, _parse_day_of_week

    event = get_event_by_id(event_id)
    if event is None:
        return _not_found(f"Event '{event_id}' not found.")

    body = request.get_json(silent=True) or {}
    action_type = body.get("action_type", "")

    predicted_count = compute_prediction(event)
    prediction = AttendancePrediction(
        event_id=event.id,
        predicted_count=predicted_count,
        likelihood=classify_likelihood(predicted_count, event.signup_count),
        signal_breakdown={},
        risk_factors=compute_risk_factors(event),
        signup_trend=get_signup_trend(event),
    )
    waste = compute_waste(event, prediction, _baselines())

    if action_type == "reduce_over_preparation":
        savings = round(waste.savings_if_adjusted_usd, 2)
        recommendation = (
            f"Prepare for {waste.recommended_prep} instead of {event.signup_count} "
            f"to save ${savings}."
        )

    elif action_type == "adjust_timing":
        hour = _parse_hour(event.time)
        dow = _parse_day_of_week(event.date)
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        day_name = day_names[dow]

        if hour < 9 or hour >= 21:
            recommendation = (
                f"Consider rescheduling '{event.name}' from {event.time} to a peak window "
                f"(11:00–14:00 or 17:00–19:00) to improve attendance."
            )
        elif dow in (0, 4):
            recommendation = (
                f"Moving '{event.name}' from {day_name} to Tuesday, Wednesday, or Thursday "
                f"could increase turnout by up to 10%."
            )
        else:
            recommendation = (
                f"The current timing for '{event.name}' is already in a good window. "
                f"No timing change is recommended."
            )

    elif action_type == "target_audience":
        student_count = len(event.registered_students)
        if student_count == 0:
            recommendation = (
                f"No students are currently registered for '{event.name}'. "
                f"Consider targeted outreach to relevant student groups."
            )
        else:
            recommendation = (
                f"'{event.name}' has {student_count} registered student(s). "
                f"Focus promotion on departments or clubs aligned with the event topic "
                f"to attract a more engaged audience."
            )

    elif action_type == "increase_outreach":
        gap = event.signup_count - predicted_count
        recommendation = (
            f"With a predicted attendance of {predicted_count} out of {event.signup_count} "
            f"sign-ups, consider sending reminder emails or social media posts "
            f"to close the {gap}-person gap."
        )

    else:
        return _bad_request(
            f"Unknown action_type '{action_type}'. "
            "Valid values: reduce_over_preparation, adjust_timing, target_audience, increase_outreach."
        )

    return _ok({"recommendation": recommendation})
