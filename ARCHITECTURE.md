# Architecture

## Package boundaries

```text
packages/
  spatial-core/          schemas, scene nodes, IDs, lifecycle, disposal
  spatial-three/         Three.js renderer, loaders, cameras, raycasting
  spatial-astro/         Astro integration, MDX components, islands, HMR
  spatial-story/         chapters, scroll conductor, world state
  spatial-assets/        asset manifests, factories, validation, budgets
  spatial-environments/  optional terrain, weather, atmosphere, architecture
  spatial-devtools/      inspector, diagnostics, manifests, overlays
  spatial-game/          optional game-oriented adapters
```

## Runtime flow

```text
MDX/Astro source
  -> typed component props
  -> schema validation
  -> scene manifest
  -> runtime scene graph
  -> Three.js renderer
  -> DOM/3D interaction bridge
```

## Renderer policy

WebGL is the compatibility baseline. WebGPU may be added through an adapter once the scene and asset contracts are stable. No renderer may own page semantics or replace the DOM fallback.

## Asset policy

Every asset should expose a stable ID, source path, provenance, coordinate convention, scale, bounds, optional interaction targets, and budget metadata. Render geometry must remain separate from interaction proxies and future physics geometry.

`@astro-spatial/assets` is the source of truth for these definitions. It supports imported GLB assets, hand-authored procedural factories, and `img2threejs`-style generated TypeScript factories without making any one producer a runtime dependency.

Procedural factories are registered explicitly with `registerProceduralFactory(src, factory)`. This avoids executing arbitrary asset code from serialized scene data while keeping generated `THREE.Object3D` factories editable and diffable.

## State policy

Authored content, runtime state, and presentation state must remain separate. Agent edits operate on serializable source or scene documents rather than opaque Three.js objects.
