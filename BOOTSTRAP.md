# Bootstrap

1. Read `CONTEXT.md`, `PLAN.md`, `SPEC.md`, `ARCHITECTURE.md`, `DESIGN.md`, `AGENTS.md`, and `TASKS.md`.
2. Inspect the repository status and existing package boundaries.
3. Read the relevant local skill or workflow before implementing specialized work.
4. Check `.agent/memories/` for prior decisions and known failures.
5. Write a concise task plan and pre-mortem for changes spanning multiple packages.
6. Implement the smallest testable slice.
7. Run validation proportional to the risk, including visual checks for scene changes.
8. Update task status and record any durable architectural lesson.

## First-session questions

- Which milestone is currently active?
- Which source document is authoritative for this change?
- What is the smallest reversible implementation?
- What fallback exists if the renderer, asset, or browser capability fails?
- What evidence will demonstrate completion?

