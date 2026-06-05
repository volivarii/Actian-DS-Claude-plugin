"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var spawnSync = require("child_process").spawnSync;
var path = require("path");
var os = require("os");
var fs = require("fs");

var SCRIPT = path.join(
  __dirname,
  "..",
  "..",
  "scripts",
  "renderers",
  "assemble-preview.js",
);
var FIXTURES = path.join(__dirname, "..", "fixtures");
var FLOW_FIXTURE = path.join(FIXTURES, "admin-dashboard.json");

function runFile(inputPath) {
  var out = path.join(
    os.tmpdir(),
    "flow-share-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 8) +
      ".html",
  );
  var r = spawnSync(
    "node",
    [SCRIPT, inputPath, "--type", "flow-share", "-o", out],
    { encoding: "utf8" },
  );
  var html = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
  if (fs.existsSync(out)) fs.unlinkSync(out);
  return { status: r.status, stderr: r.stderr, html: html };
}

describe("flow-share assembly", function () {
  it("emits a valid two-view self-contained file", function () {
    var r = runFile(FLOW_FIXTURE);
    assert.strictEqual(r.status, 0, "exits cleanly: " + r.stderr);
    assert.ok(r.html.indexOf("<!DOCTYPE html>") !== -1, "has DOCTYPE");
    assert.ok(r.html.indexOf("proto-stage") !== -1, "has the prototype stage");
    assert.ok(r.html.indexOf("proto-toggle") !== -1, "has the view toggle");
    assert.ok(
      r.html.indexOf("proto-stage--overview") !== -1,
      "has overview view",
    );
  });

  it("renders every screen as a proto-screen and a nav entry", function () {
    var r = runFile(FLOW_FIXTURE);
    var data = JSON.parse(fs.readFileSync(FLOW_FIXTURE, "utf8"));
    var n = data.screens.length;
    var cells = r.html.split('class="proto-screen-cell"').length - 1;
    assert.strictEqual(cells, n, "one proto-screen-cell per screen");
    // nav array filled with one {id,label} per screen
    data.screens.forEach(function (s) {
      assert.ok(
        r.html.indexOf(s.name) !== -1,
        "nav/label contains screen name: " + s.name,
      );
    });
    // real screen content is present (server-rendered). The admin-dashboard
    // fixture uses a legacy chrome field that resolveChrome ignores, so screens
    // render WITHOUT app-header/sidebar; the page header IS rendered from
    // pageHeader, so assert on that (chrome-independent proof of server render).
    assert.ok(
      r.html.indexOf("fm-page-header") !== -1,
      "page header rendered server-side",
    );
  });

  it("inlines Alpine + flow tokens, drops all CDNs (self-containment gate)", function () {
    var r = runFile(FLOW_FIXTURE);
    assert.ok(r.html.indexOf("--zen-") !== -1, "tokens.css inlined");
    assert.ok(r.html.indexOf("--fm-") !== -1, "fm CSS inlined");
    // No external resource LOADS (the load-bearing 'share a file' guarantee).
    assert.ok(
      !/<script[^>]+src="https?:/.test(r.html),
      "no external <script src>",
    );
    assert.ok(
      !/<link[^>]+href="https?:/.test(r.html),
      "no external <link href>",
    );
    assert.ok(
      !/@import\s+(url\()?["']?https?:/.test(r.html),
      "no @import of remote CSS",
    );
    assert.ok(!/url\(\s*["']?https?:/.test(r.html), "no remote url() in CSS");
    assert.ok(r.html.indexOf("cdn.jsdelivr.net") === -1, "Alpine CDN gone");
    assert.ok(
      r.html.indexOf("fonts.googleapis.com") === -1,
      "Google Fonts gone",
    );
  });

  it("is audience-safe: prompt + model only in the provenance comment", function () {
    var tmp = path.join(os.tmpdir(), "share-meta-" + Date.now() + ".json");
    fs.writeFileSync(
      tmp,
      JSON.stringify({
        meta: {
          feature: "Widget Flow",
          app: "Studio",
          prompt: "ZZSENTINELPROMPT",
          model: "zz-sentinel-model",
          pluginVersion: "1.100.0",
          generatedAt: "2026-06-05",
        },
        screens: [{ name: "One", template: "studio", content: [] }],
      }),
      "utf8",
    );
    var r = runFile(tmp);
    fs.unlinkSync(tmp);
    assert.strictEqual(r.status, 0, "exits cleanly: " + r.stderr);

    var bodyStart = r.html.indexOf("<body");
    var body = r.html.slice(bodyStart);
    assert.ok(
      body.indexOf("ZZSENTINELPROMPT") === -1,
      "prompt NOT visible in body",
    );
    assert.ok(
      body.indexOf("zz-sentinel-model") === -1,
      "model NOT visible in body",
    );

    var head = r.html.slice(0, r.html.indexOf("<!DOCTYPE"));
    assert.ok(
      head.indexOf("ZZSENTINELPROMPT") !== -1,
      "prompt present in leading provenance comment",
    );
    assert.ok(
      head.indexOf("zz-sentinel-model") !== -1,
      "model present in leading provenance comment",
    );

    assert.ok(r.html.indexOf("Widget Flow") !== -1, "feature name shown");
    assert.ok(
      r.html.indexOf("v1.100.0") !== -1,
      "plugin version shown in audience meta",
    );
  });

  it("never injects an auto-refresh", function () {
    var r = runFile(FLOW_FIXTURE);
    assert.ok(r.html.indexOf('http-equiv="refresh"') === -1, "no meta refresh");
    assert.ok(r.html.indexOf("location.reload") === -1, "no JS reload");
  });

  it("derives the document title from the feature", function () {
    var r = runFile(FLOW_FIXTURE);
    assert.ok(/<title>Admin Dashboard/.test(r.html), "title from meta.feature");
  });

  it("escapes quotes in screen names so the x-data attribute is not truncated (no injection)", function () {
    var tmp = path.join(os.tmpdir(), "share-xss-" + Date.now() + ".json");
    fs.writeFileSync(
      tmp,
      JSON.stringify({
        meta: { feature: "Q", app: "Studio", pluginVersion: "1.100.0" },
        screens: [
          {
            name: 'Bad "name" <img src=x onerror=alert(1)>',
            template: "studio",
            content: [],
          },
        ],
      }),
      "utf8",
    );
    var r = runFile(tmp);
    fs.unlinkSync(tmp);
    assert.strictEqual(r.status, 0, "exits cleanly: " + r.stderr);
    // No live injected element: the raw onerror attribute must not appear as markup.
    assert.ok(
      r.html.indexOf("onerror=alert(1)>") === -1,
      "no unescaped injected element",
    );
    // The x-data attribute must not be truncated by the quote in the name —
    // the bottom nav template that follows screens: must still be intact.
    assert.ok(
      r.html.indexOf('x-for="item in screens"') !== -1,
      "x-data/markup after screens[] survives",
    );
  });

  it("preserves the Prototype UX chrome (indicator, hint, nav) through the comment strip", function () {
    var r = runFile(FLOW_FIXTURE);
    assert.ok(
      r.html.indexOf('class="proto-indicator"') !== -1,
      "screen indicator survives",
    );
    assert.ok(
      r.html.indexOf('class="proto-hint"') !== -1,
      "keyboard hint survives",
    );
    assert.ok(
      r.html.indexOf('class="proto-nav"') !== -1,
      "bottom nav survives",
    );
    // The instruction comment block IS stripped (no leftover guidance / example cell).
    assert.ok(
      r.html.indexOf("wraps all proto-screen elements") === -1,
      "instruction comment stripped",
    );
  });
});
