"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var os = require("os");
var path = require("path");
var { spawnSync } = require("node:child_process");
var { validateProposal, extractText } = require("../../scripts/validation/validate-proposal.js");

var ROOT = path.resolve(__dirname, "..", "..");
var SCRIPT = path.join(ROOT, "scripts", "validation", "validate-proposal.js");
var FIXTURE = path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496.json");
function load() { return JSON.parse(fs.readFileSync(FIXTURE, "utf8")); }
function checks(data) { return validateProposal(data).findings.map(function (f) { return f.check; }); }
function only(data, check) { return validateProposal(data).findings.filter(function (f) { return f.check === check; }); }

describe("extractText", function () {
  it("keeps visible text and alt, title, placeholder, aria-label; drops tags, script and style; decodes entities", function () {
    var t = extractText('<div title="Tip">Hello &amp; <b>world</b><img alt="Logo"><input placeholder="Search"><span aria-label="Close">x</span><style>.a{}</style><script>bad()</script></div>');
    assert.ok(/Hello & world/.test(t), t);
    ["Tip", "Logo", "Search", "Close"].forEach(function (w) { assert.ok(t.indexOf(w) !== -1, w + " in " + t); });
    assert.ok(t.indexOf("bad()") === -1 && t.indexOf(".a{}") === -1, "script/style dropped: " + t);
  });
});

describe("validateProposal", function () {
  it("is quiet on the clean fixture", function () {
    var f = validateProposal(load()).findings;
    assert.deepEqual(f, [], JSON.stringify(f, null, 1));
  });
  it("schema errors are P0 (check schema)", function () {
    var d = load(); delete d.screens[0].html;
    var f = only(d, "schema"); assert.ok(f.length >= 1 && f[0].severity === "P0", JSON.stringify(f));
  });
  it("unknown app slug is P0 (check app-unknown)", function () {
    var d = load(); d.screens[1].app = "nope";
    var f = only(d, "app-unknown"); assert.strictEqual(f.length, 1); assert.strictEqual(f[0].severity, "P0");
  });
  it("width outside 240 to 720, more than 8 screens, and duplicate ids are P0 (check bounds)", function () {
    var d = load(); d.screens[0].width = 100;
    assert.ok(only(d, "bounds").length === 1, "width low");
    d = load(); d.screens[0].width = 900;
    assert.ok(only(d, "bounds").length === 1, "width high");
    d = load(); for (var i = 0; i < 9; i++) d.screens.push(Object.assign({}, d.screens[0], { id: "dup-" + i }));
    assert.ok(only(d, "bounds").some(function (f) { return /8/.test(f.value); }), "count");
    d = load(); d.screens[1].id = d.screens[0].id;
    assert.ok(only(d, "bounds").some(function (f) { return /duplicate/.test(f.value); }), "duplicate id");
  });
  it("terminology fires on fragment text through the flow validator's own gate (check terminology)", function () {
    var d = load(); d.screens[0].html += "<p>Open the tool to continue</p>";
    var f = only(d, "terminology"); assert.strictEqual(f.length, 1, JSON.stringify(f)); assert.strictEqual(f[0].found, "the tool");
    assert.strictEqual(f[0].path, "screens[0].html");
  });
  it("terminology fires on the recommendation too (probed: scope is a notUse term)", function () {
    var d = load(); d.meta.recommendation = "<p>Grouped by scope</p>";
    var f = only(d, "terminology"); assert.strictEqual(f.length, 1, JSON.stringify(f)); assert.strictEqual(f[0].path, "meta.recommendation"); assert.strictEqual(f[0].found, "scope");
  });
  it("avoid-words fire on captions too (check avoid-word)", function () {
    var d = load(); d.screens[2].caption = "Please click My access";
    var f = only(d, "avoid-word"); assert.ok(f.length >= 1, JSON.stringify(f)); assert.strictEqual(f[0].path, "screens[2].caption");
  });
  it("a hex or rgb colour in a style attribute or style block is P1 (check hardcoded-color)", function () {
    var d = load(); d.screens[0].html += '<div style="color:#E6E3FB">x</div><style>.k{background:rgb(1,2,3)}</style>';
    var f = only(d, "hardcoded-color"); assert.strictEqual(f.length, 2, JSON.stringify(f)); assert.strictEqual(f[0].severity, "P1");
    d = load(); d.screens[0].html += '<a href="#top">top</a>';
    assert.strictEqual(only(d, "hardcoded-color").length, 0, "an anchor href is not a colour");
  });
  it("script, inline handlers and javascript: URLs are P0 (check script)", function () {
    ["<script>x()</script>", '<div onclick="x()">a</div>', '<a href="javascript:void(0)">a</a>'].forEach(function (bad) {
      var d = load(); d.screens[0].html += bad;
      var f = only(d, "script"); assert.strictEqual(f.length, 1, bad); assert.strictEqual(f[0].severity, "P0");
    });
  });
  it("an external src or href is P0 (check external-load)", function () {
    ['<img src="https://x.test/a.png">', '<link href="//cdn.test/a.css">', '<a href="http://x.test">a</a>'].forEach(function (bad) {
      var d = load(); d.screens[0].html += bad;
      var f = only(d, "external-load"); assert.strictEqual(f.length, 1, bad); assert.strictEqual(f[0].severity, "P0");
    });
  });
  it("an em dash in visible text, a caption, the title or the recommendation is P2 (check em-dash)", function () {
    var d = load(); d.screens[0].html += "<p>A \u2014 B</p>"; d.screens[1].caption = "C \u2014 D"; d.meta.title = "T \u2014 U"; d.meta.recommendation = "<p>R \u2014 S</p>";
    var f = only(d, "em-dash"); assert.strictEqual(f.length, 4, JSON.stringify(f)); assert.strictEqual(f[0].severity, "P2");
  });
  it("a data-toggle without a matching id in the same fragment is P1 (check toggle-target)", function () {
    var d = load(); d.screens[1].html = d.screens[1].html.replace('id="menu-default"', 'id="menu-x"');
    var f = only(d, "toggle-target"); assert.strictEqual(f.length, 1); assert.strictEqual(f[0].found, "menu-default");
  });
  it("an unbalanced fragment is P0 (check unbalanced)", function () {
    var d = load(); d.screens[0].html = "<div><span>open</div>";
    var f = only(d, "unbalanced"); assert.strictEqual(f.length, 1); assert.strictEqual(f[0].severity, "P0");
  });
});

describe("validate-proposal.js CLI", function () {
  function run(args) { return spawnSync(process.execPath, [SCRIPT].concat(args), { encoding: "utf8" }); }
  function tmpWith(mutate) {
    var d = load(); mutate(d);
    var p = path.join(os.tmpdir(), "proposal-" + Date.now() + "-" + Math.random().toString(36).slice(2) + ".json");
    fs.writeFileSync(p, JSON.stringify(d)); return p;
  }
  it("exits 0 on the clean fixture and says so", function () {
    var r = run([FIXTURE]); assert.strictEqual(r.status, 0, r.stderr + r.stdout); assert.ok(/0 findings/.test(r.stdout), r.stdout);
  });
  it("exits 1 on a P0 and prints the finding line", function () {
    var r = run([tmpWith(function (d) { d.screens[0].html += "<script>x()</script>"; })]);
    assert.strictEqual(r.status, 1); assert.ok(/P0 \[script\]/.test(r.stdout), r.stdout);
  });
  it("exits 0 on P1 only, still printing it", function () {
    var r = run([tmpWith(function (d) { d.screens[0].html += '<div style="color:#fff">x</div>'; })]);
    assert.strictEqual(r.status, 0); assert.ok(/P1 \[hardcoded-color\]/.test(r.stdout), r.stdout);
  });
  it("--json prints the findings array; --help prints the contract", function () {
    var r = run([tmpWith(function (d) { d.screens[0].html += "<script>x()</script>"; }), "--json"]);
    var out = JSON.parse(r.stdout); assert.ok(Array.isArray(out.findings) && out.findings[0].check === "script");
    var h = JSON.parse(run(["--help"]).stdout); assert.strictEqual(h.name, "validate-proposal"); assert.ok(h.flags.some(function (f) { return f.name === "--json"; }));
  });
});
