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

## Worked examples

### Single-screen prompt (n=1 first-class)

```
Mock me an empty state for the catalog page
```

The companion produces one screen. No flow ceremony, no multi-screen overhead.

### Refine: targeted edit on prior work

After any push, the result lives in `.last-push.json`. Paste the pushed URL and describe the edit:

```
https://figma.com/design/FILEKEY/File?node-id=42-100
swap the CTA position to the right side and use "Publish" instead of "Save"
```

The skill detects the URL in the unitMap, loads the cached data model for that screen, applies the edit, and pushes only the affected unit. Faster than regeneration; preserves everything else.

### Variants: structurally-distinct alternatives

```
Show me three takes on the data contract creation page
```

Routes to `/generate-flow ... --variants 3`. Each variant uses a different recipe or composition, laid out side-by-side. Range 2–5; n>5 is refused.

### Branch: fork a flow for a variant audience

```
https://figma.com/design/FILEKEY/File?node-id=99-200
branch this for the steward role
```

Routes to `/generate-flow --from <url> --branch steward`. Produces a sibling frame named `[Original] — steward`. Use `/compare-flows` to diff branches.

### Reference: bias generation toward an existing style

Drop in one or more Figma URLs whose structure you want to echo:

```
Design a command palette in Studio. Match this style:
https://figma.com/design/REF/File?node-id=10-20
```

Routes to `/generate-flow ... --ref <url>`. v1 accepts Figma URLs only — for external references (Linear, Stripe), screenshot into a Figma frame first.

### State coverage: empty, error, loading, etc.

```
https://figma.com/design/FILEKEY/File?node-id=42-100
add empty + error states
```

Routes to `/generate-flow <url> --states empty,error`. Generates each state as additional screens.

---

## Working together

### Point at something, get help

Share a Figma URL and describe what you need — the companion reads the design, checks it against DS rules, and either fixes it directly (obvious violations) or asks when there's a judgment call.

```
https://figma.com/design/FILEKEY/File?node-id=123-456
the spacing in this card feels off
```

### Ask a question

No URL needed — just describe what you're working on or ask.

### Ask a question

```
What's the correct spacing between cards in a grid?
```

```
How do competitors handle multi-step onboarding?
```

```
Is there a Tab component in the FM Kit?
```

---

## What the companion helps with

### Spot fixes — wrong tokens, spacing, auto-layout

Share a URL + describe what looks wrong. The companion fixes obvious violations directly (wrong color, spacing off-scale, missing auto-layout) and asks about ambiguous ones.

```
https://figma.com/design/FILEKEY/File?node-id=123-456
this doesn't look right
```

```
https://figma.com/design/FILEKEY/File?node-id=123-456
check the tokens on this component
```

```
https://figma.com/design/FILEKEY/File?node-id=123-456
the colors seem inconsistent here
```

### Flows and screens — from idea to Figma

Describe a feature, user story, or task. The companion plans screens, generates an HTML preview, and pushes to Figma. It uses canonical layout patterns from the real product to get the structure right on the first try.

```
Create a connection setup wizard for Administration
```

```
Generate a catalog browsing experience in Explorer
```

```
Quick draft of user registration
```

```
Production flow for data contracts with all states and edge cases
```

**Layout-aware generation** — the companion knows the canonical patterns for each screen type:

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

### Accessibility — WCAG 2.1 AA checks

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

Point at an existing Fat Marker wireframe and get a production-ready DS Kit version. The companion reads the FM frame, identifies components, maps them to DS Kit equivalents, and pushes a new hifi frame alongside the original.

```
/convert-to-hifi https://figma.com/design/FILEKEY/File?node-id=123-456
```

```
Convert this wireframe to high-fidelity
https://figma.com/design/FILEKEY/File?node-id=123-456
```

The pipeline: extract FM tree → deterministic transform (component mappings derived from registries) → LLM polish for unmapped components and layout → push. The original wireframe is never modified.

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
| `/generate-flow [description] --ref [URL]` | Bias generation toward a reference (Figma URLs only in v1) |
| `/generate-flow [URL] --states empty,error` | Add state coverage to a pushed flow |
| `/generate-flow [description] --breakpoints tablet,mobile` | Add responsive breakpoint variants |
| `/generate-flow [description] --hifi --audit` | Lo-fi → hifi → audit chain |
| `/convert-to-hifi [URL] [--ref URL]` | Convert FM wireframe to DS Kit hifi |
| `/component-brief [name or URL] [--include-states]` | Jump to component spec (add `--include-states` for state matrix card) |
| `/design-audit [URL] [--scope copy\|tokens\|a11y\|heuristic] [--fix N\|all]` | Audit with focused scope and optional auto-fix |
| `/create-component [description]` | Jump to component creation |
| `/compare-flows [URL1] [URL2]` | Side-by-side diff (also works between branches/variants) |
| `/generate-presentation [topic]` | Jump to deck creation |
| `/sync-design-system [scope]` | Jump to sync |

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
