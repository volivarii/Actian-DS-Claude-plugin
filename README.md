# Actian Design System Plugin

> A design system teammate for the Actian UX team.

> **For AI agents:** Start at [`/llms.txt`](./llms.txt) for the canonical content index.

Built on Claude and connected directly to Figma, the Actian DS Plugin knows the design system — tokens, components, design & content guidelines, and the specific context of our apps. It can act on that knowledge and answer questions about it.

## The core loop

**Sketch → Hifi → Audit.** Most design work flows through this loop.

1. **Sketch.** Describe a feature; get a Fat Marker lo-fi flow (one screen or many) with correct app chrome, structured around real layout patterns from the product.
2. **Hifi.** Convert the wireframe to high-fidelity — DS Kit components, real tokens, production-ready.
3. **Audit.** Check tokens, contrast, copy, and DS rules. Auto-fix what's safe, report what needs judgment.

Iterate inside the loop with **refine** (paste a screen-frame URL + edit instruction — only that screen is recreated, the rest stay byte-identical), **branch** (fork into a sibling for parallel exploration), or **variants** (three structurally-distinct alternatives side-by-side).

## Supporting capabilities

- Generate component briefs with anatomy, tokens, specs, usage & content guidelines, accessibility requirements.
- Create new Figma components with variants, properties, and correct token binding
- Review and rewrite copy against DS content guidelines (`/design-audit --scope copy`)
- Compare two competing designs side by side (also works between branches and variants)
- Research UX patterns and competitor approaches on demand
- Build presentations using Actian slide templates

The guidelines hold throughout — tokens, spacing, content rules, accessibility — but the output stays creative within them.

DS knowledge (tokens, components, foundations, content + accessibility guidelines) is vendored from [`volivarii/actian-ds-knowledge`](https://github.com/volivarii/actian-ds-knowledge) — the canonical source-of-truth repo synced directly from Figma. The plugin pulls a pinned snapshot nightly via `vendor-snapshot.yml`.

**2026.7.13** · 8 skills (tiered generation: recognized / adapted / improvised) · 9 agents · 25 recipes · 155 design tokens across 8 collections · 3 themes · WCAG 2.2 AA · **substrate-grounded flow authoring** (app chrome, UX patterns, and entity relationships + typed properties → idiomatic lo-fi screens, with enum columns rendered as status pills) · real icon glyphs in generated flows (resolved from the vendored icon set instead of placeholder boxes) · surgical refine engine · vision-grounded references · interactive gates · federated knowledge substrate · component briefs with Section 1 supercard (anatomy + variation + tokens + specs / usages / content / motion / accessibility) — Section 6 (real platform examples) deferred

---

## Install

### Claude Desktop (recommended)

1. Open Claude Desktop > **Cowork** tab > **Customize**
2. Click **+** > add marketplace: `volivarii/Actian-DS-Claude-plugin`
3. Install **Actian Design System** from the marketplace

The plugin is available in both **Cowork** and **Code** tabs after install. At this time, **Code** is recommended for best results.

> **Figma integration:** The plugin's Figma read/write uses the `claude.ai Figma` connector. On **Claude Desktop / Cowork** it's built in — you'll be prompted to authorize your Figma account on first use (no separate install). On the **Claude Code CLI**, connect it via `/mcp` (it's a Claude-managed connector, surfaced under `/mcp`). Works with Figma files in the browser and Figma desktop.

### Claude Code CLI

```bash
claude plugin marketplace add volivarii/Actian-DS-Claude-plugin
claude plugin install actian-design-system@actian-design-system
```

### Prerequisites

For the plugin to produce real DS output (not hex fallbacks), you need:

- **Figma desktop running** — for canvas read/write.
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

**Cowork / Desktop:** an org owner can turn on **Organization settings > Plugins > Sync automatically** (the GitHub marketplace then re-syncs whenever a PR merges); otherwise use the manual **Update** button. Changes reach each member on their next session (up to ~30 min).

**Fallback (rarely needed):** if an update still doesn't land, refresh the marketplace with `/plugin marketplace update` or, as a last resort, clear the cached copy and restart Claude:

```bash
rm -rf ~/.claude/plugins/cache/actian-design-system/actian-design-system/
```

(The cache is keyed by `cache/<marketplace>/<plugin>/` — here both are `actian-design-system`; verify the folder names if your path differs.)

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

The companion knows canonical layout patterns (dashboard, detail, browse, creation form, table view, explorer homepage, overlays), the registries (287 DS Kit + 287 FM Kit + 28 Meta Kit components — 83 / 33 / 11 component sets), and the content guidelines. Naming a pattern in your prompt gets you the right skeleton on the first try.

---

## Power-user shortcuts

Every capability is also available as a direct command. Use these when you know exactly which pipeline you want.

**Core loop:**

| Command | What it does |
|---------|-------------|
| `/generate-flow` | Sketch — one or more lo-fi screens (n≥1), Fat Marker, correct app chrome. Interactive gates (v1.63.0+) replace most CLI flags: variants, ref, states, breakpoints, hifi/audit chaining are picked through prompt-flow. Still flag-callable: `--from <url>` (iterate), `--from <url> --branch X` (fork). URL + prose = refine shape (v1.56.0+: surgical — only changed screen frames are recreated, validator findings stay scoped). Vision-grounded `--ref <url>` (v1.57.0+) extracts a structural fingerprint and biases recipe + density. |
| `/convert-to-hifi` | Hifi — convert FM wireframe to DS Kit hifi. `--ref <url>` biases density/variant choices. |
| `/design-audit` | Audit — tokens, contrast, copy, a11y, heuristic. `--scope <copy\|tokens\|a11y\|heuristic>` narrows; `--fix N\|all` auto-applies. |

**Supporting:**

| Command | What it does |
|---------|-------------|
| `/component-brief` | Component spec organized into 6 sections (v1.67.0+): Header → §1 Anatomy / Variation / Tokens / Specs (single supercard with sub-section dividers and Draft tags on generated content) → §2 Usages → §3 Content guidelines & examples → §4 Motion (conditional, only when a motion pattern exists) → §5 Accessibility → §6 Real platform examples (deferred). Two-pass (v1.62.0+): Phase A transcribes synced guidelines into the data model with provenance badges; Phase B fills gaps and (opt-in) attaches cross-DS research insights. Stub-aware: components with auto-generated stub guidelines route through Phase B fallback and surface a stub footer cue. |
| `/create-component` | Build Figma components with variants and correct token binding, with a build plan review before push |
| `/compare-flows` | Side-by-side analysis of two Figma flows — v1 vs v2, competing approaches, branches, variants |
| `/generate-presentation` | Slide deck with Actian templates, token-bound backgrounds, and chart support |

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

- **Tokens** — 155 design tokens in W3C DTCG format across 8 collections (color, spacing, border, size, breakpoint, focus-ring, font, icon), 3 theme modes, CSS custom properties (`--zen-*`)
- **Foundations** — `foundations.md` is the source of truth (v1.60.0+): a CI workflow regenerates 8 derived JSONs (color roles, spacing scale, type ramp, etc.) on every change, with PR comments confirming the regen
- **Content rules** — sentence case, action verbs, error message patterns, empty state CTAs
- **App context** — Studio (integration/catalog), Explorer (discovery), Administration (settings/users) — a structured, queryable domain (3 apps, 30 entities with typed properties + a relationship graph, 30 named UX patterns, terminology rules) that now **grounds flow authoring** directly: chrome, patterns, entities, and properties are resolved into the flow before screens are generated
- **Component inventory** — 287 DS Kit + 287 FM Kit + 28 Meta Kit components (83 / 33 / 11 sets) — dynamically derived from synced registries
- **Component guidelines** — 56 per-component guideline docs (54 components + 2 registry-key aliases), all curated in the current snapshot; components without a doc fall back to per-category structural defaults

It loads detailed references on demand: per-component guidelines, accessibility standards, UX patterns, foundation docs.

---

## Agents

Agents are dispatched automatically by skills — they run as background subprocesses and feed results back into the main task.

| Agent | What it does | When |
|-------|-------------|------|
| `flow-researcher` | Research UX patterns and competitors | Flow generation (opt-in research phase) |
| `flow-consistency` | Check HTML for chrome/terminology correctness | Flow generation (after HTML) |
| `wiring-analyzer` | Analyze flow structure for prototype wiring | Flow push (wire step) |
| `brief-researcher` | Research cross-DS patterns (Material, Carbon, Polaris, Atlassian, Stripe) for brief gap-fill | Brief generation (opt-in via research gate) |
| `brief-data-validator` | Validate component brief data model | Brief generation (after data model) |
| `parity-analyzer` | Check Figma output for rendering issues | All skills (after push) |
| `card-generator` | Generate brief cards in parallel batches (Phase B only) | Brief generation (5+ Phase B cards) |
| `screen-generator` | Generate flow screens in parallel batches | Flow generation (6+ screens) |
| `slide-generator` | Generate presentation slides in parallel batches | Presentation generation (6+ slides) |

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
    ├─ vendor/components/dist/guidelines/  -- 56 per-component guideline docs (54 components + 2 aliases)
    ├─ vendor/foundations/            -- foundations.md + 8 derived JSONs
    ├─ vendor/tokens/                 -- DTCG + CSS custom properties
    ├─ vendor/{content,accessibility,presentation,app-context,fm-to-ds-map}/
    |
Companion + skills read at runtime
```

### Design system layers

| Layer | Font | Components | Used for |
|-------|------|-----------|----------|
| **Fat Marker (lo-fi)** | Inter | 287 FM Kit components (33 sets) | Wireframe flows |
| **DS Kit (hi-fi)** | Roboto | 287 DS Kit components (83 sets) | Component briefs, audits, hifi conversion |
| **Meta Kit** | Inter | 28 Meta Kit components (11 sets) | All output skills (cards, headers, badges) |

3 themes: **Actian**, **Studio**, **Explorer** — tokens switch via `[data-theme]` CSS or Figma variable modes.

**Pipeline quality gates:**
- **Foundations MD-as-SoT** (v1.60.0+) — `foundations.md` is the editable source; CI regenerates 8 derived JSONs and posts a PR comment confirming the regen.
- **Substrate-grounded glossary** — before generating screens, the skill resolves a shared `_glossary` directly from the structured `app-context.json` (deterministic resolvers under `scripts/lib/app-context/`): the app **chrome** (sidebar/header), the matched **UX pattern**, entity **relationships** (→ detail tabs + related sub-lists), and typed entity **properties** (→ table columns / form field labels, with `type:"enum"` columns rendered as status pills and dates formatted per the content guideline) — alongside entity names, action verbs, and CTA labels. All parallel screen-generators read it, so screens are idiomatic to the app rather than generic SaaS, with consistent terminology.
- **Validation** — `validate-flow-data.js` runs before every push: banned placeholder text (P0, blocks push), unresolved token references (P1), terminology violations checked against `app-context.json` (P1), avoid-word warnings from `vendor/content/dist/words-to-avoid.json` (non-blocking; `--skip-avoid-words` to suppress), plus non-blocking **grounding advisories** that flag when a flow drifts from the substrate — ungrounded chrome/patterns, or tables/forms that don't reflect the entity's relationships, properties, or typed (enum→pill) rendering.
- **Stub-aware brief validation** (v1.64.0+) — when a brief is generated against an auto-stub guideline, the validator downgrades severity for missing-content findings and adds a `stub-guideline-used` finding so the designer sees "this came from a stub" rather than "this is broken."
- **Scope-aware filtering** (v1.55.0+) — refines pass `--scope single-unit:<id>` so findings on untouched screens don't drown out findings on the screen the designer actually edited.
- **Refine engine** (v1.56.0+) — `resolve-unit.js` maps a Figma URL to a `pushedNodes` entry, `snapshot-store.js` reads/writes a `flow-data.snapshot.json` sidecar, `derive-scope.js` diffs before/after by `screens[].id` to produce the canonical scope tag. Surgical push deletes and recreates only the changed screen frames.
- **Vision-grounded references** (v1.57.0+) — `--ref <figma-url>` triggers a structural fingerprint extraction (`density`, `hierarchy_depth`, `primary_components`, `layout_archetype`) that biases recipe + density. Refine path reuses the cached fingerprint when the URL is unchanged.
- **Brief two-pass routing** (v1.62.0+) — Phase A transcribes the synced guideline into the brief data model and tags fields with `_source: figma | guideline | derived`; Phase B generates remaining cards, with optional `brief-researcher` insights tagged on `_research`. Provenance badges + research-insights sub-sections render in the brief output.
- **Auto-bump on sync** (v1.63.1+) — sync detects additive/breaking verdicts and bumps `plugin.json` automatically; missing component-guideline files are auto-stubbed (v1.64.0+) so new components land with a placeholder ready for authoring.
- **Design changelog** — `changelog.js` compares the current push against the previous `.last-push.json` manifest, reporting source data changes, token drift, and component additions/removals.

**FM → HiFi pipeline:** `/convert-to-hifi` reads an FM wireframe from Figma, maps FM components to DS Kit equivalents via `fm-to-ds-map.json` (resolved at runtime via immutable `dsKey`, v1.61.1+), and pushes a production-ready frame. Unmapped components are handled creatively by the LLM using DS Kit descriptions.

---

## Project structure

`ARCHITECTURE.md` (plugin root) is the canonical map — skill→artifacts table, placement rules, and the source of truth when adding new skills, scripts, or references.

```
actian-design-system-plugin/
├── plugins/actian-design-system/
│   ├── .claude-plugin/plugin.json
│   ├── ARCHITECTURE.md                    # canonical map (read first)
│   ├── CLAUDE.md
│   ├── skills/                            # 8 skills (companion + 7 specialized)
│   ├── agents/                            # parallel-generation + validation/research agents
│   ├── recipes/                           # flow + brief + presentation recipes
│   ├── scripts/
│   │   ├── lib/                           # paths.js, shared-constants, registry loaders, palette, buildGenLog
│   │   ├── hooks/                         # Claude Code hook guards
│   │   ├── vendor/                        # vendor-snapshot pipeline (pulls knowledge repo)
│   │   ├── validation/                    # validate-flow-data, validate-schema, validateBriefData
│   │   ├── transformers/                  # fm-tree-to-flow-data, transform-to-hifi
│   │   ├── renderers/                     # assemble-preview + html-renderers + render-component-reference
│   │   └── changelog/                     # push-to-push diffing
│   ├── references/
│   │   ├── figma/                         # MCP workflow, push patterns, parity, prototype, annotations
│   │   ├── ds-rules/                      # tokens, layout, component-instance rules, quality checklist
│   │   ├── context/                       # companion-context.md, knowledge bases
│   │   ├── component-brief/               # skill-specific
│   │   ├── create-component/              # skill-specific
│   │   ├── design-audit/                  # skill-specific
│   │   ├── generate-flow/                 # skill-specific
│   │   └── generate-presentation/         # skill-specific
│   ├── schemas/                           # JSON schemas (brief-data, flow-data, slide-data)
│   ├── templates/                         # HTML wrappers (flow, fm, component-playground, annotation-layer)
│   ├── vendor/                            # pinned knowledge-repo snapshot — the DS substrate
│   │   ├── components/                    # registries (dskit/fmkit/metakit) + 58 guideline docs + bundles
│   │   ├── foundations/                   # foundations.md (source of truth) + 8 derived JSONs
│   │   ├── tokens/                        # W3C DTCG JSON + CSS custom properties
│   │   ├── accessibility/                 # per-section WCAG 2.2 AA docs
│   │   ├── content/                       # global.md + words-to-avoid.json
│   │   └── app-context/                   # app-context.json
│   └── docs/                              # llms-overview.md (AI orientation) + superpowers/ (specs, plans, audits)
└── USAGE.md                               # detailed usage guide
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
| Tokens/components in Figma | Knowledge repo's `sync-from-figma.yml` runs nightly (07:00 UTC) and opens an additive PR; the plugin's `vendor-snapshot.yml` then propagates it (09:00 UTC) and auto-bumps `plugin.json`. To force a refresh, manually trigger `vendor-snapshot.yml` in the plugin repo. |
| Single component's guidelines | Edit upstream in `volivarii/actian-ds-knowledge` (`components/guidelines/<slug>.json`); the next vendor-snapshot pulls the change. |
| Foundation docs | Edit upstream in `volivarii/actian-ds-knowledge` (`foundations/foundations.md`); CI regenerates derived JSONs on PR; the next vendor-snapshot pulls them. |
| New skill | Add `skills/<name>/SKILL.md` and update `ARCHITECTURE.md` Section 2 |
| Version bump | Handled automatically by `vendor-snapshot.yml` on knowledge-repo data change; manual bumps in `.claude-plugin/plugin.json` |

---

## Feedback

This is the UX team's tool, built out of real work and iterated through real sessions. If something doesn't feel right — a skill misbehaves, an output misses the mark, a flow lands in the wrong app context — open an issue or reach out directly.
