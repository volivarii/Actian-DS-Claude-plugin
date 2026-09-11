"use strict";

/**
 * assemble-proposal.js: assembles a design proposal document, one offline HTML
 * file, from proposals/proposal-data.json: context, research, the approaches
 * drawn inside their anchor, a comparison table and the recommendation.
 *
 * Grounding the author does not have to think about: the app header strip is
 * the flow renderer's own appHeader markup for the anchor's app (so the label
 * is the one the substrate records), fm-base.css is inlined from the vendored
 * renderer, and the file loads nothing from the network.
 *
 * No side effects at load. Exported: assembleProposal(data) -> html string.
 * Throws Error("proposal-data: ...") on schema errors, unknown app slugs,
 * unbalanced fragments and an unresolved recommendation; validate-proposal.js
 * reports the same things as findings before an author gets here.
 */

var fs = require("fs");
var path = require("path");
var PATHS = require("../lib/paths");
var shared = require("./assemble-shared");
var renderer = require("../lib/renderer.js");
var validateSchema = require("../validation/validate-schema.js");
var flowRenderer = require("./html-renderers/flow-renderer.js");

var esc = renderer.fmHtmlMap.esc;
var readFileChecked = shared.readFileChecked;
var TEMPLATE_PATH = path.join(shared.TEMPLATES_DIR, "proposal-document.html");
var SCHEMA_PATH = path.join(__dirname, "..", "..", "schemas", "proposal-data.schema.json");

// Tags a fragment may open; each must close. Void elements are not listed.
var BALANCED_TAGS = ["div", "span", "p", "section", "button", "a", "ul", "ol", "li", "table", "thead", "tbody", "tr", "td", "th", "label", "h1", "h2", "h3", "h4"];
var TONES = { good: "tone-good", mixed: "tone-mixed", bad: "tone-bad" };

function maskComment(s) {
  return String(s == null ? "" : s).replace(/-(?=-)/g, "-​");
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

function contextHtml(c) {
  var inner = '<p class="doc__question">' + esc(c.question) + "</p><p>" + esc(c.product) + "</p>";
  inner += '<p class="doc__muted">Sources: ' + esc(c.sources.join("; ")) + "</p>";
  if (c.gap) inner += '<p class="doc__muted">Gap: ' + esc(c.gap) + "</p>";
  return section("Where this lives today", inner);
}

function researchHtml(r) {
  if (!r.ran) return section("What comparable products do", '<p class="doc__muted">Not researched: ' + esc(r.skippedBecause || "") + "</p>");
  var items = r.findings.map(function (f) {
    return "<li>" + esc(f.claim) + ' <span class="doc__source">(' + esc(f.source) + ")</span></li>";
  }).join("");
  return section("What comparable products do", '<ul class="doc__list">' + items + "</ul>");
}

function approachHtml(a, index, apps) {
  if (!apps[a.anchor.app])
    throw new Error('proposal-data: unknown app "' + a.anchor.app + '" in approach "' + a.id + '"; known: ' + Object.keys(apps).join(", "));
  var bad = unbalancedTag(a.screen.html);
  if (bad) throw new Error("proposal-data: unbalanced <" + bad + '> in approach "' + a.id + '"');
  var type = flowRenderer.resolveChrome({ template: templateForApp(a.anchor.app) }).appHeaderType;
  var strip = flowRenderer.appHeader(type);
  var width = Number(a.screen.width) || 360;
  return (
    '<div class="proposal-screen__col">' +
    '<span class="proposal-screen__label"><span class="proposal-screen__num">' + (index + 1) + "</span>" + esc(a.name) +
    ' <span class="doc__source">' + esc(appLabel(apps, a.anchor.app) + ", " + a.anchor.surface) + "</span></span>" +
    '<div class="proposal-screen" data-name="' + esc(a.id) + '" style="width:' + width + 'px">' + strip +
    '<div class="proposal-screen__body">' + a.screen.html + "</div></div>" +
    '<p class="approach__lines"><b>What it is.</b> ' + esc(a.whatItIs) + "<br><b>Breaks when.</b> " + esc(a.breaksWhen) + "</p>" +
    '<p class="approach__verdict"><span class="fm-tag">' + esc(a.verdict) + "</span></p>" +
    "</div>\n"
  );
}

function comparisonHtml(cmp, approaches) {
  var head = "<tr><th></th>" + approaches.map(function (a) { return "<th>" + esc(a.name) + "</th>"; }).join("") + "</tr>";
  var rows = cmp.criteria.map(function (c) {
    var cells = approaches.map(function (a) {
      var cell = (cmp.cells[a.id] || {})[c.id];
      if (!cell) return "<td></td>";
      return '<td class="' + (TONES[cell.tone] || "tone-mixed") + '">' + esc(cell.text) + "</td>";
    }).join("");
    return "<tr><th>" + esc(c.label) + '<span class="compare__source">' + esc(c.source) + "</span></th>" + cells + "</tr>";
  }).join("");
  return section("How they compare", '<table class="compare"><thead>' + head + "</thead><tbody>" + rows + "</tbody></table>");
}

function recommendationHtml(rec, approaches) {
  var pick = null;
  approaches.forEach(function (a) { if (a.id === rec.approachId) pick = a; });
  if (!pick) throw new Error('proposal-data: recommendation.approachId "' + rec.approachId + '" names no approach');
  var inner = '<p class="rec__pick">Recommendation</p><h2>' + esc(pick.name) + "</h2><p>" + esc(rec.summary) + "</p>";
  inner += '<div class="rec__reasons">' + rec.reasons.map(function (r) {
    return '<div class="rec__reason"><b>' + esc(r.title) + "</b>" + esc(r.why) + "</div>";
  }).join("") + "</div>";
  if (rec.change && (rec.change.adminSide || rec.change.userSide)) {
    inner += '<p class="rec__change">';
    if (rec.change.adminSide) inner += "<b>Admin side.</b> " + esc(rec.change.adminSide) + " ";
    if (rec.change.userSide) inner += "<b>User side.</b> " + esc(rec.change.userSide);
    inner += "</p>";
  }
  return section("", inner, "rec");
}

function footerHtml(meta, pick) {
  var next = "Follow-ups: adjust (edit proposals/proposal-data.json, re-run with --from); make " + (pick ? pick.name : "the recommended approach") + " a flow (/generate-flow with its screen list).";
  return '  <p class="doc__footer">' + esc(meta.skill + (meta.model ? ", " + meta.model : "") + ", " + meta.date + ". " + next) + "</p>\n";
}

function assembleProposal(data) {
  var errors = validateSchema(data, JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"))).filter(function (e) {
    return e.indexOf("(warning)") === -1;
  });
  if (errors.length) throw new Error("proposal-data: schema: " + errors.join("; "));
  var meta = data.meta;
  var apps = loadApps();
  var approaches = data.approaches.map(function (a, i) { return approachHtml(a, i, apps); }).join("");
  var pick = null;
  data.approaches.forEach(function (a) { if (a.id === data.recommendation.approachId) pick = a; });
  var sections =
    contextHtml(data.context) +
    researchHtml(data.research) +
    section("Approaches", '<div class="approaches">' + approaches + "</div>") +
    comparisonHtml(data.comparison, data.approaches) +
    recommendationHtml(data.recommendation, data.approaches) +
    footerHtml(meta, pick);
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
