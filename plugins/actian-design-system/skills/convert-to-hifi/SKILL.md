---
name: convert-to-hifi
description: Convert a Fat Marker wireframe screen or flow into high-fidelity using DS Kit components. Reads FM instances from a Figma frame, maps to DS equivalents, applies layout polish, and pushes a new hifi frame.
argument-hint: "<figma-url>"
---

# Convert to HiFi

Upgrade a Fat Marker wireframe to a high-fidelity DS Kit frame. Three-stage pipeline: extract FM tree from Figma → deterministic transform → LLM polish + push. Runs autonomously after Stage 2 confirmation — no other pauses.

## Pipeline

1. Parse URL → `fileKey` + `nodeId`
2. **Stage 1** — Extract FM tree from Figma (automated)
3. **Stage 2** — Deterministic transform via `transform-to-hifi.js` → **confirmation gate**
4. **Stage 3** — LLM polish + push to Figma (automated, uninterrupted after gate)

---

## Stage 1 — Extract FM tree from Figma

Parse the Figma URL per `references/figma-output.md` (convert `-` to `:` in nodeId). Then run a single `use_figma` call with the code below. Always pass `skillNames: "figma-use"`.

```js
const target = await figma.getNodeByIdAsync('<nodeId>');
function walk(node) {
  const entry = { type: node.type, name: node.name, id: node.id, width: node.width, height: node.height };
  if (node.type === 'INSTANCE') {
    const main = node.mainComponent;
    const setParent = main?.parent?.type === 'COMPONENT_SET' ? main.parent : null;
    entry.componentKey = setParent ? setParent.key : main?.key;
    entry.variantProperties = node.variantProperties || {};
    const props = {};
    try {
      const cpDefs = (setParent || main)?.componentPropertyDefinitions || {};
      for (const [name, def] of Object.entries(cpDefs)) {
        if (def.type === 'TEXT' || def.type === 'BOOLEAN') {
          const baseName = name.split('#')[0];
          props[baseName] = node.componentProperties?.[name]?.value;
        }
      }
    } catch (e) {}
    entry.props = props;
  }
  if (node.type === 'TEXT') { entry.characters = node.characters; entry.fontSize = node.fontSize; }
  if (node.children) { entry.children = node.children.map(walk); }
  return entry;
}
return JSON.stringify(walk(target), null, 2);
```

**What to collect per INSTANCE node:**
- `componentKey` — from `mainComponent.parent` if parent is a `COMPONENT_SET`, else from `mainComponent` itself
- `variantProperties` — the current variant axis values on the instance
- `props` — TEXT and BOOLEAN component properties, keyed by base name (strip `#hash` suffixes)

Write the extracted tree as `{project_working_directory}/components/hifi/[frame-name]-fm-tree.json`.

### Convert to flow-data format

The raw Figma tree uses `componentKey` fields. Convert to the flow-data format expected by the transform script using the converter:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/fm-tree-to-flow-data.js" \
  {project_working_directory}/components/hifi/[frame-name]-fm-tree.json \
  -o {project_working_directory}/components/hifi/[frame-name]-flow-data.json
```

This resolves `componentKey` → FM ref names (e.g., `fmSideNavItem`) using the FM Kit registry + FM_SLUGS mapping. Instances with unrecognized keys are tagged `unmapped` for Stage 3 handling.

---

## Stage 2 — Deterministic transform

Run `transform-to-hifi.js` on the **converted flow-data** (not the raw FM tree):

```bash
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/transform-to-hifi.js" \
  {project_working_directory}/components/hifi/[frame-name]-flow-data.json \
  -o {project_working_directory}/components/hifi/[frame-name]-hifi-data.json
```

The script reads `docs/fm-to-ds-map.json` and `docs/dskit.json`, rewrites every FM `ref` to its DS Kit equivalent, preserves variant mappings where defined, and embeds `meta.transformStats` in the output (`total`, `mapped`, `unmapped`).

**Confirmation gate** — present verbatim after the script completes:

```
Transform complete: N instances — M mapped, U unmapped.

[If U > 0]: Unmapped nodes:
- [list each unmapped node name + unmappedReason]

Reply:
- **"push [Figma URL]"** — I'll handle unmapped nodes creatively and push
- **"skip unmapped"** — omit unmapped nodes, push mapped only
- **"abort"** — stop here
```

Do not proceed until the user replies.

---

## Stage 3 — LLM polish + push

After confirmation, build and push uninterrupted. Read `references/figma-push-patterns.md` for component keys and patterns. Always pass `skillNames: "figma-use"` to every `use_figma` call.

### Handling unmapped nodes

For each node flagged `unmapped: true`:
1. Read `docs/dskit.json` — scan component descriptions and variant axes
2. Infer the best DS Kit match by shape, purpose, and label text
3. Substitute with the inferred component; log the substitution in the generation card notes

**Common utility components** (not in FM Kit registry but frequently appear):
- `Meta / Utility / Card Divider` — import by key from `docs/metakit.json`, use as a DS divider
- Manual rectangles used as dividers — replace with a 1px frame, fill `#E2E7F0`, `FILL` width

If the user chose "skip unmapped", omit those nodes entirely.

### Layout polish

Apply DS spacing tokens and layout rules to every container before pushing:
- Auto Layout on all frames — `VERTICAL` or `HORIZONTAL` per context
- Item spacing: `--zen-space-4` (16px) for content rows, `--zen-space-6` (24px) for section gaps
- Padding: `--zen-space-5` (20px) horizontal, `--zen-space-4` (16px) vertical on screen body
- Typography: map FM text sizes to DS text style tokens (body, label, heading tiers)
- See `references/component-instance-rules.md` for property-setting rules

### Push sequence (one small `use_figma` call per step)

1. **Create wrapper frame** — same parent as original, named `"[Original name] — HiFi wrapper"`, `HORIZONTAL` auto layout, gap 32, no fills. This holds the gen card and hifi frame side by side.
2. **Generation card** — import genLog by key from `docs/metakit.json`, create instance, set props with `mode: "hifi"`, `skill: "convert-to-hifi"`, ISO date, prompt excerpt; append to **wrapper** (NOT inside the hifi frame)
3. **Create hifi frame** — named `"[Original name] — HiFi"`, 1440×960, `VERTICAL` auto layout; append to **wrapper**
4. **For each screen / section in hifi-data.json:**
   a. Import DS Kit components needed for this section (batch per section)
   b. Create content frame with auto layout
   c. Instantiate each DS component, set ALL properties (variant, text, boolean) per `references/component-instance-rules.md`
   d. Append to content frame, append content frame to hifi frame
5. **Report** — after all pushes complete, report node count and any skipped nodes to user

**Rules:**
- Return IDs from every call — use them in subsequent calls to append children
- If a call fails, skip that element and continue; report skips at the end
- Original FM frame is untouched — never modify it
- Keep each `use_figma` call under 2KB

---

## Key rules

- **Original frame untouched:** The FM source frame must never be modified or moved
- **Sibling frame:** Push hifi output as a new frame at the same parent level, not nested inside the FM frame
- **All properties set:** Every DS instance must have variant, text, and boolean properties set — no defaults left unset
- **Tokens only:** No hardcoded hex, px, or font values — all spacing and color from DS tokens
- **Small direct calls:** Keep each `use_figma` call to 1-3 node operations max

---

## References

- `docs/fm-to-ds-map.json` — FM component key → DS component mapping table with variant axis maps
- `docs/dskit.json` — DS Kit component registry (keys, variants, properties, descriptions)
- `docs/fmkit.json` — FM Kit component registry (keys, variants, properties)
- `scripts/fm-tree-to-flow-data.js` — converts raw Figma tree to flow-data format (resolves componentKey → FM ref names via FM_SLUGS)
- `scripts/transform-to-hifi.js` — deterministic Stage 2 transform (CLI + module API)
- `references/figma-push-patterns.md` — component keys, push patterns, Plugin API call templates
- `references/component-instance-rules.md` — rules for setting component properties correctly
