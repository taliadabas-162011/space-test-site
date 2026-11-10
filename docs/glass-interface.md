# Liquid interface

Liquid is the sole interface. Focus/Original comparisons, the design selector and their saved-preference switching code have been removed. Existing profile/observation stores and drafts are preserved; an old URL or saved preference cannot switch back to a retired design.

`crew-liquid-base.css` contains the shared controls and typography. `crew-liquid.css` owns the responsive scene composition, and `crew-care.css` keeps scenario content concise. Headings use ordinary spacing and sentence case. Decorative status pills, eyebrow labels, numbered response plans and duplicate action headings are removed. Scenario content has one message and one principal action; methodology and the medical handoff are disclosed on demand.

`crew-liquid-ui.js` adds hardware/measurement glyphs, localized glass optics and moving selection lenses to navigation and graph controls. Optics use the locally bundled MIT `simple-liquid-glass` package, not a screenshot of the scene. Content remains ordinary DOM over the live WebGL scene. Reduced motion, reduced transparency and CSS fallbacks remain available.

The main layout reserves a real space for the astronaut. Camera fitting follows that space when the viewport or content reflows. Drag, bounded orbit/zoom, keyboard exploration and reset remain. Overview, History and Devices share one scene surface; the 1.85-second camera director interpolates physical camera position and look-at. History ends in a frontal helmet close-up, Devices near the suit equipment, and Overview in a wider shot. Interrupted navigation continues from the displayed pose. Reduced motion selects the destination immediately. Original model materials, lighting and Earth remain; no added visor reflection is used.

History retains navigation and period controls while replacing the chart. Whole-visual opacity/translation replaces the old dashed polyline reveal, so complete series stay connected during transitions. Axes, pointer/keyboard inspection and fixed-size markers remain.

See [scenario content review](scenario-content-review.md) for the challenge mapping, sources, behavior and clinical limitations. The interface is a web adaptation informed by [Apple's materials guidance](https://developer.apple.com/design/human-interface-guidelines/materials) and [Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/); it does not claim native Apple rendering fidelity.
