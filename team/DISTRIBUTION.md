# Distributing AI Resources to the UX Team

> How to get every designer set up with Claude + Figma + our design system context.
> Last updated: 2026-03-19

---

## What gets shared

| File | Purpose | Where it goes |
|---|---|---|
| `CLAUDE.md` | Component rules, conventions, Figma MCP flow | Claude Project Knowledge |
| `design-system.md` | Full token reference (colors, typography, spacing, etc.) | Claude Project Knowledge |
| `FATMARKER-COMPONENT-CATALOG.md` | 42 FM components with variants and node IDs | Claude Project Knowledge |
| `team/prompt-templates/*.md` | 4 ready-to-paste prompt templates | Team Notion / Drive / Slack |
| `ux-ai-resources-canvas.md` | Onboarding guide and learning resources | Team Notion / Slack canvas |

---

## For Claude Desktop users (designers)

### 1. Create a shared Claude Project (one-time, done by lead)

1. Open Claude Desktop → Projects → **New Project**
2. Name it **"Actian UX Design System"**
3. Add Project Knowledge:
   - Upload `CLAUDE.md` (component rules + conventions)
   - Upload `docs/design-system.md` (full token reference)
   - Upload `docs/content-guidelines.md` (UI copy rules)
   - Upload `docs/accessibility-guidelines.md` (WCAG 2.1 AA standards)
   - Upload `components/FATMARKER-COMPONENT-CATALOG.md`
4. Invite the team — everyone who joins gets the context automatically

### 2. Connect Figma (each designer, 2 minutes)

1. Open Claude Desktop → Settings → Integrations → **Figma** → Install
2. Follow the auth prompt to log in to your Figma account
3. Test it: paste a Figma frame URL into the chat and ask "Describe what you see"

### 3. Share prompt templates (team lead)

Post the 4 prompt templates where the team can find them:
- `team/prompt-templates/generate-flow.md` → "Generate a Fat Marker flow"
- `team/prompt-templates/design-audit.md` → "Audit this file against our DS"
- `team/prompt-templates/component-brief.md` → "Draft a component spec"
- `team/prompt-templates/compare-flows.md` → "Compare two flows"

Each template has a ready-to-paste prompt block + tips. Designers copy the prompt, fill in the [brackets], and paste into Claude.

### 4. Onboard the team (Week 1–3)

Follow the rollout plan in `ux-ai-resources-canvas.md`:
- **Week 1:** Install + connect + test with a known file
- **Week 2:** Run a group audit on a file everyone knows
- **Week 3:** Pick a small feature, generate a first flow together
- **Ongoing:** Monthly retro, update prompt library with what works

---

## For Claude Code users (lead / technical designers)

### Quick install (recommended)

```bash
git clone <repo-url> ~/Developer/Actian/figma-mcp
cd ~/Developer/Actian/figma-mcp
./install.sh
```

This does everything: installs skills globally, adds Figma MCP, and verifies the setup.

### What the installer does

1. **Copies skills** to `~/.claude/commands/` so they work from any directory
2. **Adds Figma MCP** server (`https://mcp.figma.com/mcp`) to your user config
3. **Validates** Claude Code CLI is installed

### What you get

**Project-level config** (auto-loaded when working in this directory):
- `.claude/settings.json` — Figma MCP permissions pre-approved (no manual allow prompts)
- `CLAUDE.md` — Design system rules loaded every session
- `.claude/commands/*.md` — 4 slash commands

**Global skills** (available from any directory after `./install.sh`):
- `/generate-flow` — Generate a Fat Marker flow from a user story (includes exact FM CSS reference for 1:1 fidelity)
- `/design-audit` — Audit a Figma file against the design system
- `/component-brief` — Draft a structured component specification
- `/compare-flows` — Compare two Figma flows

### Manual setup (if you skip the installer)

```bash
# Add Figma MCP
claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp

# (Optional) Install skills globally
cp .claude/commands/*.md ~/.claude/commands/
```

### Local server for Figma capture

```bash
cd ~/Developer/Actian/figma-mcp
python3 -m http.server 8765
```

This serves HTML files for the HTML → Figma capture pipeline.

---

## What each person needs

| Role | Tools | Setup time |
|---|---|---|
| **Lead (you)** | Claude Code + Figma MCP + skills + capture pipeline | Already done |
| **Designer (non-technical)** | Claude Desktop (Pro/Max) + Figma desktop app | 10 minutes |
| **Designer (technical)** | Claude Code + cloned repo + Figma MCP | 5 minutes |

---

## Keeping it updated

- **CLAUDE.md** — Lead updates when conventions or component mappings change. Re-upload to the Claude Project.
- **design-system.md** — Regenerated from the Figma variables JSON export (`Actian-Design-System_variables_*.json`). Re-upload when tokens change.
- **Component catalog** — Update when FM components are added, renamed, or removed.
- **generate-flow skill** — Contains the FM CSS Reference (exact colors, sizes, component styles). Update when the FM Kit changes in Figma.
- **Prompt templates** — Add new templates when the team discovers useful prompt patterns. Remove ones that don't work.
- **Monthly retro** — What saved time? What missed? What prompts worked best? Update the shared resources.
