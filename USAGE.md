# Usage Guide

Your design system teammate. Two input shapes, prompt and URL + intent, cover everything. `/actian-ux` names the skill that fits; you don't memorize commands.

---

## The two shapes

### 1. Prompt — describe what you need

A flow or a screen gets a clickable prototype in the right app; a ticket gets a proposal.

```
Mock me a connection setup screen for Administration
```

```
Design the data product publishing flow in Studio
```

```
Show me three ways to do a notification preferences page
```
*Proposal: each decision the page forces, with options drawn inside the product, a comparison and the pick (`/actian-ux-proposal`).*

```
Show a logged-in user their roles and permissions in the account menu, a few approaches
```
*Proposal: the document, and the `intent.md` the PM owns (`/actian-ux-proposal`).*

### 2. URL + intent — operate on existing work

Share a Figma URL plus what you want done.

```
https://figma.com/design/FILEKEY/File?node-id=123-456
audit this, then fix the copy
```
*Audit: every finding with evidence and a fix; fixes applied one at a time when you ask (`/actian-ux-audit`).*

```
https://figma.com/design/FILEKEY/File?node-id=123-456
generate the specs
```
*Specs: `specs.md` from the final frame, the prototype and `intent.md` (`/actian-ux-audit`).*

---

## A feature from ticket to specs: worked example

A complete designer flow for adding a connection setup wizard to Administration. Each numbered step is a single message.

### 1. Propose

```
<TICKET-ID>: let an admin set up a connection in Administration. A few approaches, and pick one.
```

`/actian-ux-proposal` writes `proposal-data.json`, then renders `proposal.html` (each decision the ticket forces, heaviest first, its options drawn as Fat Marker fragments, a comparison and the pick with its cost) and `intent.md` from it. Business fields (value, stakeholders, metrics, constraints, deliverables) read "To fill by PM". To change it, ask for the change: the skill edits the data file and renders both again.

### 2. Prototype the flow

```
Design a connection setup wizard for Administration: type picker, credentials, scope review, success
```

`/actian-ux-prototype` writes the screen list, builds one brief from the knowledge (`prepare-flow.js --direct`), writes the four author files and assembles `prototype.html`: the app's real header and side navigation, live state between steps, a strip to jump to a step, and a "Show what is new" switch that marks what the product does not have today. `check-direct.js` checks the files, and the skill looks at a screenshot of every step before handing over.

### 3. Push to Figma

```
push the screens to Figma
```

One JSON per screen goes through `figma-screen.js`, whose output is the code of one `use_figma` call: real design system instances, colours as tokens in the app's theme, text in Roboto. Properties the live component refuses come back in `droppedProps`, and the skill screenshots each screen.

### 4. Audit before ship

```
https://figma.com/design/FILEKEY/File?node-id=42-100
audit this
```

Runs `/actian-ux-audit`: components, tokens, accessibility (WCAG 2.2 AA), copy (`vendor/content/dist/global.md` and the terminology), layout and states. Each finding names the node, quotes the rule, says what the file has, gives the fix and a confidence; below 0.5 it goes to needs review.

### 5. Fix

```
fix finding 3
```

One finding at a time, P0 first, looking at the result after each.

### 6. Specs for engineering

```
generate the specs
```

`specs.md` from three sources: the final frame (components by DS name and slug, copy, accessibility, screens), the prototype (flow order, states, interactions) and `intent.md` (edge cases, scope, open questions). Unfixed findings and open questions go to Flagged concerns, and the designer reviews it before it is pushed.

That's the spine. Each step is one message. The doc below is just expansion on the parts you'll use most.

---

## Three small habits

### Point at something, get help

Share a Figma URL and describe what you need. The audit reads the frame, checks it against the design system, and fixes a finding when you ask.

```
https://figma.com/design/FILEKEY/File?node-id=123-456
the spacing in this card feels off
```

### Ask a question — no URL needed

`/actian-ux` answers from the knowledge and cites each file it used; if the knowledge does not say, it says so.

```
What's the correct spacing between cards in a grid?
```

```
Is there a Tab component in the FM Kit?
```

### Look up the library inline

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

Share a URL + describe what looks wrong. The audit lists what departs from the design system, with a fix each, and applies the fixes you ask for.

```
https://figma.com/design/FILEKEY/File?node-id=123-456
check the tokens on this component
```

### Flows and screens — from idea to Figma

The worked example above is the canonical shape: prompt, prototype, push, audit, specs. The prototype takes each page's structure from the app's recipe and its screenshot, and its appearance from the design system:

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

**One clickable prototype:** the whole flow is one HTML page drawn from the design system's own markup, with every control working and the product's own words. What the product lacks is marked new on the page itself. Where a browser is available the skill looks at a screenshot of every step before handing over; in Cowork there is none, and the handover names what you must look at.

**Figma push, on request:** say "push to Figma" and each screen lands as design system instances, drawers and toasts as layers over the page.

**specs.md seed:** when no final Figma exists, the prototype seeds `specs.md`, every section marked `Source: Prototype`.

### Copy review — content guidelines applied

Share a screen and ask about the text. The audit checks against Actian content guidelines: sentence case, action verbs, error message patterns, empty state CTAs.

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

### Proposals: a reasoned document for a ticket

```
DIP-I-496: show the user's roles and permissions. A few approaches, and pick one.
```

Routes to `/actian-ux-proposal`. It reads the ticket, then the knowledge on what it touches (the app file, the entities, personas, patterns and content rules), and writes `proposal-data.json` (shape: `schemas/proposal-data.schema.json`). From that one file it renders `proposal.html` and `intent.md`, so the two never disagree. Every question the ticket forces that a reader could answer differently is a decision, heaviest first; each has options drawn inside the product as Fat Marker fragments, the design system components they use, a comparison, and a pick with its reasons and cost. Every drawn part is marked existing or new, and every product fact names its knowledge file. `validate-proposal.js` and `check-handover.js intent` must show no P0. No Figma push.

### Handover files: intent.md and specs.md

`intent.md` (from the proposal) and `specs.md` (from the audit, or seeded by the prototype) are checked by `scripts/validation/check-handover.js` against the knowledge's templates. Until the knowledge ships those templates, the scripts print `template not vendored yet` and exit 2, and the skills hand over without the file and say so.

### Design system sync — automatic

There is nothing to run. The knowledge repository syncs from Figma every night, and the plugin takes the new snapshot the same morning.

---

## Power-user shortcuts

Every capability is also a direct command. Use these when you know exactly what you want.

| Command | When to use |
|---------|------------|
| `/actian-ux [question]` | An answer from the knowledge, citing each file; which skill fits a task |
| `/actian-ux-proposal [ticket or request]` | A proposal document and `intent.md`, both from one `proposal-data.json` |
| `/actian-ux-prototype [description]` | A clickable HTML prototype of the flow in the real app, checked and looked at step by step; "push to Figma" to add the Figma screens |
| `/actian-ux-audit [URL]` | Findings with evidence and a fix each; fixes on request, P0 first; `specs.md` from the final frame |

---

## Running in Cowork

In the Cowork tab, bash runs inside a VM where the plugin is mounted under a sessions directory, not at the path the skill header names. Every skill starts with a "Where the plugin lives" block that sets `CLAUDE_PLUGIN_ROOT` for that shell, so the renderer and validator scripts are found on the first try. If a run ever says the scripts are not available, run that block's bash line by hand and retry.

Two limits in the Actian org's Cowork. The plugin cannot see its own output: the Cowork sandbox has no browser, browser downloads are blocked, and Claude in Chrome is switched off, so any step that screenshots a page (such as the prototype's look at every step) is skipped and the handover says so. Look at the page yourself. And the plugin updates on its own there, so a version cannot be held.

---

## Three Actian apps

The companion uses the correct header, navigation, and terminology for each app.

| App | Purpose | Typical tasks |
|-----|---------|--------------|
| **Studio** | Data integration, catalog, quality, lineage | "Create a lineage exploration flow", "Design a Studio dashboard", "Mock up the glossary term creation screen" |
| **Explorer** | Data discovery, search, data products, glossary | "Mock up the Explorer homepage", "Design the catalog browse with faceted filters", "Create a dataset detail page" |
| **Administration** | Users, connections, scanners, settings | "Generate a connection setup wizard", "Design a settings page with sticky footer", "Create a user management table view" |
