# generate-flow push sequence

The exact ordered Figma push procedure for `generate-flow` (operating on the
approved `flow-data.json`): wrapper + GenLog, tier/scope annotations, research +
cover cards, the per-screen frame + chrome `setProperties` + deterministic content
emitter, and the designer report. Loaded on demand from
`skills/generate-flow/SKILL.md`. Component keys and prop maps live in
`references/figma/figma-push-patterns.md`.

## Contents
- Push sequence (steps 1–7)
- Push rules

**Push sequence:**

1. Navigate to target page + create wrapper frame
2. GenLog — import by key `a9653f30925367e96dea90093d750bfe70849571`, `setProperties` with `"Skill#3:0"`, `"Prompt#3:1"`, `"Date#3:2"`, `"Duration#3:3"`, `"Model#3:4"`, `"Plugin Version#3:5"`. **Read the Plugin Version from `plugin.json` at run time — never hardcode a number, and never copy a version printed anywhere in these docs (they go stale).** Get the live value with:
   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
   "$NODE_BIN" -e 'process.stdout.write("v"+require(process.env.CLAUDE_PLUGIN_ROOT+"/.claude-plugin/plugin.json").version)'
   ```
   Use that exact output (e.g. `v1.98.1`) for `"Plugin Version#3:5"`.
3. Tier Summary (if any screen has a `tier` field) — call `buildTierSummary(screens)` from `scripts/lib/shared-constants.js`. If it returns a TEXT node spec (not null), push the TEXT node into the wrapper as a sibling of the GenLog instance, immediately following it. Skip when `buildTierSummary` returns null (none of the screens are tiered).
3b. **Scope tag (B-refine.1, v1.55.0+)** — when this run was scoped (`--scope single-unit:<id>` or `multi-unit:[…]`), push an additional TEXT node sibling immediately after Tier Summary with content `"Scope: <scope-tag>"` (e.g., `"Scope: single-unit:notification-preferences-2"`). Use the same TEXT styling as Tier Summary. Skip when scope is `"full"` (the default; producing no annotation matches v1.54.x behavior). The skill holds scope in its own runtime state — passed to the validator via `--scope` and to this push step in parallel.
4. Research card (if opted-in) — import Research Frame `e671618f2b4c6ea406a995fdc3012ac54eadfe56`, `setProperties` with `"Title#48:10"`, `"Source#48:11"`, detach, inject findings into Content slot. **Must contain the exact same content as the chat findings** — same competitors, patterns, recommendations, source URLs. Card is the persistent record of what informed the design.
5. Cover Card — import `eaebde6bd07d2f19f3f9c00a9587240cb085a90d`, `setProperties` with `"Feature#46:8"`, `"Flow#46:9"`, `"User#46:10"` — NEVER leave defaults
6. For each screen:
   a. Import components (header, sidebar, content components)
   b. Create screen frame — width **1440 fixed**, VERTICAL auto-layout, **height HUGS content** (`primaryAxisSizingMode = 'AUTO'`). 960 is a *minimum* (set a min-height), NOT a fixed cap. **Never fix the height at 960 with `clipsContent`** — tall screens (long forms, multi-section pages) MUST grow downward, never crop. If you need a viewport reference, add a non-clipping 960 guide, but the frame itself hugs.
   c. App chrome — **set EVERY chrome component's props from the screen data; never leave a default placeholder.** `"Page Title"`, `"Description text"`, `"Button label"`, `"Nav Item"` are P0 blockers (see `references/figma/figma-push-patterns.md` → "NEVER leave default property values"; prop keys + defaults for every chrome component are listed there). Chrome is NOT covered by the content emitter — you must `setProperties` it explicitly:
      - **App header** (`fm-app-header`) — variant `Type=` the screen's app (Admin / Explorer / Studio / Actian, from `meta.app`); set the product/app name via the nested `findOne` (per push-patterns).
      - **Page header** (`fm-page-header`) — `setProperties`: `"Title#979:22"` ← `screen.pageHeader.title`, `"Subtitle#979:23"` ← `screen.pageHeader.subtitle`. Variant `Type=Title + Subtitle`, or `Type=Title + Actions` when `screen.pageHeader.actions[]` is non-empty — then push one `fm-button` per action with `"Label#1411:32"` ← the action label (NEVER "Button label"). Give the page-header band ≈24px top + horizontal padding so the title is not flush against the app header (this is the "no header margin" fix).
      - **Sidebar** — for each `screen.navItems[i]`, set the side-nav item `"Label#1463:4"` ← the nav label; the item matching `screen.activeNavItem` (or `meta._glossary.sidebarActive`) gets variant `State=On`, all others `State=Placeholder` (focus principle — `references/ds-rules/quality-tiers.md`).
   d. Content area with `paddingTop: 24, paddingLeft: 24, paddingRight: 24, paddingBottom: 24` — content NEVER flush against tab bar. Populate from `screen.content[]`. Capture the content-area frame's id from its creation call's returned `createdNodeIds[0]` — that id is `<contentFrameId>` below.

   **Content push (deterministic, v1.98+) — preferred:** instead of hand-walking `content[]`, emit the whole content tree as one atomic Plugin-API script. Capture the JSON for `screen.content[]` into `$CONTENT_JSON`, then:
   ```bash
   printf '%s' "$CONTENT_JSON" | (
     source "$CLAUDE_PLUGIN_ROOT/scripts/lib/resolve-node.sh" &&
     "$NODE_BIN" "$CLAUDE_PLUGIN_ROOT/scripts/renderers/html-renderers/render-node-figma.js" \
       --parent-id "<contentFrameId>"
   )
   ```
   Capture stdout (Plugin-API JS) and pass it **verbatim** into ONE `mcp__claude_ai_Figma__use_figma` call (`skillNames: "figma-use"`). On exit 1, read the `{ ok:false, errors }` JSON on stderr, fix the offending `content[]` node, and re-run the emitter — never hand-edit the emitted JS. This guarantees the Figma content is mechanically identical to the HTML preview produced by the twin `render-node.js`.

   **Fallback (parallel-change, MIGRATIONS Rule 1):** the hand-walk in sub-step **d** above stays valid if the emitter can't yet handle a node; it remains documented until cutover completes.

   e. Append to wrapper
7. Report results to the designer:
   - Count of pushed screens
   - Tier breakdown (when any screen has a `tier` field):

     ```
     Generated <N> screens for <feature>:
       ✓ <count> recognized — <recipe names, comma-separated>
       ~ <count> adapted — <composition or matchedRecipe names>
       ! <count> improvised — <screen names>

     Confidence: avg <avg-confidence to 2 decimals>
     ```

   - If any screen is tier-3 (improvised), append:

     ```
     Review tier-3 justifications? [yes / skip]
       yes → print full justification text per tier-3 screen
       skip → proceed
     ```

   - If any screen is tier-2 deviation (adapted with `matchedRecipe` set, `composition` null), include those names in the `~ adapted` line and offer to surface their justifications under a separate `show-deviations` option.

   This summary is informational, not a gate. The designer decides whether to act on it.

**Push rules:**
- Each `use_figma` call creates 1-3 nodes max
- Return IDs from every call
- If a call fails, skip and continue
- Do NOT run `flow-to-figma.js` or read `.js` files
