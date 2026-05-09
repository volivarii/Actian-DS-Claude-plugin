---
name: convert-to-hifi
description: Convert a Fat Marker wireframe screen or flow into high-fidelity using DS Kit components. Reads FM instances from a Figma frame, maps to DS equivalents, applies layout polish, and pushes a new hifi frame.
argument-hint: "<figma-url> [--ref <figma-url>[,<figma-url>]] [--no-prompt]"
---

# Convert to HiFi

Upgrade a Fat Marker wireframe to a high-fidelity DS Kit frame. Three-stage pipeline: extract FM tree from Figma → deterministic transform → LLM polish + push. Runs autonomously after Stage 2 confirmation — no other pauses.

> **Always pass `skillNames: "figma-use"` on every `mcp__claude_ai_Figma__use_figma` invocation.** This is mandatory per Figma's official contract — the `figma-use` skill carries the load-bearing Plugin API rules (atomic-on-error, color 0–1 range, HUG-after-append, font preload, await-all-promises, page-context-reset, return-all-IDs, explicit `variable.scopes`). Skipping it produces hard-to-debug failures.
> (Source: https://help.figma.com/hc/en-us/articles/39287396773399)

## Flags

| Flag | Type | Default | Behavior |
|------|------|---------|----------|
| `--ref <url[,url]>` | URL list | none | **v1: Figma URLs only.** Reference frames influence hifi-specific decisions: component variant selection (compact vs. comfortable density), hierarchy emphasis, toolbar/empty-state choices. Multi-URL = blended influence. For external references (Linear, Stripe, etc.), screenshot into a Figma frame first and pass that URL. Image-URL support targeted for v2 alongside the vision pipeline. Until the engine pipeline lands, `--ref` URLs are surfaced to the LLM as `get_screenshot` reference images during Stage 3 polish. |
| `--no-prompt` | boolean | false | Skip the interactive ref gate (Step 0.5). Use defaults for any unset flags. See `references/ds-rules/interactive-gates.md`. |

## Step 0 — Parse args

Parse the args. Note whether `--ref` and `--no-prompt` were explicitly passed. The `--no-prompt` flag is parsed via `scripts/lib/parse-no-prompt.js`.

## Step 0.5 — Ref gate (interactive)

**Skipped if:** `--ref` is explicitly passed OR `--no-prompt` is set.

Otherwise, present this prompt verbatim (do NOT proceed until the user replies):

```
Convert <source frame name> to hifi.

Reference (optional): paste a Figma URL or image URL to bias density/style,
or press enter to use registry defaults.

Examples:
  https://figma.com/design/abc/foo?node-id=1-2
  https://figma.com/design/x/y?node-id=3-4 https://figma.com/design/x/z?node-id=5-6
```

Parser:
- Empty / "enter" → no ref, proceed with defaults
- One or more space-separated URLs → set `--ref <url1>,<url2>,…`
- Anything else (non-URL token) → re-prompt with "I need URL(s) or enter for no ref. Got: <input>"
- 3 retry attempts → abort with: "Aborting. Run again with `--no-prompt` to skip this gate, or `--ref <url>` to pass a ref directly."

Once a value is resolved (from flag or gate), proceed to the pipeline.

## Pipeline

1. Parse URL → `fileKey` + `nodeId`
2. **Stage 1** — Extract FM tree from Figma (automated)
3. **Stage 2** — Deterministic transform via `transform-to-hifi.js` → **confirmation gate**
4. **Stage 3** — LLM polish + push to Figma (automated, uninterrupted after gate)

---

## Stage 1 — Extract FM tree from Figma

Parse the Figma URL per `references/figma/figma-output.md` (convert `-` to `:` in nodeId). Always pass `skillNames: "figma-use"` (see top-of-skill callout).

**CRITICAL — large frames overflow the use_figma response limit.** Use the two-pass approach below.

### Pass 1: Flat instance list (compact, no nesting)

Collect all INSTANCE and TEXT nodes as a flat array with their parent path. This avoids response truncation.

```js
const target = await figma.getNodeByIdAsync('<nodeId>');
const nodes = [];
function walk(node, path) {
  if (node.type === 'INSTANCE') {
    const main = node.mainComponent;
    const set = main?.parent?.type === 'COMPONENT_SET' ? main.parent : null;
    const props = {};
    try {
      const defs = (set || main)?.componentPropertyDefinitions || {};
      for (const [k, d] of Object.entries(defs)) {
        if (d.type === 'TEXT' || d.type === 'BOOLEAN')
          props[k.split('#')[0]] = node.componentProperties?.[k]?.value;
      }
    } catch(e) {}
    nodes.push({ t: 'I', p: path, n: node.name, k: set ? set.key : main?.key, v: node.variantProperties || {}, pr: props, w: node.width, h: node.height });
  } else if (node.type === 'TEXT') {
    nodes.push({ t: 'T', p: path, n: node.name, c: node.characters, s: node.fontSize });
  } else if (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'SECTION') {
    // node.layoutMode only exists on FRAME — guard for GROUP/SECTION
    var lm = node.type === 'FRAME' ? (node.layoutMode || 'NONE') : 'NONE';
    nodes.push({ t: 'F', p: path, n: node.name, w: node.width, h: node.height, lm: lm });
  }
  if ('children' in node && node.children) {
    for (let i = 0; i < node.children.length; i++)
      walk(node.children[i], path + '/' + node.children[i].name);
  }
}
walk(target, target.name);
return JSON.stringify({ root: target.name, count: nodes.length, nodes });
```

### Pass 2: Reconstruct tree from flat list

If the response is still truncated for very large frames, split by fetching top-level children separately:

```js
const target = await figma.getNodeByIdAsync('<nodeId>');
const children = target.children || [];
return JSON.stringify(children.map(c => ({ id: c.id, name: c.name, type: c.type, childCount: c.children?.length || 0 })));
```

Then fetch each child's subtree individually using the same flat-list code with the child's ID.

### Write FM tree

Assemble the flat node list into a tree structure (group by path) and write as `{project_working_directory}/components/hifi/[frame-name]-fm-tree.json`. The `fm-tree-to-flow-data.js` converter handles both flat and nested formats.

### Convert to flow-data format

The raw Figma tree uses `componentKey` fields. Convert to the flow-data format expected by the transform script using the converter:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/transformers/fm-tree-to-flow-data.js" \
  {project_working_directory}/components/hifi/[frame-name]-fm-tree.json \
  -o {project_working_directory}/components/hifi/[frame-name]-flow-data.json
```

This resolves `componentKey` → FM ref names (e.g., `fmNavItem`) using the FM Kit registry + FM_SLUGS mapping. Instances with unrecognized keys are tagged `unmapped` for Stage 3 handling.

---

## Stage 2 — Deterministic transform

Run `transform-to-hifi.js` on the **converted flow-data** (not the raw FM tree):

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh" && \
  "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/transformers/transform-to-hifi.js" \
    {project_working_directory}/components/hifi/[frame-name]-flow-data.json \
    -o {project_working_directory}/components/hifi/[frame-name]-hifi-data.json
```

The script reads `docs/generated/fm-to-ds-map.json` and `docs/generated/dskit.json`, rewrites every FM `ref` to its DS Kit equivalent, preserves variant mappings where defined, and embeds `meta.transformStats` in the output (`total`, `mapped`, `unmapped`).

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

After confirmation, build and push uninterrupted. Read `references/figma/figma-push-patterns.md` for component keys and patterns. Always pass `skillNames: "figma-use"` to every `use_figma` call.

### Handling unmapped nodes

For each node flagged `unmapped: true`:
1. Read `docs/generated/dskit.json` — scan component descriptions and variant axes
2. Infer the best DS Kit match by shape, purpose, and label text
3. Substitute with the inferred component; log the substitution in the generation card notes

**Common utility components** (not in FM Kit registry but frequently appear):
- `Meta / Utility / Card Divider` — import by key from `docs/generated/metakit.json`, use as a DS divider
- Manual rectangles used as dividers — replace with a 1px frame, fill `#E2E7F0`, `FILL` width

If the user chose "skip unmapped", omit those nodes entirely.

### Layout polish

Apply DS spacing tokens and layout rules to every container before pushing:
- Auto Layout on all frames — `VERTICAL` or `HORIZONTAL` per context
- Item spacing: `--zen-spacing-md` (16px) for content rows, `--zen-spacing-lg` (24px) for section gaps
- Padding: `--zen-spacing-lg` (20px) horizontal, `--zen-spacing-md` (16px) vertical on screen body
- Typography: map FM text sizes to DS text style tokens (body, label, heading tiers)
- See `references/ds-rules/component-instance-rules.md` for property-setting rules

### Push sequence (one small `use_figma` call per step)

1. **Create wrapper frame** — same parent as original, named `"[Original name] — HiFi wrapper"`, `HORIZONTAL` auto layout, gap 32, no fills. This holds the gen card and hifi frame side by side.
2. **Generation card** — import genLog by key from `docs/generated/metakit.json`, create instance, set props with `mode: "hifi"`, `skill: "convert-to-hifi"`, ISO date, prompt excerpt; append to **wrapper** (NOT inside the hifi frame)
3. **Create hifi frame** — named `"[Original name] — HiFi"`, 1440×960, `VERTICAL` auto layout; append to **wrapper**
4. **For each screen / section in hifi-data.json:**
   a. Import DS Kit components needed for this section (batch per section)
   b. Create content frame with auto layout
   c. Instantiate each DS component, set ALL properties (variant, text, boolean) per `references/ds-rules/component-instance-rules.md`
   d. Append to content frame, append content frame to hifi frame
5. **Report** — after all pushes complete, report node count and any skipped nodes to user. Then suggest the next loop step: "Audit this hifi frame? Run `/design-audit <pushed-url>` to check tokens, a11y, and DS rules — or `/design-audit <pushed-url> --fix all` to auto-fix P0/P1 findings."

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

- `docs/generated/fm-to-ds-map.json` — FM component key → DS component mapping table with variant axis maps
- `docs/generated/dskit.json` — DS Kit component registry (keys, variants, properties, descriptions)
- `docs/generated/fmkit.json` — FM Kit component registry (keys, variants, properties)
- `scripts/transformers/fm-tree-to-flow-data.js` — converts raw Figma tree to flow-data format (resolves componentKey → FM ref names via FM_SLUGS)
- `scripts/transformers/transform-to-hifi.js` — deterministic Stage 2 transform (CLI + module API)
- `references/figma/figma-push-patterns.md` — component keys, push patterns, Plugin API call templates
- `references/ds-rules/component-instance-rules.md` — rules for setting component properties correctly
