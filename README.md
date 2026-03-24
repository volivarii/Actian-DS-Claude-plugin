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
| `/generate-flow` | Generate a Fat Marker wireframe flow from a user story and push to Figma |
| `/component-brief` | Draft a 9-card DS2026 or 5-card Fat Marker component spec |
| `/design-audit` | Audit a Figma file against DS2026 tokens, accessibility, and quality standards |
| `/compare-flows` | Compare two Figma flows with structured UX analysis and recommendations |
| `/generate-presentation` | Create a full slide deck from docs, research, Figma content, or a topic |
| `/create-component` | Build a new Figma component with variants (requires DS Assembler) |

You don't need to memorize commands. You can also ask naturally:

- "Generate a wireframe flow for user onboarding"
- "Create a component brief for the Button component" + paste Figma URL
- "Audit this Figma page for accessibility" + paste URL
- "Compare these two flows and recommend which to ship" + paste two URLs
- "Create a presentation about our Q1 accessibility findings" + attach a file

## How it works

1. **You describe what you need** — paste a Figma URL, attach a file, or describe the task
2. **Claude researches** — fetches Figma design context, reads your files, checks the design system
3. **Claude generates** — creates output using DS2026 tokens and Actian templates
4. **You review** — preview locally in the browser, approve or request changes
5. **Claude pushes to Figma** — captures the output into your target Figma file

All outputs use `--zen-*` design tokens across all three themes (Actian, Studio, Explorer). No hardcoded values.

## Feature comparison

| Feature | Claude Code CLI | Claude Desktop |
|---------|:-:|:-:|
| All 6 skills | Yes | Yes |
| Figma read (design context, screenshots) | Yes | Yes |
| Figma capture (`generate_figma_design`) | Yes (native) | Yes (via `claude -p` workaround) |
| Local server management | Automatic | Automatic |
| Hooks (auto-approve internal reads) | Yes | Yes |
| Cowork mode | N/A | Yes |

## DS Assembler (optional)

The `/generate-flow` and `/create-component` skills can assemble **real Figma component instances** from the published FM Kit library using the [Actian DS Assembler](https://github.com/volivarii/Actian-DS-Assembler) Figma plugin.

### Setup

The Assembler plugin needs a local server to load its component registry:

```bash
# From the Assembler directory
cd ~/Developer/Actian/Actian-DS-Assembler
python3 -m http.server 8765
```

Or if using Claude Code, the plugin handles this automatically via `scripts/ensure-server.sh`.

Without the Assembler, flow generation falls back to HTML capture mode.

## Design system — two layers

| Layer | Font | Used by |
|-------|------|---------|
| **Fat Marker (lo-fi)** | Inter | `/generate-flow` wireframing |
| **DS2026 (hi-fi)** | Roboto | `/component-brief`, `/generate-presentation` specs |

3 theme modes: **Actian**, **Studio**, **Explorer** — tokens shift via `[data-theme]` CSS attribute.

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
│   └── marketplace.json              # Marketplace index (only file here)
│
├── plugins/actian-design-system/     # The plugin
│   ├── .claude-plugin/plugin.json    # Plugin manifest
│   ├── CLAUDE.md                     # Design system rules
│   ├── hooks/hooks.json              # Auto-approve internal reads
│   ├── scripts/                      # ensure-server.sh
│   │
│   ├── skills/                       # Plugin skills
│   │   ├── generate-flow/
│   │   ├── component-brief/
│   │   │   └── templates/            # HTML skeleton templates (9 DS + 5 FM)
│   │   ├── design-audit/
│   │   ├── compare-flows/
│   │   ├── generate-presentation/
│   │   └── create-component/
│   │
│   ├── tokens/                       # Design tokens
│   │   ├── actian-ds.tokens.json     # W3C DTCG format (source of truth)
│   │   └── tokens.css                # CSS custom properties (--zen-*)
│   │
│   └── docs/                         # Reference docs
│       ├── design-system.md          # Token reference (3 themes)
│       ├── content-guidelines.md     # UI copy rules
│       ├── accessibility-guidelines.md
│       ├── fm-component-catalog.md   # 42 Fat Marker components
│       ├── presentation-templates.md
│       └── presentation-content-guidelines.md
│
└── team/                             # Team resources
    ├── DISTRIBUTION.md
    └── prompt-templates/             # Copy-paste prompts for each skill
```

## Maintaining

| What changed | What to update |
|-------------|---------------|
| Tokens change in Figma | Re-export JSON to `tokens/`, regenerate `actian-ds.tokens.json` + `tokens.css`, update `docs/design-system.md` |
| FM Kit changes | Update `docs/fm-component-catalog.md` + FM CSS in generate-flow skill |
| Content rules change | Edit `docs/content-guidelines.md` |
| A11y rules change | Edit `docs/accessibility-guidelines.md` |
| New skill needed | Add `skills/<name>/SKILL.md` + prompt template in `team/prompt-templates/` |
| Bump version | Update `version` in `plugins/actian-design-system/.claude-plugin/plugin.json` |

**Versioning:** PATCH for fixes/docs, MINOR for new features/skills, MAJOR for breaking changes.

## Figma files

| File | Key |
|------|-----|
| [Actian Design System 2026](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK) | `l8biHxfarNi1I2RMvVxVOK` |
| [Fat Marker Kit](https://www.figma.com/design/X2JSEUyLvxyNCx22ucOexn) | `X2JSEUyLvxyNCx22ucOexn` |
| [Presentation Templates](https://www.figma.com/design/l7KNDEvTs22yr7xbymwoYe) | `l7KNDEvTs22yr7xbymwoYe` |
