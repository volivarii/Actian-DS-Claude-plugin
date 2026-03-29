# Extraction Scripts (Tier 1)

Deterministic Plugin API scripts that extract structural data from Figma nodes. Returns raw JSON for Tier 2 (AI interpretation) to process.

These scripts are "Tier 1" in the two-tier extraction pattern. They contain zero AI logic — just structured data extraction via the Plugin API. Skills copy them into `use_figma` calls.

## Usage

1. Call `use_figma` with the extraction script (pass `skillNames: "figma-use"`)
2. Parse the returned JSON string
3. Use the parsed data to build a rendering plan (Tier 2 — AI interprets and decides what to render)

## `extractComponentStructure(nodeId)`

Extracts complete structural data for a component or component set.

### Code

```js
const node = await figma.getNodeByIdAsync(NODE_ID);
if (!node) return JSON.stringify({ error: 'Node not found' });

const result = {
  name: node.name,
  type: node.type,
  nodeId: node.id,
  key: node.key || null,
  description: node.description || '',
};

if (node.type === 'COMPONENT_SET') {
  result.variantAxes = Object.entries(node.variantGroupProperties || {}).map(([axis, prop]) => ({
    axis,
    values: prop.values,
  }));
  result.variants = node.children.map(v => ({
    name: v.name,
    key: v.key,
    width: Math.round(v.width),
    height: Math.round(v.height),
  }));
  result.properties = Object.entries(node.componentPropertyDefinitions || {}).map(([name, def]) => ({
    name,
    type: def.type,
    defaultValue: def.defaultValue,
    variantOptions: def.variantOptions || null,
  }));
} else if (node.type === 'COMPONENT') {
  result.properties = Object.entries(node.componentPropertyDefinitions || {}).map(([name, def]) => ({
    name,
    type: def.type,
    defaultValue: def.defaultValue,
  }));
}

// Extract bound variables
const boundVars = [];
function walkForVars(n) {
  if (n.boundVariables) {
    for (const [prop, binding] of Object.entries(n.boundVariables)) {
      if (binding && binding.id) {
        boundVars.push({ node: n.name, property: prop, variableId: binding.id });
      }
    }
  }
  if ('children' in n) n.children.forEach(walkForVars);
}
walkForVars(node);
result.boundVariables = boundVars;

// Extract child structure (first variant for sets, direct children for components)
function describeChild(n) {
  return {
    name: n.name,
    type: n.type,
    visible: n.visible,
    width: Math.round(n.width),
    height: Math.round(n.height),
    childCount: ('children' in n) ? n.children.length : 0,
  };
}

if ('children' in node) {
  if (node.type === 'COMPONENT_SET') {
    const firstVariant = node.children[0];
    result.anatomy = firstVariant ? firstVariant.children.map(describeChild) : [];
  } else {
    result.anatomy = node.children.map(describeChild);
  }
}

return JSON.stringify(result, null, 2);
```

### Return schema

```json
{
  "name": "Button",
  "type": "COMPONENT_SET",
  "nodeId": "7206:2643",
  "key": "abc123...",
  "description": "Primary action button",
  "variantAxes": [
    { "axis": "Hierarchy", "values": ["Primary", "Secondary"] },
    { "axis": "State", "values": ["Enabled", "Disabled"] }
  ],
  "variants": [
    { "name": "Hierarchy=Primary, State=Enabled", "key": "...", "width": 120, "height": 40 }
  ],
  "properties": [
    { "name": "Label", "type": "TEXT", "defaultValue": "Button" },
    { "name": "Show icon", "type": "BOOLEAN", "defaultValue": true }
  ],
  "boundVariables": [
    { "node": "Fill", "property": "fills", "variableId": "VariableID:..." }
  ],
  "anatomy": [
    { "name": "Leading icon", "type": "INSTANCE", "visible": true, "width": 16, "height": 16, "childCount": 1 },
    { "name": "Label", "type": "TEXT", "visible": true, "width": 60, "height": 20, "childCount": 0 }
  ]
}
```

## How skills use two-tier extraction

**Before (mixed):** Skills wrote a single `use_figma` call that both extracted Figma structure AND built output frames in one script. If something broke, you couldn't tell whether extraction or rendering was the problem.

**After (two-tier):**
1. **Tier 1 call:** `use_figma` runs `extractComponentStructure(nodeId)` → returns JSON string
2. **AI reads JSON:** Claude interprets the structure, decides which templates to clone, what text to fill
3. **Tier 2 call:** `use_figma` runs the rendering plan (clone-and-fill from templates)

**Benefits:**
- Tier 1 scripts are reusable across skills (same extraction, different rendering)
- Debugging is clear: extraction failure (bad API call) vs rendering failure (bad plan)
- Extraction output can be cached within a session to avoid redundant Figma calls

## When to use two-tier

| Scenario | Approach |
|----------|----------|
| Building from a text description (no Figma source) | Single-tier (Tier 2 only) |
| Building from an existing Figma component | Two-tier (extract first, then render) |
| Auditing or documenting existing components | Two-tier (extract first, then analyze) |
| Syncing data from Figma | Tier 1 only (no rendering needed) |
