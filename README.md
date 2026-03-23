# Actian Design System Plugin

Claude plugin for the Actian UX team. Generate wireframe flows, create component specs, audit Figma files, build presentations, and compare designs — powered by Claude + Figma MCP.

## Install

### Claude Desktop App

1. Open Claude Desktop (Code mode)
2. Run:
   ```
   /install-plugin https://github.com/volivarii/Actian-DS-Claude-plugin
   ```
3. Restart Claude Desktop

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
| `/generate-flow` | Generate a Fat Marker wireframe flow from a user story and push to Figma |
| `/component-brief` | Draft a 9-card DS2026 or 5-card Fat Marker component spec |
| `/design-audit` | Audit a Figma file against DS2026 tokens, accessibility, and quality standards |
| `/compare-flows` | Compare two Figma flows with structured UX analysis and recommendations |
| `/generate-presentation` | Create a full slide deck from docs, research, Figma content, or a topic |
| `/create-component` | Build a new Figma component with variants (requires DS Assembler — not yet available) |

You don't need to memorize commands. You can also ask naturally:

- "Generate a wireframe flow for user onboarding"
- "Create a component brief for the Button component" + paste Figma URL
- "Audit this Figma page for accessibility" + paste URL
- "Compare these two flows and recommend which to ship" + paste two URLs
- "Create a presentation about our Q1 accessibility findings" + attach a file
- "Generate a flow from this PDF spec" + attach a PDF

## How it works

1. **You describe what you need** — paste a Figma URL, attach a file, or describe the task
2. **Claude researches** — fetches Figma design context, reads your files, checks the design system
3. **Claude generates** — creates output using DS2026 tokens and Actian templates
4. **You review** — preview locally in the browser, approve or request changes
5. **Claude pushes to Figma** — captures the output into your target Figma file

All outputs use `--zen-*` design tokens across all three themes (Actian, Studio, Explorer). No hardcoded values.

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

Items 1–4 are P0 blockers. Source: [DS2026 Quality & Hygiene](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK/Actian-Design-System-v1.0.0?node-id=14793-7507)

## Presentation templates

`/generate-presentation` uses 5 official Actian slide templates at 1920x1080px:

| Template | Use for |
|----------|---------|
| Cover | Opening slide (dark gradient + geometric BG) |
| Body (Full) | Charts, diagrams, screenshots |
| Body (Text+Visual) | Written content + visual side by side |
| Section divider | Separating major sections (light gradient) |
| Back cover | Closing slide |

Charts and data visualizations are generated as CSS-only (no JS): stat cards, bar charts, donut charts, progress bars, timelines, flow diagrams.

## DS Assembler (coming soon)

`/generate-flow` and `/create-component` will support assembling **real Figma component instances** from the published FM Kit library using the Actian DS Assembler plugin. The output will be editable, linked to the design system, and support variant swapping.

Currently falls back to HTML capture for all flow generation.

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
│   ├── plugin.json              # Plugin manifest
│   ├── marketplace.json         # Marketplace index
│   ├── hooks/                   # PreToolUse hooks (auto-approve reads)
│   └── scripts/                 # ensure-server.sh (safe local server mgmt)
├── settings.json                # Auto-allows Figma MCP tools
├── CLAUDE.md                    # Design system rules (loaded every session)
│
├── skills/                      # Plugin skills
│   ├── generate-flow/           #   Fat Marker flow generation
│   ├── component-brief/         #   9-card component brief
│   ├── design-audit/            #   Figma audit
│   ├── compare-flows/           #   Flow comparison
│   ├── generate-presentation/   #   Presentation deck generation
│   ├── create-component/        #   Component creation (needs Assembler)
│   └── references/              #   Shared reference files (symlinks to docs/)
│
├── tokens/                      # Design tokens
│   ├── actian-ds.tokens.json    #   W3C DTCG format (source of truth)
│   └── tokens.css               #   CSS custom properties (--zen-*)
│
├── docs/                        # Human-readable reference docs
│   ├── design-system.md         #   Token reference (3 themes)
│   ├── content-guidelines.md    #   UI copy rules
│   ├── accessibility-guidelines.md  # WCAG 2.1 AA standards
│   ├── fm-component-catalog.md  #   42 Fat Marker components
│   ├── presentation-templates.md    # 5 slide template specs
│   └── presentation-content-guidelines.md  # Voice, tone, chart selection
│
└── team/                        # Team resources
    ├── DISTRIBUTION.md          #   Setup guide
    └── prompt-templates/        #   Copy-paste prompts for each skill
        ├── generate-flow.md
        ├── component-brief.md
        ├── design-audit.md
        ├── compare-flows.md
        └── generate-presentation.md
```

## Maintaining

| What changed | What to update |
|-------------|---------------|
| Tokens change in Figma | Re-export JSON to `tokens/`, regenerate `actian-ds.tokens.json` + `tokens.css`, update `docs/design-system.md` |
| FM Kit changes | Update `docs/fm-component-catalog.md` + FM CSS in generate-flow skill |
| Content rules change | Edit `docs/content-guidelines.md` (symlink updates skills automatically) |
| A11y rules change | Edit `docs/accessibility-guidelines.md` |
| New skill needed | Add `skills/<name>/SKILL.md` + prompt template in `team/prompt-templates/` |
| Bump version | Update `version` in both `.claude-plugin/plugin.json` and `marketplace.json` |

**Versioning:** PATCH for fixes/docs, MINOR for new features/skills, MAJOR for breaking changes. Always bump both files in the same commit.

## Upgrading

Run the install command again:
```
/install-plugin https://github.com/volivarii/Actian-DS-Claude-plugin
```
Then restart Claude Desktop.

## Figma files

| File | Key |
|------|-----|
| [Actian Design System 2026](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK) | `l8biHxfarNi1I2RMvVxVOK` |
| [Fat Marker Kit](https://www.figma.com/design/X2JSEUyLvxyNCx22ucOexn) | `X2JSEUyLvxyNCx22ucOexn` |
| [Presentation Templates](https://www.figma.com/design/l7KNDEvTs22yr7xbymwoYe) | `l7KNDEvTs22yr7xbymwoYe` |
