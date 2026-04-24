"""
Student Insights Engine
Generates personalized engagement emails, conflict warnings, and smart reminders.

Research backing:
- Free campus events: 40-50% no-show rate (appendment.com, tixfox.co)
- Personalized outreach: 26% increase in engagement vs generic (moldstud.com)
- Well-timed reminder emails: 30-50% attendance boost (instantly.ai)
- Personalized reminders reduce no-shows by up to 35% (hitemupapp.com)
"""


def get_student_insights(data: dict) -> dict:
    insights = []
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
    interest_match = float(data.get("interest_match_score", 0.5))
    student_major = data.get("student_major", "")
    event_topic = data.get("event_topic", "")

    # --- Schedule conflict ---
    conflict_detail = None
    if last_class_end and event_time:
        conflict_msg, conflict_detail = _check_schedule_conflict(
            last_class_end, event_time, last_class_location, event_location, distance_miles
        )
        if conflict_msg:
            warnings.append({"type": "schedule_conflict", "message": conflict_msg})

    # --- No-show pattern ---
    if past_no_shows >= 2:
        insights.append({
            "type": "pattern_warning",
            "message": f"You've missed {past_no_shows} events you registered for recently. "
                       "Want to set an extra reminder this time?"
        })

    # --- Distance / logistics nudge ---
    walk_time = None
    if distance_miles is not None and float(distance_miles) > 0.3:
        walk_time = round(float(distance_miles) / 0.05)  # ~3mph walking = 0.05 miles/min
        insights.append({
            "type": "logistics",
            "message": f"The venue is a {walk_time}-minute walk from your last class. "
                       f"Leave by {_subtract_minutes(last_class_end, 2)} to arrive on time."
            if last_class_end else
            f"This event is {distance_miles} miles away. Plan to leave a few minutes early."
        })

    # --- Interest alignment ---
    if interest_match >= 0.7:
        topic_note = f" on {event_topic}" if event_topic else ""
        major_note = f", which matches your interest in {student_major}" if student_major else ""
        insights.append({
            "type": "interest",
            "message": f"This event{topic_note} aligns well with your background{major_note}. "
                       "Students with high interest alignment are significantly more likely to attend."
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

    # --- 3-stage smart reminders (48hr, morning, 1hr before) ---
    reminders = _build_reminders(
        event_name, event_time, last_class_end, event_location,
        distance_miles, walk_time, interest_match, event_topic, student_major
    )

    # --- Cancellation prompt ---
    cancellation_prompt = None
    no_show_rate = past_no_shows / max(1, past_no_shows + past_attended)
    if no_show_rate > 0.5 or (day_of_week in ["friday", "saturday"] and past_no_shows >= 1) or bool(warnings):
        cancellation_prompt = {
            "message": f"It looks like today might be tough to make it to {event_name}. "
                       "If you can't attend, canceling your spot helps the organizer plan better.",
            "action": "Cancel with one tap"
        }

    # --- Personalized email preview ---
    email_preview = _generate_email_preview(
        event_name, event_time, last_class_end, last_class_location,
        event_location, distance_miles, walk_time, interest_match,
        event_topic, student_major, conflict_detail, warnings
    )

    # --- Attendance likelihood ---
    likelihood = _calculate_likelihood(
        past_no_shows, past_attended, distance_miles,
        registration_days_ago, day_of_week, bool(warnings), interest_match
    )

    return {
        "warnings": warnings,
        "insights": insights,
        "reminders": reminders,
        "cancellation_prompt": cancellation_prompt,
        "email_preview": email_preview,
        "attendance_likelihood": likelihood,
        "streak": streak
    }


def _build_reminders(event_name, event_time, last_class_end, event_location,
                     distance_miles, walk_time, interest_match, event_topic, student_major):
    reminders = []

    # 48 hours before — interest-based
    topic_note = f" on {event_topic}" if event_topic else ""
    major_note = f" — great fit for your background in {student_major}" if student_major and interest_match >= 0.7 else ""
    reminders.append({
        "timing": "48 hours before",
        "type": "interest",
        "message": f"Reminder: {event_name}{topic_note} is coming up in 2 days{major_note}. "
                   "Add it to your calendar so it doesn't sneak up on you."
    })

    # Morning of — schedule-aware
    schedule_note = ""
    if last_class_end and event_time:
        schedule_note = f" Your last class ends at {last_class_end} and the event starts at {event_time}"
        if walk_time:
            schedule_note += f" — it's a {walk_time}-min walk, so leave by {_subtract_minutes(last_class_end, 2)}."
        else:
            schedule_note += ". You have time to make it."
    reminders.append({
        "timing": "Morning of event",
        "type": "schedule",
        "message": f"Today is the day — {event_name} is happening!{schedule_note}"
    })

    # 1 hour before — final logistics
    location_note = f" at {event_location}" if event_location else ""
    distance_note = f" ({distance_miles} miles away)" if distance_miles else ""
    reminders.append({
        "timing": "1 hour before",
        "type": "logistics",
        "message": f"{event_name} starts in 1 hour{location_note}{distance_note}. "
                   + (f"Leave in ~{max(1, walk_time - 10)} min to arrive on time." if walk_time else "See you there!")
    })

    return reminders


def _generate_email_preview(event_name, event_time, last_class_end, last_class_location,
                              event_location, distance_miles, walk_time, interest_match,
                              event_topic, student_major, conflict_detail, warnings):
    lines = []
    lines.append(f"Subject: Don't forget — {event_name} is today")
    lines.append("")
    lines.append(f"Hi there,")
    lines.append("")
    lines.append(f"Just a heads-up that {event_name} is happening today and you're registered.")
    lines.append("")

    # Schedule awareness
    if last_class_end and event_time:
        if walk_time and walk_time > 0:
            leave_time = _subtract_minutes(last_class_end, 2)
            lines.append(f"📅 Your last class today ends at {last_class_end}. "
                         f"The event starts at {event_time}"
                         + (f" at {event_location}" if event_location else "") +
                         f" — it's a {walk_time}-minute walk, so leave by {leave_time}.")
        else:
            lines.append(f"📅 Your last class ends at {last_class_end} and the event starts at {event_time}. "
                         "You have just enough time to make it.")
        lines.append("")

    # Interest alignment
    if interest_match >= 0.7 and (event_topic or student_major):
        topic_note = f"This event is on {event_topic}" if event_topic else "This event"
        major_note = f", which matches your interest in {student_major}" if student_major else ""
        lines.append(f"🎯 {topic_note}{major_note}. Students with your background tend to find this especially valuable.")
        lines.append("")

    # Conflict flag
    if warnings:
        lines.append(f"⚠️ Heads up: {warnings[0]['message']} The event runs until later so you can still catch most of it.")
        lines.append("")

    # Logistics
    if distance_miles and float(distance_miles) > 0.3:
        lines.append(f"📍 The venue is a {walk_time}-minute walk from your last class"
                     + (f" ({last_class_location} → {event_location})" if last_class_location and event_location else "") + ".")
        lines.append("")

    lines.append("Hope to see you there!")
    lines.append("")
    lines.append("— EventWise")
    lines.append("")
    lines.append("Can't make it? Cancel your spot in one tap — it helps the organizer plan better.")

    return "\n".join(lines)


def _subtract_minutes(time_str: str, buffer: int) -> str:
    try:
        h, m = map(int, time_str.split(":"))
        total = h * 60 + m - buffer
        return f"{total // 60}:{total % 60:02d} PM" if total // 60 >= 12 else f"{total // 60}:{total % 60:02d} AM"
    except Exception:
        return time_str


def _check_schedule_conflict(class_end: str, event_start: str,
                               class_location: str, event_location: str,
                               distance_miles):
    try:
        ch, cm = map(int, class_end.split(":"))
        eh, em = map(int, event_start.split(":"))
        gap_minutes = (eh * 60 + em) - (ch * 60 + cm)

        if gap_minutes < 0:
            msg = "This event overlaps with your class schedule. You may not be able to attend the start."
            return msg, {"type": "overlap", "gap": gap_minutes}
        elif gap_minutes < 10:
            loc_note = f" from {class_location} to {event_location}" if class_location and event_location else ""
            msg = (f"Your class ends at {class_end} and this event starts at {event_start} "
                   f"({gap_minutes} min gap{loc_note}). You may have trouble making it on time.")
            return msg, {"type": "tight", "gap": gap_minutes}
        elif gap_minutes < 20 and distance_miles and float(distance_miles) > 0.4:
            msg = (f"Only {gap_minutes} min between your class and this event, "
                   f"and it's {distance_miles} miles away. Cutting it close!")
            return msg, {"type": "distance", "gap": gap_minutes}
    except Exception:
        pass
    return None, None


def _calculate_likelihood(no_shows: int, attended: int, distance,
                           reg_days_ago: int, day: str, has_conflict: bool,
                           interest_match: float = 0.5) -> dict:
    score = 65  # base — reflects 68% avg in-person attendance (nunify.com)

    total = no_shows + attended
    if total > 0:
        personal_rate = attended / total
        score = score * 0.4 + personal_rate * 100 * 0.6

    if reg_days_ago > 14:
        score -= 10
    elif reg_days_ago <= 1:
        score += 12

    if distance and float(distance) > 0.5:
        score -= 8

    if day in ["friday", "saturday"]:
        score -= 8

    if has_conflict:
        score -= 20

    # Interest alignment boost (up to +10%)
    score += (interest_match - 0.5) * 20

    score = max(5, min(98, round(score)))
    label = "High" if score >= 70 else "Medium" if score >= 45 else "Low"
    color = "green" if score >= 70 else "orange" if score >= 45 else "red"

    return {"score": score, "label": label, "color": color}

