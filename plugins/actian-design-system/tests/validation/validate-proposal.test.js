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
var EM_DASH = "\u2014";
function load() { return JSON.parse(fs.readFileSync(FIXTURE, "utf8")); }
function only(data, check) {
  return validateProposal(data).findings.filter(function (f) { return f.check === check; });
}
function withMutation(mutate) { var d = load(); mutate(d); return d; }

describe("extractText", function () {
  it("keeps visible text and alt, title, placeholder, aria-label; drops tags, script and style; decodes entities", function () {
    var t = extractText('<div title="Tip">Hello &amp; <b>world</b><img alt="Logo"><input placeholder="Search"><span aria-label="Close">x</span><style>.a{}</style><script>bad()</script></div>');
    assert.ok(/Hello & world/.test(t), t);
    ["Tip", "Logo", "Search", "Close"].forEach(function (w) { assert.ok(t.indexOf(w) !== -1, w + " in " + t); });
    assert.ok(t.indexOf("bad()") === -1 && t.indexOf(".a{}") === -1, "script/style dropped: " + t);
  });
});

describe("validateProposal (document)", function () {
  it("is quiet on the clean fixture", function () {
    var f = validateProposal(load()).findings;
    assert.deepEqual(f, [], JSON.stringify(f, null, 1));
  });
  it("schema errors are P0 (check schema) and stop the other checks", function () {
    var f = validateProposal(withMutation(function (d) { delete d.comparison; })).findings;
    assert.ok(f.length >= 1 && f.every(function (x) { return x.check === "schema" && x.severity === "P0"; }), JSON.stringify(f));
  });
  it("an unknown anchor app or meta.apps entry is P0; an unknown screens[].app entry is P1 (check app-unknown)", function () {
    var f = only(withMutation(function (d) { d.approaches[0].anchor.app = "nope"; }), "app-unknown");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].severity, "P0"); assert.strictEqual(f[0].screen, "a");
    f = only(withMutation(function (d) { d.meta.apps.push("nope"); }), "app-unknown");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].severity, "P0"); assert.strictEqual(f[0].path, "meta.apps[2]");
    f = only(withMutation(function (d) { d.approaches[1].screens[0].app = "nope"; }), "app-unknown");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].severity, "P1"); assert.strictEqual(f[0].screen, "b");
  });
  it("bounds are P0: more than 4 approaches, more than 5 findings, more than 4 reasons, more than 4 flow screens, width outside 240 to 720, duplicate approach or criterion ids, an unknown tone, cells for an unknown approach", function () {
    function bounds(mutate) { return only(withMutation(mutate), "bounds"); }
    assert.ok(bounds(function (d) { d.approaches.push(Object.assign({}, d.approaches[0], { id: "d" }), Object.assign({}, d.approaches[0], { id: "e" })); }).some(function (f) { return /approaches; at most 4/.test(f.value); }));
    assert.ok(bounds(function (d) { for (var i = 0; i < 6; i++) d.research.findings.push({ claim: "c" + i, source: "s" }); }).some(function (f) { return /findings; at most 5/.test(f.value); }));
    assert.ok(bounds(function (d) { d.recommendation.reasons.push({ title: "t", why: "w" }); }).some(function (f) { return /reasons; at most 4/.test(f.value); }));
    assert.ok(bounds(function (d) { for (var i = 0; i < 4; i++) d.approaches[0].screens.push(d.approaches[0].screens[0]); }).some(function (f) { return /screens; at most 4/.test(f.value); }));
    assert.ok(bounds(function (d) { d.approaches[0].screen.width = 900; }).some(function (f) { return /outside 240 to 720/.test(f.value); }));
    assert.ok(bounds(function (d) { d.approaches[1].id = "a"; }).some(function (f) { return /duplicate id a/.test(f.value); }));
    assert.ok(bounds(function (d) { d.comparison.criteria[1].id = "literal-ask"; }).some(function (f) { return /duplicate criterion id/.test(f.value); }));
    assert.ok(bounds(function (d) { d.comparison.cells.a["literal-ask"].tone = "great"; }).some(function (f) { return /tone "great"/.test(f.value); }));
    assert.ok(bounds(function (d) { d.comparison.cells.zz = { "literal-ask": { text: "x", tone: "good" } }; }).some(function (f) { return /does not exist/.test(f.value); }));
  });
  it("research that did not run must say why (check research, P0); with a reason it is quiet", function () {
    var f = only(withMutation(function (d) { d.research = { ran: false, findings: [] }; }), "research");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].severity, "P0");
    assert.deepEqual(only(withMutation(function (d) { d.research = { ran: false, findings: [], skippedBecause: "--no-research" }; }), "research"), []);
  });
  it("a recommendation naming no approach is P0 (check recommendation)", function () {
    var f = only(withMutation(function (d) { d.recommendation.approachId = "zz"; }), "recommendation");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].severity, "P0");
    assert.ok(/one of a, b, c/.test(f[0].suggestion), f[0].suggestion);
  });
  it("a flow screen with an unknown template or entity is P1 (checks template-unknown, entity-unknown); a known entity and null are quiet", function () {
    var f = only(withMutation(function (d) { d.approaches[0].screens[0].template = "wizard"; }), "template-unknown");
    assert.strictEqual(f.length, 1); assert.ok(/overlay/.test(f[0].suggestion), f[0].suggestion);
    f = only(withMutation(function (d) { d.approaches[0].screens[0].entity = "unicorn"; }), "entity-unknown");
    assert.strictEqual(f.length, 1);
    assert.deepEqual(only(withMutation(function (d) { d.approaches[0].screens[0].entity = "data-product"; }), "entity-unknown"), []);
  });
  it("terminology fires on a drawing's text and on a reason through the flow validator's own gate (check terminology)", function () {
    var f = only(withMutation(function (d) { d.approaches[0].screen.html += "<div>scope of the change</div>"; }), "terminology");
    assert.ok(f.length >= 1, "drawing: " + JSON.stringify(f));
    assert.strictEqual(f[0].screen, "a"); assert.strictEqual(f[0].path, "approaches[0].screen.html");
    f = only(withMutation(function (d) { d.recommendation.reasons[0].why += " The scope grows."; }), "terminology");
    assert.ok(f.length >= 1, "reason: " + JSON.stringify(f));
    assert.strictEqual(f[0].screen, ""); assert.strictEqual(f[0].path, "recommendation.reasons[0]");
  });
  it("avoid-words fire on the context and on a comparison cell (check avoid-word)", function () {
    var f = only(withMutation(function (d) { d.context.product += " Please simply click here."; }), "avoid-word");
    assert.ok(f.length >= 1, JSON.stringify(f)); assert.strictEqual(f[0].path, "context.product");
    f = only(withMutation(function (d) { d.comparison.cells.b["literal-ask"].text = "Please click here"; }), "avoid-word");
    assert.ok(f.length >= 1, JSON.stringify(f)); assert.strictEqual(f[0].path, "comparison.criteria[0]");
  });
  it("a hex or rgb colour in a drawing's style or in any prose field is P1 (check hardcoded-color)", function () {
    var f = only(withMutation(function (d) { d.approaches[0].screen.html += '<div style="color:#fff;background:rgb(1,2,3)">x</div>'; }), "hardcoded-color");
    assert.strictEqual(f.length, 2);
    f = only(withMutation(function (d) { d.recommendation.summary += " Use #0F5FDC."; }), "hardcoded-color");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].path, "recommendation.summary");
  });
  it("position:absolute in a drawing is P1 (check in-flow)", function () {
    var f = only(withMutation(function (d) { d.approaches[0].screen.html += '<div style="position:absolute;top:0">x</div>'; }), "in-flow");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].severity, "P1"); assert.ok(/in flow/.test(f[0].suggestion));
  });
  it("script, inline handlers, javascript: URLs, external loads and unbalanced tags are P0 on a drawing", function () {
    assert.strictEqual(only(withMutation(function (d) { d.approaches[0].screen.html += "<script>x()</script>"; }), "script").length, 1);
    assert.strictEqual(only(withMutation(function (d) { d.approaches[0].screen.html += '<div onclick="x()">x</div>'; }), "script").length, 1);
    assert.strictEqual(only(withMutation(function (d) { d.approaches[0].screen.html += '<a href="javascript:x()">x</a>'; }), "script").length, 1);
    assert.strictEqual(only(withMutation(function (d) { d.approaches[0].screen.html += '<img src="https://x.test/a.png">'; }), "external-load").length, 1);
    assert.strictEqual(only(withMutation(function (d) { d.approaches[0].screen.html += '<div style="background:url(https://x.test/a.png)">x</div>'; }), "external-load").length, 1);
    var f = only(withMutation(function (d) { d.approaches[2].screen.html = "<div><span>open"; }), "unbalanced");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].screen, "c");
  });
  it("a data-toggle without its id, and an id reused across approaches, are P1 (check toggle-target)", function () {
    var f = only(withMutation(function (d) { d.approaches[0].screen.html += '<div data-toggle="ghost">x</div>'; }), "toggle-target");
    assert.strictEqual(f.length, 1); assert.ok(/no id="ghost"/.test(f[0].value));
    f = only(withMutation(function (d) { d.approaches[0].screen.html += '<div id="access-panel-c">x</div>'; }), "toggle-target");
    assert.strictEqual(f.length, 1); assert.ok(/also appears in approach "a"/.test(f[0].suggestion), f[0].suggestion);
  });
  it("a commented-out tag or id is not a finding", function () {
    assert.deepEqual(validateProposal(withMutation(function (d) { d.approaches[0].screen.html += '<!-- <div id="access-panel-c"> -->'; })).findings, []);
  });
  it("an em dash in a drawing, the title, a claim, a cell or a reason is P2 (check em-dash) with the field path", function () {
    [
      function (d) { d.approaches[0].screen.html += "<div>a " + EM_DASH + " b</div>"; },
      function (d) { d.meta.title += " " + EM_DASH + " x"; },
      function (d) { d.research.findings[0].claim += " " + EM_DASH; },
      function (d) { d.comparison.cells.a["literal-ask"].text += " " + EM_DASH; },
      function (d) { d.recommendation.reasons[1].why += " " + EM_DASH; },
    ].forEach(function (m, i) {
      var f = only(withMutation(m), "em-dash");
      assert.strictEqual(f.length, 1, "case " + i + ": " + JSON.stringify(f));
      assert.strictEqual(f[0].severity, "P2");
    });
    assert.strictEqual(only(withMutation(function (d) { d.recommendation.reasons[1].why += " " + EM_DASH; }), "em-dash")[0].path, "recommendation.reasons[1].why");
  });
});

describe("validate-proposal.js CLI", function () {
  function run(args) { return spawnSync(process.execPath, [SCRIPT].concat(args), { encoding: "utf8" }); }
  function tmpWith(mutate) {
    var p = path.join(os.tmpdir(), "proposal-" + Date.now() + "-" + Math.random().toString(36).slice(2) + ".json");
    fs.writeFileSync(p, JSON.stringify(withMutation(mutate)));
    return p;
  }
  it("exits 0 on the clean fixture and says so", function () {
    var r = run([FIXTURE]);
    assert.strictEqual(r.status, 0, r.stderr + r.stdout);
    assert.ok(/0 findings/.test(r.stdout), r.stdout);
  });
  it("exits 1 on a P0 and prints the finding line with the approach", function () {
    var r = run([tmpWith(function (d) { d.approaches[1].screen.html += "<script>x()</script>"; })]);
    assert.strictEqual(r.status, 1);
    assert.ok(/P0 \[script\] approach "b"/.test(r.stdout), r.stdout);
  });
  it("exits 0 on P1 only, still printing it", function () {
    var r = run([tmpWith(function (d) { d.approaches[0].screen.html += '<div style="color:#fff">x</div>'; })]);
    assert.strictEqual(r.status, 0);
    assert.ok(/P1 \[hardcoded-color\]/.test(r.stdout), r.stdout);
  });
  it("--json prints the findings array; --help prints the contract", function () {
    var r = run([tmpWith(function (d) { d.recommendation.approachId = "zz"; }), "--json"]);
    var out = JSON.parse(r.stdout);
    assert.ok(Array.isArray(out.findings) && out.findings[0].check === "recommendation");
    var h = JSON.parse(run(["--help"]).stdout);
    assert.strictEqual(h.name, "validate-proposal");
    assert.ok(h.flags.some(function (f) { return f.name === "--json"; }));
  });
});
