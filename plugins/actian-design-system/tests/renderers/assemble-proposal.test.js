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
function count(hay, needle) { return hay.split(needle).length - 1; }

describe("assembleProposal (document)", function () {
  var html = assembleProposal(load());
  it("is one offline document with the FM stylesheet inlined and no external loads", function () {
    assert.ok(html.indexOf("<!DOCTYPE html>") !== -1, "DOCTYPE");
    assert.ok(html.indexOf("--fm-base-white") !== -1, "fm-base.css inlined");
    assert.ok(!/(src|href)\s*=\s*["']?(https?:)?\/\//i.test(html), "no external src or href");
    assert.ok(html.indexOf("fonts.googleapis.com") === -1, "no font CDN");
    assert.ok(!/\{\{[A-Z_]+\}\}/.test(html), "no placeholder leak");
    assert.strictEqual(count(html, "<script"), 1, "only the toggle listener");
  });
  it("leads with the recommendation, then where this lives, what others do, the approaches and the table, and closes with the case", function () {
    var order = [
      'class="rec__pick"',
      "Where this lives today",
      "What comparable products do",
      "Approaches",
      "How they compare",
      "Why this one, and what it changes",
    ];
    var last = -1;
    order.forEach(function (marker) {
      var at = html.indexOf(marker);
      assert.ok(at > last, marker + " in order (found at " + at + ", previous " + last + ")");
      last = at;
    });
  });

  it("puts the pick and the summary up top and the reasons below the evidence", function () {
    var d = load();
    var lead = html.indexOf('class="rec__pick"');
    var reasons = html.indexOf('class="rec__reason"');
    var table = html.indexOf('class="compare"');
    assert.ok(lead < table, "the pick is stated before the comparison");
    assert.ok(reasons > table, "the reasons argue after the table they cite");
    assert.ok(html.indexOf(d.recommendation.summary) < table, "the summary is up top");
    assert.strictEqual(count(html, "</span>Role badges</h2>"), 1, "the pick is named once");
  });
  it("prints the context question, the product paragraph, the sources and the gap", function () {
    var d = load();
    assert.ok(html.indexOf(d.context.question) !== -1, "question");
    assert.ok(html.indexOf("Sources: " + d.context.sources.join("; ")) !== -1, "sources");
    assert.ok(html.indexOf("Gap: " + d.context.gap) !== -1, "gap");
  });
  it("prints every research finding with its source as text, and the muted line when research did not run", function () {
    var d = load();
    d.research.findings.forEach(function (f) {
      assert.ok(html.indexOf(f.claim) !== -1, f.claim);
      assert.ok(html.indexOf("(" + f.source + ")") !== -1, f.source);
    });
    var off = load();
    off.research = { ran: false, findings: [], skippedBecause: "the request said skip research" };
    var out = assembleProposal(off);
    assert.ok(out.indexOf("Not researched: the request said skip research") !== -1, "muted line");
    assert.ok(out.indexOf("What comparable products do") !== -1, "section still present");
  });
  it("renders one drawing per approach, at its width, numbered, with its anchor, two lines and verdict tag", function () {
    var d = load();
    assert.strictEqual(count(html, 'class="proposal-screen"'), d.approaches.length);
    d.approaches.forEach(function (a, i) {
      assert.ok(html.indexOf('style="width:' + a.screen.width + 'px"') !== -1, a.id + " width");
      assert.ok(html.indexOf('<span class="proposal-screen__num">' + (i + 1) + "</span>") !== -1, a.id + " number");
      assert.ok(html.indexOf('data-name="' + a.id + '"') !== -1, a.id + " data-name");
      assert.ok(html.indexOf(a.whatItIs) !== -1 && html.indexOf(a.breaksWhen) !== -1, a.id + " lines");
      assert.ok(html.indexOf('<span class="fm-tag">' + a.verdict + "</span>") !== -1, a.id + " verdict");
      assert.ok(html.indexOf("Explorer, " + a.anchor.surface) !== -1, a.id + " anchor label");
    });
  });
  it("renders the anchor app's header strip through the flow renderer's own appHeader markup", function () {
    function strip(template) { return flowRenderer.appHeader(flowRenderer.resolveChrome({ template: template }).appHeaderType); }
    assert.strictEqual(count(html, strip("explorer")), 3, "three Explorer strips");
    assert.strictEqual(count(html, strip("admin")), 0, "no Administration strip");
  });
  it("does not clip a drawing: no fixed height and no overflow hidden on the frame", function () {
    var css = html.slice(0, html.indexOf("</head>"));
    var rule = /\.proposal-screen\s*\{[^}]*\}/.exec(css)[0];
    assert.ok(rule.indexOf("overflow: visible") !== -1, rule);
    assert.ok(rule.indexOf("height") === -1, rule);
    var bodyRule = /\.proposal-screen__body\s*\{[^}]*\}/.exec(css)[0];
    assert.ok(bodyRule.indexOf("position: relative") !== -1, bodyRule);
    var labelRule = /\.proposal-screen__label\s*\{[^}]*\}/.exec(css)[0];
    assert.ok(labelRule.indexOf("flex-wrap: wrap") !== -1, labelRule);
  });
  it("renders the comparison as a table: one column per approach, one row per criterion, tone classes, the source under the label", function () {
    var d = load();
    d.approaches.forEach(function (a) { assert.ok(html.indexOf("<th>" + a.name + "</th>") !== -1, a.name); });
    d.comparison.criteria.forEach(function (c) {
      assert.ok(html.indexOf("<th>" + c.label + '<span class="compare__source">' + c.source + "</span></th>") !== -1, c.label);
    });
    assert.ok(html.indexOf('<td class="tone-good">') !== -1 && html.indexOf('<td class="tone-bad">') !== -1 && html.indexOf('<td class="tone-mixed">') !== -1, "tones");
    assert.strictEqual(count(html, "<td"), d.comparison.criteria.length * d.approaches.length, "cell count");
  });
  it("renders an empty cell when an approach has no entry for a criterion, and when it has no cells at all", function () {
    var d = load();
    delete d.comparison.cells.b["literal-ask"];
    var out = assembleProposal(d);
    assert.strictEqual(count(out, "<td"), d.comparison.criteria.length * d.approaches.length, "cell count unchanged, missing entry");
    assert.strictEqual(count(out, "<td></td>"), 1, "exactly one empty cell");
    d = load();
    delete d.comparison.cells.b;
    out = assembleProposal(d);
    assert.strictEqual(count(out, "<td"), d.comparison.criteria.length * d.approaches.length, "cell count unchanged, missing row");
    assert.strictEqual(count(out, "<td></td>"), d.comparison.criteria.length, "b's whole row renders empty");
  });
  it("renders the recommendation with the picked approach's name, the summary, the reasons as cards and the change scope", function () {
    var d = load();
    assert.ok(html.indexOf('<h2><span class="rec__pick">Recommendation</span>Role badges</h2>') !== -1, "picked name, inside the heading with its eyebrow");
    assert.ok(html.indexOf(d.recommendation.summary) !== -1, "summary");
    assert.strictEqual(count(html, 'class="rec__reason"'), d.recommendation.reasons.length);
    assert.ok(html.indexOf("<b>Admin side.</b> " + d.recommendation.change.adminSide) !== -1, "admin side");
    assert.ok(html.indexOf("<b>User side.</b> " + d.recommendation.change.userSide) !== -1, "user side");
  });
  it("omits the change scope when the recommendation has no change, and prints only the side given", function () {
    var d = load();
    delete d.recommendation.change;
    var out = assembleProposal(d);
    assert.ok(out.indexOf('class="rec__change"') === -1, "no change paragraph when change is absent");
    d = load();
    d.recommendation.change = { userSide: "Only users." };
    out = assembleProposal(d);
    assert.ok(out.indexOf("<b>User side.</b> Only users.") !== -1, "the given side is printed");
    assert.ok(out.indexOf("<b>Admin side.</b>") === -1, "the missing side is omitted");
  });
  it("prints the authored date, never a render-time clock, and names the follow-ups in the footer", function () {
    assert.ok(html.indexOf("2026-09-11") !== -1, "date from meta");
    assert.ok(html.indexOf(String(new Date().getFullYear() + 1)) === -1, "no future year");
    assert.ok(html.indexOf("make Role badges a flow") !== -1, "follow-up names the pick");
  });
  it("carries the single data-toggle listener", function () {
    assert.strictEqual(count(html, "el.hidden = !el.hidden"), 1);
  });
  it("escapes titles, names and prose (no attribute or tag breakout)", function () {
    var d = load();
    d.meta.title = 'x" onload="y';
    d.approaches[0].name = "<b>bold</b>";
    d.context.question = "<script>bad()</script>";
    d.openQuestions[0].text = "<script>openQuestion()</script>";
    var out = assembleProposal(d);
    assert.ok(out.indexOf('x" onload="y') === -1, "title escaped");
    assert.ok(out.indexOf("&lt;b&gt;bold&lt;/b&gt;") !== -1, "name escaped");
    assert.ok(out.indexOf("&lt;script&gt;openQuestion()&lt;/script&gt;") !== -1, "open question text escaped");
    assert.strictEqual(count(out, "<script"), 1, "prose escaped, script count unchanged");
  });
  it("renders rabbit holes and open questions, and omits the section entirely when there are none", function () {
    var d = load();
    d.openQuestions.forEach(function (q) { assert.ok(html.indexOf(q.text) !== -1, q.text); });
    assert.ok(html.indexOf("What we are not sure about") !== -1, "section present");
    assert.ok(html.indexOf('<span class="oq__kind">Rabbit hole</span>') !== -1, "kind labelled");
    var at = html.indexOf("What we are not sure about");
    assert.ok(at > html.indexOf("How they compare") && at < html.indexOf("Why this one"), "sits between the table and the case");

    var none = load();
    delete none.openQuestions;
    var out = assembleProposal(none);
    assert.ok(out.indexOf("What we are not sure about") === -1, "absent when there are none");
    none = load();
    none.openQuestions = [];
    assert.ok(assembleProposal(none).indexOf("What we are not sure about") === -1, "absent when empty");
  });
  it("refuses an unknown anchor app, a schema error, an unbalanced fragment and an unresolved recommendation", function () {
    var d = load();
    d.approaches[0].anchor.app = "nope";
    assert.throws(function () { assembleProposal(d); }, /unknown app "nope"/);
    d = load();
    delete d.comparison;
    assert.throws(function () { assembleProposal(d); }, /schema/);
    d = load();
    d.approaches[1].screen.html = "<div><span>open";
    assert.throws(function () { assembleProposal(d); }, /unbalanced <div>/);
    d = load();
    d.recommendation.approachId = "zz";
    assert.throws(function () { assembleProposal(d); }, /names no approach/);
  });
});

describe("assemble-preview.js --type proposal", function () {
  it("writes the document through the shared CLI", function () {
    var out = path.join(require("os").tmpdir(), "proposal-" + Date.now() + ".html");
    var r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "renderers", "assemble-preview.js"), FIXTURE, "--type", "proposal", "-o", out], { encoding: "utf8" });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(fs.existsSync(out), "file written");
    var html = fs.readFileSync(out, "utf8");
    assert.ok(html.indexOf('class="proposal-screen"') !== -1);
    assert.ok(html.indexOf('class="compare"') !== -1);
    fs.unlinkSync(out);
  });
  it("lists proposal among --help types", function () {
    var r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "renderers", "assemble-preview.js"), "--help"], { encoding: "utf8" });
    var help = JSON.parse(r.stdout);
    assert.ok(help.types.indexOf("proposal") !== -1, JSON.stringify(help.types));
  });
});

describe("document setting", function () {
  var html = assembleProposal(load());
  // The FM base sheet has its own :root and its own body rule. Pin to the
  // document stylesheet, which is the LAST <style> before </head>.
  var docCss = html.slice(html.lastIndexOf("<style>"), html.indexOf("</head>"));
  // Anchored on the start of the block, a newline or a closing brace, so a selector can
  // only match at the start of a rule. Unanchored, rule("body") matches the tail of
  // .proposal-screen__body and passes today only because the body rule happens to come
  // first in source order: the gate would match the wrong occurrence the day that changes.
  function ruleIn(css, sel) {
    var m = new RegExp("(?:^|[\\n}])\\s*(" + sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{[^}]*\\})").exec(css);
    assert.ok(m, "no rule for " + sel + " in the stylesheet");
    return m[1];
  }
  function rule(sel) { return ruleIn(docCss, sel); }

  it("anchors rule() to the start of a rule, so a selector cannot match inside a longer one", function () {
    assert.match(rule("body"), /^body\s*\{/, "the body element rule, not the tail of another selector");
    // Same two rules, opposite source order. Anchored still finds body; unanchored does not.
    var swapped = ".proposal-screen__body { padding: 16px; }\nbody { background: red; }";
    assert.strictEqual(ruleIn(swapped, "body"), "body { background: red; }", "anchored: the body rule");
    var unanchored = new RegExp("body\\s*\\{[^}]*\\}").exec(swapped)[0];
    assert.strictEqual(unanchored, "body { padding: 16px; }", "unanchored: the tail of .proposal-screen__body");
  });

  it("declares the scale and the measure as tokens, and nothing off the scale", function () {
    var root = rule(":root");
    assert.match(root, /--doc-measure:\s*512px/, root);
    assert.match(root, /--doc-body:\s*16px/, root);
    assert.match(root, /--doc-caption:\s*13px/, root);
    assert.match(root, /--doc-micro:\s*11px/, root);
    assert.match(root, /--doc-lede:\s*20px/, root);
    assert.match(root, /--doc-h2:\s*25px/, root);
    assert.match(root, /--doc-h1:\s*31px/, root);
  });

  it("sets every font-size through a token, so nothing drifts off the scale", function () {
    // The promise is that every size resolves to a --doc-* token, so the gate asks for
    // var( and nothing else. A px-only gate let a rem, an em, a pt or a keyword through.
    // The whitespace sits INSIDE the lookahead: /font-size:\s*(?!var\()/ backtracks \s*
    // to empty and then the lookahead passes on " var(", so it matches every declaration.
    var offScale = docCss.match(/font-size:(?!\s*var\()[^;}]*/g) || [];
    assert.deepStrictEqual(offScale, [], "font-size not set through a token: " + offScale.join(" | "));
  });

  it("sets running prose at 16px and holds it to the measure", function () {
    assert.match(rule("body"), /font-size:\s*var\(--doc-body\)/);
    assert.match(rule("body"), /line-height:\s*1\.6/);
    assert.match(rule(".doc__section > p, .doc__section > ul"), /max-width:\s*var\(--doc-measure\)/);
  });

  it("makes a section heading read as a heading, not as bold body text", function () {
    assert.match(rule(".doc__section > h2"), /font-size:\s*var\(--doc-h2\)/);
    assert.match(rule(".doc__title"), /font-size:\s*var\(--doc-h1\)/);
  });

  it("gives only the recommendation a card; every other section is a rule and space", function () {
    var base = rule(".doc__section");
    assert.ok(base.indexOf("background") === -1, "sections carry no fill: " + base);
    assert.ok(base.indexOf("border-radius") === -1, "sections carry no radius: " + base);
    assert.match(base, /border-top:\s*1px solid/, base);
    assert.match(rule(".doc__section--rec"), /background:\s*var\(--fm-base-white\)/);
    // Task 4 split the recommendation into a lead and a detail section (6). Task 7 adds
    // scope (7), Task 8 adds open questions (8). Each of those tasks raises this number
    // in its own commit.
    assert.strictEqual(count(html, 'class="doc__section'), 8, "eight sections");
    assert.strictEqual(count(html, 'doc__section--rec"'), 1, "one of them is the card, in the markup, not the two CSS selectors that also name it");
  });

  it("sets sources and the gap in their own register, not as body prose", function () {
    var d = load();
    assert.match(rule(".doc__muted"), /font-size:\s*var\(--doc-caption\)/);
    assert.match(rule(".doc__muted"), /border-left:\s*2px solid var\(--fm-base-300\)/);
    assert.match(rule(".doc__gap"), /border-left:\s*2px solid var\(--fm-brand\)/);
    assert.ok(html.indexOf('<p class="doc__gap">Gap: ' + d.context.gap) !== -1, "gap has its own class");
    assert.ok(html.indexOf('<p class="doc__muted">Sources: ') !== -1, "sources stay muted");
  });

  it("renders goals and non-goals as two labelled columns, after the context", function () {
    var d = load();
    var at = html.indexOf("What this is for");
    assert.ok(at > html.indexOf("Where this lives today"), "scope follows context");
    assert.ok(at < html.indexOf("What comparable products do"), "scope precedes research");
    d.scope.goals.forEach(function (g) { assert.ok(html.indexOf(g) !== -1, g); });
    d.scope.nonGoals.forEach(function (n) { assert.ok(html.indexOf(n) !== -1, n); });
    assert.strictEqual(count(html, 'class="scope__col"'), 2, "two columns");
    assert.ok(html.indexOf("<h3>Goals</h3>") !== -1 && html.indexOf("<h3>Not doing</h3>") !== -1, "both labelled");
    assert.match(rule(".scope"), /display:\s*grid/);
  });

  it("puts every goal under Goals and no non-goal there, so the two columns cannot swap", function () {
    // Both lists appearing somewhere in the document is not the claim. Swapping the two
    // col() arguments in the renderer would tell a reviewer the goals are the non-goals,
    // so slice the column and bind each line to its own heading.
    var d = load();
    var goalsAt = html.indexOf("<h3>Goals</h3>");
    var notDoingAt = html.indexOf("<h3>Not doing</h3>");
    assert.ok(goalsAt !== -1 && notDoingAt !== -1, "both headings present");
    assert.ok(goalsAt < notDoingAt, "Goals is the first column");
    var goalsCol = html.slice(goalsAt, notDoingAt);
    d.scope.goals.forEach(function (g) {
      assert.ok(goalsCol.indexOf(g) !== -1, "goal under the Goals heading: " + g);
    });
    d.scope.nonGoals.forEach(function (n) {
      assert.ok(goalsCol.indexOf(n) === -1, "non-goal must not sit under the Goals heading: " + n);
    });
  });

  it("sizes an approach column to its drawing so the label wraps instead of widening the row", function () {
    var d = load();
    d.approaches.forEach(function (a) {
      var w = Math.max(Number(a.screen.width) || 360, 280);
      assert.ok(
        html.indexOf('<div class="proposal-screen__col" style="width:' + w + 'px">') !== -1,
        a.id + " column at " + w + "px"
      );
    });
    // A narrow drawing still gets a column wide enough to caption.
    var narrow = load();
    narrow.approaches[0].screen.width = 240;
    assert.ok(
      assembleProposal(narrow).indexOf('<div class="proposal-screen__col" style="width:280px">') !== -1,
      "240px drawing gets a 280px column"
    );
    assert.match(rule(".approach__lines"), /max-width:\s*100%/);
  });

  it("pairs every comparison verdict with a glyph, so the table survives greyscale", function () {
    assert.match(rule(".tone-good::before"), /content:\s*"\\2713"/);   // check mark
    assert.match(rule(".tone-mixed::before"), /content:\s*"\\25CB"/);  // open circle
    assert.match(rule(".tone-bad::before"), /content:\s*"\\2717"/);    // ballot X
    assert.match(rule(".compare td::before"), /margin-right:/);
    // The glyphs are CSS escapes, not literal characters: the document must stay
    // byte-safe whatever charset a reader's tooling assumes.
    assert.ok(docCss.indexOf("\u2713") === -1 && docCss.indexOf("\u2717") === -1, "no literal glyph in the CSS");
  });
});
