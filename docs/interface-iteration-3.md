# Instrument and history refinement

This is a scoped interaction adaptation, not a pixel clone. The astronaut, Earth and station stay in the shared scene.

- Overview labels are larger; decorative connector paths are removed. Comparable readings expose the difference from the previous 30-day median. Comparisons use the displayed scenario value and matching recorded context, with at least three earlier days. They describe history and do not assign clinical status.
- The scenario trigger is centered independently of audio on desktop. Narrow phones use a left-aligned trigger to keep both controls usable. The shared selector menu is opaque and flat.
- History uses direct nearest-time inspection inspired by Observable Plot's pointerX and click-to-stick mechanism: https://old.observablehq.com/plot/interactions/pointer . No dependency or third-party source code was imported. Hover, tap, drag, keyboard arrows, Home/End and Escape are supported; source, context and report details remain available.
- The chart is one keyboard target. HTML markers stay 8px round, independent of the stretched line SVG. Pressure inspection marks both series. The obsolete slider and per-point SVG focus outline are removed.
- Page entry is one 420ms opacity/translation animation, without chart blur. The scene targets 60fps instead of 30fps, stops its loop when hidden, and avoids duplicate layout reads and transient camera vectors. Hidden legacy anchor controls no longer receive per-frame DOM writes.

## Verified

Browser checks at 1280×720, 805×962 and 390×844: history fits its available height; both pressure markers are 8×8px; mobile tooltip stays inside the plot; keyboard inspection and Escape work. Desktop selector center measured at 640px in a 1280px viewport. No connector SVG remains. Node tests cover data validity/context, paired/categorical readings, nearest-point boundaries/duplicates and scenario comparison arithmetic.

Actual device pairing and sustained GPU/frame-rate benchmarks were not part of this iteration. A 60fps target is not a measured frame-rate guarantee.
