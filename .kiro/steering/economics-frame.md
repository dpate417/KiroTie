---
inclusion: always
---

# EventWise — Economics Frame Steering

## Challenge Frame
**Economics: The Transparency Guardrail**
> Your app must expose a 'hidden' economic factor. The spec must focus on turning invisible data into actionable financial insight.

## Hidden Economic Factor We Expose
Event organizers over-prepare because they treat registrations as attendance.
The hidden costs they never see:
- Food waste disposal cost (USDA ERS 2023: $1.84/lb)
- Space over-reservation (ASU Event Services: ~$3.50/person)
- Staff over-allocation (~$2.00/person)
- Printed materials waste (~$1.25/person)
- CO2 from food waste (EPA WARM Model: 0.37 kg CO2/lb)

## Transparency Gate (Required Guardrail)
Located in `engine/gate.py` — blocks prediction if inputs are insufficient
to produce a data-backed estimate. All outputs must be grounded in
verifiable data sources, not assumptions.

## Verifiable Data Sources
- USDA ERS 2023 — food waste cost per pound
- EPA WARM Model — CO2 equivalent per pound of food waste
- ASU Event Services — space and staff cost estimates
- Academic research — event attendance show rates by type

## Key Rule
Every number shown to the user must trace back to a named data source.
Never show a cost estimate without citing its origin.
