"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var { assembleProposal } = require("../../scripts/renderers/assemble-proposal.js");

var ROOT = path.resolve(__dirname, "..", "..");
var TEMPLATE = path.join(ROOT, "templates", "proposal-document.html");
var FIXTURE = path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496-one-decision.json");
function load() { return JSON.parse(fs.readFileSync(FIXTURE, "utf8")); }
// The bar only exists when there is more than one decision, so the tests for it read the
// three-decision document. Pointed at the one-decision fixture they pass by returning early,
// which is the shape of a test that cannot fail.
var FULL = path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496.json");
function loadFull() { return JSON.parse(fs.readFileSync(FULL, "utf8")); }
function tpl() { return fs.readFileSync(TEMPLATE, "utf8"); }
function at(hay, needle) { return hay.indexOf(needle); }

// The rule for one selector, read out of the template's own document-setting block. Reading
// the sheet is right here: these assertions are about the setting, not about one document.
function ruleFor(sel) {
  var t = tpl();
  var i = t.indexOf("\n    " + sel + " {");
  assert.notStrictEqual(i, -1, "the template carries no rule for " + sel);
  return t.slice(i, t.indexOf("}", i));
}
// Every rule in the document-setting block, as selector and body. Reading the sheet by
// regex over the whole string is what made the centring guard unfailable; walking the rules
// means an assertion is about one rule and says which.
function rules() {
  var doc = tpl().slice(tpl().indexOf("Document setting"));
  doc = doc.replace(/\/\*[\s\S]*?\*\//g, ""); // a comment may hold a brace or a colon
  var out = [];
  var re = /(^|\n)\s*([^{}@\n][^{}\n]*?)\s*\{([^{}]*)\}/g;
  var m;
  while ((m = re.exec(doc)) !== null) out.push({ selector: m[2].trim(), body: m[3] });
  return out;
}
function tokenPx(name) {
  var m = tpl().match(new RegExp("--" + name + ":\\s*(\\d+)px"));
  assert.ok(m, "the scale declares --" + name);
  return Number(m[1]);
}

// 2026-09-15. The document was measured against three long-form documents that people
// actually read: Linear's changelog (17px/27.2px, a 622px column, 73 characters), Basecamp's
// Shape Up (21.9px/32.8px, 795px, 73 characters) and Tufte CSS (21px/30px, 689px, 66
// characters). All three run one left edge, a 66-to-73 character measure, and near-maximum
// text contrast. The proposal ran 13px for most of its words, a 512px measure that its own
// tables ignored, and muted text on a muted ground. These tests hold the corrections.
describe("the proposal document is set to be read", function () {
  describe("scale", function () {
    it("sets running text at 17px, the register a read document uses", function () {
      assert.ok(tokenPx("doc-body") >= 17, "--doc-body is " + tokenPx("doc-body") + "px");
    });

    it("keeps the measure inside the 66 to 73 character band", function () {
      // At --doc-body, a character averages about half the font size, which is the same
      // estimate the three reference documents were measured with.
      var chars = Math.round(tokenPx("doc-measure") / (tokenPx("doc-body") * 0.5));
      assert.ok(chars >= 62 && chars <= 76, "the measure is " + chars + " characters");
    });

    it("leaves no caption small enough to stop being text", function () {
      assert.ok(tokenPx("doc-caption") >= 15, "--doc-caption is " + tokenPx("doc-caption") + "px");
    });

    // The failure this closes: --doc-caption was 13px and carried the pick reasons, the
    // costs, the briefing, the comparison and the citations, which is most of the words in
    // the document. A caption register is for a caption.
    [
      [".pick__reasons li", "a reason for the pick"],
      [".pick__cost", "what the pick costs"],
      [".change__col p", "what this changes for a reader"],
      [".briefing__col .doc__list li", "a briefing line"],
      [".decision__blocker", "a blocker"],
      [".option__why", "why an option was not chosen"],
      [".citations__text", "a source"],
    ].forEach(function (row) {
      it("sets " + row[1] + " at body scale, not caption scale", function () {
        var rule = ruleFor(row[0]);
        assert.ok(
          at(rule, "var(--doc-body)") !== -1,
          row[0] + " is still at " + (rule.match(/font-size:[^;]*/) || ["no font-size"])[0],
        );
      });
    });
  });

  describe("one left edge", function () {
    // The measure is a ceiling, not a target: a paired column may be narrower. What no column
    // of running text may be is wider, which is what the decision table and the cost cell
    // were before this, at over a hundred characters a line.
    it("caps every column of running text at the measure or below it", function () {
      var measure = tokenPx("doc-measure");
      [".pick", ".decision__case", ".citations", ".doc__footer", ".briefing", ".change"].forEach(function (sel) {
        var rule = ruleFor(sel);
        if (at(rule, "var(--doc-measure)") !== -1) return;
        var px = (rule.match(/(?:max-width|grid-template-columns)[^;]*?(\d+)px\)?\s*\)?\s*;/) || [])[1];
        assert.ok(px, sel + " names neither the measure nor a width: " + rule.split("{")[1]);
        assert.ok(Number(px) <= measure, sel + " runs " + px + "px, past the " + measure + "px measure");
      });
    });

    // Written first as "collect every margin:auto, then look 200 characters back for .doc",
    // which cannot fail: indexOf finds the FIRST occurrence of the matched text, so a second
    // identical rule is judged against the first one's neighbourhood. Proved by adding
    // ".research { margin: 0 auto; }" and watching it pass. It walks the rules now.
    it("centres nothing but the document itself", function () {
      var offenders = rules().filter(function (r) {
        return r.selector !== ".doc" && (/margin:[^;]*\bauto\b/.test(r.body) || /text-align:\s*center/.test(r.body));
      });
      assert.deepStrictEqual(offenders.map(function (r) { return r.selector; }), [], "these are centred");
    });

    // The dead space this closes: the drawing led the row at a width the row budget set, and
    // the case took the measure beside it, so a 1200px block ended at about 930 and the last
    // 270px were empty. The case reads first now, on the document's own left edge, and the
    // drawing it illustrates sits beside it.
    it("reads the case before the drawing that illustrates it", function () {
      var out = assembleProposal(load());
      var lead = out.slice(at(out, 'class="decision__lead"'));
      lead = lead.slice(0, at(lead, "</section>"));
      assert.ok(
        at(lead, 'class="decision__case"') < at(lead, 'class="proposal-screen__col"'),
        "the drawing still comes first",
      );
    });

    // A drawing at 720 beside its case, plus the 48px gap and a 620px case, is 1388 in a 1200px
    // row. Something has to give, and it must not be the drawing:
    // a drawing that shrinks below the width it was composed at clips the mock inside it,
    // which is the one thing in this document that is asserting a fact about a real screen.
    it("never shrinks a drawing to make the case beside it fit", function () {
      assert.match(ruleFor(".proposal-screen__col"), /flex:\s*none/, "the drawing can still shrink");
      assert.match(ruleFor(".decision__case"), /flex:\s*\d+\s+1\s/, "and the case cannot give way instead");
    });
  });

  describe("figure and ground", function () {
    // The drawings are white cards. On a --fm-base-200 ground they were the brightest thing
    // in the document, so the eye went to the mock before the argument every time.
    it("sets the document on white, so the text carries the contrast", function () {
      assert.ok(at(ruleFor("body"), "var(--fm-base-white)") !== -1, "the page is not white");
    });

    // A white card on a white page has no edge left. The card keeps its white and gains a
    // tinted ring instead. Asserting its background or border would pass on the old sheet,
    // which already had both: the ring is the part of this that is new, so the ring is what
    // is asserted, and it is drawn outside the border box so no drawn width moves.
    it("rings a drawing so it still reads as a figure on a white page", function () {
      var fig = ruleFor(".proposal-screen");
      assert.ok(at(fig, "box-shadow") !== -1, "the figure has no ring");
      assert.ok(at(fig, "var(--fm-base-100)") !== -1, "the ring is not tinted off the page");
      assert.ok(at(fig, "var(--fm-base-white)") !== -1, "and the card itself is no longer white");
    });
  });

  describe("scanning a document this long", function () {
    // 9,305px at the sizes this replaced, and more at these. The map at the top scrolls away
    // after the first screen and never comes back, so from there on a reader has no way to
    // see the shape of what they are in or to move inside it.
    it("carries a bar of the parts that stays as the reader scrolls", function () {
      var rule = ruleFor(".doc__jump");
      assert.ok(at(rule, "position: sticky") !== -1, "the bar does not stick");
      assert.ok(at(rule, "top:") !== -1, "and names no offset to stick at");
    });

    it("puts every part in it, each one a link to its block", function () {
      var d = loadFull();
      assert.ok(d.decisions.length > 1, "the fixture carries more than one decision");
      var out = assembleProposal(d);
      var bar = out.slice(at(out, 'class="doc__jump"'));
      bar = bar.slice(0, at(bar, "</nav>"));
      d.decisions.forEach(function (dec) {
        assert.ok(at(bar, 'href="#' + dec.id + '"') !== -1, dec.id + " is not in the bar");
      });
    });

    it("names itself for a reader who is not looking at it", function () {
      var out = assembleProposal(loadFull());
      var i = at(out, 'class="doc__jump"');
      assert.notStrictEqual(i, -1, "the document carries no bar to name");
      var tag = out.slice(out.lastIndexOf("<", i), out.indexOf(">", i) + 1);
      assert.match(tag, /^<nav /, "the bar is not a nav");
      assert.match(tag, /aria-label=/, "the nav is unlabelled");
    });

    it("drops the bar when the screen is too narrow to carry it", function () {
      var narrow = tpl().match(/@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*?\n {4}\}/);
      assert.ok(narrow, "the narrow-screen block is readable");
      assert.ok(/\.doc__jump\s*\{[^}]*display:\s*none/.test(narrow[0]), "the bar survives into a phone");
    });
  });
});
