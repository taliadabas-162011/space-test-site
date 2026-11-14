# Working on Crew Health

These rules apply throughout this repository. Follow the user's current request when it deliberately changes the direction described here. Keep this file about reusable decisions, not a frozen list of screens or features.

## Product and scope

- Design for a crew member using the interface every day: clear priorities, short paths and a visible next action. Keep routine work calm and urgent work immediately understandable.
- Extend the established interface before inventing another interaction system. Preserve surrounding screens, stored data and working behavior when the task is scoped to one feature. Broader redesigns are welcome when requested.
- Put primary destinations in the shared main navigation. Add new destinations there when appropriate; do not repeat the same destination in overview buttons, footers or another tab system. Contextual actions such as Save, Next and a measurement guide still belong beside their task.
- Keep navigation state and the 3D scene in agreement. Leaving an exploration mode must restore the appropriate scene before the next camera move. Handle interrupted transitions and delayed asset loads as well as the normal path.

## Visual and interaction language

- Liquid Glass is the established visual system. Reuse its optical layer, moving selection lens, spacing, typography and motion. Avoid opaque blue sheets, generic bordered cards and native-looking controls mixed into the interface.
- Use the existing accessible custom selects, date/time controls and form patterns. Keep real labels, units, keyboard support, visible focus, validation and adequate hit targets. Make inputs visibly editable.
- Keep text concise and useful. Avoid redundant greetings, explanatory filler, decorative badges, section numbering, excessive dividers, all-caps subtitles and negative letter spacing. Do not mistake these rules for a ban on functional glass controls or necessary medical context.
- Use progressive disclosure for secondary detail. Preserve drafts and focus when switching questions or measurements. Avoid stacking modals, nested routes and unexpected page shifts.
- Keep the astronaut, Earth and surrounding 3D environment integrated with the interface. Use real scene and camera transitions rather than screenshots, fake reflections or abrupt swaps. Visuals must not obscure text or controls.
- Make movement consistent across navigation, selection groups and expanded controls. Honor reduced motion and reduced transparency. Keep content usable at small viewports and browser zoom; do not rely on one fixed screen size.

## Component references

Read the relevant implementation and its callers before changing it. These are starting points to reuse, not permission to copy legacy styles elsewhere.

| Concern | Existing implementation |
| --- | --- |
| Main navigation, view state and scene coordination | `design/crew-orbit.js` |
| Liquid Glass foundation and optical surfaces | `design/crew-liquid-base.css`, `design/crew-liquid.css`, `design/crew-liquid-ui.js` |
| Moving selection lens and shared control behavior | `design/crew-liquid-controls.js`, `design/crew-liquid-interactions.css` |
| Accessible selects and anchored popovers | `design/crew-select.js`, `design/crew-select.css`, `design/crew-popover.js` |
| Custom calendar and time entry | `design/crew-datetime.js`, related rules in `design/crew-workflow.css` |
| Daily check-in shell and measurement fields | `design/crew-collection.js`, `design/crew-workflow.css` |
| One-question flow and focused topic content | `design/crew-questionnaire.js`, `design/crew-checkin-focus.css` |
| Illustrated collection guides and lab reports | `design/crew-measurement-guides.js`, `design/crew-immunity.js` |
| History chart, axes and pointer/keyboard inspection | `design/crew-history-scene.js`, `design/crew-history-scene.css` |
| Anatomy content and body/organ selection | `design/crew-anatomy-ui.js`, `design/crew-anatomy-ui.css` |
| Real 3D models, anatomy blending and camera movement | `design/crew-motion-stage.js`, `design/crew-anatomy.js`, `design/crew-scene-director.js` |
| Urgent response controls, visual state and audio | `design/crew-assistance.js`, `design/crew-urgent.css`, `design/crew-alarm.js` |
| Observation storage and append-only saves | `design/crew-health.js` |

## Data and scientific content

- Preserve existing observations; a new measurement appends an observation, never rewrites a whole historical series. Retain collection time, entry time, units, context and provenance.
- Validate at the save boundary as well as in the UI. Keep missing data, qualitative reports and numeric zero distinct. Only combine comparable quantities and units in graphs.
- Support scientific claims and measurement instructions with primary sources. Explain the scope of calculated indicators without inventing diagnoses, treatment instructions or a general health score. Keep evidence and limitations in the relevant documentation.

## Before finishing

- Run `node --test tests/*test.*` and `git diff --check`. Add focused regression coverage for changed logic; do not add tests that merely repeat CSS declarations.
- Inspect the actual app, not just generated markup. For UI changes check desktop and mobile layouts, expanded controls, keyboard/focus behavior and the full navigation path into and out of the changed view. Check that the scene follows navigation and that controls remain readable over it.
- Capture a screenshot of the completed UI and review it. Do not call work complete based only on a passing build or an image you have not inspected.
- Register new offline assets and update affected import/style cache versions plus `service-worker.js` when changing shipped files. Keep local preview caching in mind.
- Keep commits understandable by feature or behavior. Preserve unrelated work. Commit and push when requested, and report what was checked and any material limits.
