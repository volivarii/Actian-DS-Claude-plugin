const { test } = require("node:test");
const assert = require("node:assert");

const assemble = require("../../scripts/renderers/assemble-flow-share.js");
const anatomyRender = require("../../scripts/lib/renderer.js").anatomyRender;
const appearanceRender =
  require("../../scripts/lib/renderer.js").appearanceRender;
const { parseVariant } = require("../../scripts/lib/renderer.js").dsHtmlMap;
const specimen = require("../helpers/appearance-specimen.js");

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
//
// #275 (2026-08-12): the SPECIMEN itself rotted the same way a hardcoded slug
// does in tests/helpers/appearance-specimen.js. This test drove
// parseVariant("Color=Purple"); the 2026-08-12 fold-in (knowledge v0.34.124)
// replaced tag-default's `Color` axis (7 values) with a `Type` axis (14
// values: Default, Catalog, Shared, Stage-1..8, Status-error/-warning/
// -success), so "Color=Purple" resolves to nothing against the new data --
// no matching entry in appearance.variants, so resolveNodeAppearance returns
// the base unchanged, and the "must differ from the base appearance"
// precondition below fails. pickColoredVariant() below applies
// appearance-specimen.js's pattern to this problem instead: read the axis
// name and a value straight off the anatomy doc's own appearance.variants
// array (the same structure resolveNodeAppearance itself walks), and pick
// whichever entry's resolved background actually differs from the base. No
// axis name or value is named here, so it is correct whether the doc's axis
// is `Color`, `Type`, or something else entirely next time it is redesigned.

// Pick a `<prop>=<value>` variant string straight from tag-default's own
// anatomy doc rather than naming one. Mirrors pickSpecimen() in
// tests/helpers/appearance-specimen.js: walk real candidates in a
// deterministic order (the array order the anatomy doc itself carries) and
// return the first one that satisfies the caller's predicate, throwing
// loudly -- not silently returning the base -- if none do.
function pickColoredVariant(doc, base) {
  const deltas = (doc.root.appearance && doc.root.appearance.variants) || [];
  for (const entry of deltas) {
    if (!entry || !entry.prop || !Array.isArray(entry.values)) continue;
    for (const value of entry.values) {
      const variantString = `${entry.prop}=${value}`;
      const resolved = appearanceRender.resolveNodeAppearance(
        doc.root,
        parseVariant(variantString),
      );
      if (
        resolved &&
        resolved.background &&
        resolved.background !== base.background
      ) {
        return { variantString, appearance: resolved };
      }
    }
  }
  throw new Error(
    "tag-default's anatomy doc carries no appearance.variants entry whose " +
      "background differs from the base -- this test has no colored " +
      "specimen left; retire or repoint it rather than letting it pass " +
      "vacuously against an empty/uniform population",
  );
}

test("flow-share deliverable: tag-default renders per-variant colors from the appearance layer, keeps its instance label, and never injects a fallback-less var(--token)", () => {
  const doc = anatomyRender.loadAnatomy("tag-default");
  assert.ok(
    doc && doc.root,
    "tag-default anatomy doc must load (precondition)",
  );

  const base = appearanceRender.resolveNodeAppearance(doc.root, null);

  // The axis + value are derived, never named (see pickColoredVariant above
  // and the #275 header note). "Default" is read from the doc's own
  // variantDefaults rather than assumed, for the same reason.
  const { variantString: coloredVariantString, appearance: colored } =
    pickColoredVariant(doc, base);
  const [axisProp] = Object.keys(doc.variantDefaults || {});
  assert.ok(
    axisProp,
    "tag-default's anatomy doc must declare variantDefaults (precondition)",
  );
  const defaultVariantString = `${axisProp}=${doc.variantDefaults[axisProp]}`;
  // The class modifiers the deliverable's ds-tag spans are expected to carry:
  // derived from the SAME values picked above, not a second hardcoded name,
  // so each tracks whichever value its source actually returned.
  //
  // Uses the shared helper rather than re-deriving with .toLowerCase(): the
  // renderer's transform also collapses whitespace to dashes, so a value with a
  // space in it (nothing on today's axis, but "Card format" exists on radio's)
  // would have produced a suffix this file predicted wrongly while
  // appearance-specimen.js predicted it correctly. One transform, one copy.
  const coloredClassSuffix = specimen.variantClassSuffix(
    coloredVariantString.split("=")[1],
  );
  const defaultClassSuffix = specimen.variantClassSuffix(
    defaultVariantString.split("=")[1],
  );

  const defaultVariant = parseVariant(defaultVariantString);

  const def = appearanceRender.resolveNodeAppearance(doc.root, defaultVariant);

  assert.ok(
    colored && colored.background,
    `${coloredVariantString} must resolve a background (precondition)`,
  );
  assert.notStrictEqual(
    colored.background,
    base.background,
    `${coloredVariantString} must differ from the base appearance (precondition: otherwise nothing to inject)`,
  );
  assert.deepStrictEqual(
    def,
    base,
    `${defaultVariantString} must equal the base appearance (precondition: default renders via ds-base.css, no injection)`,
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
            variant: coloredVariantString,
            props: { Label: "Tag" },
          },
          {
            type: "INSTANCE",
            library: "ds",
            dsSlug: "tag-default",
            variant: defaultVariantString,
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
  assert.ok(html.includes("Tag"), "colored tag keeps its instance label");
  assert.ok(
    html.includes("Draft Items"),
    "default tag keeps its instance label",
  );

  // The colored variant's span carries an inline style sourced from the
  // appearance layer: real color VALUES, no token indirection to wash out.
  // Asserted declaration-by-declaration against whatever the appearance layer
  // actually captured, rather than against a fixed background+border shape:
  // the 2026-07-23 tag redesign removed tag borders outright, and hardcoding
  // the old shape is what turned a substrate change into a red vendor PR.
  // The class suffix is the derived value (coloredClassSuffix), not a
  // hardcoded color name -- see the #275 header note.
  // The leading icon span is REQUIRED, not tolerated. This regex used to demand
  // the label immediately after the opening tag, which silently encoded "tags
  // have no icon" and went red when the fold-in made `Leading icon show` a
  // default-TRUE registry boolean.
  //
  // On THIS path the icon is unconditional, so requiring it is the strict
  // reading rather than a lax one. The leaf emits the icon for every Type unless
  // the prop is explicitly false, and the flow nodes below pass only a Label.
  // The capture-driven suppression that DOES hide it for Type=Shared
  // (quality.structuralVariants, childCount 2!=1) lives in knowledge's
  // matrix.js and injects the prop into MATRIX cells only; assemble-flow-share
  // never consults the matrix, so that suppression does not reach the
  // deliverable. knowledge's matrix.js states this as a known limit in its own
  // Scope note: "a hand-authored flow node that names Type=Shared and passes no
  // props still reaches the renderer's default-true branch". See the report note
  // on that gap; it is a substrate limit, not something to paper over here.
  const coloredMatch = html.match(
    new RegExp(
      '<span class="ds-tag ds-tag--' +
        coloredClassSuffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
        '" style="([^"]*)"><span class="ds-tag__icon">[\\s\\S]*?</span>Tag</span>',
    ),
  );
  assert.ok(
    coloredMatch,
    `${coloredVariantString} must render a ds-tag--${coloredClassSuffix} span with an injected inline style, got: ` +
      (html.match(/<span class="ds-tag[^>]*>/g) || []).join(" "),
  );
  const coloredDecls = coloredMatch[1]
    .split(";")
    .map(function (d) {
      return d.trim();
    })
    .filter(Boolean);
  assert.ok(
    coloredDecls.includes("background:" + colored.background),
    `${coloredVariantString}'s span must inject the appearance layer's real background value (` +
      colored.background +
      "), got: " +
      coloredDecls.join(";"),
  );
  if (colored.border && colored.border.color) {
    assert.ok(
      coloredDecls.includes("border-color:" + colored.border.color),
      "the appearance layer captured a border, so the span must inject its real value (" +
        colored.border.color +
        "), got: " +
        coloredDecls.join(";"),
    );
  } else {
    // Fidelity guard, and the reason this branch is an assertion rather than a
    // skip: Figma draws no border on tags any more, so a border in the
    // deliverable would be the renderer inventing one.
    assert.ok(
      !coloredDecls.some(function (d) {
        return d.startsWith("border");
      }),
      "the appearance layer captured no border for tag-default, so the deliverable " +
        "must not invent one, got: " +
        coloredDecls.join(";"),
    );
  }

  // The DEFAULT variant equals the base appearance, so buildDsVariantStyleMap
  // emits no map entry for it: no injected style at all, ds-base.css owns
  // the default pill's background/border.
  //
  // Asserted as "the opening tag carries no attribute beyond its class",
  // rather than as a whole-span string equality. The old equality also pinned
  // the pill's CHILDREN, so when the fold-in made the leading icon default-true
  // this failed claiming an injected style that was never there. Capturing the
  // attribute tail keeps the real subject (no style attr) and stops the
  // assertion from doubling as an accidental icon golden.
  const defaultMatch = html.match(
    new RegExp(
      '<span class="ds-tag ds-tag--' +
        defaultClassSuffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
        '"([^>]*)><span class="ds-tag__icon">[\\s\\S]*?</span>Draft Items</span>',
    ),
  );
  assert.ok(
    defaultMatch,
    `${defaultVariantString} must render a ds-tag--${defaultClassSuffix} span labelled "Draft Items", got: ` +
      (html.match(/<span class="ds-tag[^>]*>/g) || []).join(" "),
  );
  assert.strictEqual(
    defaultMatch[1],
    "",
    `${defaultVariantString}'s ds-tag span must carry NO injected inline style (ds-base.css owns the default), got attributes: ` +
      defaultMatch[1],
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
  // vendored styling source it emitted a color modifier class with no
  // backing rule, because the plugin's own ds-base.css predated phase 1b.
  assert.ok(
    new RegExp(
      "\\.ds-tag--" +
        coloredClassSuffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
        "\\s*\\{",
    ).test(html),
    `the emitted ds-tag--${coloredClassSuffix} class has no rule in the deliverable CSS: ` +
      "FLOW_CSS is not reading the vendored ds-base.css",
  );
});
