# Design

## Design direction

Spatial pages should feel intentional, editorial, and materially grounded rather than like generic animated backgrounds. One strong spatial idea should lead each page; typography, copy, and controls must remain legible.

## Principles

- The DOM carries meaning; the canvas creates place and depth.
- Motion answers a user action or supports a clear narrative beat.
- Performance and accessibility are visual design constraints.
- Use one signature visual motif per experience.
- Prefer authored composition over random particles and decorative noise.
- Preserve semantic headings, links, controls, and focus states.

## Motion

- Respect `prefers-reduced-motion`.
- Provide still or low-motion scene states.
- Separate exact authored state from smoothed visual interpolation.
- Keep camera movement purposeful and reversible.

## Spatial composition

- Establish silhouette, focal point, depth layers, and contrast before adding effects.
- Keep HTML content in a readable contrast window.
- Use atmosphere to separate depth, not to obscure copy.
- Treat fallback posters and loading states as designed compositions.

## Design tokens

Project-level colors, typography, spacing, shape, and motion tokens should eventually be expressible in a Markdown/YAML format compatible with the existing design-token approach in `uilayouts`.

