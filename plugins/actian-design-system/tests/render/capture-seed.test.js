var test = require("node:test");
var assert = require("node:assert/strict");
var C = require("../../scripts/render/capture-seed.js");
test("captureButtonMatrix: one self-contained @dsCard doc with all variants + a disabled state", function () {
  var html = C.captureButtonMatrix();
  // group is now registry-derived (button's registry category is "Action",
  // not the hardcoded "Components" the slice-1 bootstrap used); assert the
  // @dsCard marker shape, not a specific category string.
  assert.match(html.split("\n")[0], /^<!-- @dsCard group="[^"]+" -->/);
  assert.ok(
    !/src=|href=|@import/.test(html),
    "must be self-contained (no external refs)",
  );
  [
    "ds-button--primary",
    "ds-button--secondary",
    "ds-button--tertiary",
    "ds-button--critical",
  ].forEach(function (c) {
    assert.ok(html.indexOf(c) >= 0, "missing variant class " + c);
  });
  assert.ok(/is-disabled|disabled/.test(html), "missing disabled state");
  assert.ok(
    !/var\(--zen-[a-z0-9-]+\)(?![^{]*:)/.test(html) ||
      html.indexOf("--zen-") >= 0,
    "tokens present",
  );
});

test("variantMatrix: button derives cells from the registry primary axis + a disabled state", function () {
  var cells = C.variantMatrix("button");
  assert.ok(cells.length >= 2 && cells.length <= 6, "capped cell count");
  // Emphasis is the richest non-Size/State axis (Filled/Outlined/Ghost/Icon-only).
  assert.ok(
    cells.some(function (c) {
      return /Emphasis=Filled/.test(c.variant);
    }),
    "primary axis cell",
  );
  assert.ok(
    cells.some(function (c) {
      return /State=Disabled/.test(c.variant);
    }),
    "disabled state cell",
  );
  cells.forEach(function (c) {
    assert.ok(
      c.props && typeof c.props.Label === "string",
      "each cell carries a Label prop",
    );
  });
});

test("variantMatrix: a slug with no registry variants falls back to a single default cell", function () {
  var cells = C.variantMatrix("__nonexistent-slug__");
  assert.equal(cells.length, 1);
  assert.equal(cells[0].variant, "");
});

test("variantMatrix: text-input (axis named 'States') still yields a disabled cell", function () {
  var cells = C.variantMatrix("text-input");
  assert.ok(
    cells.some(function (c) {
      return /States=Disabled/.test(c.variant);
    }),
    "has a disabled cell",
  );
});

test("variantMatrix: a state-only component (tag-interactive) shows its states, not a bare fallback", function () {
  var cells = C.variantMatrix("tag-interactive");
  assert.ok(cells.length > 1, "more than the single fallback cell");
  assert.ok(
    cells.some(function (c) {
      return /disabled/i.test(c.variant);
    }),
    "includes a disabled state",
  );
});

test("variantMatrix: a tie between two identity axes is broken deterministically (toggle -> Selection)", function () {
  var cells = C.variantMatrix("toggle");
  assert.ok(
    cells.every(function (c) {
      return /^Selection=/.test(c.variant) || c.variant === "";
    }),
    "picks Selection over Toggle position",
  );
});

test("captureMatrix: renders a self-contained @dsCard doc for a non-button slug", function () {
  var html = C.captureMatrix("toggle");
  assert.match(html.split("\n")[0], /^<!-- @dsCard group="[^"]+" -->/);
  assert.ok(!/\ssrc=|\shref=|@import/.test(html), "self-contained");
  assert.ok(
    html.indexOf("ds-toggle") >= 0 || html.indexOf("toggle") >= 0,
    "renders the component",
  );
});

test("captureButtonMatrix still works (alias) and keeps the Components group", function () {
  var html = C.captureButtonMatrix();
  assert.match(html.split("\n")[0], /^<!-- @dsCard group="/);
  ["ds-button--primary", "ds-button--secondary"].forEach(function (c) {
    assert.ok(html.indexOf(c) >= 0, "has " + c);
  });
});
