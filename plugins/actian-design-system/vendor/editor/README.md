# Knowledge Editor

Schema-driven editor for the `actian-ds-knowledge` substrate. Authors edit the canonical files (tokens, foundations, components, accessibility, app-context, fm-to-ds-map, icon-groups) through forms + rich-text + live preview, and the editor packages each change as a Pull Request against `main`.

Built as a static SPA, deployed from this repo's own GitHub Pages. Zero recurring cost, no third-party hosting.

## Dev

```bash
npm install
npm run dev      # boots Vite on http://localhost:5173/
npm test         # runs node --test under tsx
npm run build    # production build to dist/
```

## Architecture

Four isolated units:
- **Form-engine** — RJSF + uiSchemas + serializer round-trips.
- **Commit-PR core** — read-only-path refusal, schema validation, GitHub branch/tree/commit/PR pipeline.
- **Draft inbox** — local pending changes before submission.
- **Settings / PAT vault** — token storage in `localStorage`.

UI schemas live in `src/uiSchemas/` — **never** in `schemas/`. Doctrine P3: the schemas are the published contract; presentation hints (labels, ordering, help text) belong to the consumer.

See the design spec: `actian-design-system-plugin/plugins/actian-design-system/docs/superpowers/specs/2026-05-23-knowledge-editor-phase-1-design.md`
