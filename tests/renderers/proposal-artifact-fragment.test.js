"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var proposal = require("../../plugins/actian-design-system/scripts/renderers/assemble-proposal.js");
var assembleProposal = proposal.assembleProposal;

var ROOT = path.resolve(__dirname, "..", "..", "plugins", "actian-design-system");
var FIXTURE = path.join(__dirname, "..", "fixtures", "proposal-dip-i-496-one-decision.json");
function load() { return JSON.parse(fs.readFileSync(FIXTURE, "utf8")); }
function count(hay, needle) { return hay.split(needle).length - 1; }

// The fragment is what an Artifact publish sends: the host wraps it in its own
// <!doctype>/<head>/<body>, so a fragment that still carries those nests one document
// inside another and the page renders with two bodies. Every assertion here reads the
// emitted fragment, never the template, so it can fail when the slice stops slicing.
describe("assembleProposal (artifact fragment)", function () {
  var cachedDoc = null;
  var cachedFrag = null;
  function doc() { if (!cachedDoc) cachedDoc = assembleProposal(load()); return cachedDoc; }
  function frag() { if (!cachedFrag) cachedFrag = assembleProposal(load(), { fragment: true }); return cachedFrag; }

  it("carries no document wrapper for the host to nest", function () {
    ["<!DOCTYPE", "<html", "</html>", "<head>", "</head>", "<body>", "</body>"].forEach(function (tag) {
      assert.strictEqual(frag().indexOf(tag), -1, "the fragment still carries " + tag);
    });
  });

  it("keeps the title the gallery reads, exactly once", function () {
    assert.strictEqual(count(frag(), "<title>"), 1, "one title");
    assert.ok(frag().indexOf("<title>" + load().meta.title + "</title>") !== -1, "the proposal title");
  });

  it("keeps both stylesheets and the one toggle script", function () {
    assert.strictEqual(count(frag(), "<style>"), 2, "the FM sheet and the document sheet");
    assert.ok(frag().indexOf("--fm-base-white") !== -1, "fm-base.css inlined");
    assert.ok(frag().indexOf("--doc-measure") !== -1, "the document sheet inlined");
    assert.strictEqual(count(frag(), "<script"), 1, "only the toggle listener");
  });

  it("keeps the document itself, opening on the answer", function () {
    assert.ok(frag().indexOf('<main class="doc">') !== -1, "the document root");
    assert.ok(frag().indexOf('class="doc__footer"') !== -1, "through to the footer");
  });

  it("loads nothing from outside itself", function () {
    assert.ok(!/(src|href)\s*=\s*["']?(https?:)?\/\//i.test(frag()), "no external src or href");
    assert.ok(!/\{\{[A-Z_]+\}\}/.test(frag()), "no placeholder leak");
  });

  // Without this the slice degrades silently: a template edit that moves a seam leaves
  // toFragment returning the whole document, which publishes and renders and looks right
  // until the nesting bites. The guard has to throw, and it has to be provably able to.
  describe("the seam guard", function () {
    it("accepts the document the template actually produces", function () {
      assert.doesNotThrow(function () { proposal.toFragment(doc()); });
    });

    [
      ["the head-to-body seam", "\n</head>\n<body>\n", "\n</head>  \n<body>\n"],
      ["the closing seam", "\n</body>\n</html>", "\n</body >\n</html>"],
      ["the title", "<title>", "<titl>"],
    ].forEach(function (row) {
      it("throws when " + row[0] + " is gone", function () {
        var moved = doc().replace(row[1], row[2]);
        assert.notStrictEqual(moved, doc(), "the doctored document differs from the real one");
        assert.throws(function () { proposal.toFragment(moved); }, /seam/i);
      });
    });

    it("throws when a seam appears twice", function () {
      var twice = doc().replace("\n</body>\n</html>", "\n</body>\n</html>\n</body>\n</html>");
      assert.throws(function () { proposal.toFragment(twice); }, /seam/i);
    });
  });
});

// A published page is read on a phone. The drawings are mocks at real widths and must not
// reflow, so they scroll inside their own box; everything made of prose reflows.
describe("the proposal document on a narrow screen", function () {
  var cached = null;
  function html() { if (!cached) cached = assembleProposal(load()); return cached; }

  it("has a narrow-screen block at all", function () {
    assert.ok(/@media\s*\(max-width:\s*640px\)/.test(html()), "a 640px breakpoint");
  });

  // At every width, not only on a phone: a drawing reaches 1200, so a laptop or a side panel
  // narrower than that scrolled the whole page sideways while the rule sat in the breakpoint.
  it("gives each drawing its own scroll box rather than widening the page, at every width", function () {
    var i = html().indexOf("\n    .proposal-screen__col {");
    assert.notStrictEqual(i, -1, "the drawing column has a rule outside any breakpoint");
    var rule = html().slice(i, html().indexOf("}", i));
    assert.ok(/overflow-x:\s*auto/.test(rule), "the drawing column scrolls itself: " + rule);
    assert.ok(/max-width:\s*100%/.test(rule), "and never exceeds the page: " + rule);
    assert.ok(/padding:\s*8px/.test(rule) && /margin:\s*-8px/.test(rule), "and keeps room for the ring it would clip: " + rule);
    assert.ok(/box-sizing:\s*content-box/.test(rule), "outside the drawn width, so a drawing that fits does not scroll: " + rule);
  });

  it("drops the desktop page margin so the measure has the screen", function () {
    var m = html().match(/@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*?\n {4}\}/);
    assert.ok(/body\s*\{[^}]*padding:\s*16px/.test(m[0]), "body padding steps down from 40px");
  });
});

// The skill reaches the fragment through the CLI, never through the module, so the flag
// is the surface that has to work. The contract test proves SKILL.md and the parser agree
// on the flag's name; this proves the flag changes what lands on disk.
describe("assemble-preview --type proposal --fragment", function () {
  var execFileSync = require("child_process").execFileSync;
  var os = require("os");
  var CLI = path.join(ROOT, "scripts", "renderers", "assemble-preview.js");

  function run(extra) {
    var out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "proposal-frag-")), "out.html");
    execFileSync(process.execPath, [CLI, FIXTURE, "--type", "proposal", "-o", out].concat(extra), { stdio: "pipe" });
    return fs.readFileSync(out, "utf8");
  }

  it("writes a fragment with the flag and a whole document without it", function () {
    assert.strictEqual(run(["--fragment"]).indexOf("<!DOCTYPE"), -1, "the flag drops the wrapper");
    assert.notStrictEqual(run([]).indexOf("<!DOCTYPE"), -1, "without it the document is unchanged");
  });

  it("names the flag in --help, so the contract check can see it", function () {
    var help = JSON.parse(execFileSync(process.execPath, [CLI, "--help"], { stdio: "pipe" }).toString());
    assert.ok(
      help.flags.some(function (f) { return f.name === "--fragment"; }),
      "--help lists --fragment",
    );
  });
});

// Paper has no scroll and is narrower than a drawing may be. Under the screen rule a 720 drawing
// printed without its right edge and a 960 one without a third of its width, each over a
// scrollbar; let out, a drawing past about 1030px was still cut, and every page printed smaller.
describe("the proposal document on paper", function () {
  var cached = null;
  function html() { if (!cached) cached = assembleProposal(load()); return cached; }

  it("zooms a drawing to its print width rather than cutting it or shrinking the page", function () {
    var m = html().match(/@media\s+print\s*\{[\s\S]*?\n {4}\}/);
    assert.ok(m, "a print block");
    assert.ok(/\.proposal-screen__col\s*\{[^}]*width:\s*var\(--print-width\)\s*!important/.test(m[0]), "the column takes its print width over its inline one: " + m[0]);
    assert.ok(/\.proposal-screen__col\s*\{[^}]*overflow:\s*visible/.test(m[0]), "and does not scroll on paper: " + m[0]);
    assert.ok(/\.proposal-screen\s*\{[^}]*zoom:\s*var\(--print-zoom\)/.test(m[0]), "the frame is zoomed to fit it: " + m[0]);
  });

  it("comes after the column's screen rule, so it wins", function () {
    var screenRule = html().indexOf("\n    .proposal-screen__col {");
    assert.notStrictEqual(screenRule, -1, "the screen rule is there");
    assert.ok(html().search(/@media\s+print/) > screenRule, "the print block sits before the rule it overrides");
  });

  it("gives each drawing a print width and zoom that fit the page", function () {
    assert.strictEqual(require("../../plugins/actian-design-system/scripts/renderers/assemble-proposal.js").PRINT_WIDTH, 620);
    [[360, 360, 1], [620, 620, 1], [720, 620, 0.8611], [1200, 620, 0.5167]].forEach(function (k) {
      var d = load();
      d.decisions.forEach(function (dec) { dec.options.forEach(function (o) { o.screen.width = k[0]; }); });
      var cols = assembleProposal(d).match(/class="proposal-screen__col" style="[^"]*"/g) || [];
      assert.ok(cols.length > 0, "no drawing columns");
      cols.forEach(function (c) {
        assert.ok(c.indexOf("width:" + k[0] + "px;--print-width:" + k[1] + "px;--print-zoom:" + k[2] + '"') !== -1, k[0] + " drawn as: " + c);
      });
    });
  });
});
