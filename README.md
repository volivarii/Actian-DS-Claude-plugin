# Actian Design System Plugin

A Claude-powered design toolkit for the Actian UX team. From first wireframe to final spec — generate flows, test them interactively, push to Figma, and refine without starting over.

**v1.15.0** | 9 skills | 115 design tokens | 3 themes | WCAG 2.1 AA

---

## What designers get

**Go from idea to Figma in minutes.** Describe a feature, get a full wireframe flow. Spec a component, get a 9-card brief with real library instances. Audit a screen, get token-level findings with confidence scores.

**Test before you commit.** Every skill previews in the browser first. Say "prototype" to click through a flow, fill forms, and test branching paths — all before touching Figma. Say "playground" to toggle component states, switch themes, and see which tokens are active.

**Fix without starting over.** After pushing to Figma, the plugin automatically checks for clipping, missing content, and broken layouts. Found something off? Run `/refine` — describe what's wrong, and it fixes it with before/after screenshots. Or leave Figma comments and let `/refine` read them.

---

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

On new versions, Claude Code fetches at next startup automatically. Works in both CLI and Desktop.

### Manual update

**Claude Code CLI:**
```bash
/plugin marketplace update
```

**Claude Desktop:**
1. Open the **Cowork** tab
2. Click **Customize** in the left sidebar
3. Find **Actian Design System** under Personal plugins
4. Remove and re-add from GitHub if needed: `volivarii/Actian-DS-Claude-plugin`

---

## Skills

### Build

| Skill | What it does |
|-------|-------------|
| `/generate-flow` | Turn a user story into a full wireframe flow with competitor research, interactive prototype, and Figma output. |
| `/component-brief` | Create a 9-card DS2026 or 5-card Fat Marker component spec — anatomy, tokens, API, accessibility, code. Includes interactive state playground. |
| `/create-component` | Build a new Figma component with variants via Plugin API, with optional pattern research. |
| `/generate-presentation` | Create a slide deck using Actian presentation templates with charts and data visualizations. |

### Review and refine

| Skill | What it does |
|-------|-------------|
| `/design-audit` | Audit a Figma screen against DS2026 tokens, WCAG AA, content guidelines, and forms layout. Confidence-scored findings with evidence. |
| `/fix-finding` | Fix a single audit finding in Figma — swap instances, bind tokens, align variants. |
| `/compare-flows` | Compare two Figma flows side-by-side with severity-rated issues (P0/P1/P2) and concrete recommendations. |
| `/refine` | Fix Figma output after pushing — describe issues, read Figma comments, or re-run parity checks. Before/after screenshots on every fix. |

### Sync

| Skill | What it does |
|-------|-------------|
| `/sync-design-system` | Extract components, variables, styles, guidelines, and tokens from Figma via MCP. Full sync, per-phase, or single-component. |

---

## The designer workflow

```
 Describe a feature or provide a Figma URL
                    |
          Skill generates HTML
                    |
        +--------- Preview in browser ---------+
        |                                       |
   "prototype"                             "playground"
   Click through screens,             Toggle states, switch
   fill forms, test paths             themes, explore variants
        |                                       |
        +------------- "push" -----------------+
                    |
          Push to Figma via MCP
                    |
        Automatic parity check
        (clipping, missing content, empty text)
                    |
       +---------- Review in Figma ----------+
       |                                      |
  "looks good"                          /refine
  Done.                           Describe issues or
                                  read Figma comments
                                         |
                                  Fix + screenshot + verify
                                  (loop until done)
```

---

## Interactive prototypes

When previewing a flow, say **"prototype"** at the gate to generate an interactive version:

- **Click-to-navigate** — buttons advance between screens
- **Form simulation** — fill inputs, see validation errors, submit when valid
- **Branching paths** — decision buttons ("Approve" / "Reject") lead to different screens
- **Keyboard navigation** — arrow keys to step through screens
- **Bottom nav bar** — jump to any screen by clicking its thumbnail

When previewing a component brief, say **"playground"** to generate a state explorer:

- **State switching** — toggle between Default, Hover, Focused, Pressed, Disabled
- **Variant axes** — combine Size, Type, Selected, and other properties
- **Theme switching** — Actian, Studio, Explorer with one click
- **Live token readout** — see which `--zen-*` tokens are active for the current state

Both are served locally alongside the static preview. No build step, no dependencies to install.

---

## Post-push quality

Every skill that pushes to Figma automatically runs a **parity check**:

1. Screenshots each pushed element
2. Checks for clipping (frames < 10px), empty text, missing children
3. Reports findings: `OK` or `WARNING` with the specific issue
4. Offers to fix P0 issues before declaring success

After reviewing in Figma, run `/refine` to fix anything:

```
/refine screen 3 header is too tall, card 5 missing error state
/refine comments          # reads your Figma annotations
/refine check             # re-runs the parity check
```

Each fix is applied individually with a before/after screenshot. Loop until you're satisfied.

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
|   +-- CLAUDE.md                        # Design system rules
|   |
|   +-- skills/                          # 9 skills
|   |   +-- sync-design-system/          # Figma MCP extraction (7 phases)
|   |   +-- design-audit/
|   |   +-- fix-finding/
|   |   +-- generate-flow/
|   |   +-- component-brief/
|   |   +-- create-component/
|   |   +-- compare-flows/
|   |   +-- generate-presentation/
|   |   +-- refine/                      # Post-Figma corrections
|   |
|   +-- references/                      # Shared skill references
|   |   +-- figma-output.md
|   |   +-- fm-css-reference.md
|   |   +-- quality-checklist.md
|   |   +-- token-naming.md
|   |   +-- parity-check.md             # Post-push verification
|   |   +-- prototype-reference.md       # Alpine.js generation rules
|   |
|   +-- templates/                       # Interactive preview templates
|   |   +-- flow-prototype-wrapper.html
|   |   +-- component-playground-wrapper.html
|   |
|   +-- tokens/
|   |   +-- actian-ds.tokens.json        # W3C DTCG (source of truth)
|   |   +-- tokens.css                   # CSS custom properties
|   |
|   +-- docs/
|       +-- ds2026-components.md         # 97 component sets + 3 standalone
|       +-- fm-components.md             # 34 FM Kit components
|       +-- token-reference.md
|       +-- content-guidelines.md
|       +-- accessibility-guidelines.md
|       +-- presentation-guide.md
|       +-- component-guidelines/        # 44 per-component JSONs
|       +-- foundations/                  # 11 foundation JSONs
|       +-- meta-kit/                    # Components, variables, styles
|
+-- docs/
    +-- superpowers/
        +-- specs/                       # Design specs
        +-- plans/                       # Implementation plans
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
