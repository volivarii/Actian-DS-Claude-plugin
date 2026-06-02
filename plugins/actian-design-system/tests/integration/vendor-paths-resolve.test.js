"use strict";

// Guard: every `vendor/…` path referenced in plugin PROSE (skills/references/
// agents) or CODE must resolve to a real file/dir in the vendored tree. Catches
// the staleness class that bit us in Track E (presentation/fm-to-ds-map prose +
// a test silently coupled to a physical path that later moved). Prose legitimately
// names concrete paths (the agent opens them) — so this VALIDATES resolution; it
// does NOT forbid literals (that's no-bare-vendor-paths.test.js, for code).

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PLUGIN_DIR = path.join(__dirname, "..", "..");
const VENDOR = path.join(PLUGIN_DIR, "vendor");

// Extract every `vendor/<path>` token from a block of text, with its 1-based line.
// A negative lookbehind ensures we only catch the SUBSTRATE-rooted `vendor/…` —
// not the tail of a longer source path like `scripts/vendor/…` or `tests/vendor/…`
// (those are in-tree dirs, not the vendored knowledge root).
// Trailing markdown/sentence punctuation (backtick, quote, comma, period, colon) is
// trimmed. A trailing `)`/`]` is only trimmed when it has NO matching opener in the
// token (a stray markdown-link/sentence bracket) — a balanced one (e.g. the `]` of
// `[<slug>]`) is part of the path token and is preserved.
function extractVendorRefs(text) {
  const out = [];
  const lines = text.split("\n");
  const RE = /(?<![A-Za-z0-9_.\/-])vendor\/[A-Za-z0-9_./<>{}\[\],*#:-]+/g;
  for (let i = 0; i < lines.length; i++) {
    let m;
    while ((m = RE.exec(lines[i])) !== null) {
      let ref = m[0].replace(/[.,`'":]+$/, "");
      while (/[)\]]$/.test(ref)) {
        const close = ref[ref.length - 1];
        const open = close === ")" ? "(" : "[";
        if (ref.includes(open)) break; // balanced — part of the token
        ref = ref.slice(0, -1).replace(/[.,`'":]+$/, "");
      }
      if (ref.length > "vendor/".length) out.push({ ref, line: i + 1 });
    }
  }
  return out;
}

// Reduce a (possibly templated) ref to its deepest CONCRETE prefix path (relative,
// still starting with "vendor/"): drop any `#anchor`, then keep segments until the
// first one containing a placeholder/brace/glob (<...>, {...}, [...], *). Existence
// of that prefix (file OR dir) is what we assert — so `vendor/x/dist/guidelines/<slug>.json`
// reduces to `vendor/x/dist/guidelines` (dir must exist), `vendor/x/registries/*.json`
// reduces to `vendor/x/registries`, while a fully-concrete `vendor/presentation/guide.md`
// stays whole (file must exist).
function concreteVendorPrefix(ref) {
  const noAnchor = ref.split("#")[0].replace(/\/+$/, "");
  const segs = noAnchor.split("/");
  const kept = [];
  for (const seg of segs) {
    if (/[<>{}\[\]*]/.test(seg)) break;
    kept.push(seg);
  }
  return kept.join("/");
}

test("extractVendorRefs pulls tokens + trims trailing punctuation/anchors", () => {
  const refs = extractVendorRefs(
    "Read `vendor/content/dist/global.md` and vendor/tokens/tokens.json.\n" +
      "Resolve vendor/accessibility/dist/a11y-index.json#bySlug[<slug>]",
  );
  const got = refs.map((r) => r.ref);
  assert.ok(got.includes("vendor/content/dist/global.md"));
  assert.ok(got.includes("vendor/tokens/tokens.json"));
  assert.ok(
    got.includes("vendor/accessibility/dist/a11y-index.json#bySlug[<slug>]"),
  );
  assert.equal(refs[2].line, 2);
});

test("concreteVendorPrefix: concrete path stays whole", () => {
  assert.equal(
    concreteVendorPrefix("vendor/presentation/presentation-guide.md"),
    "vendor/presentation/presentation-guide.md",
  );
});

test("concreteVendorPrefix: templated filename → containing dir", () => {
  assert.equal(
    concreteVendorPrefix("vendor/components/dist/guidelines/<slug>.json"),
    "vendor/components/dist/guidelines",
  );
  assert.equal(
    concreteVendorPrefix("vendor/components/dist/{fm,dskit}-components.md"),
    "vendor/components/dist",
  );
  assert.equal(
    concreteVendorPrefix("vendor/components/dist/registries/*.json"),
    "vendor/components/dist/registries",
  );
});

test("concreteVendorPrefix: drops #anchor and trailing slash", () => {
  assert.equal(
    concreteVendorPrefix(
      "vendor/accessibility/dist/a11y-index.json#bySlug[<slug>]",
    ),
    "vendor/accessibility/dist/a11y-index.json",
  );
  assert.equal(
    concreteVendorPrefix("vendor/foundations/"),
    "vendor/foundations",
  );
});

test("resolution check: concrete prefix existence is decidable in a tmp vendor", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vpr-"));
  fs.mkdirSync(path.join(dir, "vendor", "foo"), { recursive: true });
  fs.writeFileSync(path.join(dir, "vendor", "foo", "bar.md"), "x");
  const ok = concreteVendorPrefix("vendor/foo/bar.md");
  const bad = concreteVendorPrefix("vendor/gone/missing.md");
  assert.equal(fs.existsSync(path.join(dir, ok)), true);
  assert.equal(fs.existsSync(path.join(dir, bad)), false);
  fs.rmSync(dir, { recursive: true, force: true });
});

// Source dirs the agent reads (prose) + code. NOT vendor/ (the tree itself).
const SCAN_DIRS = ["skills", "references", "agents", "scripts"];
const SCAN_EXT = new Set([".md", ".js", ".cjs", ".mjs"]);

// Legitimately-nonresolving refs (illustrative examples, etc.). Keep MINIMAL +
// justify each. Entry = exact ref string.
const ALLOWLIST = new Set([]);

function walk(dir, files) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (SCAN_EXT.has(path.extname(name))) files.push(full);
  }
}

test("every vendor/ path referenced in plugin prose + code resolves", () => {
  const files = [];
  for (const d of SCAN_DIRS) walk(path.join(PLUGIN_DIR, d), files);

  const violations = [];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const { ref, line } of extractVendorRefs(text)) {
      if (ALLOWLIST.has(ref)) continue;
      const prefix = concreteVendorPrefix(ref); // e.g. "vendor/components/dist/guidelines"
      const abs = path.join(PLUGIN_DIR, prefix); // PLUGIN_DIR already ends at .../actian-design-system
      if (!fs.existsSync(abs)) {
        const rel = path.relative(PLUGIN_DIR, file);
        violations.push(`${rel}:${line} — ${ref} (checked: ${prefix})`);
      }
    }
  }

  assert.equal(
    violations.length,
    0,
    "Stale vendor path reference(s) — repoint to the current vendored path, or add to ALLOWLIST with justification:\n  " +
      violations.join("\n  "),
  );
});

module.exports = { extractVendorRefs, concreteVendorPrefix };
