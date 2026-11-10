# Daily workflow and measurement imagery

Reviewed 10 November 2026 against the challenge briefing video and its complete visible YouTube transcript, including 0:43 (crewmate collapse), 1:18 (non-clinician measurement guidance), 1:25 (meaning and next action), and 1:33 (reminders). Source: https://www.youtube.com/watch?v=RERG3gEmdC8

Implemented:

- Daily check-in in the live scene, with sleep, drinks and exercise logs and a brief feeling/mood report. Previous values are captions, never prefilled as new measurements.
- Optional spot measurements share that editing surface. Only one is active at a time. Unfinished daily fields are retained when opening measurement help or leaving the view.
- Oxygen, blood pressure and monitor-based pulse guides have Next/Back, a real reference photograph, sources and a direct return to the actual entry field. Photo numbers never become patient data. Temperature, glucose and in-flight mass retain written help until suitable device-specific material exists.
- Symptom choices follow location. Red flags reveal an immediate assistance action before submission; normal numbers do not dismiss them. The urgent action remains available when local storage fails.
- Crew assistance asks responsiveness and normal breathing before choosing a direction. A responsive person with abnormal breathing is not treated as cardiac arrest. Answers, time and source can be included in the handoff, which is not transmitted by this app.

Photo attribution and licensing: `design/assets/guides/README.md`. Rejected generated triptychs and the unrelated wrist monitor photograph are not bundled. Actual photos are original bytes; no synthetic devices, retouching or fabricated flight certification.

Procedure basis: FDA pulse oximeter basics; American Heart Association home blood pressure monitoring; Resuscitation Council UK adult basic life support (2025); ERC 2025 special circumstances/microgravity. Earth posture does not constitute an in-flight procedure. Assigned device instructions, mission clinical limits, communication integration and clinical approval are still required for operational use. No medication, fluid prescription or diagnosis is inferred from these observations.

Validation: Node checks cover collection payloads, zero values, no invented readings, symptom priority, assistance branches and persistence, failed storage, existing history, alarm, camera and offline cache. Isolated browser checks cover daily save, preserving entries through guide navigation, Next/Back/result focus, contextual symptom choices and urgent assistance. Main-site patient observations are not changed by these checks.

## Illustrated manuals and Liquid restoration

The image direction was corrected to generate new space-compatible assets from real hardware references. Guides are part of the editing column, not a fixed panel over the astronaut. Next/Back updates both action and illustration; glucose includes a distinct lancing step before sample application. The final action returns directly to the real input. Temperature now preserves an optional measurement site; comparisons do not mix different recorded sites.

Liquid is the sole visual system. A later override disabling the reading hover plate and flattening the selection lens was removed. Reading hover/focus, form controls, selectors, guide actions and radio choices now share the existing native Liquid optics and selection motion. Reduced-motion and reduced-transparency preferences remain supported.


## Check-in workspace polish — November 10, 2026

Replaced the nested spot-measurement disclosure and large measurement combobox with one persistent navigation rail: Today plus six directly accessible measurements. Today, symptom entry and measurement entry share one page shell, draft and footer. The real astronaut has reserved space on the right; Earth moves lower while entering data to keep text clear. Values, context and symptom notes survive navigation and reload; illustrated readings never populate inputs.

Extended Liquid styling and moving selection feedback to numeric fields, radio groups, custom symptom checks, notes, navigation and guide controls. Guide sources replace the instruction area instead of expanding the page. The shared calendar and check-in selectors use animated, anchored top-layer surfaces that clamp to the viewport and do not scroll the form. Calendar month/day changes, keyboard navigation, Now, invalid times, Escape and focus restoration were exercised.

Validation brings the user to an invalid field and uses an in-page error instead of a browser validation balloon. A complete synthetic check-in was saved on the isolated preview origin, leaving the main site's observations and unfinished drafts untouched.

Validation: 37 automated tests, all 19 guide steps and six source views at 1280×720, and width checks at 320, 390, 640, 960 and 1920 CSS pixels. The desktop guide footer remained at the same position throughout. Smaller screens use one ordinary page scroll. No physical-device or clinical validation was performed.

## Urgent-help navigation and selector repair — November 10, 2026

Urgent reports previously disabled collection mode and hid the main navigation, leaving no way to resume an unfinished check-in. Urgent views now have a visible Back to check-in action, including while following assistance steps, and retain History/Devices navigation. A resumed draft keeps measurements and the active report explicit; returning does not erase the urgent observation or claim that assistance was provided. The check-in header links back to the existing response without generating another help request. Scenario-only urgent previews also have an explicit Exit urgent preview action that restores the Routine selector.

Fixed shared Liquid selection coordinates under animated scale transforms. The old lens captured its opening-frame dimensions and stayed flattened at the menu's top edge. Lens geometry now uses untransformed local CSS coordinates, and dropdown options use one moving highlight. Large menu surfaces use the clear shared material without the refraction layer that introduced seams across the panel.

Verified: request help with an unfinished blood-pressure/water entry; acknowledge; resume the exact draft; reload and resume; open History during an active report; return from assistance steps; exit an urgent preview. Regression tests cover preserving urgent state and data, preview-only exit controls, and scaled selection geometry. No saved observations were deleted or marked resolved by this fix.


## Daily-log hierarchy, requested-help exit, and neutral surfaces — November 10, 2026

The sidebar now contains only the six measurements under a larger Measurements heading. Daily log is the separate self-report area; measurements have a contextual return link beside the crew identity instead of a peer Today tab. The same view keys remain in drafts, preserving existing entries.

Corrected the urgent-help state transition. Going Back ends manually requested help and restores the previous scenario; leaving the urgent preview returns to Routine. An explicit scenario choice also ends manual help, including reselecting the current option. Old open requests are marked with an ended timestamp, not deleted, so they stop overriding subsequent scenarios after reload. The history labels ended requests. Separately saved symptom reports are preserved. Legacy draft urgency injected by the earlier return implementation is restored to the underlying report when its manual help mode ends; measurement values are retained.

Menus, combo boxes, and the calendar now use the same neutral graphite surface with soft white Liquid highlights, replacing the blue panel tint. Reduced-transparency mode uses an opaque neutral surface.

Verified the complete failure path: old stuck request → Back → non-urgent check-in → Recovery; repeated help requests → Back with blood-pressure and water draft intact; request → reselect current Recovery; request → reselect current Routine. Desktop fits at 720 CSS pixels high and the 390-pixel phone navigation has six measurement choices without horizontal overflow. Automated coverage includes ending and persisting old requests, restoring scenarios, preserving independent symptom reports, and unavailable storage.
