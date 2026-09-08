# Agent instructions

## Before changing code

Read `CONTEXT.md`, `SPEC.md`, and `ARCHITECTURE.md`. For visual work, also read `DESIGN.md`. For a multi-file change, update `PLAN.md` or `TASKS.md` when the scope changes.

## Working rules

- Keep the core smaller than a game engine.
- Preserve semantic DOM and non-WebGL fallbacks.
- Treat stable IDs and schemas as public contracts.
- Dispose Three.js resources and remove listeners on teardown.
- Validate assets, props, and scene documents at boundaries.
- Prefer reversible changes and deterministic fixtures.
- Do not add WebGPU-only or experimental browser behavior to the MVP without documenting the fallback.
- Do not commit, push, or perform destructive git operations automatically.

## Verification

Run the narrowest relevant checks first, then typecheck, tests, build, and browser/visual verification for rendering changes. Record important failures and lessons in `.agent/memories/`.

