# DS Assembler — Analyzer & Updater Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add analyze + update modes to the DS Assembler Figma plugin, enabling a bidirectional loop where Claude reads design state and applies fixes.

**Architecture:** The plugin gains two new modes alongside Assemble: Analyze scans the document tree and POSTs results to localhost; Update fetches fix instructions from localhost and applies them. serve.py gains POST endpoints. The plugin UI gets a tab/mode selector.

**Tech Stack:** TypeScript (Figma Plugin API), Python (serve.py), Markdown (skill updates)

**Spec:** `docs/superpowers/specs/2026-03-21-assembler-analyzer-design.md`

**Repo:** `/Users/volivari/Developer/Actian/Actian-DS-Assembler`

---

## File Structure

### Actian-DS-Assembler (modified files)
```
Actian-DS-Assembler/
├── serve.py                       # Modified: add POST handlers for /analysis and /update-result
├── plugin/
│   ├── src/
│   │   ├── code.ts                # Modified: add message handlers for analyze + update
│   │   ├── analyzer.ts            # New: tree walker, issue detection, analysis output
│   │   ├── updater.ts             # New: update instruction parser, apply actions
│   │   ├── types.ts               # New: shared interfaces (extract from code.ts)
│   │   └── ui.html                # Modified: add tab selector, analyze/update panels
│   └── ...
└── ...
```

### Actian-DS-Claude-plugin (skill update only)
```
actian-design-system-plugin/
└── skills/
    └── design-audit/SKILL.md      # Modified: add analyzer integration steps
```

---

### Task 1: Extract shared types to types.ts

**Files:**
- Create: `plugin/src/types.ts`
- Modify: `plugin/src/code.ts`

Extract interfaces that will be shared between code.ts, analyzer.ts, and updater.ts.

- [ ] **Step 1: Create types.ts**

```ts
// Shared types for DS Assembler plugin

export interface ComponentEntry {
  key: string;
  library: string;
  variants: Record<string, string[]>;
  variantShortNames: Record<string, string>;
  textProperties: string[];
}

export interface Registry {
  meta: { generatedAt: string; libraries: Record<string, any> };
  components: Record<string, ComponentEntry>;
}

export interface SpecFrame {
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

export interface SpecInstance {
  component: string;
  props?: Record<string, string>;
  text?: Record<string, string>;
  width?: number | 'hug' | 'fill';
  height?: number | 'hug' | 'fill';
}

export type SpecNode = SpecFrame | SpecInstance;

// Analysis output types
export interface AnalysisResult {
  file: { name: string; key: string };
  scope: 'page' | 'file';
  page: { name: string; id: string };
  instances: InstanceInfo[];
  issues: Issue[];
  stats: AnalysisStats;
}

export interface InstanceInfo {
  nodeId: string;
  name: string;
  componentKey: string;
  componentName: string;
  library: string;
  variants: Record<string, string>;
  textOverrides: Record<string, string>;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Issue {
  nodeId: string;
  type: 'hardcoded-color' | 'detached-component' | 'missing-auto-layout' | 'non-library-node' | 'spacing-inconsistency';
  description: string;
  severity: 'error' | 'warning' | 'info';
}

export interface AnalysisStats {
  totalNodes: number;
  instances: number;
  uniqueComponents: number;
  hardcodedColors: number;
  missingAutoLayout: number;
}

// Update instruction types
export interface UpdateInstruction {
  nodeId: string;
  action: 'set-variant' | 'set-text' | 'swap-component' | 'replace-with-instance' | 'delete' | 'set-fill' | 'set-auto-layout';
  props?: Record<string, string>;
  text?: Record<string, string>;
  componentName?: string;
  fill?: string;
  layout?: 'vertical' | 'horizontal';
  spacing?: number;
}

export interface UpdatePlan {
  updates: UpdateInstruction[];
}

export interface UpdateResult {
  applied: number;
  failed: number;
  skipped: number;
  details: { nodeId: string; action: string; status: 'applied' | 'failed' | 'skipped'; message?: string }[];
}
```

- [ ] **Step 2: Update code.ts imports**

Replace the inline interfaces at the top of `code.ts` with:
```ts
import { ComponentEntry, Registry, SpecFrame, SpecInstance, SpecNode } from './types';
```

Remove the duplicate interface definitions from code.ts.

- [ ] **Step 3: Build and verify**

```bash
cd plugin && npm run build
```

Expected: builds successfully, same 11KB bundle.

- [ ] **Step 4: Commit**

```bash
git add plugin/src/types.ts plugin/src/code.ts
git commit -m "refactor: extract shared types to types.ts"
```

---

### Task 2: serve.py — Add POST endpoints

**Files:**
- Modify: `serve.py`

Add POST handlers so the plugin can write analysis results and update results back to the server.

- [ ] **Step 1: Update serve.py**

```python
#!/usr/bin/env python3
"""HTTP server with CORS and POST support for DS Assembler plugin."""
import http.server
import json
import os
import sys

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

class AssemblerHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        file_map = {
            '/analysis': 'analysis.json',
            '/update-result': 'update-result.json',
        }

        filename = file_map.get(self.path)
        if not filename:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Unknown endpoint')
            return

        filepath = os.path.join(DATA_DIR, filename)
        try:
            # Validate JSON
            data = json.loads(body)
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"[POST] Saved {self.path} → {filepath} ({len(body)} bytes)")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "file": filename}).encode())
        except json.JSONDecodeError as e:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(f"Invalid JSON: {e}".encode())

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
print(f"DS Assembler server on http://localhost:{port}")
print(f"  GET  /registry/...     → component registry")
print(f"  GET  /spec.json        → layout spec")
print(f"  POST /analysis         → save analysis results")
print(f"  GET  /updates.json     → update instructions")
print(f"  POST /update-result    → save update results")
http.server.HTTPServer(('', port), AssemblerHandler).serve_forever()
```

- [ ] **Step 2: Test POST endpoint**

```bash
python3 serve.py 8765 &
curl -X POST http://localhost:8765/analysis -H 'Content-Type: application/json' -d '{"test": true}'
cat analysis.json
```

Expected: `{"test": true}` saved to `analysis.json`.

- [ ] **Step 3: Add generated files to .gitignore**

Append to `.gitignore`:
```
analysis.json
update-result.json
updates.json
```

- [ ] **Step 4: Commit**

```bash
git add serve.py .gitignore
git commit -m "feat: add POST endpoints to serve.py for analysis and update results"
```

---

### Task 3: Analyzer — Tree walker and instance detection

**Files:**
- Create: `plugin/src/analyzer.ts`

The core analysis engine that walks the Figma document tree.

- [ ] **Step 1: Write analyzer.ts**

```ts
import { Registry, ComponentEntry, AnalysisResult, InstanceInfo, Issue, AnalysisStats } from './types';

let registry: Registry | null = null;
let abortAnalysis = false;

export function setAnalyzerRegistry(reg: Registry) { registry = reg; }
export function cancelAnalysis() { abortAnalysis = true; }

function yieldToMain(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

function sendLog(text: string, level?: string) {
  figma.ui.postMessage({ type: 'log', text, level });
}

function sendAnalysisProgress(current: number, total: number) {
  figma.ui.postMessage({ type: 'analysis-progress', current, total });
}

// Build reverse lookup: componentKey → componentName
function buildKeyToNameMap(): Map<string, string> {
  const map = new Map<string, string>();
  if (!registry) return map;
  for (const [name, entry] of Object.entries(registry.components)) {
    map.set(entry.key, name);
  }
  return map;
}

// Check if a color is hardcoded (not a variable/style binding)
function isHardcodedFill(node: SceneNode): { hardcoded: boolean; color?: string } {
  if (!('fills' in node)) return { hardcoded: false };
  const fills = (node as any).fills;
  if (!Array.isArray(fills) || fills.length === 0) return { hardcoded: false };
  const fill = fills[0];
  if (fill.type !== 'SOLID') return { hardcoded: false };

  // Check if bound to a variable
  const bindings = (node as any).boundVariables;
  if (bindings && bindings.fills) return { hardcoded: false };

  const r = Math.round(fill.color.r * 255);
  const g = Math.round(fill.color.g * 255);
  const b = Math.round(fill.color.b * 255);
  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

  // Skip white, black, and very light greys (common non-token colors)
  if (hex === '#ffffff' || hex === '#000000') return { hardcoded: false };

  return { hardcoded: true, color: hex };
}

export async function analyzeScope(scope: 'page' | 'file'): Promise<AnalysisResult> {
  abortAnalysis = false;
  const keyToName = buildKeyToNameMap();

  const instances: InstanceInfo[] = [];
  const issues: Issue[] = [];
  let totalNodes = 0;
  let hardcodedColors = 0;
  let missingAutoLayout = 0;

  const pages = scope === 'file' ? figma.root.children : [figma.currentPage];

  // Count total nodes for progress
  function countAll(node: BaseNode): number {
    let count = 1;
    if ('children' in node) {
      for (const child of (node as any).children) count += countAll(child);
    }
    return count;
  }

  let totalEstimate = 0;
  for (const page of pages) totalEstimate += countAll(page);
  sendLog(`Scanning ${totalEstimate} nodes across ${pages.length} page(s)...`);

  async function walkNode(node: SceneNode) {
    if (abortAnalysis) return;
    totalNodes++;

    if (totalNodes % 50 === 0) {
      sendAnalysisProgress(totalNodes, totalEstimate);
      await yieldToMain();
    }

    // Detect component instances
    if (node.type === 'INSTANCE') {
      const inst = node as InstanceNode;
      const mainComp = inst.mainComponent;
      const compKey = mainComp?.key || '';
      const compName = keyToName.get(compKey) || mainComp?.name || 'Unknown';

      // Get variant properties
      const variants: Record<string, string> = {};
      const textOverrides: Record<string, string> = {};
      try {
        const props = inst.componentProperties;
        for (const [key, val] of Object.entries(props)) {
          if (val.type === 'VARIANT') variants[key.split('#')[0]] = val.value as string;
          if (val.type === 'TEXT') textOverrides[key.split('#')[0]] = val.value as string;
        }
      } catch (_) {}

      // Determine library
      let library = 'unknown';
      if (registry) {
        const entry = Object.values(registry.components).find(e => e.key === compKey);
        if (entry) library = entry.library;
      }

      instances.push({
        nodeId: node.id,
        name: node.name,
        componentKey: compKey,
        componentName: compName,
        library,
        variants,
        textOverrides,
        x: Math.round(node.x),
        y: Math.round(node.y),
        width: Math.round(node.width),
        height: Math.round(node.height),
      });
    }

    // Detect hardcoded colors on non-instance nodes
    if (node.type !== 'INSTANCE' && node.type !== 'GROUP') {
      const { hardcoded, color } = isHardcodedFill(node);
      if (hardcoded) {
        hardcodedColors++;
        issues.push({
          nodeId: node.id,
          type: 'hardcoded-color',
          description: `"${node.name}" uses hardcoded fill ${color}`,
          severity: 'warning',
        });
      }
    }

    // Detect frames without auto-layout (that have 3+ children)
    if (node.type === 'FRAME' && !(node as FrameNode).layoutMode && 'children' in node) {
      const childCount = (node as FrameNode).children.length;
      if (childCount >= 3) {
        missingAutoLayout++;
        issues.push({
          nodeId: node.id,
          type: 'missing-auto-layout',
          description: `"${node.name}" has ${childCount} children but no auto-layout`,
          severity: 'info',
        });
      }
    }

    // Recurse into children (skip instance internals)
    if ('children' in node && node.type !== 'INSTANCE') {
      for (const child of (node as any).children) {
        await walkNode(child as SceneNode);
      }
    }
  }

  for (const page of pages) {
    if (scope === 'file') figma.currentPage = page;
    for (const child of page.children) {
      await walkNode(child);
    }
  }

  const uniqueComponents = new Set(instances.map(i => i.componentKey)).size;

  const stats: AnalysisStats = {
    totalNodes,
    instances: instances.length,
    uniqueComponents,
    hardcodedColors,
    missingAutoLayout,
  };

  sendLog(`Analysis complete: ${totalNodes} nodes, ${instances.length} instances, ${issues.length} issues`);

  return {
    file: { name: figma.root.name, key: '' },
    scope,
    page: { name: figma.currentPage.name, id: figma.currentPage.id },
    instances,
    issues,
    stats,
  };
}
```

- [ ] **Step 2: Build and verify**

```bash
cd plugin && npm run build
```

Expected: builds successfully.

- [ ] **Step 3: Commit**

```bash
git add plugin/src/analyzer.ts
git commit -m "feat: add analyzer — tree walker with instance and issue detection"
```

---

### Task 4: Updater — Apply update instructions

**Files:**
- Create: `plugin/src/updater.ts`

Parses update instructions from Claude and applies them to the Figma document.

- [ ] **Step 1: Write updater.ts**

```ts
import { Registry, UpdateInstruction, UpdatePlan, UpdateResult } from './types';

let registry: Registry | null = null;
let abortUpdate = false;

export function setUpdaterRegistry(reg: Registry) { registry = reg; }
export function cancelUpdate() { abortUpdate = true; }

function yieldToMain(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

function sendLog(text: string, level?: string) {
  figma.ui.postMessage({ type: 'log', text, level });
}

// Component import cache (shared with assembler via runtime)
const componentCache = new Map<string, ComponentNode>();
const componentSetCache = new Map<string, ComponentSetNode>();

async function importComponent(key: string, hasVariants: boolean) {
  if (hasVariants) {
    let cs = componentSetCache.get(key);
    if (!cs) { cs = await figma.importComponentSetByKeyAsync(key); componentSetCache.set(key, cs); }
    return cs;
  } else {
    let c = componentCache.get(key);
    if (!c) { c = await figma.importComponentByKeyAsync(key); componentCache.set(key, c); }
    return c;
  }
}

function lookupRegistryEntry(name: string) {
  if (!registry) return null;
  return registry.components[name] || null;
}

async function applyUpdate(instruction: UpdateInstruction): Promise<{ status: 'applied' | 'failed' | 'skipped'; message?: string }> {
  const node = await figma.getNodeByIdAsync(instruction.nodeId);
  if (!node) return { status: 'skipped', message: 'Node not found' };

  try {
    switch (instruction.action) {
      case 'set-variant': {
        if (node.type !== 'INSTANCE') return { status: 'skipped', message: 'Not an instance' };
        const inst = node as InstanceNode;
        if (instruction.props) {
          // Resolve short names to full property names
          const mainComp = inst.mainComponent;
          if (mainComp && mainComp.parent && mainComp.parent.type === 'COMPONENT_SET') {
            const propDefs = (mainComp.parent as ComponentSetNode).componentPropertyDefinitions;
            const resolved: Record<string, string> = {};
            for (const [shortName, value] of Object.entries(instruction.props)) {
              const fullKey = Object.keys(propDefs).find(k => k.split('#')[0] === shortName);
              if (fullKey) resolved[fullKey] = value;
            }
            inst.setProperties(resolved);
          }
        }
        sendLog(`Updated variant: ${node.name}`);
        return { status: 'applied' };
      }

      case 'set-text': {
        if (node.type !== 'INSTANCE') return { status: 'skipped', message: 'Not an instance' };
        const inst = node as InstanceNode;
        if (instruction.text) {
          const mainComp = inst.mainComponent;
          const propDefs = mainComp?.parent?.type === 'COMPONENT_SET'
            ? (mainComp.parent as ComponentSetNode).componentPropertyDefinitions
            : mainComp?.componentPropertyDefinitions || {};
          const resolved: Record<string, string> = {};
          for (const [shortName, value] of Object.entries(instruction.text)) {
            const fullKey = Object.keys(propDefs).find(k => k.split('#')[0] === shortName && propDefs[k].type === 'TEXT');
            if (fullKey) resolved[fullKey] = value;
          }
          if (Object.keys(resolved).length > 0) inst.setProperties(resolved);
        }
        sendLog(`Updated text: ${node.name}`);
        return { status: 'applied' };
      }

      case 'swap-component': {
        if (node.type !== 'INSTANCE' || !instruction.componentName) return { status: 'skipped', message: 'Not an instance or no target' };
        const entry = lookupRegistryEntry(instruction.componentName);
        if (!entry) return { status: 'failed', message: `Component "${instruction.componentName}" not in registry` };
        const hasVariants = Object.keys(entry.variants).length > 0;
        const imported = await importComponent(entry.key, hasVariants);
        const target = hasVariants ? (imported as ComponentSetNode).defaultVariant : imported as ComponentNode;
        (node as InstanceNode).swapComponent(target);
        sendLog(`Swapped: ${node.name} → ${instruction.componentName}`);
        return { status: 'applied' };
      }

      case 'replace-with-instance': {
        if (!instruction.componentName) return { status: 'failed', message: 'No component name' };
        const entry = lookupRegistryEntry(instruction.componentName);
        if (!entry) return { status: 'failed', message: `Component "${instruction.componentName}" not in registry` };
        const hasVariants = Object.keys(entry.variants).length > 0;
        const imported = await importComponent(entry.key, hasVariants);
        const comp = hasVariants ? (imported as ComponentSetNode).defaultVariant : imported as ComponentNode;
        const instance = comp.createInstance();
        instance.x = (node as SceneNode).x;
        instance.y = (node as SceneNode).y;
        if (node.parent) node.parent.insertChild(node.parent.children.indexOf(node as SceneNode), instance);
        (node as SceneNode).remove();
        sendLog(`Replaced: ${node.name} → ${instruction.componentName}`);
        return { status: 'applied' };
      }

      case 'delete': {
        const name = node.name;
        (node as SceneNode).remove();
        sendLog(`Deleted: ${name}`);
        return { status: 'applied' };
      }

      case 'set-fill': {
        if (!instruction.fill || !('fills' in node)) return { status: 'skipped', message: 'No fill or not fillable' };
        // Simple hex fill
        const hex = instruction.fill.replace('#', '');
        const color = {
          r: parseInt(hex.substring(0, 2), 16) / 255,
          g: parseInt(hex.substring(2, 4), 16) / 255,
          b: parseInt(hex.substring(4, 6), 16) / 255,
        };
        (node as any).fills = [{ type: 'SOLID', color }];
        sendLog(`Set fill: ${node.name} → ${instruction.fill}`);
        return { status: 'applied' };
      }

      case 'set-auto-layout': {
        if (node.type !== 'FRAME') return { status: 'skipped', message: 'Not a frame' };
        const frame = node as FrameNode;
        frame.layoutMode = instruction.layout === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL';
        if (instruction.spacing !== undefined) frame.itemSpacing = instruction.spacing;
        sendLog(`Set auto-layout: ${node.name} → ${instruction.layout}`);
        return { status: 'applied' };
      }

      default:
        return { status: 'skipped', message: `Unknown action: ${instruction.action}` };
    }
  } catch (err) {
    return { status: 'failed', message: (err as Error).message };
  }
}

export async function applyUpdates(plan: UpdatePlan): Promise<UpdateResult> {
  abortUpdate = false;
  const result: UpdateResult = { applied: 0, failed: 0, skipped: 0, details: [] };

  sendLog(`Applying ${plan.updates.length} updates...`);
  figma.ui.postMessage({ type: 'update-progress', current: 0, total: plan.updates.length });

  for (let i = 0; i < plan.updates.length; i++) {
    if (abortUpdate) {
      sendLog('Update cancelled.', 'error');
      break;
    }

    const instruction = plan.updates[i];
    const status = await applyUpdate(instruction);
    result[status.status === 'applied' ? 'applied' : status.status === 'failed' ? 'failed' : 'skipped']++;
    result.details.push({ nodeId: instruction.nodeId, action: instruction.action, ...status });

    figma.ui.postMessage({ type: 'update-progress', current: i + 1, total: plan.updates.length });
    if (i % 5 === 0) await yieldToMain();
  }

  sendLog(`Updates complete: ${result.applied} applied, ${result.failed} failed, ${result.skipped} skipped`);
  return result;
}
```

- [ ] **Step 2: Build and verify**

```bash
cd plugin && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add plugin/src/updater.ts
git commit -m "feat: add updater — apply update instructions from Claude"
```

---

### Task 5: Plugin code.ts — Add analyze + update message handlers

**Files:**
- Modify: `plugin/src/code.ts`

Wire the analyzer and updater into the plugin's message handler.

- [ ] **Step 1: Add imports and message handlers**

At the top of code.ts, add:
```ts
import { analyzeScope, setAnalyzerRegistry, cancelAnalysis } from './analyzer';
import { applyUpdates, setUpdaterRegistry, cancelUpdate } from './updater';
```

In the existing `figma.ui.onmessage` handler, update the `load-registry` handler to also set registry on analyzer/updater:
```ts
if (msg.type === 'load-registry') {
  registry = msg.registry as Registry;
  tokenMap = msg.tokenMap || {};
  setAnalyzerRegistry(registry);
  setUpdaterRegistry(registry);
  // ... rest unchanged
}
```

Add new message handlers:
```ts
if (msg.type === 'analyze') {
  const scope = msg.scope as 'page' | 'file';
  try {
    const result = await analyzeScope(scope);
    figma.ui.postMessage({ type: 'analysis-done', result });
  } catch (err) {
    figma.ui.postMessage({ type: 'error', text: `Analysis failed: ${(err as Error).message}` });
  }
  return;
}

if (msg.type === 'apply-updates') {
  const plan = msg.plan;
  try {
    const result = await applyUpdates(plan);
    figma.ui.postMessage({ type: 'update-done', result });
  } catch (err) {
    figma.ui.postMessage({ type: 'error', text: `Update failed: ${(err as Error).message}` });
  }
  return;
}

if (msg.type === 'cancel') {
  abortRequested = true;
  cancelAnalysis();
  cancelUpdate();
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
git commit -m "feat: wire analyzer and updater into plugin message handler"
```

---

### Task 6: Plugin UI — Add tab selector, analyze panel, update panel

**Files:**
- Modify: `plugin/src/ui.html`

Add a 3-tab interface (Assemble | Analyze | Update) with the analyze and update panels.

- [ ] **Step 1: Add tab navigation and panels to ui.html**

Add a tab bar after the title:
```html
<div class="tabs">
  <button class="tab tab--active" onclick="switchTab('assemble')">Assemble</button>
  <button class="tab" onclick="switchTab('analyze')">Analyze</button>
  <button class="tab" onclick="switchTab('update')">Update</button>
</div>
```

Add CSS for tabs:
```css
.tabs { display: flex; gap: 0; margin-bottom: 16px; border-bottom: 2px solid #eee; }
.tab { padding: 8px 16px; font-size: 12px; font-weight: 500; color: #888; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; }
.tab--active { color: #0550dc; border-bottom-color: #0550dc; }
.panel { display: none; }
.panel--active { display: block; }
```

**Analyze panel:**
```html
<div id="analyzePanel" class="panel">
  <label>Scope</label>
  <div style="display:flex;gap:8px;margin-bottom:12px">
    <label style="display:flex;align-items:center;gap:4px;font-weight:400">
      <input type="radio" name="scope" value="page" checked> Current page
    </label>
    <label style="display:flex;align-items:center;gap:4px;font-weight:400">
      <input type="radio" name="scope" value="file"> Entire file
    </label>
  </div>
  <button class="btn btn-primary" id="analyzeBtn" onclick="handleAnalyze()">Analyze</button>
  <div id="analyzeProgress" class="progress-container hidden">
    <div class="progress-bar"><div class="progress-fill" id="analyzeFill"></div></div>
    <div class="progress-text" id="analyzeText"></div>
  </div>
  <div id="analyzeSummary" class="status-bar hidden"></div>
</div>
```

**Update panel:**
```html
<div id="updatePanel" class="panel">
  <button class="btn btn-primary" id="loadUpdatesBtn" onclick="handleLoadUpdates()">Load Updates</button>
  <div id="updatePreview" class="status-bar hidden"></div>
  <button class="btn btn-primary hidden" id="applyBtn" onclick="handleApplyUpdates()" style="margin-top:8px">Apply Updates</button>
  <div id="updateProgress" class="progress-container hidden">
    <div class="progress-bar"><div class="progress-fill" id="updateFill"></div></div>
    <div class="progress-text" id="updateText"></div>
  </div>
</div>
```

**JavaScript additions:**
```js
let currentTab = 'assemble';
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab--active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('panel--active'));
  document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('tab--active');
  document.getElementById(tab + 'Panel').classList.add('panel--active');
}

async function handleAnalyze() {
  const scope = document.querySelector('input[name="scope"]:checked').value;
  document.getElementById('analyzeBtn').disabled = true;
  document.getElementById('analyzeBtn').textContent = 'Analyzing...';
  document.getElementById('analyzeProgress').classList.remove('hidden');
  document.getElementById('analyzeFill').style.width = '0%';
  logEl.innerHTML = '';
  parent.postMessage({ pluginMessage: { type: 'analyze', scope } }, '*');
}

async function handleLoadUpdates() {
  const baseUrl = document.getElementById('baseUrl').value.trim().replace(/\/$/, '');
  try {
    const res = await fetch(baseUrl + '/updates.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const plan = await res.json();
    window._updatePlan = plan;
    const count = plan.updates ? plan.updates.length : 0;
    const preview = document.getElementById('updatePreview');
    preview.textContent = count + ' updates loaded. Review in log before applying.';
    preview.className = 'status-bar loaded';
    preview.classList.remove('hidden');
    document.getElementById('applyBtn').classList.remove('hidden');
    // Show update list in log
    plan.updates.forEach(u => log(u.action + ': ' + u.nodeId + (u.componentName ? ' → ' + u.componentName : '')));
  } catch (err) {
    log('Failed to load updates: ' + err.message, 'error');
  }
}

function handleApplyUpdates() {
  if (!window._updatePlan) return;
  document.getElementById('applyBtn').disabled = true;
  document.getElementById('updateProgress').classList.remove('hidden');
  parent.postMessage({ pluginMessage: { type: 'apply-updates', plan: window._updatePlan } }, '*');
}
```

**Message handler additions:**
```js
if (msg.type === 'analysis-progress') {
  const pct = Math.round((msg.current / msg.total) * 100);
  document.getElementById('analyzeFill').style.width = pct + '%';
  document.getElementById('analyzeText').textContent = msg.current + '/' + msg.total + ' nodes';
}

if (msg.type === 'analysis-done') {
  document.getElementById('analyzeFill').style.width = '100%';
  document.getElementById('analyzeBtn').disabled = false;
  document.getElementById('analyzeBtn').textContent = 'Analyze';
  const r = msg.result;
  const summary = document.getElementById('analyzeSummary');
  summary.textContent = `${r.stats.totalNodes} nodes, ${r.stats.instances} instances, ${r.stats.uniqueComponents} unique, ${r.issues.length} issues`;
  summary.className = 'status-bar ' + (r.issues.length > 0 ? '' : 'loaded');
  summary.classList.remove('hidden');
  // POST to server
  const baseUrl = document.getElementById('baseUrl').value.trim().replace(/\/$/, '');
  fetch(baseUrl + '/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(r)
  }).then(() => log('Analysis saved to server', 'success'))
    .catch(err => log('Failed to save analysis: ' + err.message, 'error'));
}

if (msg.type === 'update-progress') {
  const pct = Math.round((msg.current / msg.total) * 100);
  document.getElementById('updateFill').style.width = pct + '%';
  document.getElementById('updateText').textContent = msg.current + '/' + msg.total + ' updates';
}

if (msg.type === 'update-done') {
  document.getElementById('updateFill').style.width = '100%';
  document.getElementById('applyBtn').disabled = false;
  document.getElementById('applyBtn').textContent = 'Apply Updates';
  const r = msg.result;
  log(`Done: ${r.applied} applied, ${r.failed} failed, ${r.skipped} skipped`, 'success');
  // POST result to server
  const baseUrl = document.getElementById('baseUrl').value.trim().replace(/\/$/, '');
  fetch(baseUrl + '/update-result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(r)
  }).catch(() => {});
}
```

- [ ] **Step 2: Build and verify**

```bash
cd plugin && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add plugin/src/ui.html
git commit -m "feat: add Analyze and Update tabs to plugin UI"
```

---

### Task 7: End-to-end test — Analyze mode

**Files:** None — manual testing.

- [ ] **Step 1: Start the server**

```bash
cd /Users/volivari/Developer/Actian/Actian-DS-Assembler && python3 serve.py 8765
```

- [ ] **Step 2: Load the plugin in Figma**

Close and reopen the DS Assembler plugin. Click "Load Registry".

- [ ] **Step 3: Switch to Analyze tab**

Select "Current page" scope. Click "Analyze".

- [ ] **Step 4: Verify analysis results**

Check that:
- Progress bar shows during scanning
- Log shows node/instance counts
- Summary shows stats
- `analysis.json` is created on the server

- [ ] **Step 5: Read analysis.json from Claude**

```bash
cat analysis.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'Instances: {d[\"stats\"][\"instances\"]}'); print(f'Issues: {len(d[\"issues\"])}')"
```

- [ ] **Step 6: Commit fixes if any**

```bash
git add -A && git commit -m "fix: address issues found during analyze E2E testing"
```

---

### Task 8: End-to-end test — Update mode

**Files:** None — manual testing.

- [ ] **Step 1: Create a test updates.json**

Based on the analysis output, create a simple updates.json:

```json
{
  "updates": [
    {
      "nodeId": "<pick a real instance nodeId from analysis.json>",
      "action": "set-variant",
      "props": { "Type": "Secondary" }
    }
  ]
}
```

Save to `/Users/volivari/Developer/Actian/Actian-DS-Assembler/updates.json`.

- [ ] **Step 2: Run the update**

In the plugin: switch to Update tab → "Load Updates" → review in log → "Apply Updates".

- [ ] **Step 3: Verify**

Check that the component variant changed in Figma. Cmd+Z should undo all updates at once.

- [ ] **Step 4: Commit fixes if any**

```bash
git add -A && git commit -m "fix: address issues found during update E2E testing"
```

---

### Task 9: Update /design-audit skill

**Files:**
- Modify: `skills/design-audit/SKILL.md` (in Claude plugin repo)

**Working directory:** `/Users/volivari/Developer/Actian/actian-design-system-plugin`

- [ ] **Step 1: Add analyzer integration to design-audit skill**

Add a new section after the existing "Output format" section:

```markdown
## Auto-fix with DS Assembler (optional)

If the user has the [DS Assembler](https://github.com/volivarii/Actian-DS-Assembler) plugin running:

### Analyze via plugin (more accurate than MCP)

1. Tell the user: "Open DS Assembler → Analyze tab → click Analyze"
2. Wait for user to confirm analysis is complete
3. Read the analysis results: `cat /Users/volivari/Developer/Actian/Actian-DS-Assembler/analysis.json`
4. Use the analysis data to enrich the audit report with exact node IDs, instance counts, and issue details

### Auto-fix issues

If the user says "fix it" or "apply fixes":

1. Generate an `updates.json` file with fix instructions based on the audit findings
2. Save to `/Users/volivari/Developer/Actian/Actian-DS-Assembler/updates.json`
3. Tell the user: "Open DS Assembler → Update tab → Load Updates → Apply"
4. After user confirms, read `update-result.json` to verify fixes were applied
```

- [ ] **Step 2: Commit and push**

```bash
git add skills/design-audit/SKILL.md
git commit -m "feat: add DS Assembler analyzer integration to design-audit skill"
git push
```

---

### Task 10: Documentation and final push

**Files:**
- Modify: `README.md` (Assembler repo)

**Working directory:** `/Users/volivari/Developer/Actian/Actian-DS-Assembler`

- [ ] **Step 1: Update README with Analyze and Update sections**

Add after the Usage section:

```markdown
## Analyze

Scan a Figma page or file for component usage, hardcoded colors, and structural issues.

1. Open DS Assembler → **Analyze** tab
2. Select scope: "Current page" or "Entire file"
3. Click **Analyze**
4. Results are POSTed to `localhost:8765/analysis` and saved as `analysis.json`

Claude can read `analysis.json` to generate audit reports and fix instructions.

## Update

Apply targeted fixes to a Figma file based on instructions from Claude.

1. Claude generates `updates.json` with fix instructions
2. Open DS Assembler → **Update** tab
3. Click **Load Updates** → review the list
4. Click **Apply Updates**
5. Cmd+Z undoes all changes at once

### Supported update actions

| Action | Description |
|--------|-------------|
| `set-variant` | Change variant properties on an instance |
| `set-text` | Change text overrides on an instance |
| `swap-component` | Swap an instance to a different component |
| `replace-with-instance` | Replace a non-instance node with a library instance |
| `delete` | Remove a node |
| `set-fill` | Change fill color |
| `set-auto-layout` | Convert a frame to auto-layout |
```

- [ ] **Step 2: Commit and push**

```bash
git add README.md
git commit -m "docs: add Analyze and Update documentation to README"
git push
```
