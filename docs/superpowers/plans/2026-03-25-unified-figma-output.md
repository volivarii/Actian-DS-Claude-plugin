# Unified Figma Output Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize all skills on `use_figma` as the sole Figma output path, removing dependency on the unreliable `generate_figma_design` tool.

**Architecture:** Replace the three-path model (Assembler / use_figma / HTML capture) with a two-path model (use_figma default / Assembler optional). HTML generation remains for local preview only. A new shared reference (`figma-output.md`) defines the `use_figma` pattern all skills follow. Two HTML-only skills (component-brief, generate-presentation) get a `use_figma` output step.

**Tech Stack:** Figma Plugin API via `use_figma` MCP tool, auto-layout frames, `figma.createImageAsync()` for images, `figma.teamLibrary.getComponentByKeyAsync()` for library imports.

---

## File Structure

### Files to create
- `references/figma-output.md` — shared reference defining the `use_figma` output pattern (replaces `figma-capture.md`)

### Files to modify
- `skills/component-brief/SKILL.md` — add `use_figma` output step, make it default
- `skills/generate-presentation/SKILL.md` — add `use_figma` output step, make it default
- `skills/generate-flow/SKILL.md` — remove HTML capture (Option C), clean up output mode section
- `CLAUDE.md` — add `use_figma` generation metadata format, remove HTML capture references

### Files to delete
- `references/figma-capture.md` — replaced by `figma-output.md`

### Files unchanged
- `skills/create-component/SKILL.md` — already uses `use_figma` as default, no changes needed
- `references/fm-css-reference.md` — still needed for HTML local preview
- `references/layout-spec-schema.md` — still needed for Assembler path
- `references/token-naming.md` — still needed

All paths below are relative to `plugins/actian-design-system/`.

---

## Task 1: Create `figma-output.md` shared reference

**Files:**
- Create: `references/figma-output.md`

This is the foundational reference that all skills will point to. It defines the `use_figma` output pattern, generation metadata frame, token usage rules, and the Assembler fallback.

- [ ] **Step 1: Write `figma-output.md`**

```markdown
# Figma Output Flow

Shared procedure for outputting skill results to Figma. Used by all skills that produce Figma deliverables.

## Output modes

| Mode | When to use | How it works |
|------|-------------|--------------|
| **`use_figma` (default)** | Always — unless user explicitly requests Assembler | Build directly in Figma via Plugin API JavaScript |
| **Assembler (optional)** | User says "use Assembler" or needs full Figma variable bindings on scaffolding | Generate JSON spec, user runs Assembler plugin |

**HTML is for local preview only** — never use HTML as a Figma output path. Skills that generate HTML (component-brief, generate-presentation) do so for browser preview and archival, not for Figma delivery.

## `use_figma` pattern

Every `use_figma` call must follow these rules:

### 1. Import library components — never recreate

```js
// FM Kit components
const buttonKey = "COMPONENT_KEY_FROM_CATALOG";
const button = await figma.teamLibrary.getComponentByKeyAsync(buttonKey);
const instance = button.createInstance();
```

Imported instances arrive with all Figma variables and styles intact. No hex values needed for library components.

Look up component keys in `../../docs/fm-components.md` (FM Kit) or `../../docs/ds2026-components.md` (DS2026).

### 2. Auto-layout on every frame

```js
frame.layoutMode = "VERTICAL"; // or "HORIZONTAL"
frame.primaryAxisSizingMode = "AUTO"; // hug content
frame.counterAxisSizingMode = "FIXED"; // or "AUTO"
frame.itemSpacing = 16;
frame.paddingTop = frame.paddingBottom = 16;
frame.paddingLeft = frame.paddingRight = 20;
```

No absolute positioning. No fixed sizes unless the spec requires it (e.g., screen frames at 1440x960).

### 3. Token hex values for scaffolding only

Library component instances get automatic token binding. Only custom scaffolding (wrapper frames, backgrounds, generation log, content areas) needs hex values. Always comment the token name:

```js
frame.fills = [{ type: 'SOLID', color: hexToRgb('#F5F5FA') }]; // --fm-base-100
```

Use values from the Token Reference tables in the skill file or `../../docs/token-reference.md`.

### 4. Descriptive layer names

Every node must have a meaningful name. No "Frame 1", "Rectangle 2", "Text 3".

```js
frame.name = "Card: Anatomy";
textNode.name = "Card title";
```

### 5. Load fonts before setting text

```js
await figma.loadFontAsync({ family: "Inter", style: "Regular" });  // FM Kit
await figma.loadFontAsync({ family: "Inter", style: "Bold" });
await figma.loadFontAsync({ family: "Roboto", style: "Regular" }); // DS2026
await figma.loadFontAsync({ family: "Roboto", style: "Medium" });
```

### 6. `hexToRgb` helper

Include this at the top of every `use_figma` code block:

```js
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}
```

## Generation metadata frame

Every output must include a visible generation metadata frame as the **first sibling** before the main content. This is required by CLAUDE.md.

```js
const genCard = figma.createFrame();
genCard.name = "Generation log";
genCard.layoutMode = "VERTICAL";
genCard.itemSpacing = 4;
genCard.paddingTop = genCard.paddingBottom = 16;
genCard.paddingLeft = genCard.paddingRight = 20;
genCard.cornerRadius = 8;
genCard.primaryAxisSizingMode = "AUTO";
genCard.counterAxisSizingMode = "FIXED";
genCard.resize(280, 1); // width fixed, height hugs

genCard.fills = [{ type: 'SOLID', color: hexToRgb('#2D3648') }]; // --fm-base-800

// Add text children
async function addGenText(parent, content, size, color) {
  const t = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  t.characters = content;
  t.fontSize = size;
  t.fills = [{ type: 'SOLID', color: hexToRgb(color) }];
  t.name = content.split(":")[0] || content;
  parent.appendChild(t);
  return t;
}

await addGenText(genCard, "GENERATED", 10, "#A0ABC0");        // --fm-base-500
await addGenText(genCard, "Skill: {{skill-name}}", 12, "#CBD2E0"); // --fm-base-400
await addGenText(genCard, "{{ISO 8601 date}}", 12, "#CBD2E0");
await addGenText(genCard, "{{model}} · v{{version}}", 12, "#CBD2E0");
```

Replace `{{skill-name}}`, `{{ISO 8601 date}}`, `{{model}}`, and `{{version}}` with actual values. Read version from `../../.claude-plugin/plugin.json`.

## Assembler path (optional)

When the user explicitly requests the Assembler:

1. Generate a JSON spec following `../../references/layout-spec-schema.md`
2. Save to `assembler-specs/<name>.json`
3. Ensure localhost server: `scripts/ensure-server.sh . 8765`
4. Tell user: **"Open DS Assembler → select spec → Assemble"**

## Rules

- **`use_figma` is always the default.** Only use Assembler when the user explicitly asks for it.
- **Never use `generate_figma_design`** — it produces raw geometry without design system awareness and is unreliably available.
- **Never delegate Figma output to a subagent.** Subagents do NOT have MCP tools.
- **HTML is local preview only.** Open in browser with `open $URL` if the user wants to see it, but never treat HTML as a Figma delivery mechanism.
- **One `use_figma` call per logical unit.** Don't split a single card or slide across multiple calls. Group related content.
- **Keep code under 20KB per call.** Split into multiple calls if needed (e.g., one call per card, one call per slide).
```

- [ ] **Step 2: Verify the file reads correctly**

Read the file and confirm it's well-formed, all code blocks are closed, and the content is complete.

- [ ] **Step 3: Commit**

```bash
git add references/figma-output.md
git commit -m "docs: add figma-output.md shared reference for use_figma pattern"
```

---

## Task 2: Delete `figma-capture.md` and update `generate-flow` references

**Files:**
- Delete: `references/figma-capture.md`
- Modify: `skills/generate-flow/SKILL.md` (replace figma-capture reference with figma-output)

Note: `component-brief/SKILL.md` and `generate-presentation/SKILL.md` references to `figma-capture.md` will be replaced as part of their full rewrites in Tasks 3 and 4.

- [ ] **Step 1: Find all references to `figma-capture.md`**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
grep -rn "figma-capture" plugins/actian-design-system/
```

- [ ] **Step 2: Delete `figma-capture.md`**

```bash
git rm plugins/actian-design-system/references/figma-capture.md
```

- [ ] **Step 3: Update `generate-flow/SKILL.md` reference only**

Replace the `figma-capture.md` reference in `generate-flow/SKILL.md` with `figma-output.md`. Do NOT edit `component-brief` or `generate-presentation` here — those get full rewrites in Tasks 3 and 4.

- [ ] **Step 4: Verify no stale filename references remain**

```bash
grep -rn "figma-capture" plugins/actian-design-system/
```

This may still show references in `component-brief` and `generate-presentation` — those are OK, they'll be fixed in Tasks 3/4.

- [ ] **Step 5: Commit**

```bash
git rm plugins/actian-design-system/references/figma-capture.md
git add plugins/actian-design-system/skills/generate-flow/SKILL.md
git commit -m "refactor: remove figma-capture.md, update generate-flow reference"
```

---

## Task 3: Add `use_figma` output to `component-brief/SKILL.md`

**Files:**
- Modify: `skills/component-brief/SKILL.md`

The component-brief currently generates HTML only (Step 2), then tries to capture it to Figma (Step 3). We add a `use_figma` output step that builds the spec cards directly in Figma as auto-layout frames.

**Design decisions:**
- Each of the 9 DS cards (or 5 FM cards) becomes a Figma frame with auto-layout
- Cards are arranged in a 3x3 grid (3 rows of 3 cards) inside a wrapper frame
- Text content comes from the same research step (Step 1) — no additional data needed
- Card dimensions: 440px wide, height hugs content (matching the HTML card width)
- Generation metadata frame is the first element before the grid
- HTML generation remains as Step 2 for local preview — the `use_figma` step is Step 3

- [ ] **Step 1: Read current `component-brief/SKILL.md`**

Read the full file to understand current structure before editing.

- [ ] **Step 2: Rewrite Step 3 (Capture) as `use_figma` output**

Replace the current Step 3 (which references figma-capture.md) with a new Step 3 that describes how to build the brief in Figma via `use_figma`. Structure:

```markdown
## Step 3 — Output to Figma (default: `use_figma`)

Build the spec cards directly in Figma using `use_figma`. Follow the shared pattern in `../../references/figma-output.md`.

### Card structure

Each card is a Figma frame with:
- **Width:** 440px fixed
- **Height:** hug content
- **Layout:** vertical auto-layout
- **Padding:** 24px all sides
- **Spacing:** 16px between children
- **Background:** `#FFFFFF` (--fm-base-white) for FM, `#FFFFFF` (--zen-color-background-bg-default) for DS2026
- **Border:** 1px `#E2E7F0` (--fm-base-300) for FM, 1px `#E4E4F0` (--zen-color-border-default) for DS2026
- **Corner radius:** 8px

### Card children

1. **Card number + title** — text node, bold, 18px
2. **Subtitle** — text node, regular, 14px, secondary color
3. **Content sections** — nested frames with headings and body text
4. **Tables** — built as horizontal frames with fixed-width text columns
5. **Color swatches** — small rectangles with image fills or solid color fills
6. **Code blocks** — frames with dark background + monospace text

### Grid layout

```js
// Outer wrapper
const wrapper = figma.createFrame();
wrapper.name = "Component Brief: [Name]";
wrapper.layoutMode = "VERTICAL";
wrapper.itemSpacing = 24;

// Row frames (3 cards per row)
for (let row = 0; row < 3; row++) {
  const rowFrame = figma.createFrame();
  rowFrame.name = `Row ${row + 1}`;
  rowFrame.layoutMode = "HORIZONTAL";
  rowFrame.itemSpacing = 24;
  wrapper.appendChild(rowFrame);
  // Add 3 card frames per row
}
```

### Execution

1. Build generation metadata frame first (see `figma-output.md`)
2. Build each card as a separate `use_figma` call (keeps code under 20KB per call)
3. After all cards are built, take a screenshot with `get_screenshot` and show the user
4. Ask for adjustments if needed

### Assembler path (optional)

If the user says "use Assembler", generate a `component-spec.json` instead:
[keep existing Step 4 content]
```

- [ ] **Step 3: Update the execution model blockquote**

Change the mode from "Implement" to "Implement with review gate" and mention `use_figma` as the default output.

- [ ] **Step 4: Verify the skill reads correctly**

Read the full file, check for consistency, verify all step numbers are sequential.

- [ ] **Step 5: Commit**

```bash
git add skills/component-brief/SKILL.md
git commit -m "feat: add use_figma output path to component-brief skill"
```

---

## Task 4: Add `use_figma` output to `generate-presentation/SKILL.md`

**Files:**
- Modify: `skills/generate-presentation/SKILL.md`

The presentation skill generates HTML slides (Step 3), serves them (Step 4), presents a review report (Step 5), then tries to capture to Figma (Step 6). We replace Step 6 with a `use_figma` output step.

**Design decisions:**
- Each slide is a Figma frame at 1920x1080px
- Slide types: Cover, Body (text + visual), Section divider, Back cover
- Background colors use DS2026 tokens (brand blue for cover, white for body, etc.)
- Text uses Roboto (DS2026 font)
- Charts/visualizations are simplified: use rectangles for bars, lines for line charts, circles for donuts
- Generation metadata frame is first element
- Review gate (Step 5) stays — user approves before Figma output

- [ ] **Step 1: Read current `generate-presentation/SKILL.md`**

Read the full file to understand current structure.

- [ ] **Step 2: Rewrite Step 6 (Capture) as `use_figma` output**

Replace the current Step 6 (which references figma-capture.md) with:

```markdown
## Step 6 — Output to Figma (default: `use_figma`)

After user approves the review report, build the slides in Figma via `use_figma`. Follow the shared pattern in `../../references/figma-output.md`.

### Slide frame structure

Each slide is a Figma frame:
- **Size:** 1920x1080px fixed
- **Layout:** vertical auto-layout (or horizontal for two-column body slides)
- **Background:** varies by slide type (see below)
- **Font:** Roboto (DS2026)

### Slide types

**Cover slide:**
- Background: `#0550DC` (--zen-color-theme-primary)
- Title: white, 48px bold
- Subtitle: white/80% opacity, 24px regular
- Logo placeholder frame (top-left corner)

**Body slide (text + visual):**
- Background: `#FFFFFF` (--zen-color-background-bg-default)
- Two-column layout: text left (50%), visual right (50%)
- Heading: `#000000` (--zen-color-text-primary), 32px bold
- Body: `#3F3F4A` (--zen-color-text-secondary), 18px regular
- Visual area: placeholder frame with light gray background for charts/images

**Section divider:**
- Background: `#F5F5FA` (--zen-color-background-bg-grey-2)
- Section title: centered, 36px bold, primary text color

**Back cover:**
- Background: `#0550DC` (--zen-color-theme-primary)
- Thank you text + contact info, white

### Charts in `use_figma`

Build simplified chart representations:
- **Bar charts:** Horizontal or vertical rectangles with category colors (`#0550DC`, `#047800`, etc.)
- **Line charts:** Not possible natively — use a series of small circles connected visually, or describe the data in text
- **Donut/pie:** Use arc approximations with rectangles, or a circle with a white circle overlay
- **Data tables:** Horizontal frames with text columns (same pattern as component-brief)

If a chart is too complex for Plugin API, create a placeholder frame labeled "Chart: [description]" and note it for the user.

### Execution

1. Build generation metadata frame first
2. Build slides sequentially (one `use_figma` call per slide to stay under 20KB)
3. Arrange slides in a horizontal row
4. Take screenshot and show user
```

- [ ] **Step 3: Remove HTML capture references and capture script**

Remove any mention of `figma-capture.md` or `generate_figma_design` from the file. Also remove the capture script tag from the HTML template in Step 3:
```html
<!-- REMOVE THIS LINE -->
<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
```
HTML generation remains for local preview — it does not need the capture script.

- [ ] **Step 4: Verify the skill reads correctly**

Read the full file, check step numbering and consistency.

- [ ] **Step 5: Commit**

```bash
git add plugins/actian-design-system/skills/generate-presentation/SKILL.md
git commit -m "feat: add use_figma output path to generate-presentation skill"
```

---

## Task 5: Clean up `generate-flow/SKILL.md` — remove HTML capture option

**Files:**
- Modify: `skills/generate-flow/SKILL.md`

Remove Option C (HTML capture) entirely. The skill already has `use_figma` (Option B) and Assembler (Option A). Rename them to remove the A/B/C labeling and make `use_figma` the unlabeled default.

- [ ] **Step 1: Read the full skill file**

Understand the current three-option structure and locate all references to HTML capture.

- [ ] **Step 2: Update the default output mode**

Find and update any line that says output defaults to Assembler (e.g., "Output type defaults to Assembler spec") to say output defaults to `use_figma`.

- [ ] **Step 3: Remove Option C (HTML capture) and capture script**

Delete the HTML capture option and all references to it. Also remove the Figma capture script tag from the HTML generation section:
```html
<!-- REMOVE THIS LINE -->
<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
```
HTML generation remains for local preview — it does not need the capture script.

- [ ] **Step 4: Restructure as default + optional**

Rewrite the output mode section:

```markdown
## Step 5 — Output to Figma

**Default: `use_figma`** — builds screens directly in Figma via Plugin API JavaScript.

**Optional: Assembler** — generates a JSON spec if the user says "use Assembler" or needs full Figma variable bindings on scaffolding.

Follow the shared pattern in `../../references/figma-output.md`.

### `use_figma` output
[existing Option B content, cleaned up]

### Assembler output (optional)
[existing Option A content, cleaned up]
```

- [ ] **Step 5: Update the comparison table**

Remove the HTML capture column. Simplify to two columns: `use_figma` (default) vs Assembler (optional).

- [ ] **Step 6: Remove any remaining stale references**

```bash
grep -n "generate_figma_design\|figma-capture\|Option C\|HTML capture\|capture.js" plugins/actian-design-system/skills/generate-flow/SKILL.md
```

Should return zero results.

- [ ] **Step 7: Commit**

```bash
git add plugins/actian-design-system/skills/generate-flow/SKILL.md
git commit -m "refactor: remove HTML capture path from generate-flow, simplify to use_figma + Assembler"
```

---

## Task 6: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Read the Generation Metadata section (lines 76-128)**

Understand current metadata formats (HTML and Assembler JSON).

- [ ] **Step 2: Add `use_figma` generation metadata format**

After the Assembler JSON section, add:

```markdown
### `use_figma` outputs (Plugin API)

Build a generation metadata frame as the first sibling before main content. See `references/figma-output.md` for the full code pattern. The frame must include:
- "GENERATED" label
- Skill name
- ISO 8601 date
- Model + plugin version
```

- [ ] **Step 3: Remove references to `generate_figma_design` and HTML capture as Figma output**

Search for and update any language that implies HTML is a Figma delivery mechanism. Specific locations to update:
- **Local Server Management section** (~line 56): Change "serving HTML for Figma capture" → "serving HTML for local preview and Assembler specs"
- **Generation Metadata intro** (~line 78): Change "captured alongside the output" → "included in the output" (remove capture framing)
- **Quality & Hygiene HTML translation header** (~line 410): Change "When generating HTML for Figma capture or assembler specs" → "When generating HTML for local preview or assembler specs"
- Any other occurrence of "Figma capture" as a phrase

Keep references to HTML as local preview.

- [ ] **Step 4: Update the File Organization table**

Change the `references/*.md` entry to reflect the new file (`figma-output.md` replacing `figma-capture.md`).

- [ ] **Step 5: Verify consistency**

```bash
grep -in "generate_figma_design\|figma.capture\|figma capture" plugins/actian-design-system/CLAUDE.md
```

Should return zero results. Note: search is case-insensitive and catches both the filename (`figma-capture`) and the phrase ("Figma capture").

- [ ] **Step 6: Commit**

```bash
git add plugins/actian-design-system/CLAUDE.md
git commit -m "docs: update CLAUDE.md with use_figma metadata format, remove HTML capture references"
```

---

## Task 7: Final verification and version bump

**Files:**
- Modify: `.claude-plugin/plugin.json` (version bump)

- [ ] **Step 1: Full grep for stale references**

```bash
grep -rn "generate_figma_design\|figma-capture\|figma capture\|capture\.js" plugins/actian-design-system/
```

Must return zero results. This catches the filename, the phrase, and the capture script URL.

- [ ] **Step 2: Verify all skills reference `figma-output.md`**

```bash
grep -rn "figma-output" plugins/actian-design-system/skills/
```

Should show references in: component-brief, generate-presentation, generate-flow. (create-component already has its own inline `use_figma` docs and doesn't need the shared reference.)

- [ ] **Step 3: Verify `figma-output.md` exists and is well-formed**

Read the file and verify it's complete.

- [ ] **Step 4: Bump version to 1.11.0**

This is a minor version bump (new feature: unified Figma output architecture).

Edit `plugins/actian-design-system/.claude-plugin/plugin.json`: change `"version": "1.10.3"` to `"version": "1.11.0"`.

Note: `marketplace.json` does not contain a version field — no update needed there.

- [ ] **Step 5: Commit version bump**

```bash
git add plugins/actian-design-system/.claude-plugin/plugin.json
git commit -m "chore: bump to 1.11.0 — unified Figma output via use_figma"
```

- [ ] **Step 6: Present to user for review before push**

Show the user:
- Summary of all changes
- `git log --oneline` of new commits
- Ask for approval to push

---

## Verification checklist

After all tasks are complete:

- [ ] `references/figma-capture.md` no longer exists
- [ ] `references/figma-output.md` exists with complete `use_figma` pattern
- [ ] Zero references to `generate_figma_design` in any skill or reference file
- [ ] Zero references to `figma-capture.md` or "Figma capture" (the phrase) in any file
- [ ] Zero references to `capture.js` script in any HTML template
- [ ] `component-brief/SKILL.md` has `use_figma` output step
- [ ] `generate-presentation/SKILL.md` has `use_figma` output step
- [ ] `generate-flow/SKILL.md` has no HTML capture option and defaults to `use_figma`
- [ ] `CLAUDE.md` has `use_figma` generation metadata format
- [ ] `CLAUDE.md` Local Server Management and HTML translation sections reframed for preview (not capture)
- [ ] Plugin version is 1.11.0
- [ ] All commits are clean and well-described
