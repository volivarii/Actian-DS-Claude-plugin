# Figma Push Patterns

Direct Figma Plugin API patterns for pushing content to Figma. Each pattern is a standalone `use_figma` call (200-2000 bytes). No interpreter, no JSON specs, no Node scripts at push time.

---

## 1. Component Keys

### Meta Kit (all skills)

| Ref | Key | Import Method |
|-----|-----|---------------|
| genLog | `a9653f30925367e96dea90093d750bfe70849571` | importComponentByKeyAsync |
| divider | `f4d778e1cf9bb61a33712c791486f54bb1c095b7` | importComponentByKeyAsync |
| codeBlock | `1bf10eee1751a46da5f90a9671be6c9abf0073b7` | importComponentByKeyAsync |
| flowCoverCard | `eaebde6bd07d2f19f3f9c00a9587240cb085a90d` | importComponentByKeyAsync |
| researchFrame | `e671618f2b4c6ea406a995fdc3012ac54eadfe56` | importComponentByKeyAsync |
| feedback | `d5cba21bc3dbf36578665bac89834fbe1ca29ed0` | importComponentSetByKeyAsync |
| flowScreen | `2ca7c756ad54e81219104d3a270ba8eb9eeffcf6` | importComponentSetByKeyAsync |

### Brief Kit (component-brief)

| Ref | Key | Import Method |
|-----|-----|---------------|
| briefCard | `3dbb732730af0754210cde7af35e5236a2502843` | importComponentSetByKeyAsync |
| doDontPair | `28edfacf13e50706586172bd48f8a3ad84d7c263` | importComponentSetByKeyAsync |
| contrastBadge | `941756541adc6ce21e32e848c2039c64fece0fcf` | importComponentSetByKeyAsync |
| pointerBadge | `7e066fc21d9a2bbbcd1149113787cf59140162d4` | importComponentSetByKeyAsync |
| dimAnnotation | `49bf6a1b210a403ba145a3fdee9b1994eb54069a` | importComponentSetByKeyAsync |
| a11yCard | `b4779a13f4097d682413a669eaaf9ead1b49f115` | importComponentSetByKeyAsync |
| colorSwatch | `da3369932f710386b76ca91a40ebd48d94e3f2e0` | importComponentSetByKeyAsync |
| themeCard | `9081a7761dfbe11d576182f3cb1711b9e76c2d36` | importComponentSetByKeyAsync |
| statCard | `8662c721d74d6f0079f273f76eec374b12ec2fae` | importComponentSetByKeyAsync |

### Templates (brief tables/rows)

| Ref | Key | Import Method |
|-----|-----|---------------|
| tableHeaderRow | `0754accfc4bc79ce9a68ff8fe7a108f1b41b9b2e` | importComponentByKeyAsync |
| tableDataRow | `3a1fae22dd85936f81565122888efd8a50e37180` | importComponentByKeyAsync |
| stateColumn | `4f782d1a8541b4474858767209f99dce1428784b` | importComponentByKeyAsync |
| sectionHeader | `f4fd576001f4f1f4606a4efb051d1e4492e378c4` | importComponentByKeyAsync |
| swatchRow | `96647364b6cb5c55b7ced72106708daaa33afb7f` | importComponentByKeyAsync |
| a11ySpecRow | `92ed7bc88cf229782c4b42238aacba1d15f8fd06` | importComponentByKeyAsync |

### Slide Kit (generate-presentation)

| Ref | Key | Import Method |
|-----|-----|---------------|
| slideCover | `a12f6f0b26fffc59fdac49df2bc3c36182c912da` | importComponentByKeyAsync |
| slideBodyFull | `281e7a9bc55abe69bb2364e639f7511b4a005694` | importComponentByKeyAsync |
| slideBodyTV | `28ea7a37752149d78679847ec7893368a4c4f1a0` | importComponentByKeyAsync |
| slideSection | `348efaa22a6da818c435017399a357b47257bcdc` | importComponentByKeyAsync |
| slideBack | `6df533ae800a6596fd84e93a2e5fc725dbd6a369` | importComponentByKeyAsync |

### FM Kit (generate-flow)

| Ref | Key | Import Method |
|-----|-----|---------------|
| fmAppHeader | `8fc9bcee610c7f8d22ebcc268467993f6dc99c87` | importComponentSetByKeyAsync |
| fmSideNavItem | `d18a0a772ed4acd760c497cb93de796ff052a7b4` | importComponentSetByKeyAsync |
| fmPageHeader | `ae1f8684a4a89aa74463d439e4e8c1e7a48137fe` | importComponentSetByKeyAsync |
| fmButton | `368b62312ca941c80ea8eeed84a57d33bb470b09` | importComponentSetByKeyAsync |
| fmTableCell | `9267fecfadc4577563deb1425fa598d1f5af9144` | importComponentSetByKeyAsync |
| fmTextInput | `355855c7b2e05b5b336167883b3c9ebbfbd881ad` | importComponentSetByKeyAsync |
| fmDropdown | `781f86dca2a37706771f3e2e580242d2693a722f` | importComponentSetByKeyAsync |
| fmInputLabel | `a39aa1c7cb593f7d26b7659e4cbe4e419e00c766` | importComponentSetByKeyAsync |
| fmSearchInput | `443e232d5454f06dbd5bc06c2cacf21e80a20e4a` | importComponentSetByKeyAsync |
| fmTag | `c7239d9355ddf557f36f4d159153619672ab81ef` | importComponentSetByKeyAsync |
| fmChip | `0861d937682e66d39f57fe52ca83d526e634ff66` | importComponentSetByKeyAsync |
| fmTab | `cfbd732ff4f4e6620b333c60f1ac7fe5116a93aa` | importComponentSetByKeyAsync |
| fmPlaceholder | `e49a9de0573cf527736e8173f722f230fa957fb8` | importComponentSetByKeyAsync |
| fmEmptyState | `cf44b9c0b5623a394d90f320f98250dc77378268` | importComponentSetByKeyAsync |
| fmAlert | `fe30f37740688350762bd2b1be426d9d1588b7d9` | importComponentSetByKeyAsync |
| fmBanner | `d7f323e492b456a2c56f81f3dc892eb24de11a6e` | importComponentByKeyAsync |
| fmToggle | `fe9e82118d1df75a8aea732eb7f9169ccaa21878` | importComponentSetByKeyAsync |
| fmCheckbox | `965cf2c85659bbde891f6f086bbd02d50d445d58` | importComponentSetByKeyAsync |
| fmDialog | `0cc53eca9c90cccb8cbc57864ea110378414fd2b` | importComponentByKeyAsync |
| fmTextArea | `bba14eea66edb3871ea389afeb4e1a07585e5733` | importComponentSetByKeyAsync |
| fmBadge | `2410b87c83d33d3bcb2a6ac7aa2168a53a4eb3d8` | importComponentSetByKeyAsync |
| fmStepper | `d0a21b5288571cc7690c6c9289d18cd298035c53` | importComponentSetByKeyAsync |
| fmToast | `6140b137ce98ebfeeb7fc7e426f6d09de1cc18d0` | importComponentSetByKeyAsync |
| fmIconButtons | `f868aabb0aa2c52f00610c09da8dce3bccc79dc4` | importComponentSetByKeyAsync |
| fmSpinner | `52927648847b15a51d314cf06ca1c0f19f398b4d` | importComponentByKeyAsync |
| fmRadioButton | `1569353eb82fd5f6cb8da979f1048cd1b323e8c4` | importComponentSetByKeyAsync |
| fmDateInput | `69d6329ea2d5ac3515b6ebb04ad6c1bd72e4890e` | importComponentSetByKeyAsync |
| fmProgressBar | `12abe66d36a63ef385a17e2553a1312560a0f106` | importComponentSetByKeyAsync |
| fmMultiSelectDropdown | `876bfa32334594915085ebea82f1f887b3fecb09` | importComponentSetByKeyAsync |
| fmTabs | `860eadef9ba29cf20a3da3ca9d014718e3f6cabb` | importComponentByKeyAsync |

---

## 2. Core Patterns

### Pattern 1: Create wrapper frame + position on page

```js
// Create the top-level wrapper frame, positioned below existing content.
const page = figma.currentPage;
let maxY = 0;
for (const child of page.children) {
  const bottom = child.y + child.height;
  if (bottom > maxY) maxY = bottom;
}

const wrapper = figma.createFrame();
wrapper.name = "My Output";
wrapper.layoutMode = "HORIZONTAL";
wrapper.itemSpacing = 32;
wrapper.primaryAxisSizingMode = "AUTO";
wrapper.counterAxisSizingMode = "AUTO";
wrapper.fills = [];
wrapper.x = 0;
wrapper.y = maxY + 200;

// Store the wrapper ID so subsequent calls can append to it
wrapper.setSharedPluginData("ds", "wrapperId", wrapper.id);

return { wrapperId: wrapper.id };
```

### Pattern 2: Import single component + create instance

```js
// Import a single component by key and create an instance.
const comp = await figma.importComponentByKeyAsync("a9653f30925367e96dea90093d750bfe70849571");
const inst = comp.createInstance();
inst.name = "Generation Log";

// Set component properties (text, booleans, instance swaps)
inst.setProperties({
  "Skill": "Skill: generate-flow",
  "Date": "2026-04-08T00:00:00Z"
});

return { instanceId: inst.id };
```

### Pattern 3: Import component set + create variant instance

```js
// Import a component set and create a specific variant.
const set = await figma.importComponentSetByKeyAsync("368b62312ca941c80ea8eeed84a57d33bb470b09");

// Find the desired variant by name (comma-separated property=value pairs)
let variant = set.findChild(n =>
  n.type === "COMPONENT" && n.name === "Type=Primary, Size=md"
);
// Fallback: defaultVariant or first child
if (!variant) variant = set.defaultVariant || set.children[0];

const inst = variant.createInstance();
inst.name = "Primary Button";

return { instanceId: inst.id };
```

### Pattern 4: Append children to frame by ID

```js
// Append previously-created nodes into a parent frame.
const parent = await figma.getNodeByIdAsync("1234:5678");
const child1 = await figma.getNodeByIdAsync("1234:5679");
const child2 = await figma.getNodeByIdAsync("1234:5680");
parent.appendChild(child1);
parent.appendChild(child2);

return { parentId: parent.id, childCount: parent.children.length };
```

### Pattern 5: Create text node

```js
// Create a text node. Always load the font before setting characters.
await figma.loadFontAsync({ family: "Inter", style: "Regular" });

const text = figma.createText();
text.characters = "Hello, world";
text.fontSize = 14;
text.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.18 } }];

// For slides, use Roboto instead:
// await figma.loadFontAsync({ family: "Roboto", style: "Regular" });

return { textId: text.id };
```

### Pattern 6: Create auto-layout frame

```js
// Create a frame with auto-layout for containing child elements.
const frame = figma.createFrame();
frame.name = "Card Container";
frame.layoutMode = "VERTICAL";
frame.itemSpacing = 16;
frame.paddingTop = 24;
frame.paddingBottom = 24;
frame.paddingLeft = 24;
frame.paddingRight = 24;
frame.primaryAxisSizingMode = "AUTO";
frame.counterAxisSizingMode = "AUTO";
frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
frame.cornerRadius = 8;

return { frameId: frame.id };
```

### Pattern 7: hexToRgb helper

```js
// Convert hex color to Figma's 0-1 RGB format. Inline in any call that needs it.
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255
  };
}
// Usage: frame.fills = [{ type: "SOLID", color: hexToRgb("#1A1A2E") }];
```

---

## 3. Push Rules

1. **Always pass `skillNames: "figma-use"`** with every `use_figma` call.
2. **One operation per call** -- create a frame OR import components OR populate content. Not all three.
3. **Return IDs from every call** -- use them in subsequent calls to append children.
4. **Keep calls under 2KB** -- if code is longer, split into multiple calls.
5. **Fonts before text** -- call `loadFontAsync` before setting `.characters`.
6. **Colors are 0-1 range** -- `{ r: 0.1, g: 0.1, b: 0.18 }` not `{ r: 26, g: 26, b: 46 }`.
7. **No interpreter, no JSON specs, no Node scripts at push time** -- write direct Plugin API code.
8. **Read your data model** -- the JSON you generated has all the content. Translate each node to Plugin API calls.
9. **If a call fails, skip that element and continue** -- don't retry in a loop.
