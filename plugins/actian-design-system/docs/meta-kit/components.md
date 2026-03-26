# Meta Kit — Component Catalog

Library components used by skills to build spec briefs, flow screens, and presentations.
These live in the Meta Kit Figma library and are imported at runtime via the Plugin API.

---

## How to use

### Importing a single component

```js
const comp = await figma.importComponentByKeyAsync("KEY");
const instance = comp.createInstance();
```

### Importing a component set (variants)

```js
const set = await figma.importComponentSetByKeyAsync("KEY");
const variant = set.children.find(c => c.name === "Mode=DS, Type=Standard");
const instance = variant.createInstance();
```

### Detaching for content insertion (Brief Card, Code Block)

Figma instances do NOT allow `appendChild` into their internal frames. For components that have a content slot (Brief Card, Code Block), use this pattern:

1. **Set text properties BEFORE detaching** (properties only work on instances)
2. **Detach** with `instance.detachInstance()` — converts to a regular frame
3. **Find the content frame** and append children freely

```js
const instance = variant.createInstance();
setProp(instance, "Title", "Design tokens");        // Set props first!
setProp(instance, "Subtitle", "Token documentation");
const frame = instance.detachInstance();              // Now it's a regular frame
const content = frame.findOne(n => n.name === "Content");
content.appendChild(myTable);                         // Works!
```

The Generation Log, Card Divider, and Flow Screen do NOT need detaching — they don't have content slots that need dynamic children.

### Setting text and boolean properties

Component properties in Figma have auto-generated suffixes (e.g., `Title#1234:56`).
Use this helper to match by prefix:

```js
function setProp(instance, prefix, value) {
  const key = Object.keys(instance.componentProperties).find(k => k.startsWith(prefix));
  if (key) instance.setProperties({ [key]: value });
}

// Examples
setProp(instance, "Title", "Buttons");
setProp(instance, "Show Header", true);
```

---

## Core

### Meta / Chrome / Generation Log

First element in every output. Import once per generation.

| Field | Value |
|-------|-------|
| Key | `a9653f30925367e96dea90093d750bfe70849571` |
| Import | `figma.importComponentByKeyAsync(key)` |
| Variants | None (single component) |
| Text properties | Skill, Prompt, Date, Duration, Model, Plugin Version |

```js
const genLog = await figma.importComponentByKeyAsync("a9653f30925367e96dea90093d750bfe70849571");
const logInstance = genLog.createInstance();
setProp(logInstance, "Skill", "generate-spec");
setProp(logInstance, "Prompt", userPrompt.slice(0, 200));
setProp(logInstance, "Date", new Date().toISOString());
setProp(logInstance, "Duration", "12s");
setProp(logInstance, "Model", "claude-opus-4-6");
setProp(logInstance, "Plugin Version", "v1.10.0");
```

---

### Meta / Utility / Card Divider

Horizontal rule between sections inside Brief Cards.

| Field | Value |
|-------|-------|
| Key | `f4d778e1cf9bb61a33712c791486f54bb1c095b7` |
| Import | `figma.importComponentByKeyAsync(key)` |
| Variants | None (single component) |
| Properties | None |

After appending to a parent auto-layout frame, stretch to fill width:

```js
const divComp = await figma.importComponentByKeyAsync("f4d778e1cf9bb61a33712c791486f54bb1c095b7");
const divider = divComp.createInstance();
parentFrame.appendChild(divider);
divider.layoutSizingHorizontal = "FILL";
```

---

### Meta / Content / Code Block

Dark code block for token tables, usage examples, and presentation code slides.

| Field | Value |
|-------|-------|
| Key | `1bf10eee1751a46da5f90a9671be6c9abf0073b7` |
| Import | `figma.importComponentByKeyAsync(key)` |
| Variants | None (single component) |
| Boolean properties | Show Header |
| Text properties | Header Text, Code |

```js
const codeComp = await figma.importComponentByKeyAsync("1bf10eee1751a46da5f90a9671be6c9abf0073b7");
const codeBlock = codeComp.createInstance();
setProp(codeBlock, "Show Header", true);
setProp(codeBlock, "Header Text", "CSS Custom Properties");
setProp(codeBlock, "Code", "--zen-color-theme-primary: #0066CC;");
```

---

## Brief Components

### Meta / Chrome / Brief Card

Card shell for all spec cards. Import 8-9 times per brief.

| Field | Value |
|-------|-------|
| Key | `3dbb732730af0754210cde7af35e5236a2502843` |
| Import | `figma.importComponentSetByKeyAsync(key)` |
| Variant axes | **Mode:** `DS` · `FM`  **Type:** `Standard` · `Page Header` |

**Text properties by variant:**

| Variant | Text properties |
|---------|-----------------|
| Mode=DS, Type=Standard | Title, Subtitle |
| Mode=FM, Type=Standard | Title, Subtitle |
| Mode=DS, Type=Page Header | Component Name, Description |
| Mode=FM, Type=Page Header | Source, Component Name, Description |

```js
const briefSet = await figma.importComponentSetByKeyAsync("3dbb732730af0754210cde7af35e5236a2502843");

// DS standard card
const dsStandard = briefSet.children.find(c => c.name === "Mode=DS, Type=Standard");
const card = dsStandard.createInstance();
setProp(card, "Title", "Anatomy & Variants");
setProp(card, "Subtitle", "Visual breakdown of component structure");

// FM page header card
const fmHeader = briefSet.children.find(c => c.name === "Mode=FM, Type=Page Header");
const headerCard = fmHeader.createInstance();
setProp(headerCard, "Source", "Fat Marker Kit");
setProp(headerCard, "Component Name", "FM Button");
setProp(headerCard, "Description", "Action trigger with Primary, Secondary, and Outline types.");
```

---

### Meta / Content / Do-Don't Pair

Best-practice comparison for Cards 6-7 and presentation slides.

| Field | Value |
|-------|-------|
| Key | `28edfacf13e50706586172bd48f8a3ad84d7c263` |
| Import | `figma.importComponentSetByKeyAsync(key)` |
| Variant axes | **Mode:** `DS` · `FM` |
| Text properties | Do Label, Don't Label, Do Example, Don't Example |

```js
const doDontSet = await figma.importComponentSetByKeyAsync("28edfacf13e50706586172bd48f8a3ad84d7c263");
const dsDoDont = doDontSet.children.find(c => c.name === "Mode=DS");
const pair = dsDoDont.createInstance();
setProp(pair, "Do Label", "Use Primary for the main action");
setProp(pair, "Don't Label", "Don't use two Primary buttons side by side");
setProp(pair, "Do Example", "Save  [Primary]  Cancel  [Secondary]");
setProp(pair, "Don't Example", "Save  [Primary]  Cancel  [Primary]");
```

---

## Flow Components

### Meta / Chrome / Flow Screen

Wrapper for every flow screen. Contains an app header, side nav, and a content area.

| Field | Value |
|-------|-------|
| Key | `2ca7c756ad54e81219104d3a270ba8eb9eeffcf6` |
| Import | `figma.importComponentSetByKeyAsync(key)` |
| Variant axes | **Size:** `Standard` (1440x960) · `Compact` (1440x700) |
| Internal structure | FM App_header (top) + FM Side nav (left) + Content Area (fill) |

Find the "Content Area" child by name and append your content to it:

```js
const flowSet = await figma.importComponentSetByKeyAsync("2ca7c756ad54e81219104d3a270ba8eb9eeffcf6");
const standard = flowSet.children.find(c => c.name === "Size=Standard");
const screen = standard.createInstance();

// Find the content area and add your content
const contentArea = screen.findOne(n => n.name === "Content Area");
contentArea.appendChild(yourContentFrame);
```

---

## Quick Reference

| Component | Key | Import method |
|-----------|-----|---------------|
| Generation Log | `a9653f3092...` | `importComponentByKeyAsync` |
| Card Divider | `f4d778e1cf...` | `importComponentByKeyAsync` |
| Code Block | `1bf10eee17...` | `importComponentByKeyAsync` |
| Brief Card | `3dbb732730...` | `importComponentSetByKeyAsync` |
| Do-Don't Pair | `28edfacf13...` | `importComponentSetByKeyAsync` |
| Flow Screen | `2ca7c756ad...` | `importComponentSetByKeyAsync` |
