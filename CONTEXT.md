# Context

## Why this exists

Three.js sites can produce memorable spatial experiences, but the implementation burden is high and imperative scene code is difficult for AI agents to inspect and modify safely.

Astro provides a strong host for this problem: static HTML, content, routing, and SEO can remain lightweight while JavaScript is reserved for interactive scenes.

## Product thesis

Astro Spatial should make spatial pages understandable and editable by both humans and AI agents through typed, declarative, Markdown/MDX-authored scenes.

## Primary users

- Frontend developers building high-quality 3D marketing, editorial, portfolio, and product pages.
- Designers who need reusable spatial primitives without owning a full game engine.
- AI agents that must generate, inspect, validate, and revise spatial pages.

## Constraints

- WebGL is the initial renderer target; WebGPU is an optional later adapter.
- HTML remains semantic and accessible outside the canvas.
- Mobile, reduced motion, loading failure, and GPU failure are first-class cases.
- The core must stay smaller than a game engine.
- Generated or imported assets must have explicit provenance and budgets.

## Research inputs

- `liquid-dom` for scene, layout, pointer, animation, and renderer lifecycle patterns.
- `uilayouts` for design-token and AI-readable documentation patterns.
- The Three.js and game-development skills in `../games/Skills` for camera, scroll worlds, performance, assets, and QA.
- `img2threejs` as a possible procedural asset producer.
- `AgentsProtocol` as the project workflow model; its agent rules, bootstrap workflow, memory folder, and verification-first habits are included locally.
