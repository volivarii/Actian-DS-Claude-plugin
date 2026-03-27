# Actian Design System Plugin

Claude plugin for the Actian UX team. Sync design tokens from Figma, generate wireframe flows, create component specs, audit designs, build presentations, and refine output — powered by Claude + Figma MCP.

**v1.15.0** | 9 skills | 115 design tokens | 3 themes | WCAG 2.1 AA

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

> All 9 skills work in Claude Desktop. The Figma MCP connector provides design context, screenshots, and `use_figma` write access.

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

### Generate

| Skill | What it does | How it helps |
|-------|-------------|-------------|
| `/generate-flow` | Wireframe flows from user stories. Includes competitor research, screen planning, and Figma output. | Go from a feature description to a complete flow in Figma. Research grounds decisions in real-world patterns instead of guessing. |
| `/component-brief` | 9-card DS2026 or 5-card Fat Marker spec — anatomy, tokens, API, states, accessibility, code. | Every variant, state, and token documented in one place. Designers and developers reference the same spec. |
| `/create-component` | Build a new Figma component with variants via Plugin API, with optional pattern research. | New components follow DS2026 conventions from the start — correct auto-layout, token binding, and naming. |
| `/generate-presentation` | Slide deck using Actian templates with charts and data visualizations. | Consistent decks that follow DS2026 typography, color, and layout without manual setup. |

### Review

| Skill | What it does | How it helps |
|-------|-------------|-------------|
| `/design-audit` | Audit a Figma screen against DS2026 tokens, WCAG AA, content guidelines, and forms layout. | Catch token mismatches, contrast failures, and guideline violations before handoff. Confidence-scored findings with evidence. |
| `/compare-flows` | Side-by-side comparison of two Figma flows with severity-rated issues. | Evaluate a redesign against the original, or choose between competing approaches with structured criteria. |
| `/fix-finding` | Fix a single audit finding in Figma — swap instances, bind tokens, align variants. | One-click resolution for audit findings without manual token lookup. |
| `/refine` | Fix Figma output after pushing — describe issues, read Figma comments, or re-run quality checks. | Iterate on pushed output without regenerating from scratch. Before/after screenshots on every fix. |

### Sync

| Skill | What it does | How it helps |
|-------|-------------|-------------|
| `/sync-design-system` | Extract components, variables, styles, guidelines, and tokens from Figma via MCP. | Keep local reference files in sync with Figma. Full sync, per-phase, or single-component granularity. |

---

## Workflow

Every skill that outputs to Figma follows the same loop:

```
1. Research + generate
   Skill reads tokens, guidelines, and Figma context,
   then generates an HTML preview.

2. Preview in browser
   Static preview served on localhost.
   Give feedback to iterate, or request an interactive
   prototype (flows) or state playground (components).

3. Push to Figma
   Approved content goes to Figma via use_figma.
   Automatic parity check flags clipping, missing
   content, or empty text.

4. Refine
   Review in Figma. Run /refine to fix issues with
   before/after verification, or leave Figma comments
   for /refine to read.
```

### Preview gate

All output skills pause before pushing to Figma. At the gate:

| Reply | What happens |
|-------|-------------|
| `"push"` | Send all content to Figma |
| `"push 2,4,5"` | Send only selected cards/screens |
| `"prototype"` | Generate an interactive flow prototype (click-through navigation, form simulation, branching paths) |
| `"playground"` | Generate a component state explorer (toggle states, switch themes, see active tokens) |
| `feedback` | Fix the HTML and re-preview |

Prototypes and playgrounds are served alongside the static preview. They use Alpine.js with no build step — open the URL and start testing.

### Post-push parity check

After every push, the skill automatically:
1. Screenshots each pushed element
2. Checks for clipping, empty text, and missing content
3. Reports findings and offers to fix issues inline

### /refine

After reviewing in Figma, run `/refine` to apply corrections:

```
/refine screen 3 header is too tall
/refine comments          # reads Figma annotations
/refine check             # re-runs the parity check
```

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

---

## Project structure

```
actian-design-system-plugin/
+-- plugins/actian-design-system/
|   +-- .claude-plugin/plugin.json
|   +-- CLAUDE.md
|   +-- skills/                          # 9 skills
|   +-- references/                      # Shared skill references
|   +-- templates/                       # Interactive preview templates
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
