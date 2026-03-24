# Component Creator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a component creation mode to the DS Assembler plugin and a new `/create-component` skill, enabling Claude to create real Figma components with variants from a JSON spec.

**Architecture:** A new `creator.ts` module handles `figma.createComponent()`, `figma.createText()`, `figma.combineAsVariants()`, and component property exposure. The plugin UI gains a Create tab. Two skills integrate: `/component-brief` (optional "create in Figma" step) and a new `/create-component` (dedicated component creation from description or Figma reference).

**Tech Stack:** TypeScript (Figma Plugin API), Markdown (skills)

**Spec:** `docs/superpowers/specs/2026-03-21-assembler-component-creator-design.md`

**Repos:**
- **Actian-DS-Assembler** (`/Users/volivari/Developer/Actian/Actian-DS-Assembler`) — plugin code (Tasks 1–6)
- **Actian-DS-Claude-plugin** (`/Users/volivari/Developer/Actian/actian-design-system-plugin`) — skills (Tasks 7–8)

---

## File Structure

### Actian-DS-Assembler
```
plugin/src/
├── types.ts         # Modified: add ComponentSpec, VariantDef, TextNodeSpec interfaces
├── creator.ts       # New: component creation engine
├── code.ts          # Modified: add 'create-component' message handler
└── ui.html          # Modified: add Create tab
```

### Actian-DS-Claude-plugin
```
skills/
├── component-brief/SKILL.md     # Modified: add Step 6 — Create in Figma
└── create-component/SKILL.md    # New: dedicated component creation skill
```

---

### Task 1: Add component spec types to types.ts

**Files:**
- Modify: `plugin/src/types.ts`

- [ ] **Step 1: Add new interfaces**

Add to the end of `types.ts`:

```ts
// Component creation types
export interface TextNodeSpec {
  type: 'text';
  name: string;
  content: string;
  style: string;  // text style name (e.g., 'heading-display', 'body-standard')
  isProperty?: boolean;  // expose as editable component property
}

export interface ComponentChildNode {
  // Can be a frame, text, or nested component instance
  type?: 'frame' | 'text';
  component?: string;  // if referencing an existing component from registry
  name?: string;
  content?: string;
  style?: string;
  isProperty?: boolean;
  props?: Record<string, string>;
  text?: Record<string, string>;
  layout?: 'vertical' | 'horizontal';
  spacing?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  fill?: string;
  width?: number | 'hug' | 'fill';
  height?: number | 'hug' | 'fill';
  align?: 'min' | 'center' | 'max' | 'space-between';
  counterAlign?: 'min' | 'center' | 'max';
  cornerRadius?: number;
  children?: ComponentChildNode[];
}

export interface VariantDefinition {
  variant: Record<string, string>;  // e.g., { "Type": "Title only" }
  layout: 'vertical' | 'horizontal';
  width?: number | 'hug' | 'fill';
  height?: number | 'hug' | 'fill';
  spacing?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  align?: 'min' | 'center' | 'max' | 'space-between';
  counterAlign?: 'min' | 'center' | 'max';
  fill?: string;
  children: ComponentChildNode[];
}

export interface ComponentSpec {
  type: 'component';
  name: string;
  description?: string;
  library?: 'fat-marker' | 'ds2026';  // determines font family
  variants?: Record<string, string[]>;  // e.g., { "Type": ["Title only", "Title + Actions"] }
  defaultVariant?: Record<string, string>;
  definitions: VariantDefinition[];
}
```

- [ ] **Step 2: Build and verify**

```bash
cd plugin && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add plugin/src/types.ts
git commit -m "feat: add ComponentSpec types for component creation"
```

---

### Task 2: Creator engine — text nodes and font loading

**Files:**
- Create: `plugin/src/creator.ts`

The core creation engine. Start with text node creation and font loading, since that's the trickiest part.

- [ ] **Step 1: Write creator.ts with text node support**

```ts
import { ComponentSpec, VariantDefinition, ComponentChildNode, Registry } from './types';

let registry: Registry | null = null;

export function setCreatorRegistry(reg: Registry) { registry = reg; }

function sendLog(text: string, level?: string) {
  figma.ui.postMessage({ type: 'log', text, level });
}

function yieldToMain(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

// Text style definitions — FM Kit (Inter) and DS2026 (Roboto)
const TEXT_STYLES: Record<string, Record<string, { family: string; style: string; size: number; weight: number; lineHeight: number; letterSpacing: number }>> = {
  'fat-marker': {
    'heading-display': { family: 'Inter', style: 'Semi Bold', size: 24, weight: 600, lineHeight: 34, letterSpacing: 0 },
    'heading-prominent': { family: 'Inter', style: 'Semi Bold', size: 18, weight: 600, lineHeight: 26, letterSpacing: 0 },
    'heading-standard': { family: 'Inter', style: 'Semi Bold', size: 16, weight: 600, lineHeight: 24, letterSpacing: 0.1 },
    'heading-subtle': { family: 'Inter', style: 'Semi Bold', size: 14, weight: 600, lineHeight: 20, letterSpacing: 0.2 },
    'body-standard': { family: 'Inter', style: 'Regular', size: 14, weight: 400, lineHeight: 22, letterSpacing: -0.28 },
    'body-subtle': { family: 'Inter', style: 'Regular', size: 12, weight: 400, lineHeight: 16, letterSpacing: 0.3 },
    'label-standard': { family: 'Inter', style: 'Medium', size: 14, weight: 500, lineHeight: 20, letterSpacing: 0.2 },
    'label-subtle': { family: 'Inter', style: 'Medium', size: 12, weight: 500, lineHeight: 16, letterSpacing: 0.3 },
    'label-micro': { family: 'Inter', style: 'Medium', size: 11, weight: 500, lineHeight: 14, letterSpacing: 0.4 },
  },
  ds2026: {
    'heading-display': { family: 'Roboto', style: 'Semi Bold', size: 24, weight: 600, lineHeight: 28, letterSpacing: 0 },
    'heading-prominent': { family: 'Roboto', style: 'Semi Bold', size: 18, weight: 600, lineHeight: 26, letterSpacing: 0 },
    'heading-standard': { family: 'Roboto', style: 'Semi Bold', size: 16, weight: 600, lineHeight: 24, letterSpacing: 0.1 },
    'heading-subtle': { family: 'Roboto', style: 'Semi Bold', size: 14, weight: 600, lineHeight: 20, letterSpacing: 0.2 },
    'body-standard': { family: 'Roboto', style: 'Regular', size: 14, weight: 400, lineHeight: 20, letterSpacing: 0.2 },
    'body-subtle': { family: 'Roboto', style: 'Regular', size: 12, weight: 400, lineHeight: 16, letterSpacing: 0.3 },
    'body-micro': { family: 'Roboto', style: 'Regular', size: 11, weight: 400, lineHeight: 14, letterSpacing: 0.4 },
    'label-standard': { family: 'Roboto', style: 'Medium', size: 14, weight: 500, lineHeight: 20, letterSpacing: 0.2 },
    'label-subtle': { family: 'Roboto', style: 'Medium', size: 12, weight: 500, lineHeight: 16, letterSpacing: 0.3 },
    'label-micro': { family: 'Roboto', style: 'Medium', size: 11, weight: 500, lineHeight: 14, letterSpacing: 0.4 },
  },
};

// Pre-load all fonts we might need
async function loadFonts(library: string) {
  const styles = TEXT_STYLES[library] || TEXT_STYLES['ds2026'];
  const families = new Set<string>();
  for (const s of Object.values(styles)) {
    families.add(`${s.family}:${s.style}`);
  }
  for (const key of families) {
    const [family, style] = key.split(':');
    try {
      await figma.loadFontAsync({ family, style });
    } catch (err) {
      sendLog(`Font not available: ${family} ${style}`, 'error');
    }
  }
}

// Create a text node with a named style
async function createTextNode(spec: ComponentChildNode, library: string): Promise<TextNode> {
  const styles = TEXT_STYLES[library] || TEXT_STYLES['ds2026'];
  const styleDef = styles[spec.style || 'body-standard'];

  const text = figma.createText();
  text.name = spec.name || 'Text';

  if (styleDef) {
    text.fontName = { family: styleDef.family, style: styleDef.style };
    text.fontSize = styleDef.size;
    text.lineHeight = { value: styleDef.lineHeight, unit: 'PIXELS' };
    text.letterSpacing = { value: styleDef.letterSpacing, unit: 'PIXELS' };
  }

  text.characters = spec.content || 'Text';
  return text;
}

export { loadFonts, createTextNode, TEXT_STYLES };
```

- [ ] **Step 2: Build and verify**

```bash
cd plugin && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add plugin/src/creator.ts
git commit -m "feat: add creator module with text node creation and font loading"
```

---

### Task 3: Creator engine — component and variant creation

**Files:**
- Modify: `plugin/src/creator.ts`

Add the main `createComponent()` function that builds variants and combines them.

- [ ] **Step 1: Add component creation functions**

Add to `creator.ts`:

```ts
// Component import cache (reuse from assembler)
const componentCache = new Map<string, ComponentNode>();
const componentSetCache = new Map<string, ComponentSetNode>();

function lookupRegistryEntry(name: string) {
  if (!registry) return null;
  return registry.components[name] || null;
}

// Build a child node inside a component variant
async function buildChildNode(spec: ComponentChildNode, library: string): Promise<SceneNode | null> {
  // Text node
  if (spec.type === 'text') {
    return createTextNode(spec, library);
  }

  // Nested component instance
  if (spec.component) {
    const entry = lookupRegistryEntry(spec.component);
    if (!entry) {
      sendLog(`Component "${spec.component}" not in registry — skipped`, 'error');
      return null;
    }
    try {
      const hasVariants = Object.keys(entry.variants).length > 0;
      let instance: InstanceNode;
      if (hasVariants) {
        let cs = componentSetCache.get(entry.key);
        if (!cs) { cs = await figma.importComponentSetByKeyAsync(entry.key); componentSetCache.set(entry.key, cs); }
        instance = cs.defaultVariant.createInstance();
      } else {
        let c = componentCache.get(entry.key);
        if (!c) { c = await figma.importComponentByKeyAsync(entry.key); componentCache.set(entry.key, c); }
        instance = c.createInstance();
      }
      // Apply variant props
      if (spec.props) {
        const resolved: Record<string, string> = {};
        for (const [short, val] of Object.entries(spec.props)) {
          const full = entry.variantShortNames[short];
          if (full) resolved[full] = val;
        }
        if (Object.keys(resolved).length > 0) {
          try { instance.setProperties(resolved); } catch (_) {}
        }
      }
      return instance;
    } catch (err) {
      sendLog(`Failed to import "${spec.component}": ${(err as Error).message}`, 'error');
      return null;
    }
  }

  // Frame (container)
  if (spec.type === 'frame' || spec.children) {
    const frame = figma.createFrame();
    frame.name = spec.name || 'Frame';
    if (spec.layout) {
      frame.layoutMode = spec.layout === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL';
      frame.layoutSizingHorizontal = 'HUG';
      frame.layoutSizingVertical = 'HUG';
    }
    if (spec.spacing !== undefined) frame.itemSpacing = spec.spacing;
    if (spec.padding) {
      frame.paddingTop = spec.padding.top || 0;
      frame.paddingRight = spec.padding.right || 0;
      frame.paddingBottom = spec.padding.bottom || 0;
      frame.paddingLeft = spec.padding.left || 0;
    }
    if (spec.fill) {
      const hex = spec.fill.replace('#', '');
      frame.fills = [{ type: 'SOLID', color: {
        r: parseInt(hex.substring(0, 2), 16) / 255,
        g: parseInt(hex.substring(2, 4), 16) / 255,
        b: parseInt(hex.substring(4, 6), 16) / 255,
      }}];
    } else {
      frame.fills = [];
    }
    if (spec.align) {
      const map: Record<string, string> = { min: 'MIN', center: 'CENTER', max: 'MAX', 'space-between': 'SPACE_BETWEEN' };
      frame.primaryAxisAlignItems = (map[spec.align] || 'MIN') as any;
    }
    if (spec.counterAlign) {
      const map: Record<string, string> = { min: 'MIN', center: 'CENTER', max: 'MAX' };
      frame.counterAxisAlignItems = (map[spec.counterAlign] || 'MIN') as any;
    }
    if (spec.cornerRadius) frame.cornerRadius = spec.cornerRadius;

    for (const child of spec.children || []) {
      const childNode = await buildChildNode(child, library);
      if (childNode) frame.appendChild(childNode);
    }

    // Apply sizing after children
    if (typeof spec.width === 'number') { frame.resize(spec.width, frame.height); frame.layoutSizingHorizontal = 'FIXED'; }
    else if (spec.width === 'fill') frame.layoutSizingHorizontal = 'FILL';
    if (typeof spec.height === 'number') { frame.resize(frame.width, spec.height); frame.layoutSizingVertical = 'FIXED'; }
    else if (spec.height === 'fill') frame.layoutSizingVertical = 'FILL';

    return frame;
  }

  return null;
}

// Build a single variant as a ComponentNode
async function buildVariant(def: VariantDefinition, variantName: string, library: string): Promise<ComponentNode> {
  const comp = figma.createComponent();
  comp.name = variantName;

  comp.layoutMode = def.layout === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL';
  comp.layoutSizingHorizontal = 'HUG';
  comp.layoutSizingVertical = 'HUG';

  if (def.spacing !== undefined) comp.itemSpacing = def.spacing;
  if (def.padding) {
    comp.paddingTop = def.padding.top || 0;
    comp.paddingRight = def.padding.right || 0;
    comp.paddingBottom = def.padding.bottom || 0;
    comp.paddingLeft = def.padding.left || 0;
  }
  if (def.fill) {
    const hex = def.fill.replace('#', '');
    comp.fills = [{ type: 'SOLID', color: {
      r: parseInt(hex.substring(0, 2), 16) / 255,
      g: parseInt(hex.substring(2, 4), 16) / 255,
      b: parseInt(hex.substring(4, 6), 16) / 255,
    }}];
  } else {
    comp.fills = [];
  }
  if (def.align) {
    const map: Record<string, string> = { min: 'MIN', center: 'CENTER', max: 'MAX', 'space-between': 'SPACE_BETWEEN' };
    comp.primaryAxisAlignItems = (map[def.align] || 'MIN') as any;
  }
  if (def.counterAlign) {
    const map: Record<string, string> = { min: 'MIN', center: 'CENTER', max: 'MAX' };
    comp.counterAxisAlignItems = (map[def.counterAlign] || 'MIN') as any;
  }

  // Build children
  const textProperties: { node: TextNode; spec: ComponentChildNode }[] = [];
  for (const childSpec of def.children) {
    const childNode = await buildChildNode(childSpec, library);
    if (childNode) {
      comp.appendChild(childNode);
      // Track text nodes for property exposure
      if (childSpec.type === 'text' && childSpec.isProperty && childNode.type === 'TEXT') {
        textProperties.push({ node: childNode, spec: childSpec });
      }
    }
    await yieldToMain();
  }

  // Expose text properties
  for (const { node, spec } of textProperties) {
    const propName = spec.name || 'Text';
    try {
      comp.addComponentProperty(propName, 'TEXT', node.characters);
      // Link text node to the property
      const propDefs = comp.componentPropertyDefinitions;
      const fullKey = Object.keys(propDefs).find(k => k.startsWith(propName + '#'));
      if (fullKey) {
        node.componentPropertyReferences = { characters: fullKey };
      }
    } catch (err) {
      sendLog(`Failed to expose property "${propName}": ${(err as Error).message}`, 'error');
    }
  }

  // Apply sizing
  if (typeof def.width === 'number') { comp.resize(def.width, comp.height); comp.layoutSizingHorizontal = 'FIXED'; }
  if (typeof def.height === 'number') { comp.resize(comp.width, def.height); comp.layoutSizingVertical = 'FIXED'; }

  return comp;
}

// Main entry: create a component or component set from a spec
export async function createComponentFromSpec(spec: ComponentSpec): Promise<SceneNode> {
  const library = spec.library || 'ds2026';
  sendLog(`Loading fonts for ${library}...`);
  await loadFonts(library);

  if (spec.definitions.length === 1 && !spec.variants) {
    // Single component (no variants)
    sendLog(`Creating component: ${spec.name}`);
    const comp = await buildVariant(spec.definitions[0], spec.name, library);
    if (spec.description) comp.description = spec.description;
    sendLog(`Component "${spec.name}" created`, 'success');
    return comp;
  }

  // Multiple variants → component set
  sendLog(`Creating ${spec.definitions.length} variants...`);
  const variants: ComponentNode[] = [];

  for (const def of spec.definitions) {
    // Build variant name from variant props: "Type=Title only, Size=Default"
    const variantName = Object.entries(def.variant).map(([k, v]) => `${k}=${v}`).join(', ');
    sendLog(`  Variant: ${variantName}`);
    const comp = await buildVariant(def, variantName, library);
    variants.push(comp);
    await yieldToMain();
  }

  sendLog('Combining into component set...');
  const componentSet = figma.combineAsVariants(variants, figma.currentPage);
  componentSet.name = spec.name;
  if (spec.description) componentSet.description = spec.description;

  sendLog(`Component set "${spec.name}" created with ${variants.length} variants`, 'success');
  return componentSet;
}
```

- [ ] **Step 2: Build and verify**

```bash
cd plugin && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add plugin/src/creator.ts
git commit -m "feat: add component and variant creation with text properties"
```

---

### Task 4: Wire creator into code.ts

**Files:**
- Modify: `plugin/src/code.ts`

- [ ] **Step 1: Add imports and message handler**

At the top of code.ts, add:
```ts
import { createComponentFromSpec, setCreatorRegistry } from './creator';
```

In the `load-registry` handler, add:
```ts
setCreatorRegistry(registry);
```

Add a new message handler:
```ts
if (msg.type === 'create-component') {
  const spec = msg.spec;
  try {
    sendLog('Creating component...');
    const result = await createComponentFromSpec(spec);
    figma.currentPage.appendChild(result);
    figma.viewport.scrollAndZoomIntoView([result]);
    figma.ui.postMessage({ type: 'create-done', text: `Component "${spec.name}" created!` });
  } catch (err) {
    figma.ui.postMessage({ type: 'error', text: `Creation failed: ${(err as Error).message}` });
  }
  return;
}
```

- [ ] **Step 2: Build and verify**

```bash
cd plugin && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add plugin/src/code.ts
git commit -m "feat: wire component creator into plugin message handler"
```

---

### Task 5: Plugin UI — Create tab

**Files:**
- Modify: `plugin/src/ui.html`

- [ ] **Step 1: Add Create tab button**

In the tabs div, add:
```html
<button class="tab" data-tab="create" onclick="switchTab('create')">Create</button>
```

- [ ] **Step 2: Add Create panel**

After the Update panel div:
```html
<div id="createPanel" class="panel">
  <label>Component spec file</label>
  <input id="componentSpecFile" type="text" value="component-spec.json" placeholder="component-spec.json" />
  <button class="btn btn-primary" id="createBtn" onclick="handleCreate()">Create Component</button>
  <div id="createProgress" class="progress-container hidden">
    <div class="progress-bar"><div class="progress-fill" id="createFill"></div></div>
    <div class="progress-text" id="createText"></div>
  </div>
</div>
```

- [ ] **Step 3: Add JavaScript handler**

```js
async function handleCreate() {
  const specFile = document.getElementById('componentSpecFile').value.trim();
  const specUrl = getBaseUrl() + '/' + specFile;
  const btn = document.getElementById('createBtn');
  btn.disabled = true; btn.textContent = 'Creating...';
  logEl.innerHTML = '';
  try {
    const res = await fetch(specUrl);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const spec = await res.json();
    log('Spec loaded: ' + spec.name + ' (' + (spec.definitions || []).length + ' variants)');
    parent.postMessage({ pluginMessage: { type: 'create-component', spec } }, '*');
  } catch (err) {
    log('Failed: ' + err.message, 'error');
    btn.disabled = false; btn.textContent = 'Create Component';
  }
}
```

Add to the message handler:
```js
if (msg.type === 'create-done') {
  log(msg.text, 'success');
  document.getElementById('createBtn').disabled = false;
  document.getElementById('createBtn').textContent = 'Create Component';
}
```

- [ ] **Step 4: Build and verify**

```bash
cd plugin && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add plugin/src/ui.html
git commit -m "feat: add Create tab to plugin UI"
```

---

### Task 6: E2E test — create FM Page Header with variants

**Files:** None — manual testing.

- [ ] **Step 1: Create a test component spec**

Save to `/Users/volivari/Developer/Actian/Actian-DS-Assembler/component-spec.json`:

```json
{
  "type": "component",
  "name": "FM Page Header",
  "description": "Page title area with optional subtitle and action buttons.",
  "library": "fat-marker",
  "variants": {
    "Type": ["Title only", "Title + Subtitle", "Title + Actions"]
  },
  "definitions": [
    {
      "variant": { "Type": "Title only" },
      "layout": "horizontal",
      "width": 600,
      "counterAlign": "center",
      "children": [
        { "type": "text", "name": "Title", "content": "Page Title", "style": "heading-display", "isProperty": true }
      ]
    },
    {
      "variant": { "Type": "Title + Subtitle" },
      "layout": "vertical",
      "width": 600,
      "spacing": 4,
      "children": [
        { "type": "text", "name": "Title", "content": "Page Title", "style": "heading-display", "isProperty": true },
        { "type": "text", "name": "Subtitle", "content": "Description text", "style": "body-standard", "isProperty": true }
      ]
    },
    {
      "variant": { "Type": "Title + Actions" },
      "layout": "horizontal",
      "width": 600,
      "align": "space-between",
      "counterAlign": "center",
      "children": [
        {
          "type": "frame",
          "layout": "vertical",
          "spacing": 4,
          "width": "fill",
          "children": [
            { "type": "text", "name": "Title", "content": "Page Title", "style": "heading-display", "isProperty": true },
            { "type": "text", "name": "Subtitle", "content": "Description text", "style": "body-standard", "isProperty": true }
          ]
        },
        {
          "type": "frame",
          "name": "Actions",
          "layout": "horizontal",
          "spacing": 8,
          "children": [
            { "component": "FM Button", "props": { "Type": "Secondary", "Size": "sm" } },
            { "component": "FM Button", "props": { "Type": "Primary", "Size": "sm" } }
          ]
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Serve and run**

```bash
cd /Users/volivari/Developer/Actian/Actian-DS-Assembler && python3 serve.py 8765
```

In Figma: DS Assembler → Load Registry → Create tab → enter `component-spec.json` → Create Component.

- [ ] **Step 3: Verify**

Check that:
- A component set "FM Page Header" was created with 3 variants
- Each variant has the correct auto-layout
- Title and Subtitle text nodes are exposed as component properties
- "Title + Actions" variant has real FM Button instances
- The component can be instantiated and properties edited

- [ ] **Step 4: Commit fixes if needed**

```bash
git add -A && git commit -m "fix: address issues found during component creator E2E testing"
```

---

### Task 7: New /create-component skill

**Files:**
- Create: `skills/create-component/SKILL.md`

**Working directory:** `/Users/volivari/Developer/Actian/actian-design-system-plugin`

- [ ] **Step 1: Write the skill**

```markdown
---
name: create-component
description: Create a new Figma component with variants from a description or reference. Uses the DS Assembler plugin. Use when user asks to create, build, or add a new component to the design system.
argument-hint: "[component description or Figma URL]"
---

# Create Component

Create a new Figma component (with variants) from a text description or by extending an existing component.

> Uses the DS Assembler plugin's Create mode. Requires the plugin to be installed and `python3 serve.py 8765` running.

## Input

The user describes a component they want to create. Examples:
- "Create a Page Header component with title, subtitle, and action buttons variants"
- "Add a Card component with Default, Hover, and Selected states"
- "Extend this component with a new variant" + Figma URL

## Step 1 — Understand the component

Clarify:
- **Component name** (with FM or DS2026 prefix convention)
- **Library** — Fat Marker (Inter font) or DS2026 (Roboto font)?
- **Variants** — what axes and values? (e.g., Type: Default / With Actions / Compact)
- **Content** — what text, icons, or nested components does each variant contain?
- **Layout** — horizontal or vertical? Spacing? Padding?
- **Properties** — which text fields should be editable component properties?

If a Figma URL is provided, fetch it with `get_design_context` + `get_screenshot` to understand the existing component before extending it.

## Step 2 — Check existing components

Before creating, check:
1. `docs/ds2026-component-reference.md` — does it already exist in DS2026?
2. `docs/fm-component-catalog.md` — does it already exist in FM Kit?
3. Registry: `registry/component-registry.json` — is there a key for it?

If it exists, suggest modifying it instead of creating a duplicate.

## Step 3 — Generate the component spec

Generate a `component-spec.json` following this schema:

```json
{
  "type": "component",
  "name": "Component Name",
  "description": "What it does and when to use it.",
  "library": "fat-marker",
  "variants": { "Type": ["Default", "With Actions"] },
  "definitions": [
    {
      "variant": { "Type": "Default" },
      "layout": "horizontal",
      "children": [
        { "type": "text", "name": "Title", "content": "Title", "style": "heading-display", "isProperty": true }
      ]
    }
  ]
}
```

### Available text styles

| Style name | FM Kit (Inter) | DS2026 (Roboto) |
|------------|---------------|-----------------|
| `heading-display` | 24px/600 | 24px/600 |
| `heading-prominent` | 18px/600 | 18px/600 |
| `heading-standard` | 16px/600 | 16px/600 |
| `heading-subtle` | 14px/600 | 14px/600 |
| `body-standard` | 14px/400 | 14px/400 |
| `body-subtle` | 12px/400 | 12px/400 |
| `label-standard` | 14px/500 | 14px/500 |
| `label-subtle` | 12px/500 | 12px/500 |
| `label-micro` | 11px/500 | 11px/500 |

### Nesting existing components

Use `"component": "FM Button"` to nest published component instances:
```json
{ "component": "FM Button", "props": { "Type": "Primary", "Size": "sm" } }
```

## Step 4 — Save and create

1. Save `component-spec.json` to `/Users/volivari/Developer/Actian/Actian-DS-Assembler/component-spec.json`
2. Ensure `python3 serve.py 8765` is running
3. Tell the user: **"Open DS Assembler → Create tab → enter component-spec.json → Create Component"**
4. After creation, remind user to publish to library if it's a shared component

## Step 5 — Update references

After the component is created and published:
1. Run `sync-all.js` to update the registry and reference docs
2. If it's a FM Kit component, update `registry/fm-descriptions.json` with a description
```

- [ ] **Step 2: Commit**

```bash
git add skills/create-component/SKILL.md
git commit -m "feat: add /create-component skill for component creation via DS Assembler"
```

---

### Task 8: Update /component-brief with optional Figma creation

**Files:**
- Modify: `skills/component-brief/SKILL.md`

**Working directory:** `/Users/volivari/Developer/Actian/actian-design-system-plugin`

- [ ] **Step 1: Add Step 6 to component-brief**

After the existing Step 5 (Capture to Figma), add:

```markdown
## Step 6 — Create in Figma (optional)

If the user says "create it in Figma", "build the component", or "make it real":

1. Generate a `component-spec.json` from the brief's card data:
   - Component name from Card 1
   - Variants from Card 2 and Card 5 (API)
   - Internal layout from Card 3 (Anatomy)
   - Text properties from Card 5 (API) text props
   - Library: Fat Marker (if FM mode) or DS2026 (if Actian DS mode)

2. Save to `/Users/volivari/Developer/Actian/Actian-DS-Assembler/component-spec.json`

3. Tell the user: **"Open DS Assembler → Create tab → enter component-spec.json → Create Component"**

4. After creation, remind user to:
   - Review the component in Figma
   - Publish to library
   - Run `sync-all.js` to update the registry
```

- [ ] **Step 2: Commit**

```bash
git add skills/component-brief/SKILL.md
git commit -m "feat: add optional Figma creation step to component-brief skill"
```

---

### Task 9: Documentation

**Files:**
- Modify: `README.md` (Assembler repo)

**Working directory:** `/Users/volivari/Developer/Actian/Actian-DS-Assembler`

- [ ] **Step 1: Add Create section to README**

After the Update section:

```markdown
## Create

Create new Figma components with variants from a JSON spec.

1. Place a `component-spec.json` in the project root
2. Open DS Assembler → **Create** tab
3. Enter the spec filename → click **Create Component**
4. The component (or component set with variants) appears on your canvas
5. Publish to library when ready

### Component spec format

```json
{
  "type": "component",
  "name": "My Component",
  "description": "What it does.",
  "library": "fat-marker",
  "variants": { "Type": ["Default", "Active"] },
  "definitions": [
    {
      "variant": { "Type": "Default" },
      "layout": "horizontal",
      "children": [
        { "type": "text", "name": "Label", "content": "Label", "style": "label-standard", "isProperty": true },
        { "component": "FM Button", "props": { "Type": "Primary" } }
      ]
    }
  ]
}
```

Supports: text nodes with style, nested component instances, auto-layout frames, text properties exposed as editable component properties.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add Create mode documentation to README"
```
