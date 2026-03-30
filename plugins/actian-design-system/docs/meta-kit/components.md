# Meta Kit — Component Catalog

Auto-generated from Figma MCP on 2026-03-26. 21 components (10 component sets + 5 standalone + 1 feedback + 5 hidden templates).

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

### Detaching for content insertion (Brief Card, Code Block, Accessibility Card, Theme Card)

Figma instances do NOT allow `appendChild` into their internal frames. For components that have a content slot (Brief Card, Code Block, Accessibility Card, Theme Card), use this pattern:

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

The Generation Log, Card Divider, Flow Screen, and Flow Cover Card do NOT need detaching — they don't have content slots that need dynamic children.

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

## Component Sets

### Meta / Chrome / Brief Card

Card shell for component spec pages. 4 variants: DS Standard, DS Page Header, FM Standard, FM Page Header.

| Field | Value |
|-------|-------|
| Key | `3dbb732730af0754210cde7af35e5236a2502843` |
| Node | `7:2` |
| Import | `figma.importComponentSetByKeyAsync(key)` |
| Variant axes | **Mode:** `DS` · `FM` | **Type:** `Standard` · `Page Header` |
| Text overrides | `Title`, `Subtitle`, `Component Name`, `Description`, `Source` |

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

Side-by-side Do and Don't examples with green/red color bars.

| Field | Value |
|-------|-------|
| Key | `28edfacf13e50706586172bd48f8a3ad84d7c263` |
| Node | `9:24` |
| Import | `figma.importComponentSetByKeyAsync(key)` |
| Variant axes | **Mode:** `DS` · `FM` |
| Text overrides | `Do Label`, `Don't Label`, `Do Example`, `Don't Example` |

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

### Meta / Chrome / Flow Screen

Screen frame for wireframe flows. Standard (1440x960) and Compact (1440x700).

| Field | Value |
|-------|-------|
| Key | `2ca7c756ad54e81219104d3a270ba8eb9eeffcf6` |
| Node | `21:1198` |
| Import | `figma.importComponentSetByKeyAsync(key)` |
| Variant axes | **Size:** `Standard` · `Compact` |
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

### Meta / Content / Color Swatch

Circular color indicator. Used in component-brief Card 4 (token tables) and Card 8 (contrast tables). Bind fill to a DS Kit variable at runtime.

| Field | Value |
|-------|-------|
| Key | `da3369932f710386b76ca91a40ebd48d94e3f2e0` |
| Node | `42:17` |
| Import | `figma.importComponentSetByKeyAsync(key)` |
| Variant axes | **Size:** `Small` · `Medium` · `Large` |

```js
const swatchSet = await figma.importComponentSetByKeyAsync("da3369932f710386b76ca91a40ebd48d94e3f2e0");
const medium = swatchSet.children.find(c => c.name === "Size=Medium");
const swatch = medium.createInstance();
// Bind fill to a DS Kit variable at runtime
```

---

### Meta / Content / Contrast Badge

WCAG contrast result badge (Pass/Exempt/Fail). Used in component-brief Card 8 accessibility contrast table.

| Field | Value |
|-------|-------|
| Key | `941756541adc6ce21e32e848c2039c64fece0fcf` |
| Node | `44:20` |
| Import | `figma.importComponentSetByKeyAsync(key)` |
| Variant axes | **Status:** `Pass` · `Exempt` · `Fail` |
| Text overrides | `Label` |

```js
const badgeSet = await figma.importComponentSetByKeyAsync("941756541adc6ce21e32e848c2039c64fece0fcf");
const pass = badgeSet.children.find(c => c.name === "Status=Pass");
const badge = pass.createInstance();
setProp(badge, "Label", "4.5:1");
```

---

### Meta / Content / Pointer Badge

Dimension callout label with directional line. Used in component-brief Card 3 (Anatomy) for pink dimension annotations.

| Field | Value |
|-------|-------|
| Key | `7e066fc21d9a2bbbcd1149113787cf59140162d4` |
| Node | `45:26` |
| Import | `figma.importComponentSetByKeyAsync(key)` |
| Variant axes | **Direction:** `Left` · `Right` · `Up` · `Down` |
| Text overrides | `Label` |

```js
const pointerSet = await figma.importComponentSetByKeyAsync("7e066fc21d9a2bbbcd1149113787cf59140162d4");
const left = pointerSet.children.find(c => c.name === "Direction=Left");
const pointer = left.createInstance();
setProp(pointer, "Label", "padding-sm");
```

---

### Meta / Content / Dimension Annotation

Measurement annotation with endcaps and value label. Used in component-brief Card 3 (Anatomy - Specs) for dimension callouts between elements.

| Field | Value |
|-------|-------|
| Key | `49bf6a1b210a403ba145a3fdee9b1994eb54069a` |
| Node | `45:37` |
| Import | `figma.importComponentSetByKeyAsync(key)` |
| Variant axes | **Orientation:** `Horizontal` · `Vertical` |
| Text overrides | `Value` |

```js
const dimSet = await figma.importComponentSetByKeyAsync("49bf6a1b210a403ba145a3fdee9b1994eb54069a");
const horizontal = dimSet.children.find(c => c.name === "Orientation=Horizontal");
const dim = horizontal.createInstance();
setProp(dim, "Value", "16px");
```

---

### Meta / Content / Stat Card

Data callout card with value, trend indicator, and label. Used in presentations for KPI highlights.

| Field | Value |
|-------|-------|
| Key | `8662c721d74d6f0079f273f76eec374b12ec2fae` |
| Node | `46:29` |
| Import | `figma.importComponentSetByKeyAsync(key)` |
| Variant axes | **Trend:** `Up` · `Down` · `Neutral` |
| Text overrides | `Value`, `Label` |

```js
const statSet = await figma.importComponentSetByKeyAsync("8662c721d74d6f0079f273f76eec374b12ec2fae");
const up = statSet.children.find(c => c.name === "Trend=Up");
const stat = up.createInstance();
setProp(stat, "Value", "94%");
setProp(stat, "Label", "WCAG Compliance");
```

---

### Meta / Chrome / Accessibility Card

Container for WCAG requirements with severity badges. Used in component-brief Cards 7-8. Detach instance before appending content to the Content slot.

| Field | Value |
|-------|-------|
| Key | `b4779a13f4097d682413a669eaaf9ead1b49f115` |
| Node | `47:24` |
| Import | `figma.importComponentSetByKeyAsync(key)` |
| Variant axes | **Mode:** `DS` · `FM` |
| Text overrides | `Title` |

```js
const a11ySet = await figma.importComponentSetByKeyAsync("b4779a13f4097d682413a669eaaf9ead1b49f115");
const ds = a11ySet.children.find(c => c.name === "Mode=DS");
const card = ds.createInstance();
setProp(card, "Title", "Keyboard Navigation");
const frame = card.detachInstance();              // Detach to append content
const content = frame.findOne(n => n.name === "Content");
content.appendChild(myRequirementsList);
```

---

### Meta / Chrome / Theme Card

Theme-branded card with colored accent bar. Used in component-brief for theme comparison views (Actian/Studio/Explorer). Detach to append content.

| Field | Value |
|-------|-------|
| Key | `9081a7761dfbe11d576182f3cb1711b9e76c2d36` |
| Node | `47:43` |
| Import | `figma.importComponentSetByKeyAsync(key)` |
| Variant axes | **Theme:** `Actian` · `Studio` · `Explorer` |

```js
const themeSet = await figma.importComponentSetByKeyAsync("9081a7761dfbe11d576182f3cb1711b9e76c2d36");
const actian = themeSet.children.find(c => c.name === "Theme=Actian");
const card = actian.createInstance();
const frame = card.detachInstance();              // Detach to append content
const content = frame.findOne(n => n.name === "Content");
content.appendChild(myThemePreview);
```

---

### DS Kit Brand & Presentation Assets (import directly — not in Meta Kit)

These components live in the DS Kit library and should be imported directly via `importComponentByKeyAsync` or `importComponentSetByKeyAsync`. They are NOT in Meta Kit.

| Asset | Key | Library | Import method |
|-------|-----|---------|---------------|
| Actian Pyramid | `84e6abe2e5b7dbe96a859397f557249922560413` | DS Kit | `importComponentSetByKeyAsync` — Variants: Color=Full color, Color=White |
| Illustration | `00302ca7dc4298c719f19ca4766029909ecbeb9d` | DS Kit | `importComponentSetByKeyAsync` — Variants: Empty state large/medium/small, Error state/medium, Maintenance, Success |
| Actian Data Intelligence logo | `2e53061b856da7a42b2328279d16718d252e0780` | DS Kit | `importComponentSetByKeyAsync` — Type × Orientation |
| Presentation Cover background | Node `12770:14027` | DS Kit (Illustrations & graphics page) | Clone frame via `use_figma` — dark with geometric vectors |
| Presentation Cover+logo background | Node `12770:14032` | DS Kit | Same as Cover + Actian Pyramid at bottom-right |
| Presentation Section background | Node `12770:14016` | DS Kit | Dark geometric for section dividers |
| Presentation Section+logo background | Node `12770:14021` | DS Kit | Same as Section + Actian Pyramid |
| Template file (full slide reference) | File `<TEMPLATES_FILE_KEY>` node `5557:16` | Template for projects | 5 slide types: Cover, Body, Body+sidebar, Section, Back cover |

---

## Standalone Components

### Meta / Chrome / Generation Log

Generation metadata card. First element in every AI-generated output.

| Field | Value |
|-------|-------|
| Key | `a9653f30925367e96dea90093d750bfe70849571` |
| Node | `3:2` |
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

Horizontal divider line between card sections.

| Field | Value |
|-------|-------|
| Key | `f4d778e1cf9bb61a33712c791486f54bb1c095b7` |
| Node | `4:2` |
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

Dark code block for CSS, HTML, ARIA code examples.

| Field | Value |
|-------|-------|
| Key | `1bf10eee1751a46da5f90a9671be6c9abf0073b7` |
| Node | `8:2` |
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

### Meta / Chrome / Flow Cover Card

Dark cover card at the start of each sub-flow. Shows Feature, Flow, and User fields on a dark background.

| Field | Value |
|-------|-------|
| Key | `eaebde6bd07d2f19f3f9c00a9587240cb085a90d` |
| Node | `46:344` |
| Import | `figma.importComponentByKeyAsync(key)` |
| Variants | None (single component) |
| Text properties | Feature, Flow, User |

```js
const coverComp = await figma.importComponentByKeyAsync("eaebde6bd07d2f19f3f9c00a9587240cb085a90d");
const cover = coverComp.createInstance();
setProp(cover, "Feature", "User Management");
setProp(cover, "Flow", "Invite new user");
setProp(cover, "User", "Admin");
```

---

### Meta / Content / Research Frame

Container for research findings in presentations. Shows title, source attribution, and content area.

| Field | Value |
|-------|-------|
| Key | `e671618f2b4c6ea406a995fdc3012ac54eadfe56` |
| Node | `48:31` |
| Import | `figma.importComponentByKeyAsync(key)` |
| Variants | None (single component) |
| Text properties | Title, Source |

```js
const researchComp = await figma.importComponentByKeyAsync("e671618f2b4c6ea406a995fdc3012ac54eadfe56");
const research = researchComp.createInstance();
setProp(research, "Title", "User Interview Findings");
setProp(research, "Source", "Q1 2026 Research — 12 participants");
```

---

### Meta / Chrome / Feedback
Annotation component for designer feedback and library gap markers. Two variants: Designer (prominent blue, placed by designers for review feedback) and System (subtle amber, placed automatically when the plugin improvises around a library gap).

- Variants: **Type:** `Designer` · `System`
- Properties: `Message` (text), `Target` (text), `Severity` (enum: Missing component / Missing variant / Missing property / General)
- Node: `66:20` | Key: `d5cba21bc3dbf36578665bac89834fbe1ca29ed0`

---

## Templates (hidden)

These components live on the dedicated "Templates" page in Meta Kit. They are visible (required for publishing/importing) but prefixed with `Meta / Template /` and described as "Do not use directly." Skills clone and fill them via the template engine (`cloneTemplate` + `fillSlots` from `builders.md`). See `meta-kit-registry.json` for the full registry.

### Meta / Template / Table Header Row
- Node: `73:12` | Key: `0754accfc4bc79ce9a68ff8fe7a108f1b41b9b2e`
- Text slots: `label`
- Category: table

### Meta / Template / Table Data Row
- Node: `74:12` | Key: `3a1fae22dd85936f81565122888efd8a50e37180`
- Text slots: `label`, `value`
- Category: table

### Meta / Template / State Column
- Node: `75:12` | Key: `4f782d1a8541b4474858767209f99dce1428784b`
- Text slots: `title`
- Category: grid

### Meta / Template / Section Header
- Node: `76:12` | Key: `f4fd576001f4f1f4606a4efb051d1e4492e378c4`
- Text slots: `title`, `subtitle`
- Category: layout

### Meta / Template / Swatch Row
- Node: `77:12` | Key: `96647364b6cb5c55b7ced72106708daaa33afb7f`
- Text slots: `name`, `value`, `hex`
- Category: tokens

---

## Quick Reference

| Component | Key | Node | Import method |
|-----------|-----|------|---------------|
| Brief Card | `3dbb732730...` | `7:2` | `importComponentSetByKeyAsync` |
| Do-Don't Pair | `28edfacf13...` | `9:24` | `importComponentSetByKeyAsync` |
| Flow Screen | `2ca7c756ad...` | `21:1198` | `importComponentSetByKeyAsync` |
| Color Swatch | `da3369932f...` | `42:17` | `importComponentSetByKeyAsync` |
| Contrast Badge | `941756541a...` | `44:20` | `importComponentSetByKeyAsync` |
| Pointer Badge | `7e066fc21d...` | `45:26` | `importComponentSetByKeyAsync` |
| Dimension Annotation | `49bf6a1b21...` | `45:37` | `importComponentSetByKeyAsync` |
| Stat Card | `8662c721d7...` | `46:29` | `importComponentSetByKeyAsync` |
| Accessibility Card | `b4779a13f4...` | `47:24` | `importComponentSetByKeyAsync` |
| Theme Card | `9081a77619...` | `47:43` | `importComponentSetByKeyAsync` |
| Generation Log | `a9653f3092...` | `3:2` | `importComponentByKeyAsync` |
| Card Divider | `f4d778e1cf...` | `4:2` | `importComponentByKeyAsync` |
| Code Block | `1bf10eee17...` | `8:2` | `importComponentByKeyAsync` |
| Flow Cover Card | `eaebde6bd0...` | `46:344` | `importComponentByKeyAsync` |
| Research Frame | `e671618f2b...` | `48:31` | `importComponentByKeyAsync` |
| Feedback | `d5cba21bc3...` | `66:20` | `importComponentSetByKeyAsync` |
| **Templates (hidden)** | | | |
| Table Header Row | `0754accfc4...` | `73:12` | `importComponentByKeyAsync` → clone+fill |
| Table Data Row | `3a1fae22dd...` | `74:12` | `importComponentByKeyAsync` → clone+fill |
| State Column | `4f782d1a85...` | `75:12` | `importComponentByKeyAsync` → clone+fill |
| Section Header | `f4fd576001...` | `76:12` | `importComponentByKeyAsync` → clone+fill |
| Swatch Row | `96647364b6...` | `77:12` | `importComponentByKeyAsync` → clone+fill |
