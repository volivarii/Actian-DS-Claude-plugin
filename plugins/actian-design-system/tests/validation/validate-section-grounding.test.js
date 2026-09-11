#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var validate = require(path.join(PLUGIN_ROOT, "scripts", "validation", "validate-flow-data.js"));
var QUIET = { skipTokens: true, skipTerminology: true, skipAvoidWords: true };

function flow(sectionsMeta, screen) {
  var meta = { feature: "t", app: "Studio", library: "ds", _glossary: { app: "Studio" } };
  if (sectionsMeta !== undefined) meta._sections = sectionsMeta;
  return { meta: meta, screens: [Object.assign({ id: "s1", name: "Detail", template: "studio", content: [] }, screen || {})] };
}
function sectionFindings(data) {
  return validate.validate(data, QUIET).findings.filter(function (f) { return f.kind === "section-ungrounded"; });
}
var HEADER = { Detail: [{ slug: "item-header", role: "header", roots: ["Item header"] }] };

describe("validate-section-grounding (Slice 6B, advisory)", function () {
  it("no _sections in meta: silent", function () {
    assert.deepStrictEqual(sectionFindings(flow(undefined)), []);
  });
  it("header section composed (a FRAME named after its root), no page header: silent", function () {
    var f = flow(HEADER, { content: [{ type: "FRAME", name: "Item header", children: [] }] });
    assert.deepStrictEqual(sectionFindings(f), []);
  });
  it("header section missing from the content: one info finding naming the root", function () {
    var out = sectionFindings(flow(HEADER, { content: [{ type: "FRAME", name: "Body" }] }));
    assert.strictEqual(out.length, 1);
    assert.strictEqual(out[0].severity, "info");
    assert.strictEqual(out[0].screen, "s1");
    assert.ok(/no FRAME named 'Item header'/.test(out[0].message), out[0].message);
  });
  it("header section composed AND a pageHeader authored: one finding saying so", function () {
    var out = sectionFindings(flow(HEADER, { pageHeader: { title: "X" }, content: [{ type: "FRAME", name: "Item header" }] }));
    assert.strictEqual(out.length, 1);
    assert.ok(/draws its own page header \(pageHeader\)/.test(out[0].message), out[0].message);
  });
  it("header section composed AND a page-header DS instance authored: one finding", function () {
    var out = sectionFindings(flow(HEADER, { content: [{ type: "INSTANCE", dsSlug: "page-header" }, { type: "FRAME", name: "Item header" }] }));
    assert.strictEqual(out.length, 1);
    assert.ok(/page-header instance/.test(out[0].message), out[0].message);
  });
  it("header section composed AND a kebab fm-page-header ref authored: one finding", function () {
    var out = sectionFindings(flow(HEADER, { content: [{ type: "INSTANCE", ref: "fm-page-header" }, { type: "FRAME", name: "Item header" }] }));
    assert.strictEqual(out.length, 1);
    assert.ok(/page-header instance/.test(out[0].message), out[0].message);
  });
  it("a non-header role never fires", function () {
    var f = flow({ Detail: [{ slug: "control-bar", role: "control-bar", roots: ["Results header"] }] }, { content: [] });
    assert.deepStrictEqual(sectionFindings(f), []);
  });
  it("the kind is CLI-visible and non-blocking (exit 0 on a flow with only this finding)", function () {
    var os = require("os"), fs = require("fs"), cp = require("child_process");
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "secgr-"));
    try {
      var file = path.join(dir, "flow-data.json");
      fs.writeFileSync(file, JSON.stringify(flow(HEADER, { content: [{ type: "FRAME", name: "Body" }] })));
      var r = cp.spawnSync(process.execPath, [path.join(PLUGIN_ROOT, "scripts", "validation", "validate-flow-data.js"), file, "--skip-tokens", "--skip-terminology", "--skip-avoid-words"], { encoding: "utf8" });
      assert.ok(/\[section-ungrounded\]/.test(r.stdout + r.stderr), "CLI must print the kind, got:\n" + r.stdout + r.stderr);
      assert.strictEqual(r.status, 0, "info findings never block");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
