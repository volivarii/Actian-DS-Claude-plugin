---
name: create-component
description: Build or extend a component in the Figma DS library — new components, variants, or states. Includes research and token binding.
argument-hint: "[component description or Figma URL]"
---

# Create Component

Create a new Figma component (with variants) from a text description or by extending an existing component. Pipeline: understand → check existing → research (optional) → build plan gate → resolve dependencies → build via interpreter → cleanup → parity check.

## Step 1 — Understand the component

Determine: component name (FM prefix for Fat Marker), library (FM = Inter, DS Kit = Roboto), variants, content, layout, properties. If a Figma URL is provided, parse per `../../references/figma/figma-output.md` — classify node first via `use_figma`, route to the correct target, then `get_design_context` + `get_screenshot`. Infer as much as possible; only ask if the request is too vague to proceed.

## Step 2 — Check existing components

Check `../../docs/generated/dskit-components.md` and `../../docs/generated/fm-components.md`. If it exists, suggest modifying instead. Load `../../docs/component-guidelines/<slug>.json` for content/design guidelines if available.

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

1. Read `../../references/create-component/push-patterns.md` — direct push patterns
2. Read `../../references/figma/figma-push-patterns.md` — core patterns (wrapper frame, hexToRgb, etc.)
3. Resolve dependencies per `../../references/create-component/research-and-dependencies.md`
4. Push to Figma using small direct `use_figma` calls. Always pass `skillNames: "figma-use"`.

   **Push sequence:**
   a. For each variant: create component, set name, apply layout/fills, add children (1-2 calls each)
   b. Add component properties to each variant (1 call each)
   c. Link properties to text layers (1 call per component)
   d. Combine as variant set: `figma.combineAsVariants(components, page)` (1 call)
   e. Set name, description, variable scoping (1 call)
   f. Add GenLog instance as sibling (1 call)

   **Rules:**
   - Do NOT run any codegen scripts or `assembleCall()` — push directly
   - Do NOT read any `.js` files, manifests, or scaffolds
   - Return IDs from every call — use them in subsequent calls

Every component exposes: text properties (titles, labels), boolean properties (optional elements), variant properties (managed by Figma). Without propertyLinks, publishing fails with "unused property" errors.

## Step 6 — Cleanup + parity check

Run `../../references/quality-checklist.md` (Universal + Create Component sections). Then parity check per `../../references/figma/parity-check.md`: screenshot, dispatch `parity-analyzer`, fix P0s, write `.last-push.json`. Manifest includes `sourceHash`, `componentKeys`, and `tokenHash` — see `references/figma/parity-check.md` for computation.

After creation, offer: "Want me to generate a component brief?" If accepted, invoke `component-brief`. Remind user to run `/sync-design-system` to update local references.

## Key rules

- Write files silently (never dump JSON/code in chat)
- Use `primaryAxisAlignItems: "SPACE_BETWEEN"` for push-apart layouts, never Spacer frames
- Button booleans: `"👁 Leading Icon": false, "👁 Trailing Icon": false` by default
- Never leave variableScopes as `ALL_SCOPES`

## References

- `references/create-component/push-patterns.md` — direct push patterns for component creation
- `references/quality-tiers.md` — Draft / Standard / Production tier definitions
- `references/create-component/research-and-dependencies.md` — research procedure, dependency resolution
- `references/figma/figma-output.md` — Figma URL parsing, token binding
- `references/quality-checklist.md` — cleanup pass checklist
- `references/figma/parity-check.md` — post-push parity check procedure
- `docs/generated/meta-kit/variables.md` — DS Kit variable keys
- `references/fm-css-reference.md` — FM hex palette
