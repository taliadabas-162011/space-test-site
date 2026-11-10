# Health interface: composition and behavior

This iteration replaces the graph dashboard and framed workspaces. It is a scoped adaptation of interaction mechanisms, not a pixel clone of a reference site. Third-party models, media and production code were not imported from these newly researched sites.

## New reference research

Research started from the live [Awwwards data-visualization collection](https://www.awwwards.com/websites/data-visualization/). Terra agents independently investigated overview, history and device/navigation mechanisms; the parent inspected live source pages through the browser before implementation.

- [DeepBook — Awwwards](https://www.awwwards.com/sites/deepbook), [live site](https://deepbook-v2-wip.webflow.io/): inspected the sparse hero hierarchy and large typographic emphasis. Its boxed content section was explicitly not transferred. Our readout scale and whitespace are an original adaptation, not a claim that the source is a health dashboard.
- [Outreach — Awwwards](https://www.awwwards.com/sites/outreach), [live experience](https://www.outreach.space/), [creator](https://rocani.studio/work/outreach): source contains compact scientific annotations around a persistent WebGL environment, with chapter/subject changes. The live Earth/stars scene and entry sequence were inspected; full chapter motion and every annotation were not exhaustively verified. The adaptation uses spatial readouts and explicit page controls rather than its scroll narrative.
- [The State of the Gallery](https://mesh3d.gallery/the-state-of-the-gallery): inspected the large type, continuous spatial background and the outgoing text transition. Only those entry states were verified; no claim is made about its later data scenes. This informed coordinated content entrance, not a copied graph or shader.
- [Floema](https://floema.com/en), [Awwwards](https://www.awwwards.com/sites/floema), [European Design Awards project record](https://awards.europeandesign.org/winner/263020): the project record supports its object-first presentation and web-optimized 3D products. Device nodes around the astronaut are our adaptation; exact Floema interaction timings were not independently measured.
- Other investigated leads included [21 Hrs on the Moon](https://www.setsnail.digital/projects/21hours-on-the-moon), [Igloo Inc.](https://www.awwwards.com/igloo-inc-case-study.html) and [What Is Missing?](https://www.oddcommon.com/work/what-is-missing). They were not treated as visually verified implementations or copied into the product.

## Composition

Overview: no graphs, shaded stat strip, table rules or enclosing cards. Current readings are directly readable annotations around the astronaut. Each ordinary reading opens its corresponding history in one action. Mood is part of the personal identity; temperature, glucose and mass are quiet secondary annotations. No computed diagnosis is implied by the ordinary colors.

History: a page in the same scene, with one graph, true date and value axes, a metric index and 30/90/120-day ranges. The camera recedes and moves the astronaut to the side. Pointer inspection, arrow keys and a native range control expose the recorded time, source and context. Blood pressure keeps both components. Body mass, mood, sleep quality and past symptom reports remain available. Comparisons never silently combine unrelated measurement contexts.

Devices: four unboxed sensor nodes around the astronaut, with original line icons, real connection state and direct pairing controls. Paths become solid only for an actual connection. Browser pairing remains the existing Bluetooth implementation; no fake connection or background streaming is added.

Emergency: warm red light changes the actual 3D astronaut, with two large priority readings and three immediate actions. There is no flashing frame, blocking warning card or extra entry step. Acknowledgement silences the alarm while keeping the condition visible. The instructions refer to the mission procedure; this site does not send an emergency call.

At 1280 × 720 the overview, history and devices fit their visible regions without internal scrolling. Small screens, extreme aspect ratios and enlarged text may use native scrolling rather than clipping controls. Reduced-motion users receive immediate camera changes and no staggered entrance animations.

## Audio repair

The old Web Audio implementation could leave an unresolved `AudioContext.resume()` promise while the UI displayed “sound on”; stale completions could also replace newer control labels. The replacement invokes native media playback within the user gesture, reports starting/playing/blocked/error accurately, and cancels stale attempts. The sound is an original locally generated 3.2-second alternating pattern. It is not an ISS or certified medical alarm. A page hide stops playback; returning does not silently restart it. The visible control offers an explicit restart for an active alert.

The generator is checked in with the WAV. Tests verify media scheduling state, stop/retry/cancellation, loading failures and WAV integrity. Browser QA verifies the native player reports `playing` and acknowledgement returns it to `idle`. Physical speaker loudness and clinical suitability remain outside this prototype check.

## Scope and validation

The original personal storage keys and records are unchanged. Scenario preview overrides remain in memory. Forms retain their validation, custom calendar, draft behavior and save logic. This iteration changes presentation and audio, not medical decision rules.

Browser checks cover desktop and mobile geometry, state transitions, history selection/keyboard inspection, device presentation, draft return and emergency playback/acknowledgement. Evidence and computed-style gates are stored in the local `clone-workspace/health-interface-evolution` research artifact. The gates verify this design's declared properties; they do not claim pixel parity with the reference websites.
