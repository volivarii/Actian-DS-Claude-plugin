"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var { spawnSync } = require("node:child_process");
var { assembleProposal } = require("../../scripts/renderers/assemble-proposal.js");
var flowRenderer = require("../../scripts/renderers/html-renderers/flow-renderer.js");

var ROOT = path.resolve(__dirname, "..", "..");
var FIXTURE = path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496.json");
function load() { return JSON.parse(fs.readFileSync(FIXTURE, "utf8")); }

describe("assembleProposal", function () {
  var html = assembleProposal(load());
  it("is one offline document with the FM stylesheet inlined and no external loads", function () {
    assert.ok(html.indexOf("<!DOCTYPE html>") !== -1, "DOCTYPE");
    assert.ok(html.indexOf("--fm-base-white") !== -1, "fm-base.css inlined");
    assert.ok(!/(src|href)\s*=\s*["']?(https?:)?\/\//i.test(html), "no external src or href");
    assert.ok(html.indexOf("fonts.googleapis.com") === -1, "no font CDN");
    assert.ok(!/\{\{[A-Z_]+\}\}/.test(html), "no placeholder leak");
  });
  it("renders one screen per entry, at its width, with its label and caption", function () {
    var data = load();
    assert.strictEqual(html.split('class="proposal-screen"').length - 1, data.screens.length);
    data.screens.forEach(function (s, i) {
      assert.ok(html.indexOf('style="width:' + s.width + 'px"') !== -1, s.id + " width");
      assert.ok(html.indexOf(">" + (i + 1) + "</span>") !== -1, s.id + " number");
      assert.ok(html.indexOf(s.caption) !== -1, s.id + " caption");
      assert.ok(html.indexOf('data-name="' + s.id + '"') !== -1, s.id + " data-name");
    });
  });
  it("renders the app header strip through the flow renderer's own appHeader markup", function () {
    var admin = flowRenderer.appHeader("Administration");
    var explorer = flowRenderer.appHeader("Explorer");
    assert.strictEqual(html.split(admin).length - 1, 1, "one Administration strip");
    assert.strictEqual(html.split(explorer).length - 1, 2, "two Explorer strips");
  });
  it("omits the strip when chrome is none", function () {
    var data = load();
    data.screens[0].chrome = "none";
    var out = assembleProposal(data);
    assert.strictEqual(out.split(flowRenderer.appHeader("Administration")).length - 1, 0);
  });
  it("prints the authored date and the recommendation, never a render-time clock", function () {
    assert.ok(html.indexOf("2026-09-09") !== -1, "date from meta");
    assert.ok(html.indexOf("Ship the badge as the default") !== -1, "recommendation");
    assert.strictEqual(assembleProposal(load()), html, "byte-identical on re-render");
  });
  it("carries the single data-toggle listener", function () {
    assert.strictEqual(html.split("data-toggle").length - 1 >= 1, true);
    assert.strictEqual(html.split("el.hidden = !el.hidden").length - 1, 1, "one listener");
  });
  it("escapes titles and names (no attribute breakout)", function () {
    var data = load();
    data.meta.title = 'T "x" <img onerror=z>';
    data.screens[0].name = 'N "y" <b>';
    var out = assembleProposal(data);
    assert.ok(out.indexOf("onerror=z>") === -1, "title escaped");
    assert.ok(out.indexOf("<b>") === -1 || out.indexOf("&lt;b&gt;") !== -1, "name escaped");
  });
  it("refuses an unknown app slug, a schema error and an unbalanced fragment", function () {
    var a = load(); a.screens[0].app = "not-an-app";
    assert.throws(function () { assembleProposal(a); }, /proposal-data: unknown app "not-an-app"/);
    var b = load(); delete b.screens[0].html;
    assert.throws(function () { assembleProposal(b); }, /proposal-data: schema/);
    var c = load(); c.screens[0].html = "<div><div>open</div>";
    assert.throws(function () { assembleProposal(c); }, /proposal-data: unbalanced <div> in screen "create-group"/);
  });
});

describe("assemble-preview.js --type proposal", function () {
  it("writes the board through the shared CLI", function () {
    var out = path.join(require("os").tmpdir(), "proposal-" + Date.now() + ".html");
    var r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "renderers", "assemble-preview.js"), FIXTURE, "--type", "proposal", "-o", out], { encoding: "utf8" });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(fs.existsSync(out), "file written");
    assert.ok(fs.readFileSync(out, "utf8").indexOf('class="proposal-screen"') !== -1);
  });
  it("lists proposal among --help types", function () {
    var r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "renderers", "assemble-preview.js"), "--help"], { encoding: "utf8" });
    var help = JSON.parse(r.stdout);
    assert.ok(help.types.indexOf("proposal") !== -1, JSON.stringify(help.types));
  });
});
