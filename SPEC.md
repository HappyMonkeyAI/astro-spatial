# Specification

## Initial authoring model

Pages are Astro or MDX documents. HTML content remains normal semantic markup. Spatial content is expressed through typed components.

```mdx
---
import Scene from '@astro-spatial/astro/components/Scene.astro'

const heroNodes = [
  { id: 'hero-camera', kind: 'camera', position: [0, 1, 5], fov: 45 },
  { id: 'hero-object', kind: 'procedural-model', src: 'preview', scale: 1.5 },
]
---

<Scene id="hero" nodes={heroNodes} fallback="Loading spatial preview" />
```

The first component accepts a validated node list. Typed constructors such as `cameraNode`, `modelNode`, `proceduralModelNode`, and `lightNode` keep frontmatter authoring declarative while preserving compile-time contracts. Nested child components remain a future compiler slice.

## Initial components

- `Scene`
- `Camera`
- `Model`
- `ProceduralModel`
- `Light`
- `Environment`
- `Animation`
- `Interaction`

## Scene component contract

`Scene` validates node IDs during Astro build, emits a semantic canvas with a static fallback, and mounts the client renderer only in the browser. Multiple scenes on one page are supported through independent scene containers.

Set `storyId` on a scene to subscribe it to a matching `Story`. The story owns native scroll and publishes progress; the scene consumes that progress for camera or object presentation.

## Required behavior

- A page without a scene must not load the scene runtime.
- A scene must render a useful fallback before heavy assets are ready.
- A failed model must not blank the page or trap interaction.
- Renderer resources and event listeners must be released on teardown.
- `prefers-reduced-motion` must disable or simplify continuous animation.
- Public node IDs must be stable and unique within a scene.
- Invalid props must produce actionable validation errors.

## Initial asset formats

- GLB/glTF models.
- Static fallback images.
- TypeScript procedural model factories conforming to a documented contract.

GLB models load asynchronously and fall back to a procedural preview when loading fails. Loaded scene graphs, materials, textures, and renderer resources are disposed when the scene is destroyed or replaced.

## Acceptance criteria for M1

- A fresh Astro project can install the integration and render one scene.
- The scene works at desktop and narrow mobile sizes.
- DPR is capped and configurable.
- The page remains understandable when WebGL is unavailable.
- A model can be hovered or focused through a documented interaction path.
