# Figma Component Assembler — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Figma plugin that assembles real component instances from published FM Kit and DS2026 libraries, driven by a JSON layout spec served over HTTP.

**Architecture:** A registry builder script queries the Figma REST API for component keys and variant metadata, producing a JSON registry. Claude generates layout spec JSON files that reference registry components. A Figma plugin fetches the spec from a URL, walks the tree, and creates auto-layout frames with real component instances via `importComponentByKeyAsync`.

**Tech Stack:** Node.js (registry builder), TypeScript (Figma plugin), Figma Plugin API, Figma REST API

**Spec:** `docs/superpowers/specs/2026-03-20-figma-component-assembler-design.md`

---

## File Structure

```
actian-design-system-plugin/
├── registry/
│   ├── build-registry.js          # Script: queries Figma REST API, outputs registry JSON
│   ├── build-token-map.js         # Script: parses tokens.css, outputs token-to-hex JSON
│   ├── component-registry.json    # Generated: component keys + variants + text props
│   └── token-map.json             # Generated: --zen-* token name → hex value
├── figma-plugin/
│   ├── manifest.json              # Figma plugin manifest
│   ├── package.json               # Dependencies (typescript)
│   ├── tsconfig.json              # TypeScript config
│   ├── src/
│   │   ├── code.ts                # Plugin sandbox: tree walker, component assembly
│   │   ├── ui.html                # Plugin UI: URL input, assemble button, status log
│   │   └── registry.ts            # Bundled registry + token map, lookup helpers
│   └── dist/                      # Compiled output (gitignored)
│       ├── code.js
│       └── ui.html
└── skills/
    └── generate-flow/SKILL.md     # Modified: add opt-in "real components" mode
```

---

### Task 1: Registry Builder Script

**Files:**
- Create: `registry/build-registry.js`
- Create: `registry/.env.example`

This script calls the Figma REST API and produces `component-registry.json`.

- [ ] **Step 1: Create the .env.example file**

```
FIGMA_TOKEN=figd_your_personal_access_token_here
```

- [ ] **Step 2: Write build-registry.js**

```js
#!/usr/bin/env node

/**
 * Builds component-registry.json from Figma REST API.
 * Usage: FIGMA_TOKEN=figd_xxx node registry/build-registry.js
 */

const LIBRARIES = {
  'fat-marker': { fileKey: 'X2JSEUyLvxyNCx22ucOexn', name: 'Fat Marker Kit' },
  'ds2026': { fileKey: 'l8biHxfarNi1I2RMvVxVOK', name: 'Actian Design System 2026' }
};

const TOKEN = process.env.FIGMA_TOKEN;
if (!TOKEN) {
  console.error('Error: FIGMA_TOKEN environment variable is required');
  process.exit(1);
}

async function fetchFigma(endpoint) {
  const res = await fetch(`https://api.figma.com/v1${endpoint}`, {
    headers: { 'X-Figma-Token': TOKEN }
  });
  if (!res.ok) throw new Error(`Figma API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function getComponents(fileKey) {
  const data = await fetchFigma(`/files/${fileKey}/components`);
  return data.meta.components || [];
}

async function getComponentSets(fileKey) {
  const data = await fetchFigma(`/files/${fileKey}/component_sets`);
  return data.meta.component_sets || [];
}

function extractFromComponentSet(cs) {
  // Extract variant and text properties from a component set's property definitions
  const variants = {};
  const variantShortNames = {};
  const textProperties = [];

  if (cs.component_property_definitions) {
    for (const [fullName, def] of Object.entries(cs.component_property_definitions)) {
      if (def.type === 'VARIANT') {
        const shortName = fullName.split('#')[0];
        variants[fullName] = def.variantOptions || [];
        variantShortNames[shortName] = fullName;
      } else if (def.type === 'TEXT') {
        textProperties.push(fullName);
      }
    }
  }

  return { variants, variantShortNames, textProperties };
}

async function buildRegistry() {
  const registry = {
    meta: {
      generatedAt: new Date().toISOString(),
      libraries: LIBRARIES
    },
    components: {}
  };

  for (const [libId, lib] of Object.entries(LIBRARIES)) {
    console.log(`Fetching components from ${lib.name}...`);
    const [components, componentSets] = await Promise.all([
      getComponents(lib.fileKey),
      getComponentSets(lib.fileKey)
    ]);

    console.log(`  Found ${components.length} components, ${componentSets.length} component sets`);

    // Component sets have variant/text property definitions
    for (const cs of componentSets) {
      const { variants, variantShortNames, textProperties } = extractFromComponentSet(cs);
      registry.components[cs.name] = {
        key: cs.key,
        library: libId,
        variants,
        variantShortNames,
        textProperties
      };
    }

    // Standalone components (no variants) from the components endpoint
    for (const comp of components) {
      if (!registry.components[comp.name]) {
        registry.components[comp.name] = {
          key: comp.key,
          library: libId,
          variants: {},
          variantShortNames: {},
          textProperties: []
        };
      }
    }
  }

  const fs = require('fs');
  const path = require('path');
  const outPath = path.join(__dirname, 'component-registry.json');
  fs.writeFileSync(outPath, JSON.stringify(registry, null, 2));
  console.log(`\nRegistry written to ${outPath}`);
  console.log(`Total components: ${Object.keys(registry.components).length}`);
}

buildRegistry().catch(err => {
  console.error('Failed to build registry:', err.message);
  process.exit(1);
});
```

- [ ] **Step 3: Run the script to generate the registry**

```bash
FIGMA_TOKEN=figd_xxx node registry/build-registry.js
```

Expected: `registry/component-registry.json` created with components from both libraries. Review the output to verify component keys and variant structures are correct.

- [ ] **Step 4: Inspect and validate the generated registry**

Open `registry/component-registry.json` and verify:
- FM Kit components are present (e.g. `FM Button`, `FM App_header`)
- DS2026 components are present (e.g. `Button`, `Text Input`)
- Each component has a `key` (non-empty string)
- Variant properties include the `#uniqueID` suffix
- `variantShortNames` maps cleanly to full names
- `textProperties` lists text override names

If the Figma API returns components differently than expected (e.g. variant structure differs), adjust the extraction logic accordingly.

- [ ] **Step 5: Commit**

```bash
git add registry/build-registry.js registry/.env.example registry/component-registry.json
git commit -m "feat: add registry builder script and initial component registry"
```

---

### Task 2: Token Map Builder Script

**Files:**
- Create: `registry/build-token-map.js`

Parses `tokens/tokens.css` and extracts `--zen-*` variable names → hex values for the Actian (default) theme.

- [ ] **Step 1: Write build-token-map.js**

```js
#!/usr/bin/env node

/**
 * Extracts --zen-* token values from tokens.css (Actian theme only).
 * Usage: node registry/build-token-map.js
 */

const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'tokens', 'tokens.css');
const css = fs.readFileSync(cssPath, 'utf8');

// Extract only the :root / [data-theme='actian'] block (first block in file)
const rootBlock = css.match(/:root,\s*\[data-theme='actian'\]\s*\{([^}]+)\}/s);
if (!rootBlock) {
  console.error('Could not find Actian theme block in tokens.css');
  process.exit(1);
}

const tokenMap = {};
const lines = rootBlock[1].split('\n');

for (const line of lines) {
  const match = line.match(/\s*(--zen-[^:]+):\s*(.+?)\s*;/);
  if (match) {
    tokenMap[match[1]] = match[2];
  }
}

const count = Object.keys(tokenMap).length;
if (count < 50) {
  console.error(`Warning: only ${count} tokens found — expected 50+. Check CSS parsing.`);
}

const outPath = path.join(__dirname, 'token-map.json');
fs.writeFileSync(outPath, JSON.stringify(tokenMap, null, 2));
console.log(`Token map written to ${outPath}`);
console.log(`Total tokens: ${count}`);
```

- [ ] **Step 2: Run the script**

```bash
node registry/build-token-map.js
```

Expected: `registry/token-map.json` created with ~100+ entries mapping `--zen-color-*` → hex values.

- [ ] **Step 3: Verify output**

Check that key tokens resolve correctly:
- `--zen-color-theme-primary` → `#0550dc`
- `--zen-color-background-bg-default` → `#ffffff`
- `--zen-color-background-bg-grey-1` → `#fbfbff`

- [ ] **Step 4: Commit**

```bash
git add registry/build-token-map.js registry/token-map.json
git commit -m "feat: add token map builder and initial token map"
```

---

### Task 3: Figma Plugin — Scaffold and Manifest

**Files:**
- Create: `figma-plugin/manifest.json`
- Create: `figma-plugin/package.json`
- Create: `figma-plugin/tsconfig.json`
- Create: `figma-plugin/.gitignore`

- [ ] **Step 1: Create manifest.json**

```json
{
  "name": "Actian DS Assembler",
  "id": "actian-ds-assembler",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "networkAccess": {
    "allowedDomains": ["localhost", "127.0.0.1"]
  },
  "editorType": ["figma"]
}
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "actian-ds-assembler",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "npm run build:code && npm run build:ui",
    "build:code": "esbuild src/code.ts --bundle --outfile=dist/code.js --target=es2020",
    "build:ui": "mkdir -p dist && cp src/ui.html dist/ui.html",
    "watch": "npm run build:code -- --watch"
  },
  "devDependencies": {
    "@figma/plugin-typings": "^1.0.0",
    "esbuild": "^0.20.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "typeRoots": ["node_modules/@figma"]
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
```

- [ ] **Step 5: Install dependencies**

```bash
cd figma-plugin && npm install
```

- [ ] **Step 6: Create dist directory and verify build scaffold**

```bash
mkdir -p dist && cd ..
```

- [ ] **Step 7: Commit**

```bash
git add figma-plugin/manifest.json figma-plugin/package.json figma-plugin/tsconfig.json figma-plugin/.gitignore
git commit -m "feat: scaffold Figma plugin with manifest and build config"
```

---

### Task 4: Figma Plugin — Registry Module

**Files:**
- Create: `figma-plugin/src/registry.ts`

Bundles the component registry and token map as importable modules with lookup helpers.

- [ ] **Step 1: Write registry.ts**

```ts
// Import generated data (bundled at build time via esbuild)
import componentRegistry from '../../registry/component-registry.json';
import tokenMap from '../../registry/token-map.json';

interface ComponentEntry {
  key: string;
  library: string;
  variants: Record<string, string[]>;
  variantShortNames: Record<string, string>;
  textProperties: string[];
}

interface Registry {
  meta: { generatedAt: string; libraries: Record<string, { fileKey: string; name: string }> };
  components: Record<string, ComponentEntry>;
}

const registry = componentRegistry as Registry;
const tokens = tokenMap as Record<string, string>;

export function lookupComponent(name: string): ComponentEntry | null {
  return registry.components[name] || null;
}

export function resolveVariantProps(
  entry: ComponentEntry,
  shortProps: Record<string, string>
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [shortName, value] of Object.entries(shortProps)) {
    const fullName = entry.variantShortNames[shortName];
    if (fullName) {
      resolved[fullName] = value;
    }
  }
  return resolved;
}

export function resolveTextProps(
  entry: ComponentEntry,
  shortText: Record<string, string>
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [shortName, value] of Object.entries(shortText)) {
    // Find matching text property by short name prefix
    const fullName = entry.textProperties.find(tp => tp.split('#')[0] === shortName);
    if (fullName) {
      resolved[fullName] = value;
    }
  }
  return resolved;
}

export function resolveColor(value: string): RGB | null {
  // Accept raw hex
  if (value.startsWith('#')) return hexToRgb(value);
  // Accept token name
  const hex = tokens[value];
  if (hex) return hexToRgb(hex);
  return null;
}

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255,
  };
}

export function getRegistryStats(): { total: number; fatMarker: number; ds2026: number } {
  let fatMarker = 0;
  let ds2026 = 0;
  for (const entry of Object.values(registry.components)) {
    if (entry.library === 'fat-marker') fatMarker++;
    else ds2026++;
  }
  return { total: fatMarker + ds2026, fatMarker, ds2026 };
}
```

- [ ] **Step 2: Update esbuild config for JSON imports**

In `package.json`, update the build:code script to handle JSON:

```json
"build:code": "esbuild src/code.ts --bundle --outfile=dist/code.js --target=es2020 --loader:.json=json"
```

- [ ] **Step 3: Verify it compiles**

```bash
cd figma-plugin && npx tsc --noEmit && cd ..
```

Expected: No TypeScript errors. (May need to add `"resolveJsonModule": true` to tsconfig.json if errors occur.)

- [ ] **Step 4: Commit**

```bash
git add figma-plugin/src/registry.ts figma-plugin/package.json
git commit -m "feat: add registry module with component/token lookup helpers"
```

---

### Task 5: Figma Plugin — UI

**Files:**
- Create: `figma-plugin/src/ui.html`

Minimal UI with URL input, Assemble button, and status log.

- [ ] **Step 1: Write ui.html**

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, system-ui, sans-serif; font-size: 13px; color: #333; padding: 16px; }
    h1 { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
    label { display: block; font-weight: 500; margin-bottom: 4px; }
    input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; margin-bottom: 12px; }
    input:focus { outline: none; border-color: #0550dc; }
    button { width: 100%; padding: 10px; background: #0550dc; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; }
    button:hover { background: #0440b0; }
    button:disabled { background: #ccc; cursor: not-allowed; }
    #log { margin-top: 16px; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 11px; line-height: 1.6; color: #666; }
    .log-error { color: #c10c0d; }
    .log-success { color: #047800; }
  </style>
</head>
<body>
  <h1>Actian DS Assembler</h1>
  <label for="url">Spec URL</label>
  <input id="url" type="text" value="http://localhost:8765/spec.json" />
  <button id="assemble" onclick="handleAssemble()">Assemble</button>
  <div id="log"></div>

  <script>
    const logEl = document.getElementById('log');
    const btn = document.getElementById('assemble');
    const urlInput = document.getElementById('url');

    function log(msg, type) {
      const div = document.createElement('div');
      div.textContent = msg;
      if (type) div.className = 'log-' + type;
      logEl.appendChild(div);
      logEl.scrollTop = logEl.scrollHeight;
    }

    async function handleAssemble() {
      const url = urlInput.value.trim();
      if (!url) return;

      logEl.innerHTML = '';
      btn.disabled = true;
      btn.textContent = 'Assembling...';
      log('Fetching spec from ' + url + '...');

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const spec = await res.json();
        log('Spec loaded. Sending to plugin...');
        parent.postMessage({ pluginMessage: { type: 'assemble', spec } }, '*');
      } catch (err) {
        log('Failed to fetch spec: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Assemble';
      }
    }

    onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (msg.type === 'log') log(msg.text, msg.level);
      if (msg.type === 'done') {
        log(msg.text, 'success');
        btn.disabled = false;
        btn.textContent = 'Assemble';
      }
      if (msg.type === 'error') {
        log(msg.text, 'error');
        btn.disabled = false;
        btn.textContent = 'Assemble';
      }
    };
  </script>
</body>
</html>
```

- [ ] **Step 2: Build and verify**

```bash
cd figma-plugin && npm run build:ui && cd ..
```

Expected: `dist/ui.html` created.

- [ ] **Step 3: Commit**

```bash
git add figma-plugin/src/ui.html
git commit -m "feat: add Figma plugin UI with URL input and status log"
```

---

### Task 6: Figma Plugin — Core Assembly Engine

**Files:**
- Create: `figma-plugin/src/code.ts`

The sandbox thread that walks the spec tree and creates Figma nodes.

- [ ] **Step 1: Write code.ts**

```ts
import { lookupComponent, resolveVariantProps, resolveTextProps, resolveColor, getRegistryStats } from './registry';

interface SpecFrame {
  type: 'frame';
  name?: string;
  layout: 'vertical' | 'horizontal';
  spacing?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  fill?: string;
  width?: number | 'hug' | 'fill';
  height?: number | 'hug' | 'fill';
  align?: 'min' | 'center' | 'max' | 'space-between';
  counterAlign?: 'min' | 'center' | 'max';
  cornerRadius?: number;
  children: SpecNode[];
}

interface SpecInstance {
  component: string;
  props?: Record<string, string>;
  text?: Record<string, string>;
  width?: number | 'hug' | 'fill';
  height?: number | 'hug' | 'fill';
}

type SpecNode = SpecFrame | SpecInstance;

function isInstance(node: SpecNode): node is SpecInstance {
  return 'component' in node;
}

const ALIGN_MAP = {
  'min': 'MIN',
  'center': 'CENTER',
  'max': 'MAX',
  'space-between': 'SPACE_BETWEEN',
} as const;

const COUNTER_ALIGN_MAP = {
  'min': 'MIN',
  'center': 'CENTER',
  'max': 'MAX',
} as const;

function applySizing(node: SceneNode, width: number | 'hug' | 'fill' | undefined, height: number | 'hug' | 'fill' | undefined) {
  const n = node as any;
  if (typeof width === 'number') {
    n.resize(width, n.height);
    n.layoutSizingHorizontal = 'FIXED';
  } else if (width === 'fill') {
    n.layoutSizingHorizontal = 'FILL';
  } else {
    n.layoutSizingHorizontal = 'HUG';
  }

  if (typeof height === 'number') {
    n.resize(n.width, height);
    n.layoutSizingVertical = 'FIXED';
  } else if (height === 'fill') {
    n.layoutSizingVertical = 'FILL';
  } else {
    n.layoutSizingVertical = 'HUG';
  }
}

function sendLog(text: string, level?: string) {
  figma.ui.postMessage({ type: 'log', text, level });
}

async function assembleFrame(spec: SpecFrame): Promise<SceneNode> {
  const frame = figma.createFrame();
  frame.name = spec.name || 'Frame';

  // Auto-layout
  frame.layoutMode = spec.layout === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL';
  frame.itemSpacing = spec.spacing || 0;

  // Padding
  if (spec.padding) {
    frame.paddingTop = spec.padding.top || 0;
    frame.paddingRight = spec.padding.right || 0;
    frame.paddingBottom = spec.padding.bottom || 0;
    frame.paddingLeft = spec.padding.left || 0;
  }

  // Fill
  if (spec.fill) {
    const color = resolveColor(spec.fill);
    if (color) {
      frame.fills = [{ type: 'SOLID', color }];
    }
  } else {
    frame.fills = [];
  }

  // Alignment
  if (spec.align) {
    frame.primaryAxisAlignItems = ALIGN_MAP[spec.align] || 'MIN';
  }
  if (spec.counterAlign) {
    frame.counterAxisAlignItems = COUNTER_ALIGN_MAP[spec.counterAlign] || 'MIN';
  }

  // Corner radius
  if (spec.cornerRadius) {
    frame.cornerRadius = spec.cornerRadius;
  }

  // Process children
  for (const child of spec.children) {
    const childNode = await assembleNode(child);
    if (childNode) {
      frame.appendChild(childNode);
    }
  }

  // Sizing (after children are added so hug works)
  applySizing(frame, spec.width, spec.height);

  return frame;
}

async function assembleInstance(spec: SpecInstance): Promise<SceneNode | null> {
  const entry = lookupComponent(spec.component);
  if (!entry) {
    sendLog(`⚠ Component not in registry: "${spec.component}" — skipped`, 'error');
    return null;
  }

  try {
    const component = await figma.importComponentByKeyAsync(entry.key);
    const instance = component.createInstance();
    sendLog(`✓ ${spec.component}`);

    // Set variant properties
    if (spec.props) {
      const resolved = resolveVariantProps(entry, spec.props);
      if (Object.keys(resolved).length > 0) {
        instance.setProperties(resolved);
      }
    }

    // Set text overrides
    if (spec.text) {
      const resolved = resolveTextProps(entry, spec.text);
      for (const [propName, value] of Object.entries(resolved)) {
        instance.setProperties({ [propName]: value });
      }
    }

    // Sizing overrides
    if (spec.width || spec.height) {
      applySizing(instance, spec.width, spec.height);
    }

    return instance;
  } catch (err) {
    sendLog(`✗ Failed to import "${spec.component}": ${(err as Error).message}`, 'error');
    return null;
  }
}

async function assembleNode(spec: SpecNode): Promise<SceneNode | null> {
  if (isInstance(spec)) {
    return assembleInstance(spec);
  }
  return assembleFrame(spec);
}

// Plugin entry point
figma.showUI(__html__, { width: 360, height: 400 });

const stats = getRegistryStats();
sendLog(`Registry loaded: ${stats.total} components (${stats.fatMarker} FM, ${stats.ds2026} DS2026)`);

figma.ui.onmessage = async (msg: any) => {
  if (msg.type !== 'assemble') return;

  const spec = msg.spec as SpecNode;
  sendLog('Assembling...');

  try {
    const root = await assembleNode(spec);
    if (root) {
      figma.currentPage.appendChild(root);
      figma.viewport.scrollAndZoomIntoView([root]);
      figma.ui.postMessage({
        type: 'done',
        text: `Done! Frame added to page.`
      });
    } else {
      figma.ui.postMessage({ type: 'error', text: 'Assembly produced no output.' });
    }
  } catch (err) {
    figma.ui.postMessage({ type: 'error', text: `Assembly failed: ${(err as Error).message}` });
  }
};
```

- [ ] **Step 2: Build the plugin**

```bash
cd figma-plugin && npm run build && cd ..
```

Expected: `dist/code.js` and `dist/ui.html` created without errors.

- [ ] **Step 3: Commit**

```bash
git add figma-plugin/src/code.ts
git commit -m "feat: add core assembly engine — tree walker and component instantiation"
```

---

### Task 7: End-to-End Test in Figma

**Files:** None created — manual validation.

- [ ] **Step 1: Create a minimal test spec**

Create `test-spec.json` at the project root:

```json
{
  "version": "1.0",
  "name": "Test Screen",
  "type": "frame",
  "layout": "vertical",
  "width": 800,
  "height": 600,
  "children": [
    { "component": "FM App_header", "width": "fill" },
    {
      "type": "frame",
      "layout": "horizontal",
      "width": "fill",
      "height": "fill",
      "spacing": 0,
      "children": [
        { "component": "FM Side navigation bar", "height": "fill" },
        {
          "type": "frame",
          "name": "Content",
          "layout": "vertical",
          "spacing": 16,
          "padding": { "top": 24, "right": 24, "bottom": 24, "left": 24 },
          "width": "fill",
          "children": [
            { "component": "FM Button", "props": { "Type": "Primary" }, "text": { "Label": "Click me" } }
          ]
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Serve the test spec**

```bash
python3 -m http.server 8765
```

Verify: `curl http://localhost:8765/test-spec.json` returns the JSON.

- [ ] **Step 3: Load the plugin in Figma**

In Figma: Plugins → Development → Import plugin from manifest → select `figma-plugin/manifest.json`.

- [ ] **Step 4: Run the plugin**

- Open any Figma file with the FM Kit library enabled
- Run the plugin (Plugins → Actian DS Assembler)
- URL should be pre-filled with `http://localhost:8765/test-spec.json`
- Click "Assemble"

- [ ] **Step 5: Verify the result**

Check that:
- A root frame "Test Screen" was created (800×600)
- FM App_header instance is present and fills width
- FM Side navigation bar is present
- Content frame has auto-layout vertical with 16px spacing and 24px padding
- FM Button instance has "Primary" variant and "Click me" label
- All components are real library instances (not flat vectors)

- [ ] **Step 6: Fix any issues found and rebuild**

If components don't import or variants don't apply, check:
- Component key matches what's in the registry
- Variant property names include the `#uniqueID` suffix
- The FM Kit library is enabled in the file

- [ ] **Step 7: Clean up and commit**

```bash
rm test-spec.json
git add -A && git commit -m "fix: address issues found during end-to-end testing"
```

---

### Task 8: Update generate-flow Skill

**Files:**
- Modify: `skills/generate-flow/SKILL.md`

Add opt-in "real components" mode documentation to the skill.

- [ ] **Step 1: Read the current skill file**

Read `skills/generate-flow/SKILL.md` fully to understand the current structure.

- [ ] **Step 2: Add the opt-in mode section**

After the existing output section, add a new section:

```markdown
## Real Components Mode (opt-in)

When the user says **"use real components"**, **"assemble in Figma"**, or **"use native components"**, switch from HTML generation to layout spec JSON output.

### How it works

Instead of generating HTML, output a JSON layout spec file that the Actian DS Assembler Figma plugin can consume.

1. Generate a layout spec JSON using the schema defined in `docs/superpowers/specs/2026-03-20-figma-component-assembler-design.md`
2. Reference components by their exact registry names (FM-prefixed for wireframes)
3. Use auto-layout frames with `"hug"` / `"fill"` sizing — avoid hardcoded pixel positions
4. Save as `spec.json` and serve on localhost:8765
5. Tell the user: "Open the Actian DS Assembler plugin in Figma and click Assemble"

### Component name reference

Use exact names from `registry/component-registry.json`. Common FM Kit components:
- `FM App_header`, `FM Side navigation bar`, `FM Side navigation item`
- `FM Button`, `FM Text input field`, `FM Input Label`
- `FM Tabs`, `FM Tab`, `FM Table`, `FM Table Row`
- `FM Page Header`, `FM Sidepanel`, `FM Menu`, `FM Menu item`
- `FM Alert`, `FM Banner`, `FM Empty state`, `FM Dropdown`

### Fallback

If the user hasn't set up the Figma plugin, fall back to the standard HTML workflow.
```

- [ ] **Step 3: Commit**

```bash
git add skills/generate-flow/SKILL.md
git commit -m "feat: add real-components opt-in mode to generate-flow skill"
```

---

### Task 9: Documentation and Final Push

**Files:**
- Modify: `README.md`
- Modify: `.gitignore`

- [ ] **Step 1: Add figma-plugin to .gitignore**

Append to `.gitignore`:
```
# Figma plugin build output
figma-plugin/node_modules/
figma-plugin/dist/
```

- [ ] **Step 2: Update README with assembler section**

Add a section after "Skills" in `README.md`:

```markdown
## Figma Component Assembler

Opt-in mode that assembles real Figma component instances instead of flat HTML captures.

### Setup

1. Build the registry (one-time, re-run when libraries change):
   ```bash
   FIGMA_TOKEN=figd_xxx node registry/build-registry.js
   node registry/build-token-map.js
   ```

2. Build the Figma plugin:
   ```bash
   cd figma-plugin && npm install && npm run build
   ```

3. In Figma: Plugins → Development → Import plugin from manifest → select `figma-plugin/manifest.json`

### Usage

1. Ask Claude to `/generate-flow` with "use real components"
2. Claude serves `spec.json` on localhost:8765
3. In Figma, run the Actian DS Assembler plugin → click Assemble
4. Real component instances appear on your canvas
```

- [ ] **Step 3: Final commit and push**

```bash
git add .gitignore README.md
git commit -m "docs: add assembler setup and usage to README"
git push
```

- [ ] **Step 4: Bump plugin version**

Update version to `1.3.0` in both `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.

```bash
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "chore: bump plugin version to 1.3.0"
git push
```
