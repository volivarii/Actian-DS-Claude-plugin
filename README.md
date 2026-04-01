# Actian Design System Plugin

Point at anything in Figma and get help. Your design system teammate for spot fixes, flow generation, audits, research, and content review. Understands Actian's tokens, guidelines, components, and all three apps.

**v1.26.0** | 8 skills | 5 agents | 115 design tokens | 3 themes | WCAG 2.1 AA

## Install

### Step 1 — Add the marketplace

Run this in Claude Code (CLI or Desktop's Code tab):

```bash
claude plugin marketplace add volivarii/Actian-DS-Claude-plugin
```

Then install the plugin:

```bash
claude plugin install actian-design-system@actian-design-system
```

### Step 2 — Connect Figma

```bash
claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp
```

### Step 3 — Enable auto-updates + permissions

Add to `~/.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "actian-design-system": {
      "source": { "source": "github", "repo": "volivarii/Actian-DS-Claude-plugin" },
      "autoUpdate": true
    }
  },
  "enabledPlugins": {
    "actian-design-system@actian-design-system": true
  },
  "permissions": {
    "allow": [
      "Read(~/.claude/plugins/**)",
      "mcp__claude_ai_Figma__get_design_context",
      "mcp__claude_ai_Figma__get_metadata",
      "mcp__claude_ai_Figma__get_screenshot",
      "mcp__claude_ai_Figma__search_design_system",
      "mcp__claude_ai_Figma__use_figma"
    ]
  }
}
```

### Claude Desktop notes

The plugin works in Desktop's **Code tab**. The "Personal" tab uses a separate plugin system (Cowork) — ignore it.

If skills don't appear after install, update via CLI:

```bash
claude plugin marketplace update actian-design-system
```

Then restart Desktop.

> **Known issue (April 2026):** Desktop's plugin browser may not show skills correctly for third-party marketplace plugins ([#38008](https://github.com/anthropics/claude-code/issues/38008)). Skills still work when invoked — they just may not appear in the UI. Use the CLI for the most reliable experience.

### Manual update

**Claude Code CLI:** `/plugin marketplace update`

**Claude Desktop:** Cowork tab > Customize > find Actian Design System > remove and re-add from GitHub.

---

## How to work with the companion

Just describe what you need. Share a Figma URL, ask a question, or describe a task. The companion figures out what to do.

### Fix issues

```
https://figma.com/design/FILEKEY/File?node-id=123-456
the spacing in this card feels off
```

```
https://figma.com/design/FILEKEY/File?node-id=123-456
check the contrast on this form
```

```
Is this button using the right token?
https://figma.com/design/FILEKEY/File?node-id=123-456
```

The companion reads the Figma node, checks it against DS rules, and fixes what's wrong — or asks when it's ambiguous.

### Design screens and flows

```
Mock up a data product publishing flow in Studio
```

```
Design a settings page for Administration
```

```
How would a data steward create a metadata quality policy?
```

The companion runs the full generation pipeline: screen planning, HTML preview, Figma push.

### Review copy

```
https://figma.com/design/FILEKEY/File?node-id=123-456
review the copy in this screen
```

```
Write better empty state text for the connections page
```

### Research patterns

```
How do data platforms like Atlan and Collibra handle onboarding?
```

```
What's the best practice for wizard vs. inline form for multi-step setup?
```

### Document components

```
Brief the Button component from https://figma.com/design/FILEKEY/DS?node-id=123-456
```

```
Spec the Text Input component
```

### Compare designs

```
Which version is better for onboarding?
v1: https://figma.com/design/FILEKEY/File?node-id=111-222
v2: https://figma.com/design/FILEKEY/File?node-id=333-444
```

### Create components

```
Create a Data Product Card with Default, Hover, Selected states
Properties: title, description, quality score, owner avatar, domain tag
```

### Sync from Figma

```
Sync the design system
```

```
Sync the Button guidelines
```

---

## Power-user shortcuts

Every capability is also available as a direct command. Use these when you know exactly which pipeline you want.

| Command | What it does |
|---------|-------------|
| `/generate-flow` | Wireframe flow from a feature description |
| `/component-brief` | Structured component spec (9 DS Kit or 5 FM cards) |
| `/design-audit` | Token, contrast, and guideline audit with inline fixes |
| `/create-component` | Build Figma components with variants and properties |
| `/compare-flows` | Side-by-side comparison of two Figma flows |
| `/generate-presentation` | Slide deck with Actian templates |
| `/sync-design-system` | Extract tokens, components, and guidelines from Figma |

---

## Preview and iteration

Every generation task pauses for review before pushing to Figma:

| Reply | What happens |
|-------|-------------|
| **"push"** | Send everything to Figma |
| **"push 2,4,5"** | Send specific items only |
| **"preview"** | Open HTML preview first (for flows) |
| **"push and wire"** | Push + wire prototype connections |
| **"prototype"** | Generate clickable HTML prototype |
| **"playground"** | Generate component state explorer |
| **"apply annotations"** | Apply visual annotations from the browser |
| **feedback** | Describe changes, get updated output |

### Visual annotations

Instead of describing issues in text, click directly on any element in the preview:

1. Click **Annotate** in the preview toolbar
2. Click any element, type feedback, pick **Change** or **Note**
3. Click **Apply** in the browser, then say **"apply"** in the CLI

Works at every preview gate across all skills.

---

## What the companion knows

The companion has always-loaded knowledge of:

- **Tokens** — spacing scale (4/8/12/16/24/28/32), colors, typography, borders for all 3 themes
- **Content rules** — sentence case, action verbs, error message patterns, empty state CTAs
- **App context** — Studio (integration/catalog), Explorer (discovery), Administration (settings/users)
- **Component inventory** — 103 DS Kit + 40 FM Kit + Meta Kit templates

It loads detailed references on demand: per-component guidelines, accessibility standards, UX patterns, foundation docs.

### Three Actian apps

| App | Purpose | Users |
|-----|---------|-------|
| **Studio** | Data integration, catalog, quality, lineage | Data engineers, stewards |
| **Explorer** | Data discovery, search, browse, access requests | Analysts, data consumers |
| **Administration** | Users, connections, scanners, settings | Admins |

The companion uses the correct header, navigation, and terminology for each app.

---

## Agents

Agents are dispatched automatically by skills. They run as background subprocesses.

| Agent | What it does | When |
|-------|-------------|------|
| `flow-researcher` | Research UX patterns and competitors | Flow generation (research phase) |
| `flow-consistency` | Check HTML for chrome/terminology correctness | Flow generation (after HTML) |
| `wiring-analyzer` | Analyze flow structure for prototype wiring | Flow push (wire step) |
| `brief-data-validator` | Validate component brief data model | Brief generation (after data model) |
| `parity-analyzer` | Check Figma output for rendering issues | All skills (after push) |

---

## Data architecture

Figma libraries are the single source of truth. `/sync-design-system` extracts directly via MCP.

```
Figma libraries (DS Kit + FM Kit + Meta Kit)
    |
/sync-design-system (Figma MCP)
    |
Plugin docs/ + tokens/ (static reference files)
    |
Companion + skills read at runtime
```

### Design system layers

| Layer | Font | Components | Used for |
|-------|------|-----------|----------|
| **Fat Marker (lo-fi)** | Inter | 40 FM Kit components | Wireframe flows |
| **DS Kit (hi-fi)** | Roboto | 103 component sets | Component briefs, audits |
| **Meta Kit** | Inter | Templates + annotation markers | All output skills |

3 themes: **Actian**, **Studio**, **Explorer** — tokens switch via `[data-theme]` CSS or Figma variable modes.

---

## Project structure

```
actian-design-system-plugin/
+-- plugins/actian-design-system/
|   +-- .claude-plugin/plugin.json
|   +-- CLAUDE.md
|   +-- skills/                          # 8 skills (companion + 7 specialized)
|   +-- agents/                          # 5 agents (auto-dispatched)
|   +-- scripts/
|   |   +-- figma-codegen.js             # Shared Figma code generation library
|   |   +-- flow-to-figma.js             # Flow data → Figma plugin code
|   |   +-- brief-to-figma.js            # Brief data → Figma plugin code
|   |   +-- slide-to-figma.js            # Slide data → Figma plugin code
|   |   +-- templates.json               # Screen templates (admin, mobile, etc.)
|   |   +-- html-renderers/              # Client-side renderers for preview
|   +-- references/                      # DS context + skill-specific references
|   |   +-- companion-context.md         # Always-loaded DS summary
|   +-- templates/                       # CSS wrappers, annotation layer
|   +-- tokens/                          # W3C DTCG + CSS custom properties
|   +-- docs/                            # Synced reference files
+-- USAGE.md                             # Detailed usage guide
+-- docs/superpowers/                    # Design specs + implementation plans
```

---

## Development

### Setup

```bash
git clone https://github.com/volivarii/Actian-DS-Claude-plugin.git
cd Actian-DS-Claude-plugin/plugins/actian-design-system
cp .figma-keys.json.example .figma-keys.json
# Edit .figma-keys.json with your team's Figma file keys
```

### Local testing

```bash
claude --plugin-dir plugins/actian-design-system
```

### Maintaining

| What changed | What to do |
|-------------|------------|
| Tokens/components in Figma | `/sync-design-system all` |
| Single component's guidelines | `/sync-design-system Button` |
| Foundation docs | `/sync-design-system foundations` |
| New skill | Add `skills/<name>/SKILL.md` |
| Version bump | Update `.claude-plugin/plugin.json` |
