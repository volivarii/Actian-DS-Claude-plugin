# Actian Design System Plugin

Claude Code plugin for the Actian UX team. Generate wireframe flows, create component specs, audit Figma files, and compare designs — powered by Claude Code + Figma MCP.

## Install

```bash
# Install the plugin (one-time)
claude plugin add /path/to/actian-design-system-plugin

# Or test locally without installing
claude --plugin-dir /path/to/actian-design-system-plugin
```

Then connect Figma MCP (one-time):
```bash
claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp
```

## Update

```bash
cd /path/to/actian-design-system-plugin
git pull    # Get latest skills, tokens, references
```

Claude Code picks up changes on next session. Run `/reload-plugins` to reload mid-session.

## Skills

| Skill | What it does |
|-------|-------------|
| `/actian-design-system:generate-flow` | Generate a Fat Marker wireframe flow and push to Figma |
| `/actian-design-system:component-brief` | Draft a 9-card DS2026 or 5-card FM component spec |
| `/actian-design-system:design-audit` | Audit a Figma file against DS2026 conventions |
| `/actian-design-system:compare-flows` | Compare two Figma flows with structured analysis |

## Project structure

```
actian-design-system-plugin/
├── .claude-plugin/plugin.json     # Plugin manifest (name, version, description)
├── settings.json                  # Auto-allows Figma MCP tools on install
├── CLAUDE.md                      # Design system rules (loaded every session)
├── README.md                      # This file
│
├── skills/                        # Plugin skills
│   ├── generate-flow/SKILL.md     #   Fat Marker flow generation
│   ├── component-brief/SKILL.md   #   9-card component brief
│   ├── design-audit/SKILL.md      #   Figma audit
│   ├── compare-flows/SKILL.md     #   Flow comparison
│   └── references/                #   Shared reference files (loaded on demand)
│       ├── design-system.md       #     Token reference (3 themes)
│       ├── content-guidelines.md  #     UI copy rules
│       ├── accessibility-guidelines.md  # WCAG 2.1 AA standards
│       └── fm-component-catalog.md     # 42 FM wireframe components
│
├── tokens/                        # Design tokens
│   ├── actian-ds.tokens.json      #   W3C DTCG format (source of truth)
│   └── tokens.css                 #   CSS custom properties (--zen-*)
│
├── docs/                          # Human-readable reference docs
│   ├── design-system.md
│   ├── content-guidelines.md
│   └── accessibility-guidelines.md
│
├── components/                    # Component specs + flows (HTML)
│   ├── FATMARKER-COMPONENT-CATALOG.md
│   ├── button/button-spec.html
│   ├── link/link-spec.html
│   ├── text-input/text-input-spec.html
│   ├── sticky-footer/sticky-footer-spec.html
│   └── flows/
│       ├── login-flow.html
│       └── data-product-builder-flow.html
│
├── prototypes/                    # Standalone HTML prototypes
│   └── studio-dashboard.html
│
└── team/                          # Team distribution resources
    ├── DISTRIBUTION.md
    └── prompt-templates/          # Copy-paste prompts for Claude Desktop
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

## Design system — two layers

| Layer | Font | Used by |
|-------|------|---------|
| **Fat Marker (lo-fi)** | Inter | `/generate-flow` wireframing |
| **DS2026 (hi-fi)** | Roboto | `/component-brief` specs |

3 theme modes: **Actian**, **Studio**, **Explorer** — tokens shift via `[data-theme]` CSS attribute.

## Token naming

All tokens use the `--zen-` prefix: `--zen-color-theme-primary`, `--zen-spacing-md`, `--zen-radius-default`, `--zen-shadow-xs`, `--zen-font-body-standard`.

## Maintaining

| What changed | What to update |
|-------------|---------------|
| Tokens change in Figma | Re-export JSON to `tokens/`, regenerate `actian-ds.tokens.json` + `tokens.css`, update `docs/design-system.md` |
| FM Kit changes | Update `components/FATMARKER-COMPONENT-CATALOG.md` + FM CSS in generate-flow skill |
| Content rules change | Update `docs/content-guidelines.md` + `skills/references/content-guidelines.md` |
| A11y rules change | Update `docs/accessibility-guidelines.md` + `skills/references/accessibility-guidelines.md` |
| New skill needed | Add `skills/<name>/SKILL.md` |
| Bump version | Update `version` in `.claude-plugin/plugin.json` |

After any update: `git commit` + `git push`. Teammates run `git pull` to get the latest.

## Figma files

| File | Key |
|------|-----|
| [Actian Design System 2026](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK) | `l8biHxfarNi1I2RMvVxVOK` |
| [Testing V1 DS](https://www.figma.com/design/8Yu8wUtPTXsa3iV6R4TmnS) | `8Yu8wUtPTXsa3iV6R4TmnS` |
| [Fat Marker Kit](https://www.figma.com/design/X2JSEUyLvxyNCx22ucOexn) | `X2JSEUyLvxyNCx22ucOexn` |
| [Policies 2025](https://www.figma.com/design/2WF4POyRBXKEJ5zSLIu8pn) | `2WF4POyRBXKEJ5zSLIu8pn` |
