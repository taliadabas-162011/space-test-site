# Rolling presentation history

All History views use the same stored observation APIs. The separate heart-rate-only generator has been removed, so an entered heart rate appears in the same chart as earlier observations.

The authored presentation history spans 365 calendar days, ending today. It is synthetic example data, identified as `Scenario history`, not measurements from a device or a scientific cohort. Existing personal records remain separate and keep their timestamps, source, units and values.

Presentation sampling is daily for heart rate, oxygen, sleep duration, water, exercise, mood, sleep quality and symptoms; every three days for blood pressure and temperature; weekly for glucose and body mass; and every fourteen days for saliva EBV DNA and urine CMV DNA examples. These frequencies illustrate different observation cadences. They are not a clinical sampling schedule or an ISS protocol.

Values and sampling are anchored to calendar dates rather than distance from today. Refreshing the next day retains the same timestamps and values for overlapping authored dates. Existing 120-day authored records are rebuilt as a year without rewriting manual, repeated or sensor observations. Original personal-storage keys are untouched.

Symptoms retain categorical reports and relevant tags. No later synthetic symptom report is inserted after a saved personal symptom report. Laboratory examples remain individual reports: numeric results use copies/mL; `Not detected` is qualitative with no numeric unit and never becomes zero. Later synthetic lab results cannot supersede a saved report for that same sample. The other sample can continue its presentation window independently.

The 30-, 90-, 120- and 365-day controls filter actual observation timestamps; they do not stretch a shorter series or interpolate extra measurements. Numeric lab points remain separate, without a connecting trend line. A numeric result does not define an immunity score or a treatment threshold. Each assigned laboratory assay and mission sampling protocol still takes precedence.

When a numeric 90-, 120- or 365-day series contains multiple readings on the same local calendar day, the chart uses that day’s latest comparable reading and labels the view “Latest per day”. These are original observations, not computed averages. The 30-day view retains every reading. Self-reports and lab reports are never collapsed. Raw stored observations remain unchanged in every view.

## Meaningful variation

The authored year combines small, calendar-stable baseline variation with irregularly spaced two- to four-night recovery periods. Shorter sleep, reduced activity, neutral/low mood, poorer reported sleep and mild fatigue/headache occur together, followed by recovery. These are constructed examples for evaluating the interface, not a physiological model or a claim that one signal causes another. Date-keyed bounded anchors interpolate into irregular drift at different time scales for each metric. There are no repeating sine waves or every-fifth-day oxygen spikes. Recovery timing and duration vary, as do qualitative laboratory examples. No values are rerolled and no new diagnoses are generated on reload. Stable runs of rounded oxygen values remain legitimate; tests reject prolonged repeating nonconstant waveforms rather than demanding a different value every day.

For the November 2026 fixture, resting pulse spans 67–82 bpm, oxygen 96–100%, sleep 6.1–8.5 h, logged water 1.9–2.8 L, exercise 76–138 minutes, temperature 36.4–37.1 °C, fasting glucose 79–92 mg/dL and body mass 69.3–70.5 kg. Bounds and variety are checked over multiple calendar windows. These are example values, not individual treatment targets. Routine oxygen changes by at most one percentage point between consecutive authored days. Serious oxygen reduction remains in the explicit urgent preview, paired with its symptom report and response flow.

General references used to keep examples plausible:

- [FDA pulse-oximeter basics](https://www.fda.gov/consumers/consumer-updates/pulse-oximeter-basics): typical oxygen saturation in healthy individuals and the importance of symptoms and measurement limitations.
- [American Heart Association heart-rate guidance](https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse) and [blood-pressure guidance](https://www.heart.org/en/news/2023/05/17/are-heart-rate-and-blood-pressure-the-same): general resting values, not personalized flight limits.
- [NIDDK glucose testing](https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis): fasting glucose is interpreted differently from post-meal readings. Example glucose stays in one fasting context.
- [MedlinePlus temperature norms](https://www.medlineplus.gov/ency/article/001982.htm) and [CDC sleep guidance](https://www.cdc.gov/sleep/about/): measurement context matters, and the occasional short-sleep examples intentionally depart from the usual sleep pattern.
- [NASA astronaut exercise](https://www.nasa.gov/general/astronaut-exercise/): provides context for activity duration. The example's partial sessions are not a recommended mission schedule.

Water logs do not establish hydration status. DNA copy counts do not have an invented universal “healthy” range or an immunity score. Laboratory results retain their sample, qualitative/numeric form and units; interpretation still requires the actual assay and medical context.

## Legacy presentation repair

An earlier stored 120-day fixture used `Simulated sensor` and `Simulated check-in` sources. The newer refresh only replaced `Scenario history`, while the history API relabelled all `Simulated…` sources as `Scenario history`. The old 09:00 rows therefore survived and won the long chart’s latest-per-day selection over new midnight examples. This caused the repeated oxygen spike and affected other histories too.

Refresh now recognizes that fixture only when at least 100 dates jointly match its oxygen, sleep, water and exercise formulas, matching timestamps and original source labels. Recognized rows move unchanged into `alex.presentationArchive`, and the current authored year supplies the active presentation series. The archive remains in the same observation store on subsequent saves. Ambiguous or isolated simulated readings, device IDs/sequences, manual entries, unknown sources and all original personal-storage keys remain untouched. Migration is idempotent. The history API preserves original source labels instead of disguising them.
