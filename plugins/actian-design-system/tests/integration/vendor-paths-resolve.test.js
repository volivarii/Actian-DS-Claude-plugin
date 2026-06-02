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
// Trailing markdown/sentence punctuation (backtick, quote, comma, period, colon) is
// trimmed. A trailing `)`/`]` is only trimmed when it has NO matching opener in the
// token (a stray markdown-link/sentence bracket) — a balanced one (e.g. the `]` of
// `[<slug>]`) is part of the path token and is preserved.
function extractVendorRefs(text) {
  const out = [];
  const lines = text.split("\n");
  const RE = /vendor\/[A-Za-z0-9_./<>{}\[\],*#:-]+/g;
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
// first one containing a placeholder/brace (<...>, {...}, [...]). Existence of that
// prefix (file OR dir) is what we assert — so `vendor/x/dist/guidelines/<slug>.json`
// reduces to `vendor/x/dist/guidelines` (dir must exist) while a fully-concrete
// `vendor/presentation/guide.md` stays whole (file must exist).
function concreteVendorPrefix(ref) {
  const noAnchor = ref.split("#")[0].replace(/\/+$/, "");
  const segs = noAnchor.split("/");
  const kept = [];
  for (const seg of segs) {
    if (/[<>{}\[\]]/.test(seg)) break;
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

module.exports = { extractVendorRefs, concreteVendorPrefix };
