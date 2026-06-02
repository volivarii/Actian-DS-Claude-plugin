"use strict";

// Drift-guard: the plugin's vendor-snapshot is a thin entry over a COPIED core
// (scripts/vendor/vendor-snapshot-core.js). A build tool must not import the
// bundle it produces (bootstrap + safety), so instead of importing the vendored
// canonical we copy it and assert byte-identity here. If a vendor refresh
// changes the canonical, this fails until the copy is re-synced:
//   cp vendor/clients/vendor-snapshot.js scripts/vendor/vendor-snapshot-core.js
// See vendor/clients/README.md (shared consumption client).

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const PLUGIN_ROOT = path.join(__dirname, "..", "..");
const COPIED = path.join(PLUGIN_ROOT, "scripts", "vendor", "vendor-snapshot-core.js");
const CANONICAL = path.join(PLUGIN_ROOT, "vendor", "clients", "vendor-snapshot.js");

test("vendor-snapshot-core.js is byte-identical to the vendored canonical", function () {
  assert.equal(
    fs.readFileSync(COPIED, "utf8"),
    fs.readFileSync(CANONICAL, "utf8"),
    "scripts/vendor/vendor-snapshot-core.js drifted from vendor/clients/vendor-snapshot.js — re-copy it.",
  );
});
