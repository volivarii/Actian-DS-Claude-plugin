---
name: component-brief
description: This skill should be used when the user asks to document, brief, or spec a design system component, wants to know the variants/states/tokens for a component, asks for a spec page, or provides a Figma component URL and wants structured documentation.
argument-hint: "[Figma URL or component name] [generate N,N,N]"
---

# Component Brief

Draft a structured component brief with HTML spec page and Figma output. Pipeline: research → data model → present options → push.

## Mode detection

| Signal | Mode |
|--------|------|
| "FM", "Fat Marker", "wireframe", "lo-fi" | Fat Marker |
| "DS Kit", "design system", "hi-fi", Figma URL from DS Kit, default with URL | Actian DS |
| Component in FM catalog, no DS Kit signals | Fat Marker |
| Ambiguous | Ask: "Fat Marker (lo-fi) or Actian DS (hi-fi)?" |

Card selection: default all. `"push 2,4,5"`, `"skip 6"`, `"generate card 4"`. Keywords: `"preview"` → HTML; `"playground"` → explorer.

## Step 1 — Research (ONE parallel batch)

Parse URL (`fileKey` + `nodeId` per `../../references/figma-output.md`). ONE message: (1) `get_metadata(fileKey, nodeId)`, (2) `docs/component-guidelines/<slug>.json`, (3) `references/component-brief/data-schema.md`. Then: component set node ID from metadata → `get_design_context`. Fallback: `get_screenshot`.

## Step 1.5 — Generate data model

Write `{project_working_directory}/components/[name]/[name]-brief-data.json` per `../../references/component-brief/data-schema.md`. Dispatch `brief-data-validator` in background.

## Step 2 — Present options (copy verbatim)

```
Brief ready (N cards). Reply:
- **"push [Figma URL]"** — send to Figma
- **"push N,N"** — send specific cards only
- **"preview"** — HTML preview with annotations
- **"playground"** — interactive state explorer
- **feedback** — edit the data model
```

"push" → Step 3. "preview"/"playground" → Step 2.5 then return. Feedback → edit data, re-present.

## Step 2.5 — Render HTML

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/assemble-preview.js \
  {project_working_directory}/components/[name]/[name]-brief-data.json \
  --type brief -o {project_working_directory}/components/[name]/[name]-spec.html
```

## Step 3 — Render Figma

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/brief-to-figma.js \
  {project_working_directory}/components/[name]/[name]-brief-data.json \
  --target-node-id [nodeId] \
  --output-dir {project_working_directory}/components/[name]/.figma-calls
```

Read `manifest.json`. For each call: read `.js`, pass to `use_figma`. Call 1 returns `wrapperId`; replace `__WRAPPER_ID__` in subsequent calls. Never write freehand Figma code.

## Step 4 — Parity check

Per `../../references/parity-check.md`: screenshot each card, dispatch `parity-analyzer`, fix P0s.

## Key rules

Write files silently (never dump in chat). Research → data model → gate runs uninterrupted. If a Figma call fails, skip and proceed.

## References

`references/component-brief/`: `data-schema.md` (JSON schema, 9 DS + 5 FM cards), `quality-tiers.md` (tiers), `figma-spec-builder.md` (data→Figma mapping), `figma-rules.md` (pitfalls), `playground.md` (explorer).
