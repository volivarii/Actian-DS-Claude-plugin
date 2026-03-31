---
name: create-component
description: Use when the user asks to create, build, or make a new component in the Figma design system library, add a variant or state to an existing component, extend a component, or describes a UI element that should become reusable.
argument-hint: "[component description or Figma URL]"
---

# Create Component

Create a new Figma component (with variants) from a text description or by extending an existing component.

**When NOT to use:** If the user wants to *document* an existing component → use `component-brief`. If the user wants to *fix* an audit finding → use `design-audit`.

> **Shared rules apply:** Quality & hygiene checklist and generation log format — all per CLAUDE.md.

> **Mode: Implement with build confirmation.** Build first, explain after. Output working artifacts, not commentary. Move fast — infer details from the user's request and make reasonable decisions. Only ask when critical information is genuinely missing. Two pause points: (1) Step 1 if the request is too vague, and (2) Step 4.5 to confirm the build plan before Figma output (skipped for Draft tier). The cleanup pass (Step 6) handles polish. Keep status updates to milestones only.

### Quality tier detection

| Signal | Tier | Effect |
|--------|------|--------|
| "quick", "rough", "draft" | Draft | Component only, no generation log, minimal cleanup |
| No qualifier (default) | Standard | Component + generation log + standard cleanup pass |
| "production", "final" | Production | Standard + variable binding on all scaffolding + research step |

## Input

The user describes a component they want to create. Examples:
- "Create a Page Header component with title, subtitle, and action buttons variants"
- "Add a Card component with Default, Hover, and Selected states"
- "Extend this component with a new variant" + Figma URL
- "Create an FM Alert component with success, error, warning, and info variants"

## Step 1 — Understand the component

Determine from the user's request:
- **Component name** (with FM prefix for Fat Marker, no prefix for DS Kit)
- **Library** — Fat Marker (`"fat-marker"`, Inter font) or DS Kit (`"dsKit"`, Roboto font)?
- **Variants** — what axes and values? (e.g., Type: Default / With Actions / Compact)
- **Content** — what text, icons, or nested components does each variant contain?
- **Layout** — horizontal or vertical? Spacing? Padding?
- **Properties** — which text fields should be editable component properties? Which booleans toggle visibility?

Infer as much as possible from the request and context. If a Figma URL is provided, fetch it with `get_design_context` + `get_screenshot` to fill in details. Only ask the user if the request is too vague to proceed (no component name, no sense of what it does).

## Step 2 — Check existing components

Before creating, check these files (shipped with the plugin):
1. `../../docs/dskit-components.md` — does it already exist in DS Kit?
2. `../../docs/fm-components.md` — does it already exist in FM Kit?

If it exists, tell the user and suggest modifying it instead of creating a duplicate.

### Load component guidelines

If the component exists (or a similar one does), check for per-component guidelines:
- Read `../../docs/component-guidelines/<slug>.json` (e.g., `button.json`, `text-input.json`)
- This file contains content guidelines, design guidelines, variant inventory, and example screenshots extracted from Figma
- Use the `content_guidelines` and `design_guidelines` fields to inform your spec — they capture Figma-native guidance that the generic docs don't cover
- If the file doesn't exist, proceed without it

## Step 3 — Research patterns (optional)

Skip this step if the user already specified variants, layout, and content in detail — they know what they want. Run it when the component is new and the user's description is high-level (e.g., "create a stepper component" without specifying variants or layout).

### What to research

1. **Actian product context** — Read `../../references/app-context.md`. Which app is this component for (Studio/Explorer/Administration)? What entities does it display? A "Data Product Card" needs trust signals (quality score, freshness, owner). A "Lineage Node" needs transformation metadata. A "Connection Tile" needs status and provider logo. The app context changes the component's property surface.

2. **Established design systems** — How do Material, Atlassian, Ant Design, Carbon, or Spectrum handle this component type? Look at:
   - Variant axes (what properties are configurable?)
   - Internal anatomy (what sub-elements make up the component?)
   - Common states (enabled, disabled, error, loading, selected?)
   - Accessibility patterns (keyboard interaction, ARIA roles)

3. **SaaS UX patterns** — Read `../../references/ux-patterns.md` for the relevant flow type. If the component is a filter bar, reference faceted filtering patterns. If it's a detail panel, reference companion sidebar patterns. If it's a table, reference inline editing and bulk operation patterns.

4. **Existing Actian patterns** — Check if similar components in the FM or DS Kit library follow conventions that this component should match (e.g., same variant axis names, same spacing, same state set).

### How to research

- Use `WebSearch` to find component documentation from major design systems
- Focus on the component API and variant structure, not visual styling (we use our own tokens)
- Keep it brief — 2-3 sources is enough to establish the pattern

### Output

Summarize findings internally and use them to inform the spec. Do not present a separate research report — fold the insights directly into the component design. If research reveals variant axes or states the user didn't mention, include them in the spec (the user can remove what they don't need).

## Step 4.5 — Confirm build plan

Before creating in Figma, present a quick summary of what will be built. This is the user's last chance to catch misunderstandings before spending `use_figma` calls.

Present:
> **Building: [Component name]** ([library])
>
> **Variants:** [axis]: [values] × [axis]: [values] = [total count] variants
> **Properties:** [list of editable text/boolean/instance-swap props]
> **Nested components:** [list of imported library instances, e.g., "FM Button, FM Icon"]
> **States:** [Enabled, Disabled, Hovered, etc.]
>
> **"build"** to proceed · **feedback** to adjust

**Wait for the user's response.** On approval, proceed to Step 5. On feedback, adjust the spec and re-present.

For Draft tier: skip this step (speed over accuracy).

---

### Step 5.0 — Resolve dependencies (before building)

When the build plan includes nested components (e.g., a Card that contains Button and Badge), ensure dependencies exist before building.

1. Scan the build plan for nested component references (any mention of importing or including other components)
2. For each referenced component, check if it exists:
   a. First check `../../docs/fm-components-registry.json` or `../../docs/dskit-components-registry.json` (fast, local lookup)
   b. Fallback: call `search_design_system` to verify the component exists in the library
3. Classify each dependency:
   - **Exists** → import key ready, proceed to Step 5
   - **Missing** → must be built first

4. If missing dependencies exist, build them leaf-to-root:
   - Sort by dependency depth (components with no dependencies first)
   - Build each missing component with a minimal `use_figma` call (basic structure only)
   - Record their keys for the parent component's build step

5. Report to user before proceeding:
   > "Dependencies resolved: FM Button (exists), FM Icon (exists), Custom Badge (building...)"

If no nested components are referenced in the build plan, skip this step entirely.

## Step 5 — Build in Figma (JSON Spec Interpreter)

**Do NOT write freehand use_figma code.** Transform the build plan into a figma-spec.json using the COMPONENT_SET or COMPONENT node types.

1. Read `../../references/create-component/figma-spec-builder.md` — build plan → spec mapping
2. Read `../../references/figma-spec-schema.md` — JSON spec format reference
3. Transform: build `figma-spec.json` from the build plan following the builder reference
   - **Single component** → `{ type: "COMPONENT", ... }` with properties and children
   - **Variant set** → `{ type: "COMPONENT_SET", variants: [...] }` with named variants
   - **Properties** → `properties: [{ name, type, default }]` on each COMPONENT
   - **Property links** → `propertyLinks: [{ layer, property }]` to connect text nodes
   - **Variable scopes** → `variableScopes: [{ ref, scopes }]` — NEVER leave as `ALL_SCOPES`
   - **Nested components** → declare in `spec.imports`, use INSTANCE nodes in children
4. Read `../../scripts/figma-interpreter.js` (fixed ~30KB)
5. Assemble `use_figma` call:
   ```js
   ${interpreterCode}
   const spec = ${JSON.stringify(figmaSpec)};
   return await buildFromSpec(spec);
   ```
6. Generation metadata — add INSTANCE genLog with 6 props as sibling to the component set

**Properties checklist — every component must expose:**
- **Text properties** for user-facing text (titles, labels, button text)
- **Boolean properties** for optional elements (badge, icon, description)
- **Variant properties** — managed by Figma via variant name axes

Without properties, users can't customize instances. Without `propertyLinks`, publishing will fail with "unused property" errors.

**Token references:** `../../references/figma-output.md` § "Token binding", `../../docs/meta-kit/variables.md` (DS Kit keys), `../../references/fm-css-reference.md` (FM hex).
**Spacing scale:** 4, 8, 12, 16, 24, 28, 32px only.

---

## Step 6 — Cleanup pass

Run through the checklist in `../../references/quality-checklist.md` — check the **Universal** section plus the **Create Component** section for this skill. Fix issues inline before presenting to the user.

If a fix is ambiguous, note it for the user review step instead of fixing silently.

## Step 6.5 — Parity check

After all `use_figma` calls complete, run the post-push parity check procedure in `../../references/parity-check.md`:

1. `get_screenshot` of the created component set
2. **Dispatch `parity-analyzer` agent** with screenshot + expected variant count and properties from the build plan
3. Merge findings with your own visual check
4. Report findings and offer to fix P0 issues
5. Write `.last-push.json` manifest to `{project_working_directory}/components/[component-name]/.last-push.json`

## Step 7 — Offer component brief

After the component is created, ask the user:

> "Want me to generate a component brief for this? I'll place it in the **Components** card frame."

If the user accepts, invoke the `component-brief` skill with the newly created component name. When generating the Figma output, place the created component instance inside **Card 2 ("Components")** of the brief.

## Step 8 — Update references

After the component is created and published, remind the user to run `/sync-design-system` to update local reference files from Figma.
