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
function body(h) {
  var i = h.indexOf("<body>");
  // Without this, a document missing <body> slices to its last character and every
  // "is this absent" assertion built on the helper passes on any input: the same trap
  // the helper exists to close, one level down.
  assert.notStrictEqual(i, -1, "the document has no <body> to measure");
  return h.slice(i);
}

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
  // Built inside the tests, never in the describe body. assembleProposal throws on a
  // document the schema rejects, and a throw in a describe body cancels every test in the
  // file while node --test still exits 0 and prints "# fail 0"; the only trace is an
  // unindented "not ok". The assertions below exist to catch exactly such a document, so
  // built eagerly they could report a crash but never a failure. Memoised, so still once.
  var cached = null;
  function html() { if (!cached) cached = assembleProposal(load()); return cached; }

  it("is one offline document with the FM stylesheet inlined and no external loads", function () {
    assert.ok(at(html(), "<!DOCTYPE html>") !== -1, "DOCTYPE");
    assert.ok(at(html(), "--fm-base-white") !== -1, "fm-base.css inlined");
    assert.ok(!/(src|href)\s*=\s*["']?(https?:)?\/\//i.test(html()), "no external src or href");
    assert.ok(!/\{\{[A-Z_]+\}\}/.test(html()), "no placeholder leak");
    assert.strictEqual(count(html(), "<script"), 1, "only the toggle listener");
  });

  // 2026-09-16. The document led with questions ("Question 1 of 2: What does the page show?")
  // and made a PM or designer work out what ships. It now leads with what ships: the answer,
  // a summary of the parts, one block per part, then the reasons to trust it.
  it("leads with what ships: answer, summary, parts, then the reasons to trust it", function () {
    var d = twoDecisions();
    d.decisions[0].blocker = "Whether the platform returns access in one call.";
    d.openQuestions = [{ kind: "open question", text: "What to call the page." }];
    d.breadboard = {
      places: [
        { id: "a", name: "Account menu", app: "explorer", affordances: ["Name"] },
        { id: "b", name: "Group", app: "administration", affordances: ["Members"] },
      ],
      connections: [{ from: "a", to: "b", label: "reads" }],
    };
    var out = body(assembleProposal(d));
    var order = [
      'class="ask"', 'class="answer"', 'class="decisions-at-a-glance"', '<section class="decision"', 'class="bb__svg"',
      ">Before we build<", 'class="change"', ">Background<", ">Other options<", ">Research<",
      'class="citations"', 'class="doc__latitude"',
    ];
    var last = -1;
    order.forEach(function (marker) {
      var i = at(out, marker);
      assert.ok(i > last, marker + " comes after the one before it (at " + i + ", previous " + last + ")");
      last = i;
    });
  });

  it("states the answer once, after the ask and before anything else", function () {
    var d = twoDecisions();
    var out = body(assembleProposal(d));
    assert.strictEqual(count(out, d.answer), 1, "the answer is stated once");
    assert.ok(at(out, 'class="ask"') !== -1 && at(out, 'class="ask"') < at(out, 'class="answer"'), "the ask comes first");
    assert.ok(at(out, 'class="answer"') < at(out, "<h2>What ships</h2>"), "before the summary");
  });

  it("never prints a decision's question: parts are named by what they build", function () {
    var d = twoDecisions();
    d.decisions[0].part = "Account menu";
    d.decisions[1].part = "Group name";
    d.context.question = "How should a user understand their access?";
    var out = body(assembleProposal(d));
    d.decisions.forEach(function (dec) {
      assert.strictEqual(count(out, dec.question), 0, dec.id + ": the question stays in the data");
      assert.ok(at(out, "<h2>" + dec.part + "</h2>") !== -1, dec.id + ": the part heads its block");
    });
    assert.strictEqual(at(out, d.context.question), -1, "nor the framing question");
    ["Question 1 of", "We propose", "Also considered", "The terrain", "The briefing", "What we found", "doc__question"].forEach(function (gone) {
      assert.strictEqual(at(out, gone), -1, "no longer printed: " + gone);
    });
  });

  it("names a part from the chosen option's surface when the file has no part", function () {
    var d = load();
    delete d.decisions[0].part;
    var win = d.decisions[0].options.filter(function (o) { return o.id === d.decisions[0].pick.optionId; })[0];
    win.anchor.surface = "the account menu";
    var out = body(assembleProposal(d));
    assert.ok(at(out, "<h2>Account menu</h2>") !== -1, "the surface, without its article, capitalised");
  });

  it("names every part in the bar, once each", function () {
    var d = twoDecisions();
    d.decisions[0].part = "Account menu";
    d.decisions[1].part = "Group name";
    var out = assembleProposal(d);
    var bar = out.slice(out.indexOf('<nav class="doc__jump"'));
    bar = bar.slice(0, bar.indexOf("</nav>"));
    d.decisions.forEach(function (dec) {
      assert.strictEqual(count(bar, 'href="#' + dec.id + '"'), 1, dec.id + ": one link");
      assert.ok(at(bar, dec.part) !== -1, dec.id + ": labelled by its part");
    });
  });

  it("omits the connections map when there is no breadboard, and the whole legend with it", function () {
    var out = body(assembleProposal(load()));
    assert.strictEqual(at(out, "bb__svg"), -1, "no diagram");
    assert.strictEqual(at(out, "bb__legend"), -1, "no legend");
    assert.strictEqual(at(out, "How it connects"), -1, "no empty section heading");
  });

  it("summarises the parts in What ships, from decisions[], only when there are two or more", function () {
    assert.strictEqual(at(body(html()), "decisions-at-a-glance"), -1, "one part needs no summary");
    var d = twoDecisions();
    var out = body(assembleProposal(d));
    assert.ok(at(out, ">What ships<") !== -1);
    var table = out.slice(at(out, "decisions-at-a-glance"));
    table = table.slice(0, at(table, "</table>"));
    d.decisions.forEach(function (dec) {
      var win = dec.options.filter(function (o) { return o.id === dec.pick.optionId; })[0];
      assert.ok(at(table, win.whatItIs) !== -1, dec.id + ": what we will build");
      assert.ok(at(table, dec.pick.cost) !== -1, dec.id + ": its cost");
    });
    assert.strictEqual(count(out, "<tbody>"), 1 + 2, "the summary plus one comparison per part");
  });

  it("prints Background as goals, not doing and how it works today", function () {
    var d = load();
    var out = body(assembleProposal(d));
    var bg = out.slice(at(out, ">Background<"), at(out, ">Other options<"));
    d.scope.goals.forEach(function (g) { assert.ok(at(bg, g) !== -1, "goal: " + g); });
    d.scope.nonGoals.forEach(function (n) { assert.ok(at(bg, n) !== -1, "non-goal: " + n); });
    d.context.product.forEach(function (f) { assert.ok(at(bg, f) !== -1, "fact: " + f); });
    d.research.findings.forEach(function (f) { assert.strictEqual(at(bg, f.claim), -1, "research is its own section: " + f.claim); });
  });

  it("cites every source once, near the end, with the gap beside them", function () {
    var d = load();
    d.context.gap = "The account menu has no capture.";
    var out = body(assembleProposal(d));
    var cites = out.slice(at(out, 'class="citations"'));
    assert.ok(at(out, 'class="citations"') > at(out, ">Research<"), "sources come after the research");
    assert.ok(at(out, 'class="citations"') < at(out, 'class="doc__latitude"'), "and before the closing line");
    d.context.sources.forEach(function (src) {
      var cut = src.indexOf(": ");
      var kind = cut === -1 ? "" : src.slice(0, cut);
      var text = cut === -1 ? src : src.slice(cut + 2);
      assert.strictEqual(count(out, text), 1, "cited once in the whole document: " + text);
      assert.ok(at(cites, text) !== -1, "cited in the sources: " + text);
      if (kind) assert.ok(at(cites, ">" + kind + "<") !== -1, "kind rendered as its own label: " + kind);
    });
    assert.strictEqual(count(out, d.context.gap), 1, "the gap is printed once");
    assert.ok(at(cites, d.context.gap) !== -1, "with the sources");
  });

  it("draws only the chosen option in a part block, with why, where it breaks and what it costs", function () {
    var d = twoDecisions();
    var out = body(assembleProposal(d));
    assert.strictEqual(count(out, '<section class="decision"'), 2, "one block per part");
    d.decisions.forEach(function (dec) {
      var block = out.slice(at(out, '<section class="decision" id="' + dec.id + '"'));
      block = block.slice(0, block.indexOf("</section>"));
      var win = dec.options.filter(function (o) { return o.id === dec.pick.optionId; })[0];
      assert.ok(at(block, 'data-name="' + win.id + '"') !== -1, dec.id + ": the chosen drawing");
      dec.options.forEach(function (o) {
        if (o.id !== win.id) assert.strictEqual(at(block, 'data-name="' + o.id + '"'), -1, dec.id + ": " + o.id + " is not in the part");
      });
      [win.whatItIs, win.breaksWhen, dec.pick.cost].forEach(function (s) {
        assert.strictEqual(count(block, s), 1, dec.id + ": printed once in the part: " + s);
      });
      dec.pick.reasons.forEach(function (r) { assert.ok(at(block, r.text) !== -1, dec.id + " reason: " + r.text); });
      assert.ok(at(block, 'class="decision__case"') < at(block, 'class="proposal-screen__col"'), dec.id + ": the case, then the drawing");
      assert.strictEqual(at(block, 'class="compare"'), -1, dec.id + ": the comparison lives under Other options");
    });
  });

  it("puts the other options and their comparison under Other options, one group per part", function () {
    var d = twoDecisions();
    var out = body(assembleProposal(d));
    var other = out.slice(at(out, ">Other options<"));
    d.decisions.forEach(function (dec, i) {
      var start = at(other, 'id="' + dec.id + '-options"');
      assert.notStrictEqual(start, -1, dec.id + ": a group");
      var next = i + 1 < d.decisions.length ? at(other, 'id="' + d.decisions[i + 1].id + '-options"') : other.length;
      var group = other.slice(start, next);
      dec.options.forEach(function (o) {
        if (o.id === dec.pick.optionId) return;
        assert.ok(at(group, 'data-name="' + o.id + '"') !== -1, dec.id + ": " + o.id + " drawn in its group");
      });
      assert.strictEqual(count(group, 'class="compare"'), 1, dec.id + ": and compared there");
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

  function drawnWidths(out) {
    return (out.match(/class="proposal-screen" data-name="([^"]+)" style="width:(\d+)px"/g) || []).map(function (m) {
      var p = /data-name="([^"]+)" style="width:(\d+)px/.exec(m);
      return { id: p[1], w: Number(p[2]) };
    });
  }

  it("draws every option in a decision at the widest declared width, the proposal and its rivals alike", function () {
    var d = load();
    d.decisions[0].options[0].screen.width = 320;
    d.decisions[0].options[1].screen.width = 560;
    var widths = drawnWidths(body(assembleProposal(d)));
    assert.strictEqual(widths.length, d.decisions[0].options.length, "one drawing per option");
    widths.forEach(function (x) { assert.strictEqual(x.w, 560, x.id + " is drawn at " + x.w + ", not at the widest declared"); });
  });

  // 2026-09-16. A budget capped every drawing by its decision's option count (588, 384, 282), so a
  // drawing composed at 480 was laid out at 384 and its content spilled past the frame, on DIP-I-540
  // and again on DS-116. Nothing squeezes a drawing now: it is drawn at the width it was composed at.
  it("never squeezes a drawing, whatever the option count, and holds it at 1200 at most", function () {
    var d = load();
    d.decisions[0].options.forEach(function (o) { o.screen.width = 720; });
    drawnWidths(body(assembleProposal(d))).forEach(function (x) { assert.strictEqual(x.w, 720, x.id + " is squeezed to " + x.w); });
    d.decisions[0].options.forEach(function (o) { o.screen.width = 1600; });
    drawnWidths(body(assembleProposal(d))).forEach(function (x) { assert.strictEqual(x.w, 1200, x.id + " is drawn at " + x.w); });
  });

  it("sets a drawing wider than 720 below its case, and one at 720 beside it", function () {
    var d = load();
    d.decisions[0].options.forEach(function (o) { o.screen.width = 720; });
    var out = body(assembleProposal(d));
    assert.notStrictEqual(at(out, '<div class="decision__lead">'), -1, "a 720 drawing is not beside its case");
    d.decisions[0].options.forEach(function (o) { o.screen.width = 960; });
    out = body(assembleProposal(d));
    assert.notStrictEqual(at(out, '<div class="decision__lead decision__lead--stacked">'), -1, "a 960 drawing is not below its case");
    var tpl = fs.readFileSync(path.join(ROOT, "templates", "proposal-document.html"), "utf8");
    var i = tpl.indexOf("\n    .decision__lead--stacked {");
    assert.notStrictEqual(i, -1, "the stacked block has no rule");
    assert.match(tpl.slice(i, tpl.indexOf("}", i)), /flex-direction:\s*column/, "and the rule does not stack it");
  });

  it("prints what each drawing is built from, and makes a new component loud", function () {
    var d = load();
    // The chosen drawing says what it is built from; a rival keeps only what it would add,
    // because an addition is a cost and a list of components is not.
    var chosen = d.decisions[0].options.filter(function (o) { return o.id === d.decisions[0].pick.optionId; })[0];
    var rival = d.decisions[0].options.filter(function (o) { return o.id !== d.decisions[0].pick.optionId; })[0];
    chosen.uses = ["read-only-tag", "tooltip-default"];
    delete rival.uses;
    rival.adds = [
      { component: "access summary row", why: "no component holds a computed union over several groups" },
    ];
    var out = assembleProposal(d);
    assert.ok(at(out, "Built from read-only-tag, tooltip-default") !== -1, "the ordinary case is stated plainly");
    assert.ok(at(out, "access summary row. no component holds a computed union") !== -1, "an addition names itself and why");
    var tpl = fs.readFileSync(path.join(ROOT, "templates", "proposal-document.html"), "utf8");
    function rule(sel) {
      var i = tpl.indexOf("\n    " + sel + " {");
      assert.ok(i !== -1, sel);
      return tpl.slice(i, tpl.indexOf("}", i));
    }
    assert.ok(rule(".option__built").indexOf("--fm-text-tertiary") !== -1, "built-from is quiet");
    assert.ok(rule(".option__adds").indexOf("--fm-brand") !== -1, "an addition is not, because it is uncosted work");
  });

  it("prints an option's annotations as one quiet run, not an uppercase list", function () {
    var d = load();
    d.decisions[0].options.filter(function (o) { return o.id === d.decisions[0].pick.optionId; })[0].screen.notes = ["Group name, not its id", "One row, always"];
    var out = assembleProposal(d);
    assert.ok(at(out, "Group name, not its id &middot; One row, always") !== -1, "joined by middots, in the order authored");
    assert.strictEqual(count(out, '<ul class="option__notes">'), 0, "no list: that was the third voice under one drawing");
    var tpl = fs.readFileSync(path.join(ROOT, "templates", "proposal-document.html"), "utf8");
    var i = tpl.indexOf("\n    .option__notes {");
    assert.ok(i !== -1, "the annotations still have a rule");
    assert.strictEqual(tpl.slice(i, tpl.indexOf("}", i)).indexOf("uppercase"), -1, "and it is not uppercase");
  });

  it("gathers blockers and open questions under Before we build, blockers first", function () {
    var d = twoDecisions();
    d.decisions[1].part = "Group name";
    d.decisions[1].blocker = "Whether a group has a readable name today.";
    d.openQuestions = [{ kind: "rabbit hole", text: "Long group lists." }];
    var out = body(assembleProposal(d));
    var sec = out.slice(at(out, ">Before we build<"));
    sec = sec.slice(0, at(sec, "</section>"));
    assert.ok(at(sec, d.decisions[1].blocker) !== -1, "the blocker is here");
    assert.ok(at(sec, d.decisions[1].blocker) < at(sec, "Long group lists."), "before the open questions");
    assert.ok(at(sec, "Blocker, Group name.") !== -1, "naming its part");
    assert.ok(at(sec, 'class="decision__blocker"') !== -1, "styled as a blocker");
    assert.ok(at(sec, ">Risk<") !== -1, "a rabbit hole reads as a risk");
    assert.strictEqual(count(out, d.decisions[1].blocker), 1, "printed once");
  });

  it("omits Before we build when nothing blocks and nothing is open", function () {
    var d = load();
    delete d.decisions[0].blocker;
    delete d.openQuestions;
    var out = body(assembleProposal(d));
    assert.strictEqual(at(out, "Before we build"), -1, "no empty section");
    assert.strictEqual(at(out, "oq__kind"), -1, "and no stray label");
  });

  it("puts users before admins in What changes", function () {
    var out = body(assembleProposal(load()));
    assert.ok(at(out, ">For users<") !== -1 && at(out, ">For users<") < at(out, ">For admins<"));
  });

  it("marks the picked column in every comparison, so the table says who won while it is read", function () {
    var d = load();
    var out = assembleProposal(d);
    var blocks = out.split('<table class="compare">').slice(1);
    assert.strictEqual(blocks.length, d.decisions.length, "one comparison per decision");
    blocks.forEach(function (block, i) {
      var table = block.slice(0, at(block, "</table>"));
      var dec = d.decisions[i];
      var head = table.slice(at(table, "<thead>"), at(table, "</thead>"));
      var marked = head.split('class="compare__pick"').length - 1;
      assert.strictEqual(marked, 1, dec.id + ": exactly one column is marked");
      var win = dec.options.filter(function (o) { return o.id === dec.pick.optionId; })[0];
      var cell = head.slice(at(head, 'class="compare__pick"'));
      assert.ok(at(cell, win.name) !== -1 && at(cell, win.name) < at(cell, "</th>"), dec.id + ": and it is the pick's column");
      var body = table.slice(at(table, "<tbody>"));
      assert.strictEqual(
        body.split("compare__pick").length - 1,
        dec.comparison.criteria.length,
        dec.id + ": every row carries the mark down the picked column",
      );
    });
  });

  it("keeps the comparison scannable: a glyph on its own line over the phrase", function () {
    var doc = html();
    var body = doc.slice(doc.indexOf("<body>"));
    assert.ok(at(body, "tone-good") !== -1 || at(body, "tone-mixed") !== -1,
      "a tone class reaches the table, not just the stylesheet that defines it");
    assert.ok(at(body, '<span class="compare__mark"></span>') !== -1, "every cell carries its mark as its own element");
    var tpl = fs.readFileSync(path.join(ROOT, "templates", "proposal-document.html"), "utf8");
    assert.ok(at(tpl, ".tone-good .compare__mark::before") !== -1, "the glyph rule survives, so it reads in greyscale and print");
    var i = tpl.indexOf("\n    .compare__mark {");
    assert.ok(tpl.slice(i, tpl.indexOf("}", i)).indexOf("display: block") !== -1, "and the mark is on its own line, not inline with the words");
  });

  it("never tells a reader the decision is made: the document proposes, the reader decides", function () {
    var d = twoDecisions();
    var out = body(assembleProposal(d));
    ["What we decided", "What we picked", "We pick", ">Picked<", "Decision 1 of"].forEach(function (past) {
      assert.strictEqual(out.indexOf(past), -1, "nothing a reader sees says: " + past);
    });
    // The list above names phrases, and the fold summary once said "not picked" past all of
    // them. Read the words a reader sees, with the markup and its class names taken out, in
    // both fixtures: authored text reaches the page too.
    var acceptance = JSON.parse(fs.readFileSync(path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496.json"), "utf8"));
    [out, body(assembleProposal(acceptance))].forEach(function (page, i) {
      var text = page.replace(/<[^>]*>/g, " ");
      var hit = /.{0,40}\bpick(ed|s)?\b.{0,40}/i.exec(text);
      assert.strictEqual(hit, null, "document " + i + ": a reader sees the word pick: " + (hit && hit[0]));
    });
    assert.ok(out.indexOf(">Proposed<") !== -1, "the chosen column is marked Proposed");
  });

  it("ranks a section label below a decision question, so only the statements are loud", function () {
    var tpl = fs.readFileSync(path.join(ROOT, "templates", "proposal-document.html"), "utf8");
    function ruleFor(sel) {
      var i = tpl.indexOf("\n    " + sel + " {");
      assert.ok(i !== -1, "the template still carries a rule for " + sel);
      return tpl.slice(i, tpl.indexOf("}", i));
    }
    var label = ruleFor(".doc__section > h2");
    var question = ruleFor(".decision > h2");
    var answer = ruleFor(".answer");
    assert.ok(label.indexOf("var(--doc-h2)") === -1, "a section label does not sit at question scale");
    assert.ok(label.indexOf("var(--doc-label)") !== -1, "it sits on the label register");
    assert.ok(label.indexOf("uppercase") !== -1, "and reads as a label, not a sentence");
    assert.ok(question.indexOf("var(--doc-h2)") !== -1, "a decision question stays at h2");
    assert.ok(answer.indexOf("var(--doc-h2)") !== -1, "and the answer is tied with it");
  });

  it("gives a decision block a heavier boundary than a framing section", function () {
    var tpl = fs.readFileSync(path.join(ROOT, "templates", "proposal-document.html"), "utf8");
    function px(sel, prop) {
      var i = tpl.indexOf("\n    " + sel + " {");
      assert.ok(i !== -1, sel);
      var rule = tpl.slice(i, tpl.indexOf("}", i));
      var m = rule.match(new RegExp(prop + ":[^;]*?(\\d+)px"));
      assert.ok(m, prop + " on " + sel);
      return Number(m[1]);
    }
    assert.ok(
      px(".decision", "border-top") > px(".doc__section", "border-top"),
      "the argument is bounded more heavily than the framing around it",
    );
  });

  it("leaves more air between two sections than inside one", function () {
    var tpl = fs.readFileSync(path.join(ROOT, "templates", "proposal-document.html"), "utf8");
    var i = tpl.indexOf("\n    .doc__section {");
    var rule = tpl.slice(i, tpl.indexOf("}", i));
    var below = Number((rule.match(/margin: 0 0 (\d+)px/) || [])[1]);
    var above = Number((rule.match(/padding: (\d+)px 0 0/) || [])[1]);
    assert.ok(below && above, "the section rule still sets both");
    assert.ok(below > above * 1.5, "the gap to the next section (" + below + ") clears the gap to its own heading (" + above + ")");
  });

  it("binds every size to a token: no raw font-size and no font shorthand", function () {
    var tpl = fs.readFileSync(path.join(ROOT, "templates", "proposal-document.html"), "utf8");
    var doc = tpl.slice(at(tpl, "Document setting"));
    var raw = doc.match(/font-size:(?!\s*var\()[^;}]*/g) || [];
    // The breadboard place name is the one deliberate exception: it is drawn inside an
    // SVG at a size that has no token, and it is named here so it cannot spread silently.
    // It stepped 15px -> 18px when the scale moved on 2026-09-15, because it has to read
    // above the affordances under it and those are --doc-caption, which is now 15px.
    var allowed = raw.filter(function (r) { return r.indexOf("18px") === -1; });
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

describe("assembleProposal, the DIP-I-496 acceptance document", function () {
  var FULL = path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496.json");
  function full() { return JSON.parse(fs.readFileSync(FULL, "utf8")); }
  // Built inside the tests, never in the describe body. assembleProposal throws on a
  // document the schema rejects, and a throw in a describe body cancels every test in the
  // file while node --test still exits 0 and prints "# fail 0"; the only trace is an
  // unindented "not ok". The assertions below exist to catch exactly such a document, so
  // built eagerly they could report a crash but never a failure. Memoised, so still once.
  var cached = null;
  function html() { if (!cached) cached = assembleProposal(full()); return cached; }

  // Prose the reader reads, counted from the data rather than from the rendered HTML.
  // A drawing's words are labels in a picture, and a breadboard affordance is a label on
  // a box: neither is prose to wade through, and neither counts. Counting the HTML instead
  // would mean matching the end of a fragment with a regex, which a fragment's own nested
  // divs defeat, so the number would move with the drawings rather than with the writing.
  function proseWords(d) {
    var text = [];
    function push() {
      for (var i = 0; i < arguments.length; i++) if (arguments[i]) text.push(String(arguments[i]));
    }
    push(d.answer, d.latitude, d.context.gap,
         (d.change || {}).adminSide, (d.change || {}).userSide);
    (d.context.product || []).forEach(function (f) { push(f); });
    (d.scope.goals || []).forEach(function (g) { push(g); });
    (d.scope.nonGoals || []).forEach(function (g) { push(g); });
    (d.research.findings || []).forEach(function (f) { push(f.claim); });
    push(d.research.skippedBecause);
    (d.openQuestions || []).forEach(function (q) { push(q.text); });
    (d.decisions || []).forEach(function (dec) {
      push(dec.part, dec.blocker, dec.pick.cost);
      dec.options.forEach(function (o) {
        push(o.name, o.whatItIs, o.breaksWhen, o.verdict);
        (o.screen.notes || []).forEach(function (n) { push(n); });
      });
      dec.comparison.criteria.forEach(function (c) {
        push(c.label);
        dec.options.forEach(function (o) {
          var cell = (dec.comparison.cells[o.id] || {})[c.id];
          if (cell) push(cell.text);
        });
      });
      dec.pick.reasons.forEach(function (r) { push(r.text); });
    });
    return text.join(" ").split(/\s+/).filter(Boolean).length;
  }

  it("carries three decisions", function () {
    assert.strictEqual(full().decisions.length, 3);
    assert.strictEqual(count(html(), '<section class="decision"'), 3);
  });

  it("puts the first part drawing right after the summary, before the background", function () {
    var out = body(html());
    var glance = at(out, "decisions-at-a-glance");
    var firstDrawing = at(out, 'class="proposal-screen"');
    assert.ok(glance !== -1 && firstDrawing !== -1, "both present");
    assert.ok(glance < firstDrawing, "the summary, then the design");
    assert.ok(firstDrawing < at(out, ">Background<"), "the background follows the design");
    assert.ok(firstDrawing < at(out, 'class="bb__svg"'), "and so does the map");
  });

  it("stays under 400 words of prose", function () {
    var n = proseWords(full());
    assert.ok(n < 400, "prose words: " + n + ", against about 950 in the shape this replaces");
  });

  it("reads as a short document when the same ticket carries one decision", function () {
    var one = full();
    one.decisions = [one.decisions[0]];
    delete one.breadboard;
    var out = body(assembleProposal(one));
    assert.strictEqual(at(out, "decisions-at-a-glance"), -1, "no table indexing a single decision");
    assert.strictEqual(at(out, "bb__svg"), -1, "no terrain");
    assert.ok(proseWords(one) < proseWords(full()), "and it is shorter, not a truncated long document");
  });

  it("gives every decision a pick whose reasons all name a criterion in that decision", function () {
    full().decisions.forEach(function (d) {
      var ids = d.comparison.criteria.map(function (c) { return c.id; });
      d.pick.reasons.forEach(function (r) {
        assert.ok(ids.indexOf(r.criterionId) !== -1, d.id + ": " + r.criterionId + " is one of " + ids.join(", "));
      });
      assert.ok(d.pick.cost.trim().length > 0, d.id + " states a cost");
    });
  });
  // The spec's Voice rule: the document never describes how it was made, and provenance
  // is one line saying who and when. The footer used to close every document with the
  // data file's path, the --from flag and a slash command, and nothing asserted against
  // it. These names are how-it-was-made, so they are checked over the whole document,
  // not only the footer.
  describe("voice", function () {
    // A named list, so this is a regression gate on the words that were there, not a
    // general Voice gate: a document naming some other file still passes. The general
    // version needs a rule for what counts as a file name, and there is no such rule.
    var MADE_OF = ["proposal-data.json", "--from", "/generate-flow", "assemble-preview", "schemas/", "Follow-ups"];
    it("never names the file, the flag or the command that built it", function () {
      var FULL_PATH = path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496.json");
      [load(), twoDecisions(), JSON.parse(fs.readFileSync(FULL_PATH, "utf8"))].forEach(function (d) {
        var out = body(assembleProposal(d));
        MADE_OF.forEach(function (needle) {
          assert.strictEqual(at(out, needle), -1, "the document says " + needle);
        });
      });
    });

    it("still signs itself, with who and when and nothing after the date", function () {
      var d = load();
      var out = body(assembleProposal(d));
      var i = at(out, 'class="doc__footer"');
      assert.notStrictEqual(i, -1, "there is a footer");
      var line = out.slice(i, out.indexOf("</p>", i));
      assert.ok(line.indexOf(d.meta.skill) !== -1, "names the skill");
      assert.ok(line.indexOf(d.meta.date) !== -1, "names the date");
      assert.match(line, new RegExp(d.meta.date.replace(/-/g, "\\-") + "\\.$"), "the date ends it");
    });
  });
});

// 2026-09-16. The DS-116 document still ran 8.8 screens after the reorder, and 2,500px of that
// was the options not chosen. A reader approving a direction reads the design; the options and
// the research are there for the reader who asks why. So both sit folded under their heading,
// one click open, and nothing above them folds.
function foldedSection(out, heading) {
  var start = at(out, "<h2>" + heading + "</h2>");
  assert.notStrictEqual(start, -1, "there is no " + heading + " section");
  var sec = out.slice(start);
  return sec.slice(0, at(sec, "</section>"));
}

describe("what a reader opens on demand", function () {
  it("folds the other options under their heading, every drawing and comparison inside", function () {
    var d = twoDecisions();
    var sec = foldedSection(body(assembleProposal(d)), "Other options");
    assert.strictEqual(count(sec, '<details class="doc__more">'), 1, "one fold, closed");
    assert.ok(at(sec, "<details") > at(sec, "<h2>Other options</h2>"), "the heading stays outside the fold, where a screen reader lists it");
    var inside = sec.slice(at(sec, "</summary>"), sec.lastIndexOf("</details>"));
    d.decisions.forEach(function (dec) {
      dec.options.forEach(function (o) {
        if (o.id !== dec.pick.optionId) assert.ok(at(inside, 'data-name="' + o.id + '"') !== -1, o.id + " is inside the fold");
      });
    });
    assert.strictEqual(count(inside, 'class="compare"'), 2, "both comparisons are inside the fold");
    var rest = d.decisions.reduce(function (n, dec) { return n + dec.options.length - 1; }, 0);
    assert.ok(at(sec, "<summary>" + rest + " options, compared with the proposal</summary>") !== -1, "the summary counts what is folded: " + sec.slice(at(sec, "<summary>"), at(sec, "</summary>")));
  });

  it("counts a single option in the singular", function () {
    var d = load();
    var dec = d.decisions[0];
    var other = dec.options.filter(function (o) { return o.id !== dec.pick.optionId; })[0];
    dec.options = dec.options.filter(function (o) { return o.id === dec.pick.optionId || o.id === other.id; });
    Object.keys(dec.comparison.cells).forEach(function (id) {
      if (id !== dec.pick.optionId && id !== other.id) delete dec.comparison.cells[id];
    });
    var sec = foldedSection(body(assembleProposal(d)), "Other options");
    assert.ok(at(sec, "<summary>1 option, compared with the proposal</summary>") !== -1, sec.slice(at(sec, "<summary>"), at(sec, "</summary>")));
  });

  it("folds nothing above the other options", function () {
    var out = body(assembleProposal(twoDecisions()));
    assert.strictEqual(at(out.slice(0, at(out, "<h2>Other options</h2>")), "<details"), -1, "part of the design is folded");
  });

  it("opens every fold before printing, so a saved PDF carries what the page folds", function () {
    var out = body(assembleProposal(load()));
    var script = out.slice(out.lastIndexOf("<script>") + "<script>".length, out.lastIndexOf("</script>"));
    var listeners = {};
    var folds = [{ open: false }, { open: false }];
    var win = { addEventListener: function (type, fn) { listeners["window:" + type] = fn; } };
    var doc = {
      addEventListener: function (type, fn) { listeners["document:" + type] = fn; },
      querySelectorAll: function () { return folds; },
    };
    new Function("window", "document", script)(win, doc);
    assert.strictEqual(typeof listeners["window:beforeprint"], "function", "nothing opens the folds for print");
    listeners["window:beforeprint"]();
    folds.forEach(function (f, i) { assert.strictEqual(f.open, true, "fold " + i + " prints closed"); });
  });
});

// 2026-09-16. DS-116 was titled "My access, with no new page and no new control": the answer and
// its constraints, not what anyone asked for, and the ticket record sat in the file unread. A
// reader who never saw the ticket met a solution before they knew the problem. The document now
// opens with the ask, and the ticket it came from, above the answer.
describe("the ask comes first", function () {
  function withAsk() {
    var d = load();
    d.context.ask = "A user cannot see which permission group they belong to, so they cannot find its guidelines.";
    d.source = { system: "jira", id: "DS-116", title: "[EXPLORER] Ability to show user roles permission", body: "The ticket body as it arrived." };
    return d;
  }
  function askSection(out) {
    var start = at(out, "<h2>The ask</h2>");
    assert.notStrictEqual(start, -1, "there is no ask section");
    var sec = out.slice(start);
    return sec.slice(0, at(sec, "</section>"));
  }

  it("opens with what was asked, before the answer", function () {
    var d = withAsk();
    var out = body(assembleProposal(d));
    var first = out.slice(at(out, '<section class="doc__section">'));
    first = first.slice(0, at(first, "</section>"));
    assert.notStrictEqual(at(first, "<h2>The ask</h2>"), -1, "the first section is not the ask: " + first.slice(0, 160));
    assert.notStrictEqual(at(first, '<p class="ask">' + d.context.ask + "</p>"), -1, "the ask is not printed in it");
    assert.ok(at(out, 'class="ask"') < at(out, 'class="answer"'), "the answer comes before the ask");
    assert.strictEqual(count(out, d.context.ask), 1, "the ask is printed once");
  });

  it("names the ticket it came from, in the ticket's own words, and not its body", function () {
    var d = withAsk();
    var sec = askSection(body(assembleProposal(d)));
    assert.notStrictEqual(at(sec, "From Jira DS-116: &ldquo;[EXPLORER] Ability to show user roles permission&rdquo;"), -1, sec);
    d.source.system = "pasted";
    var out = body(assembleProposal(d));
    assert.notStrictEqual(at(askSection(out), "From DS-116: &ldquo;"), -1, "a pasted ticket has no system to name");
    assert.strictEqual(at(out, d.source.body), -1, "the ticket body is the input record, not the page");
  });

  it("escapes what it prints", function () {
    var d = withAsk();
    d.context.ask = "Show <b>groups</b> & roles.";
    d.source.title = "Roles <i>now</i>";
    var sec = askSection(body(assembleProposal(d)));
    assert.strictEqual(at(sec, "<b>"), -1, "the ask is printed raw");
    assert.strictEqual(at(sec, "<i>"), -1, "the ticket title is printed raw");
    assert.notStrictEqual(at(sec, "Show &lt;b&gt;groups&lt;/b&gt; &amp; roles."), -1, sec);
  });

  it("prints the ticket alone for a file written before the ask, and no section with neither", function () {
    var d = withAsk();
    delete d.context.ask;
    var out = body(assembleProposal(d));
    assert.notStrictEqual(at(askSection(out), "From Jira DS-116"), -1, "the ticket is dropped");
    assert.strictEqual(at(out, 'class="ask"'), -1, "an empty ask is printed");
    delete d.source;
    assert.strictEqual(at(body(assembleProposal(d)), "<h2>The ask</h2>"), -1, "an empty section is printed");
  });

  it("prints no ticket line for a source that names no ticket", function () {
    [{ system: "jira" }, { system: "github", id: "  ", title: "  " }].forEach(function (src) {
      var d = withAsk();
      d.source = Object.assign({ body: "The ticket body." }, src);
      var sec = askSection(body(assembleProposal(d)));
      assert.strictEqual(at(sec, "ask__ticket"), -1, JSON.stringify(src) + " prints: " + sec);
    });
  });

  it("does not quote the ticket title when it is already the page title", function () {
    var d = withAsk();
    d.source.title = d.meta.title;
    var out = body(assembleProposal(d));
    assert.strictEqual(count(out, d.meta.title), 1, "the title prints twice");
    assert.notStrictEqual(at(askSection(out), "From Jira DS-116</p>"), -1, "the ticket id is dropped with it");
  });

  it("labels the answer as the proposal", function () {
    var out = body(assembleProposal(withAsk()));
    var start = at(out, "<h2>Proposal</h2>");
    assert.notStrictEqual(start, -1, "the answer has no label");
    var sec = out.slice(start);
    sec = sec.slice(0, at(sec, "</section>"));
    assert.notStrictEqual(at(sec, 'class="answer"'), -1, "the label is not on the answer");
  });
});

// 2026-09-16 review. A file with no part is headed from its chosen option's surface, and the
// surface is authored text: it can carry stray spaces, or be empty.
describe("a part named from its surface", function () {
  it("trims the surface, drops its article, and falls back to the id in words", function () {
    var d = load();
    var dec = d.decisions[0];
    delete dec.part;
    var win = dec.options.filter(function (o) { return o.id === dec.pick.optionId; })[0];
    win.anchor.surface = "  the account menu ";
    var out = body(assembleProposal(d));
    assert.notStrictEqual(at(out, '<section class="decision" id="' + dec.id + '"><h2>Account menu</h2>'), -1, "the surface is not trimmed");
    win.anchor.surface = "";
    out = body(assembleProposal(d));
    var words = dec.id.replace(/-/g, " ");
    var expected = words.charAt(0).toUpperCase() + words.slice(1);
    assert.notStrictEqual(at(out, '<section class="decision" id="' + dec.id + '"><h2>' + expected + "</h2>"), -1, "no heading from the id: " + expected);
  });
});

// 2026-09-16. Under each option not chosen sat six things: a caption, a run of notes joined by
// middots, what it is, where it breaks, the components it is built from, and a verdict tag that
// looked like a button. Most of them said the same thing, in a 276px column. A rival now carries
// its name, its drawing, and one line: the verdict, then where it breaks.
describe("an option not chosen, read at a glance", function () {
  var esc = require("../../scripts/lib/renderer.js").fmHtmlMap.esc;
  function card(out, id) {
    var start = out.lastIndexOf('<div class="proposal-screen__col"', at(out, 'data-name="' + id + '"'));
    assert.notStrictEqual(start, -1, "no card for " + id);
    var rest = out.slice(start + 1);
    var ends = [rest.indexOf('<div class="proposal-screen__col"'), rest.indexOf('<div class="compare-block">')].filter(function (i) { return i !== -1; });
    return out.slice(start, start + 1 + Math.min.apply(null, ends));
  }
  function pieces(d) {
    var dec = d.decisions[0];
    return {
      chosen: dec.options.filter(function (o) { return o.id === dec.pick.optionId; })[0],
      rival: dec.options.filter(function (o) { return o.id !== dec.pick.optionId; })[0],
    };
  }

  it("shows its name, its drawing, and one line: the verdict, then where it breaks", function () {
    var d = load();
    var rival = pieces(d).rival;
    rival.uses = ["menu-dropdown"];
    rival.screen.notes = ["a phrase about the drawing"];
    var c = card(body(assembleProposal(d)), rival.id);
    var name = '<p class="option__name">' + esc(rival.name) + "</p>";
    assert.notStrictEqual(at(c, name), -1, "the card has no name: " + c.slice(0, 200));
    assert.ok(at(c, name) < at(c, 'class="proposal-screen"'), "the name does not head the card");
    var verdict = esc(rival.verdict) + (/[.!?\u2026]["'\u201d\u2019]?$/.test(rival.verdict) ? "" : ".");
    var why = '<p class="option__why"><b>' + verdict + "</b> " + esc(rival.breaksWhen) + "</p>";
    assert.notStrictEqual(at(c, why), -1, "no single line of verdict and break: " + c.slice(c.lastIndexOf("</div></div>")));
    [esc(rival.whatItIs), "a phrase about the drawing", "Built from", "fm-tag"].forEach(function (gone) {
      assert.strictEqual(at(c, gone), -1, "the card still carries: " + gone);
    });
  });

  it("names its surface only when it differs from the proposal's", function () {
    var d = load();
    var p = pieces(d);
    p.rival.anchor = JSON.parse(JSON.stringify(p.chosen.anchor));
    var c = card(body(assembleProposal(d)), p.rival.id);
    assert.strictEqual(at(c, "proposal-screen__anchor"), -1, "the same surface is named on every card");
    p.rival.anchor.surface = "the user profile page";
    c = card(body(assembleProposal(d)), p.rival.id);
    assert.notStrictEqual(at(c, "the user profile page"), -1, "a different surface is not named");
    p.rival.anchor = JSON.parse(JSON.stringify(p.chosen.anchor));
    p.rival.anchor.app = p.chosen.anchor.app === "studio" ? "explorer" : "studio";
    c = card(body(assembleProposal(d)), p.rival.id);
    assert.notStrictEqual(at(c, "proposal-screen__anchor"), -1, "the same surface in another app is not named");
  });

  it("closes the verdict as a sentence once, and prints no lone stop for an empty one", function () {
    var cases = [
      ["Reads as a control", "<b>Reads as a control.</b> "],
      ["Too heavy\u2026", "<b>Too heavy\u2026</b> "],
      ["Reads as \"Edit.\"", "<b>" + esc("Reads as \"Edit.\"") + "</b> "],
      ["Why a page?  ", "<b>Why a page?</b> "],
    ];
    cases.forEach(function (k) {
      var d = load();
      var rival = pieces(d).rival;
      rival.verdict = k[0];
      var c = card(body(assembleProposal(d)), rival.id);
      assert.notStrictEqual(at(c, '<p class="option__why">' + k[1]), -1, JSON.stringify(k[0]) + " printed as: " + c.slice(at(c, "option__why") - 10, at(c, "option__why") + 120));
    });
    ["", "   "].forEach(function (empty) {
      var d = load();
      var rival = pieces(d).rival;
      rival.verdict = empty;
      var c = card(body(assembleProposal(d)), rival.id);
      assert.notStrictEqual(at(c, '<p class="option__why">' + esc(rival.breaksWhen) + "</p>"), -1, JSON.stringify(empty) + " printed as: " + c.slice(at(c, "option__why") - 10, at(c, "option__why") + 120));
    });
  });
});
