# Actian Design System Plugin

Claude plugin for the Actian UX team. Describe a feature and get a full wireframe flow. Spec a component and get a 9-card brief with real library instances. Audit a screen and get token-level findings with one-click fixes. Test everything interactively before pushing to Figma.

**v1.17.1** | 7 skills | 115 design tokens | 3 themes | WCAG 2.1 AA

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
| `/component-brief` | 9-card DS2026 or 5-card Fat Marker spec — anatomy, tokens, API, states, accessibility, code. | Every variant, state, and token documented in one place. Use the interactive playground to toggle states and themes before pushing. |
| `/create-component` | Build a new Figma component with variants via Plugin API, with optional pattern research. | New components follow DS2026 conventions from the start — correct auto-layout, token binding, and naming. |
| `/generate-presentation` | Slide deck using Actian templates with charts and data visualizations. | Consistent decks that follow DS2026 typography, color, and layout without manual setup. |

### Review — catch issues, fix them in place

Audit any screen against DS2026 rules and fix findings directly. Compare two versions of a flow. Every fix comes with before/after screenshots.

| Skill | What it does | How it helps |
|-------|-------------|-------------|
| `/design-audit` | Audit a Figma screen against DS2026 tokens, WCAG AA, content guidelines, and forms layout. Fix findings inline — swap instances, bind tokens, align variants. | Catch and fix token mismatches, contrast failures, and guideline violations in one pass. Confidence-scored findings with evidence. |
| `/compare-flows` | Side-by-side comparison of two Figma flows with severity-rated issues. | Evaluate a redesign against the original, or choose between competing approaches with structured criteria. |

### Sync — keep everything current

The design system lives in Figma. Sync extracts it directly via MCP so skills always have current tokens, components, and guidelines.

| Skill | What it does | How it helps |
|-------|-------------|-------------|
| `/sync-design-system` | Extract components, variables, styles, guidelines, and tokens from Figma via MCP. | Full sync, per-phase, or single-component. No intermediary repos — Figma is the source of truth. |

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
| `"prototype"` | Generate an interactive flow prototype — click through screens, fill forms, test branching paths |
| `"playground"` | Generate a component state explorer — toggle states, switch themes, see which tokens are active |
| `"apply annotations"` | Read annotations from the browser preview, fix the HTML, and re-serve |
| `feedback` | Fix the HTML and re-preview |

### Browser annotations

Every preview includes an annotation layer. Click "Annotate" (bottom-right) to enter annotation mode — hover highlights elements, click opens a feedback popover. Mark annotations as **Change** (modify the HTML) or **Note** (carry forward to Figma without changing the preview). Click "Apply" in the browser, then say "apply" in the CLI. Claude applies changes and the page auto-refreshes with a "Changes applied" toast. Notes are preserved in the push manifest for the Figma output step.

### Post-push parity check

After every push, the skill automatically screenshots the Figma output and checks for common issues (clipped frames, empty text, missing children). P0 issues are flagged and can be fixed inline before the designer reviews.

---

## Data architecture

Figma libraries are the single source of truth. `/sync-design-system` extracts directly via MCP — no intermediary repos.

```
Figma libraries (DS2026 + FM Kit + Meta Kit)
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
| 1 — Components | `ds2026-components.md`, `fm-components.md`, `meta-kit/components.md` | Markdown |
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
| **DS2026 (hi-fi)** | Roboto | 97 component sets + 3 standalone | `/component-brief`, `/design-audit` |
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

| File | Key | Purpose |
|------|-----|---------|
| [Actian Design System v1.1.0](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK) | `l8biHxfarNi1I2RMvVxVOK` | DS2026 library |
| [Fat Marker Kit](https://www.figma.com/design/X2JSEUyLvxyNCx22ucOexn) | `X2JSEUyLvxyNCx22ucOexn` | Wireframe components |
| [Meta Kit](https://www.figma.com/design/osoeCLcrWqfoq8TvLQoyh0) | `osoeCLcrWqfoq8TvLQoyh0` | Skill-output components |
| [Template for projects](https://www.figma.com/design/l7KNDEvTs22yr7xbymwoYe) | `l7KNDEvTs22yr7xbymwoYe` | Presentation templates |

---

## Project structure

```
actian-design-system-plugin/
+-- plugins/actian-design-system/
|   +-- .claude-plugin/plugin.json
|   +-- CLAUDE.md
|   +-- skills/                          # 7 skills
|   +-- references/                      # Shared + skill-specific references
|   |   +-- component-brief/             # Data schema, renderers, Figma rules
|   |   +-- generate-flow/               # HTML reference, research guide
|   +-- tokens/                          # W3C DTCG + CSS custom properties
|   +-- docs/                            # Synced reference files
+-- docs/
    +-- superpowers/specs/               # Design specs
    +-- superpowers/plans/               # Implementation plans
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
