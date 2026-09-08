# Tasks

## Now

- [x] Confirm repository name and package manager.
- [x] Write the initial architecture decision log.
- [x] Create an Astro proof project with one canvas.
- [x] Define the first scene-node TypeScript types.
- [x] Add a minimal WebGL renderer lifecycle.
- [x] Add a static fallback and reduced-motion path.

## Next

- [x] Add GLB loading and disposal.
- [x] Prevent stale asynchronous model loads from reattaching after scene replacement.
- [x] Add nested `Camera`, `Model`, and `Light` Astro/MDX child components.
- [x] Add typed camera, model, procedural-model, and light node constructors.
- [x] Add a first-class environment node, constructor, and Astro component.
- [x] Add Zod validation and stable ID checks.
- [x] Add Zod validation for serialized scene manifests at build and runtime boundaries.
- [x] Add responsive resize and DPR quality tiers.
- [x] Reduce the initial client chunk by lazy-loading GLTF support.
- [x] Add explicit performance budgets and quality tiers.
- [x] Add opt-in adaptive quality based on sustained frame time.
- [x] Add one canvas-to-3D interaction.
- [x] Add semantic DOM controls targeting stable 3D node IDs.
- [x] Replace the example's manual manifest script with a reusable Astro `Scene` component.
- [x] Serialize and mount scene manifests through a bundled client module.
- [x] Add deterministic scene fixtures and serialized example manifests.
- [x] Add deterministic core manifest tests.

## Later

- [x] Add HMR cleanup for scene renderers and interaction listeners.
- [x] Add procedural model factory registration and `img2threejs`-compatible Object3D mounting.
- [x] Add scroll chapters and a persistent world conductor.
- [x] Add deterministic story chapters, scroll progress, damping, and interpolation helpers.
- [x] Add a semantic Astro Story component driven by native scroll.
- [x] Connect scoped story progress events to scene runtime progress.
- [x] Add scene and asset diagnostics with performance-budget warnings.
- [x] Add a CLI inspection command for serialized scene and asset manifests.
- [x] Add an opt-in runtime dev overlay for FPS, DPR, draw calls, and triangles.
- [x] Add asset manifests and diagnostics.
- [x] Add validated asset definitions for GLB, procedural, and `img2threejs` sources.
- [x] Add a machine-readable component manifest and generated `llms.txt`.
- [x] Add generated `llms.txt` and component documentation.
- [x] Add an optional capability-gated WebGPU renderer adapter.

## Deferred

- [x] Add a deterministic physics core and worker message protocol.
- [x] Add transport-agnostic authoritative snapshots and client interpolation.
- [x] Add the headless editor command/data layer with selection, transforms, undo/redo, and deterministic serialization.
- [x] Add deterministic scene-manifest source write-back markers.
- [x] Add deterministic game combat, enemy state, targeting, damage, and cooldown systems.
- [x] Add optional deterministic weather and architecture world systems.
- [x] Build a visual scene editor panel on top of the editor command layer.
- [x] Add a live 3D viewport preview to the editor UI.
- [x] Add direct-manipulation 3D transform gizmos to the editor UI.
