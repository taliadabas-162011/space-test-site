# Scenario content review

Reviewed November 10, 2026 against the [challenge brief](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/). The live Resources tab says additional resources will be available Friday, November 13; they were not available for this review.

## What the challenge asks

The core is gathering health indicators, helping an astronaut assess them, and giving understandable guidance about the next action. Examples include blood pressure, heart rate, glucose, temperature, sleep and mood. Dynamic graphs, color and a clickable body are suggestions, not mandatory features. The brief also asks teams to consider measurement feasibility, spaceflight hazards and when to involve crew or flight surgeons.

The current measurements cover the named examples. They do not measure radiation exposure, bone density or immune function. Those require their own instruments or exams. Adding inferred scores would overstate what the data supports. NASA's [Standard Measures](https://www.nasa.gov/reference/standard-measures/) includes sleep/activity, fluid samples, cognitive and sensorimotor tests and strength measurements; this prototype does not claim that coverage.

## What changed

The interface uses Liquid only. The two comparison designs and their selector are removed. The four existing scenario choices remain; the proposed additional preview choices were removed. Content uses ordinary headings, one message per situation and a direct action. Decorative status pills, numbered response plans, eyebrow labels, repeated headings and tightly tracked display type are removed from the main experience. Inputs and navigation retain their functional controls.

| Situation | What is shown | Action |
| --- | --- | --- |
| Routine | Latest values, differences from earlier observations and last symptom check-in | Add or continue a check-in; inspect history directly |
| Repeat readings | Changed oxygen/BP observations with their earlier comparison | Open the relevant fields directly; record a repeat; compare initial and repeat values |
| Sleep & recovery | Three-night sleep average and the earlier median, with intake/activity logs as context | Review the next sleep period; update the check-in |
| Urgent symptoms | Reported symptom names and relevant vitals | Alert nearby crew through the mission channel; acknowledge/silence locally; prepare a handoff |

The urgent report takes priority over the selected preview. Red-flag symptoms are not cancelled by a reassuring number. Acknowledging silences audio and records the acknowledgment; it does not mean assistance arrived or the situation resolved. The acknowledgment is retained for the same reported episode, with an in-memory fallback if local storage is unavailable. An urgent return action remains available when inspecting history.

Repeat entry keeps the existing date/context controls and symptoms report, and avoids showing unrelated measurements when starting without an existing draft. Existing drafts remain intact. A saved repeat replaces the preview snapshot as the current observation for that case. The initial and repeat values can be compared, but no automatic clinical clearance is generated. Measurement context and method still need to match; the comparison is not a diagnosis.

The recovery preview overlays three nights in memory without changing saved history. It does not infer dehydration from logged drinks or prescribe exercise intensity from minutes. Low mood in a real check-in can prompt crew support without adding another preview choice or calculating a stress score.

A medical handoff can be prepared and copied locally. It includes symptoms/onset, readings, timestamps, sources, measurement contexts, earlier comparisons and acknowledgment state. It explicitly states that nothing was sent and that a mission clinical protocol has not been loaded. No contact or treatment completion is fabricated.

## Evidence and boundaries

- [FDA: Pulse Oximeter Basics](https://www.fda.gov/consumers/consumer-updates/pulse-oximeter-basics): symptoms and other information matter alongside SpO₂; fit, movement, temperature and skin pigmentation can affect accuracy. This supports verifying an unexpected measurement, not delaying assistance for severe symptoms.
- [AHA: Signs and Symptoms of High Blood Pressure](https://www.heart.org/en/health-topics/high-blood-pressure/know-your-risk-factors-for-high-blood-pressure/what-are-the-symptoms-of-high-blood-pressure): repeat unexpected readings and consider symptoms when escalating. Earth-based guidance is not presented as a validated in-flight threshold or treatment algorithm.
- [HSE: Alarm Management](https://www.hse.gov.uk/humanfactors/topics/alarm-management.htm): alarms should be useful, prioritized and guide a defined response. This informs the interaction design; it is not a clinical protocol.
- [NASA: Standard Measures](https://www.nasa.gov/reference/standard-measures/): repeated, multi-system observations motivate tracking patterns rather than treating one number as a complete assessment.

The arithmetic remains transparent: compare a latest value with the median of prior daily, same-context observations over 30 days, requiring at least three earlier days. Sleep uses the average of the latest three daily observations and the median of earlier daily observations in that window. These windows and sample counts are prototype choices, not clinically validated warning thresholds. Missing/future/invalid observations are distinguished from zero; recency is shown without inventing a universal sampling frequency.

## What is still needed before operational use

This is an interactive challenge prototype, not life-critical medical software. A flight-ready system needs mission-approved, versioned clinical limits and offline procedures; personal preflight baselines and measurement methods; verified sensor quality and communication states; and review/testing by qualified mission medical personnel and representative crew. Real contact/escalation integration and protection of operational medical records are also absent. The app must not invent treatments, dosages, fluid targets or nutritional prescriptions to fill those gaps.

Browser verification covers the concise four-case selector, repeat entry and comparison, acknowledgment, handoff, history/return navigation and responsive layouts. Automated tests cover urgent precedence, invalid/missing data, sleep arithmetic, repeat state, isolated presentation records, persistence and existing camera/graph behavior. Real Bluetooth hardware, physical touch and Safari/Firefox rendering remain unverified.
