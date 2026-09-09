"use strict";

/**
 * assemble-proposal.js: assembles a design proposal board, one offline HTML
 * file of authored Fat Marker screens with captions, from proposals/proposal-data.json.
 *
 * Grounding the author does not have to think about: the app header strip is
 * the flow renderer's own appHeader markup for the screen's app (so the label
 * is the one the substrate records), fm-base.css is inlined from the vendored
 * renderer, and the file loads nothing from the network.
 *
 * No side effects at load. Exported: assembleProposal(data) -> html string.
 * Throws Error("proposal-data: ...") on schema errors, unknown app slugs and
 * unbalanced fragments; validate-proposal.js reports the same things as
 * findings before an author gets here.
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
var TEMPLATE_PATH = path.join(shared.TEMPLATES_DIR, "proposal-board.html");
var SCHEMA_PATH = path.join(
  __dirname,
  "..",
  "..",
  "schemas",
  "proposal-data.schema.json",
);

// Tags a fragment may open; each must close. Void elements are not listed.
var BALANCED_TAGS = [
  "div",
  "span",
  "p",
  "section",
  "button",
  "a",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "label",
  "h1",
  "h2",
  "h3",
  "h4",
];

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

function screenHtml(s, index, apps) {
  if (!apps[s.app])
    throw new Error(
      'proposal-data: unknown app "' +
        s.app +
        '" in screen "' +
        s.id +
        '"; known: ' +
        Object.keys(apps).join(", "),
    );
  var bad = unbalancedTag(s.html);
  if (bad)
    throw new Error(
      "proposal-data: unbalanced <" + bad + '> in screen "' + s.id + '"',
    );
  var chrome = s.chrome || "header";
  var strip = "";
  if (chrome === "header") {
    var type = flowRenderer.resolveChrome({
      template: templateForApp(s.app),
    }).appHeaderType;
    strip = flowRenderer.appHeader(type);
  }
  var width = Number(s.width) || 360;
  return (
    '<div class="proposal-screen__col">' +
    '<span class="proposal-screen__label"><span class="proposal-screen__num">' +
    (index + 1) +
    "</span>" +
    esc(s.name) +
    "</span>" +
    '<div class="proposal-screen" data-name="' +
    esc(s.id) +
    '" style="width:' +
    width +
    'px">' +
    strip +
    '<div class="proposal-screen__body">' +
    s.html +
    "</div>" +
    "</div>" +
    (s.caption
      ? '<p class="proposal-screen__caption">' + esc(s.caption) + "</p>"
      : "") +
    "</div>\n"
  );
}

function assembleProposal(data) {
  var errors = validateSchema(
    data,
    JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8")),
  ).filter(function (e) {
    return e.indexOf("(warning)") === -1;
  });
  if (errors.length)
    throw new Error("proposal-data: schema: " + errors.join("; "));
  var meta = data.meta;
  var apps = loadApps();
  var screens = data.screens
    .map(function (s, i) {
      return screenHtml(s, i, apps);
    })
    .join("");
  if (meta.recommendation) {
    var badRec = unbalancedTag(meta.recommendation);
    if (badRec)
      throw new Error(
        "proposal-data: unbalanced <" + badRec + "> in recommendation",
      );
  }
  var context = [
    meta.ticket || "",
    (meta.apps || [])
      .map(function (a) {
        return apps[a] && apps[a].label ? apps[a].label : a;
      })
      .join(", "),
    meta.date,
  ]
    .filter(Boolean)
    .join("  ·  ");
  var recommendation = meta.recommendation
    ? '  <section class="board__recommendation"><h2>Recommendation</h2>' +
      meta.recommendation +
      "</section>\n"
    : "";
  var metaComment =
    "<!--\n  Actian Design System, design-proposal (board deliverable)\n" +
    "  skill:   " +
    maskComment(meta.skill) +
    "\n" +
    "  ticket:  " +
    maskComment(meta.ticket || "") +
    "\n" +
    "  prompt:  " +
    maskComment(meta.prompt || "") +
    "\n" +
    "  date:    " +
    maskComment(meta.date) +
    "\n" +
    "  model:   " +
    maskComment(meta.model || "") +
    "\n-->";
  var fmCss = readFileChecked(renderer.cssPaths.fmBase);
  var template = readFileChecked(TEMPLATE_PATH);
  return template
    .replace("{{META_COMMENT}}", function () {
      return metaComment;
    })
    .replace(/\{\{TITLE\}\}/g, function () {
      return esc(meta.title);
    })
    .replace("{{CONTEXT}}", function () {
      return esc(context);
    })
    .replace("{{FM_CSS}}", function () {
      return fmCss;
    })
    .replace("<!-- {{SCREENS}} -->", function () {
      return screens;
    })
    .replace("{{RECOMMENDATION}}", function () {
      return recommendation;
    });
}

module.exports = {
  assembleProposal: assembleProposal,
  extractUnbalancedTag: unbalancedTag,
};
