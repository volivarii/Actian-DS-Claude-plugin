// tests/renderers/appearance-render.test.js
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var r = require("../../scripts/lib/renderer.js").appearanceRender;

var TAG_STATUS_DOC = {
  slug: "tag-status",
  variantDefaults: { Status: "Fail" },
  root: {
    name: "Status=Fail",
    kind: "container",
    id: "7370:4928",
    layout: {
      axis: "row",
      gap: "4px",
      padding: { top: "0px", right: "8px", bottom: "0px", left: "8px" },
      align: { main: "start", cross: "center" },
    },
    appearance: {
      background: "#fff4ec",
      border: { color: "#ffdacf", width: "1px" },
      radius: "4px",
      variants: [
        {
          prop: "Status",
          values: ["Success"],
          background: "#f0ffec",
          border: { color: "#d3efcd", width: "1px" },
        },
      ],
    },
    children: [
      { name: "misuse--outline", kind: "instance", id: "7370:4929" },
      {
        name: "Tag-Name",
        kind: "text",
        id: "7370:4930",
        text: "Fail",
        appearance: { text: { color: "#50505d", size: "12px", weight: 400 } },
      },
    ],
  },
};

test("resolveNodeAppearance: base when variant is default", function () {
  var ap = r.resolveNodeAppearance(TAG_STATUS_DOC.root, { Status: "Fail" });
  assert.equal(ap.background, "#fff4ec");
  assert.deepEqual(ap.border, { color: "#ffdacf", width: "1px" });
});

test("resolveNodeAppearance: variant delta merges over base", function () {
  var ap = r.resolveNodeAppearance(TAG_STATUS_DOC.root, { Status: "Success" });
  assert.equal(ap.background, "#f0ffec");
  assert.deepEqual(ap.border, { color: "#d3efcd", width: "1px" });
  assert.equal(ap.radius, "4px"); // untouched by the delta
});

test("resolveNodeAppearance: no appearance -> null", function () {
  assert.equal(r.resolveNodeAppearance({ kind: "instance" }, null), null);
});

test("resolveNodeAppearance: color-only border delta preserves base width (C1 deep-merge)", function () {
  var node = {
    kind: "container",
    appearance: {
      border: { color: "#c7c7ce", width: "2px" },
      variants: [
        // delta changes ONLY the color — base width must survive
        { prop: "State", values: ["Selected"], border: { color: "#0f5fdc" } },
      ],
    },
  };
  var ap = r.resolveNodeAppearance(node, { State: "Selected" });
  assert.deepEqual(ap.border, { color: "#0f5fdc", width: "2px" });
});

test("resolveNodeAppearance: color-only text delta preserves base size/weight (C1 deep-merge)", function () {
  var node = {
    kind: "text",
    appearance: {
      text: { color: "#50505d", size: "12px", weight: 400 },
      variants: [
        { prop: "State", values: ["Selected"], text: { color: "#ffffff" } },
      ],
    },
  };
  var ap = r.resolveNodeAppearance(node, { State: "Selected" });
  assert.deepEqual(ap.text, { color: "#ffffff", size: "12px", weight: 400 });
});

test("resolveNodeAppearance: null border delta still replaces wholesale (C1)", function () {
  var node = {
    kind: "container",
    appearance: {
      border: { color: "#c7c7ce", width: "1px" },
      variants: [{ prop: "State", values: ["Bare"], border: null }],
    },
  };
  var ap = r.resolveNodeAppearance(node, { State: "Bare" });
  assert.equal(ap.border, null);
});

test("renderAppearanceComponent: default variant emits base colors, escapes, recurses", function () {
  var html = r.renderAppearanceComponent(TAG_STATUS_DOC, {
    variant: { Status: "Fail" },
  });
  assert.match(html, /data-ds-slug="tag-status"/);
  assert.match(html, /background:#fff4ec/);
  assert.match(html, /border:1px solid #ffdacf/);
  assert.match(html, /border-radius:4px/);
  assert.match(html, /<span class="ds-appearance__text"[^>]*>Fail<\/span>/);
  assert.match(html, /color:#50505d/);
  assert.match(html, /display:flex/); // layout preserved
});

test("renderAppearanceComponent: Success variant recolors the root", function () {
  var html = r.renderAppearanceComponent(TAG_STATUS_DOC, {
    variant: { Status: "Success" },
  });
  assert.match(html, /background:#f0ffec/);
  assert.doesNotMatch(html, /background:#fff4ec/);
});

test("renderAppearanceComponent: missing root -> empty string", function () {
  assert.equal(r.renderAppearanceComponent({ slug: "x" }, {}), "");
  assert.equal(r.renderAppearanceComponent(null, {}), "");
});

// ---------------------------------------------------------------------------
// F2 — real icon glyphs. Anatomy docs emit real glyph nodes as
// kind:"instance" with a non-null `slug` (never kind:"icon"/"image"; see
// appearance-render.js's C2 comment). Tests inject opts.iconMap directly
// (rather than fighting Node's always-defined `require`) to exercise every
// resolution outcome deterministically — see the "icon map absent entirely"
// test below for why this is the faithful stand-in for "simulated browser
// without window.dsIcons".
// ---------------------------------------------------------------------------
var ICON_MAP = {
  "misuse-outline": {
    viewBox: "0 0 48 48",
    body: '<path fill="currentColor" d="M1 1"/>',
  },
};

test("renderAppearanceNode: resolved instance slug emits real svg glyph (no background/border/radius decl)", function () {
  var node = { kind: "instance", slug: "misuse-outline" };
  var html = r.renderAppearanceNode(node, null, { iconMap: ICON_MAP });
  assert.equal(
    html,
    '<svg class="ds-icon" viewBox="0 0 48 48" aria-hidden="true">' +
      '<path fill="currentColor" d="M1 1"/></svg>',
  );
  assert.doesNotMatch(html, /background:|border:|border-radius:/);
});

test("renderAppearanceNode: kind icon with resolvable slug also emits real svg glyph (mirrors instance-kind acceptance)", function () {
  var node = { kind: "icon", slug: "misuse-outline" };
  var html = r.renderAppearanceNode(node, null, { iconMap: ICON_MAP });
  assert.equal(
    html,
    '<svg class="ds-icon" viewBox="0 0 48 48" aria-hidden="true">' +
      '<path fill="currentColor" d="M1 1"/></svg>',
  );
});

test("renderAppearanceNode: icon color prefers resolved text.color", function () {
  var node = {
    kind: "instance",
    slug: "misuse-outline",
    appearance: { background: "#fff4ec", text: { color: "#50505d" } },
  };
  var html = r.renderAppearanceNode(node, null, { iconMap: ICON_MAP });
  assert.match(html, /<svg class="ds-icon" style="color:#50505d"/);
});

test("renderAppearanceNode: icon color never falls back to background (instance root surface fill, not glyph color) -> no style attr", function () {
  var node = {
    kind: "instance",
    slug: "misuse-outline",
    appearance: { background: "#fff4ec" },
  };
  var html = r.renderAppearanceNode(node, null, { iconMap: ICON_MAP });
  assert.equal(
    html,
    '<svg class="ds-icon" viewBox="0 0 48 48" aria-hidden="true">' +
      '<path fill="currentColor" d="M1 1"/></svg>',
  );
  assert.doesNotMatch(html, /style=/);
});

test("renderAppearanceNode: unknown slug (not in icon map) -> placeholder unchanged", function () {
  var node = { kind: "instance", slug: "definitely-not-an-icon" };
  var html = r.renderAppearanceNode(node, null, { iconMap: ICON_MAP });
  assert.equal(html, '<div class="ds-appearance__instance"></div>');
});

test("renderAppearanceNode: null slug -> placeholder unchanged", function () {
  var node = { kind: "instance", slug: null };
  var html = r.renderAppearanceNode(node, null, { iconMap: ICON_MAP });
  assert.equal(html, '<div class="ds-appearance__instance"></div>');
});

test("renderAppearanceNode: absent slug -> placeholder unchanged (byte-identical to pre-F2)", function () {
  var node = { kind: "instance", id: "7370:4929" };
  var html = r.renderAppearanceNode(node, null, { iconMap: ICON_MAP });
  assert.equal(html, '<div class="ds-appearance__instance"></div>');
});

// Per-variant icon slug swaps (knowledge #354): the anatomy variant delta may
// carry a `slug` field so each variant renders its OWN glyph instead of the
// default variant's (the Success-tag-shows-Fail-icon defect).
var SWAP_ICON_MAP = {
  "misuse-outline": {
    viewBox: "0 0 48 48",
    body: '<path fill="currentColor" d="M1 1"/>',
  },
  "check-outline": {
    viewBox: "0 0 48 48",
    body: '<path fill="currentColor" d="M2 2"/>',
  },
};

function swapNode() {
  return {
    kind: "instance",
    slug: "misuse-outline",
    appearance: {
      variants: [
        { prop: "Status", values: ["Success"], slug: "check-outline" },
      ],
    },
  };
}

test("resolveNodeAppearance: matching slug delta rides the merge", function () {
  var ap = r.resolveNodeAppearance(swapNode(), { Status: "Success" });
  assert.equal(ap.slug, "check-outline");
});

test("resolveNodeAppearance: non-matching variant leaves slug absent", function () {
  var ap = r.resolveNodeAppearance(swapNode(), { Status: "Fail" });
  assert.equal(ap.slug, undefined);
});

test("renderAppearanceNode: matching variant renders the swapped glyph", function () {
  var html = r.renderAppearanceNode(
    swapNode(),
    { Status: "Success" },
    { iconMap: SWAP_ICON_MAP },
  );
  assert.match(html, /d="M2 2"/); // check-outline's body, not misuse-outline's
  assert.doesNotMatch(html, /d="M1 1"/);
});

test("renderAppearanceNode: no variant -> base glyph unchanged", function () {
  var html = r.renderAppearanceNode(swapNode(), null, {
    iconMap: SWAP_ICON_MAP,
  });
  assert.match(html, /d="M1 1"/);
});

test("renderAppearanceNode: swapped slug missing from the icon map -> placeholder, never a wrong glyph", function () {
  var html = r.renderAppearanceNode(
    swapNode(),
    { Status: "Success" },
    { iconMap: { "misuse-outline": SWAP_ICON_MAP["misuse-outline"] } },
  );
  assert.equal(html, '<div class="ds-appearance__instance"></div>');
});

test("renderAppearanceNode: slug delta never leaks into a style attribute", function () {
  var node = swapNode();
  node.appearance.text = { color: "#50505d" };
  var html = r.renderAppearanceNode(
    node,
    { Status: "Success" },
    { iconMap: SWAP_ICON_MAP },
  );
  assert.match(html, /style="color:#50505d"/);
  assert.doesNotMatch(html, /style="[^"]*slug/);
});

test("renderAppearanceNode: icon map absent entirely (simulated browser without window.dsIcons) -> unchanged placeholder, no throw", function () {
  var node = { kind: "instance", slug: "misuse-outline" };
  var html;
  assert.doesNotThrow(function () {
    html = r.renderAppearanceNode(node, null, { iconMap: null });
  });
  assert.equal(html, '<div class="ds-appearance__instance"></div>');
});

test("renderAppearanceNode: malformed icon map entry (missing viewBox/body) -> never throws, falls through", function () {
  var node = { kind: "instance", slug: "broken" };
  var html;
  assert.doesNotThrow(function () {
    html = r.renderAppearanceNode(node, null, {
      iconMap: { broken: { viewBox: null } },
    });
  });
  assert.equal(html, '<div class="ds-appearance__instance"></div>');
});

test("renderAppearanceNode: kind vector NEVER attempts slug resolution even if slug-like data is present", function () {
  var node = { kind: "vector", slug: "misuse-outline" };
  var html = r.renderAppearanceNode(node, null, { iconMap: ICON_MAP });
  assert.equal(
    html,
    '<div class="ds-appearance__vector" aria-hidden="true"></div>',
  );
});

test("renderAppearanceComponent: default dsIcons resolution (no injected opts.iconMap) resolves a real vendored glyph end-to-end", function () {
  // THIS IS THE SOLE SENTINEL for the appearance-render icon injection in
  // scripts/lib/renderer.js. Mutation-verified: remove that injection and this
  // is the ONE test in the whole suite that fails.
  //
  // It does NOT exercise the module's own dual-source default, despite what an
  // earlier version of this comment claimed. That default CANNOT resolve from
  // the vendored layout (its Node branch walks to a lib/paths with no
  // counterpart there) and it degrades to {} inside a try/catch, which is the
  // exact silent failure the injection exists to close. This test requires the
  // module through scripts/lib/renderer.js, so what it actually proves is that
  // the plugin's injection is wired and resolves a real vendored glyph.
  //
  // The glyph is picked FROM the vendored set rather than hardcoded. This test
  // is about the resolution mechanism, not about any one icon; naming a slug
  // couples it to the DS icon library's churn. It used to hardcode
  // `misuse-outline`, which the 2026-07 Figma icon rework deleted, so this
  // failed for a reason that had nothing to do with what it tests.
  var icons = require("../../vendor/components/dist/icons/icons.json").icons;
  var someRealSlug = Object.keys(icons).sort()[0];
  assert.ok(
    someRealSlug,
    "vendored icons.json is empty, so there is nothing to resolve",
  );

  var doc = {
    slug: "icon-e2e-fixture",
    root: {
      kind: "container",
      children: [{ kind: "instance", slug: someRealSlug }],
    },
  };
  var html = r.renderAppearanceComponent(doc, {});
  assert.match(
    html,
    /<svg class="ds-icon"/,
    "failed to resolve '" + someRealSlug + "' from the vendored icon set",
  );
  // Assert it resolved to the RIGHT glyph, not merely to some glyph: a lookup
  // bug that returned the wrong icon would still emit an <svg class="ds-icon">.
  assert.ok(
    html.indexOf(icons[someRealSlug].body) !== -1,
    "resolved a glyph, but not the body of '" + someRealSlug + "'",
  );
});

test("renderAppearanceComponent: escapes HTML special characters in text nodes", function () {
  var doc = {
    slug: "escape-test",
    variantDefaults: {},
    root: {
      name: "EscapeTest",
      kind: "container",
      id: "test:001",
      layout: {
        axis: "row",
        gap: "0px",
        padding: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
        align: { main: "start", cross: "start" },
      },
      children: [
        {
          name: "TextWithEscapes",
          kind: "text",
          id: "test:002",
          text: 'a & b < c > d "e"',
          appearance: { text: { color: "#000000", size: "14px", weight: 400 } },
        },
      ],
    },
  };
  var html = r.renderAppearanceComponent(doc, {});
  // Assert escaped forms are present
  assert.match(html, /a &amp; b &lt; c &gt; d &quot;e&quot;/);
  // Assert raw unescaped angle bracket from text content is NOT present
  // (but &lt; and &gt; should be)
  assert.doesNotMatch(html, />\s*a & b < c >/);
});

// ─── P2 name layer: token bindings flow through resolveNodeAppearance ────────
// backgroundToken is a TOP-LEVEL sibling of background (a scalar), so it must
// be in APPEARANCE_KEYS to survive base-copy + variant-delta merge. border and
// text carry their colorToken nested inside the object, so they ride through
// the existing deep-merge — but the whole point is the emit downstream sees
// them, so these tests pin the flow end to end.
var P2_TOKEN_DOC = {
  slug: "banner",
  variantDefaults: { Type: "Default" },
  root: {
    name: "Type=Default",
    kind: "container",
    appearance: {
      background: "#ffffff",
      backgroundToken: "--zen-color-bg-default",
      border: {
        color: "#e1e1e6",
        colorToken: "--zen-color-border-default",
        width: "1px",
      },
      text: {
        color: "#50505d",
        colorToken: "--zen-color-text-secondary",
        size: "12px",
      },
      variants: [
        {
          prop: "Type",
          values: ["Selected"],
          background: "#f3f5f9",
          backgroundToken: "--zen-color-bg-selected",
        },
        {
          prop: "Type",
          // A variant whose fill is not token-bound: the base token is removed
          // (null) so the value rides alone, never a stale name over a new value.
          values: ["Plain"],
          background: "#fafafa",
          backgroundToken: null,
        },
      ],
    },
    children: [],
  },
};

test("resolveNodeAppearance: base carries backgroundToken + nested colorTokens", function () {
  var ap = r.resolveNodeAppearance(P2_TOKEN_DOC.root, { Type: "Default" });
  assert.equal(ap.backgroundToken, "--zen-color-bg-default");
  assert.equal(ap.border.colorToken, "--zen-color-border-default");
  assert.equal(ap.text.colorToken, "--zen-color-text-secondary");
});

test("resolveNodeAppearance: a variant delta's backgroundToken merges over base", function () {
  var ap = r.resolveNodeAppearance(P2_TOKEN_DOC.root, { Type: "Selected" });
  assert.equal(ap.background, "#f3f5f9");
  assert.equal(ap.backgroundToken, "--zen-color-bg-selected");
});

test("resolveNodeAppearance: a null delta backgroundToken removes the base binding", function () {
  var ap = r.resolveNodeAppearance(P2_TOKEN_DOC.root, { Type: "Plain" });
  assert.equal(ap.background, "#fafafa");
  assert.equal(ap.backgroundToken, null);
});

test("renderAppearanceComponent: emits var(--token, value) end to end", function () {
  var html = r.renderAppearanceComponent(P2_TOKEN_DOC, {
    variant: { Type: "Default" },
  });
  assert.match(html, /background:var\(--zen-color-bg-default, #ffffff\)/);
  assert.match(
    html,
    /border:1px solid var\(--zen-color-border-default, #e1e1e6\)/,
  );
});

// A nested colorToken pairs with its OWN color. The knowledge diffAppearance
// emits the whole border/text object per variant but sets colorToken only when
// that variant's slot is variable-bound (it never emits colorToken:null inside
// the object, unlike the top-level backgroundToken scalar). So a variant that
// recolors a base-tokened border/text with an UNBOUND value ships a delta with
// color but no colorToken — the base token must NOT survive the merge and theme
// the variant's different color to the base color.
var P2_STALE_TOKEN_DOC = {
  slug: "field",
  variantDefaults: { State: "Default" },
  root: {
    name: "State=Default",
    kind: "container",
    appearance: {
      border: {
        color: "#0f5fdc",
        colorToken: "--zen-color-primary-500",
        width: "1px",
      },
      text: {
        color: "#0f5fdc",
        colorToken: "--zen-color-primary-500",
        size: "12px",
      },
      variants: [
        // Error: hardcoded red, not token-bound -> delta omits colorToken.
        {
          prop: "State",
          values: ["Error"],
          border: { color: "#dc3514", width: "1px" },
          text: { color: "#dc3514", size: "12px" },
        },
        // Focus: re-bound to a DIFFERENT token -> delta carries its own token.
        {
          prop: "State",
          values: ["Focus"],
          border: {
            color: "#0283be",
            colorToken: "--zen-color-info-500",
            width: "1px",
          },
        },
      ],
    },
    children: [],
  },
};

test("resolveNodeAppearance: an unbound variant color clears the stale base border colorToken", function () {
  var ap = r.resolveNodeAppearance(P2_STALE_TOKEN_DOC.root, { State: "Error" });
  assert.equal(ap.border.color, "#dc3514");
  assert.equal(ap.border.colorToken, undefined); // NOT the base primary-500
  assert.equal(ap.border.width, "1px"); // base sub-key still preserved (C1)
  assert.equal(ap.text.color, "#dc3514");
  assert.equal(ap.text.colorToken, undefined);
  assert.equal(ap.text.size, "12px");
});

test("resolveNodeAppearance: a re-bound variant color uses the variant's own token", function () {
  var ap = r.resolveNodeAppearance(P2_STALE_TOKEN_DOC.root, { State: "Focus" });
  assert.equal(ap.border.color, "#0283be");
  assert.equal(ap.border.colorToken, "--zen-color-info-500");
});

test("renderAppearanceComponent: an unbound variant emits value-only, never the base token", function () {
  var html = r.renderAppearanceComponent(P2_STALE_TOKEN_DOC, {
    variant: { State: "Error" },
  });
  assert.match(html, /border:1px solid #dc3514/);
  assert.doesNotMatch(html, /--zen-color-primary-500/); // no stale base token
});

test("renderAppearanceNode: a resolved icon glyph rides its text colorToken end to end", function () {
  // Exercises renderIconGlyph -> iconColorDecl -> tokenized (the P2 emit) on
  // the real glyph path, not just the iconColorDecl unit.
  var node = {
    kind: "instance",
    slug: "misuse-outline",
    appearance: {
      text: { color: "#50505d", colorToken: "--zen-color-text-secondary" },
    },
  };
  var html = r.renderAppearanceNode(node, null, { iconMap: ICON_MAP });
  assert.match(
    html,
    /<svg class="ds-icon" style="color:var\(--zen-color-text-secondary, #50505d\)"/,
  );
});

// A color-less (size/weight-only) text delta: the variant text node has no
// SOLID fill of its own, so diffAppearance emits {size} with NO color and NO
// colorToken. The deep-merge preserves the BASE color, whose base token still
// validly pairs with it — the token must NOT be dropped. So the stale-clear
// must key on whether the delta RE-SPECIFIES color, not merely on colorToken
// being absent (border color is always present; text color is conditional).
test("resolveNodeAppearance: a color-less size-only text delta keeps the base colorToken", function () {
  var node = {
    kind: "text",
    appearance: {
      text: {
        color: "#0f5fdc",
        colorToken: "--zen-color-primary-500",
        size: "12px",
      },
      variants: [{ prop: "Size", values: ["Large"], text: { size: "16px" } }],
    },
  };
  var ap = r.resolveNodeAppearance(node, { Size: "Large" });
  assert.equal(ap.text.color, "#0f5fdc");
  assert.equal(ap.text.colorToken, "--zen-color-primary-500"); // color unchanged -> token stays
  assert.equal(ap.text.size, "16px");
});

// Residual of the SAME class on the top-level backgroundToken scalar. A
// multi-axis render where an earlier-sorted axis binds background to a token
// and a later axis recolors it UNBOUND: diffAppearance omits backgroundToken
// from the unbound delta (its token equals the base's absent token), so the
// scalar path must clear the stranded token the way the nested path does.
var P2_SCALAR_STRAND_DOC = {
  slug: "chip",
  variantDefaults: { Emphasis: "Default", State: "Default" },
  root: {
    name: "Emphasis=Default, State=Default",
    kind: "container",
    appearance: {
      background: "#ffffff", // base UNBOUND
      variants: [
        {
          prop: "Emphasis",
          values: ["Strong"],
          background: "#0050c8",
          backgroundToken: "--zen-color-primary-500",
        },
        { prop: "State", values: ["Error"], background: "#dc3514" }, // unbound recolor
      ],
    },
    children: [],
  },
};

test("resolveNodeAppearance: a later unbound background delta clears an earlier axis's stranded backgroundToken", function () {
  var ap = r.resolveNodeAppearance(P2_SCALAR_STRAND_DOC.root, {
    Emphasis: "Strong",
    State: "Error",
  });
  assert.equal(ap.background, "#dc3514");
  assert.equal(ap.backgroundToken, undefined); // NOT primary-500 from the Emphasis axis
});

test("resolveNodeAppearance: a later BOUND background delta keeps its own token (multi-axis)", function () {
  var doc = {
    kind: "container",
    appearance: {
      background: "#ffffff",
      variants: [
        {
          prop: "Emphasis",
          values: ["Strong"],
          background: "#0050c8",
          backgroundToken: "--zen-color-primary-500",
        },
        {
          prop: "State",
          values: ["Info"],
          background: "#0283be",
          backgroundToken: "--zen-color-info-500",
        },
      ],
    },
  };
  var ap = r.resolveNodeAppearance(doc, { Emphasis: "Strong", State: "Info" });
  assert.equal(ap.background, "#0283be");
  assert.equal(ap.backgroundToken, "--zen-color-info-500");
});

test("renderAppearanceComponent: multi-axis unbound background emits value-only, no stranded token", function () {
  var html = r.renderAppearanceComponent(P2_SCALAR_STRAND_DOC, {
    variant: { Emphasis: "Strong", State: "Error" },
  });
  assert.match(html, /background:#dc3514/);
  assert.doesNotMatch(html, /--zen-color-primary-500/);
});

// ─── P2 layout tokens: gap/padding ride as var(--token, value) ──────────────
// The knowledge layout capture (its #357) stores layout.gapToken beside
// layout.gap and layout.paddingTokens per bound side beside layout.padding.
// flexStyle var-wraps them (value = fallback), value-only otherwise — the same
// tokenized() the color emit uses, so a bare token name is never emitted.
test("flexStyle: gap + padding ride their layout tokens as var(--token, value)", function () {
  var doc = {
    slug: "card",
    root: {
      name: "Card",
      kind: "container",
      layout: {
        axis: "row",
        gap: "8px",
        gapToken: "--zen-spacing-xs",
        padding: { top: "16px", right: "8px", bottom: "16px", left: "8px" },
        paddingTokens: { right: "--zen-spacing-sm", left: "--zen-spacing-sm" },
        align: { main: "start", cross: "center" },
      },
      children: [],
    },
  };
  var html = r.renderAppearanceComponent(doc, {});
  assert.match(html, /gap:var\(--zen-spacing-xs, 8px\)/);
  // per-side var-wrap in the padding shorthand (top/bottom unbound = raw value)
  assert.match(
    html,
    /padding:16px var\(--zen-spacing-sm, 8px\) 16px var\(--zen-spacing-sm, 8px\)/,
  );
});

test("flexStyle: no layout tokens -> value-only gap/padding (byte-identical to today)", function () {
  var doc = {
    slug: "card",
    root: {
      name: "Card",
      kind: "container",
      layout: {
        axis: "column",
        gap: "4px",
        padding: { top: "0", right: "0", bottom: "0", left: "0" },
        align: { main: "start", cross: "start" },
      },
      children: [],
    },
  };
  var html = r.renderAppearanceComponent(doc, {});
  assert.match(html, /gap:4px/);
  assert.match(html, /padding:0 0 0 0/);
  assert.doesNotMatch(html, /var\(/);
});
