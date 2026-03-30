# Usage Guide

How to use the Actian Design System plugin. All examples are natural language prompts — just type what you want. No special syntax required.

---

## Quick Start

After installing, connect the Figma MCP and start prompting:

```
Generate a flow for catalog browsing in Explorer
```

```
Brief the Button component from https://figma.com/design/...?node-id=123-456
```

```
Audit this screen https://figma.com/design/...?node-id=123-456
```

---

## Generating Flows

Describe a feature, user story, or task — the plugin generates a multi-screen wireframe flow using Fat Marker components.

| What you say | What happens |
|-------------|-------------|
| "Create a data product publishing flow in Studio" | Generates screens for the full creation workflow |
| "How would a steward create a metadata quality policy?" | Infers app (Studio), role, and flow type |
| "Quick draft of user registration" | Draft tier: happy path only, 3-5 screens |
| "Production flow for data contracts with all states" | Production tier: all paths, edge cases, variable binding |

**Research:** Add "research competitor patterns" to get UX research from Notion, Stripe, Atlan, etc. before generation. Or say "no research, just build it" to skip.

**Preview:** Every flow gets an HTML preview on localhost. Review it, annotate issues, then push to Figma.

**Prototype wiring:** Say "push and wire" at the preview gate and your flow becomes playable in Figma's Presentation mode — buttons, menus, and back navigation are auto-detected.

**Wire existing flows:** Paste a Figma URL and say "wire a prototype on this flow" — works on any flow, not just ones the plugin generated.

---

## Component Briefs

Document any component with a structured spec: anatomy, tokens, API, states, accessibility, code.

| What you say | What happens |
|-------------|-------------|
| "Brief the Button component" | 9-card DS2026 spec |
| "Brief the FM Alert" | 5-card Fat Marker spec |
| "Brief this https://figma.com/design/...?node-id=123-456" | Spec from a Figma URL |
| "Component brief for Modal, only cards 2, 4, 5" | Selected cards |

**Playground:** Say "playground" at the preview gate to generate an interactive state explorer — toggle states, switch themes, see active tokens.

---

## Design Audits

Audit any Figma screen against DS2026 rules: tokens, WCAG AA contrast, content guidelines, forms layout.

| What you say | What happens |
|-------------|-------------|
| "Audit this screen [URL]" | Token, contrast, guideline check with confidence-scored findings |
| "What's wrong with this design? [URL]" | Same audit, conversational trigger |
| "Fix finding #3" | Apply the fix directly in Figma |
| "Fix the hardcoded blue on the login button" | Fix by description |
| "Fix all auto-fixable findings" | Batch fix |

---

## Creating Components

Build new Figma components with variants, properties, and token binding.

| What you say | What happens |
|-------------|-------------|
| "Create a Data Product Card with Default, Hover, Selected states" | New component with 3 variants |
| "Add a compact size to the existing Button" | Extend an existing component |
| "Create a Stepper, research Material and Atlassian first" | Research patterns before building |

---

## Comparing Flows

Side-by-side comparison of two Figma flows with severity-rated findings.

| What you say | What happens |
|-------------|-------------|
| "Compare [URL1] and [URL2]" | Structured comparison |
| "Which is better for onboarding? v1: [URL1] v2: [URL2]" | Evaluative comparison |

---

## Presentations

Generate slide decks using Actian templates with charts and data visualizations.

| What you say | What happens |
|-------------|-------------|
| "Create a deck on Q1 design system progress" | 8-15 slides with DS2026 styling |
| "Present the migration plan to engineering leads" | Audience-aware deck |
| "Turn these notes into a presentation: [file]" | From input files |

---

## Syncing from Figma

Keep local tokens, components, and guidelines in sync with Figma.

| What you say | What happens |
|-------------|-------------|
| "Sync the design system" | Full 6-phase sync |
| "Sync the Button guidelines" | Single component |
| "Sync tokens" | Single phase |
| "Check if local files are up to date" | Validate without overwriting |

---

## Preview & Iteration

Every generation skill pauses at a preview gate before pushing to Figma:

| At the gate | What happens |
|-------------|-------------|
| **"push"** | Send everything to Figma |
| **"push 2,4,5"** | Send specific items only |
| **"push and wire"** | Push + wire prototype connections (flows) |
| **"prototype"** | Generate clickable HTML prototype (flows) |
| **"playground"** | Generate state explorer (component briefs) |
| **feedback** | Describe changes, HTML updates and re-serves |

### Visual annotations — point at what needs changing

Instead of describing issues in text ("the third button in the header should be blue"), click directly on the element in the preview and annotate it. The plugin fixes exactly what you pointed at.

1. Click **Annotate** in the preview toolbar
2. Hover over any element — it highlights with a blue outline showing its name
3. Click the element → type your feedback → pick **Change** or **Note** → Save
4. Repeat for as many elements as you want
5. Click **Apply** in the browser
6. Say **"apply"** in the CLI — every annotation is applied and the page auto-refreshes

**Change** = modify the element as described ("make this a primary button", "change text to 'Save draft'").
**Note** = don't change anything — carry the note forward to the Figma push step.

This turns iteration from "describe the problem → hope it's understood → check if it's fixed" into "point at the problem → describe the fix → it's applied." Works at every preview gate across all skills.

---

## Three Actian Apps

The plugin understands all three applications in the Data Intelligence Platform:

| App | Use when you mention | Examples |
|-----|---------------------|----------|
| **Studio** | governance, catalog management, stewardship, lineage, metadata | "Create a lineage exploration flow in Studio" |
| **Explorer** | marketplace, discovery, search, data products, business glossary | "Mock up the data product browsing experience in Explorer" |
| **Administration** | users, connections, settings, configuration, policies | "Generate a connection setup wizard for Administration" |

The plugin uses the correct navigation, chrome, and terminology for each app.
