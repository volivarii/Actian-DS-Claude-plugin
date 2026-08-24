"use strict";

// The ledger's reference.media field exists so a row can never disagree with what
// was actually compared. When no oracle is on disk the pixel gate skips, and the
// row must not name a reference file: since #310 the plugin ships no .webp
// oracles at all, so a hardcoded fallback would make every row and every CI
// artifact cite a file that is not there.

var test = require("node:test");
var assert = require("node:assert/strict");
var RF = require("../../scripts/fidelity/run-fidelity.js");

test("ledgerRow names no reference media when nothing was compared", function () {
  var row = RF.ledgerRow(
    "button",
    { pass: null, skipped: "no-oracle" },
    { pass: true },
    null,
  );

  assert.deepEqual(row.reference.media, []);
});

test("ledgerRow names the oracle it actually compared against", function () {
  var row = RF.ledgerRow(
    "button",
    { pass: true },
    { pass: true },
    "/somewhere/vendor/components/dist/media/button/default.webp",
  );

  assert.deepEqual(row.reference.media, [
    "components/dist/media/button/default.webp",
  ]);
});
