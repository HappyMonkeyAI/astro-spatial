# Plan

## Milestones

### M0 — Project foundation

- Establish documentation, agent workflow, package boundaries, and decisions log.
- Create the smallest runnable Astro/Three.js proof.

### M1 — WebGL scene MVP

- Astro integration
- `Scene`, `Camera`, `Model`, `Light`, and `Environment`
- GLB loading
- responsive sizing and DPR caps
- static fallback and reduced-motion mode
- cleanup and disposal

Status: implementation slice complete and build-verified, including procedural previews, lazy GLB loading, cleanup, quality tiers, and an optional WebGPU adapter.

### M2 — Declarative scene compiler

- typed scene nodes
- stable IDs
- MDX-to-scene compilation
- Zod validation
- HMR-preserved nodes

Status: typed scene nodes, Zod validation, serialized manifests, deferred client mounting, HMR cleanup, the `Scene` component, and nested child-node components are implemented. A full MDX compiler remains optional future work.

### M3 — Interaction bridge

- 3D pointer events
- DOM controls targeting scene nodes
- camera/object actions
- keyboard and reduced-motion equivalents

Status: pointer highlighting, scoped DOM actions, focus/pulse actions, and reduced-motion handling are implemented.

### M4 — Spatial storytelling

- persistent world model
- chapters and normalized scroll conductor
- camera, lighting, atmosphere, and interaction ledgers
- progressive chapter loading

Status: deterministic chapter/progress conductor, semantic Astro `Story` component, typed camera/world keyframe interpolation, and runtime camera application through scoped story events are implemented.

### M5 — Agent-native tooling

- generated `llms.txt`
- component and scene manifests
- `validate`, `inspect`, `assets`, and `docs` commands
- readable validation errors

Status: component manifest, generated `llms.txt`, reusable scene/asset diagnostics, and CLI inspection are implemented.

### M6 — Quality and extension tracks

- performance diagnostics and adaptive quality
- procedural asset factories, including optional `img2threejs` compatibility
- optional WebGPU adapter
- optional environment, weather, architecture, and game-system packages

Status: WebGL quality controls, procedural factories, asset diagnostics, optional WebGPU, environment nodes, deterministic physics, transport-agnostic networking, the editor/source-writeback layer with a live viewport and transform gizmos, deterministic game combat/enemy systems, and optional weather/architecture systems are implemented.

## Release strategy

1. Private prototype
2. Internal alpha with reference demos
3. Public alpha focused on WebGL and MDX
4. Extension ecosystem after the core authoring contract is stable

## Risks

- Overbuilding a game engine before validating the page-authoring model.
- Making WebGPU or experimental DOM compositing a hard dependency.
- Allowing unstable generated assets or IDs to make agent edits unreliable.
- Treating visual polish as proof without performance and accessibility evidence.
