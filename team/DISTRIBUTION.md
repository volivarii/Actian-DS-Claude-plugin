# Distributing AI Resources to the UX Team

> How to get every designer set up with Claude + Figma + our design system context.
> Last updated: 2026-03-25

---

## What gets shared

| File | Purpose | Where it goes |
|---|---|---|
| `CLAUDE.md` | Component rules, conventions, Figma MCP flow | Claude Project Knowledge |
| `token-reference.md` | Full token reference (colors, typography, spacing, etc.) | Claude Project Knowledge |
| `fm-components.md` | 42 FM components with variants and node IDs | Claude Project Knowledge |
| `team/prompt-templates/*.md` | 6 ready-to-paste prompt templates | Team Notion / Drive / Slack |
| `ux-ai-resources-canvas.md` | Onboarding guide and learning resources | Team Notion / Slack canvas |

---

## For Claude Desktop users (designers)

### 1. Install the plugin (recommended — easiest setup)

1. Open Claude Desktop
2. Go to **Customize** → **Personal plugins** → **+**
3. Add marketplace: `volivarii/Actian-DS-Claude-plugin`
4. Click **Check for updates** to load the plugin
5. Enable the **Figma** connector under **Customize** → **Connectors**

This gives you all 6 skills, design system rules, and token references automatically — no file uploads needed.

> **For full Figma capture support**, install Claude Code CLI alongside Claude Desktop:
> ```bash
> npm install -g @anthropic-ai/claude-code
> ```
> Without it, you can still generate specs and preview locally — just no automatic push-to-Figma.

### 2. Alternative: Create a shared Claude Project (manual)

If you prefer not to install the plugin:

1. Open Claude Desktop → Projects → **New Project**
2. Name it **"Actian UX Design System"**
3. Add Project Knowledge:
   - Upload `CLAUDE.md` (component rules + conventions)
   - Upload `docs/token-reference.md` (full token reference)
   - Upload `docs/content-guidelines.md` (UI copy rules)
   - Upload `docs/accessibility-guidelines.md` (WCAG 2.1 AA standards)
   - Upload `docs/fm-components.md`
4. Invite the team — everyone who joins gets the context automatically

### 3. Connect Figma (each designer, 2 minutes)

1. Open Claude Desktop → Settings → Integrations → **Figma** → Install
2. Follow the auth prompt to log in to your Figma account
3. Test it: paste a Figma frame URL into the chat and ask "Describe what you see"

### 4. Share prompt templates (team lead)

Post the 6 prompt templates where the team can find them:
- `team/prompt-templates/generate-flow.md` → "Generate a Fat Marker flow"
- `team/prompt-templates/component-brief.md` → "Draft a component spec"
- `team/prompt-templates/design-audit.md` → "Audit this file against our DS"
- `team/prompt-templates/compare-flows.md` → "Compare two flows"
- `team/prompt-templates/generate-presentation.md` → "Create a presentation deck"
- `team/prompt-templates/create-component.md` → "Build a new component"

Each template has a ready-to-paste prompt block + tips. Designers copy the prompt, fill in the [brackets], and paste into Claude.

### 5. Onboard the team (Week 1–3)

Follow the rollout plan in `ux-ai-resources-canvas.md`:
- **Week 1:** Install + connect + test with a known file
- **Week 2:** Run a group audit on a file everyone knows
- **Week 3:** Pick a small feature, generate a first flow together
- **Ongoing:** Monthly retro, update prompt library with what works

---

## For Claude Code users (lead / technical designers)

### Quick install

```bash
# Add the marketplace and plugin
claude plugin add volivarii/Actian-DS-Claude-plugin

# Connect Figma MCP (if not already connected)
claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp
```

### What you get

**Plugin-provided (auto-loaded when working in the project directory):**
- `CLAUDE.md` — Design system rules loaded every session
- 6 skills: `/generate-flow`, `/component-brief`, `/design-audit`, `/compare-flows`, `/generate-presentation`, `/create-component`
- Token references, content guidelines, accessibility standards
- Shared references for Figma capture, FM CSS, layout spec schema

**Local server for Figma capture:**

```bash
# The plugin handles this automatically via scripts/ensure-server.sh
# Manual fallback:
cd ~/Developer/Actian/actian-design-system-plugin
python3 -m http.server 8765
```

### DS Assembler (optional, for real Figma components)

The `/generate-flow` and `/create-component` skills can produce real Figma component instances via the [DS Assembler](https://github.com/volivarii/Actian-DS-Assembler) Figma plugin. Without it, flow generation falls back to HTML capture.

---

## What each person needs

| Role | Tools | Setup time |
|---|---|---|
| **Lead (you)** | Claude Code + Figma MCP + plugin + DS Assembler | Already done |
| **Designer (non-technical)** | Claude Desktop (Pro/Max) + Figma connector + plugin | 10 minutes |
| **Designer (technical)** | Claude Code + plugin + Figma MCP | 5 minutes |

---

## The 6 skills

| Skill | What it does | Review gate? |
|-------|-------------|:---:|
| `/generate-flow` | Fat Marker wireframe flows from user stories, with competitor research | Screen list approval |
| `/component-brief` | 9-card DS2026 or 5-card FM component spec | None (autonomous) |
| `/design-audit` | Audit against tokens, accessibility, content, quality checklist | None (autonomous) |
| `/compare-flows` | Side-by-side comparison with P0/P1/P2 severity-rated issues | None (autonomous) |
| `/generate-presentation` | Full slide deck with charts and data visualizations | Review report before Figma push |
| `/create-component` | New Figma component with variants via DS Assembler | None (autonomous) |

---

## Keeping it updated

- **Plugin version** — `plugins/actian-design-system/.claude-plugin/plugin.json` — bump for each release
- **Tokens** — Re-export JSON to `tokens/`, regenerate `actian-ds.tokens.json` + `tokens.css`, update `docs/token-reference.md`
- **FM Kit** — Update `docs/fm-components.md` + `references/fm-css-reference.md`
- **Content rules** — Edit `docs/content-guidelines.md`
- **A11y rules** — Edit `docs/accessibility-guidelines.md`
- **Prompt templates** — Add new templates when the team discovers useful prompt patterns. Remove ones that don't work.
- **Monthly retro** — What saved time? What missed? What prompts worked best? Update the shared resources.
