---
name: create-component
description: Use when the user asks to create, build, or make a new component in the Figma design system library, add a variant or state to an existing component, extend a component, or describes a UI element that should become reusable.
argument-hint: "[component description or Figma URL]"
---

# Create Component

Create a new Figma component (with variants) from a text description or by extending an existing component. Pipeline: understand → check existing → research (optional) → build plan gate → resolve dependencies → build via interpreter → cleanup → parity check.

## Step 1 — Understand the component

Determine: component name (FM prefix for Fat Marker), library (FM = Inter, DS Kit = Roboto), variants, content, layout, properties. If a Figma URL is provided, parse per `../../references/figma-output.md` then `get_design_context` + `get_screenshot`. Infer as much as possible; only ask if the request is too vague to proceed.

## Step 2 — Check existing components

Check `../../docs/dskit-components.md` and `../../docs/fm-components.md`. If it exists, suggest modifying instead. Load `../../docs/component-guidelines/<slug>.json` for content/design guidelines if available.

## Step 3 — Research (optional)

Skip if user specified variants, layout, and content. See `../../references/create-component/research-and-dependencies.md` for the full procedure.

## Step 4.5 — Build plan gate (copy verbatim)

```
Building: [Component name] ([library])

Variants: [axis]: [values] x [axis]: [values] = [total] variants
Properties: [editable text/boolean/instance-swap props]
Nested components: [imported library instances]
States: [Enabled, Disabled, Hovered, etc.]

"build" to proceed -- feedback to adjust
```

Wait for response. Draft tier: skip this gate.

## Step 5 — Build in Figma (interpreter)

1. Read `../../references/create-component/figma-spec-builder.md` — build plan to spec mapping
2. Transform build plan into figma-spec.json (COMPONENT or COMPONENT_SET, properties, propertyLinks, variableScopes with explicit scopes, nested components via imports)
3. Resolve dependencies per `../../references/create-component/research-and-dependencies.md`
4. Write the spec JSON to `{project_working_directory}/components/[name]/component-spec.json`
5. Generate interpreter call:
   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
   "$NODE_BIN" -e "const s = require('${CLAUDE_PLUGIN_ROOT}/scripts/shared-constants.js'); const spec = JSON.parse(require('fs').readFileSync('{project_working_directory}/components/[name]/component-spec.json','utf8')); process.stdout.write(s.assembleCall(spec));" > /tmp/component-code.js
   ```
6. Read `/tmp/component-code.js`, pass to `use_figma`
7. Add INSTANCE genLog (6 props) as sibling to component set

Every component exposes: text properties (titles, labels), boolean properties (optional elements), variant properties (managed by Figma). Without propertyLinks, publishing fails with "unused property" errors.

## Step 6 — Cleanup + parity check

Run `../../references/quality-checklist.md` (Universal + Create Component sections). Then parity check per `../../references/parity-check.md`: screenshot, dispatch `parity-analyzer`, fix P0s, write `.last-push.json`.

After creation, offer: "Want me to generate a component brief?" If accepted, invoke `component-brief`. Remind user to run `/sync-design-system` to update local references.

## Key rules

- Write files silently (never dump JSON/code in chat)
- Use `primaryAxisAlignItems: "SPACE_BETWEEN"` for push-apart layouts, never Spacer frames
- Button booleans: `"👁 Leading Icon": false, "👁 Trailing Icon": false` by default
- Never leave variableScopes as `ALL_SCOPES`

## References

- `references/create-component/figma-spec-builder.md` — build plan to spec mapping
- `references/quality-tiers.md` — Draft / Standard / Production tier definitions
- `references/create-component/research-and-dependencies.md` — research procedure, dependency resolution
- `references/figma-output.md` — Figma URL parsing, token binding
- `references/quality-checklist.md` — cleanup pass checklist
- `references/parity-check.md` — post-push parity check procedure
- `docs/meta-kit/variables.md` — DS Kit variable keys
- `references/fm-css-reference.md` — FM hex palette
