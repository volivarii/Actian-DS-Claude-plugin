# Actian Design System Plugin

Claude plugin for the Actian UX team. Sync design tokens from Figma, generate wireframe flows, create component specs, audit designs, fix findings, build presentations, and compare flows — powered by Claude + Figma MCP.

**v1.13.3** | 9 skills | 115 design tokens | 3 themes | WCAG 2.1 AA

## Install

### Claude Code CLI

```bash
claude plugin add volivarii/Actian-DS-Claude-plugin

# Connect Figma MCP
claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp
```

### Claude Desktop

1. Open Claude Desktop
2. Go to **Settings** > **Extensions** > **Add from GitHub**
3. Enter: `volivarii/Actian-DS-Claude-plugin`
4. Enable the **Figma** connector under **Settings** > **Integrations**

> All 9 skills work in Claude Desktop. The Figma MCP connector provides design context, screenshots, and `use_figma` write access.

### Auto-updates

The plugin auto-updates on startup when configured. Add this to your `~/.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "actian-design-system": {
      "source": { "source": "github", "repo": "volivarii/Actian-DS-Claude-plugin" },
      "autoUpdate": true
    }
  }
}
```

When a new version is pushed, Claude Code fetches it at next startup and prompts you to run `/reload-plugins`. This works in both CLI and Desktop.

> `autoUpdate` is off by default for third-party marketplaces. You must set it to `true` explicitly.

## Skills

| Skill | What it does |
|-------|-------------|
| `/sync-design-system` | Extract components, variables, styles, guidelines, and tokens directly from Figma via MCP. Supports full sync, per-phase, or single-component granularity. |
| `/design-audit` | Audit a Figma file against DS2026 tokens, WCAG AA, content guidelines, forms layout. Confidence scores (0.0-1.0), evidence standard, JSON output. |
| `/fix-finding` | Fix a single audit finding in Figma — swap instances, bind tokens, align variants. Companion to design-audit. |
| `/generate-flow` | Generate Fat Marker wireframe flows from user stories with competitor research. Outputs to Figma via `use_figma`. |
| `/component-brief` | Create a 9-card DS2026 or 5-card Fat Marker component spec (anatomy, tokens, API, accessibility). |
| `/create-component` | Build a new Figma component with variants via Plugin API, with optional pattern research. |
| `/compare-flows` | Compare two Figma flows with severity-rated issues (P0/P1/P2) and concrete recommendations. |
| `/generate-presentation` | Create a slide deck using Actian presentation templates with charts and data visualizations. |

## Data architecture

Figma libraries are the single source of truth. The `/sync-design-system` skill extracts data directly via MCP tools — no intermediary repos.

```
Figma libraries (DS2026 + FM Kit + Meta Kit)
    |
    v
/sync-design-system (Figma MCP tools)
    |
    v
Plugin docs/ and tokens/ (static reference files)
    |
    v
Skills read at runtime
```

### Dual format strategy

- **JSON** = source of truth for skills (structured, queryable, composable)
- **Markdown** = auto-generated from JSON for human review (git-diffable)

### Syncing from Figma

```bash
# Full sync (all phases)
/sync-design-system all

# Single phase
/sync-design-system components
/sync-design-system variables
/sync-design-system styles
/sync-design-system foundations

# Single component guidelines
/sync-design-system Button

# Validate without overwriting
/sync-design-system validate
```

### What gets synced

| Phase | Output | Format |
|-------|--------|--------|
| 1 — Components | `ds2026-components.md`, `fm-components.md`, `meta-kit/components.md` | Markdown |
| 2 — Variables | `meta-kit/variables.md` (115 vars, 3 themes) | Markdown |
| 3 — Styles | `meta-kit/text-styles.md`, `meta-kit/effect-styles.md` | Markdown |
| 4 — Tokens | `token-reference.md`, `tokens.css`, `actian-ds.tokens.json` | MD + CSS + JSON |
| 5 — Guidelines | `component-guidelines/*.json` (44 components) | JSON |
| 6 — Foundations | `foundations/*.json`, `content-guidelines.md`, `accessibility-guidelines.md` | JSON + Markdown |

## Design system layers

| Layer | Font | Components | Used by |
|-------|------|-----------|---------|
| **Fat Marker (lo-fi)** | Inter | 31 FM Kit components | `/generate-flow` wireframing |
| **DS2026 (hi-fi)** | Roboto | 100 component sets | `/component-brief`, `/design-audit` |
| **Meta Kit** | Inter | 15 skill-output components | All output skills |

3 theme modes: **Actian**, **Studio**, **Explorer** — tokens switch via `[data-theme]` CSS attribute or Figma variable modes.

## Quality checklist

Every skill output is validated against a 12-item quality checklist (P0-P2):

1. Auto-layout on every frame (P0)
2. HUG/Fill sizing explicit (P0)
3. States complete (P0)
4. WCAG AA contrast (P0)
5. Style check — zero hardcoded values (P0)
6. Variable mode set — no ghost resolution (P1)
7. Properties named clearly (P1)
8. Layer naming descriptive (P1)
9. Instance cleanup (P1)
10. Hidden layer cleanup (P2)
11. Component description filled (P1)
12. Spacing from scale only (P1)

## Token naming

All tokens use the `--zen-` prefix:

```
--zen-color-theme-primary         --zen-spacing-md
--zen-color-brand-primary         --zen-border-radius-default
--zen-size-xl                     --zen-border-width-focus
--zen-breakpoint-lg
```

## Project structure

```
actian-design-system-plugin/
├── .claude-plugin/marketplace.json
├── plugins/actian-design-system/
│   ├── .claude-plugin/plugin.json       # v1.13.3
│   ├── CLAUDE.md                        # Design system rules
│   ├── hooks/hooks.json
│   │
│   ├── scripts/
│   │   └── ensure-server.sh             # Local HTTP server management
│   │
│   ├── skills/                          # 9 skills
│   │   ├── sync-design-system/          # Figma MCP extraction (7 phases)
│   │   ├── design-audit/
│   │   ├── fix-finding/                 # Audit→fix pipeline
│   │   ├── generate-flow/
│   │   ├── component-brief/
│   │   ├── create-component/
│   │   ├── compare-flows/
│   │   └── generate-presentation/
│   │
│   ├── references/                      # Shared skill references
│   │   ├── figma-output.md              # use_figma patterns, constraints
│   │   ├── fm-css-reference.md
│   │   ├── layout-spec-schema.md
│   │   ├── quality-checklist.md
│   │   └── token-naming.md
│   │
│   ├── tokens/                          # Design tokens
│   │   ├── actian-ds.tokens.json        # W3C DTCG format (source of truth)
│   │   └── tokens.css                   # CSS custom properties
│   │
│   └── docs/                            # Reference docs
│       ├── ds2026-components.md         # 100 component sets
│       ├── fm-components.md             # 31 FM Kit components
│       ├── token-reference.md           # Human-readable token ref
│       ├── content-guidelines.md        # Auto-generated from JSON
│       ├── accessibility-guidelines.md  # Auto-generated from JSON
│       ├── component-guidelines/        # 44 per-component JSONs
│       ├── foundations/                  # 11 foundation JSONs
│       ├── meta-kit/                    # Meta Kit catalog + variables
│       └── presentation-guide.md          # Slide templates + content guidelines
│
└── docs/
    └── figma-mcp-architecture-plan.md   # Architecture reference
```

## Figma files

| File | Key | Purpose |
|------|-----|---------|
| [Actian Design System v1.1.0](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK) | `l8biHxfarNi1I2RMvVxVOK` | DS2026 library |
| [Fat Marker Kit](https://www.figma.com/design/X2JSEUyLvxyNCx22ucOexn) | `X2JSEUyLvxyNCx22ucOexn` | Wireframe components |
| [Meta Kit](https://www.figma.com/design/osoeCLcrWqfoq8TvLQoyh0) | `osoeCLcrWqfoq8TvLQoyh0` | Skill-output components |
| [Template for projects](https://www.figma.com/design/l7KNDEvTs22yr7xbymwoYe) | `l7KNDEvTs22yr7xbymwoYe` | Presentation templates |

## Maintaining

| What changed | What to do |
|-------------|------------|
| Tokens/components in Figma | `/sync-design-system all` |
| Single component's guidelines | `/sync-design-system Button` |
| Foundation docs | `/sync-design-system foundations` |
| Presentation guide | Edit `docs/presentation-guide.md` |
| Shared skill patterns | Edit `references/*.md` |
| New skill | Add `skills/<name>/SKILL.md` |
| Version bump | Update `plugin.json` (PATCH for fixes, MINOR for features, MAJOR for breaking) |
