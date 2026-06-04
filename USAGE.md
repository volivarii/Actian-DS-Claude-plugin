# Usage Guide

Your design system teammate. Three input shapes — prompt, URL + intent, URL + URL — cover everything. The companion routes; you don't memorize commands.

---

## The three shapes

### 1. Prompt — describe what you need

Single screen or full flow, lo-fi or hifi, draft to production. The companion handles screen count, detail level, and chrome.

```
Mock me a connection setup screen for Administration
```

```
Design the data product publishing flow in Studio
```

```
Build me a ship-ready user registration flow end-to-end
```

```
Show me three ways to do a notification preferences page
```

Single-screen output is first-class — `mock me X` produces one screen, `design a flow for X` produces multiple.

### 2. URL + intent — operate on existing work

Share a Figma URL plus what you want done. The companion picks the right pipeline.

```
https://figma.com/design/FILEKEY/File?node-id=123-456
rename the primary CTA to "Publish"
```
*Refine — surgical edit on a previously-pushed unit.*

```
https://figma.com/design/FILEKEY/File?node-id=123-456
try a different angle on this
```
*Iterate — re-roll the same flow with a different recipe selection.*

```
https://figma.com/design/FILEKEY/File?node-id=123-456
branch this for the admin variant
```
*Branch — fork into a sibling frame for parallel exploration.*

```
https://figma.com/design/FILEKEY/File?node-id=123-456
make it hifi
```
*Convert — FM wireframe → DS Kit hifi (`/convert-to-hifi`).*

```
https://figma.com/design/FILEKEY/File?node-id=123-456
audit this — fix the copy
```
*Audit with focused scope (`/design-audit --scope copy --fix all`).*

### 3. URL + URL — compare two designs

```
Compare these two approaches:
https://figma.com/design/FILEKEY/File?node-id=111-222
https://figma.com/design/FILEKEY/File?node-id=333-444
```

The companion routes to `/compare-flows` and produces a side-by-side diff.

---

## A feature from sketch to ship — worked example

A complete designer flow for adding a connection setup wizard to Administration. Each numbered step is a single message to the companion.

### 1. Sketch the flow

```
Design a connection setup wizard for Administration — type picker, credentials, scope review, success
```

The companion proposes 4 screens, asks if you want competitor research, and surfaces the screen list before generating anything.

> **Researcher's path:** say "yes" to research and you get findings on how Atlan, Collibra, and Stripe handle credential flows — with source URLs — presented before any screen is drafted. The research also lands as a card in the Figma output.

### 2. Approve and push

```
push
```

Lo-fi screens land in Figma — Fat Marker frames with the right Administration chrome (header, nav, page title) structured around recipes (`form-create` for input screens, `confirmation` for success). Each screen gets a stable `screenId` stamped into `.last-push.json` so later refines target the right one.

### 3. Refine one screen — surgical edit

You spot something off on screen 3. Paste the screen-frame URL:

```
https://figma.com/design/FILEKEY/File?node-id=42-100
rename "Submit" to "Connect" and tighten the help text under the password field
```

`resolve-unit.js` maps the URL to a `pushedNodes` entry → derives `single-unit:<id>` scope → loads the cached data model from `flow-data.snapshot.json` → applies the edit → recreates only that screen frame. Other screens stay byte-identical. Validator findings stay scoped to the changed screen so you don't drown in noise from screens you didn't touch.

### 4. Convert to hifi

```
make this hifi
```

Routes to `/convert-to-hifi`. The FM wireframe becomes DS Kit hifi — real components, real tokens, mapped via `fm-to-ds-map.json`. The original wireframe is never modified; the hifi version lands alongside.

### 5. Audit before ship

```
audit this
```

Runs `/design-audit` — tokens, contrast, copy, heuristics — with confidence-scored findings. Auto-fix what's safe, flag what needs judgment.

> **Content designer's path:** `audit this --scope copy --fix all` rewrites strings against `vendor/content/content.md` — sentence case, action verbs, error-message patterns, empty-state CTAs — applied automatically.
>
> **A11y specialist's path:** `audit this --scope a11y` focuses on contrast (4.5:1 normal, 3:1 large), focus order, and target sizes (44×44px min). Other findings stay quiet.

### 6. Branch a variant

The team wants to compare wizard vs. inline form. Paste the wizard URL:

```
https://figma.com/design/FILEKEY/File?node-id=42-99
branch this as the inline variant
```

A sibling frame appears: `[Original] — inline variant`. Then diff:

```
Compare these two approaches:
https://figma.com/design/FILEKEY/File?node-id=42-99
https://figma.com/design/FILEKEY/File?node-id=99-200
```

### 7. Match a reference (vision-grounded)

A PM shares a Stripe screenshot. Paste it into a Figma frame, then point the companion at it:

```
Generate the credentials screen but match the density of this:
https://figma.com/design/REF/File?node-id=99-1
```

The companion screenshots the reference, vision-extracts a 4-field structural fingerprint (`density`, `hierarchy_depth`, `primary_components`, `layout_archetype`), validates it, and biases the generation. The fingerprint persists on `meta.references[].fingerprint` and is reused on later refines of the same URL — no re-extraction cost.

That's the spine. Each step is one message. The doc below is just expansion on the parts you'll use most.

---

## Three small habits

### Point at something, get help

Share a Figma URL and describe what you need. The companion reads the design, checks it against DS rules, and either fixes it directly (obvious violations) or asks when there's a judgment call.

```
https://figma.com/design/FILEKEY/File?node-id=123-456
the spacing in this card feels off
```

### Ask a question — no URL needed

```
What's the correct spacing between cards in a grid?
```

```
How do competitors handle multi-step onboarding?
```

```
Is there a Tab component in the FM Kit?
```

### Look up the library inline

The companion reads the registries directly — no skill invocation needed.

```
Find every empty state we use across DS Kit
```

```
Where do we use FilterChip in the product?
```

```
Show me all the components that have a destructive variant
```

---

## What the companion helps with

### Spot fixes — wrong tokens, spacing, auto-layout

Share a URL + describe what looks wrong. The companion fixes obvious violations (wrong color, spacing off-scale, missing auto-layout) directly and asks on ambiguous ones.

```
https://figma.com/design/FILEKEY/File?node-id=123-456
check the tokens on this component
```

### Flows and screens — from idea to Figma

The worked example above is the canonical shape: prompt → preview → push → refine → audit. The companion knows canonical layout patterns for each screen type — naming the pattern in your prompt gets you the right skeleton on the first try:

```
Design a Studio dashboard with popular items cards and watchlists
```

```
Create an Explorer homepage with search hero and marketplace tiles
```

```
Mock up a catalog item detail page in Explorer with the property sidebar
```

```
Generate a new glossary term creation screen with type picker cards and sticky footer
```

```
Design a table view for the Administration users page with filters and bulk actions
```

**Research:** Claude asks if you want competitor research. Say "yes" to get findings with source URLs presented before any screens are proposed. The research also appears as a card in the Figma output.

**Detail levels:** When approving screens, pick your detail level:

| Command | Level | What you get |
|---------|-------|-------------|
| `approve draft` | Draft | Layout zones with placeholders — "is this the right structure?" |
| `approve` | Standard | Feature fully realized, contextual labels, realistic data |
| `approve production` | Production | All states: happy, empty, error, loading, edge cases |
| `push draft [URL]` | Draft + push | Approve + push in one command |
| `push [URL]` | Standard + push | Approve + push in one command |
| `push production [URL]` | Production + push | Approve + push in one command |

At every level, only the feature you're designing gets detailed content — sidebar, header, and unrelated chrome stay as muted placeholders.

**HiFi conversion:** Add `--hifi` to also generate a DS Kit high-fidelity version alongside the wireframe. Or convert an existing wireframe later with `/convert-to-hifi`.

**Prototype wiring:** Say "push and wire" and your flow becomes playable in Figma Presentation mode.

### Variants — explore alternatives side-by-side

```
Show me three takes on the data contract creation page
```

Routes to `/generate-flow ... --variants 3`. Each variant uses a different recipe or composition, laid out side-by-side. Range 2–5 (n=1 is just generation; n>5 is refused). Useful for early-stage shape-finding before committing to a direction.

### State coverage and responsive breakpoints

```
https://figma.com/design/FILEKEY/File?node-id=42-100
add empty + error states
```

Routes to `/generate-flow <url> --states empty,error,loading`. Generates each state as additional screens.

```
Design a Studio dashboard with popular items, breakpoints tablet,mobile
```

Routes to `/generate-flow ... --breakpoints tablet,mobile`. Lo-fi level = structural decisions only (collapse, stack). Hifi level applies the structural decisions to DS Kit responsive variants.

### Vision-grounded references — match a reference's structure

```
Match the density of this screenshot:
https://figma.com/design/REF/File?node-id=99-1
```

The companion screenshots the reference, vision-extracts a 4-field fingerprint (`density`, `hierarchy_depth`, `primary_components`, `layout_archetype`), validates it against the recipe registry, and biases generation toward that structure. The fingerprint persists on `meta.references[].fingerprint` and is reused on later refines of the same URL — extraction runs once.

For external references (Stripe, Linear, Atlan), screenshot into a Figma frame first. Direct image URL support is planned.

### Tier review — what got recognized vs. improvised

After a push, every screen is classified into one of three tiers:

| Tier | Meaning |
|------|---------|
| **Recognized** | Screen matched a recipe directly — uses the canonical skeleton |
| **Adapted** | Screen matched a recipe but composes 2-3 archetype patterns (e.g., detail + audit-log) |
| **Improvised** | No recipe fit — the AI proposed a structure with explicit justification |

Ask for the deviations explicitly:

```
https://figma.com/design/FILEKEY/File?node-id=42-99
review tier-3 screens
```

Companion reads `.last-push.json` and surfaces every `improvised` (or `adapted` with a recipe match) screen with its `justification` text — so you can decide whether to override, refine, or accept the AI's reasoning.

### Copy review — content guidelines applied

Share a screen and ask about the text. The companion checks against Actian content guidelines: sentence case, action verbs, error message patterns, empty state CTAs.

```
https://figma.com/design/FILEKEY/File?node-id=123-456
review the copy in this screen
```

```
Write an error message for a failed connection — timeout after 30s
```

```
What should the empty state say when there are no data products?
```

### Accessibility — WCAG 2.2 AA checks

```
https://figma.com/design/FILEKEY/File?node-id=123-456
is this form accessible?
```

```
Check the contrast on these cards
```

For a full audit with confidence-scored findings, say "audit this screen."

### Research — patterns and competitors

```
How do data platforms like Atlan and Collibra handle data lineage visualization?
```

```
What's the best practice for destructive action confirmation?
```

```
Research wizard patterns for multi-step configuration
```

### Convert wireframes to hifi — FM → DS Kit

```
Convert this wireframe to high-fidelity
https://figma.com/design/FILEKEY/File?node-id=123-456
```

Pipeline: extract FM tree → deterministic transform via `fm-to-ds-map.json` → LLM polish for unmapped components and layout → push DS Kit hifi alongside the original. The wireframe is never modified.

### Component specs — brief, document, create

```
Brief the Button component from https://figma.com/design/FILEKEY/DS?node-id=123-456
```

```
Create a Data Product Card with Default, Hover, Selected states
Properties: title, description, quality score, owner avatar
```

```
Add a compact size variant to the existing Badge component
```

### Compare designs — v1 vs v2

```
Compare these two approaches:
https://figma.com/design/FILEKEY/File?node-id=111-222
https://figma.com/design/FILEKEY/File?node-id=333-444
```

```
Which version is better for onboarding? v1: [URL1] v2: [URL2]
```

### Presentations — decks from content

```
Create a presentation about Q1 design system adoption
```

```
Present the migration plan to engineering leads
```

### Design system sync — keep tokens and docs current

```
Sync the design system
```

```
Sync the Button guidelines
```

```
Check if local files are up to date with Figma
```

### Guideline proposals — evolve the DS

```
We should add a rule about minimum card padding
```

```
The content guidelines don't cover date formatting — can we add that?
```

The companion drafts the guideline and shows where it would go. You approve before any file changes.

---

## Power-user shortcuts

Every capability is also a direct command. Use these when you know exactly what you want.

| Command | When to use |
|---------|------------|
| `/generate-flow [description]` | Generate one or more lo-fi screens from a prompt |
| `/generate-flow [URL] [instruction]` | Refine — surgical edit on a prior push |
| `/generate-flow --from [URL]` | Iterate — re-roll the same flow |
| `/generate-flow --from [URL] --branch [name]` | Branch — fork into a sibling frame |
| `/generate-flow [description] --variants 3` | Three structurally-distinct alternatives |
| `/generate-flow [description] --ref [URL]` | Vision-grounded reference — fingerprint extraction biases recipe + density (Figma URLs only; image URLs planned) |
| `/generate-flow [URL] --states empty,error` | Add state coverage to a pushed flow |
| `/generate-flow [description] --breakpoints tablet,mobile` | Add responsive breakpoint variants |
| `/generate-flow [description] --hifi --audit` | Lo-fi → hifi → audit chain |
| `/convert-to-hifi [URL] [--ref URL]` | Convert FM wireframe to DS Kit hifi |
| `/component-brief [name or URL] [--include-states]` | Jump to component spec (add `--include-states` for state matrix card) |
| `/design-audit [URL] [--scope copy\|tokens\|a11y\|heuristic] [--fix N\|all]` | Audit with focused scope and optional auto-fix |
| `/create-component [description]` | Jump to component creation |
| `/compare-flows [URL1] [URL2]` | Side-by-side diff (also works between branches/variants) |
| `/generate-presentation [topic]` | Jump to deck creation |

---

## Preview and iteration

Generation tasks pause for review before pushing to Figma:

| Reply | What happens |
|-------|-------------|
| **"push"** | Send everything to Figma (standard detail) |
| **"push draft"** | Send as a quick structural sketch |
| **"push production"** | Send with all states and edge cases |
| **"push 2,4,5"** | Send specific items |
| **"preview"** | Open HTML preview first |
| **"push and wire"** | Push + wire prototype connections |
| **"prototype"** | Generate clickable HTML prototype |
| **"playground"** | Generate component state explorer |
| **feedback** | Describe changes, get updated output |

### Visual annotations

Click directly on elements in the preview instead of describing issues in text:

1. Click **Annotate** in the preview toolbar
2. Click any element, type feedback, pick **Change** or **Note**
3. Click **Apply** in the browser, then say **"apply"** in the CLI

**Change** = modify the element. **Note** = carry forward to Figma without changing.

---

## Three Actian apps

The companion uses the correct header, navigation, and terminology for each app.

| App | Purpose | Typical tasks |
|-----|---------|--------------|
| **Studio** | Data integration, catalog, quality, lineage | "Create a lineage exploration flow", "Design a Studio dashboard", "Mock up the glossary term creation screen" |
| **Explorer** | Data discovery, search, data products, glossary | "Mock up the Explorer homepage", "Design the catalog browse with faceted filters", "Create a dataset detail page" |
| **Administration** | Users, connections, scanners, settings | "Generate a connection setup wizard", "Design a settings page with sticky footer", "Create a user management table view" |
