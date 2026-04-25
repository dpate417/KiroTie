/**
 * Mock event data for EventWise P0 demo.
 * Matches the Event shape defined in design.md.
 *
 * Covers:
 *  - Competing events (evt-001 ↔ evt-002)
 *  - Academic calendar conflict (finals)
 *  - Peak time slots (11am–2pm, 5pm–7pm) and off-peak (8am, 8pm)
 *  - Tue/Wed/Thu (+0.05) and Mon/Fri (−0.05) days
 *  - Varied signup counts (high, medium, low)
 *  - student@asu.edu registered in several events for calendar filtering
 */

// Dates are set relative to the current week (week of Apr 21, 2026)
// so the student calendar shows events in the current view.
const mockEvents = [
  {
    id: "evt-001",
    name: "ASU Engineering Career Fair",
    date: "2026-04-22", // Wednesday — +0.05 day-of-week bonus
    time: "11:00",      // Peak slot (11am–2pm) — +0.05 time bonus
    location: "Memorial Union, Ballroom A",
    organizer_email: "organizer@asu.edu",
    signup_count: 120,
    registered_students: ["student@asu.edu", "alice@asu.edu", "bob@asu.edu"],
    competing_event_ids: ["evt-002"],
    academic_calendar_flags: [],
    historical_ratio: 0.70,
  },
  {
    id: "evt-002",
    name: "Sun Devil Startup Pitch Night",
    date: "2026-04-22", // Wednesday — same day as evt-001, competing
    time: "11:30",      // Peak slot — overlaps with evt-001
    location: "Brickyard, Room 230",
    organizer_email: "organizer@asu.edu",
    signup_count: 85,
    registered_students: ["student@asu.edu", "carol@asu.edu"],
    competing_event_ids: ["evt-001"],
    academic_calendar_flags: [],
  },
  {
    id: "evt-003",
    name: "Finals Week Study Break & Free Pizza",
    date: "2026-04-27", // Monday — −0.05 day-of-week penalty
    time: "20:00",      // Off-peak (late night) — −0.05 time penalty
    location: "Hayden Library, Lawn",
    organizer_email: "organizer@asu.edu",
    signup_count: 200,
    registered_students: ["student@asu.edu", "dave@asu.edu", "eve@asu.edu", "frank@asu.edu"],
    competing_event_ids: [],
    academic_calendar_flags: ["finals"],
  },
  {
    id: "evt-004",
    name: "ASU Sustainability Summit",
    date: "2026-04-23", // Thursday — +0.05 day-of-week bonus
    time: "13:00",      // Peak slot (11am–2pm) — +0.05 time bonus
    location: "Tempe Campus, ISTB4 Auditorium",
    organizer_email: "organizer@asu.edu",
    signup_count: 60,
    registered_students: ["alice@asu.edu", "carol@asu.edu"],
    competing_event_ids: [],
    academic_calendar_flags: [],
    historical_ratio: 0.80,
  },
  {
    id: "evt-005",
    name: "Cultural Diversity Showcase",
    date: "2026-04-24", // Friday — −0.05 day-of-week penalty
    time: "17:30",      // Peak slot (5pm–7pm) — +0.05 time bonus
    location: "Sun Devil Fitness Complex, Multipurpose Room",
    organizer_email: "organizer@asu.edu",
    signup_count: 45,
    registered_students: ["student@asu.edu", "bob@asu.edu", "eve@asu.edu"],
    competing_event_ids: [],
    academic_calendar_flags: [],
  },
  {
    id: "evt-006",
    name: "Research Symposium: AI & Society",
    date: "2026-04-21", // Tuesday — +0.05 day-of-week bonus
    time: "08:00",      // Off-peak (early morning) — −0.05 time penalty
    location: "Fulton Center, Room 410",
    organizer_email: "organizer@asu.edu",
    signup_count: 30,
    registered_students: ["student@asu.edu", "frank@asu.edu"],
    competing_event_ids: [],
    academic_calendar_flags: [],
    historical_ratio: 0.55,
  },
];

export default mockEvents;
