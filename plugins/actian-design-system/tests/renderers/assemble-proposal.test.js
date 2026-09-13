"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var { assembleProposal } = require("../../scripts/renderers/assemble-proposal.js");

var ROOT = path.resolve(__dirname, "..", "..");
var FIXTURE = path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496-one-decision.json");
function load() { return JSON.parse(fs.readFileSync(FIXTURE, "utf8")); }
function count(hay, needle) { return hay.split(needle).length - 1; }
function at(hay, needle) { return hay.indexOf(needle); }
// The stylesheet defines every class the document may emit, so it names classes a
// given document leaves out. An "is this absent" assertion has to read the emitted
// document, not the sheet above it, or it can never fail.
function body(h) { return h.slice(h.indexOf("<body>")); }

// A second decision, built from the fixture's own, so a multi-decision document
// can be rendered without a second fixture file going stale beside the first.
function twoDecisions() {
  var d = load();
  var second = JSON.parse(JSON.stringify(d.decisions[0]));
  second.id = "where-the-name-comes-from";
  second.question = "Where does the readable name come from?";
  second.options.forEach(function (o, i) { o.id = "second-" + i; });
  second.comparison.cells = {};
  second.options.forEach(function (o, i) {
    second.comparison.cells[o.id] = {};
    second.comparison.criteria.forEach(function (c) {
      second.comparison.cells[o.id][c.id] = { text: "cell " + i, tone: "mixed" };
    });
  });
  second.pick.optionId = second.options[0].id;
  d.decisions.push(second);
  return d;
}

describe("assembleProposal (document)", function () {
  var html = assembleProposal(load());

  it("is one offline document with the FM stylesheet inlined and no external loads", function () {
    assert.ok(at(html, "<!DOCTYPE html>") !== -1, "DOCTYPE");
    assert.ok(at(html, "--fm-base-white") !== -1, "fm-base.css inlined");
    assert.ok(!/(src|href)\s*=\s*["']?(https?:)?\/\//i.test(html), "no external src or href");
    assert.ok(!/\{\{[A-Z_]+\}\}/.test(html), "no placeholder leak");
    assert.strictEqual(count(html, "<script"), 1, "only the toggle listener");
  });

  it("renders the eight elements in order, answer first and latitude last", function () {
    var d = twoDecisions();
    d.breadboard = {
      places: [
        { id: "a", name: "Account menu", app: "explorer", affordances: ["Name"] },
        { id: "b", name: "Group", app: "administration", affordances: ["Members"] },
      ],
      connections: [{ from: "a", to: "b", label: "reads" }],
    };
    var out = assembleProposal(d);
    var order = [
      'class="answer"',
      'class="bb__svg"',
      'class="decisions-at-a-glance"',
      'class="briefing"',
      'class="decision"',
      'class="change"',
      'class="doc__latitude"',
    ];
    var last = -1;
    order.forEach(function (marker) {
      var i = at(out, marker);
      assert.ok(i > last, marker + " comes after the one before it (at " + i + ", previous " + last + ")");
      last = i;
    });
  });

  it("puts the first drawing in the second element", function () {
    var d = twoDecisions();
    d.breadboard = {
      places: [
        { id: "a", name: "Account menu", app: "explorer", affordances: ["Name"] },
        { id: "b", name: "Group", app: "administration", affordances: ["Members"] },
      ],
      connections: [{ from: "a", to: "b", label: "reads" }],
    };
    var out = assembleProposal(d);
    assert.ok(at(out, 'class="bb__svg"') < at(out, 'class="briefing"'), "the terrain precedes the briefing");
    assert.ok(at(out, 'class="bb__svg"') < at(out, 'class="proposal-screen"'), "and precedes every option drawing");
  });

  it("states the answer once, with one pick line per decision", function () {
    var d = twoDecisions();
    var out = assembleProposal(d);
    assert.strictEqual(count(out, d.answer), 1, "the answer is stated once");
    assert.strictEqual(count(out, '<li class="answer-pick">'), d.decisions.length, "one pick line per decision");
    d.decisions.forEach(function (dec) {
      var win = dec.options.filter(function (o) { return o.id === dec.pick.optionId; })[0];
      assert.ok(at(out, "<b>" + win.name + "</b>") !== -1, dec.id + " names its winner in the picks");
    });
  });

  it("omits the terrain when there is no breadboard, and the whole legend with it", function () {
    var out = body(assembleProposal(load()));
    assert.strictEqual(at(out, "bb__svg"), -1, "no diagram");
    assert.strictEqual(at(out, "bb__legend"), -1, "no legend");
    assert.strictEqual(at(out, "The terrain"), -1, "no empty section heading");
  });

  it("omits the decision table for a one-decision document and prints it for more", function () {
    assert.strictEqual(at(body(html), "decisions-at-a-glance"), -1, "one decision needs no index of itself");
    var out = assembleProposal(twoDecisions());
    assert.ok(at(out, "decisions-at-a-glance") !== -1, "two decisions get the table");
    assert.strictEqual(count(out, "<tbody>"), 1 + 2, "the glance table plus one comparison per decision");
  });

  it("derives the decision table from decisions[], never from an authored field", function () {
    var d = twoDecisions();
    var out = assembleProposal(d);
    var table = out.slice(at(out, "decisions-at-a-glance"), at(out, 'class="briefing"'));
    d.decisions.forEach(function (dec) {
      var win = dec.options.filter(function (o) { return o.id === dec.pick.optionId; })[0];
      assert.ok(at(table, dec.question) !== -1, dec.id + " question in the table");
      assert.ok(at(table, win.name) !== -1, dec.id + " pick in the table");
      assert.ok(at(table, dec.pick.cost) !== -1, dec.id + " cost in the table");
    });
  });

  it("prints the briefing as goals, non-goals, product facts and research", function () {
    var d = load();
    var brief = html.slice(at(html, 'class="briefing"'), at(html, 'class="decision"'));
    d.scope.goals.forEach(function (g) { assert.ok(at(brief, g) !== -1, "goal: " + g); });
    d.scope.nonGoals.forEach(function (n) { assert.ok(at(brief, n) !== -1, "non-goal: " + n); });
    d.context.product.forEach(function (f) { assert.ok(at(brief, f) !== -1, "fact: " + f); });
    d.research.findings.forEach(function (f) { assert.ok(at(brief, f.claim) !== -1, "finding: " + f.claim); });
    assert.ok(at(brief, "Sources: " + d.context.sources.join("; ")) !== -1, "sources");
  });

  it("renders one block per decision, each with its question, options, table and pick", function () {
    var d = twoDecisions();
    var out = assembleProposal(d);
    assert.strictEqual(count(out, '<section class="decision"'), 2);
    d.decisions.forEach(function (dec) {
      assert.ok(at(out, dec.question) !== -1, dec.id + " question");
      assert.ok(at(out, 'id="' + dec.id + '"') !== -1, dec.id + " is addressable by its id");
      dec.options.forEach(function (o) {
        assert.ok(at(out, 'data-name="' + o.id + '"') !== -1, o.id + " drawn");
      });
      dec.pick.reasons.forEach(function (r) {
        assert.ok(at(out, r.text) !== -1, dec.id + " reason: " + r.text);
      });
      assert.ok(at(out, dec.pick.cost) !== -1, dec.id + " cost");
    });
  });

  it("prints each reason beside the criterion it argues from", function () {
    var d = load();
    var dec = d.decisions[0];
    var out = assembleProposal(d);
    dec.pick.reasons.forEach(function (r) {
      var crit = dec.comparison.criteria.filter(function (c) { return c.id === r.criterionId; })[0];
      assert.ok(crit, "the fixture's reason names a real criterion: " + r.criterionId);
      var line = '<span class="pick__crit">' + crit.label + "</span>";
      assert.ok(at(out, line) !== -1, "reason carries its criterion label: " + crit.label);
    });
  });

  it("throws when a pick names an option or a criterion that does not exist", function () {
    var bad = load();
    bad.decisions[0].pick.optionId = "nope";
    assert.throws(function () { assembleProposal(bad); }, /proposal-data:.*nope/);
    var bad2 = load();
    bad2.decisions[0].pick.reasons[0].criterionId = "nope";
    assert.throws(function () { assembleProposal(bad2); }, /proposal-data:.*nope/);
  });

  it("gives every option in a decision the same width, whatever the author declared", function () {
    var d = load();
    d.decisions[0].options[0].screen.width = 320;
    d.decisions[0].options[1].screen.width = 560;
    var out = assembleProposal(d);
    var widths = (out.match(/class="proposal-screen" data-name="[^"]+" style="width:(\d+)px"/g) || [])
      .map(function (m) { return Number(/width:(\d+)px/.exec(m)[1]); });
    assert.strictEqual(widths.length, d.decisions[0].options.length, "one width per option");
    widths.forEach(function (w) { assert.strictEqual(w, widths[0], "every option at the same width"); });
    assert.ok(widths[0] >= 320, "and at least the widest the author asked for, or the row budget");
  });

  it("caps the equalised width at the row budget for the option count", function () {
    var d = load();
    d.decisions[0].options.forEach(function (o) { o.screen.width = 720; });
    var n = d.decisions[0].options.length;
    var budget = { 2: 588, 3: 384, 4: 282 }[n];
    var out = assembleProposal(d);
    var w = Number(/class="proposal-screen" data-name="[^"]+" style="width:(\d+)px"/.exec(out)[1]);
    assert.strictEqual(w, budget, n + " options fit at " + budget + ", so 720 is capped");
  });

  it("prints an option's annotations as phrases under its drawing, at most three", function () {
    var d = load();
    d.decisions[0].options[0].screen.notes = ["Group name, not its id", "One row, always"];
    var out = assembleProposal(d);
    assert.ok(at(out, "Group name, not its id") !== -1);
    assert.strictEqual(count(out, '<ul class="option__notes">'), 1, "only the option that has notes gets a list");
  });

  it("prints a blocker inside its decision, and never in the open questions", function () {
    var d = load();
    d.decisions[0].blocker = "Whether a catalog can be scoped per group decides if one revoke is enough.";
    var out = assembleProposal(d);
    var block = out.slice(at(out, '<section class="decision"'), at(out, 'class="change"'));
    assert.ok(at(block, d.decisions[0].blocker) !== -1, "the blocker sits in the decision block");
    assert.ok(at(out, 'class="decision__blocker"') !== -1, "styled as a blocker");
  });

  it("omits what is still open when there is nothing open", function () {
    var d = load();
    delete d.openQuestions;
    var out = body(assembleProposal(d));
    assert.strictEqual(at(out, "oq__kind"), -1, "no empty section");
  });

  it("keeps the comparison table's glyphs so it survives greyscale", function () {
    assert.ok(at(html, "tone-good") !== -1 || at(html, "tone-mixed") !== -1, "tone classes still emitted");
    var tpl = fs.readFileSync(path.join(ROOT, "templates", "proposal-document.html"), "utf8");
    assert.ok(at(tpl, '.tone-good::before') !== -1, "the glyph rule survives");
  });

  it("binds every size to a token: no raw font-size and no font shorthand", function () {
    var tpl = fs.readFileSync(path.join(ROOT, "templates", "proposal-document.html"), "utf8");
    var doc = tpl.slice(at(tpl, "Document setting"));
    var raw = doc.match(/font-size:(?!\s*var\()[^;}]*/g) || [];
    // The breadboard place name is the one deliberate exception: it is drawn inside an
    // SVG at a size that has no token, and it is named here so it cannot spread silently.
    var allowed = raw.filter(function (r) { return r.indexOf("15px") === -1; });
    assert.deepStrictEqual(allowed, [], "every other font-size names a token");
    assert.deepStrictEqual(doc.match(/(^|[;{\s])font:[^;}]*/g) || [], [], "no font shorthand, which would set a size off the scale");
  });

  it("carries no hard-coded colour in the document setting", function () {
    var tpl = fs.readFileSync(path.join(ROOT, "templates", "proposal-document.html"), "utf8");
    var doc = tpl.slice(at(tpl, "Document setting"));
    assert.deepStrictEqual(doc.match(/#[0-9a-fA-F]{3,6}\b|\brgba?\(/g) || [], []);
  });

  it("renders the same bytes twice", function () {
    assert.strictEqual(assembleProposal(load()), assembleProposal(load()));
  });
});
