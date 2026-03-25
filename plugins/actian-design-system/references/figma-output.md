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
