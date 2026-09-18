// tests/renderers/assemble-direct.test.js
"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const cp = require("node:child_process");
const ROOT = path.resolve(__dirname, "../..");
const FIX = path.join(ROOT, "tests/fixtures/direct");

function briefFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "assemble-direct-"));
  const out = path.join(dir, ".brief.json");
  const r = cp.spawnSync(
    process.execPath,
    [
      path.join(ROOT, "scripts/lib/app-context/prepare-flow.js"),
      "--app",
      "studio",
      "--screen-list",
      path.join(FIX, "screen-list.json"),
      "-o",
      out,
      "--direct",
    ],
    { encoding: "utf8" },
  );
  assert.strictEqual(r.status, 0, r.stderr);
  return { dir, out };
}

describe("assemble-direct", () => {
  const { dir, out } = briefFile();
  const page = path.join(dir, "flow.html");
  const r = cp.spawnSync(
    process.execPath,
    [
      path.join(ROOT, "scripts/renderers/assemble-direct.js"),
      out,
      "--author",
      path.join(FIX, "author"),
      "-o",
      page,
    ],
    { encoding: "utf8" },
  );
  const html = r.status === 0 ? fs.readFileSync(page, "utf8") : "";

  it("exits 0 and writes one self-contained page", () => {
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(!/(src|href)="https?:/.test(html), "an external URL reached the page");
    assert.ok(!/<link /.test(html));
  });
  it("draws the app frame itself, with the declared rail item active", () => {
    assert.ok(/\bds-header\b/.test(html), "no DS global header");
    assert.ok(html.includes("Catalog design"), "rail items missing");
    assert.ok(!html.includes("data-app-frame"), "the placeholder survived");
    // The real marker the side-nav leaf emits, read off a render:
    // <a class="ds-sidenav__item is-active">...<span class="ds-sidenav__label">Catalog</span></a>
    const active = html.match(
      /class="ds-sidenav__item is-active"[^>]*>[\s\S]{0,200}?ds-sidenav__label">Catalog</,
    );
    assert.ok(active, "Catalog is not the active rail item");
    assert.ok(
      html.indexOf("2 results") > html.indexOf("ds-header"),
      "author content is not inside the frame",
    );
  });
  it("styles the frame with the same stylesheets a rendered screen gets", () => {
    // One class per stylesheet the frame needs, each defined in that file and
    // NO other one the page inlines (checked with grep across all six), so
    // dropping a stylesheet fails here. .screen__body is the flex row that
    // puts the rail beside the content; without it the rail stacks on top.
    assert.ok(/\.screen__body\s*\{/.test(html), "no flow-renderer.css");
    assert.ok(/\.fm-frame\s*\{/.test(html), "no render-node.css");
    assert.ok(/\.ds-sidenav\b/.test(html), "no ds-base.css");
    assert.ok(/--zen-spacing-lg\s*:/.test(html), "no tokens.css");
  });
  it("inlines icons and leaves no data-icon behind", () => {
    assert.ok(!/data-icon=/.test(html));
    assert.ok(/<svg[^>]*class="proto-icon"/.test(html));
  });
  it("adds the strip: one button per step, the what-is-new toggle, the adds list", () => {
    assert.strictEqual((html.match(/data-proto-step="/g) || []).length, 4);
    assert.ok(html.includes("Show what is new"));
    assert.ok(html.includes("Describe action"));
  });
  it("carries the runtime: proto.go and the ?step hook, before the author's script", () => {
    assert.ok(html.indexOf("window.proto") !== -1);
    assert.ok(html.indexOf("window.proto") < html.indexOf("proto.steps = ["));
    assert.ok(/URLSearchParams/.test(html));
  });
  it("wraps a layer in the docking markup", () => {
    assert.ok(/class="proto-layer proto-layer--panel"/.test(html));
  });
  it("reports a usage error and an input error on stderr, exit 1", () => {
    const usage = cp.spawnSync(
      process.execPath,
      [path.join(ROOT, "scripts/renderers/assemble-direct.js"), out],
      { encoding: "utf8" },
    );
    assert.strictEqual(usage.status, 1);
    assert.match(usage.stderr, /usage: assemble-direct.js/);
    const plain = path.join(dir, "plain.json");
    fs.writeFileSync(plain, JSON.stringify({ screens: [] }));
    const noDirect = cp.spawnSync(
      process.execPath,
      [
        path.join(ROOT, "scripts/renderers/assemble-direct.js"),
        plain,
        "--author",
        path.join(FIX, "author"),
        "-o",
        path.join(dir, "no.html"),
      ],
      { encoding: "utf8" },
    );
    assert.strictEqual(noDirect.status, 1);
    assert.match(noDirect.stderr, /no direct block/);
  });
});
