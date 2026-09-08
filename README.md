# Astro Spatial

An AI-native spatial web framework for building expressive Astro pages with declarative Three.js scenes.

The initial direction is an Astro integration and component layer, not a replacement for Astro. Markdown/MDX defines the page and scene; Astro owns content, routing, and static rendering; Three.js owns the interactive canvas.

## Project status

Alpha scaffold complete. The workspace now includes the Astro/Three.js authoring layer, validated scene and asset manifests, story camera conduction, WebGL/WebGPU adapters, physics and networking extensions, a live editor preview with transform gizmos, deterministic game systems, and optional weather/architecture systems.

The editor reference page is available at `/editor` in the example app. The remaining work is product hardening and ecosystem polish rather than an unscaffolded roadmap milestone.

## Current example

```bash
npm install
$env:ASTRO_TELEMETRY_DISABLED = '1'
npm run build --workspace=astro-spatial-example
```

Inspect serialized scene and asset manifests with:

```bash
npm run spatial:inspect -- --scene examples/hello-world/scene.manifest.json --assets examples/hello-world/assets.manifest.json
```

## Documentation

- [Context](CONTEXT.md)
- [Plan](PLAN.md)
- [Specification](SPEC.md)
- [Tasks](TASKS.md)
- [Architecture](ARCHITECTURE.md)
- [Design](DESIGN.md)
- [Agent rules](AGENTS.md)
- [Bootstrap workflow](BOOTSTRAP.md)

## Related local research

- `../liquid-dom` — scene graphs, layout, interaction, animation, and Three/WebGPU adapters
- `../uilayouts` — design tokens, UI blocks, and AI-readable design documentation
