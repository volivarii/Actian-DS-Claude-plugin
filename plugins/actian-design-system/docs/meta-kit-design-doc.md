# Meta Kit: Refined Architecture

A single-source-of-truth component system for AI-generated design system output, designed to resolve the tensions between speed and quality, consistency and creativity, single source and latency.

**Date:** 2026-03-26
**Author:** Claude (architectural research for Vincent Olivari)
**Status:** Refined design proposal (iteration 3)
**Supersedes:** `meta-kit-design-document.md` (iteration 2)

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

## Appendix: Component Specifications (Carried Forward)

The full component specifications from `meta-kit-design-document.md` (iteration 2) remain valid and are carried forward by reference. The 18 component specs (Generation Log, Brief Card, Slide Frame, Flow Cover Card, Flow Screen, Code Block, Do-Don't Pair, Accessibility Card, Color Swatch, Contrast Badge, Pointer Badge, Dimension Annotation, Theme Card, Stat Card, Card Divider, Actian Pyramid, Geometric Overlay, Research Frame) and 8 builder function specs (buildSpecTable, buildVariantMatrix, buildStateGrid, buildBarChart, buildDonutChart, buildTimeline, buildSyntaxHighlightedText, buildFormContainer) are defined there with full dimensional specifications, variant axes, and property tables.

This document (iteration 3) adds the architectural decisions (variable binding, quality tiers, compound components, living specification pattern) that were not part of the original spec-level document. Both documents should be read together: iteration 2 for the "what" (component specs), iteration 3 for the "how" and "why" (architecture).
