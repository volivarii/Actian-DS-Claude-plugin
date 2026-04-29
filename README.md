# Actian Design System Plugin

> A design system teammate for the Actian UX team.

Built on Claude and connected directly to Figma, the Actian DS Plugin knows the design system — tokens, components, design & content guidelines, and the specific context of our apps. It can act on that knowledge and answer questions about it.

## The core loop

**Sketch → Hifi → Audit.** Most design work flows through this loop.

1. **Sketch.** Describe a feature; get a Fat Marker lo-fi flow (one screen or many) with correct app chrome, structured around real layout patterns from the product.
2. **Hifi.** Convert the wireframe to high-fidelity — DS Kit components, real tokens, production-ready.
3. **Audit.** Check tokens, contrast, copy, and DS rules. Auto-fix what's safe, report what needs judgment.

Iterate inside the loop with **refine** (paste a screen-frame URL + edit instruction — only that screen is recreated, the rest stay byte-identical), **branch** (fork into a sibling for parallel exploration), or **variants** (three structurally-distinct alternatives side-by-side).

## Supporting capabilities

- Generate 9-card component briefs with real library instances from Figma — direct push using `setProperties` on live MetaKit instances (colored swatches, a11y requirement grids, contrast badges)
- Create new Figma components with variants, properties, and correct token binding
- Review and rewrite copy against DS content guidelines (`/design-audit --scope copy`)
- Compare two competing designs side by side (also works between branches and variants)
- Research UX patterns and competitor approaches on demand
- Build presentations using Actian slide templates
- Sync tokens, components, and guidelines directly from Figma

The guidelines hold throughout — tokens, spacing, content rules, accessibility — but the output stays creative within them.

**v1.57.0** · 9 skills (with tiered generation: recognized / adapted / improvised) · 8 agents · 25 recipes · 115 design tokens · 3 themes · WCAG 2.1 AA · surgical refine engine · vision-grounded references

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

Three input shapes cover almost everything. The companion routes; you don't memorize commands.

| Shape | Looks like | What you get |
|-------|------------|--------------|
| **Prompt** | "Design a connection setup wizard for Administration" | One screen or a flow, lo-fi or hifi, with the right app chrome |
| **URL + intent** | `<figma url>` + "rename CTA to Publish" / "make it hifi" / "audit the copy" | Surgical refine, hifi convert, scoped audit, branch, or iterate — picked from your prose |
| **URL + URL** | `<v1 url>` + `<v2 url>` + "compare these" | Side-by-side analysis routed to `/compare-flows` |

### Your first 30 minutes

```
Design a connection setup wizard for Administration
push
<screen-3 url>  rename "Submit" to "Connect" and tighten the help text
make it hifi
audit this --scope copy --fix all
```

Sketch → push → refine one screen → hifi → auto-fix copy. Every step is a single message. **Full walkthrough in [USAGE.md](USAGE.md#a-feature-from-sketch-to-ship--worked-example).**

### A few starting prompts

```
Design a Studio dashboard with popular items and watchlists
```

```
Show me three takes on the data contract creation page
```

```
https://figma.com/design/FILEKEY/File?node-id=123-456
review the copy in this screen
```

```
How do data platforms like Atlan and Collibra handle data lineage?
```

```
Find every empty state we use across DS Kit
```

```
Brief the Button component from https://figma.com/design/FILEKEY/DS?node-id=123-456
```

The companion knows canonical layout patterns (dashboard, detail, browse, creation form, table view, explorer homepage, overlays), the registries (107 DS Kit + 44 FM Kit + 25 Meta Kit), and the content guidelines. Naming a pattern in your prompt gets you the right skeleton on the first try.

---

## Power-user shortcuts

Every capability is also available as a direct command. Use these when you know exactly which pipeline you want.

**Core loop:**

| Command | What it does |
|---------|-------------|
| `/generate-flow` | Sketch — one or more lo-fi screens (n≥1), Fat Marker, correct app chrome. Flags: `--hifi` (chain to hifi), `--audit` (chain to audit), `--variants N` (2–5 structurally-distinct), `--ref <url>` (v1.57.0+: vision-grounded — screenshot the reference, extract a structural fingerprint, bias recipe + density), `--from <url>` (iterate), `--from <url> --branch X` (fork), `--states empty,error` (state coverage), `--breakpoints tablet,mobile` (responsive variants). URL + prose = refine shape (v1.56.0+: surgical — only changed screen frames are recreated, validator findings stay scoped). |
| `/convert-to-hifi` | Hifi — convert FM wireframe to DS Kit hifi. `--ref <url>` biases density/variant choices. |
| `/design-audit` | Audit — tokens, contrast, copy, a11y, heuristic. `--scope <copy\|tokens\|a11y\|heuristic>` narrows; `--fix N\|all` auto-applies. |

**Supporting:**

| Command | What it does |
|---------|-------------|
| `/component-brief` | 9-card component spec — anatomy, variants, states, tokens, content rules, accessibility, real library instances. `--include-states` adds a state matrix card. |
| `/create-component` | Build Figma components with variants and correct token binding, with a build plan review before push |
| `/compare-flows` | Side-by-side analysis of two Figma flows — v1 vs v2, competing approaches, branches, variants |
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
- **App context** — Studio (integration/catalog), Explorer (discovery), Administration (settings/users) — structured as queryable JSON with 16 entities, 33 terminology rules, 20 UI patterns
- **Component inventory** — 107 DS Kit + 44 FM Kit + 25 Meta Kit components (dynamically derived from synced registries)

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
| **Fat Marker (lo-fi)** | Inter | 44 FM Kit components | Wireframe flows |
| **DS Kit (hi-fi)** | Roboto | 107 component sets | Component briefs, audits |
| **Meta Kit** | Inter | 25 components + 3 templates | All output skills |

3 themes: **Actian**, **Studio**, **Explorer** — tokens switch via `[data-theme]` CSS or Figma variable modes.

**Pipeline quality gates:**
- **Flow glossary** — before generating screens, the skill builds a shared vocabulary (`_glossary`) with entity names, action verbs, and CTA labels. All parallel screen-generators use it, ensuring consistent terminology across screens.
- **Validation** — `validate-flow-data.js` runs before every push: banned placeholder text (P0, blocks push), unresolved token references (P1), and terminology violations checked against `app-context.json` (P1).
- **Scope-aware filtering** (v1.55.0+) — refines pass `--scope single-unit:<id>` so findings on untouched screens don't drown out findings on the screen the designer actually edited.
- **Refine engine** (v1.56.0+) — `resolve-unit.js` maps a Figma URL to a `pushedNodes` entry, `snapshot-store.js` reads/writes a `flow-data.snapshot.json` sidecar, `derive-scope.js` diffs before/after by `screens[].id` to produce the canonical scope tag. Surgical push deletes and recreates only the changed screen frames.
- **Vision-grounded references** (v1.57.0+) — `--ref <figma-url>` triggers SKILL step 4.5: `get_screenshot` → vision-extract a 4-field structural fingerprint (`density`, `hierarchy_depth`, `primary_components`, `layout_archetype`) → validate against `RECIPE_IDS` → persist on `meta.references[].fingerprint`. The screen-generator agent reads it as a precedence-ruled bias (prompt wins on feature intent; fingerprint biases layout/density and tie-breaks recipe selection). Refine path reuses the cached fingerprint when the URL is unchanged.
- **Design changelog** — `changelog.js` compares the current push against the previous `.last-push.json` manifest, reporting source data changes, token drift, and component additions/removals.

**FM → HiFi pipeline:** `/convert-to-hifi` reads an FM wireframe from Figma, maps FM components to DS Kit equivalents via `fm-to-ds-map.json`, and pushes a production-ready frame. Unmapped components are handled creatively by the LLM using DS Kit descriptions.

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
|   |   +-- shared-constants.js          # Registry loaders, dynamic key maps, palette, buildGenLog
|   |   +-- assemble-preview.js          # HTML preview generator from data models
|   |   +-- validate-flow-data.js        # Pipeline validation (banned text, tokens, terminology)
|   |   +-- changelog.js                 # Design changelog (push-to-push diffing)
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
|   |   +-- app-context.json             # Structured app context (apps, entities, terminology, patterns)
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
