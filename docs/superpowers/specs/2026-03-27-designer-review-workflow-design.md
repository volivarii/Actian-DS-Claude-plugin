# Designer Review & Refinement Workflow

**Date:** 2026-03-27
**Author:** Vincent + Claude
**Status:** Draft — pending approval

---

## Problem

The current plugin has strong pre-Figma HTML preview gates but three critical gaps:

1. **Previews are static** — designers can't click through flows, test forms, or toggle component states before committing to Figma
2. **Post-Figma is a dead end** — after push, there's no structured correction loop; skills show a screenshot and stop
3. **No fidelity verification** — approved HTML may not match the Figma result (clipping, missing elements, spacing drift)

## Solution

A two-part enhancement:

- **Interactive prototypes** (woven into existing skills) — opt-in Alpine.js-powered prototypes and playgrounds served alongside static previews
- **`/refine` skill** (standalone) — post-Figma correction loop with three input modes: conversational feedback, Figma comment reading, and automated parity checking

---

## Architecture: Two-file strategy

Every output skill generates up to two files:

| File | Purpose | Tech | Generated |
|------|---------|------|-----------|
| `[name]-spec.html` / `[name]-flow.html` | Static preview for Figma parity and push decisions | Pure HTML/CSS (unchanged) | Always |
| `[name]-prototype.html` / `[name]-playground.html` | Interactive prototype for UX testing | HTML/CSS + Alpine.js (CDN) | Opt-in |

The static file stays exactly as today — no changes to current templates. The prototype wraps the same screen/card content in an Alpine.js shell that adds interactions.

### Opt-in detection

| Signal in user's prompt | Prototype generated? |
|---|---|
| "prototype", "interactive", "playable", "clickable", "test it" | Yes |
| "quick", "draft", "just the flow" | No |
| No signal (default) | Offered as a gate keyword |

When offered at the preview gate:

```
Preview: http://localhost:8765/components/flows/glossary-flow.html

Review and reply:
  - "push" — send all to Figma
  - "push 1,3,5" — send selected
  - "prototype" — generate interactive prototype first
  - feedback — I'll fix and re-preview
```

For component briefs, the keyword is "playground" instead of "prototype".

If the designer says "prototype", Claude generates the interactive file, serves both URLs, and re-presents the gate. No extra upfront questions.

---

## Interactive prototype — flows

The prototype wraps flow screens in an Alpine.js shell served at `[name]-prototype.html`.

### Capabilities

**Navigation:**
- One screen visible at a time (not the horizontal strip)
- Buttons with `@click="screen = N"` advance to target screens
- Bottom nav bar shows all screens as thumbnails, current highlighted
- Arrow key support (left/right to navigate sequentially)

**Form simulation:**
- Text inputs use `x-model` to bind to form state
- Required fields validate on blur (red border + error message)
- Submit buttons disabled until form passes validation
- On submit: transition to success/confirmation screen

**Branching:**
- Decision points (approve/reject, yes/no) set path context
- `@click="path = 'approved'; screen = 5"` stores the decision
- Downstream screens conditionally render: `x-show="path === 'approved'"`

### Shell structure

```html
<!DOCTYPE html>
<html>
<head>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/cdn.min.js"></script>
  <link rel="stylesheet" href="../../tokens/tokens.css">
  <!-- Prototype nav + shell CSS -->
</head>
<body>
<div x-data="{
  screen: 1,
  path: '',
  form: {},
  screens: [
    { id: 1, label: 'List view' },
    { id: 2, label: 'Create form' },
    { id: 3, label: 'Validation error' },
    { id: 4, label: 'Success' }
  ]
}" @keyup.left="screen = Math.max(1, screen - 1)"
   @keyup.right="screen = Math.min(screens.length, screen + 1)">

  <!-- Screen sections (one visible at a time) -->
  <section x-show="screen === 1" class="proto-screen">
    <!-- Same HTML as static flow screen 1 -->
    <!-- Buttons annotated: @click="screen = 2" -->
  </section>
  <section x-show="screen === 2" class="proto-screen"> ... </section>
  <!-- ... -->

  <!-- Bottom nav -->
  <nav class="proto-nav">
    <template x-for="s in screens" :key="s.id">
      <button @click="screen = s.id"
              :class="{ 'proto-nav__item--active': screen === s.id }"
              class="proto-nav__item">
        <span class="proto-nav__number" x-text="s.id"></span>
        <span class="proto-nav__label" x-text="s.label"></span>
      </button>
    </template>
  </nav>
</div>
</body>
</html>
```

### Generation rules

- Claude generates the same screen HTML as the static file
- Interactive elements get Alpine directives added:
  - Primary action buttons → `@click="screen = N"` (where N is the next logical screen)
  - Cancel/back buttons → `@click="screen = N"` (previous screen)
  - Form inputs → `x-model="form.fieldName"`
  - Submit buttons → `@click="screen = N"` + `:disabled="!form.fieldName"` for required fields
  - Decision buttons → `@click="path = 'choice'; screen = N"`
- Screen content is wrapped in `<section x-show="screen === N">` tags
- Prototype nav is generated from the screen list

---

## Interactive prototype — component state playground

For component briefs, the playground lets designers interact with the component across states, variants, and themes. Served at `[name]-playground.html`.

### Capabilities

**State switching:**
- Toggle bar with all states (Default, Hover, Focused, Pressed, Disabled)
- Click a state to show that variant

**Variant axes:**
- Each variant axis gets its own control
- Booleans → toggle switch
- Enums → segmented button bar
- Combining axes shows the matching variant

**Live token inspection:**
- Below the component, show which tokens are active for the current state
- Tokens update as controls change

**Theme switching:**
- Three-button bar: Actian / Studio / Explorer
- Toggles `data-theme` on root element
- Component re-renders with theme-specific token values

### Shell structure

```html
<!DOCTYPE html>
<html>
<head>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/cdn.min.js"></script>
  <link rel="stylesheet" href="../../tokens/tokens.css">
  <!-- Playground controls CSS -->
</head>
<body>
<div x-data="{
  state: 'default',
  selected: false,
  size: 'medium',
  theme: 'actian',
  tokens: {
    'default': { fill: '--zen-interactive-enabled-primary', text: '--zen-interactive-enabled-inverse' },
    'hover': { fill: '--zen-interactive-hovered-primary', text: '--zen-interactive-enabled-inverse' },
    'focused': { fill: '--zen-interactive-enabled-primary', border: '--zen-interactive-focused-stroke-default' },
    'pressed': { fill: '--zen-interactive-dragged-primary', text: '--zen-interactive-enabled-inverse' },
    'disabled': { fill: '--zen-interactive-disabled-primary', text: '--zen-interactive-disabled-secondary' }
  }
}" :data-theme="theme">

  <!-- Controls bar -->
  <div class="playground-controls">
    <div class="control-group" data-label="State">
      <template x-for="s in ['default','hover','focused','pressed','disabled']" :key="s">
        <button @click="state = s"
                :class="{ active: state === s }"
                class="control-btn" x-text="s"></button>
      </template>
    </div>

    <div class="control-group" data-label="Selected">
      <button @click="selected = !selected"
              :class="{ active: selected }"
              class="control-btn">
        <span x-text="selected ? 'On' : 'Off'"></span>
      </button>
    </div>

    <div class="control-group" data-label="Theme">
      <template x-for="t in ['actian','studio','explorer']" :key="t">
        <button @click="theme = t"
                :class="{ active: theme === t }"
                class="control-btn" x-text="t"></button>
      </template>
    </div>
  </div>

  <!-- Component stage (one variant visible at a time) -->
  <div class="playground-stage">
    <div x-show="state === 'default' && !selected"> <!-- Default Off variant HTML --> </div>
    <div x-show="state === 'default' && selected"> <!-- Default On variant HTML --> </div>
    <div x-show="state === 'hover' && !selected"> <!-- Hover Off variant HTML --> </div>
    <!-- ... all combinations ... -->
  </div>

  <!-- Token readout -->
  <div class="playground-tokens">
    <template x-for="[key, value] in Object.entries(tokens[state] || {})" :key="key">
      <div class="token-row">
        <span class="token-key" x-text="key"></span>
        <code class="token-value" x-text="value"></code>
      </div>
    </template>
  </div>
</div>
</body>
</html>
```

### Generation rules

- Claude reads variant axes from `get_design_context` output
- Each axis becomes a control group (boolean → toggle, enum → segmented bar)
- Every axis combination gets its own `x-show` conditional
- Token readout is populated from the component token mapping in CLAUDE.md
- Theme switching uses the existing `tokens.css` `[data-theme]` selectors

---

## Post-push parity check (woven into all output skills)

Every skill, immediately after `use_figma` completes:

### Procedure

1. `get_screenshot` of each pushed card/screen
2. Present screenshots to the designer alongside the static HTML preview URL
3. Run automated checklist:
   - Element count: does the number of cards/screens in Figma match what was pushed?
   - Clipping: any frames with height < 10px or width < 10px? (suggests clipping bug)
   - Text visibility: are text nodes empty or truncated?
4. Report results:
   ```
   Parity check:
   - Card 1 (Page header): OK
   - Card 2 (Actual component): WARNING — variant matrix height is 1px (likely clipped)
   - Card 3 (Anatomy): OK

   Fix Card 2? (yes / skip / done)
   ```
5. On "yes": apply fix via `use_figma`, re-screenshot, re-check the fixed element
6. On "skip": move to next finding
7. On "done": end parity check

### Where it lives

A shared reference file (`references/parity-check.md`) with the procedure and checklist. Each skill's post-push step references it. Not a separate skill — it's the final step of every output skill.

---

## `/refine` skill (standalone)

A new skill invoked after any output skill has pushed to Figma. Works across all output types.

### Invocation

```
/refine screen 3 header is too tall, card 5 missing error state
/refine comments
/refine check
```

### Three input modes

**Mode 1: Conversational feedback** (default)

```
/refine screen 3 header is too tall, card 5 missing error state
```

1. Parse feedback into discrete findings: `[{ target: "screen 3", issue: "header too tall" }, ...]`
2. For each finding:
   a. `get_screenshot` of the specific node to confirm
   b. Determine fix approach:
      - Layout/sizing issue → fix in `use_figma` directly
      - Content/structure issue → fix HTML first, re-preview, then re-push
   c. Apply fix
   d. `get_screenshot` after fix to verify
   e. Present before/after: "Fixed screen 3 header. Before: [img] → After: [img]"
3. After all findings: "Fixed 2 issues. More changes or done?"
4. Loop until "done"

**Mode 2: Figma comment reading**

```
/refine comments
```

1. Read comments from the Figma file (via MCP API if available, or ask designer to paste them)
2. Extract actionable feedback from each comment
3. Present as a list:
   ```
   Found 3 Figma comments:
   1. [Node 123:456] "Header text should be bolder" — @designer
   2. [Node 123:789] "Wrong spacing between cards" — @designer
   3. [Node 124:100] "Add loading state" — @designer

   Fix all, pick specific ones (e.g. "fix 1,3"), or skip?
   ```
4. Apply selected fixes with the same verify-after-each loop

**Mode 3: Parity re-check**

```
/refine check
```

Re-runs the automated parity check from the post-push step. Useful if the designer made manual changes in Figma and wants to verify nothing broke, or if time has passed since the original push.

### Context tracking

`/refine` needs to know what was pushed and where. Output skills must write a manifest after pushing:

```json
// {project_dir}/components/flows/.last-push.json (or components/{name}/.last-push.json)
{
  "skill": "generate-flow",
  "fileKey": "fuWLltVXyBrbn6KfBAav12",
  "pageNodeId": "16105:48",
  "pushedNodes": [
    { "id": "16107:1029", "label": "Screen 1: List view" },
    { "id": "16107:1127", "label": "Screen 2: Create form" }
  ],
  "htmlFile": "glossary-flow.html",
  "prototypeFile": "glossary-flow-prototype.html",
  "pushedAt": "2026-03-27T14:30:00Z"
}
```

`/refine` reads this manifest to know the Figma file, page, and individual nodes. If no manifest exists, it asks the designer for the Figma URL.

### Skill properties

- **Input:** Figma URL (from `.last-push.json` manifest or designer-provided) + feedback text or mode keyword
- **Output:** Fixed Figma frames with before/after screenshots
- **Gate:** Each fix is applied and verified individually; designer confirms or requests more changes
- **Scope:** Works on any pushed output — flows, component briefs, presentations

---

## Files to create or modify

### New files

| File | Description |
|------|-------------|
| `skills/refine/SKILL.md` | The `/refine` skill definition |
| `templates/flow-prototype-wrapper.html` | Alpine.js flow prototype shell (nav bar, screen routing, form simulation CSS) |
| `templates/component-playground-wrapper.html` | Alpine.js component playground shell (controls bar, stage, token readout CSS) |
| `references/prototype-reference.md` | Alpine.js patterns, directive rules, generation guidelines for prototypes and playgrounds |
| `references/parity-check.md` | Post-push verification procedure and automated checklist |

### Modified files

| File | Changes |
|------|---------|
| `skills/generate-flow/SKILL.md` | Add "prototype" gate keyword, prototype generation step, post-push parity check step |
| `skills/component-brief/SKILL.md` | Add "playground" gate keyword, playground generation step, post-push parity check step |
| `skills/generate-presentation/SKILL.md` | Add post-push parity check step |
| `skills/create-component/SKILL.md` | Add post-push parity check step |
| `CLAUDE.md` | Add prototype/playground section, reference parity-check.md |

### Not modified

- Static HTML templates (ds-wrapper, fm-wrapper, card templates) — unchanged
- `ensure-server.sh` — already serves the project directory, serves both files
- Token files — unchanged
- Figma output references — unchanged (prototypes don't go to Figma)

---

## Implementation order

1. **Phase 1: Post-push parity check** — highest impact, smallest change. Add `references/parity-check.md` and wire into all output skills' post-push steps.
2. **Phase 2: `/refine` skill** — the correction loop. Depends on parity check existing (mode 3 reuses it).
3. **Phase 3: Flow prototypes** — Alpine.js wrapper template + generation rules in generate-flow.
4. **Phase 4: Component playgrounds** — Alpine.js wrapper template + generation rules in component-brief.

Phases 1-2 (post-Figma) and Phases 3-4 (pre-Figma) are independent and can be worked in parallel.

---

## Out of scope

- Hot-reload / watch mode on HTML files (nice-to-have, not critical — manual refresh is fine)
- Drag-and-drop or complex micro-interactions in prototypes (keep it click-and-type)
- Prototype-to-Figma push (prototypes are for testing only, static HTML is what gets pushed)
- Responsive/viewport testing in prototypes (screens are fixed at 1440px as today)
- AI-driven visual regression (pixel-diff between HTML screenshot and Figma screenshot) — the parity check is heuristic, not pixel-perfect
