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

  it("renders the nine elements in order, answer first and latitude last", function () {
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
      'class="citations"',
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

  it("states the answer once and never restates the picks beneath it", function () {
    var d = twoDecisions();
    var out = assembleProposal(d);
    assert.strictEqual(count(out, d.answer), 1, "the answer is stated once");
    assert.strictEqual(count(out, "answer-pick"), 0, "the picks are not listed under the answer");
    assert.ok(at(out, 'class="decisions-at-a-glance"') !== -1, "the table is the summary instead");
  });

  it("prints each decision's question twice at most: the summary row and its own heading", function () {
    var d = twoDecisions();
    var out = body(assembleProposal(d));
    d.decisions.forEach(function (dec) {
      assert.strictEqual(count(out, dec.question), 2, dec.id + ": summary row and heading, nothing more");
    });
  });

  it("omits the terrain when there is no breadboard, and the whole legend with it", function () {
    var out = body(assembleProposal(load()));
    assert.strictEqual(at(out, "bb__svg"), -1, "no diagram");
    assert.strictEqual(at(out, "bb__legend"), -1, "no legend");
    assert.strictEqual(at(out, "The terrain"), -1, "no empty section heading");
  });

  it("omits the decision table for a one-decision document and prints it for more", function () {
    assert.strictEqual(at(body(html()), "decisions-at-a-glance"), -1, "one decision needs no index of itself");
    var out = assembleProposal(twoDecisions());
    assert.ok(at(out, "decisions-at-a-glance") !== -1, "two decisions get the table");
    assert.strictEqual(count(out, "<tbody>"), 1 + 2, "the glance table plus one comparison per decision");
  });

  it("derives the decision table from decisions[], never from an authored field", function () {
    var d = twoDecisions();
    var out = assembleProposal(d);
    // Slice the BODY. The first "decisions-at-a-glance" in the file is the CSS rule, so a
    // slice from there begins inside the stylesheet and swallows the answer section, and
    // two of the three assertions below were satisfied by the answer picks instead.
    var body = out.slice(out.indexOf("<body>"));
    var table = body.slice(at(body, "decisions-at-a-glance"), at(body, 'class="briefing"'));
    d.decisions.forEach(function (dec) {
      var win = dec.options.filter(function (o) { return o.id === dec.pick.optionId; })[0];
      assert.ok(at(table, dec.question) !== -1, dec.id + " question in the table");
      assert.ok(at(table, win.name) !== -1, dec.id + " pick in the table");
      assert.ok(at(table, dec.pick.cost) !== -1, dec.id + " cost in the table");
    });
  });

  it("prints the briefing as goals, non-goals, product facts and research", function () {
    var d = load();
    var doc = html();
    var brief = doc.slice(at(doc, 'class="briefing"'), at(doc, 'class="decision"'));
    d.scope.goals.forEach(function (g) { assert.ok(at(brief, g) !== -1, "goal: " + g); });
    d.scope.nonGoals.forEach(function (n) { assert.ok(at(brief, n) !== -1, "non-goal: " + n); });
    d.context.product.forEach(function (f) { assert.ok(at(brief, f) !== -1, "fact: " + f); });
    d.research.findings.forEach(function (f) { assert.ok(at(brief, f.claim) !== -1, "finding: " + f.claim); });
    assert.strictEqual(count(brief, "Sources:"), 0, "the sources moved to the citations section");
  });

  it("cites every source once, at the end, split into its kind and its text", function () {
    var d = load();
    var doc = html();
    var cites = doc.slice(at(doc, 'class="citations"'));
    assert.ok(at(doc, 'class="citations"') > at(doc, 'class="change"'), "citations come after what this changes");
    assert.ok(at(doc, 'class="citations"') < at(doc, 'class="doc__latitude"'), "and before the latitude line");
    d.context.sources.forEach(function (src) {
      var cut = src.indexOf(": ");
      var kind = cut === -1 ? "" : src.slice(0, cut);
      var text = cut === -1 ? src : src.slice(cut + 2);
      assert.strictEqual(count(doc, text), 1, "cited once in the whole document: " + text);
      assert.ok(at(cites, text) !== -1, "cited in the citations section: " + text);
      if (kind) assert.ok(at(cites, ">" + kind + "<") !== -1, "kind rendered as its own label: " + kind);
    });
  });

  it("keeps the gap note in the briefing, because it qualifies the read rather than sourcing it", function () {
    var d = load();
    d.context.gap = "The account menu has no capture.";
    var out = assembleProposal(d);
    var brief = out.slice(at(out, 'class="briefing"'), at(out, 'class="decision"'));
    assert.ok(at(brief, d.context.gap) !== -1, "the gap stays in the briefing");
    assert.strictEqual(count(out, d.context.gap), 1, "and is not repeated in the citations");
  });

  it("renders one block per decision, each with its question, options, table and pick", function () {
    var d = twoDecisions();
    var out = assembleProposal(d);
    assert.strictEqual(count(out, '<section class="decision"'), 2);
    d.decisions.forEach(function (dec) {
      assert.ok(at(out, dec.question) !== -1, dec.id + " question");
      assert.ok(at(out, '<section class="decision" id="' + dec.id + '"') !== -1,
        dec.id + " is addressable by its id on the section itself");
      dec.options.forEach(function (o) {
        assert.ok(at(out, 'data-name="' + o.id + '"') !== -1, o.id + " drawn");
      });
      dec.pick.reasons.forEach(function (r) {
        assert.ok(at(out, r.text) !== -1, dec.id + " reason: " + r.text);
      });
      var block = out.slice(at(out, '<section class="decision" id="' + dec.id + '"'));
      block = block.slice(0, block.indexOf("</section>"));
      assert.ok(at(block, dec.pick.cost) !== -1, dec.id + " states its cost inside its own block, not only in the glance table");
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

  it("prints the framing question unless a decision already asks it word for word", function () {
    var one = load();
    assert.strictEqual(one.decisions[0].question, one.context.question, "the fixture's decision repeats it");
    assert.strictEqual(at(assembleProposal(one).slice(at(assembleProposal(one), "<body>")), "doc__question"), -1,
      "so it is not printed twice");

    var narrower = load();
    narrower.decisions[0].question = "Which surface carries the badge?";
    var out = assembleProposal(narrower);
    assert.ok(at(out.slice(at(out, "<body>")), "doc__question") !== -1,
      "a single decision narrower than the framing question does not swallow it");
    assert.ok(at(out, narrower.context.question) !== -1, "and the question itself is in the document");

    var two = twoDecisions();
    two.context.question = "How should a user understand their access?";
    var t = assembleProposal(two);
    assert.ok(at(t.slice(at(t, "<body>")), "doc__question") !== -1, "two decisions, neither repeating it: printed");
    two.decisions[1].question = two.context.question;
    var r = assembleProposal(two);
    assert.strictEqual(at(r.slice(at(r, "<body>")), "doc__question"), -1, "the second decision repeating it: not printed");
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
    var cols = (out.match(/class="proposal-screen__col" style="width:(\d+)px"/g) || [])
      .map(function (m) { return Number(/width:(\d+)px/.exec(m)[1]); });
    assert.deepStrictEqual(cols, widths, "the column and the drawing inside it carry the same width");
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

  it("keeps the comparison table's glyphs so it survives greyscale", function () {
    var doc = html();
    var body = doc.slice(doc.indexOf("<body>"));
    assert.ok(at(body, "tone-good") !== -1 || at(body, "tone-mixed") !== -1,
      "a tone class reaches the table, not just the stylesheet that defines it");
    var tpl = fs.readFileSync(path.join(ROOT, "templates", "proposal-document.html"), "utf8");
    assert.ok(at(tpl, '.tone-good::before') !== -1, "the glyph rule survives");
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
    push(d.answer, d.latitude, d.context.question, d.context.gap,
         (d.change || {}).adminSide, (d.change || {}).userSide);
    (d.context.product || []).forEach(function (f) { push(f); });
    (d.scope.goals || []).forEach(function (g) { push(g); });
    (d.scope.nonGoals || []).forEach(function (g) { push(g); });
    (d.research.findings || []).forEach(function (f) { push(f.claim); });
    push(d.research.skippedBecause);
    (d.openQuestions || []).forEach(function (q) { push(q.text); });
    (d.decisions || []).forEach(function (dec) {
      push(dec.question, dec.blocker, dec.pick.cost);
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

  it("puts the first drawing in the second element", function () {
    // Read the BODY. The stylesheet above it defines .decisions-at-a-glance and .bb__svg,
    // so the first hit for either in the whole file is its CSS rule, and an order read off
    // the file compares the sheet's declaration order, not the document's.
    var out = body(html());
    var answer = at(out, 'class="answer"');
    var terrain = at(out, 'class="bb__svg"');
    var glance = at(out, "decisions-at-a-glance");
    assert.ok(answer !== -1 && terrain !== -1 && glance !== -1, "all three present");
    assert.ok(answer < terrain, "the answer opens the document");
    assert.ok(terrain < glance, "the drawing arrives before the table, which is the second element");
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
    assert.strictEqual(at(out, "Decision 1 of"), -1, "no count on the only decision");
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
