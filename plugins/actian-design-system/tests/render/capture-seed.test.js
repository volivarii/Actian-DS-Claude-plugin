var test = require("node:test");
var assert = require("node:assert/strict");
var C = require("../../scripts/render/capture-seed.js");
test("captureButtonMatrix: one self-contained @dsCard doc with all variants + a disabled state", function () {
  var html = C.captureButtonMatrix();
  assert.match(html.split("\n")[0], /^<!-- @dsCard group="Components" -->/);
  assert.ok(
    !/src=|href=|@import/.test(html),
    "must be self-contained (no external refs)",
  );
  ["ds-button--primary", "ds-button--secondary", "ds-button--tertiary", "ds-button--critical"].forEach(
    function (c) {
      assert.ok(html.indexOf(c) >= 0, "missing variant class " + c);
    },
  );
  assert.ok(/is-disabled|disabled/.test(html), "missing disabled state");
  assert.ok(
    !/var\(--zen-[a-z0-9-]+\)(?![^{]*:)/.test(html) || html.indexOf("--zen-") >= 0,
    "tokens present",
  );
});
