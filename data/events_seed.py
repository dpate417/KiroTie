"""
Seed event data for EventWise backend.

Mirrors client/src/data/mockEvents.js exactly — same IDs, names, dates, times,
locations, signup counts, registered_students, competing_event_ids,
academic_calendar_flags, and historical_ratio values.

Covers Requirements 2.1 (event listing) and 3.1 (Event data structure).
"""

from models.event import Event

EVENTS: list[Event] = [
    Event(
        id="evt-001",
        name="ASU Engineering Career Fair",
        date="2026-04-22",
        time="11:00",
        location="Memorial Union, Ballroom A",
        organizer_email="organizer@asu.edu",
        signup_count=120,
        registered_students=["student@asu.edu", "alice@asu.edu", "bob@asu.edu"],
        competing_event_ids=["evt-002"],
        academic_calendar_flags=[],
        historical_ratio=0.70,
    ),
    Event(
        id="evt-002",
        name="Sun Devil Startup Pitch Night",
        date="2026-04-22",
        time="11:30",
        location="Brickyard, Room 230",
        organizer_email="organizer@asu.edu",
        signup_count=85,
        registered_students=["student@asu.edu", "carol@asu.edu"],
        competing_event_ids=["evt-001"],
        academic_calendar_flags=[],
        historical_ratio=None,
    ),
    Event(
        id="evt-003",
        name="Finals Week Study Break & Free Pizza",
        date="2026-04-27",
        time="20:00",
        location="Hayden Library, Lawn",
        organizer_email="organizer@asu.edu",
        signup_count=200,
        registered_students=["student@asu.edu", "dave@asu.edu", "eve@asu.edu", "frank@asu.edu"],
        competing_event_ids=[],
        academic_calendar_flags=["finals"],
        historical_ratio=None,
    ),
    Event(
        id="evt-004",
        name="ASU Sustainability Summit",
        date="2026-04-23",
        time="13:00",
        location="Tempe Campus, ISTB4 Auditorium",
        organizer_email="organizer@asu.edu",
        signup_count=60,
        registered_students=["alice@asu.edu", "carol@asu.edu"],
        competing_event_ids=[],
        academic_calendar_flags=[],
        historical_ratio=0.80,
    ),
    Event(
        id="evt-005",
        name="Cultural Diversity Showcase",
        date="2026-04-24",
        time="17:30",
        location="Sun Devil Fitness Complex, Multipurpose Room",
        organizer_email="organizer@asu.edu",
        signup_count=45,
        registered_students=["student@asu.edu", "bob@asu.edu", "eve@asu.edu"],
        competing_event_ids=[],
        academic_calendar_flags=[],
        historical_ratio=None,
    ),
    Event(
        id="evt-006",
        name="Research Symposium: AI & Society",
        date="2026-04-21",
        time="08:00",
        location="Fulton Center, Room 410",
        organizer_email="organizer@asu.edu",
        signup_count=30,
        registered_students=["student@asu.edu", "frank@asu.edu"],
        competing_event_ids=[],
        academic_calendar_flags=[],
        historical_ratio=0.55,
    ),
]


def get_event_by_id(event_id: str) -> Event | None:
    """Return the Event with the given id, or None if not found."""
    for event in EVENTS:
        if event.id == event_id:
            return event
    return None
