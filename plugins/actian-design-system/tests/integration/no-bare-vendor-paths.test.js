"use strict";

// Architectural decay guard: forbid hardcoded vendor/ paths in plugin
// scripts. Every vendor read must go through scripts/lib/paths.js, which
// reads vendor/paths-manifest.json at module load. Bypassing that defeats
// the indirection layer and reintroduces tight coupling to upstream's
// physical layout.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const PLUGIN_DIR = path.resolve(__dirname, "..", "..");

// Files allowed to reference 'vendor/' directly. paths.js IS the indirection
// layer (it must reference vendor/), and vendor-snapshot.js writes TO vendor/.
const ALLOWLIST = new Set([
  "scripts/lib/paths.js",
  "scripts/vendor/vendor-snapshot.js",
]);
// NOTE: walk() below skips any dir named "vendor" (see name === "vendor"), so
// scripts/vendor/ is not scanned at all — both the entry above and the copied
// vendor-snapshot-core.js are effectively unscanned here. The core stays
// path-clean by being a byte-identical copy of the substrate's parameterized
// canonical (no bare vendor paths by design), enforced by the drift-guard test.

// Patterns that indicate a "bare vendor path" — references that should
// route through PATHS but don't.
const BARE_PATTERNS = [
  /path\.join\([^)]*?,\s*["']vendor["']/,
  /["']vendor\/[^"']+["']/,
];

function walk(dir, results) {
  const entries = fs.readdirSync(dir);
  for (const name of entries) {
    if (name === "node_modules" || name === "vendor" || name.startsWith(".")) {
      continue;
    }
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, results);
    } else if (name.endsWith(".js")) {
      const rel = path.relative(PLUGIN_DIR, full);
      // Skip tests — they can have fixtures + intentional path strings
      if (rel.startsWith("tests/")) continue;
      results.push({ rel, content: fs.readFileSync(full, "utf8") });
    }
  }
}

test("no bare vendor paths in plugin scripts", () => {
  const violations = [];
  const files = [];
  walk(path.join(PLUGIN_DIR, "scripts"), files);

  for (const { rel, content } of files) {
    if (ALLOWLIST.has(rel)) continue;
    for (const pattern of BARE_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        const lineNum = content.slice(0, match.index).split("\n").length;
        violations.push(
          rel + ":" + lineNum + " — bare vendor path: " + match[0],
        );
      }
    }
  }

  if (violations.length > 0) {
    assert.fail(
      "Found " +
        violations.length +
        " bare vendor path(s); route through scripts/lib/paths.js instead:\n  " +
        violations.join("\n  "),
    );
  }
});
