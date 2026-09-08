# Patterns and lessons

Record durable implementation lessons, failed approaches, and reusable patterns here. Keep current normative decisions in the root documentation files instead.
# Astro Spatial implementation lessons

- Keep browser-facing rendering optional at package boundaries: deterministic physics, networking, story interpolation, editor commands, and world systems remain usable without a DOM or WebGL context.
- Treat the serialized scene manifest as the contract between Astro authoring, agent tooling, the editor, and runtime adapters; validate it whenever it crosses a boundary.
- Keep the semantic fallback in the page and isolate Three.js/WebGPU/editor capabilities behind dynamic imports.
