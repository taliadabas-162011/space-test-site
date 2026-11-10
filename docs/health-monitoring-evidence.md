# Health monitoring: evidence and prototype scope

## Challenge objective

The [2026 Space Apps challenge](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) asks for a visual tool that gathers health indicators and helps astronauts assess and act on their health. It gives blood pressure, heart rate, blood sugar, temperature, daily sleep hours and mood as examples. It does not mandate specific devices. The live Resources tab, reviewed November 10, 2026, says resources will become available Friday, November 13. See [the current scenario content review](scenario-content-review.md) for the updated implementation and remaining gaps.

## Implemented comparison

The prototype uses a simple, transparent descriptive comparison; it is **not a NASA clinical algorithm or a validated warning**:

- For the latest measurement, select the last observation per preceding local calendar day, within the 30 days before it. Require at least three prior days.
- For heart rate, blood pressure, oxygen, glucose and temperature, require a recorded context and use only observations with the same context. This does not establish that the measurement method or equipment was the same.
- Calculate the median of those earlier daily values, then `change = latest value − earlier median`. Systolic and diastolic pressure are calculated separately.
- Show the number of prior days, context and latest source. A graph is descriptive and its range is derived from displayed data, not a clinical reference range.

[Spaceflight Standard Measures](https://www.nasa.gov/reference/standard-measures/) describes repeated observations of sleep, activity, nutrition, immune response and other areas. NASA's [health-care overview](https://www.nasa.gov/missions/station/faq-the-real-story-about-astronaut-health-care-in-space/) discusses personal baselines and individualized health, diet and exercise plans. These sources motivate tracking over time; they do not validate the prototype's particular 30-day window, minimum sample count or alert threshold.

## Scenario presentation

The presentation uses four selectable scenarios: Routine, Recovery, Review readings and Emergency. These are explicit previews, not diagnoses produced by a validated clinical model. Scenario values are overlaid in memory; choosing a scenario does not add observations to the stored history. The Emergency preview includes a reported urgent symptom, scene lighting and immediate mission-procedure actions. Sound begins from a user gesture, has an explicit silence control, and reports blocked playback accurately. Acknowledgement stops playback while retaining the active condition. See [interface composition](interface-composition.md) for the current UI and audio design.

The populated history uses a separate presentation record store and the original profile name. The original personal record is preserved. The earlier 8 bpm demonstration trigger and continuous sensor simulation were removed from the presentation interface.

## Interpretation gaps

- **Blood pressure, heart rate and oxygen:** measurement method, rest/activity, equipment and conditions affect interpretation. FDA warns that [pulse oximeters can have accuracy limitations](https://www.fda.gov/news-events/press-announcements/fda-proposes-updated-recommendations-help-improve-performance-pulse-oximeters-across-skin-tones). The app does not currently track all sources of measurement error.
- **Glucose:** fasting and after-meal values should not be combined. A single measurement is not an HbA1c test or a diagnosis. See [NIDDK's description of glucose tests](https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis).
- **Temperature and body mass:** measurement site and equipment matter; the current form does not capture enough information to establish comparability. Body mass in microgravity requires a suitable method.
- **Water:** `mL per kg = recorded liquid intake in mL ÷ body mass in kg` is arithmetic, but logged drinks are not a full measure of fluid intake or hydration status. NASA's [Human Adaptation to Spaceflight](https://www.nasa.gov/wp-content/uploads/2024/08/human-adaptation-2021-final-b.pdf) discusses an association involving intake above 32 mL/kg and urinary calcium; it is not a validated rule for this app to tell an individual how much to drink. NASA notes fluid needs vary with environment, activity and individual factors in its [spacesuit guidance](https://www.nasa.gov/reference/11-0-spacesuits-vol-2/).
- **Exercise:** minutes are a duration, not an adequate measure of type, intensity, strength or an individual's mission prescription. NASA describes [individual exercise plans](https://www.nasa.gov/missions/station/faq-the-real-story-about-astronaut-health-care-in-space/).
- **Sleep and mood:** their patterns provide useful context, but a single duration or mood selection cannot establish a diagnosis. NASA identifies [behavioral thresholds](https://humanresearchroadmap.nasa.gov/Gaps/gap.aspx?i=701) as an active research and validation need.
- **Nutrition:** food intake, dietary composition, height, clinical history and mission-specific requirements are not captured. NASA's [human-performance standard](https://www.nasa.gov/reference/4-0-human-performance/) describes individualized energy and nutrient requirements; the app cannot infer what an astronaut should eat from its current readings.

Validated thresholds, risk classifications and treatment advice require the relevant mission protocol, appropriate sensors and methods, qualified medical oversight and testing. External sources may not be available offline; local text and records are kept on the device.
