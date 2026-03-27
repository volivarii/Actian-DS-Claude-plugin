# Actian Design System Plugin

Claude plugin for the Actian UX team. Sync design tokens from Figma, generate wireframe flows, create component specs, audit designs, fix findings, build presentations, and compare flows — powered by Claude + Figma MCP.

**v1.14.0** | 8 skills | 115 design tokens | 3 themes | WCAG 2.1 AA

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

> All 8 skills work in Claude Desktop. The Figma MCP connector provides design context, screenshots, and `use_figma` write access.

### Auto-updates

Add to `~/.claude/settings.json`:

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

On new versions, Claude Code fetches at next startup automatically. Works in both CLI and Desktop.

### Manual update

**Claude Code CLI:**
```bash
/plugin marketplace update
```

**Claude Desktop:**
1. Open the **Cowork** tab
2. Click **Customize** in the left sidebar
3. Find **Actian Design System** under Personal plugins
4. Remove and re-add from GitHub if needed: `volivarii/Actian-DS-Claude-plugin`

## Skills

| Skill | What it does |
|-------|-------------|
| `/sync-design-system` | Extract components, variables, styles, guidelines, and tokens from Figma via MCP. Full sync, per-phase, or single-component. |
| `/design-audit` | Audit a Figma file against DS2026 tokens, WCAG AA, content guidelines, forms layout. Confidence scores, evidence standard, JSON output. |
| `/fix-finding` | Fix a single audit finding in Figma — swap instances, bind tokens, align variants. |
| `/generate-flow` | Generate Fat Marker wireframe flows from user stories with competitor research. |
| `/component-brief` | Create a 9-card DS2026 or 5-card Fat Marker component spec (anatomy, tokens, API, accessibility). |
| `/create-component` | Build a new Figma component with variants via Plugin API, with optional pattern research. |
| `/compare-flows` | Compare two Figma flows with severity-rated issues (P0/P1/P2) and concrete recommendations. |
| `/generate-presentation` | Create a slide deck using Actian presentation templates with charts and data visualizations. |

## Data architecture

Figma libraries are the single source of truth. `/sync-design-system` extracts directly via MCP — no intermediary repos.

```
Figma libraries (DS2026 + FM Kit + Meta Kit)
    ↓
/sync-design-system (Figma MCP)
    ↓
Plugin docs/ + tokens/ (static reference files)
    ↓
Skills read at runtime
```

**Dual format:** JSON is source of truth for skills. Markdown is auto-generated for human review.

### Sync commands

```bash
/sync-design-system all          # Full sync (all phases)
/sync-design-system components   # Single phase
/sync-design-system Button       # Single component guidelines
/sync-design-system validate     # Diff without overwriting
```

### Sync output

| Phase | Output | Format |
|-------|--------|--------|
| 1 — Components | `ds2026-components.md`, `fm-components.md`, `meta-kit/components.md` | Markdown |
| 2 — Variables | `meta-kit/variables.md` (115 vars, 3 themes) | Markdown |
| 3 — Styles | `meta-kit/text-styles.md`, `meta-kit/effect-styles.md` | Markdown |
| 4 — Tokens | `token-reference.md`, `tokens.css`, `actian-ds.tokens.json` | MD + CSS + JSON |
| 5 — Guidelines | `component-guidelines/*.json` (44 components) | JSON |
| 6 — Foundations | `foundations/*.json`, `content-guidelines.md`, `accessibility-guidelines.md` | JSON + MD |

## Design system layers

| Layer | Font | Components | Used by |
|-------|------|-----------|---------|
| **Fat Marker (lo-fi)** | Inter | 29 FM Kit components | `/generate-flow` |
| **DS2026 (hi-fi)** | Roboto | 77 component sets | `/component-brief`, `/design-audit` |
| **Meta Kit** | Inter | 6 skill-output components | All output skills |

3 themes: **Actian**, **Studio**, **Explorer** — tokens switch via `[data-theme]` CSS attribute or Figma variable modes.

## Token naming

All tokens use the `--zen-` prefix:

```
--zen-color-theme-primary         --zen-spacing-md
--zen-color-brand-primary         --zen-border-radius-default
--zen-size-xl                     --zen-border-width-focus
--zen-breakpoint-lg
```

## Figma files

| File | Key | Purpose |
|------|-----|---------|
| [Actian Design System v1.1.0](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK) | `l8biHxfarNi1I2RMvVxVOK` | DS2026 library |
| [Fat Marker Kit](https://www.figma.com/design/X2JSEUyLvxyNCx22ucOexn) | `X2JSEUyLvxyNCx22ucOexn` | Wireframe components |
| [Meta Kit](https://www.figma.com/design/osoeCLcrWqfoq8TvLQoyh0) | `osoeCLcrWqfoq8TvLQoyh0` | Skill-output components |
| [Template for projects](https://www.figma.com/design/l7KNDEvTs22yr7xbymwoYe) | `l7KNDEvTs22yr7xbymwoYe` | Presentation templates |

## Project structure

```
actian-design-system-plugin/
├── plugins/actian-design-system/
│   ├── .claude-plugin/plugin.json
│   ├── CLAUDE.md                        # Design system rules
│   │
│   ├── skills/                          # 8 skills
│   │   ├── sync-design-system/          # Figma MCP extraction (7 phases)
│   │   ├── design-audit/
│   │   ├── fix-finding/
│   │   ├── generate-flow/
│   │   ├── component-brief/
│   │   ├── create-component/
│   │   ├── compare-flows/
│   │   └── generate-presentation/
│   │
│   ├── references/                      # Shared skill references
│   │   ├── figma-output.md
│   │   ├── fm-css-reference.md
│   │   ├── quality-checklist.md
│   │   └── token-naming.md
│   │
│   ├── tokens/
│   │   ├── actian-ds.tokens.json        # W3C DTCG (source of truth)
│   │   └── tokens.css                   # CSS custom properties
│   │
│   └── docs/
│       ├── ds2026-components.md         # 77 component sets
│       ├── fm-components.md             # 29 FM Kit components
│       ├── token-reference.md
│       ├── content-guidelines.md
│       ├── accessibility-guidelines.md
│       ├── presentation-guide.md
│       ├── component-guidelines/        # 44 per-component JSONs
│       ├── foundations/                  # 11 foundation JSONs
│       └── meta-kit/                    # Components, variables, styles
│
└── docs/
    └── figma-mcp-architecture-plan.md
```

## Maintaining

| What changed | What to do |
|-------------|------------|
| Tokens/components in Figma | `/sync-design-system all` |
| Single component's guidelines | `/sync-design-system Button` |
| Foundation docs | `/sync-design-system foundations` |
| Presentation guide | Edit `docs/presentation-guide.md` |
| Shared skill patterns | Edit `references/*.md` |
| New skill | Add `skills/<name>/SKILL.md` |
| Version bump | Update `plugin.json` + `marketplace.json` |
