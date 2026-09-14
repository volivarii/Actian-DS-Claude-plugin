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

function answerHtml(data) {
  var picks = data.decisions.map(function (d) {
    var win = findById(d.options, d.pick.optionId);
    if (!win) throw new Error('proposal-data: decision "' + d.id + '" picks optionId "' + d.pick.optionId + '", which names no option in it');
    return '<li class="answer-pick">' + esc(d.question) + " <b>" + esc(win.name) + "</b></li>";
  }).join("");
  return section("", questionHtml(data) + '<p class="answer">' + esc(data.answer) + '</p><ul class="answer-picks">' + picks + "</ul>");
}

function terrainHtml(board) {
  if (!board || !board.places || !board.places.length) return "";
  var svg = breadboard.breadboardSvg(board);
  var legend =
    '<p class="bb__legend"><span><i class="bb__swatch"></i>Exists today</span>' +
    '<span><i class="bb__swatch bb__swatch--new"></i>What this adds</span></p>';
  return section("The terrain", '<div class="bb">' + svg + "</div>" + legend);
}

function glanceHtml(decisions) {
  if (decisions.length < 2) return "";
  var rows = decisions.map(function (d) {
    var win = findById(d.options, d.pick.optionId);
    return "<tr><th>" + esc(d.question) + "</th><td>" + esc(win.name) + "</td><td>" + esc(d.pick.cost) + "</td></tr>";
  }).join("");
  var table =
    '<table class="decisions-at-a-glance"><thead><tr><th>Decision</th><th>What we picked</th><th>What it costs</th></tr></thead>' +
    "<tbody>" + rows + "</tbody></table>";
  return section("What we decided", table);
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
  inner += '<p class="doc__muted">Sources: ' + esc(data.context.sources.join("; ")) + "</p>";
  if (data.context.gap) inner += '<p class="doc__gap">Gap: ' + esc(data.context.gap) + "</p>";
  return section("The briefing", inner);
}

function optionHtml(o, index, apps, width) {
  if (!apps[o.anchor.app])
    throw new Error('proposal-data: unknown app "' + o.anchor.app + '" in option "' + o.id + '"; known: ' + Object.keys(apps).join(", "));
  var bad = unbalancedTag(o.screen.html);
  if (bad) throw new Error("proposal-data: unbalanced <" + bad + '> in option "' + o.id + '"');
  var type = flowRenderer.resolveChrome({ template: templateForApp(o.anchor.app) }).appHeaderType;
  var strip = flowRenderer.appHeader(type);
  var notes = (o.screen.notes || []).length
    ? '<ul class="option__notes">' + o.screen.notes.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul>"
    : "";
  return (
    '<div class="proposal-screen__col" style="width:' + width + 'px">' +
    '<span class="proposal-screen__label">' +
    '<span class="proposal-screen__name"><span class="proposal-screen__num">' + (index + 1) + "</span>" + esc(o.name) + "</span>" +
    '<span class="proposal-screen__anchor">' + esc(appLabel(apps, o.anchor.app) + ", " + o.anchor.surface) + "</span></span>" +
    '<div class="proposal-screen" data-name="' + esc(o.id) + '" style="width:' + width + 'px">' + strip +
    '<div class="proposal-screen__body">' + o.screen.html + "</div></div>" + notes +
    '<p class="approach__lines"><b>What it is.</b> ' + esc(o.whatItIs) + "<br><b>Breaks when.</b> " + esc(o.breaksWhen) + "</p>" +
    '<p class="approach__verdict"><span class="fm-tag">' + esc(o.verdict) + "</span></p>" +
    "</div>\n"
  );
}

function comparisonHtml(cmp, options) {
  var head = "<tr><th></th>" + options.map(function (o) { return "<th>" + esc(o.name) + "</th>"; }).join("") + "</tr>";
  var rows = cmp.criteria.map(function (c) {
    var cells = options.map(function (o) {
      var cell = (cmp.cells[o.id] || {})[c.id];
      if (!cell) return "<td></td>";
      return '<td class="' + (TONES[cell.tone] || "tone-mixed") + '">' + esc(cell.text) + "</td>";
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
    '<div class="pick"><p class="pick__lead"><span class="decision__kicker">We pick</span>' + esc(win.name) + "</p>" +
    '<ul class="pick__reasons">' + reasons + "</ul>" +
    '<p class="pick__cost"><b>What it costs.</b> ' + esc(d.pick.cost) + "</p></div>";
  if (d.blocker) inner += '<p class="decision__blocker"><b>Blocker.</b> ' + esc(d.blocker) + "</p>";
  return inner;
}

function decisionHtml(d, index, apps, total) {
  var budget = ROW_BUDGET[d.options.length] || ROW_BUDGET[4];
  var widest = 0;
  d.options.forEach(function (o) { widest = Math.max(widest, Number(o.screen.width) || 360); });
  var width = Math.min(Math.max(widest, 280), budget);
  var kicker = total > 1 ? '<span class="decision__kicker">Decision ' + (index + 1) + " of " + total + "</span>" : "";
  var options = d.options.map(function (o, i) { return optionHtml(o, i, apps, width); }).join("");
  return (
    '  <section class="decision" id="' + esc(d.id) + '">' + kicker + "<h2>" + esc(d.question) + "</h2>" +
    '<div class="approaches">' + options + "</div>" +
    comparisonHtml(d.comparison, d.options) + pickHtml(d) + "</section>\n"
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
