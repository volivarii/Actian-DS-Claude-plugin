# Actian Design System Plugin

Claude plugin for the Actian UX team. Generate wireframe flows, create component specs, audit Figma files, and compare designs — powered by Claude + Figma MCP.

## Install

### Claude Desktop App (marketplace)

1. Open **Customize** in the sidebar
2. Under **Personal plugins**, click **+**
3. Select **Add a marketplace**
4. Enter: `volivarii/Actian-DS-Claude-plugin`
5. Click **Sync**

The plugin appears under your personal plugins. Enable it and you're ready to go.

### Claude Code CLI

```bash
claude plugin add volivarii/Actian-DS-Claude-plugin
```

### Connector required

This plugin requires the **Figma MCP** connector. If not already connected:

- **Claude Desktop:** Go to Customize → Connectors → add the Figma connector
- **Claude Code CLI:** `claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp`

## Skills

| Skill | What it does |
|-------|-------------|
| `/design-audit` | Audit a Figma file against DS2026 tokens, accessibility, and content conventions |
| `/component-brief` | Draft a 9-card DS2026 or 5-card Fat Marker component spec |
| `/generate-flow` | Generate a Fat Marker wireframe flow from a user story and push to Figma |
| `/compare-flows` | Compare two Figma flows with structured UX analysis and recommendations |

## Figma Component Assembler

`/generate-flow` defaults to assembling **real Figma component instances** from the published FM Kit library using the [Actian DS Assembler](https://github.com/volivarii/Actian-DS-Assembler) plugin. The output is editable, linked to the design system, and supports variant swapping.

Falls back to flat HTML capture if the assembler plugin is not installed.

### Setup (one-time)

1. Clone and build the [Actian DS Assembler](https://github.com/volivarii/Actian-DS-Assembler)
2. Import the plugin manifest in Figma (Plugins → Development → Import from manifest)
3. That's it — `/generate-flow` will automatically generate JSON specs for the assembler

## Try asking...

- "Generate a wireframe flow for user onboarding" — assembles real FM components in Figma
- "Build a flow for a data export feature with error states"
- "Create a 5-screen wizard for creating a new policy"
- "Generate a flow from this PDF spec" + attach a PDF
- "Use HTML mode to generate a login flow" — uses flat HTML capture instead of assembler
- "Audit this Figma screen for accessibility issues" + paste a Figma URL
- "Create a component brief for a dropdown select"
- "Compare these two Figma flows and recommend which to ship" + paste two Figma URLs

## Design system — two layers

| Layer | Font | Used by |
|-------|------|---------|
| **Fat Marker (lo-fi)** | Inter | `/generate-flow` wireframing |
| **DS2026 (hi-fi)** | Roboto | `/component-brief` specs |

3 theme modes: **Actian**, **Studio**, **Explorer** — tokens shift via `[data-theme]` CSS attribute.

## Token naming

All tokens use the `--zen-` prefix: `--zen-color-theme-primary`, `--zen-spacing-md`, `--zen-radius-default`, `--zen-shadow-xs`, `--zen-font-body-standard`.

## Project structure

```
actian-design-system-plugin/
├── .claude-plugin/
│   ├── plugin.json            # Plugin manifest
│   └── marketplace.json       # Marketplace index
├── settings.json              # Auto-allows Figma MCP tools
├── CLAUDE.md                  # Design system rules (loaded every session)
│
├── skills/                    # Plugin skills
│   ├── generate-flow/         #   Fat Marker flow generation
│   ├── component-brief/       #   9-card component brief
│   ├── design-audit/          #   Figma audit
│   ├── compare-flows/         #   Flow comparison
│   └── references/            #   Shared reference files
│
├── tokens/                    # Design tokens
│   ├── actian-ds.tokens.json  #   W3C DTCG format (source of truth)
│   └── tokens.css             #   CSS custom properties (--zen-*)
│
├── docs/                      # Human-readable reference docs
│   ├── design-system.md
│   ├── content-guidelines.md
│   └── accessibility-guidelines.md
│
└── team/                      # Team distribution resources
    ├── DISTRIBUTION.md
    └── prompt-templates/      # Copy-paste prompts for non-CLI users
```

## How it works

```
Figma design  →  Claude analyses  →  Team decides
      ↑                                     ↓
Editable frames  ←  Figma capture  ←  Claude generates HTML
```

1. Fetch design context from Figma via MCP
2. Claude generates HTML using Fat Marker or DS2026 tokens
3. Serve HTML locally (`python3 -m http.server 8765`)
4. Capture to Figma via `generate_figma_design`
5. Result: editable vector frames in the target Figma file

## Maintaining

| What changed | What to update |
|-------------|---------------|
| Tokens change in Figma | Re-export JSON to `tokens/`, regenerate `actian-ds.tokens.json` + `tokens.css`, update `docs/design-system.md` |
| FM Kit changes | Update `components/FATMARKER-COMPONENT-CATALOG.md` + FM CSS in generate-flow skill |
| Content rules change | Update `docs/content-guidelines.md` + `skills/references/content-guidelines.md` |
| A11y rules change | Update `docs/accessibility-guidelines.md` + `skills/references/accessibility-guidelines.md` |
| New skill needed | Add `skills/<name>/SKILL.md` |
| Bump version | Update `version` in `.claude-plugin/plugin.json` and `marketplace.json` |

After any update: `git commit` + `git push`. Users click **Update** in the desktop app, or run `git pull` in CLI.

## Figma files

| File | Key |
|------|-----|
| [Actian Design System 2026](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK) | `l8biHxfarNi1I2RMvVxVOK` |
| [Fat Marker Kit](https://www.figma.com/design/X2JSEUyLvxyNCx22ucOexn) | `X2JSEUyLvxyNCx22ucOexn` |
