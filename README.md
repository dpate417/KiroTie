# KiroTie
KiroTie
EventWise — Problem Statement & Solution
Problem Statement
Campus event organizers at ASU consistently over-prepare for events because they rely on registration numbers alone to plan resources. Registration does not equal attendance. Students register for events they never show up to — due to schedule conflicts, competing priorities, or simple disengagement. This leads to significant waste in food, printed materials, reserved space, and staff time. Organizers have no reliable way to anticipate actual turnout, so they default to worst-case preparation every time.

Solution
EventWise is an AI-powered attendance prediction tool that helps ASU event organizers estimate real turnout — not just registrations — so they can plan resources more accurately and reduce waste.

When students register for an event, EventWise analyzes each registrant against multiple signals to predict whether they are likely to actually show up. The aggregated predictions give the organizer a realistic attendance estimate before the event happens.

Data the AI Uses for Prediction
1. ASU Class Schedule When a student registers, the tool checks their class schedule for conflicts. A student with a class that ends 10 minutes before a cross-campus event is a low-likelihood attendee. No conflict means higher likelihood.

2. Registration No-Show History If a student has a pattern of registering but not attending past events, that history is factored in. Repeat no-shows carry a lower attendance probability score.

3. Student Interests & Major If the event topic aligns with the student's declared interests, clubs, or major, they are more likely to attend. A computer science student registering for a cybersecurity workshop is a stronger signal than a random registration.

4. Event Timing Time of day and day of week matter. Events on Friday afternoons or during finals week historically see lower turnout. The model accounts for when the event falls in the academic calendar.

5. Registration Timing Students who register the day before or the morning of an event tend to show up more than those who registered three weeks in advance and forgot about it.

Output to the Organizer
Predicted attendance count (e.g., "68 of 120 registrants expected")
Confidence range (e.g., 60–75)
Suggested resource quantities (food portions, seating, printed materials)
Breakdown of risk factors driving the estimate
