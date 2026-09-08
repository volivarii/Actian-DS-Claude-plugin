#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var os = require("os");
var path = require("path");
var { spawnSync } = require("child_process");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var ASSEMBLE = path.join(PLUGIN_ROOT, "scripts", "renderers", "assemble-preview.js");

function renderFlow(data) {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "fm-text-"));
  var input = path.join(dir, "flow-data.json");
  var out = path.join(dir, "flow.html");
  fs.writeFileSync(input, JSON.stringify(data));
  var r = spawnSync(process.execPath, [ASSEMBLE, input, "--type", "flow-share", "-o", out]);
  assert.strictEqual(r.status, 0, String(r.stderr));
  return fs.readFileSync(out, "utf8");
}

describe("flow-share: FM text is visible without an explicit color", function () {
  var html = renderFlow({
    meta: { feature: "T", app: "Studio" },
    screens: [{ name: "S1", template: "studio", content: [{ type: "TEXT", content: "Visible please" }] }],
  });
  it("the inlined flow CSS gives .fm-text an explicit color", function () {
    assert.match(html, /\.fm-text\s*\{[^}]*color:\s*var\(--fm-text-primary\)/);
  });
  it("the wrapper's near-white body color is not on body any more", function () {
    assert.doesNotMatch(html, /body\s*\{[^}]*color:\s*#f0f2f5/i);
  });
});
