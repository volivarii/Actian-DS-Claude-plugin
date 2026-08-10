const { test } = require("node:test");
const assert = require("node:assert");

const assemble = require("../../scripts/renderers/assemble-flow-share.js");
const anatomyRender = require("../../scripts/lib/renderer.js").anatomyRender;
const appearanceRender =
  require("../../scripts/lib/renderer.js").appearanceRender;
const { parseVariant } = require("../../scripts/lib/renderer.js").dsHtmlMap;

// flow-share-variant-tag-deliverable.test.js -- proves the flow-share HTML
// deliverable renders tag-default's per-variant colors from the appearance
// layer (Task A2 re-sourced buildDsVariantStyleMap onto resolveNodeAppearance
// + variantColorDecls), not the retired path-b token-injection chain
// (resolveRootTokenStyle / the vendored token-bindings sidecar join, deleted
// in Task A4). That retired chain emitted bare, mostly-unresolved
// var(--zen-*) declarations with no value fallback ("the washout bug"): tags
// rendered transparent or collapsed because tokens.css never defined most of
// those vars. The appearance layer instead emits a real color VALUE (a hex,
// pulled straight off the anatomy doc's captured Figma fill) with no token
// wrapper at all for this component today, so there is nothing left to
// silently fail to resolve.
//
// Real-data-first: the expected colors below are derived independently, at
// test time, from resolveNodeAppearance against the real vendored
// tag-default anatomy doc -- no hardcoded hex, no fixtures -- then compared
// against what assemble-flow-share actually renders. A dedicated regression
// guard also asserts no ds-tag span ever injects a fallback-less
// var(--token) (the exact shape of the bug this whole effort fixes).

//
// UPDATED at renderer-relocation phase 2. The plugin now renders through the
// renderer knowledge owns, so tag-default additionally emits a `ds-tag--<color>`
// class (phase 1b), backed by a real rule in the vendored ds-base.css. The
// inline appearance VALUES are unchanged and still asserted below; the class is
// additive. Every original guarantee is kept, and the new final assertion
// checks the thing that was impossible before: the emitted colour class
// actually resolves to a rule in the deliverable, rather than dangling.
//
// UPDATED again for the 2026-07-23 tag redesign (knowledge v0.34.120). Figma
// removed the border from tags: tag-default's captured root appearance is now
// `{background, radius}` and each of its 7 Color variants carries a background
// only. The renderer and the vendored ds-base.css both followed correctly, and
// this test was the only thing left demanding a border, which is what held the
// v0.34.122 vendor PR red for 15 nights.
//
// The lesson is in the file header above: "real-data-first ... no hardcoded
// hex". The colour VALUES honoured that, but the SHAPE around them
// (background + border, always) did not, so a legitimate substrate change read
// as a failure. The border is now asserted only when the appearance layer
// carries one, and its absence is asserted too: if the substrate has no border,
// the deliverable must not invent one. That turns the stale expectation into a
// fidelity guard that can fail in both directions.

test("flow-share deliverable: tag-default renders per-variant colors from the appearance layer, keeps its instance label, and never injects a fallback-less var(--token)", () => {
  const doc = anatomyRender.loadAnatomy("tag-default");
  assert.ok(
    doc && doc.root,
    "tag-default anatomy doc must load (precondition)",
  );

  const purpleVariant = parseVariant("Color=Purple");
  const defaultVariant = parseVariant("Color=Default");

  const base = appearanceRender.resolveNodeAppearance(doc.root, null);
  const purple = appearanceRender.resolveNodeAppearance(
    doc.root,
    purpleVariant,
  );
  const def = appearanceRender.resolveNodeAppearance(doc.root, defaultVariant);

  assert.ok(
    purple && purple.background,
    "Color=Purple must resolve a background (precondition)",
  );
  assert.notStrictEqual(
    purple.background,
    base.background,
    "Color=Purple must differ from the base appearance (precondition: otherwise nothing to inject)",
  );
  assert.deepStrictEqual(
    def,
    base,
    "Color=Default must equal the base appearance (precondition: default renders via ds-base.css, no injection)",
  );

  const flow = {
    meta: { library: "ds" },
    screens: [
      {
        name: "S1",
        content: [
          {
            type: "INSTANCE",
            library: "ds",
            dsSlug: "tag-default",
            variant: "Color=Purple",
            props: { Label: "Tag" },
          },
          {
            type: "INSTANCE",
            library: "ds",
            dsSlug: "tag-default",
            variant: "Color=Default",
            props: { Label: "Draft Items" },
          },
        ],
      },
    ],
  };

  // assemble-flow-share.js exports { assembleFlowShare(data) } -> full HTML string.
  const html = assemble.assembleFlowShare(flow);

  assert.ok(
    html.includes('class="ds-tag ds-tag--'),
    "renders the hand-authored ds-tag span, not anatomy divs",
  );
  assert.ok(html.includes("Tag"), "Purple tag keeps its instance label");
  assert.ok(
    html.includes("Draft Items"),
    "Default tag keeps its instance label",
  );

  // The colored variant's span carries an inline style sourced from the
  // appearance layer: real color VALUES, no token indirection to wash out.
  // Asserted declaration-by-declaration against whatever the appearance layer
  // actually captured, rather than against a fixed background+border shape:
  // the 2026-07-23 tag redesign removed tag borders outright, and hardcoding
  // the old shape is what turned a substrate change into a red vendor PR.
  const purpleMatch = html.match(
    /<span class="ds-tag ds-tag--purple" style="([^"]*)">Tag<\/span>/,
  );
  assert.ok(
    purpleMatch,
    "Color=Purple must render a ds-tag--purple span with an injected inline style, got: " +
      (html.match(/<span class="ds-tag[^>]*>/g) || []).join(" "),
  );
  const purpleDecls = purpleMatch[1]
    .split(";")
    .map(function (d) {
      return d.trim();
    })
    .filter(Boolean);
  assert.ok(
    purpleDecls.includes("background:" + purple.background),
    "Color=Purple's span must inject the appearance layer's real background value (" +
      purple.background +
      "), got: " +
      purpleDecls.join(";"),
  );
  if (purple.border && purple.border.color) {
    assert.ok(
      purpleDecls.includes("border-color:" + purple.border.color),
      "the appearance layer captured a border, so the span must inject its real value (" +
        purple.border.color +
        "), got: " +
        purpleDecls.join(";"),
    );
  } else {
    // Fidelity guard, and the reason this branch is an assertion rather than a
    // skip: Figma draws no border on tags any more, so a border in the
    // deliverable would be the renderer inventing one.
    assert.ok(
      !purpleDecls.some(function (d) {
        return d.startsWith("border");
      }),
      "the appearance layer captured no border for tag-default, so the deliverable " +
        "must not invent one, got: " +
        purpleDecls.join(";"),
    );
  }

  // The DEFAULT variant equals the base appearance, so buildDsVariantStyleMap
  // emits no map entry for it: no injected style at all, ds-base.css owns
  // the default pill's background/border.
  const defaultSpan = '<span class="ds-tag ds-tag--default">Draft Items</span>';
  assert.ok(
    html.includes(defaultSpan),
    "Color=Default's ds-tag span must carry NO injected inline style (ds-base.css owns the default), got no match for: " +
      defaultSpan,
  );

  // Regression guard: no ds-tag span, of any variant, may ever inject a
  // fallback-less var(--token) -- that bare-token shape is exactly what
  // rendered most tag-default variants transparent/collapsed under path b.
  const tagSpanOpenTags = html.match(/<span class="ds-tag[^"]*"[^>]*>/g) || [];
  assert.ok(
    tagSpanOpenTags.length >= 2,
    "expected at least 2 ds-tag opening tags in the rendered flow, found " +
      tagSpanOpenTags.length,
  );
  const bareVarRe = /var\(\s*--[A-Za-z0-9-]+\s*\)/;
  tagSpanOpenTags.forEach(function (tag) {
    assert.ok(
      !bareVarRe.test(tag),
      "ds-tag span must never inject a fallback-less var(--token): " + tag,
    );
  });

  // Phase 2: the colour class must not dangle. Before the plugin consumed the
  // vendored styling source it emitted ds-tag--purple with no backing rule,
  // because the plugin's own ds-base.css predated phase 1b.
  assert.ok(
    /\.ds-tag--purple\s*\{/.test(html),
    "the emitted ds-tag--purple class has no rule in the deliverable CSS: " +
      "FLOW_CSS is not reading the vendored ds-base.css",
  );
});
