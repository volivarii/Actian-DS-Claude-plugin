# Create Component — Direct Push Patterns

Direct Figma Plugin API patterns for creating components. The agent writes these calls directly instead of using `assembleCall()` + interpreter.

> **Always pass `skillNames: "figma-use"` on every `mcp__claude_ai_Figma__use_figma` invocation.** This is mandatory per Figma's official contract — the `figma-use` skill carries the load-bearing Plugin API rules (atomic-on-error, color 0–1 range, HUG-after-append, font preload, await-all-promises, page-context-reset, return-all-IDs, explicit `variable.scopes`). Skipping it produces hard-to-debug failures. Every code block in this document assumes `skillNames: "figma-use"` is set on the call wrapping it.
> (Source: https://help.figma.com/hc/en-us/articles/39287396773399)

---

## 1. Create a Single Component

```js
const comp = figma.createComponent();
comp.name = "Size=Small, State=Default";

// Layout
comp.layoutMode = "HORIZONTAL";
comp.itemSpacing = 8;
comp.paddingTop = 8;
comp.paddingBottom = 8;
comp.paddingLeft = 16;
comp.paddingRight = 16;
comp.primaryAxisSizingMode = "AUTO";
comp.counterAxisSizingMode = "AUTO";

// Visual
comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
comp.cornerRadius = 4;

// Add children (text, frames, etc.) before adding properties
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
const label = figma.createText();
label.name = "Label";
label.characters = "Button";
label.fontSize = 14;
comp.appendChild(label);

return { compId: comp.id };
```

---

## 2. Add Component Properties

After creating the component and its children:

```js
const comp = await figma.getNodeByIdAsync("<compId>");

// Text property
comp.addComponentProperty("Label", "TEXT", "Button");

// Boolean property
comp.addComponentProperty("Show Icon", "BOOLEAN", true);

// Get the hash-suffixed key for property linking
const keys = Object.keys(comp.componentPropertyDefinitions);
const labelKey = keys.find(k => k.split("#")[0] === "Label");

return { labelKey };
```

---

## 3. Link Properties to Text Layers

```js
const comp = await figma.getNodeByIdAsync("<compId>");
const labelKey = "<labelKey>"; // from previous call

const textNode = comp.query('TEXT[name="Label"]').first();
if (textNode) {
  textNode.componentPropertyReferences = { characters: labelKey };
}

return "linked";
```

---

## 4. Combine as Variant Set

After creating all variant components on the page:

```js
const compIds = ["<comp1Id>", "<comp2Id>", "<comp3Id>"];
const components = [];
for (const id of compIds) {
  components.push(await figma.getNodeByIdAsync(id));
}

const set = figma.combineAsVariants(components, figma.currentPage);
set.name = "My Component";
set.description = "Component description for the library.";

return { setId: set.id };
```

---

## 5. Variable Scoping (optional)

```js
const set = await figma.getNodeByIdAsync("<setId>");
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const colorCol = collections.find(c => c.name === "Color");
if (colorCol) {
  set.setExplicitVariableModeForCollection(colorCol, colorCol.modes[0].modeId);
}
return "scoped";
```

---

## Push Sequence

1. Create each variant component (1 call each)
2. Add properties to each component (1 call each)
3. Link properties to text layers (1 call each, can batch)
4. Combine as variant set (1 call)
5. Set description and variable scoping (1 call)
6. Add GenLog instance as sibling (1 call)
