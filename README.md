# Actian Design System Plugin

> A design system teammate for the Actian UX team.

> **For AI agents:** Start at [`/llms.txt`](./llms.txt) for the canonical content index.

Built on Claude and connected directly to Figma, the Actian DS Plugin knows the design system — tokens, components, design & content guidelines, and the specific context of our apps. It can act on that knowledge and answer questions about it.

## The core loop

**Propose → Prototype → Audit.** Most design work runs through three skills, each handing a file to the next.

1. **Propose.** Paste a ticket; `/actian-ux-proposal` writes a proposal document (each decision the ticket forces, drawn inside the product, with options, a comparison, the pick and its cost) and the `intent.md` the PM owns.
2. **Prototype.** Describe a flow; `/actian-ux-prototype` draws a clickable HTML prototype in the real app from the design system's own markup, checks it and looks at every step. On request it pushes each screen to Figma as design system instances.
3. **Audit.** Point at a Figma frame; `/actian-ux-audit` lists every place it departs from the design system, with evidence and a fix, applies fixes on request, and writes `specs.md` from the final frame.

`/actian-ux` answers design system questions from the knowledge, citing the file, and names the skill that fits. Every skill also runs unattended: a question it would ask, or a look it cannot take, is written into its file as a flagged concern.

The guidelines hold throughout — tokens, spacing, content rules, accessibility — but the output stays creative within them.

DS knowledge (tokens, components, foundations, content + accessibility guidelines) is vendored from [`volivarii/actian-ds-knowledge`](https://github.com/volivarii/actian-ds-knowledge) — the canonical source-of-truth repo synced directly from Figma. The plugin pulls a pinned snapshot nightly via `vendor-snapshot.yml`.

4 skills · 463 design tokens · 3 themes · WCAG 2.2 AA · 333 DS Kit, 287 FM Kit and 28 Meta Kit components · 3 apps, 30 entities and 31 UX patterns in the app context · federated knowledge substrate

---

## Install

### Claude Desktop (recommended)

1. Open Claude Desktop > **Cowork** tab > **Customize**
2. Click **+** > add marketplace: `volivarii/Actian-DS-Claude-plugin`
3. Install **Actian Design System** from the marketplace

The plugin is available in both **Cowork** and **Code** tabs after install. At this time, **Code** is recommended for best results. In the Actian org's Cowork, the plugin cannot take screenshots of its own output (there is no browser in the Cowork sandbox, so the prototype hands over without looking at its page and names what you must look at), and updates arrive on their own: a version cannot be held there.

> **Figma integration:** The plugin's Figma read/write uses the `claude.ai Figma` connector. On **Claude Desktop / Cowork** it's built in — you'll be prompted to authorize your Figma account on first use (no separate install). On the **Claude Code CLI**, connect it via `/mcp` (it's a Claude-managed connector, surfaced under `/mcp`). Works with Figma files in the browser and Figma desktop.

### Claude Code CLI

```bash
claude plugin marketplace add volivarii/Actian-DS-Claude-plugin
claude plugin install actian-design-system@actian-design-system
```

### Prerequisites

For the plugin to produce real DS output (not hex fallbacks), you need:

- **A Figma file open** (in the browser or Figma desktop) — for canvas read/write.
- **A Figma editor seat with the DS / FM / Meta libraries enabled.** Without it — or if a file isn't connected to the libraries — output falls back to raw hex values instead of bound design-system styles. That's a setup issue, not a plugin bug.
- **The Figma MCP connected** — built in on Desktop / Cowork; on CLI connect via `/mcp` (see the Figma integration note above).
- **Node.js available** — used by the local preview/validation scripts. The plugin auto-resolves nvm / Volta / asdf / fnm / Homebrew / system installs; if it can't find node, install it from [nodejs.org](https://nodejs.org) or set `NODE_BIN`.

### Auto-updates + permissions (recommended for testers)

Add to `~/.claude/settings.json` — `autoUpdate: true` makes hot-fixes land automatically at session start (this is the simplest way to stay current during the test window):

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

Plugin auto-update works in current Claude Code (v2.1.x, June 2026+). Because this is a **third-party** marketplace, auto-update is **opt-in** — turn it on once and updates arrive automatically at session start (you'll be prompted to run `/reload-plugins`).

**Enable auto-update (recommended for testers):** either set `"autoUpdate": true` in the `extraKnownMarketplaces` block above, or run `/plugin` > **Marketplaces** tab > select Actian Design System > **Enable auto-update**.

**CLI — manual pull** (if you didn't enable auto-update):

```bash
claude plugin marketplace update actian-design-system
claude plugin update actian-design-system@actian-design-system
```

**Cowork / Desktop:** an org owner can turn on **Organization settings > Plugins > Sync automatically** (the GitHub marketplace then re-syncs whenever a PR merges); otherwise use the manual **Update** button. Changes reach each member on their next session (up to ~30 min). With automatic sync on, members cannot hold an older version.

**Fallback (rarely needed):** if an update still doesn't land, refresh the marketplace with `/plugin marketplace update` or, as a last resort, clear the cached copy and restart Claude:

```bash
rm -rf ~/.claude/plugins/cache/actian-design-system/actian-design-system/
```

(The cache is keyed by `cache/<marketplace>/<plugin>/` — here both are `actian-design-system`; verify the folder names if your path differs.)

**Verify your version:** Ask the companion "what version are you running?"

---

## How to work with the companion

Two input shapes cover almost everything. `/actian-ux` names the skill that fits; you don't memorize commands.

| Shape | Looks like | What you get |
|-------|------------|--------------|
| **Prompt** | "Design a connection setup wizard for Administration" / a pasted ticket | A clickable prototype in the right app, or a proposal document and `intent.md` |
| **URL + intent** | `<figma url>` + "audit this" / "fix finding 3" / "generate the specs" | An audit with a fix per finding, the fixes applied on request, or `specs.md` from the final frame |

### Your first 30 minutes

```
Design a connection setup wizard for Administration
push the screens to Figma
<screen-3 url>  audit this
fix finding 1
```

Prototype → push → audit → fix. Every step is a single message. **Full walkthrough in [USAGE.md](USAGE.md#a-feature-from-ticket-to-specs-worked-example).**

### A few starting prompts

```
Design a Studio dashboard with popular items and watchlists
```

```
DIP-I-496: show a logged-in user their roles and permissions, a few approaches
```

```
https://figma.com/design/FILEKEY/File?node-id=123-456
review the copy in this screen
```

```
What spacing goes between cards in a grid?
```

```
Find every empty state we use across DS Kit
```

The skills read the app patterns, the page recipes with their screenshots, the registries (333 DS Kit, 287 FM Kit and 28 Meta Kit components; 73, 33 and 11 component sets) and the content rules from the vendored knowledge.

---

## Power-user shortcuts

Every capability is also available as a direct command. Use these when you know exactly which skill you want.

**Core loop:**

| Command | What it does |
|---------|-------------|
| `/actian-ux` | Answers from the knowledge, citing each file; the rules every Actian design task follows; which skill fits. |
| `/actian-ux-proposal` | Propose: a document a PM or designer reads once (each decision the ticket forces, heaviest first, its options drawn inside the product as Fat Marker fragments, a comparison and the pick with its cost) and the `intent.md` the PM owns, both from one `proposal-data.json`. Business fields read "To fill by PM", never invented. HTML only, no Figma push. |
| `/actian-ux-prototype` | Prototype: a clickable HTML page of the flow in the real app, drawn from the design system's own markup, checked by `check-direct.js` and looked at step by step. On request, each screen is pushed to Figma through `figma-screen.js`. Seeds `specs.md` when no final Figma exists. |
| `/actian-ux-audit` | Audit: components, tokens, accessibility, copy, layout and states, each finding with the rule quoted, the fix and a confidence. Fixes one finding at a time on request, P0 first. Writes `specs.md` from the final frame. |

---

## Handover

Every skill ends with a handover that hides nothing: what is new, what was not checked, the open questions.

| Skill | Hands over |
|-------|-------------|
| `/actian-ux-proposal` | `proposal.html` and `intent.md`, both rendered from `proposal-data.json`; a follow-up edits the data file and renders both again |
| `/actian-ux-prototype` | `prototype.html` and a screenshot of every step; on request the Figma screens; `specs.md` seeded from the prototype when no final Figma exists |
| `/actian-ux-audit` | The findings table, the fixes applied, `specs.md` from the final frame and its check result |

`intent.md` and `specs.md` are checked by `scripts/validation/check-handover.js` against the knowledge's templates. Until the knowledge ships those templates, the scripts print `template not vendored yet` and exit 2, and the skills hand over without the file and say so.

---

## What the companion knows

The skills read the vendored knowledge (`vendor/`, indexed by `vendor/llms.txt`):

- **Tokens**: 463 design tokens in W3C DTCG format, 3 themes (Actian, Studio, Explorer), CSS custom properties (`--zen-*`)
- **Foundations**: `foundations.md` is the source of truth: the knowledge repo's CI regenerates 79 derived JSONs (color roles, spacing scale, type ramp, etc.) on every change
- **Content rules** — sentence case, action verbs, error message patterns, empty state CTAs
- **App context**: Studio (integration/catalog), Explorer (discovery), Administration (settings/users), a structured, queryable domain (3 apps, 30 entities with typed properties and a relationship graph, 31 named UX patterns, personas, terminology rules) that the prototype's brief is built from
- **Component inventory**: 333 DS Kit, 287 FM Kit and 28 Meta Kit components (73, 33 and 11 sets), from the synced registries
- **Component guidelines**: 61 per-component guideline docs (54 components and 7 registry-key aliases)

---

## Data architecture

Figma libraries are the single source of truth. `volivarii/actian-ds-knowledge` CI runs the syncs (`sync-from-figma.yml` daily at 07:00 UTC for registries, tokens, and foundations); the plugin vendors a pinned snapshot nightly (`vendor-snapshot.yml` at 09:00 UTC).

```
Figma libraries (DS Kit + FM Kit + Meta Kit) + foundations.md (UX-authored)
    |
volivarii/actian-ds-knowledge CI (sync-from-figma + foundations-derive)
    |
plugin's vendor/ snapshot (refreshed nightly via vendor-snapshot.yml)
    ├─ vendor/components/dist/registries/  -- DS Kit + FM Kit + Meta Kit registries
    ├─ vendor/components/dist/guidelines/  -- 61 per-component guideline docs (54 components + 7 aliases)
    ├─ vendor/foundations/            -- foundations.md + 79 derived JSONs
    ├─ vendor/tokens/                 -- DTCG + CSS custom properties
    ├─ vendor/{content,accessibility,app-context}/
    |
The four skills read at runtime
```

### Design system layers

| Layer | Font | Components | Used for |
|-------|------|-----------|----------|
| **Fat Marker (wireframe)** | Inter | 287 FM Kit components (33 sets) | Proposal mockups (`fm-*` fragments) |
| **DS Kit (hi-fi)** | Roboto | 333 DS Kit components (73 sets) | Prototypes, Figma pushes, audits |

3 themes: **Actian**, **Studio**, **Explorer** — tokens switch via `[data-theme]` CSS or Figma variable modes.

**Checks the skills run:**
- **One brief per prototype**: `prepare-flow.js --direct` writes one brief joining the app's rail and header, each step's captured page (its regions, notes and screenshot), the design system's own component markup and usage notes, the stylesheets, the icons and the content rules.
- **Prototype check**: `check-direct.js` checks the four author files; each finding and its fix is listed in `skills/actian-ux-prototype/prototype-files.md`. `look-direct.js` screenshots every step at two widths, and exits 2 when no browser answers.
- **Figma push**: `figma-screen.js` resolves every `var(--zen-...)` token in the screen's app theme and stops, naming the node, on a token it cannot resolve.
- **Proposal and handover**: `validate-proposal.js` checks `proposal-data.json`; `check-handover.js` checks `intent.md` and `specs.md` against the knowledge's templates.
- **Auto-bump on vendor refresh**: the nightly `vendor-snapshot.yml` bumps `plugin.json` whenever the knowledge snapshot changes.

---

## Project structure

`ARCHITECTURE.md` (plugin root) is the canonical map — skill→artifacts table, placement rules, and the source of truth when adding new skills, scripts, or references.

```
actian-design-system-plugin/
├── plugins/actian-design-system/
│   ├── .claude-plugin/plugin.json
│   ├── ARCHITECTURE.md                    # canonical map (read first)
│   ├── CLAUDE.md
│   ├── skills/                            # 4 skill cards, each with the files it needs beside it
│   ├── recipes/                           # flow recipes
│   ├── scripts/
│   │   ├── lib/                           # paths.js, shared-constants, registry loaders, palette, buildGenLog
│   │   ├── hooks/                         # Claude Code hook guards
│   │   ├── vendor/                        # vendor-snapshot pipeline (pulls knowledge repo)
│   │   ├── validation/                    # validate-flow-data, validate-schema, validate-proposal
│   │   ├── transformers/                  # fm-tree-to-flow-data, transform-to-hifi
│   │   ├── renderers/                     # assemble-preview + html-renderers + render-component-reference
│   │   ├── bridges/                       # proposal-to-flow: a proposal's picks as an actian-ux-prototype seed
│   │   └── changelog/                     # push-to-push diffing
│   ├── references/actian-ux-prototype/    # fm-to-ds-map.json + ds-components-authoring.md (data files scripts read)
│   ├── schemas/                           # JSON schemas (flow-data, proposal-data, proposal-evaluation)
│   ├── templates/                         # HTML wrappers (flow, annotation-layer, proposal-document)
│   ├── vendor/                            # pinned knowledge-repo snapshot — the DS substrate
│   │   ├── components/                    # registries (dskit/fmkit/metakit) + 61 guideline docs + bundles
│   │   ├── foundations/                   # foundations.md (source of truth) + 79 derived JSONs
│   │   ├── tokens/                        # W3C DTCG JSON + CSS custom properties
│   │   ├── accessibility/                 # per-section WCAG 2.2 AA docs
│   │   ├── content/                       # global.md + words-to-avoid.json
│   │   └── app-context/                   # app-context.json
│   └── docs/                              # llms-overview.md (AI orientation)
└── USAGE.md                               # detailed usage guide
```

---

## Development

### Setup

```bash
git clone https://github.com/volivarii/Actian-DS-Claude-plugin.git
cd Actian-DS-Claude-plugin
```

### Local testing

```bash
claude --plugin-dir plugins/actian-design-system
```

### Tests

```bash
npm test
```

Run from the repository root: the suite lives in `tests/`, outside the plugin directory, so it does not ship with the install.

### Maintaining

| What changed | What to do |
|-------------|------------|
| Tokens/components in Figma | Knowledge repo's `sync-from-figma.yml` runs nightly (07:00 UTC) and opens an additive PR; the plugin's `vendor-snapshot.yml` then propagates it (09:00 UTC) and auto-bumps `plugin.json`. To force a refresh, manually trigger `vendor-snapshot.yml` in the plugin repo. |
| Single component's guidelines | Edit upstream in `volivarii/actian-ds-knowledge` (`components/src/<slug>/`); the next vendor-snapshot pulls the change. |
| Foundation docs | Edit upstream in `volivarii/actian-ds-knowledge` (`foundations/src/*.md`); CI regenerates `foundations/dist/` on PR; the next vendor-snapshot pulls them. |
| New skill | Add `skills/<name>/SKILL.md` and update `ARCHITECTURE.md` Section 2 |
| Version bump | Handled automatically by `vendor-snapshot.yml` on knowledge-repo data change. Any other PR that changes a file under `plugins/actian-design-system/` bumps `.claude-plugin/plugin.json` by hand (CI gate `check-version-bump.js`); a change to `tests/` alone needs no bump. |

---

## Feedback

This is the UX team's tool, built out of real work and iterated through real sessions. If something doesn't feel right — a skill misbehaves, an output misses the mark, a flow lands in the wrong app context — open an issue or reach out directly.
