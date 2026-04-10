# Actian Design System Plugin

> A design system teammate for the Actian UX team.

Built on Claude and connected directly to Figma, the Actian DS Plugin knows the design system — tokens, components, design & content guidelines, and the specific context of our apps. It can act on that knowledge and answer questions about it.

- Scaffold wireframe flows from a user story — Fat Marker lo-fi, correct app chrome, HTML preview with direct browser annotations before anything is pushed to Figma
- Convert wireframes to high-fidelity — reads FM screens from Figma, maps to real DS Kit components, pushes a production-ready hifi frame alongside the original
- Generate 9-card component briefs with real library instances from Figma — direct push using `setProperties` on live MetaKit instances (colored swatches, a11y requirement grids, contrast badges)
- Create new Figma components with variants, properties, and correct token binding
- Audit screens for token violations, spacing issues, and contrast failures — with inline fixes
- Review and rewrite copy against DS content guidelines
- Compare two competing designs side by side
- Research UX patterns and competitor approaches on demand
- Build presentations using Actian slide templates
- Sync tokens, components, and guidelines directly from Figma

The guidelines hold throughout — tokens, spacing, content rules, accessibility — but the output stays creative within them.

**v1.50.0** · 9 skills · 8 agents · 23 recipes · 115 design tokens · 3 themes · WCAG 2.1 AA

---

## Install

### Claude Desktop (recommended)

1. Open Claude Desktop > **Cowork** tab > **Customize**
2. Click **+** > add marketplace: `volivarii/Actian-DS-Claude-plugin`
3. Install **Actian Design System** from the marketplace

The plugin is available in both **Cowork** and **Code** tabs after install. At this time, **Code** is recommended for best results.

> **Figma integration:** The Figma MCP (`claude.ai Figma`) is built into Claude. On first use, you'll be prompted to authorize your Figma account — no additional setup required. Works with Figma files in the browser and Figma desktop.

### Claude Code CLI

```bash
claude plugin marketplace add volivarii/Actian-DS-Claude-plugin
claude plugin install actian-design-system@actian-design-system
```

### Auto-updates + permissions (optional)

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

### Updating the plugin

**Desktop:**

> **Known issue:** The built-in update mechanism for external marketplace plugins [does not reliably detect new versions](https://github.com/anthropics/claude-code/issues/38271). The cached version persists even after a new release is pushed.

1. Remove the marketplace: Customize > find marketplace > Remove
2. Re-add the marketplace: `volivarii/Actian-DS-Claude-plugin`
3. Install the plugin again

**CLI:**

```bash
claude plugin marketplace update actian-design-system
claude plugin update actian-design-system@actian-design-system
```

**Auto-update** (one-time): Run `/plugin` > **Marketplaces** tab > select Actian Design System > **Enable auto-update**. Updates are then applied at startup.

**Verify your version:** Ask the companion "what version are you running?"

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
Create an Explorer homepage with search hero, marketplace tiles, and topic cards
```

```
Design a Studio dashboard with popular items and watchlists
```

```
How would a data steward create a metadata quality policy?
```

The companion knows the canonical layout patterns for each screen type (dashboard, detail, browse, creation form, table view, data visualization, explorer homepage, overlays) and uses recipe skeletons for consistent structure while keeping full creative freedom.

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
| `/generate-flow` | Wireframe flow from a feature description — Fat Marker lo-fi, correct app chrome, HTML preview before push. Add `--hifi` to also generate a DS Kit version. |
| `/convert-to-hifi` | Convert an existing FM wireframe to high-fidelity — reads the Figma frame, maps FM components to DS Kit, pushes a new hifi frame alongside |
| `/component-brief` | 9-card component spec — anatomy, variants, states, tokens, content rules, accessibility, real library instances (deterministic pipeline) |
| `/design-audit` | Token, contrast, and guideline audit with inline fixes — not just a report |
| `/create-component` | Build Figma components with variants and correct token binding, with a build plan review before push |
| `/compare-flows` | Side-by-side analysis of two Figma flows — useful for v1 vs v2 or competing UX approaches |
| `/generate-presentation` | Slide deck with Actian templates, token-bound backgrounds, and chart support |
| `/sync-design-system` | Extract tokens, components, and guidelines directly from Figma via MCP |

---

## Preview and iteration

Every generation task pauses for review before pushing to Figma:

| Reply | What happens |
|-------|-------------|
| **`push`** | Send everything to Figma |
| **`push 2,4,5`** | Send specific items only |
| **`push and wire`** | Push + wire prototype connections automatically |
| **`prototype`** | Generate a clickable Alpine.js prototype for testing |
| **`playground`** | Generate a component state explorer with live token readout |
| **`apply annotations`** | Apply visual annotations from the browser |
| feedback | Describe changes, get updated output |

### Visual annotations

Instead of describing issues in text, click directly on any element in the preview:

1. Click **Annotate** in the preview toolbar
2. Click any element, type feedback, pick **Change** or **Note**
3. Click **Apply** in the browser, then say **"apply annotations"** in the CLI

Works at every preview gate across all skills.

---

## What the companion knows

The companion has always-loaded knowledge of:

- **Tokens** — spacing scale (4/8/12/16/24/28/32), 115 design tokens in W3C DTCG format, 3 theme modes, CSS custom properties (`--zen-*`)
- **Content rules** — sentence case, action verbs, error message patterns, empty state CTAs
- **App context** — Studio (integration/catalog), Explorer (discovery), Administration (settings/users)
- **Component inventory** — 107 DS Kit + 33 FM Kit + 25 Meta Kit components (synced registries with full properties)

It loads detailed references on demand: per-component guidelines (44 components), accessibility standards, UX patterns, foundation docs.

---

## Agents

Agents are dispatched automatically by skills — they run as background subprocesses and feed results back into the main task.

| Agent | What it does | When |
|-------|-------------|------|
| `flow-researcher` | Research UX patterns and competitors | Flow generation (opt-in research phase) |
| `flow-consistency` | Check HTML for chrome/terminology correctness | Flow generation (after HTML) |
| `wiring-analyzer` | Analyze flow structure for prototype wiring | Flow push (wire step) |
| `brief-data-validator` | Validate component brief data model | Brief generation (after data model) |
| `parity-analyzer` | Check Figma output for rendering issues | All skills (after push) |
| `card-generator` | Generate brief cards in parallel batches | Brief generation (6+ DS cards) |
| `screen-generator` | Generate flow screens in parallel batches | Flow generation (6+ screens) |
| `slide-generator` | Generate presentation slides in parallel batches | Presentation generation (6+ slides) |

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
| **Fat Marker (lo-fi)** | Inter | 33 FM Kit components | Wireframe flows |
| **DS Kit (hi-fi)** | Roboto | 107 component sets | Component briefs, audits |
| **Meta Kit** | Inter | 25 components + 3 templates | All output skills |

3 themes: **Actian**, **Studio**, **Explorer** — tokens switch via `[data-theme]` CSS or Figma variable modes.

**FM → HiFi pipeline:** `/convert-to-hifi` reads an FM wireframe from Figma, maps 28 FM components to DS Kit equivalents via `fm-to-ds-map.json`, and pushes a production-ready frame. Unmapped components are handled creatively by the LLM using DS Kit descriptions.

---

## Project structure

```
actian-design-system-plugin/
+-- plugins/actian-design-system/
|   +-- .claude-plugin/plugin.json
|   +-- CLAUDE.md
|   +-- skills/                          # 9 skills (companion + 8 specialized)
|   +-- agents/                          # 8 agents (5 validation + 3 parallel generation)
|   +-- scripts/
|   |   +-- shared-constants.js          # Registry loaders, key maps, palette, buildGenLog
|   |   +-- assemble-preview.js          # HTML preview generator from data models
|   |   +-- transform-to-hifi.js         # FM refs → DS Kit refs (deterministic transform)
|   |   +-- fm-tree-to-flow-data.js      # Raw Figma tree → flow-data format (key → ref resolution)
|   |   +-- merge-partials.js            # Merge parallel agent outputs
|   |   +-- templates.json               # Screen templates (admin, mobile, etc.)
|   |   +-- html-renderers/              # Client-side renderers for preview
|   +-- recipes/                         # Archetype skeletons for consistent output
|   |   +-- flow/                        # 9 flow screen archetypes
|   |   +-- brief/                       # 9 DS Kit card templates
|   |   +-- presentation/                # 5 slide type templates
|   +-- references/                      # DS context + skill-specific references
|   |   +-- companion-context.md         # Always-loaded DS summary
|   +-- templates/                       # CSS wrappers, annotation layer
|   +-- tokens/                          # W3C DTCG + CSS custom properties
|   +-- docs/                            # Synced reference files + component registries (*.json)
+-- USAGE.md                             # Detailed usage guide
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

---

## Feedback

This is the UX team's tool, built out of real work and iterated through real sessions. If something doesn't feel right — a skill misbehaves, an output misses the mark, a flow lands in the wrong app context — open an issue or reach out directly.
