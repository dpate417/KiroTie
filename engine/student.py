"""
Student Insights Engine
Generates personalized nudges, conflict warnings, and smart reminders.
"""


def get_student_insights(data: dict) -> dict:
    """
    Analyzes a student's registration context and returns
    personalized warnings, tips, and reminder schedule.
    """
    insights = []
    reminders = []
    warnings = []

    event_name = data.get("event_name", "this event")
    event_time = data.get("event_time", "")
    last_class_end = data.get("last_class_end_time", "")
    last_class_location = data.get("last_class_location", "")
    event_location = data.get("event_location", "")
    distance_miles = data.get("distance_miles", None)
    past_no_shows = int(data.get("past_no_shows", 0))
    past_attended = int(data.get("past_attended", 0))
    streak = int(data.get("attendance_streak", 0))
    day_of_week = data.get("day_of_week", "")
    registration_days_ago = int(data.get("registration_days_ago", 3))

    # --- Conflict Warning ---
    if last_class_end and event_time:
        conflict_msg = _check_schedule_conflict(last_class_end, event_time, last_class_location, event_location, distance_miles)
        if conflict_msg:
            warnings.append({"type": "schedule_conflict", "message": conflict_msg})

    # --- No-show pattern ---
    if past_no_shows >= 2:
        insights.append({
            "type": "pattern_warning",
            "message": f"You've missed {past_no_shows} events you registered for recently. "
                       "Want to set an extra reminder this time?"
        })

    # --- Distance nudge ---
    if distance_miles is not None and float(distance_miles) > 0.3:
        insights.append({
            "type": "logistics",
            "message": f"This event is {distance_miles} miles from your last class. "
                       "Plan to leave a few minutes early."
        })

    # --- Registration timing nudge ---
    if registration_days_ago > 7:
        insights.append({
            "type": "reminder",
            "message": "You registered a while ago — don't forget this is coming up!"
        })

    # --- Streak motivator ---
    if streak >= 2:
        insights.append({
            "type": "streak",
            "message": f"You've attended {streak} events in a row. "
                       f"{event_name} could make it {streak + 1}! 🔥"
        })

    # --- Smart reminders ---
    reminders.append({
        "timing": "Morning of event",
        "message": f"You're registered for {event_name} today. It fits your schedule!"
    })
    reminders.append({
        "timing": "30 min before",
        "message": f"Heads up — {event_name} starts soon. "
                   + (f"Your last class ends in ~10 min." if last_class_end else "")
    })

    # --- Cancellation prompt ---
    cancellation_prompt = None
    no_show_rate = past_no_shows / max(1, past_no_shows + past_attended)
    if no_show_rate > 0.5 or (day_of_week in ["friday", "saturday"] and past_no_shows >= 1):
        cancellation_prompt = {
            "message": f"It looks like today might be tough to make it to {event_name}. "
                       "If you can't attend, canceling your spot helps the organizer plan better.",
            "action": "Cancel with one tap"
        }

    # --- Attendance likelihood score ---
    likelihood = _calculate_likelihood(past_no_shows, past_attended, distance_miles,
                                        registration_days_ago, day_of_week, bool(warnings))

    return {
        "warnings": warnings,
        "insights": insights,
        "reminders": reminders,
        "cancellation_prompt": cancellation_prompt,
        "attendance_likelihood": likelihood,
        "streak": streak
    }


def _check_schedule_conflict(class_end: str, event_start: str,
                               class_location: str, event_location: str,
                               distance_miles) -> str | None:
    try:
        ch, cm = map(int, class_end.split(":"))
        eh, em = map(int, event_start.split(":"))
        gap_minutes = (eh * 60 + em) - (ch * 60 + cm)

        if gap_minutes < 0:
            return f"This event overlaps with your class schedule. You may not be able to attend."
        elif gap_minutes < 10:
            loc_note = f" from {class_location} to {event_location}" if class_location and event_location else ""
            return (f"Your class ends at {class_end} and this event starts at {event_start} "
                    f"({gap_minutes} min gap{loc_note}). You may have trouble making it on time.")
        elif gap_minutes < 20 and distance_miles and float(distance_miles) > 0.4:
            return (f"Only {gap_minutes} min between your class and this event, "
                    f"and it's {distance_miles} miles away. Cutting it close!")
    except Exception:
        pass
    return None


def _calculate_likelihood(no_shows: int, attended: int, distance,
                           reg_days_ago: int, day: str, has_conflict: bool) -> dict:
    score = 70  # base

    total = no_shows + attended
    if total > 0:
        personal_rate = attended / total
        score = score * 0.4 + personal_rate * 100 * 0.6

    if reg_days_ago > 14:
        score -= 10
    elif reg_days_ago <= 1:
        score += 10

    if distance and float(distance) > 0.5:
        score -= 8

    if day in ["friday", "saturday"]:
        score -= 8

    if has_conflict:
        score -= 20

    score = max(5, min(98, round(score)))
    label = "High" if score >= 70 else "Medium" if score >= 45 else "Low"
    color = "green" if score >= 70 else "orange" if score >= 45 else "red"

    return {"score": score, "label": label, "color": color}
