# Meta Kit — Architecture & Component Specifications

A single-source-of-truth component system for AI-generated design system output. Covers architectural decisions, component specifications, builder functions, and implementation roadmap.

**Date:** 2026-03-26
**Author:** Claude (architectural research for Vincent Olivari)
**Status:** Active reference

---

# Part 1: Architecture

The following sections cover the core architectural decisions: variable-first design, quality tiers, compound components, the living specification pattern, and the self-reinforcing loop.

---

## 0. The Core Tensions — and How This Document Resolves Them

The original Meta Kit proposal (18 components + 8 builders) solved the consistency problem but introduced new tensions. This refined version addresses each one explicitly.

| Tension | Problem | Resolution |
|---------|---------|------------|
| **Single source of truth vs speed** | Reading reference files and importing components adds latency per `use_figma` call | **Variable binding** eliminates token lookup tables entirely; **compound components** reduce import count from ~8 per card to ~2 |
| **Consistency vs creativity** | Rigid templates prevent creative adaptation for unusual components or novel presentations | **Quality tiers** — Draft tier skips components for speed; Standard tier uses full Meta Kit; Production tier adds verification. The system bends without breaking |
| **Quality vs fast results** | Thorough output (all 9 cards, variant matrices, contrast tables) takes 5-8 `use_figma` calls per card | **Compound components** bundle common element groups. A Brief Card arrives with its divider, section header style, and content slot pre-configured. One import replaces three |
| **Ideation vs consistency** | Exploring new patterns (e.g., a comparison layout, a decision matrix) should not require new Meta Kit components | **Builder functions are the creativity layer.** Components enforce the chrome; builders compose freely within the content slot. New content patterns need zero Meta Kit changes |

---

## 1. The Variable-First Architecture

### Why This Changes Everything

The previous design assumed: Figma variables for library instances, hex values for scaffolding. This created two tiers of color fidelity — imported components responded to theme changes, but generated frames did not.

The Figma Plugin API now supports binding variables to **every scaffolding element** Claude generates.

**What is bindable via `setBoundVariable`:**
- `width`, `height`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`
- `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`
- `itemSpacing`, `counterAxisSpacing`
- `topLeftRadius`, `topRightRadius`, `bottomLeftRadius`, `bottomRightRadius`
- `strokeWeight`, `strokeTopWeight`, `strokeRightWeight`, `strokeBottomWeight`, `strokeLeftWeight`
- `opacity`, `visible`
- `characters` (text content)

**What is bindable via `setBoundVariableForPaint`:**
- Solid fills on any node (frames, rectangles, text nodes)
- Stroke paints on any node

**What is bindable via `setBoundVariableForEffect`:**
- Shadow effects (x, y, blur, spread, color)

**What is NOT directly bindable:**
- Gradient stops (no `setBoundVariableForPaint` equivalent for gradients)
- Font family, font size, font weight (these are not in `VariableBindableNodeField` — typography variables exist but are bound differently via text style references)

Sources: [Working with Variables | Plugin API](https://www.figma.com/plugin-docs/working-with-variables/), [setBoundVariable | Plugin API](https://www.figma.com/plugin-docs/api/properties/nodes-setboundvariable/), [VariableBindableNodeField | Plugin API](https://www.figma.com/plugin-docs/api/VariableBindableNodeField/), [setBoundVariableForPaint forum discussion](https://forum.figma.com/ask-the-community-7/how-to-use-setboundvariableforpaint-21169)

### The New Token Pipeline

**Old chain (5 hops, error-prone):**
```
Figma variables -> tokens.css -> token-reference.md -> SKILL.md inline tables -> hex in use_figma code
```

**New chain (2 hops, mechanical):**
```
Figma variables -> importVariableByKeyAsync() -> setBoundVariableForPaint() on generated nodes
```

### Implementation Pattern

```js
// ONE-TIME: Import color variables at the start of each use_figma call
const vars = {};
async function importVar(name, key) {
  vars[name] = await figma.variables.importVariableByKeyAsync(key);
}
await importVar('bgDefault', 'VARIABLE_KEY_bg_default');
await importVar('bgGrey2', 'VARIABLE_KEY_bg_grey_2');
await importVar('borderDefault', 'VARIABLE_KEY_border_default');
await importVar('textPrimary', 'VARIABLE_KEY_text_primary');
await importVar('textSecondary', 'VARIABLE_KEY_text_secondary');
// ... ~15-20 variables covers all scaffolding needs

// USAGE: Bind to any generated frame
function bindFill(node, variable) {
  const fills = JSON.parse(JSON.stringify(node.fills));
  fills[0] = figma.variables.setBoundVariableForPaint(
    fills[0], 'color', variable
  );
  node.fills = fills;
}

function bindStroke(node, variable) {
  const strokes = JSON.parse(JSON.stringify(node.strokes));
  strokes[0] = figma.variables.setBoundVariableForPaint(
    strokes[0], 'color', variable
  );
  node.strokes = strokes;
}

// Example: A card frame with variable-bound colors
const card = figma.createFrame();
card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; // placeholder
bindFill(card, vars.bgDefault);  // Now bound to --zen-color-background-bg-default
card.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
bindStroke(card, vars.borderDefault);  // Bound to --zen-color-border-default
```

Source: [importVariableByKeyAsync | Plugin API](https://www.figma.com/plugin-docs/api/properties/figma-variables-importvariablebykeyasync/)

### What This Eliminates

With variable binding on all scaffolding:

1. **Token hex tables are REMOVED from SKILL.md files.** Skills no longer need inline FM Token Reference or DS2026 Token Reference sections. The variable keys come from `meta-kit-variables.md` instead.
2. **`hexToRgb()` helper is no longer needed.** A placeholder RGB is still set (variables need an initial paint), but the visual output comes from the bound variable.
3. **Theme switching works on ALL generated output.** When the user switches the Figma file's theme mode (Actian/Studio/Explorer), every generated frame, text node, and stroke updates automatically — not just library instances.
4. **Token value changes propagate automatically.** If the design team changes `--zen-color-theme-primary` from `#0550DC` to something else, all previously generated output updates.

### The Variable Key Catalog

A new reference file: `docs/meta-kit-variables.md`

```markdown
# Meta Kit Variable Keys

Variables imported from the Actian Design System 2026 library.
Use with `figma.variables.importVariableByKeyAsync(key)`.

## Color Variables (Scaffolding)

| Variable | Key | Default (Actian) | Purpose |
|----------|-----|-------------------|---------|
| background-bg-default | `KEY_HERE` | #FFFFFF | Card backgrounds, content areas |
| background-bg-grey-1 | `KEY_HERE` | #FBFBFF | Subtle backgrounds |
| background-bg-grey-2 | `KEY_HERE` | #F5F5FA | Table headers, section backgrounds |
| border-default | `KEY_HERE` | #E4E4F0 | Card borders, dividers |
| text-primary | `KEY_HERE` | #000000 | Headings, primary content |
| text-secondary | `KEY_HERE` | #3F3F4A | Body text, subtitles |
| text-tertiary | `KEY_HERE` | #595968 | Muted labels |
| theme-primary | `KEY_HERE` | #0550DC | Brand accents, links |
| status-success-primary | `KEY_HERE` | #047800 | Pass badges, success |
| status-error-primary | `KEY_HERE` | #C10C0D | Error indicators |
...
```

This file is populated once by reading variable keys from the Figma REST API or plugin inspector. Keys are stable across publishes.

### Limitation: FM Kit Scaffolding

FM Kit uses a flat palette (`--fm-base-*`) that exists as Figma variables in the Page Mockups file. If those variables are published as a library, the same `importVariableByKeyAsync` pattern works for FM scaffolding too. If not, FM scaffolding falls back to hex (acceptable since FM is lo-fi and does not have theme switching).

### Limitation: Gradient Fills

Presentation slide covers and section dividers use linear gradients (`#090952` to `#1414B8`). Gradient stops cannot be bound to variables. For these specific elements, keep hex values. This affects only 3 of the 5 slide types and the geometric overlay — a small surface area. Wrap them in Meta Kit components where the gradient is baked into the component (no variable binding needed on the consumer side).

Source: [Binding variables to gradient stops | Forum](https://forum.figma.com/ask-the-community-7/binding-variables-to-gradient-stops-10963)

---

## 2. Quality Tiers — Speed vs Fidelity as a Dial

### The Insight

Not every generation needs maximum fidelity. A quick exploration should not take the same time as a production spec page. But both should be *consistent* — the difference should be *completeness*, not *correctness*.

### Tier Definitions

| Tier | Trigger | What Changes | What Stays Constant |
|------|---------|--------------|---------------------|
| **Draft** | User says "quick", "rough", "sketch", "draft" | Fewer sections per card, no variant matrices, no contrast tables, simplified tables (3-5 rows max), no typography specimens | Card chrome, token colors, font hierarchy, generation log, layer naming |
| **Standard** | Default — no qualifier | Full Meta Kit components, all sections, proper token tables, component instances for states | Everything |
| **Production** | User says "production", "final", "publish-ready", or it is a re-generation after review feedback | Standard + variable binding on all scaffolding + golden reference comparison + typography specimens + WCAG contrast verification table | Everything |

### How Tiers Affect Each Skill

**component-brief:**

| Card | Draft | Standard | Production |
|------|-------|----------|------------|
| 1. Page Header | Title + 1 paragraph | Full | Full + Actian Pyramid verified |
| 2. Actual Component | 1 default instance | Variant matrix (types x states) | Matrix + theme comparison row |
| 3. Anatomy | Structure only (lettered parts) | Structure + Specs + States + Parts table | All + pink dimension annotations verified against Figma source |
| 4. Design Tokens | Top 5 tokens (table) | Full color + sizing + typography tables | Full + live swatches bound to variables |
| 5. Component API | Property table only | Full property + event tables | Full + code examples |
| 6. Usage | 3 bullet guidelines | Full do/don't pairs | Full + cross-component comparison |
| 7. Content | Skip | Full do/don't pairs | Full + voice tone examples |
| 8. Accessibility | Skip | Full cards + contrast table | Full + ARIA code blocks + keyboard matrix |
| 9. Code | Skip | CSS code block | CSS + HTML + ARIA code blocks |

**generate-flow:**

| Aspect | Draft | Standard | Production |
|--------|-------|----------|------------|
| Screens | Core happy path only (3-5 screens) | Happy path + error states + empty states | All paths + loading states + edge cases |
| Components | FM library instances, minimal overrides | Full text overrides, contextual labels | Full + form validation states + focus indicators |
| Research | Skip | Full competitor research | Research + pattern documentation |

**generate-presentation:**

| Aspect | Draft | Standard | Production |
|--------|-------|----------|------------|
| Slide count | 5-8 slides | 8-15 slides | 8-20 slides with speaker notes |
| Charts | Stat cards only | Full chart selection | Charts + data source annotations |
| Review | Skip review report | Full review report | Review + slide-by-slide quality check |

### How Skills Detect the Tier

Parse the user's prompt for tier signals. Add to each SKILL.md:

```markdown
### Quality tier detection

| Signal | Tier |
|--------|------|
| "quick", "rough", "draft", "sketch", "fast" | Draft |
| No qualifier (default) | Standard |
| "production", "final", "publish", "polish", "full" | Production |
| Re-generation after user feedback | Production (auto-upgrade) |
```

### Why This Resolves the Tension

- **Draft tier** is 2-3x faster than Standard because it skips expensive sections (variant matrices, contrast tables, typography specimens). But the sections it *does* include use the same Meta Kit components — so the chrome is still pixel-perfect.
- **Production tier** adds verification steps that would slow down exploration but are essential for final deliverables.
- The user controls the dial. Default is Standard — good enough for most work. Users explicitly opt into Draft (for speed) or Production (for polish).

---

## 3. Compound Components — Fewer Imports, Guaranteed Internal Consistency

### The Problem with 18 Individual Components

The original proposal had 18 components. Building a single brief card required importing:
1. Brief Card (chrome)
2. Card Divider (between sections)
3. Section headers (text styles)
4. Various content components

That is 4+ imports just for the shell, before any content. Each import is an async `getComponentByKeyAsync` call.

### The Compound Component Strategy

Group frequently co-occurring components into compounds:

**Compound 1: Meta / Chrome / Brief Card** (absorbs Card Divider + section header style)

The Brief Card component now internally contains:
- The card chrome (header + content area)
- A pre-configured divider component between sections (hidden by default, toggled via boolean property)
- Section title text style defined within the component

When Claude imports a Brief Card, the divider is already there. No separate import needed. Claude toggles `showDivider` booleans as sections are added.

**Compound 2: Meta / Chrome / Slide Frame** (absorbs Geometric Overlay + Actian Pyramid)

The Cover and Back Cover slide variants already contain:
- The gradient background
- The geometric overlay pattern
- The Actian Pyramid logo in the correct position

Claude imports one component and sets text. Zero overlay construction.

**Compound 3: Meta / Chrome / Flow Screen** (absorbs FM App_header + FM Side navigation bar composition)

Already proposed in the original doc but confirmed as a compound: the Flow Screen arrives with header and sidebar composed. Claude only fills the content area.

### Nested Library Instances: The Caveat

Figma supports nested instances of published library components inside other published library components. The Flow Screen can contain FM App_header and FM Side navigation bar instances that remain linked to the FM Kit library.

**However**, there is a known issue: hidden nested components (prefixed with `.` or `_`) can lose their connection after library updates. The workaround is to **publish all nested components visibly** but organize them in a clearly labeled section (e.g., an "Internal / Do Not Use" page with a dark section background as a visual deterrent).

Source: [Component architecture in Figma | Best Practices](https://www.figma.com/best-practices/component-architecture/), [Forum: nested components breaking](https://forum.figma.com/ask-the-community-7/using-published-components-as-library-nested-components-hidden-from-publishing-breaks-8832)

For the Meta Kit, this means:
- The Card Divider, Actian Pyramid, and Geometric Overlay should still be published as standalone components (for direct use in edge cases)
- They are *also* nested inside compound components
- Both the standalone and nested versions stay linked

### Revised Component Count

| Category | Components | Notes |
|----------|-----------|-------|
| **Chrome** (compound) | 6 | Generation Log, Brief Card, Slide Frame, Flow Cover, Flow Screen, Research Frame |
| **Content** (atomic) | 8 | Code Block, Do-Don't Pair, Accessibility Card, Color Swatch, Contrast Badge, Pointer Badge, Dimension Annotation, Stat Card |
| **Utility** (atomic, also nested in compounds) | 4 | Card Divider, Actian Pyramid, Geometric Overlay, Theme Card |
| **Total** | **18** | Same count, but 6 are compound — reducing the average import count per output |

The count stays at 18, but the *effective import count* per skill output drops because compound components bundle their internals.

### The Import Reduction

| Skill | Before (avg imports per output) | After (with compounds) |
|-------|------|------|
| component-brief (9 cards) | ~40-50 | ~20-25 |
| generate-flow (8 screens) | ~25-30 | ~12-15 |
| generate-presentation (12 slides) | ~15-20 | ~12-15 |
| create-component | ~3 | ~2 |

---

## 4. The Living Specification — Components as Specs

### The Idea

Traditional flow: write a specification document -> interpret the spec -> implement to match the spec. This creates an "interpretation gap" where the implementation drifts from the spec.

What if the Meta Kit components *are* the specification? Not a separate document that describes how cards should look — the component itself defines:
- The Brief Card's padding IS the padding spec (48px)
- The Code Block's font IS the code font spec (Fira Code 13px)
- The Generation Log's field order IS the metadata spec
- The Do-Don't Pair's green/red colors ARE the do/don't color spec

### How This Works in Practice

**Before (document-driven):**
1. `figma-output.md` says "card padding should be 48px"
2. Each skill file repeats "padding: 48px"
3. Claude reads the skill file and writes `frame.paddingTop = 48`
4. If someone updates `figma-output.md` to 40px but forgets a skill file, inconsistency

**After (component-driven):**
1. The Brief Card component has 48px padding (set in Figma)
2. Claude imports the component: `const card = briefCardComponent.createInstance()`
3. The padding is 48px because that is what the component defines
4. If the design team changes the component to 40px padding, all future imports get 40px
5. Previously generated output in Figma also updates (because instances are linked to the source component)

### What This Eliminates

The following prose specifications become unnecessary because the component embodies them:

| Spec that was in... | Component that replaces it |
|---------------------|---------------------------|
| `figma-output.md` "Generation metadata frame" section | Meta / Chrome / Generation Log |
| `component-brief/SKILL.md` "Card structure" section (widths, padding, colors) | Meta / Chrome / Brief Card |
| `generate-presentation/SKILL.md` slide template HTML patterns | Meta / Chrome / Slide Frame |
| `generate-flow/SKILL.md` screen dimensions and structure | Meta / Chrome / Flow Screen |
| `fm-css-reference.md` generation card styles | Meta / Chrome / Generation Log (FM variant) |

### What Remains as Prose

Not everything can be a component:
- **Behavioral rules** ("one `use_figma` call per logical unit") — this is process, not visual
- **Content guidelines** ("button labels use action verbs") — this is about text content, not layout
- **Quality tiers** — this is about what to include, not how it looks
- **Builder function logic** — this is code, not a visual component

The rule: **if it is visual, it is a component. If it is behavioral or procedural, it stays as prose.**

### The Spec-as-Component Reference

Replace the card structure sections in each SKILL.md with:

```markdown
### Card structure

Card shells are defined by Meta Kit components — do not construct them inline.
Import `Meta / Chrome / Brief Card` (Mode=DS, Type=Standard) for all spec cards.
The component defines width (1200px), padding (48px), corner radius (16px),
header/content areas, and border styling.

See `../../docs/meta-kit-components.md` for component keys and property names.
```

This is ~4 lines replacing ~30 lines of dimensional specifications.

---

## 5. Skill Composition via Shared Components

### The Pattern

Right now, each skill is monolithic. `component-brief` builds tables, `generate-presentation` builds tables, `generate-flow` builds tables — all with slightly different inline code. The Meta Kit enables composition not by skills calling each other, but by skills importing the same atoms.

| Shared element | Used in component-brief | Used in generate-presentation | Used in generate-flow |
|----------------|------------------------|-------------------------------|----------------------|
| **buildSpecTable** | Card 4 (tokens), Card 5 (API), Card 8 (contrast) | Data slides, comparison slides | -- |
| **Do-Don't Pair** | Card 7 | Best practices slides | -- |
| **Code Block** | Card 9 | Code example slides | -- |
| **Stat Card** | -- | Metric slides | -- |
| **Color Swatch** | Card 4 | Design token slides | -- |
| **Generation Log** | Every output | Every output | Every output |
| **Brief Card chrome** | Every card | -- | -- |
| **Slide Frame** | -- | Every slide | -- |

### What Composition Enables

1. **A presentation about a component brief** can reuse the exact same token table, do/don't pair, and code block components that the brief itself uses. The presentation shows the brief content *in* a slide frame — same visual atoms, different chrome.

2. **A flow that includes inline documentation** (e.g., an onboarding wizard that explains a component) can embed the same Pointer Badge and Dimension Annotation components used in anatomical diagrams.

3. **A component brief that references a flow** can embed a screenshot of the approved flow alongside the usage guidelines — and the flow's screens use the same FM Kit components that the brief's Card 2 variant matrix uses.

### The Builder Function Library

All builder functions move to a single reference file: `references/meta-kit-builders.md`

Each skill file replaces its inline builder code with:

```markdown
> **Builder functions:** Import from `../../references/meta-kit-builders.md`.
> Available: buildSpecTable, buildVariantMatrix, buildStateGrid,
> buildBarChart, buildDonutChart, buildTimeline, buildSyntaxHighlightedText,
> buildFormContainer.
```

The builders are shared source code. When a table style changes, it changes once in the builder file and all skills inherit the change.

---

## 6. Industry Context: How Others Handle This Problem

### What Exists Today

The concept of a "design system for design system documentation" is emerging but not yet standard:

- **Supernova** syncs Figma components and generates documentation pages automatically, but the documentation format is web-based (HTML/CSS), not Figma-native. It solves the "documentation drift" problem but does not produce Figma output.
- **Zeroheight** displays Figma variants and component properties in documentation pages, pulling live from the Figma source. Again, web-based output.
- **Figma's Design System Documentation plugin** (by David Vera) creates documentation directly in Figma using library styles and components — the closest analog to Meta Kit. It generates documentation frames within Figma files.
- **The Design System Documentation Kit** (Figma Community file) is a plug-and-play kit with responsive documentation components — exactly what Meta Kit is, but generic and not AI-driven.

Sources: [Supernova: Figma components](https://learn.supernova.io/latest/design-systems/components/figma-components-AHsSMFps-AHsSMFps), [Zeroheight: Figma variants](https://help.zeroheight.com/hc/en-us/articles/35886908929051), [Design System Documentation Kit | Figma Community](https://www.figma.com/community/file/1089375890509182511/design-system-documentation-kit)

### What Meta Kit Does Differently

| Feature | Supernova/Zeroheight | Community Doc Kits | Meta Kit |
|---------|---------------------|-------------------|----------|
| Output format | Web (HTML) | Figma (manual) | Figma (AI-generated via Plugin API) |
| Theme switching | N/A (web) | Manual | Automatic (variable binding) |
| Content generation | Manual | Manual | AI-generated (Claude) |
| Cross-skill sharing | N/A | N/A | Same atoms across briefs, flows, presentations |
| Self-reinforcing | No | No | Yes (golden references, pattern codification) |

### Schema 2025 Implications

At Figma's Schema 2025 conference, two announcements are directly relevant:
1. **Design system extensions** — a whitelabeled design system that designers can extend with their own themes while inheriting updates from the parent system. This validates the Meta Kit's approach: a base layer (Meta Kit) that inherits from the DS2026 variables.
2. **Slots** — the ability to add custom layers within instances and specify which instances a slot accepts. This would make the Brief Card's "content slot" a first-class Figma feature rather than an auto-layout child.
3. **Performance** — variable operations are now 30-60% faster, heavy state swaps from 3500ms to 350ms. This reduces concerns about variable binding overhead.

Source: [Schema 2025: Design Systems For A New Era | Figma Blog](https://www.figma.com/blog/schema-2025-design-systems-recap/)

---

## 7. Naming, Organization, and the Minimum Viable Kit

### Naming Decision

Keep **"Meta Kit"**. Alternatives considered:

| Name | Rejected because |
|------|-----------------|
| "Doc Kit" | Too narrow — it also covers flows and presentations |
| "Output Kit" | Too generic — does not convey the meta/self-referential nature |
| "Spec Kit" | Conflates with the design system spec itself |
| "Actian Doc Kit" | Unnecessarily brand-prefixed for an internal tool |

"Meta Kit" accurately conveys that this is a design system *for* design system output — a layer above the DS2026 and FM Kit libraries.

### Component Organization

Organize by **frequency of use**, not by element type. This helps when browsing the Figma assets panel:

```
Meta Kit (Figma file)
  |-- Page: Core (used by every skill)
  |     Generation Log
  |     Card Divider
  |     Actian Pyramid
  |
  |-- Page: Brief Components (used by component-brief)
  |     Brief Card (DS Standard, DS Page Header, FM Standard, FM Page Header)
  |     Code Block
  |     Do-Don't Pair
  |     Accessibility Card
  |     Color Swatch
  |     Contrast Badge
  |     Pointer Badge
  |     Dimension Annotation
  |     Theme Card
  |
  |-- Page: Presentation Components (used by generate-presentation)
  |     Slide Frame (Cover, Body Full, Body Text+Visual, Section, Back Cover)
  |     Geometric Overlay
  |     Stat Card
  |
  |-- Page: Flow Components (used by generate-flow)
  |     Flow Cover Card
  |     Flow Screen
  |     Research Frame
  |
  |-- Page: Examples
  |     Assembled examples showing full outputs
```

### Minimum Viable Kit (Phase 1 — 80% of the value)

The Pareto analysis: **6 components + 2 builders** deliver 80% of the consistency value.

| # | Component | Why it is in the MVP |
|---|-----------|---------------------|
| 1 | **Generation Log** | Used by every skill, every output. Currently 30-50 lines of inline JS per invocation. |
| 2 | **Brief Card (DS + FM)** | Used 8-9 times per component-brief — the most frequently invoked skill. |
| 3 | **Card Divider** | Used dozens of times per brief, trivial to build. |
| 4 | **Code Block** | Used by component-brief Card 9 and presentations. Complex inline construction. |
| 5 | **Do-Don't Pair** | Used by Cards 6-7 and presentations. Distinctive visual that is easy to get wrong. |
| 6 | **Flow Screen** | Used by every generate-flow screen. Ensures header/sidebar consistency. |

| # | Builder | Why it is in the MVP |
|---|---------|---------------------|
| 1 | **buildSpecTable** | Used 6+ times per brief, in every presentation with data. The most complex repeated pattern. |
| 2 | **buildStateGrid** | Used in Card 3 (Anatomy). Variable columns make it unsuitable as a component. |

**What can wait:**
- Slide Frame (Phase 2) — presentations are less frequent than briefs
- Stat Card, charts, timeline builders (Phase 2) — presentation-specific
- Pointer Badge, Dimension Annotation, Color Swatch, Contrast Badge (Phase 2) — brief-specific refinements that are small and simple inline
- Accessibility Card, Theme Card (Phase 2) — used only in specific cards
- Research Frame (Phase 3) — rarely used (optional in generate-flow)
- Geometric Overlay, Actian Pyramid (Phase 3) — already embedded in compounds

### What the MVP Unlocks

After the 6 + 2 MVP:
- `component-brief` cards drop from ~100 lines to ~40 lines each
- `generate-flow` screens drop from ~40 lines to ~10 lines each
- Card chrome is guaranteed identical across all briefs
- Screen scaffolding is guaranteed identical across all flows
- The Generation Log is pixel-perfect in every output, every time

---

## 8. The Self-Reinforcing Loop (Refined)

### From the Previous Iteration

The original loop: approved outputs become golden references, which improve future outputs. This is sound but needs concrete mechanics.

### Refined Mechanics

**Layer 1: Component-as-Spec (automatic, zero effort)**

Every Meta Kit component IS the spec. When you import a Brief Card, the padding, typography, colors, and corner radius are the spec — mechanically enforced. No drift possible. This is the foundation layer that runs without any human action.

**Layer 2: Variable Binding (automatic, zero effort)**

All generated scaffolding is bound to Figma variables. When the design team updates a token value, all previously generated output updates. This eliminates the "stale output" problem where old briefs show outdated colors.

**Layer 3: Golden References (curated, low effort)**

After a user approves an output, it can be marked as a golden reference. Store golden reference Figma node IDs in `references/golden-references.md`:

```markdown
# Golden References

## Component Briefs
| Component | Node ID | File Key | Date Approved |
|-----------|---------|----------|---------------|
| Button | 1234:5678 | l8biHx... | 2026-03-20 |
| DatePicker | 2345:6789 | l8biHx... | 2026-03-25 |

## Flows
| Feature | Node ID | File Key | Date Approved |
|---------|---------|----------|---------------|
| Data Product Creation | 3456:7890 | X2JSEUy... | 2026-03-22 |
```

During Production tier generation, Claude takes a `get_screenshot` of the golden reference and compares it visually with the new output.

**Layer 4: Pattern Codification (curated, medium effort)**

Approved flows generate pattern documentation. This is the only layer requiring human curation — but it compounds value over time.

### The Loop Diagram (Refined)

```
                         Meta Kit Components
                        (Layer 1: living spec)
                               |
                    defines    |   imports
                               v
+----------+      +-----------+-----------+      +----------+
|  User    | ---> |  Claude + Variable    | ---> |  Output  |
|  Prompt  |      |  Binding (Layer 2)    |      |  (Figma) |
+----------+      +-----------+-----------+      +----+-----+
                        ^                              |
                        |                              | user approves
            +-----------+-------------+                |
            |                         |                v
     Golden References         Pattern Docs     Approved Output
     (Layer 3: visual QA)     (Layer 4: reuse)  (stays in Figma,
                                                  variable-bound,
                                                  auto-updates)
```

The key insight: Layers 1 and 2 are **automatic and effortless**. They provide the majority of the consistency value. Layers 3 and 4 are **curated and compound** — they add value over time but are not required for the system to work.

---

## 9. Practical Concerns and Edge Cases

### Edge Case: FM Kit Has No Published Variables

If the FM Kit (Page Mockups file) does not publish its `--fm-*` color variables as a library, the variable-binding pattern will not work for FM scaffolding. Two options:

1. **Publish FM variables.** This is the right long-term answer. The FM Kit file should publish its variable collection.
2. **Fall back to hex for FM.** FM scaffolding uses hex values as today. This is acceptable because FM is lo-fi wireframes with no theme switching. The consistency cost is low.

Recommendation: Start with option 2 (ship faster), add option 1 when the FM Kit is ready.

### Edge Case: Variable Keys Change After Publish

Figma variable keys are stable across publishes — they are generated once when the variable is created and do not change. If a variable is deleted and re-created, it gets a new key. This is rare and would be caught by the import failing (the `importVariableByKeyAsync` promise rejects).

The `meta-kit-variables.md` catalog should note when it was last verified. A quarterly check is sufficient.

### Edge Case: Component Properties API Limitations

Setting text properties on component instances via `setProperties()` requires knowing the exact property key, which can be verbose (e.g., `"Title#1234:5"` not just `"Title"`). The pattern:

```js
const instance = component.createInstance();
const props = instance.componentProperties;
const titleKey = Object.keys(props).find(k => k.startsWith('Title'));
if (titleKey) instance.setProperties({ [titleKey]: 'Anatomy' });
```

This adds ~3 lines per property. For compound components with 5+ properties, this adds up. The builder reference should include helper functions:

```js
// In meta-kit-builders.md
function setProp(instance, prefix, value) {
  const key = Object.keys(instance.componentProperties)
    .find(k => k.startsWith(prefix));
  if (key) instance.setProperties({ [key]: value });
}
```

### Edge Case: 20KB Code Limit Per `use_figma` Call

With variable imports at the top of each call (~20 lines for the import block), the effective code space is slightly reduced. However, variable imports are lightweight (just `await` calls). The real space savings come from compound component imports replacing 50+ lines of inline frame construction.

Net effect: code per `use_figma` call decreases with Meta Kit, not increases.

### Edge Case: Performance of Variable Binding

Figma's 2025 design systems rewrite delivered 30-60% performance improvements for variable operations. There is no evidence that `setBoundVariableForPaint` is slower than direct hex assignment. The additional async call for `importVariableByKeyAsync` adds latency (~50-100ms per variable), but this is a one-time cost at the start of each `use_figma` block, not per-node.

For a typical brief card with ~15 scaffolding nodes, the total additional time is:
- Variable imports: ~200ms (one-time, ~15 variables)
- Per-node binding: negligible (synchronous after import)
- Total overhead: ~200ms — invisible to the user

Source: [Schema 2025 performance improvements](https://www.figma.com/blog/schema-2025-design-systems-recap/)

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goal:** Ship the MVP (6 components + 2 builders + variable catalog) and update `component-brief` to use it.

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Create Meta Kit Figma file, set up pages | Empty file with page structure |
| 1 | Build Generation Log component | Published component with key |
| 1 | Build Card Divider component | Published component with key |
| 2 | Build Brief Card component (4 variants: DS Standard, DS Page Header, FM Standard, FM Page Header) | Published component set with keys |
| 2 | Build Code Block component | Published component with key |
| 3 | Build Do-Don't Pair component (2 variants: DS, FM) | Published component set with key |
| 3 | Build Flow Screen component (2 variants: Standard, Compact) | Published component set with key |
| 3 | Publish the Meta Kit library | Library available for import |
| 4 | Extract variable keys from DS2026 library, create `meta-kit-variables.md` | Variable key catalog |
| 4 | Create `meta-kit-components.md` (component key catalog) | Component key catalog |
| 4 | Write `buildSpecTable` and `buildStateGrid` in `meta-kit-builders.md` | Builder function library |
| 5 | Update `component-brief/SKILL.md` to use Meta Kit imports | Skill file updated |
| 5 | Update `figma-output.md` with variable binding pattern | Reference file updated |
| 5 | Test: generate a component brief with the new system | Validated output |

**Success criteria:** A component brief generated with Meta Kit is visually identical to one generated with the old inline approach, but the `use_figma` code is ~50% shorter.

### Phase 2: Full Brief + Flow + Presentation Coverage (Week 2-3)

| Task | Deliverable |
|------|-------------|
| Build remaining Brief components: Pointer Badge, Dimension Annotation, Color Swatch, Contrast Badge, Accessibility Card, Theme Card | 6 published components |
| Build Actian Pyramid (nested in Brief Card Page Header variant) | Published component |
| Build Slide Frame (5 variants) with nested Geometric Overlay and Actian Pyramid | Published component set |
| Build Stat Card, Flow Cover Card, Research Frame | 3 published components |
| Write `buildVariantMatrix`, `buildBarChart`, `buildDonutChart`, `buildTimeline` builders | Builder functions |
| Update all 4 SKILL.md files to use Meta Kit imports | Skill files updated |
| Add quality tier detection to all skills | Tier parsing in skill files |
| Test: generate a full 9-card brief, an 8-screen flow, a 12-slide presentation | Validated outputs |

**Success criteria:** All 4 skills use Meta Kit. No inline frame construction for chrome or scaffolding. Quality tiers produce correctly scoped output.

### Phase 3: Self-Reinforcing Loop (Week 4)

| Task | Deliverable |
|------|-------------|
| Create "Golden References" page in Meta Kit file with approved examples | Reference page |
| Create `references/golden-references.md` with node IDs | Node ID catalog |
| Add Production tier verification step to all skills | Comparison logic |
| Create first pattern docs from approved flows | Pattern library start |
| Add Meta Kit sync target to `sync-from-upstream.sh` | Automated sync |

**Success criteria:** The Production tier generates output, screenshots a golden reference, and reports discrepancies. Pattern docs exist for at least 2 flow types.

---

## 11. File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `docs/meta-kit-components.md` | Component name, key, node ID, variant axes, properties |
| `docs/meta-kit-variables.md` | Variable name, key, default value, purpose |
| `references/meta-kit-builders.md` | Full JS source for all builder functions |
| `references/golden-references.md` | Approved output node IDs for comparison |

### Modified Files

| File | Change |
|------|--------|
| `references/figma-output.md` | Add variable binding pattern; add Meta Kit import pattern; deprecate inline `hexToRgb` for variable-bound nodes |
| `skills/component-brief/SKILL.md` | Replace card structure specs with Meta Kit component references; add quality tier detection; remove inline token tables |
| `skills/generate-flow/SKILL.md` | Replace screen scaffolding specs with Meta Kit references; add quality tier detection; remove inline FM token table |
| `skills/generate-presentation/SKILL.md` | Replace slide structure specs with Meta Kit references; add quality tier detection |
| `skills/create-component/SKILL.md` | Add Generation Log import; add brief-to-component pipeline |
| `CLAUDE.md` | Add Meta Kit section; reference variable catalog; keep token reference for non-Meta Kit use cases (HTML generation, CSS) |

### Removed (after Phase 1 is validated)

| Content | Where | Why |
|---------|-------|-----|
| FM Token Reference table | `generate-flow/SKILL.md` | Replaced by variable binding or component import |
| DS2026 Token Reference table | `create-component/SKILL.md` | Replaced by variable binding |
| Card structure dimensional specs | `component-brief/SKILL.md` | Replaced by component-as-spec |
| Inline `hexToRgb` requirement | `figma-output.md` | Still available for edge cases but no longer mandatory |
| Generation metadata code pattern | `figma-output.md` | Replaced by Generation Log component import |

**Note:** Token reference files (`docs/token-reference.md`, `tokens/tokens.css`) remain for HTML generation and CSS — they are still needed when skills produce browser-preview HTML. The elimination applies only to `use_figma` code paths.

---

## 12. How This Addresses the Original Request

> "Think creatively and outside of the box to ensure single(s) source of truth, consistency, ideation while maintaining consistency, fast results while maintaining a high quality for all skills."

**Single source of truth:** The Meta Kit components ARE the source of truth. Not a document describing what components should look like — the components themselves. Variable binding extends this to scaffolding. Token hex tables are eliminated from skill files. One source, zero interpretation.

**Consistency:** Mechanical, not aspirational. You cannot generate an inconsistent card because the card chrome comes from a component that enforces its own dimensions. You cannot use the wrong token color because the variable binding uses the actual Figma variable.

**Ideation while maintaining consistency:** Quality tiers. Draft tier lets you explore fast with rough output. The chrome is still consistent (from components), but the content is abbreviated. When you find the right direction, Standard or Production tier fills in the detail. Creativity happens in the content slot; consistency is enforced by the chrome.

**Fast results while maintaining high quality:** Three mechanisms:
1. Compound components reduce import count by ~50%
2. Variable binding eliminates token lookup
3. Draft tier skips expensive sections

Together, a Draft tier brief can be generated in ~60% of the time of the current approach, while a Production tier brief is *higher* quality (with variable binding and golden reference comparison) at roughly the same time cost.

**For all skills:** The same Meta Kit components are shared across all 4 skills. A table in a brief looks identical to a table in a presentation because both use `buildSpecTable` with the same `Meta / Content / Table Cell` components. The Generation Log is identical everywhere because it is the same component. Cross-skill consistency is not a goal to pursue — it is a structural guarantee.

---


---

# Part 2: Component Specifications

The following sections contain detailed specs for all 18 components and 8 builder functions, plus scenario walkthroughs.

---


## 1. Complete Element Inventory

Every visual building block extracted from the 4 skill files, their HTML templates, and the shared references.

### 1A. Structural Chrome (Card Shells)

| Element | Skills | Dimensions | Structure | Proposed Solution |
|---------|--------|------------|-----------|-------------------|
| **DS Brief Card (standard)** | component-brief | 1200px wide, hug height | Fixed chrome: grey header (title + subtitle) + white content area. Content varies. | **Component** with text props for title/subtitle, slot for content |
| **DS Brief Card (page header)** | component-brief | 1200px wide, hug height | White card with 72px title + Actian logo SVG + body paragraphs | **Component** with text props |
| **FM Brief Card (standard)** | component-brief | 820px wide, hug height | Light header + white content area | **Component** with text props |
| **FM Brief Card (dark page header)** | component-brief | 820px wide, min 320px | Dark (#2D3648) card with source label, 48px title, subtitle | **Component** with text props |
| **Presentation Slide (Cover)** | generate-presentation | 1920x1080 fixed | Blue gradient bg, geometric pattern, title/subtitle/date/creators | **Component** with text props + geometric overlay |
| **Presentation Slide (Body Full)** | generate-presentation | 1920x1080 fixed | White bg, 56px title, grey content area (1761x829) | **Component** with text prop for title, slot for content |
| **Presentation Slide (Text+Visual)** | generate-presentation | 1920x1080 fixed | White bg, title, 2-column: text left (549px) + visual right (1155px) | **Component** with text props |
| **Presentation Slide (Section)** | generate-presentation | 1920x1080 fixed | Light gradient, topic + 130px title | **Component** with text props |
| **Presentation Slide (Back Cover)** | generate-presentation | 1920x1080 fixed | Blue gradient, "Thank you", pyramid | **Component** — static with minimal text swap |
| **Flow Cover Card** | generate-flow | ~1440px wide, hug height | Dark (#1A202C) card: feature name, flow name, user role | **Component** with 3 text props |
| **Flow Screen Frame** | generate-flow | 1440x960 or 1440x700 | Standard screen: app header (70px) + sidebar (260px) + content area | **Component** with variant (Standard/Compact) |
| **Generation Log Card** | ALL 4 skills | 280px wide, hug height | Dark (#2D3648) rounded card with 7 metadata fields | **Component** with 6 text props |

### 1B. Content Elements (Inside Cards)

| Element | Skills | Structure | Proposed Solution |
|---------|--------|-----------|-------------------|
| **Spec Table** | component-brief, generate-presentation | Header row (grey bg, 13px bold) + N data rows (14px). Variable columns/rows. | **Hybrid** — component for header row style, builder for row count |
| **Color Swatch (inline)** | component-brief | 12px dot + token code text. Fixed structure, variable color/text. | **Component** with fill + text props |
| **Typography Specimen** | component-brief | Rendered text at documented style + token details alongside | **Builder** — too variable in rendered font size/style |
| **Code Block** | component-brief, generate-presentation | Dark bg (#1E1E2E), rounded, padded, monospace text. Variable content. | **Component** for the shell, builder fills text content |
| **Do/Don't Pair (DS)** | component-brief | Two side-by-side cards: green bar + "Do" / red bar + "Don't". Example content varies. | **Component** with variant (Do/Don't) + text props |
| **Do/Don't Pair (FM)** | component-brief | Similar but with tinted backgrounds (#FAFFF5 / #FFF5F5) | **Component** variant axis for DS/FM mode |
| **Accessibility Card** | component-brief | Card with colored icon square, title, body text, optional code block | **Component** with variant (icon color) + text props + boolean for code block |
| **Contrast Badge** | component-brief | Inline "Pass" (green) or "Exempt" (red-brown) badge | **Component** with variant (Pass/Exempt) |
| **Anatomy Box** | component-brief | Dashed border container with label + pointer badges (A,B,C) + legend | **Hybrid** — component for the chrome, builder places badges |
| **Pointer Badge** | component-brief | 20px circle, dark bg, white letter (A, B, C...) | **Component** with text prop for letter |
| **Dimension Annotation** | component-brief | Pink (#E91E8C) bracket lines with px measurement label | **Component** with text prop for value, variant (horizontal/vertical) |
| **State Grid** | component-brief | Flex row of state columns (label + rendered component). Variable columns. | **Builder** — column count varies per component |
| **Theme Card** | component-brief | Card with theme label, rendered component area, color swatches | **Component** with text prop for theme name, slot for content |
| **Variant Matrix** | component-brief | Table: type rows x state columns with rendered instances | **Builder** — rows and columns both variable |
| **Section Title** | component-brief | Bold 24px text with optional divider above | **Text style** (not a component — just a Figma text style) |
| **Section Subtitle** | component-brief | Bold 18px text | **Text style** |
| **Section Body** | component-brief | Regular 16px, secondary color, max-width fill | **Text style** |
| **Card Divider** | component-brief | 1px horizontal line, #EDF0F7 | **Component** (simple line, fill parent width) |
| **Prop Name/Type/Default** | component-brief | Monospace styled text (Fira Code) in purple/green/black | **Text styles** for each role |
| **Stat Card** | generate-presentation | Large metric number + context label + optional delta indicator | **Component** with text props |
| **Bar Chart Bar** | generate-presentation | Colored rectangle, width = percentage, category token fill | **Builder** — variable bar count |
| **Donut Chart** | generate-presentation | Conic-gradient circle, max 5 segments with legend | **Builder** — variable segment count |
| **Progress Bar** | generate-presentation | Track + fill bar + optional threshold marker | **Component** with numeric prop for % |
| **Timeline** | generate-presentation | Horizontal dot+line sequence with milestone labels | **Builder** — variable milestone count |
| **Before/After Card** | generate-presentation | Two stat cards with arrow between | **Component** composed of 2 stat cards |
| **Research Frame** | generate-flow | Dark card with research findings, same styling as flow cover | **Component** with text props |
| **Screen Label** | generate-flow | 12px #888 text above each screen frame | **Text style** |
| **Form Container** | generate-flow | 480px max-width, left-aligned, vertical auto-layout | **Component** (wrapper with correct constraints) |
| **Action Footer** | generate-flow | Sticky bottom bar, primary right / secondary left | **Component** with instance swap slots for buttons |
| **Geometric Pattern Overlay** | generate-presentation | 3 diagonal semi-transparent shapes on cover/section slides | **Component** with variant (Dark/Light) |

### 1C. Shared Utility Elements

| Element | Skills | Structure | Proposed Solution |
|---------|--------|-----------|-------------------|
| **hexToRgb helper** | ALL (use_figma) | JS utility function | **Builder function** (copied into every use_figma call) |
| **addGenText helper** | ALL (use_figma) | JS function to add text to generation card | **Builder function** |
| **Actian Pyramid Logo** | component-brief, generate-presentation | SVG: blue triangle with white inner + blue core | **Component** (vector node in Figma) |
| **Actian Pyramid (white/transparent)** | generate-presentation | Simplified triangle for slide corners | **Component** variant of the logo |

---

## 2. Meta Kit Component Specs

### Naming Convention

All components follow: `Meta / [Category] / [Name]`

Categories:
- `Chrome` — structural shells (cards, slides, screen frames)
- `Content` — visual elements inside cards (tables, code blocks, badges)
- `Data Viz` — charts and data visualization elements
- `Utility` — helpers (dividers, logos, annotations)

### Component 1: Meta / Chrome / Generation Log

**Replaces:** 30-50 lines of inline JS in every `use_figma` call across all 4 skills.

| Property | Type | Details |
|----------|------|---------|
| Skill | Text | "component-brief", "generate-flow", etc. |
| Prompt | Text | User prompt, truncated to 200 chars |
| Date | Text | ISO 8601 date+time |
| Duration | Text | "2m 34s" |
| Model | Text | "claude-opus-4-6" |
| Plugin Version | Text | "v1.10.0" |

**Size:** 280px wide, height hugs content
**Layout:** Vertical auto-layout, 4px item spacing, 16px/20px padding
**Fill:** `#2D3648` (--fm-base-800)
**Corner radius:** 8px (use_figma spec) / 12px (HTML spec) -- standardize to 12px
**Text:** "GENERATED" label 10px #A0ABC0; field labels 12px #A0ABC0 bold; field values 12px #CBD2E0
**Font:** Inter

### Component 2: Meta / Chrome / Brief Card

**Replaces:** Card shell construction in component-brief (both DS and FM modes).

| Variant Axis | Values |
|-------------|--------|
| Mode | DS, FM |
| Type | Page Header, Standard |

| Property | Type | Details |
|----------|------|---------|
| Title | Text | Card title (e.g., "Anatomy", "Design tokens") |
| Subtitle | Text | Card subtitle/description |
| Component Name | Text | For page header variant only |

**DS Standard:** 1200px wide, grey header (#F5F5FA, 80px padding, 48px/24px titles), white content (80px padding), 16px corner radius
**DS Page Header:** 1200px wide, white, 80px padding, 72px title + Actian logo
**FM Standard:** 820px wide, #F5F5FA header (48px padding, 28px/14px titles), white content (48px padding), 16px corner radius
**FM Page Header:** 820px wide, dark (#2D3648), 48px padding, 48px title

### Component 3: Meta / Chrome / Slide Frame

**Replaces:** Slide frame construction in generate-presentation.

| Variant Axis | Values |
|-------------|--------|
| Type | Cover, Body Full, Body Text+Visual, Section, Back Cover |

| Property | Type | Details |
|----------|------|---------|
| Title | Text | Slide title |
| Subtitle | Text | Subtitle (Cover, Section) |
| Topic | Text | Topic label (Cover, Section) |
| Date | Text | Cover only |
| Creators | Text | Cover only |

**Size:** 1920x1080 fixed for all variants
**Cover/Back Cover fill:** Linear gradient from #090952 to #1414B8
**Section fill:** Linear gradient from #EEEEFD to #CBDAFF
**Body fill:** #FFFFFF
**Font:** Roboto

### Component 4: Meta / Chrome / Flow Cover Card

**Replaces:** Cover card construction in generate-flow.

| Property | Type | Details |
|----------|------|---------|
| Feature | Text | Feature name |
| Flow | Text | "Flow: [Sub-flow name]" |
| User | Text | "User: [Role]" |

**Size:** Width matches screen frames (1440px), height hugs
**Fill:** `#1A202C` (--fm-base-900)
**Font:** Inter
**Corner radius:** 12px

### Component 5: Meta / Chrome / Flow Screen

**Replaces:** Screen frame scaffolding in generate-flow.

| Variant Axis | Values |
|-------------|--------|
| Size | Standard (1440x960), Compact (1440x700) |

Internally composed of:
- FM App_header instance (70px, imported from FM Kit library)
- Horizontal frame containing:
  - FM Side navigation bar instance (260px, imported from FM Kit library)
  - Content area frame (fill remaining, #F5F5FA background)

The component imports real FM Kit library instances for the header and sidebar. The content area is an empty auto-layout frame that Claude fills via `use_figma`.

**Note:** The FM App_header and FM Side navigation bar remain FM Kit library components, not Meta Kit components. The Meta Kit component just composes them.

### Component 6: Meta / Content / Code Block

**Replaces:** Code block construction in component-brief (Card 9) and generate-presentation.

| Property | Type | Details |
|----------|------|---------|
| Show Header | Boolean | Optional filename/language header bar |
| Header Text | Text | e.g., "button.css" or "CSS" |

**Size:** Width fills parent, height hugs content
**Fill:** `#1E1E2E`
**Corner radius:** 12px
**Padding:** 32px all sides
**Font:** Fira Code (component-brief) or Roboto Mono, 13px, line-height 1.7
**Text color:** `#A6ACCD` (base), with syntax highlighting applied by the builder

**Why component + builder:** The shell is always the same (dark bg, rounded, padded). The text content varies wildly (CSS, HTML, ARIA examples, key mappings). Claude imports the component for the shell, then sets the text content via `use_figma` text node manipulation.

### Component 7: Meta / Content / Do-Don't Pair

**Replaces:** Do/Don't construction in component-brief (Cards 6, 7) and generate-presentation.

| Variant Axis | Values |
|-------------|--------|
| Mode | DS, FM |

| Property | Type | Details |
|----------|------|---------|
| Do Label | Text | "Do -- [description]" |
| Don't Label | Text | "Don't -- [description]" |
| Do Example | Text | Good example text |
| Don't Example | Text | Bad example text |

**DS Mode:**
- Bar: 4px height, green (#047800) / red (#C10C0D)
- Label: Inter 13px 600, green/red
- Example: 16px, #FAFAFA bg, 8px radius, 16-20px padding

**FM Mode:**
- Bar: 4px height, green (#22C55E) / red (#EF4444)
- Label: Inter 13px 600, green/red
- Example: 24px padding, green-tint (#FAFFF5) / red-tint (#FFF5F5) bg

### Component 8: Meta / Content / Accessibility Card

**Replaces:** A11y card construction in component-brief (Card 8).

| Variant Axis | Values |
|-------------|--------|
| Icon Color | Red, Blue, Green, Grey, Orange |
| Has Code Block | True, False |

| Property | Type | Details |
|----------|------|---------|
| Title | Text | e.g., "Role & semantics" |
| Body | Text | Plain-text requirement description |
| Code | Text | Code example (shown in dark block when Has Code Block = True) |

**Size:** Fill parent width (in a 2-column grid)
**Fill:** #FAFAFA
**Border:** 1px #E4E4F0, 12px radius
**Padding:** 24px
**Icon:** 36px square, 8px radius, tinted background matching variant

### Component 9: Meta / Content / Color Swatch

**Replaces:** Inline swatch dots in component-brief (Card 4 color token tables).

| Property | Type | Details |
|----------|------|---------|
| Color | Fill | The swatch color (applied to the dot) |
| Token Name | Text | e.g., "theme-primary" |

**Size:** Inline (auto width, 20px height)
**Dot:** 12px square, 3px radius, 1px border rgba(0,0,0,0.08)
**Text:** Fira Code 12px, `#0550DC` (code color)
**Layout:** Horizontal, 4px gap

### Component 10: Meta / Content / Contrast Badge

**Replaces:** Pass/Exempt badges in component-brief (Card 8).

| Variant Axis | Values |
|-------------|--------|
| Status | Pass, Exempt |

**Pass:** Green check + "Pass" text, Inter 12px 600 #047800
**Exempt:** "Exempt" text, Inter 12px 600 #9C2000

### Component 11: Meta / Content / Pointer Badge

**Replaces:** Lettered anatomy callout badges in component-brief (Card 3).

| Property | Type | Details |
|----------|------|---------|
| Letter | Text | A, B, C, D, etc. |

**Size:** 20px circle
**Fill:** `#1A1A1A`
**Text:** White, Inter 11px 500, centered

### Component 12: Meta / Content / Dimension Annotation

**Replaces:** Pink measurement brackets in component-brief (Card 3 Specs).

| Variant Axis | Values |
|-------------|--------|
| Direction | Horizontal, Vertical |

| Property | Type | Details |
|----------|------|---------|
| Value | Text | e.g., "40px", "16px" |

**Color:** `#E91E8C` (hot pink) for all lines and text
**Line:** 1px stroke
**Text:** Inter 11px 500
**Structure:** Bracket shape (two end caps + connecting line) with centered label

### Component 13: Meta / Content / Theme Card

**Replaces:** Theme comparison cards in component-brief (Card 2).

| Variant Axis | Values |
|-------------|--------|
| Theme | Actian, Studio, Explorer |

| Property | Type | Details |
|----------|------|---------|
| Swatch 1 Label | Text | e.g., "Primary" |
| Swatch 2 Label | Text | e.g., "Selected" |

**Size:** 1/3 parent width (flex: 1)
**Fill:** #FAFAFA
**Border:** 1px #E4E4F0, 12px radius
**Padding:** 24px 32px
**Label:** Inter 13px 600, #3F3F4A, 0.3px letter-spacing

Swatch colors are set dynamically per theme (Actian: #0550DC/#0029A9, Studio: #0283BE/#0079B6, Explorer: #049B98/#00908E).

### Component 14: Meta / Content / Stat Card

**Replaces:** Hero stat numbers in generate-presentation.

| Property | Type | Details |
|----------|------|---------|
| Value | Text | e.g., "40%", "2.3M", "98.5" |
| Label | Text | e.g., "Adoption rate" |
| Context | Text | e.g., "vs. 28% last quarter" |
| Show Delta | Boolean | Show up/down arrow indicator |
| Delta Positive | Boolean | Green (up) vs red (down) |

**Size:** Hug content, min 200px wide
**Fill:** White
**Border:** 1px #E4E4F0, 12px radius
**Value:** Roboto 48px 500 #12131F
**Label:** Roboto 16px 400 #717D96
**Context:** Roboto 14px 400 #475467

### Component 15: Meta / Utility / Card Divider

**Replaces:** `<div class="card-divider">` in every card template.

**Size:** Fill parent width, 1px height
**Fill:** `#EDF0F7`

### Component 16: Meta / Utility / Actian Pyramid

**Replaces:** Inline SVG in page header card and slide frames.

| Variant Axis | Values |
|-------------|--------|
| Style | Color (blue), White, Transparent |

**Size:** 64x60 (card) or 80x68 (slide)
**Structure:** Vector node — three nested triangles

### Component 17: Meta / Utility / Geometric Overlay

**Replaces:** 3-div CSS geometric pattern on presentation slides.

| Variant Axis | Values |
|-------------|--------|
| Background | Dark (white shapes on blue), Light (dark shapes on light) |

**Size:** Fill parent (1920x1080)
**Structure:** 3 rotated rectangles with semi-transparent fills
**Dark:** rgba(255,255,255,0.04/0.06/0.08)
**Light:** rgba(0,0,100,0.03)

### Component 18: Meta / Chrome / Research Frame

**Replaces:** Optional research summary card in generate-flow.

| Property | Type | Details |
|----------|------|---------|
| Title | Text | "Research: [Feature]" |

**Size:** 1440px wide, height hugs
**Fill:** `#1A202C` (--fm-base-900)
**Text:** White (#FFFFFF) headings, #CBD2E0 body, #A0ABC0 dividers
**Font:** Inter (page header title style for headings, 14px body)

---

## 3. Builder Function Specs

These are JS patterns (not Figma components) used in `use_figma` calls when the structure is too dynamic for a component.

### Builder 1: `buildSpecTable(parent, headers, rows, options)`

**What it constructs:** A data table with header row and N data rows.

```
Parameters:
  parent: FrameNode        — parent auto-layout frame to append into
  headers: string[]        — column header labels
  rows: string[][]         — 2D array of cell content
  options: {
    columnWidths?: number[]   — fixed widths per column (default: equal distribution)
    mode?: 'ds' | 'fm'        — DS2026 or FM styling
    showSwatches?: boolean    — render color swatches in cells (for token tables)
    swatchColumns?: number[]  — which columns contain swatch data (hex + name pairs)
  }

Token values used:
  Header bg: #F5F5FA (--zen-color-background-bg-grey-2)
  Header text: #3F3F4A (--zen-color-text-secondary), Inter 13px 600
  Cell text: Inter 14px 400, #2D3648
  Row border: #F0F0F5, 1px
  Cell padding: 12px vertical, 16px horizontal
```

**Pattern:** Creates a vertical auto-layout frame. First child is the header row (horizontal auto-layout, grey fill). Subsequent children are data rows (horizontal auto-layout, bottom border). Each cell is a fixed-width frame containing a text node.

### Builder 2: `buildVariantMatrix(parent, types, states, instanceFactory)`

**What it constructs:** A grid showing component instances across type x state combinations.

```
Parameters:
  parent: FrameNode
  types: string[]              — row labels (e.g., ["Primary", "Secondary", "Tertiary"])
  states: string[]             — column labels (e.g., ["Enabled", "Hovered", "Focused", "Disabled"])
  instanceFactory: (type, state) => InstanceNode  — function that creates the correct instance

Token values used:
  Header bg: #F5F5FA
  Header text: #888888, Inter 11px 600, uppercase, 0.5px letter-spacing
  Row label: Inter 12px 500, #3F3F4A
  Cell padding: 14px vertical, 12px horizontal
  Row border: #F0F0F5, 1px
```

### Builder 3: `buildStateGrid(parent, states)`

**What it constructs:** A horizontal row of state columns, each with a label and content area.

```
Parameters:
  parent: FrameNode
  states: Array<{ label: string, content: FrameNode | InstanceNode }>

Token values used:
  Label: Inter 12px 500, #888888
  Gap between columns: 48px
  Gap between label and content: 10px
```

### Builder 4: `buildBarChart(parent, data, options)`

**What it constructs:** A horizontal bar chart for presentations.

```
Parameters:
  parent: FrameNode
  data: Array<{ label: string, value: number, category?: number }>
  options: {
    maxValue?: number          — scale denominator (default: max of values)
    barHeight?: number         — default 32px
    showValues?: boolean       — show value label at end of bar
    width?: number             — chart width (default: fill parent)
  }

Token values used:
  Bar fills: category-N-strong tokens (#0550DC, #0283BE, #049B98, #E54D2E, #8E4EC6, etc.)
  Label text: Roboto 14px 400, #475467
  Value text: Roboto 14px 500, #12131F
  Axis line: #E4E4F0, 1px
```

### Builder 5: `buildDonutChart(parent, segments, options)`

**What it constructs:** A donut/ring chart with up to 5 segments and a legend.

```
Parameters:
  parent: FrameNode
  segments: Array<{ label: string, value: number, category?: number }>
  options: {
    size?: number              — diameter (default: 200px)
    innerRatio?: number        — hole size ratio (default: 0.6)
    showLegend?: boolean       — show legend alongside (default: true)
  }

Token values used:
  Segment fills: category-N-strong tokens
  Legend text: Roboto 14px 400, #475467
  Center text (total): Roboto 24px 500, #12131F
```

### Builder 6: `buildTimeline(parent, milestones)`

**What it constructs:** A horizontal timeline with dots, connecting lines, and labels.

```
Parameters:
  parent: FrameNode
  milestones: Array<{ label: string, sublabel?: string, status?: 'complete' | 'current' | 'upcoming' }>

Token values used:
  Complete dot: #047800 (--zen-color-status-success-primary)
  Current dot: #0550DC (--zen-color-theme-primary)
  Upcoming dot: #CBD2E0 (--fm-base-400)
  Line: #E2E7F0, 2px
  Label: Roboto 14px 500, #12131F
  Sublabel: Roboto 12px 400, #475467
```

### Builder 7: `buildSyntaxHighlightedText(parent, code, language)`

**What it constructs:** Syntax-highlighted text inside a code block component.

```
Parameters:
  parent: FrameNode          — the Code Block component's text container
  code: string               — raw code string
  language: 'css' | 'html' | 'js' | 'aria'  — determines highlighting rules

Token values used (Catppuccin Mocha palette):
  Base text: #A6ACCD
  Comments: #676E95
  Keywords: #C792EA
  Properties: #82AAFF
  Strings: #C3E88D
  Values: #F78C6C
  Selectors: #FFCB6B
  Tags: #89DDFF
  Punctuation: #89DDFF

Note: Figma text doesn't support per-character coloring in a single text node
without styled ranges. The builder creates separate text nodes per line or
uses setRangeFills() for inline color spans.
```

### Builder 8: `buildFormContainer(parent, options)`

**What it constructs:** A properly constrained form container per the 480px max-width rule.

```
Parameters:
  parent: FrameNode
  options: {
    maxWidth?: number         — default 480px
    alignment?: 'left' | 'center'  — default 'left'
  }

Returns: FrameNode (the container to add form fields into)
```

---

## 4. Scenario Walkthroughs

### Scenario A: "Create a component brief for the DatePicker component"

**Step 1: Research** — Claude reads the DatePicker from DS2026 library, gets screenshot, reads templates.

**Step 2: Build generation log**
```
Import: Meta / Chrome / Generation Log (by component key)
Set text properties: Skill="component-brief", Date=now, etc.
```
One `use_figma` call, ~15 lines instead of ~50.

**Step 3: Build Card 1 (Page Header)**
```
Import: Meta / Chrome / Brief Card (Mode=DS, Type=Page Header)
Set text: Component Name="DatePicker", description paragraphs
```
The Actian Pyramid logo is already nested inside the component. No SVG construction needed.

**Step 4: Build Card 3 (Anatomy)**
```
Import: Meta / Chrome / Brief Card (Mode=DS, Type=Standard)
Set text: Title="Anatomy", Subtitle="Component structure, dimensions..."

Inside the content slot:
  - Section title: "Structure" (text style, not component)
  - Import: Meta / Content / Pointer Badge x N (set Letter=A, B, C...)
  - Position badges over the DatePicker instance (absolute overlay)
  - Anatomy legend: text nodes listing A=Calendar trigger, B=Input field, etc.

  - Import: Meta / Utility / Card Divider

  - Section title: "Specs"
  - Import DatePicker instances at each size
  - Import: Meta / Content / Dimension Annotation (Direction=Vertical, Value="40px")
  - Import: Meta / Content / Dimension Annotation (Direction=Horizontal, Value="12px")
  - Position annotations adjacent to the instances

  - Import: Meta / Utility / Card Divider

  - Section title: "States"
  - Call: buildStateGrid(contentFrame, [
      { label: "Default", content: datePickerDefault },
      { label: "Focused", content: datePickerFocused },
      { label: "Open", content: datePickerOpen },
      { label: "Error", content: datePickerError },
      { label: "Disabled", content: datePickerDisabled }
    ])

  - Import: Meta / Utility / Card Divider

  - Section title: "Parts reference"
  - Call: buildSpecTable(contentFrame,
      ["Part", "Element", "Token", "Notes"],
      [["A", "Input field", "border-default, radius-sm", "Standard text input"],
       ["B", "Calendar trigger", "icon-default, size-md", "16px icon button"],
       ...],
      { columnWidths: [48, 150, 250, 300] }
    )
```

**Step 5: Build Card 4 (Design Tokens)**
```
Import: Meta / Chrome / Brief Card (Mode=DS, Type=Standard)
Set text: Title="Design tokens"

Inside content:
  - Call: buildSpecTable(contentFrame,
      ["Variant . State", "Background", "Text / Icon"],
      rows with swatch data,
      { showSwatches: true, swatchColumns: [1, 2] }
    )
  The builder uses Meta / Content / Color Swatch components for cells
  in the designated swatch columns.

  - Import: Meta / Utility / Card Divider

  - Call: buildSpecTable for sizing/spacing (3 columns, no swatches)

  - Import: Meta / Utility / Card Divider

  - Typography specimen: builder creates a frame with actual rendered text + anatomy props
```

**Step 6: Build Card 7 (Content Guidelines)**
```
Import: Meta / Chrome / Brief Card (Mode=DS, Type=Standard)
Set text: Title="Content guidelines"

Inside content, for each rule:
  - Section title text
  - Section body text
  - Import: Meta / Content / Do-Don't Pair (Mode=DS)
  - Set text: Do Label, Don't Label, Do Example, Don't Example
  - Import: Meta / Utility / Card Divider
```

**Step 7: Build Card 8 (Accessibility)**
```
Import: Meta / Chrome / Brief Card (Mode=DS, Type=Standard)

Inside content:
  - For each requirement:
    Import: Meta / Content / Accessibility Card (Icon Color=Red/Blue/Green/Grey/Orange, Has Code Block=True/False)
    Set text: Title, Body, Code
  - Arrange in 2-column grid (auto-layout wrap)

  - Import: Meta / Utility / Card Divider

  - Call: buildSpecTable for contrast ratios
    Cells include: Meta / Content / Color Swatch + Meta / Content / Contrast Badge
```

**Step 8: Build Card 9 (Code Specification)**
```
Import: Meta / Chrome / Brief Card (Mode=DS, Type=Standard)
Set text: Title="Code specification"

Inside content:
  - Import: Meta / Content / Code Block (Show Header=False)
  - Call: buildSyntaxHighlightedText(codeBlock, cssContent, 'css')
```

**Net result:** Each card is 20-40 lines of `use_figma` code instead of 80-120. The structural chrome is always pixel-perfect because it comes from the component. Only content varies.

### Scenario B: "Generate a flow for the data product creation wizard"

**Step 1: Build generation log**
```
Import: Meta / Chrome / Generation Log
Set properties.
```

**Step 2: Build flow cover card**
```
Import: Meta / Chrome / Flow Cover Card
Set text: Feature="Data Product Creation", Flow="Flow: Happy path", User="User: Data Steward"
```

**Step 3: Build each screen (x8)**
```
For each screen:
  Import: Meta / Chrome / Flow Screen (Size=Standard)
  // This arrives with FM App_header and FM Side navigation bar already composed

  // Set contextual text on the sidebar and header via component overrides
  // Then fill the content area:
  const contentArea = screen.findOne(n => n.name === "Content Area");

  // Add FM Kit components for the screen content:
  Import FM Page Header, FM Text input field, FM Button, FM Table Cell, etc.
  // Arrange in the content area auto-layout
```

**Step 4: Wrap in horizontal row**
```
const flowRow = figma.createFrame();
flowRow.layoutMode = "HORIZONTAL";
flowRow.itemSpacing = 32;
flowRow.appendChild(genLog);
flowRow.appendChild(coverCard);
screens.forEach(s => flowRow.appendChild(s));
```

**Net result:** Screen scaffolding drops from ~40 lines per screen to ~5 lines (import + set overrides). The header/sidebar structure is guaranteed consistent across all screens.

### Scenario C: "Create a presentation about our Q1 accessibility audit results"

**Step 1: Build generation log** — same as always.

**Step 2: Build Cover slide**
```
Import: Meta / Chrome / Slide Frame (Type=Cover)
Set text: Title="Q1 Accessibility Audit", Subtitle="WCAG 2.1 AA compliance results", Date="March 2026", Creators="Design Systems Team"
// Geometric overlay is nested inside the component already
```

**Step 3: Build Body slides with data**
```
Import: Meta / Chrome / Slide Frame (Type=Body Full)
Set text: Title="Component compliance grew to 94%"

Inside the content area:
  Call: buildBarChart(contentArea, [
    { label: "Forms", value: 98, category: 1 },
    { label: "Navigation", value: 95, category: 2 },
    { label: "Data Display", value: 92, category: 3 },
    { label: "Feedback", value: 88, category: 4 }
  ])
```

**Step 4: Build slides with tables**
```
Import: Meta / Chrome / Slide Frame (Type=Body Full)

Inside content area:
  Call: buildSpecTable(contentArea,
    ["Component", "Contrast", "Keyboard", "Focus", "ARIA", "Status"],
    [...audit rows...],
    { mode: 'ds' }
  )
```

**Step 5: Build slides with do/don't**
```
Import: Meta / Chrome / Slide Frame (Type=Body Text+Visual)
Set text in text column.

In visual column:
  Import: Meta / Content / Do-Don't Pair (Mode=DS)
  Set examples with before/after accessibility improvements.
```

**Key insight:** The same Do-Don't Pair component used in component-brief Card 7 is reused here in the presentation. Same table builder used for Card 4 token tables is reused for the audit data table. **Consistency is mechanical.**

### Scenario D: "Create an FM Alert component with success, error, warning, info variants"

**Step 1: Build generation log**
```
Import: Meta / Chrome / Generation Log
Set: Skill="create-component"
```

**Step 2: Build the component set** — this is create-component specific, uses standard Figma Plugin API to create component sets with variants. The Meta Kit is minimally involved here.

**Step 3: Generation metadata card** — the Generation Log component is the only Meta Kit element needed. The actual component creation uses the FM token reference and standard Figma component creation patterns.

**Net result:** create-component uses only the Generation Log from Meta Kit. Its primary output is the component itself, not documentation frames.

---

## 5. File Organization

### Figma File Structure

```
Figma Project 62158719/
  |-- Actian Design System 2026 (l8biHxfarNi1I2RMvVxVOK)  -- production DS
  |-- Page Mockups (X2JSEUyLvxyNCx22ucOexn)                -- FM Kit
  |-- Meta Kit (NEW FILE)                                   -- this library
       |-- Page: Chrome
       |     Components: Generation Log, Brief Card, Slide Frame,
       |                 Flow Cover Card, Flow Screen, Research Frame
       |-- Page: Content
       |     Components: Code Block, Do-Don't Pair, Accessibility Card,
       |                 Color Swatch, Contrast Badge, Pointer Badge,
       |                 Dimension Annotation, Theme Card, Stat Card
       |-- Page: Data Viz
       |     (No components — data viz is builder-only)
       |-- Page: Utility
       |     Components: Card Divider, Actian Pyramid, Geometric Overlay
       |-- Page: Examples
       |     Assembled examples showing components in context
```

### Plugin Repo Files

```
plugins/actian-design-system/
  |-- docs/
  |     |-- meta-kit-components.md          -- NEW: component catalog (like fm-components.md)
  |     |     Contains: component name, key, node ID, variant axes,
  |     |     text properties, usage notes for every Meta Kit component
  |     |-- meta-kit-design-document.md     -- THIS FILE: architecture reference
  |
  |-- references/
  |     |-- meta-kit-builders.md            -- NEW: builder function library
  |     |     Contains: every builder function with full JS code,
  |     |     parameter docs, token values, usage examples
  |     |-- figma-output.md                 -- UPDATED: add Meta Kit import pattern
  |
  |-- scripts/
  |     |-- sync-from-upstream.sh           -- UPDATED: add Meta Kit sync target
```

### How Component Keys Get Into the Plugin

**Option A (recommended): Sync script**

Extend `sync-from-upstream.sh` to also pull Meta Kit components. The Assembler's `sync-all.js` already reads component keys from Figma. Add a new target:

```bash
# In sync-from-upstream.sh
sync_meta_kit() {
  curl -s "https://raw.githubusercontent.com/volivarii/Actian-DS-Assembler/main/registry/meta-kit-registry.json" \
    -o docs/meta-kit-components.md
}
```

**Option B: Manual catalog**

Since Meta Kit is small (~18 components), maintain `meta-kit-components.md` by hand. After publishing the Figma library, copy each component's key from the Figma REST API response or from Inspect panel.

**Recommendation:** Start with Option B for speed, migrate to Option A when the Assembler supports multiple registries.

### How Skills Reference Meta Kit

Each skill file (SKILL.md) gets a new section:

```markdown
### Meta Kit Components

Import these components from the Meta Kit library instead of building inline:

| Component | Key | Usage |
|-----------|-----|-------|
| Generation Log | `abc123...` | First element in every output |
| Brief Card (DS Standard) | `def456...` | Card shell for Cards 2-9 |
| ...
```

The `references/figma-output.md` file gets updated with the general import pattern:

```js
// Meta Kit import pattern
const metaComponent = await figma.teamLibrary.getComponentByKeyAsync("COMPONENT_KEY");
const instance = metaComponent.createInstance();
// Set text properties
const titleProp = Object.keys(instance.componentProperties).find(k => k.startsWith("Title"));
instance.setProperties({ [titleProp]: "Anatomy" });
```

### How Builder Functions Are Referenced

`references/meta-kit-builders.md` contains the full JS source for every builder function. Skills reference them like:

```markdown
> **Builder functions:** Copy builder functions from `../../references/meta-kit-builders.md`
> into your `use_figma` calls as needed. Available builders: buildSpecTable, buildVariantMatrix,
> buildStateGrid, buildBarChart, buildDonutChart, buildTimeline, buildSyntaxHighlightedText.
```

---

## 6. Self-Reinforcing Loop Design

### The Feedback Mechanism

```
                    +-------------------+
                    |  Golden Reference |
                    |  (approved output |
                    |   in Figma)       |
                    +--------+----------+
                             |
              screenshots +  | component keys
              get_design_   |
              context        |
                             v
+----------+     +----------+----------+     +----------+
|  User    |---->|  Claude + Meta Kit  |---->|  Output  |
|  Prompt  |     |  (skill + builders  |     |  (Figma) |
+----------+     |   + components)     |     +-----+----+
                 +---------------------+           |
                             ^                     |
                             |   user approval     |
                             +---------------------+
```

### Step 1: Output Becomes Reference

When a user approves a generated output (component brief, flow, presentation), it becomes a golden reference:

1. **In Figma:** The approved output stays in the project file. It can be screenshotted via `get_screenshot` and analyzed via `get_design_context` by future skill invocations.

2. **In the plugin:** The generation log embedded in the output records exactly which skill, prompt, model, and version produced it. This is traceable.

### Step 2: Approved Component Briefs Inform Future Component Creation

When `component-brief` produces an approved spec for (say) DatePicker:

1. The brief cards contain anatomy, token mappings, variant axes, and accessibility requirements.
2. When `create-component` is later asked to build the DatePicker in Figma, it can:
   - Read the approved brief's HTML file from `components/date-picker/date-picker-spec.html`
   - Extract variant axes, token values, and layout from the structured data
   - Build the component to match the spec exactly

**Mechanism:** Add to `create-component/SKILL.md`:
```markdown
### Check for existing brief
Before creating, check `components/[slug]/[slug]-spec.html`.
If a brief exists, use it as the primary source for variants,
tokens, anatomy, and constraints. This ensures the built component
matches the approved specification.
```

### Step 3: Approved Flows Become Pattern Libraries

When `generate-flow` produces an approved flow:

1. The screen layouts, component arrangements, and interaction patterns are captured in Figma.
2. Future `generate-flow` calls for similar features can reference these patterns.

**Mechanism:** A `patterns/` directory in the plugin:
```
patterns/
  wizard-flow.md         — screen sequence for multi-step wizards
  crud-table-flow.md     — list > detail > edit > confirm
  access-request-flow.md — request > review > approve/deny
```

Each pattern file documents:
- Screen sequence (names and what each shows)
- Common FM components used
- Layout conventions (form width, action footer placement)
- Edge cases (empty state, error state, loading state)

These are hand-curated from approved flows. Claude reads them during Step 2 of generate-flow.

### Step 4: Comparison and Verification

After generating output, Claude can compare against golden references:

```markdown
### Verification step (after generation)
1. Take get_screenshot of the new output
2. If a golden reference exists for this component/feature:
   - Take get_screenshot of the golden reference
   - Compare: are card dimensions consistent? Are token colors matching?
   - Flag any visual discrepancies
3. If no golden reference exists, this output becomes the candidate
```

**Where golden references live:**

- **In Figma:** A dedicated page in the Meta Kit file called "Golden References" containing approved instances of each card type, slide type, and screen type.
- **In the plugin:** `references/golden-references.md` listing the Figma node IDs of each golden reference for quick `get_screenshot` access.

### Step 5: The Loop Closes

```
Build Meta Kit components
  -> Use them in skill outputs
    -> User approves outputs
      -> Approved outputs inform patterns
        -> Patterns improve future outputs
          -> Patterns reveal missing Meta Kit components
            -> Build new Meta Kit components
```

The Meta Kit library grows organically based on what the skills actually need. New patterns discovered in approved flows get codified as components or builders.

---

## 7. Implementation Priority

### Phase 1: Foundation (Build First)

These unlock the most value with the least effort. Every skill uses them.

| Priority | Component | Impact | Effort |
|----------|-----------|--------|--------|
| P0 | **Generation Log** | Used by all 4 skills, every output | Low — simple component |
| P0 | **Card Divider** | Used dozens of times per brief | Trivial |
| P0 | **Brief Card (DS Standard)** | Used 8 times per DS brief | Medium — 2 variants |
| P0 | **Code Block** | Used by component-brief + presentation | Low — shell only |
| P0 | **Do-Don't Pair** | Used by 2 cards + presentations | Low |
| P0 | **buildSpecTable** | Used 6+ times per brief, every presentation with data | Medium — most complex builder |

**Deliverable:** After Phase 1, `component-brief` can use Meta Kit for all card shells and the most common content elements. Code per card drops ~60%.

### Phase 2: Component Brief Full Coverage

| Priority | Component | Impact | Effort |
|----------|-----------|--------|--------|
| P1 | **Pointer Badge** | Anatomy card | Trivial |
| P1 | **Dimension Annotation** | Anatomy card specs | Low |
| P1 | **Color Swatch** | Token tables | Low |
| P1 | **Contrast Badge** | Accessibility card | Trivial |
| P1 | **Accessibility Card** | Accessibility card | Low |
| P1 | **Theme Card** | Actual component card | Low |
| P1 | **Actian Pyramid** | Page header + slides | Low |
| P1 | **buildVariantMatrix** | Actual component card | Medium |
| P1 | **buildStateGrid** | Anatomy card | Low |

**Deliverable:** After Phase 2, the entire component-brief skill uses Meta Kit. Visual consistency across briefs is guaranteed.

### Phase 3: Presentation + Flow Coverage

| Priority | Component | Impact | Effort |
|----------|-----------|--------|--------|
| P2 | **Slide Frame (5 variants)** | All presentations | Medium-High |
| P2 | **Geometric Overlay** | Cover/section slides | Medium |
| P2 | **Stat Card** | Presentations with metrics | Low |
| P2 | **Flow Cover Card** | All flows | Low |
| P2 | **Flow Screen** | All flows | Medium (composes FM Kit) |
| P2 | **Research Frame** | Optional flow element | Low |
| P2 | **buildBarChart** | Presentations with data | Medium |
| P2 | **buildDonutChart** | Presentations with data | Medium |
| P2 | **buildTimeline** | Presentations with timelines | Low |

**Deliverable:** After Phase 3, all 4 skills use Meta Kit. Cross-skill consistency is complete.

### Phase 4: Self-Reinforcing Loop

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| P3 | Golden References page in Meta Kit file | Quality baseline | Low |
| P3 | Pattern docs from approved flows | Future flow quality | Medium |
| P3 | Brief-to-component pipeline | Spec-to-build accuracy | Medium |
| P3 | Comparison/verification step | Automated QA | Medium |
| P3 | Sync script for Meta Kit registry | Maintenance automation | Low |

**Deliverable:** After Phase 4, the system improves itself over time.

---

## 5 (continued). Dynamic Elements — The Hard Problem

### The Challenge

Tables are the most common visual element across all skills, and they have variable rows and columns. A Figma component cannot have "N rows." This is the fundamental tension between components (fixed structure) and builders (dynamic structure).

### Solution: Component Chrome + Builder Content

The pattern is: **use a component for the wrapper, use a builder for the rows.**

#### Approach for Spec Tables

1. **Table Header Row Component** (`Meta / Content / Table Header Cell`)
   - Text property for column header label
   - Fixed height (36px)
   - Grey background (#F5F5FA)
   - Inter 13px 600
   - Width: fill parent

2. **Table Data Cell Component** (`Meta / Content / Table Cell`)
   - Variant: Plain Text, Code, Swatch
   - Text property for content
   - Fixed height: hug
   - Inter 14px 400
   - Width: fill parent
   - Bottom border: 1px #F0F0F5

3. **The builder (`buildSpecTable`) does:**
   ```
   1. Create a vertical auto-layout frame (the table)
   2. Create a horizontal auto-layout frame (header row)
   3. For each header: import Table Header Cell, set text, set width
   4. For each data row:
      a. Create horizontal auto-layout frame
      b. For each cell: import Table Cell (variant based on content type), set text, set width
      c. Append row to table
   5. Return the table frame
   ```

4. **Why not just build cells inline?** Because the Table Header Cell and Table Cell components carry their own styling (font, color, padding, background). If the design team updates the table style in Meta Kit, all generated tables update on re-generation. Without components, every builder would need code updates.

#### How FM Table Cell Relates

The existing FM Table Cell component (key: `9267fecfadc4577563deb1425fa598d1f5af9144`) has variants: Header, Text, Pill, Placeholder. This works for flow screens where tables show data.

The Meta Kit's table cells are different — they're for documentation tables (token references, property lists, contrast ratios). Different typography (Inter vs. the wireframe style), different sizing, different purpose. They coexist:

- **FM Table Cell** — used inside flow screens (lo-fi wireframe tables)
- **Meta / Content / Table Header Cell** + **Table Cell** — used in spec cards and presentation slides (documentation tables)

#### Nested Auto-Layout for Growable Tables

Figma auto-layout frames grow when children are added. The pattern:

```
Table (vertical auto-layout, width: fill parent, height: hug)
  |-- Header Row (horizontal auto-layout, width: fill, height: hug)
  |     |-- Cell 1 (width: fixed 200px, height: hug)
  |     |-- Cell 2 (width: fill, height: hug)
  |     |-- Cell 3 (width: fixed 120px, height: hug)
  |-- Data Row 1 (horizontal auto-layout, width: fill, height: hug)
  |     |-- Cell 1...
  |-- Data Row 2...
  |-- Data Row N...
```

The table frame's height grows automatically as rows are added. Each row's height grows if cell content wraps. Column widths are set once on the header row cells and matched on data row cells.

This is stable up to ~50 rows before Figma performance becomes a concern. For very large tables (100+ rows), truncate with a "and N more rows..." label.

---

## Summary

The Meta Kit is 18 Figma components and 8 builder functions that replace thousands of lines of inline frame construction across 4 skills. The components handle fixed chrome (card shells, slide frames, badges, code blocks). The builders handle dynamic content (tables, charts, grids). Together they guarantee visual consistency and reduce generation code by ~60%.

The implementation is phased: Phase 1 (foundation) covers the generation log, card shells, code blocks, and table builder — the elements used most often. Phase 2 completes component-brief coverage. Phase 3 extends to presentations and flows. Phase 4 closes the self-reinforcing loop where approved outputs improve future outputs.

The Meta Kit lives in its own Figma file in project 62158719, published as a team library. Component keys flow into the plugin via a catalog doc. Skills import components by key and set text properties, then use builder functions for dynamic content areas.
