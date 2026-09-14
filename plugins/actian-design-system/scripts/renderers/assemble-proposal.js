"use strict";

/**
 * assemble-proposal.js: assembles a design proposal document, one offline HTML
 * file, from proposals/proposal-data.json: the answer, the terrain the feature
 * happens on, a table of what was decided, the briefing, one block per decision
 * with its options drawn inside their anchor and its pick argued from its own
 * comparison, what is still open, what this changes, and the latitude line.
 *
 * The reader gets the answer first and a drawing second. Within a decision every
 * option renders at the same width, computed here rather than trusted from the
 * data: research on prototype fidelity found that unequal presentation corrupts
 * a stakeholder's judgement in both directions, so an author must not be able to
 * draw their favourite at 720 and its rival at 320.
 *
 * Grounding the author does not have to think about: the app header strip is
 * the flow renderer's own appHeader markup for the anchor's app (so the label
 * is the one the substrate records), fm-base.css is inlined from the vendored
 * renderer, and the file loads nothing from the network.
 *
 * No side effects at load. Exported: assembleProposal(data) -> html string.
 * Throws Error("proposal-data: ...") on schema errors, unknown app slugs,
 * unbalanced fragments, a pick naming no option and a reason naming no
 * criterion; validate-proposal.js reports the same things as findings before an
 * author gets here.
 */

var fs = require("fs");
var path = require("path");
var PATHS = require("../lib/paths");
var shared = require("./assemble-shared");
var renderer = require("../lib/renderer.js");
var validateSchema = require("../validation/validate-schema.js");
var flowRenderer = require("./html-renderers/flow-renderer.js");
var breadboard = require("./proposal-breadboard.js");

var esc = renderer.fmHtmlMap.esc;
var readFileChecked = shared.readFileChecked;
var TEMPLATE_PATH = path.join(shared.TEMPLATES_DIR, "proposal-document.html");
var SCHEMA_PATH = path.join(__dirname, "..", "..", "schemas", "proposal-data.schema.json");

// Tags a fragment may open; each must close. Void elements are not listed.
var BALANCED_TAGS = ["div", "span", "p", "section", "button", "a", "ul", "ol", "li", "table", "thead", "tbody", "tr", "td", "th", "label", "h1", "h2", "h3", "h4"];
var TONES = { good: "tone-good", mixed: "tone-mixed", bad: "tone-bad" };

function maskComment(s) {
  return String(s == null ? "" : s).replace(/-(?=-)/g, "-\u200b");
}

function stripComments(s) {
  return String(s == null ? "" : s).replace(/<!--[\s\S]*?-->/g, "");
}

function loadApps() {
  var ctx = JSON.parse(fs.readFileSync(PATHS.appContext, "utf8"));
  return ctx.apps || {};
}

function templateForApp(slug) {
  // TEMPLATE_CHROME keys: admin, studio, explorer. app-context slugs: administration, studio, explorer.
  return slug === "administration" ? "admin" : slug;
}

function unbalancedTag(html) {
  var s = stripComments(html);
  for (var i = 0; i < BALANCED_TAGS.length; i++) {
    var t = BALANCED_TAGS[i];
    var open = (s.match(new RegExp("<" + t + "(\\s|>)", "gi")) || []).length;
    var close = (s.match(new RegExp("</" + t + "\\s*>", "gi")) || []).length;
    if (open !== close) return t;
  }
  return null;
}

function appLabel(apps, slug) {
  return apps[slug] && apps[slug].label ? apps[slug].label : slug;
}

function section(title, inner, extraClass) {
  return '  <section class="doc__section' + (extraClass ? " " + extraClass : "") + '">' + (title ? "<h2>" + esc(title) + "</h2>" : "") + inner + "</section>\n";
}

// The approaches sit in one row of a 1200px document with a 24px gap, so the
// option count caps the width. Past the budget the row wraps, which costs the
// reader the side-by-side comparison the block exists for.
var ROW_BUDGET = { 1: 1200, 2: 588, 3: 384, 4: 282 };

function list(cls, items) {
  return '<ul class="' + cls + '">' + items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ul>";
}

function findById(arr, id) {
  var hit = null;
  (arr || []).forEach(function (x) { if (x.id === id) hit = x; });
  return hit;
}

// context.question is the feature's framing question and the schema requires it, so the
// only honest reason not to render it is that the reader is already reading it: some
// decision asks the same thing word for word, which is what the converter produces when
// it derives decisions[0].question from this field. Anything else gets rendered.
//
// An earlier version suppressed it for every one-decision document, on the theory that the
// two are always the same sentence there. They are only the same in a CONVERTED file. A
// freshly authored one-decision proposal whose decision is narrower than its framing
// question lost that question entirely, and no test noticed.
function questionHtml(data) {
  var repeated = data.decisions.some(function (d) { return d.question === data.context.question; });
  if (repeated) return "";
  return '<p class="doc__question">' + esc(data.context.question) + "</p>";
}

// The answer is one sentence and nothing else. It used to carry a question-and-pick list
// under it, which "What we propose" printed again ten lines later with the cost added:
// measured on the acceptance document, every question was printed three times and every
// pick five. The table is the summary; this is the statement.
//
// The pick lookup stays, because it is the only place that catches a pick naming an option
// that does not exist before the decision blocks render. Dropping the list must not drop
// the check with it.
function answerHtml(data) {
  data.decisions.forEach(function (d) {
    if (!findById(d.options, d.pick.optionId))
      throw new Error('proposal-data: decision "' + d.id + '" picks optionId "' + d.pick.optionId + '", which names no option in it');
  });
  return section("", questionHtml(data) + '<p class="answer">' + esc(data.answer) + "</p>");
}

function terrainHtml(board) {
  if (!board || !board.places || !board.places.length) return "";
  var svg = breadboard.breadboardSvg(board);
  var legend =
    '<p class="bb__legend"><span><i class="bb__swatch"></i>Exists today</span>' +
    '<span><i class="bb__swatch bb__swatch--new"></i>What this adds</span></p>';
  return section("The terrain", '<div class="bb">' + svg + "</div>" + legend);
}

// The document PROPOSES; the reader decides. So nothing a reader sees says "decided" or
// "picked": the summary is "What we propose", a block is "Question N of M", the winning
// column is "Proposed" and the lead is "We propose". The data model still calls them
// decisions[] and pick, because that is what the author is choosing between and what the
// flow bridge addresses by id, and renaming those would break every authored file and both
// --decision and --option for no reader.
function glanceHtml(decisions) {
  if (decisions.length < 2) return "";
  var rows = decisions.map(function (d) {
    var win = findById(d.options, d.pick.optionId);
    return "<tr><th>" + esc(d.question) + "</th><td>" + esc(win.name) + "</td><td>" + esc(d.pick.cost) + "</td></tr>";
  }).join("");
  var table =
    '<table class="decisions-at-a-glance"><thead><tr><th>The question</th><th>What we propose</th><th>What it costs</th></tr></thead>' +
    "<tbody>" + rows + "</tbody></table>";
  return section("What we propose", table);
}

function briefingHtml(data) {
  function col(label, inner) {
    return '<div class="briefing__col"><h3>' + esc(label) + "</h3>" + inner + "</div>";
  }
  var research = data.research.ran
    ? list("doc__list", data.research.findings.map(function (f) {
        return esc(f.claim) + ' <span class="doc__source">(' + esc(f.source) + ")</span>";
      }))
    : '<p class="doc__muted">Not researched: ' + esc(data.research.skippedBecause || "") + "</p>";
  var inner =
    '<div class="briefing">' +
    col("Goals", list("doc__list", data.scope.goals.map(esc))) +
    col("Not doing", list("doc__list", data.scope.nonGoals.map(esc))) +
    col("How it works today", list("doc__list", data.context.product.map(esc))) +
    col("What comparable products do", research) +
    "</div>";
  if (data.context.gap) inner += '<p class="doc__gap">Gap: ' + esc(data.context.gap) + "</p>";
  return section("The briefing", inner);
}

// What a drawing is made of, printed where a reader can see it. "Built from" is quiet, and
// is the ordinary case. "Adds" is not quiet: a proposal that needs a component the system
// does not have is proposing work nobody has costed, and that belongs beside the drawing
// rather than in a build ticket three weeks later.
function compositionHtml(o) {
  var out = "";
  if ((o.uses || []).length)
    out += '<p class="option__built">Built from ' + o.uses.map(esc).join(", ") + "</p>";
  (o.adds || []).forEach(function (a) {
    out += '<p class="option__adds"><span class="option__adds-kind">Adds</span> ' + esc(a.component) + ". " + esc(a.why) + "</p>";
  });
  return out;
}

function optionHtml(o, index, apps, width, lead) {
  if (!apps[o.anchor.app])
    throw new Error('proposal-data: unknown app "' + o.anchor.app + '" in option "' + o.id + '"; known: ' + Object.keys(apps).join(", "));
  var bad = unbalancedTag(o.screen.html);
  if (bad) throw new Error("proposal-data: unbalanced <" + bad + '> in option "' + o.id + '"');
  var type = flowRenderer.resolveChrome({ template: templateForApp(o.anchor.app) }).appHeaderType;
  var strip = flowRenderer.appHeader(type);
  // One voice under a drawing, not three. The annotations used to be an uppercase list, the
  // two lines carried bold black labels, and the verdict floated as a fourth thing: four
  // treatments for "tell me about this option", the loudest of them the hardest to read.
  // Now it is a sentence, a qualifier, and a quiet run of the annotations joined by middots.
  var notes = (o.screen.notes || []).length
    ? '<p class="option__notes">' + o.screen.notes.map(esc).join(" &middot; ") + "</p>"
    : "";
  // The proposed option is named and judged in the case beside it, so its own card carries
  // neither: a name printed twice a hand's width apart, and a verdict tag over three reasons
  // that say the same thing at length, are both the document agreeing with itself.
  var label = lead
    ? '<span class="proposal-screen__label proposal-screen__label--lead">' +
      '<span class="proposal-screen__anchor">' + esc(appLabel(apps, o.anchor.app) + ", " + o.anchor.surface) + "</span></span>"
    : '<span class="proposal-screen__label">' +
      '<span class="proposal-screen__name"><span class="proposal-screen__num">' + (index + 1) + "</span>" + esc(o.name) + "</span>" +
      '<span class="proposal-screen__anchor">' + esc(appLabel(apps, o.anchor.app) + ", " + o.anchor.surface) + "</span></span>";
  var verdict = lead ? "" : '<p class="approach__verdict"><span class="fm-tag">' + esc(o.verdict) + "</span></p>";
  return (
    '<div class="proposal-screen__col" style="width:' + width + 'px">' + label +
    '<div class="proposal-screen" data-name="' + esc(o.id) + '" style="width:' + width + 'px">' + strip +
    '<div class="proposal-screen__body">' + o.screen.html + "</div></div>" + notes +
    '<p class="approach__lines">' + esc(o.whatItIs) + '<br><span class="approach__breaks">Breaks when.</span> ' + esc(o.breaksWhen) + "</p>" +
    compositionHtml(o) + verdict +
    "</div>\n"
  );
}

function comparisonHtml(cmp, options, pickedId) {
  var head =
    "<tr><th></th>" +
    options.map(function (o) {
      if (o.id !== pickedId) return "<th>" + esc(o.name) + "</th>";
      return '<th class="compare__pick">' + esc(o.name) + '<span class="compare__picked">Proposed</span></th>';
    }).join("") +
    "</tr>";
  var rows = cmp.criteria.map(function (c) {
    var cells = options.map(function (o) {
      var mark = o.id === pickedId ? " compare__pick" : "";
      var cell = (cmp.cells[o.id] || {})[c.id];
      var tone = cell ? TONES[cell.tone] || "tone-mixed" : "tone-mixed";
      return (
        '<td class="' + tone + mark + '"><span class="compare__mark"></span>' +
        '<span class="compare__text">' + esc(cell ? cell.text : "") + "</span></td>"
      );
    }).join("");
    return "<tr><th>" + esc(c.label) + '<span class="compare__source">' + esc(c.source) + "</span></th>" + cells + "</tr>";
  }).join("");
  return '<table class="compare"><thead>' + head + "</thead><tbody>" + rows + "</tbody></table>";
}

function pickHtml(d) {
  var win = findById(d.options, d.pick.optionId);
  var reasons = d.pick.reasons.map(function (r) {
    var crit = findById(d.comparison.criteria, r.criterionId);
    if (!crit)
      throw new Error('proposal-data: decision "' + d.id + '" has a reason naming criterionId "' + r.criterionId + '", which names no criterion in it');
    return '<li><span class="pick__crit">' + esc(crit.label) + "</span> " + esc(r.text) + "</li>";
  }).join("");
  var inner =
    '<div class="pick"><p class="pick__lead"><span class="decision__kicker">We propose</span>' + esc(win.name) + "</p>" +
    '<ul class="pick__reasons">' + reasons + "</ul>" +
    '<p class="pick__cost"><b>What it costs.</b> ' + esc(d.pick.cost) + "</p></div>";
  if (d.blocker) inner += '<p class="decision__blocker"><b>Blocker.</b> ' + esc(d.blocker) + "</p>";
  return inner;
}

// A decision block leads with what we propose and argues for it, then shows what it was
// chosen over, then the evidence. It used to run the other way: the question, three options
// at one width, a fifteen-cell table, and only at the bottom "We pick". A reader did the
// comparison themselves and then learned it had already been done, and two thirds of the
// drawings on the page were things we are not doing, at the same size as the thing we are.
//
// The rejected options still render at ONE width as each other, so none of them is flattered
// over its peers; what changed is that the proposal leads and they follow, smaller, under a
// heading that says what they are. The comparison below is unchanged and complete, which is
// what keeps this a proposal rather than a sales sheet.
var ALSO_SCALE = 0.72;

function decisionHtml(d, index, apps, total) {
  var budget = ROW_BUDGET[d.options.length] || ROW_BUDGET[4];
  var widest = 0;
  d.options.forEach(function (o) { widest = Math.max(widest, Number(o.screen.width) || 360); });
  var width = Math.min(Math.max(widest, 280), budget);
  var alsoWidth = Math.max(240, Math.round(width * ALSO_SCALE));
  var kicker = total > 1 ? '<span class="decision__kicker">Question ' + (index + 1) + " of " + total + "</span>" : "";

  var win = findById(d.options, d.pick.optionId);
  var rest = d.options.filter(function (o) { return o.id !== d.pick.optionId; });
  var leadHtml =
    '<div class="decision__lead">' +
    optionHtml(win, d.options.indexOf(win), apps, width, true) +
    '<div class="decision__case">' + pickHtml(d) + "</div></div>";
  var alsoHtml = rest.length
    ? '<div class="also"><h3>Also considered</h3><div class="approaches">' +
      rest.map(function (o) { return optionHtml(o, d.options.indexOf(o), apps, alsoWidth, false); }).join("") +
      "</div></div>"
    : "";
  var compareHtml =
    '<div class="compare-block"><h3>How they compare</h3>' +
    comparisonHtml(d.comparison, d.options, d.pick.optionId) +
    "</div>";

  return (
    '  <section class="decision" id="' + esc(d.id) + '">' + kicker + "<h2>" + esc(d.question) + "</h2>" +
    leadHtml + alsoHtml + compareHtml + "</section>\n"
  );
}

function openQuestionsHtml(listed) {
  if (!listed || !listed.length) return "";
  var items = listed.map(function (q) {
    var kind = q.kind === "rabbit hole" ? "Rabbit hole" : "Open question";
    return '<span class="oq__kind">' + kind + "</span>" + esc(q.text);
  });
  return section("What is still open", list("doc__list oq", items));
}

function changeHtml(change) {
  function col(label, text) {
    return text ? '<div class="change__col"><h3>' + esc(label) + "</h3><p>" + esc(text) + "</p></div>" : "";
  }
  var inner = '<div class="change">' + col("Admin side", change.adminSide) + col("User side", change.userSide) + "</div>";
  return section("What this changes", inner);
}

// Where the assessment meets the substrate. These used to be one semicolon-joined run-on
// inside the briefing, which is where a reader is still learning the problem and has no use
// for a bibliography. Each source is one row of kind and text, and the kind is the prefix
// the schema already asks for, so the rows line up instead of repeating "app-context:" five
// times down the left. A source with no recognised prefix renders as its own text, unkinded,
// rather than being dropped: an unlabelled citation is still a citation.
//
// context.gap stays in the briefing. It says what the product read could NOT reach, which
// qualifies the read rather than sourcing it, and a reader needs it beside the facts it
// qualifies rather than at the end.
function citationsHtml(sources) {
  if (!sources || !sources.length) return "";
  var rows = sources.map(function (src) {
    var cut = src.indexOf(": ");
    var kind = cut === -1 ? "" : src.slice(0, cut);
    var text = cut === -1 ? src : src.slice(cut + 2);
    return (
      '<div class="citations__row">' +
      '<span class="citations__kind">' + esc(kind) + "</span>" +
      '<span class="citations__text">' + esc(text) + "</span></div>"
    );
  }).join("");
  return section("Where this came from", '<div class="citations">' + rows + "</div>");
}

function latitudeHtml(text) {
  if (!text) return "";
  return section("", '<p class="doc__latitude">' + esc(text) + "</p>");
}

// Provenance is one line saying who and when. The follow-ups that used to sit here
// named the data file, the --from flag and a slash command: build instructions, in the
// last thing a PM reads, addressed to the one reader who is not reading. The skill
// offers them in chat, where the author already is.
function footerHtml(meta) {
  return '  <p class="doc__footer">' + esc(meta.skill + (meta.model ? ", " + meta.model : "") + ", " + meta.date + ".") + "</p>\n";
}

function assembleProposal(data) {
  var errors = validateSchema(data, JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"))).filter(function (e) {
    return e.indexOf("(warning)") === -1;
  });
  if (errors.length) throw new Error("proposal-data: schema: " + errors.join("; "));
  var meta = data.meta;
  var apps = loadApps();
  var total = data.decisions.length;
  var sections =
    answerHtml(data) +
    terrainHtml(data.breadboard) +
    glanceHtml(data.decisions) +
    briefingHtml(data) +
    data.decisions.map(function (d, i) { return decisionHtml(d, i, apps, total); }).join("") +
    openQuestionsHtml(data.openQuestions) +
    changeHtml(data.change) +
    citationsHtml(data.context.sources) +
    latitudeHtml(data.latitude) +
    footerHtml(meta);
  var context = [meta.ticket || "", meta.apps.map(function (a) { return appLabel(apps, a); }).join(", "), meta.date]
    .filter(Boolean).join("  ·  ");
  var metaComment =
    "<!--\n  Actian Design System, design-proposal (document deliverable)\n" +
    "  skill:   " + maskComment(meta.skill) + "\n" +
    "  ticket:  " + maskComment(meta.ticket || "") + "\n" +
    "  prompt:  " + maskComment(meta.prompt || "") + "\n" +
    "  date:    " + maskComment(meta.date) + "\n" +
    "  model:   " + maskComment(meta.model || "") + "\n-->";
  var fmCss = readFileChecked(renderer.cssPaths.fmBase);
  var template = readFileChecked(TEMPLATE_PATH);
  return template
    .replace("{{META_COMMENT}}", function () { return metaComment; })
    .replace(/\{\{TITLE\}\}/g, function () { return esc(meta.title); })
    .replace("{{CONTEXT}}", function () { return esc(context); })
    .replace("{{FM_CSS}}", function () { return fmCss; })
    .replace("<!-- {{SECTIONS}} -->", function () { return sections; });
}

module.exports = {
  assembleProposal: assembleProposal,
  extractUnbalancedTag: unbalancedTag,
};
