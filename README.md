# Actian Design System Plugin

Claude plugin for the Actian UX team. Generate wireframe flows, create component specs, audit Figma files, build presentations, and compare designs — powered by Claude + Figma MCP.

## Install

### Option A — Claude Code CLI (recommended)

Claude Code CLI provides full access to all features including direct Figma capture via `generate_figma_design`.

```bash
# Add the marketplace
claude plugin add volivarii/Actian-DS-Claude-plugin

# Connect Figma MCP (if not already connected)
claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp
```

### Option B — Claude Desktop (Code mode, Cowork mode, Chat mode)

1. Open Claude Desktop
2. Go to **Customize** → **Personal plugins** → **+**
3. Add marketplace: `volivarii/Actian-DS-Claude-plugin`
4. Click **Check for updates** to load the plugin
5. Enable the **Figma** connector under **Customize** → **Connectors**

> **Note:** Claude Desktop does not currently expose the `generate_figma_design` Figma MCP tool. The plugin works around this by shelling out to `claude -p` (Claude Code CLI) for Figma capture. **Install Claude Code CLI alongside Claude Desktop for full Figma capture support:**
>
> ```bash
> npm install -g @anthropic-ai/claude-code
> ```
>
> Without the CLI installed, you can still generate specs and preview them locally — you just won't get automatic push-to-Figma.

### Connector required

This plugin requires the **Figma MCP** connector for design context, screenshots, and capture. The official Figma plugin (from "By Anthropic & Partners") provides this. Make sure it's connected in your Connectors settings.

## Skills

| Skill | What it does |
|-------|-------------|
| `/generate-flow` | Generate Fat Marker wireframe flows from user stories, with competitor research. Output via Assembler, Plugin API, or HTML capture. |
| `/component-brief` | Draft a 9-card DS2026 or 5-card Fat Marker component spec with anatomy, tokens, API, and accessibility |
| `/design-audit` | Audit a Figma file against DS2026 tokens, accessibility (WCAG AA), content, forms layout, and quality standards |
| `/compare-flows` | Compare two Figma flows with severity-rated issues (P0/P1/P2), structured analysis, and concrete recommendations |
| `/generate-presentation` | Create a full slide deck with charts and data visualizations from docs, research, Figma content, or a topic |
| `/create-component` | Build a new Figma component with variants via Assembler or Plugin API, with optional pattern research |
| `/sync-guidelines` | Extract per-component guidelines from the DS2026 Figma library into structured JSON |

## Example prompts

You don't need to memorize commands — just describe what you need. Here are examples for each skill:

### Generate flows

```
Generate a wireframe flow for the data asset access request feature.
The user should browse assets, request access, and get notified when approved.
About 6 screens, happy path. Admin app context.
```

```
I have screenshots of how Collibra handles dataset tagging.
Can you create a similar flow for our Studio app using FM components?
```

```
Design the screens for the bulk import workflow — user uploads a CSV,
maps columns, previews data, confirms, and sees results. Include error states.
```

### Component briefs

```
Draft a brief for the Link component from DS2026.
https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK/DS2026?node-id=14793-7507
Generate all 9 cards.
```

```
Document FM Alert — I want the full 5-card Fat Marker spec
with variants, design guidelines, content guidelines, and anatomy.
```

```
Generate cards 4, 5, and 8 (design tokens, component API, accessibility)
for the Dropdown component.
```

### Design audits

```
Audit this Figma page for design system compliance.
Check tokens, component consistency, accessibility, and missing states.
https://www.figma.com/design/abc123/Admin?node-id=5-6
```

```
Is this page using the right tokens? I think there are some hardcoded
colors in the form section.
https://www.figma.com/design/abc123/Settings?node-id=10-20
```

```
Before we hand this off to dev, can you check if the flow meets WCAG AA?
Focus on contrast, focus states, and keyboard access.
```

### Compare flows

```
Compare these two versions of the onboarding flow and tell me which is
stronger. Here's v1 and v2:
https://www.figma.com/design/abc123/Onboarding?node-id=12-34
https://www.figma.com/design/abc123/Onboarding?node-id=56-78
```

```
How does the Explorer item detail view differ from the Studio version?
I want to see where they diverge and if we should align them.
```

### Presentations

```
Create a presentation about our Q1 design system progress.
I have the metrics in ds-metrics.md and screenshots in Figma.
```

```
Turn the accessibility audit findings into a deck for stakeholders.
Include charts showing pass/fail rates by component category.
The findings are in audit-report.md.
```

```
Make a pitch deck for the design system team — we want budget approval
for 2 more headcount. Here are our impact metrics and roadmap.
```

### Create components

```
Build a new FM Card component with Default, Hover, and Selected states.
It should have a title, description, and optional action button.
```

```
I want to create a reusable status indicator that shows
online/offline/away states — something we can use across the admin panel.
```

```
Add a Destructive variant to the existing FM Button — red background,
white text, same sizes as the current button.
```

### Sync guidelines

```
Sync guidelines for Button, Text Input, and Modal
```

```
Sync all guidelines
```

## How it works

1. **You describe what you need** — paste a Figma URL, attach a file, or describe the task
2. **Claude researches** — fetches Figma design context, reads docs, checks competitors (for flows)
3. **Claude generates** — creates output using DS2026 tokens and Actian templates
4. **You review** — preview locally, approve at review gates (screen lists, slide reports)
5. **Claude pushes to Figma** — captures output into your target Figma file via the Assembler, Plugin API, or HTML capture

All outputs use `--zen-*` design tokens across all three themes (Actian, Studio, Explorer). No hardcoded values.

## Data architecture

This plugin consumes data from the [Actian DS Assembler](https://github.com/volivarii/Actian-DS-Assembler) repo, which is the single source of truth for all Figma-derived data.

```
Figma libraries (source of truth)
    ↓
Assembler repo (npm run sync → generates registry, tokens, docs)
    ↓
This plugin (scripts/sync-from-upstream.sh → fetches via GitHub raw URLs)
    ↓
Claude skills (read bundled docs/tokens at runtime)
```

### Syncing from upstream

```bash
cd plugins/actian-design-system

./scripts/sync-from-upstream.sh              # everything (50+ files)
./scripts/sync-from-upstream.sh docs         # 3 reference docs
./scripts/sync-from-upstream.sh guidelines   # 44 component guideline JSONs
./scripts/sync-from-upstream.sh tokens       # 2 token files
```

### What triggers a sync

| Something changed in Figma | What to do |
|---|---|
| Tokens (colors, spacing, radius) | Assembler: `npm run sync` → Plugin: `sync-from-upstream.sh tokens` |
| Components added/modified | Assembler: `npm run sync` → Plugin: `sync-from-upstream.sh docs` |
| Content guidelines edited | Claude: `/sync-guidelines` → copy to Assembler → Plugin: `sync-from-upstream.sh guidelines` |
| Everything | Assembler: `npm run sync` → Claude: `/sync-guidelines all` → Plugin: `sync-from-upstream.sh` |

### File sources

| File | Source | How it gets here |
|------|--------|-----------------|
| `docs/ds2026-components.md` | Assembler (auto-generated) | `sync-from-upstream.sh docs` |
| `docs/fm-components.md` | Assembler (auto-generated) | `sync-from-upstream.sh docs` |
| `docs/token-reference.md` | Assembler (semi-generated) | `sync-from-upstream.sh docs` |
| `docs/component-guidelines/*.json` | Assembler (Claude-extracted from Figma) | `sync-from-upstream.sh guidelines` |
| `docs/foundations/*.json` | Assembler (Claude-extracted from Figma) | `sync-from-upstream.sh foundations` |
| `tokens/tokens.css` | Assembler (generated) | `sync-from-upstream.sh tokens` |
| `tokens/actian-ds.tokens.json` | Assembler (Figma export) | `sync-from-upstream.sh tokens` |
| `docs/content-guidelines.md` | Assembler (curated) | `sync-from-upstream.sh docs` |
| `docs/accessibility-guidelines.md` | Assembler (curated) | `sync-from-upstream.sh docs` |
| `docs/presentation-*.md` | Hand-authored (this repo) | Local edit |
| `references/*.md` | Hand-authored (this repo) | Local edit |

## Feature comparison

| Feature | Claude Code CLI | Claude Desktop |
|---------|:-:|:-:|
| All 7 skills | Yes | Yes |
| Figma read (design context, screenshots) | Yes | Yes |
| Figma capture (`generate_figma_design`) | Yes (native) | Yes (via `claude -p` workaround) |
| Local server management | Automatic | Automatic |
| Hooks (auto-approve internal reads) | Yes | Yes |
| Cowork mode | N/A | Yes |

## DS Assembler (optional)

The `/generate-flow` and `/create-component` skills can assemble **real Figma component instances** from the published FM Kit library using the [Actian DS Assembler](https://github.com/volivarii/Actian-DS-Assembler) Figma plugin. Without it, these skills fall back to Plugin API (direct Figma JS) or HTML capture.

### Setup

```bash
# From the Assembler directory
cd ~/Developer/Actian/Actian-DS-Assembler
python3 serve.py 8765
```

Or if using Claude Code, the plugin handles this automatically via `scripts/ensure-server.sh`.

## Design system — two layers

| Layer | Font | Used by |
|-------|------|---------|
| **Fat Marker (lo-fi)** | Inter | `/generate-flow` wireframing |
| **DS2026 (hi-fi)** | Roboto | `/component-brief`, `/generate-presentation` specs |

3 theme modes: **Actian**, **Studio**, **Explorer** — tokens shift via `[data-theme]` CSS attribute.

## Architecture

### Shared skill references

Skills share common reference files to avoid duplication:

| Reference | Used by | Content |
|-----------|---------|---------|
| `references/figma-capture.md` | component-brief, generate-flow, generate-presentation | Figma capture procedure (serve, capture, CLI fallback, polling) |
| `references/fm-css-reference.md` | generate-flow | FM token palette, component CSS, HTML structure templates |
| `references/layout-spec-schema.md` | generate-flow, create-component | Assembler JSON schema, node types, FM Kit component names |
| `references/token-naming.md` | component-brief | `--zen-*` prefix mapping from Figma tokens |

### Execution models

| Skill | Mode | Pauses at |
|-------|------|-----------|
| compare-flows | Research + Audit, autonomous | Never (unless only 1 URL provided) |
| component-brief | Spec, autonomous | Never |
| create-component | Implement (Assembler or Plugin API) | Only if request is too vague |
| design-audit | Audit | Assembler physical gate (user runs plugin) |
| generate-flow | Implement with review gate | Screen list approval (Step 3) |
| generate-presentation | Implement with review gate | Review report before Figma push (Step 5) |
| sync-guidelines | Extract + Transform | Never (read-only sync) |

### Output modes (generate-flow, create-component)

| Mode | Output | Tokens | Library links | Best for |
|------|--------|--------|:---:|---|
| **Assembler** (default) | Real FM Kit instances | Figma variables | Yes | Production components |
| **Plugin API** (`use_figma`) | Raw Figma frames via JS | Hex with token comments | No | Quick prototyping |
| **HTML capture** | Flat vectors from HTML | CSS variables | No | Last resort |

## Quality & hygiene

Every skill output is validated against a 10-item quality checklist before completion:

1. Auto Layout / responsive sizing
2. Constraints / pin alignment
3. States (Hover, Pressed, Disabled, Focused)
4. Contrast (WCAG AA: 4.5:1 normal, 3:1 large)
5. Style check (100% tokens, zero hardcoded values)
6. Properties (clear naming)
7. Layer naming (no "Frame 102")
8. Instance cleanup
9. Hidden layer cleanup
10. Component documentation

Items 1-4 are P0 blockers. Source: [DS2026 Quality & Hygiene](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK/Actian-Design-System-v1.0.0?node-id=14793-7507)

## Token naming

All tokens use the `--zen-` prefix:

```
--zen-color-theme-primary       --zen-spacing-md
--zen-radius-default            --zen-shadow-xs
--zen-size-xl                   --zen-width-focus
--zen-font-body-standard        --zen-font-label-standard
```

## Project structure

```
actian-design-system-plugin/
├── .claude-plugin/
│   └── marketplace.json              # Marketplace index
│
├── plugins/actian-design-system/     # The plugin
│   ├── .claude-plugin/plugin.json    # Plugin manifest (v1.10.0)
│   ├── CLAUDE.md                     # Design system rules + data architecture
│   ├── hooks/hooks.json              # Auto-approve internal reads
│   │
│   ├── scripts/
│   │   ├── ensure-server.sh          # Local HTTP server management
│   │   └── sync-from-upstream.sh     # Fetch docs/tokens/guidelines from Assembler
│   │
│   ├── skills/                       # Plugin skills (7)
│   │   ├── generate-flow/
│   │   ├── component-brief/
│   │   │   └── templates/            # HTML skeleton templates (9 DS + 5 FM)
│   │   ├── design-audit/
│   │   ├── compare-flows/
│   │   ├── generate-presentation/
│   │   ├── create-component/
│   │   └── sync-guidelines/          # Extracts per-component docs from Figma
│   │
│   ├── references/                   # Shared skill references (hand-authored)
│   │   ├── figma-capture.md
│   │   ├── fm-css-reference.md
│   │   ├── layout-spec-schema.md
│   │   └── token-naming.md
│   │
│   ├── tokens/                       # Design tokens (synced from Assembler)
│   │   ├── actian-ds.tokens.json
│   │   └── tokens.css
│   │
│   └── docs/                         # Reference docs
│       ├── token-reference.md          # Synced from Assembler
│       ├── ds2026-components.md  # Synced from Assembler
│       ├── fm-components.md   # Synced from Assembler
│       ├── component-guidelines/     # Synced from Assembler (44 JSONs)
│       ├── content-guidelines.md     # Hand-authored
│       ├── accessibility-guidelines.md    # Hand-authored
│       ├── presentation-templates.md      # Hand-authored
│       └── presentation-content-guidelines.md  # Hand-authored
│
└── team/                             # Team resources
    ├── DISTRIBUTION.md
    └── prompt-templates/             # Copy-paste prompts for each skill (6)
```

## Maintaining

| What changed | What to do |
|-------------|------------|
| Tokens change in Figma | Assembler: `npm run sync` → Plugin: `./scripts/sync-from-upstream.sh tokens` |
| Components added/modified in Figma | Assembler: `npm run sync` → Plugin: `./scripts/sync-from-upstream.sh docs` |
| Content designer edits guidelines in Figma | Claude: `/sync-guidelines` → copy to Assembler → Plugin: `./scripts/sync-from-upstream.sh guidelines` |
| Generic content rules change | Edit `docs/content-guidelines.md` directly (hand-authored) |
| A11y rules change | Edit `docs/accessibility-guidelines.md` directly (hand-authored) |
| FM CSS reference needs update | Edit `references/fm-css-reference.md` directly (hand-authored) |
| New skill needed | Add `skills/<name>/SKILL.md` + prompt template in `team/prompt-templates/` |
| Bump version | Update `version` in `plugins/actian-design-system/.claude-plugin/plugin.json` |

**Versioning:** PATCH for fixes/docs, MINOR for new features/skills, MAJOR for breaking changes.

## Figma files

| File | Key |
|------|-----|
| [Actian Design System 2026](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK) | `l8biHxfarNi1I2RMvVxVOK` |
| [Fat Marker Kit](https://www.figma.com/design/X2JSEUyLvxyNCx22ucOexn) | `X2JSEUyLvxyNCx22ucOexn` |
| [Presentation Templates](https://www.figma.com/design/l7KNDEvTs22yr7xbymwoYe) | `l7KNDEvTs22yr7xbymwoYe` |
