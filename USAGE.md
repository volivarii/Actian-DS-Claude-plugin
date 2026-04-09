# Usage Guide

Your design system teammate. Share a Figma URL, describe what you need, or ask a question — the companion handles the rest.

---

## Working together

### Point at something, get help

The most natural way to use the plugin: share a Figma URL and describe what you need.

```
https://figma.com/design/FILEKEY/File?node-id=123-456
the spacing in this card feels off
```

The companion reads the design, checks it against DS rules, and either fixes it directly (obvious violations) or asks when there's a judgment call.

### Describe a task

No URL needed — just say what you're working on.

```
Mock up a data product publishing flow in Studio
```

```
How would a data steward create a metadata quality policy?
```

```
Write better copy for the empty state on the connections page
```

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

**Research:** Add "research competitor patterns" to get UX research before generation. Or say "no research, just build it" to skip.

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

The pipeline: extract FM tree → deterministic transform (28 component mappings) → LLM polish for unmapped components and layout → push. The original wireframe is never modified.

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
| `/generate-flow [description] [--hifi]` | Jump straight to flow generation (add `--hifi` for DS Kit version too) |
| `/convert-to-hifi [URL]` | Convert FM wireframe to DS Kit hifi |
| `/component-brief [name or URL]` | Jump to component spec |
| `/design-audit [URL]` | Jump to full audit |
| `/create-component [description]` | Jump to component creation |
| `/compare-flows [URL1] [URL2]` | Jump to comparison |
| `/generate-presentation [topic]` | Jump to deck creation |
| `/sync-design-system [scope]` | Jump to sync |

---

## Preview and iteration

Generation tasks pause for review before pushing to Figma:

| Reply | What happens |
|-------|-------------|
| **"push"** | Send everything to Figma |
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
