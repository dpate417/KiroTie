# KiroTie
KiroTie
EventWise — Problem Statement & Solution
Problem Statement
Campus event organizers at ASU consistently over-prepare for events because they rely on registration numbers alone to plan resources. Registration does not equal attendance.

Students register for events they never show up to — due to schedule conflicts, competing priorities, or simple disengagement. This leads to significant waste in food, printed materials, reserved space, and staff time. Organizers have no reliable way to anticipate actual turnout, so they default to worst-case preparation every time.

The Data Backs This Up
Free campus events — like most ASU student organization events — see a 40–50% no-show rate, meaning nearly half of registered students simply don't show up (appendment.com, tixfox.co)
The average in-person event attendance rate sits at only 68% across all event types — and campus events typically perform worse (nunify.com)
U.S. college campuses generate an estimated 22 million pounds of food waste annually, much of it tied to over-preparation at catered events (stonepierpress.org)
A 1-in-3 students spends zero time weekly on extracurricular activities, yet still registers for events out of initial interest (insidehighered.com)
Students who attend 10+ campus events per semester are 13% more likely to persist and stay enrolled — meaning low attendance is not just a waste problem, it's a retention problem (moderncampus.com)
The core issue is a broken feedback loop: organizers over-prepare because they can't predict turnout, and students under-attend because no one is helping them follow through on their own intentions.

Solution
EventWise is a two-sided AI tool that predicts real event attendance for organizers and sends personalized engagement emails to students — increasing the probability that registered students actually show up.

Side 1 — Organizer: Attendance Prediction
When students register for an event, EventWise analyzes each registrant against multiple behavioral and contextual signals to generate a realistic attendance forecast.

Data signals used for prediction:

Signal	How It's Used
ASU Class Schedule	Checks for schedule conflicts on the day of the event. A student with a class ending 10 min before a cross-campus event is flagged as low-likelihood.
No-Show History	Students with a pattern of registering but not attending past events receive a lower attendance probability score.
Student Interests & Major	If the event topic aligns with the student's declared interests or field of study, their likelihood score increases.
Event Timing	Day of week, time of day, and proximity to finals or breaks are factored in. Friday afternoon events and exam-week events historically underperform.
Registration Timing	Students who register the day before or morning of the event are more likely to attend than those who registered weeks in advance.
Output to the organizer:

Predicted attendance count (e.g., "68 of 120 registrants expected")
Confidence range (e.g., 60–75)
Suggested resource quantities — food portions, seating, printed materials
Risk breakdown explaining what's driving the estimate
Side 2 — Student: Personalized Engagement Emails
This is where EventWise closes the gap between intent and action. Rather than sending a generic reminder, EventWise generates a personalized email for each registered student based on their specific situation that day.

Why this works: Personalized outreach drives a 26% increase in engagement compared to generic messaging (moldstud.com), and well-timed reminder emails can boost attendance by 30–50% (instantly.ai). Research also shows personalized reminders reduce no-shows by up to 35% (hitemupapp.com).

What the personalized email includes:

Schedule awareness — "Your last class today ends at 3:50 PM. The event starts at 4:15 PM at the MU — you have just enough time to make it."
Interest alignment — "This workshop is on UI/UX design, which matches your interest in Human-Computer Interaction."
Conflict flag — "Heads up: you have a class that overlaps with the first 20 minutes. The event runs until 6 PM so you can still catch most of it."
Logistics nudge — "The venue is a 12-minute walk from your last class. Leave by 3:55 PM."
Soft cancellation prompt (if high conflict) — "It looks like today might be tough. If you can't make it, canceling your spot helps the organizer plan better — one tap to cancel."
Email timing:

48 hours before: interest-based reminder
Morning of the event: schedule-aware nudge with logistics
1 hour before: final reminder with location and timing
Impact Summary
Metric	Without EventWise	With EventWise
Organizer planning basis	Registration count	Predicted attendance
Food/resource waste	Prepared for 100%, used by ~60%	Prepared for predicted 65–70%
Student no-show rate	40–50% (free events)	Targeted reduction of up to 35%
Student engagement	Generic or no reminders	Personalized, schedule-aware emails
EventWise doesn't just predict who will show up — it actively increases the number of people who do.
