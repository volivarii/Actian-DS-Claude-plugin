# Actian Design System Plugin

Claude plugin for the Actian UX team. Describe a feature and get a full wireframe flow. Spec a component and get a 9-card brief with real library instances. Audit a screen and get token-level findings with one-click fixes. Test everything interactively before pushing to Figma.

**v1.18.2** | 7 skills | 5 agents | 115 design tokens | 3 themes | WCAG 2.1 AA

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

> All 7 skills work in Claude Desktop. The Figma MCP connector provides design context, screenshots, and `use_figma` write access.

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

### Manual update

**Claude Code CLI:** `/plugin marketplace update`

**Claude Desktop:** Cowork tab > Customize > find Actian Design System > remove and re-add from GitHub.

---

## Skills

### Generate — from idea to Figma

Describe what you need, review it in the browser, and push to Figma when it looks right. Every generation skill supports competitor research to ground decisions in real-world patterns, and previews everything locally before touching Figma.

| Skill | What it does | How it helps |
|-------|-------------|-------------|
| `/generate-flow` | Wireframe flows from user stories. Competitor research, screen planning, interactive prototype, Figma output. | Go from a feature description to a clickable flow. Test navigation, form validation, and branching paths in the browser before committing. |
| `/component-brief` | 9-card DS Kit or 5-card Fat Marker spec — anatomy, tokens, API, states, accessibility, code. | Every variant, state, and token documented in one place. Use the interactive playground to toggle states and themes before pushing. |
| `/create-component` | Build a new Figma component with variants via Plugin API, with optional pattern research. | New components follow DS Kit conventions from the start — correct auto-layout, token binding, and naming. |
| `/generate-presentation` | Slide deck using Actian templates with charts and data visualizations. | Consistent decks that follow DS Kit typography, color, and layout without manual setup. |

### Review — catch issues, fix them in place

Audit any screen against DS Kit rules and fix findings directly. Compare two versions of a flow. Every fix comes with before/after screenshots.

| Skill | What it does | How it helps |
|-------|-------------|-------------|
| `/design-audit` | Audit a Figma screen against DS Kit tokens, WCAG AA, content guidelines, and forms layout. Fix findings inline — swap instances, bind tokens, align variants. | Catch and fix token mismatches, contrast failures, and guideline violations in one pass. Confidence-scored findings with evidence. |
| `/compare-flows` | Side-by-side comparison of two Figma flows with severity-rated issues. | Evaluate a redesign against the original, or choose between competing approaches with structured criteria. |

### Sync — keep everything current

The design system lives in Figma. Sync extracts it directly via MCP so skills always have current tokens, components, and guidelines.

| Skill | What it does | How it helps |
|-------|-------------|-------------|
| `/sync-design-system` | Extract components, variables, styles, guidelines, and tokens from Figma via MCP. | Full sync, per-phase, or single-component. No intermediary repos — Figma is the source of truth. |

### Agents — autonomous helpers

Agents are dispatched automatically by skills to parallelize research, validate outputs, and analyze results. They run as subprocesses with restricted tool access.

| Agent | What it does | Dispatched by |
|-------|-------------|---------------|
| `flow-researcher` | Research UX patterns, competitor approaches, and Actian product context for a flow feature | generate-flow (Step 2) |
| `brief-data-validator` | Validate brief-data.json against schema — catch missing fields, truncated arrays, hardcoded values | component-brief (after Step 1.5) |
| `wiring-analyzer` | Analyze Figma flow structure and produce a prototype wiring plan (screens, buttons, overlays) | generate-flow (Step 5.5) |
| `flow-consistency` | Check generated flow HTML against app context — chrome, terminology, empty states, feature focus | generate-flow (after Step 4) |
| `parity-analyzer` | Analyze Figma screenshots for clipping, empty text, missing children, layout problems | All skills (parity check step) |

---

## Workflow

Every skill that outputs to Figma follows the same loop. The goal is to catch problems early (when they're cheap to fix) and give designers control at every step.

```
1. Research + data model
   Skill reads tokens, guidelines, and Figma context,
   then structures everything into a JSON data model.

2. Preview + annotate
   HTML rendered from the data model, served on localhost.
   Click "Annotate" to mark issues on elements. Generate
   an interactive prototype or state playground. Feedback
   edits the data model — both HTML and Figma stay in sync.

3. Push to Figma
   Approved content goes to Figma via MCP using micro-task
   checklists assembled from the data model. Automatic
   parity check catches clipping, missing content, or
   empty text before declaring success.
```

### Preview gate

All output skills pause before pushing to Figma. This is where most iteration happens — HTML previews are free and fast, Figma output costs MCP calls and is harder to undo.

| Reply | What happens |
|-------|-------------|
| `"push"` | Send all content to Figma |
| `"push 2,4,5"` | Send only selected cards/screens |
| `"push and wire"` | Push + wire prototype connections — flow becomes playable in Figma Presentation mode |
| `"prototype"` | Generate an interactive flow prototype — click through screens, fill forms, test branching paths |
| `"playground"` | Generate a component state explorer — toggle states, switch themes, see which tokens are active |
| `"apply annotations"` | Apply visual annotations from the browser preview (see below) |
| `feedback` | Fix the HTML and re-preview |

### Visual annotations — point at what needs changing

Instead of describing issues in text, click directly on any element in the preview and annotate it. The plugin fixes exactly what you pointed at.

1. Click **Annotate** in the preview toolbar
2. Hover over any element — it highlights with a blue outline and shows its name
3. Click → type your feedback → pick **Change** or **Note** → Save
4. Repeat for as many elements as you want
5. Click **Apply** in the browser, then say **"apply"** in the CLI
6. Every change is applied and the page auto-refreshes

**Change** = modify the element ("make this a primary button", "change text to 'Save draft'"). **Note** = carry forward to Figma without changing the preview. Notes are preserved in the push manifest.

This works at every preview gate across all skills — flows, briefs, presentations.

### Post-push parity check

After every push, the skill automatically screenshots the Figma output and checks for common issues (clipped frames, empty text, missing children). P0 issues are flagged and can be fixed inline before the designer reviews.

---

## Data architecture

Figma libraries are the single source of truth. `/sync-design-system` extracts directly via MCP — no intermediary repos.

```
Figma libraries (DS Kit + FM Kit + Meta Kit)
    |
/sync-design-system (Figma MCP)
    |
Plugin docs/ + tokens/ (static reference files)
    |
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
| 1 — Components | `dskit-components.md`, `fm-components.md`, `meta-kit/components.md` | Markdown |
| 2 — Variables | `meta-kit/variables.md` (115 vars, 3 themes) | Markdown |
| 3 — Styles | `meta-kit/text-styles.md`, `meta-kit/effect-styles.md` | Markdown |
| 4 — Tokens | `token-reference.md`, `tokens.css`, `actian-ds.tokens.json` | MD + CSS + JSON |
| 5 — Guidelines | `component-guidelines/*.json` (44 components) | JSON |
| 6 — Foundations | `foundations/*.json`, `content-guidelines.md`, `accessibility-guidelines.md` | JSON + MD |

---

## Design system layers

| Layer | Font | Components | Used by |
|-------|------|-----------|---------|
| **Fat Marker (lo-fi)** | Inter | 34 FM Kit components | `/generate-flow` |
| **DS Kit (hi-fi)** | Roboto | 97 component sets + 3 standalone | `/component-brief`, `/design-audit` |
| **Meta Kit** | Inter | 16 components + 5 templates | All output skills |

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

| File | Config key | Purpose |
|------|-----------|---------|
| Actian Design System v1.1.0 | `dsKit` | DS Kit library |
| Fat Marker Kit | `fmKit` | Wireframe components |
| Meta Kit | `metaKit` | Skill-output components |
| Template for projects | `templates` | Presentation templates |

File keys are stored in `.figma-keys.json` (gitignored). Copy `.figma-keys.json.example` and fill in your team's keys.

---

## Project structure

```
actian-design-system-plugin/
+-- plugins/actian-design-system/
|   +-- .claude-plugin/plugin.json
|   +-- CLAUDE.md
|   +-- skills/                          # 7 skills
|   +-- agents/                          # 5 agents (auto-dispatched by skills)
|   +-- references/                      # Shared + skill-specific references
|   |   +-- component-brief/             # Data schema, renderers, Figma rules, playground
|   |   +-- generate-flow/               # HTML reference, research guide
|   |   +-- generate-presentation/       # Slide templates and chart types
|   +-- templates/                       # CSS wrappers, annotation layer, prototype/playground
|   +-- tokens/                          # W3C DTCG + CSS custom properties
|   +-- docs/                            # Synced reference files
+-- docs/
    +-- superpowers/specs/               # Design specs
    +-- superpowers/plans/               # Implementation plans
```

---

## Development

### Setup

Clone the repo and configure Figma file keys:

```bash
git clone https://github.com/volivarii/Actian-DS-Claude-plugin.git
cd Actian-DS-Claude-plugin/plugins/actian-design-system
cp .figma-keys.json.example .figma-keys.json
# Edit .figma-keys.json with your team's Figma file keys
```

Keys are found in Figma URLs: `figma.com/design/<FILE_KEY>/...`. The config maps 5 libraries: `dsKit`, `fmKit`, `metaKit`, `templates`, `designConsistency`.

### Local testing

```bash
# Test with the plugin directory
claude --plugin-dir plugins/actian-design-system
```

### Maintaining

| What changed | What to do |
|-------------|------------|
| Tokens/components in Figma | `/sync-design-system all` |
| Single component's guidelines | `/sync-design-system Button` |
| Foundation docs | `/sync-design-system foundations` |
| Presentation guide | Edit `docs/presentation-guide.md` |
| Shared skill patterns | Edit `references/*.md` |
| New skill | Add `skills/<name>/SKILL.md` |
| Version bump | Update `.claude-plugin/plugin.json` |

### Release notes

Generate from git log and format for Slack: ask Claude "generate release notes" or see `CLAUDE.md` § Release Notes.
