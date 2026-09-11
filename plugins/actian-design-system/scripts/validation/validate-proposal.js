#!/usr/bin/env node
"use strict";

/**
 * validate-proposal.js: findings for proposals/proposal-data.json (the
 * document shape) before it is assembled. Same table shape and exit
 * convention as validate-flow-data.js (any P0 exits 1). Terminology and
 * avoid-word rules are NOT re-implemented: every text field is handed to the
 * flow validator's exported gates, so the rules stay single-sourced.
 *
 * Checks: schema (P0), bounds (P0), app-unknown (P0 on meta.apps and on an
 * anchor, P1 on screens[].app), research (P0), recommendation (P0),
 * unbalanced (P0), script (P0), external-load (P0), template-unknown (P1),
 * entity-unknown (P1), hardcoded-color (P1), in-flow (P1), toggle-target (P1),
 * terminology (P1), avoid-word (P1), em-dash (P2).
 *
 * Usage: validate-proposal.js <proposal-data.json> [--json] [--help]
 */

var fs = require("fs");
var path = require("path");
var PATHS = require("../lib/paths");
var validateSchema = require("./validate-schema.js");
var flowGates = require("./validate-flow-data.js");
var extractUnbalancedTag = require("../renderers/assemble-proposal.js").extractUnbalancedTag;

var SCHEMA_PATH = path.join(__dirname, "..", "..", "schemas", "proposal-data.schema.json");
var ARCHETYPES_PATH = path.join(__dirname, "..", "..", "recipes", "flow", "_index.json");
var MAX_APPROACHES = 4;
var MAX_FINDINGS = 5;
var MAX_REASONS = 4;
var MAX_FLOW_SCREENS = 4;
var MIN_WIDTH = 240;
var MAX_WIDTH = 720;
var TONES = ["good", "mixed", "bad"];
var EM_DASH = "\u2014"; // written as an escape so no source line carries the character
var COLOUR = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|\brgba?\(/g;

function decode(s) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

// Visible text of a fragment: text nodes plus the attributes a reader sees or hears.
function extractText(html) {
  var s = String(html == null ? "" : html);
  s = s.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ");
  var attrs = [];
  var re = /\s(?:alt|title|placeholder|aria-label)\s*=\s*"([^"]*)"/gi;
  var m;
  while ((m = re.exec(s)) !== null) attrs.push(m[1]);
  var text = s.replace(/<[^>]+>/g, " ");
  return decode((text + " " + attrs.join(" ")).replace(/\s+/g, " ").trim());
}

function styleSources(html) {
  var out = [];
  var m;
  var attr = /\sstyle\s*=\s*"([^"]*)"/gi;
  while ((m = attr.exec(html)) !== null) out.push(m[1]);
  var block = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  while ((m = block.exec(html)) !== null) out.push(m[1]);
  return out;
}

function stripComments(html) {
  return String(html == null ? "" : html).replace(/<!--[\s\S]*?-->/g, "");
}

function finding(severity, check, screen, p, value, found, suggestion) {
  var f = { severity: severity, check: check, screen: screen, path: p, value: value };
  if (found !== undefined) f.found = found;
  if (suggestion !== undefined) f.suggestion = suggestion;
  return f;
}

// Structural checks on a drawing: unbalanced tags, script, external loads, hard-coded
// colour, absolute positioning. Comments are stripped first so a commented-out tag never counts.
function checkFragment(html, approachId, p, findings) {
  var bad = extractUnbalancedTag(html);
  if (bad) findings.push(finding("P0", "unbalanced", approachId, p, "<" + bad + "> opened and closed a different number of times"));
  var s = stripComments(html);
  if (/<script\b/i.test(s)) findings.push(finding("P0", "script", approachId, p, "<script> in a fragment", "<script", "use data-toggle for clicks"));
  else if (/\son[a-z]+\s*=/i.test(s)) findings.push(finding("P0", "script", approachId, p, "inline event handler", "on*=", "use data-toggle for clicks"));
  else if (/javascript:/i.test(s)) findings.push(finding("P0", "script", approachId, p, "javascript: URL", "javascript:", "use data-toggle for clicks"));
  var ext = s.match(/\b(?:src|href|srcset)\s*=\s*["']?(?:https?:)?\/\/[^"'\s>]*/i);
  if (!ext) {
    styleSources(s).some(function (css) {
      var m = css.match(/url\(\s*["']?(?:https?:)?\/\/[^"')]*/i);
      if (m) { ext = [m[0]]; return true; }
      return false;
    });
  }
  if (ext) findings.push(finding("P0", "external-load", approachId, p, ext[0], ext[0], "the document is offline; inline the asset or drop it"));
  styleSources(s).forEach(function (css) {
    (css.match(COLOUR) || []).forEach(function (c) {
      findings.push(finding("P1", "hardcoded-color", approachId, p, c, c, "use a --fm-* variable (references/ds-rules/fm-css-reference.md)"));
    });
    if (/position\s*:\s*absolute/i.test(css))
      findings.push(finding("P1", "in-flow", approachId, p, "position:absolute in a drawing", "position:absolute", "draw the overlay in flow inside its anchor; the frame no longer clips"));
  });
}

// Prose checks on a text field: em dash (P2) and hard-coded colour (P1).
function checkProse(text, approachId, p, findings) {
  var s = String(text == null ? "" : text);
  if (s.indexOf(EM_DASH) !== -1) findings.push(finding("P2", "em-dash", approachId, p, "em dash", EM_DASH, "use a colon, comma or period"));
  (s.match(COLOUR) || []).forEach(function (c) {
    findings.push(finding("P1", "hardcoded-color", approachId, p, c, c, "name the token, not the value"));
  });
}

function loadApps() {
  try { return JSON.parse(fs.readFileSync(PATHS.appContext, "utf8")); } catch (e) { return {}; }
}

function loadArchetypes() {
  try {
    return JSON.parse(fs.readFileSync(ARCHETYPES_PATH, "utf8")).map(function (e) { return e.archetype; });
  } catch (e) { return []; }
}

function validateProposal(data) {
  var findings = [];
  var schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  var errors = validateSchema(data, schema).filter(function (e) { return e.indexOf("(warning)") === -1; });
  errors.forEach(function (e) { findings.push(finding("P0", "schema", "", "", e)); });
  if (errors.length) return { findings: findings };

  var ctx = loadApps();
  var apps = ctx.apps || {};
  var entities = ctx.entities || {};
  var appList = Object.keys(apps).join(", ");
  var archetypes = loadArchetypes();
  var idSeen = {}; // html ids are document-wide: id -> the approach it first appeared in
  var approachIds = {};

  // pseudo screens for the flow gates: one per approach plus four document-level ones.
  // content[n] maps back to a field through PATHS_BY_SCREEN.
  var pseudo = { meta: { feature: data.meta.title }, screens: [] };
  var pathsByScreen = {};
  function addPseudo(id, name, entries) {
    pathsByScreen[id] = entries.map(function (e) { return e.path; });
    pseudo.screens.push({ id: id, name: name, content: entries.map(function (e) { return { type: "TEXT", content: String(e.text == null ? "" : e.text) }; }) });
  }

  data.meta.apps.forEach(function (a, i) {
    if (!apps[a]) findings.push(finding("P0", "app-unknown", "", "meta.apps[" + i + "]", a, a, "one of " + appList));
  });
  checkProse(data.meta.title, "", "meta.title", findings);

  // context
  checkProse(data.context.question, "", "context.question", findings);
  checkProse(data.context.product, "", "context.product", findings);
  checkProse(data.context.gap, "", "context.gap", findings);
  addPseudo("context", "Context", [
    { path: "context.question", text: data.context.question },
    { path: "context.product", text: data.context.product },
    { path: "context.gap", text: data.context.gap || "" },
  ]);

  // research
  if (data.research.ran === false && !data.research.skippedBecause)
    findings.push(finding("P0", "research", "", "research.skippedBecause", "research did not run and says not why", "", "set skippedBecause (--no-research, the request said skip research, no web search in this session)"));
  if (data.research.findings.length > MAX_FINDINGS)
    findings.push(finding("P0", "bounds", "", "research.findings", data.research.findings.length + " findings; at most " + MAX_FINDINGS));
  data.research.findings.forEach(function (f, i) { checkProse(f.claim, "", "research.findings[" + i + "].claim", findings); });
  addPseudo("research", "Research", data.research.findings.map(function (f, i) { return { path: "research.findings[" + i + "].claim", text: f.claim }; }));

  // approaches
  if (data.approaches.length > MAX_APPROACHES)
    findings.push(finding("P0", "bounds", "", "approaches", data.approaches.length + " approaches; at most " + MAX_APPROACHES));
  data.approaches.forEach(function (a, i) {
    var ap = "approaches[" + i + "]";
    if (approachIds[a.id]) findings.push(finding("P0", "bounds", a.id, ap + ".id", "duplicate id " + a.id));
    approachIds[a.id] = true;
    if (!apps[a.anchor.app]) findings.push(finding("P0", "app-unknown", a.id, ap + ".anchor.app", a.anchor.app, a.anchor.app, "one of " + appList));
    if (a.screen.width < MIN_WIDTH || a.screen.width > MAX_WIDTH)
      findings.push(finding("P0", "bounds", a.id, ap + ".screen.width", "width " + a.screen.width + " outside " + MIN_WIDTH + " to " + MAX_WIDTH));
    checkFragment(a.screen.html, a.id, ap + ".screen.html", findings);
    var toggles = a.screen.html.match(/data-toggle\s*=\s*"([^"]+)"/g) || [];
    toggles.forEach(function (t) {
      var id = t.replace(/^.*"([^"]+)"$/, "$1");
      if (!new RegExp('\\sid\\s*=\\s*"' + id + '"').test(a.screen.html))
        findings.push(finding("P1", "toggle-target", a.id, ap + ".screen.html", 'data-toggle="' + id + '" has no id="' + id + '" in the same drawing', id, "add the id or drop the toggle"));
    });
    (stripComments(a.screen.html).match(/\sid\s*=\s*"([^"]+)"/g) || []).forEach(function (t) {
      var id = t.replace(/^.*"([^"]+)"$/, "$1");
      if (idSeen[id]) findings.push(finding("P1", "toggle-target", a.id, ap + ".screen.html", id, id, 'id "' + id + '" also appears in approach "' + idSeen[id] + '"; ids are document-wide, rename one'));
      else idSeen[id] = a.id;
    });
    if (a.screens.length > MAX_FLOW_SCREENS)
      findings.push(finding("P0", "bounds", a.id, ap + ".screens", a.screens.length + " screens; at most " + MAX_FLOW_SCREENS));
    a.screens.forEach(function (s, j) {
      var sp = ap + ".screens[" + j + "]";
      if (archetypes.length && archetypes.indexOf(s.template) === -1)
        findings.push(finding("P1", "template-unknown", a.id, sp + ".template", s.template, s.template, "one of " + archetypes.join(", ")));
      if (!apps[s.app]) findings.push(finding("P1", "app-unknown", a.id, sp + ".app", s.app, s.app, "one of " + appList));
      if (s.entity != null && !entities[s.entity])
        findings.push(finding("P1", "entity-unknown", a.id, sp + ".entity", s.entity, s.entity, "an app-context entity slug, or null"));
      checkProse(s.note, a.id, sp + ".note", findings);
    });
    checkProse(a.name, a.id, ap + ".name", findings);
    checkProse(a.whatItIs, a.id, ap + ".whatItIs", findings);
    checkProse(a.breaksWhen, a.id, ap + ".breaksWhen", findings);
    checkProse(a.verdict, a.id, ap + ".verdict", findings);
    checkProse(extractText(a.screen.html), a.id, ap + ".screen.html", findings);
    addPseudo(a.id, a.name, [
      { path: ap + ".screen.html", text: extractText(a.screen.html) },
      { path: ap + ".whatItIs", text: a.whatItIs },
      { path: ap + ".breaksWhen", text: a.breaksWhen },
      { path: ap + ".verdict", text: a.verdict },
      { path: ap + ".name", text: a.name },
    ]);
  });

  // comparison: one pseudo entry per criterion holding its label and every cell text
  var critSeen = {};
  var compEntries = [];
  data.comparison.criteria.forEach(function (c, i) {
    var cp = "comparison.criteria[" + i + "]";
    if (critSeen[c.id]) findings.push(finding("P0", "bounds", "", cp + ".id", "duplicate criterion id " + c.id));
    critSeen[c.id] = true;
    checkProse(c.label, "", cp + ".label", findings);
    var texts = [c.label];
    Object.keys(data.comparison.cells || {}).forEach(function (aid) {
      var cell = data.comparison.cells[aid][c.id];
      if (!cell) return;
      if (TONES.indexOf(cell.tone) === -1)
        findings.push(finding("P0", "bounds", aid, "comparison.cells." + aid + "." + c.id + ".tone", "tone " + JSON.stringify(cell.tone) + " is not one of " + TONES.join(", ")));
      checkProse(cell.text, aid, "comparison.cells." + aid + "." + c.id + ".text", findings);
      texts.push(cell.text);
    });
    compEntries.push({ path: cp, text: texts.join(". ") });
  });
  Object.keys(data.comparison.cells || {}).forEach(function (aid) {
    if (!approachIds[aid]) findings.push(finding("P0", "bounds", aid, "comparison.cells." + aid, "cells for an approach that does not exist"));
  });
  addPseudo("comparison", "Comparison", compEntries);

  // recommendation
  if (!approachIds[data.recommendation.approachId])
    findings.push(finding("P0", "recommendation", "", "recommendation.approachId", data.recommendation.approachId + " names no approach", data.recommendation.approachId, "one of " + Object.keys(approachIds).join(", ")));
  if (data.recommendation.reasons.length > MAX_REASONS)
    findings.push(finding("P0", "bounds", "", "recommendation.reasons", data.recommendation.reasons.length + " reasons; at most " + MAX_REASONS));
  checkProse(data.recommendation.summary, "", "recommendation.summary", findings);
  var recEntries = [{ path: "recommendation.summary", text: data.recommendation.summary }];
  data.recommendation.reasons.forEach(function (r, i) {
    checkProse(r.title, "", "recommendation.reasons[" + i + "].title", findings);
    checkProse(r.why, "", "recommendation.reasons[" + i + "].why", findings);
    recEntries.push({ path: "recommendation.reasons[" + i + "]", text: r.title + ". " + r.why });
  });
  if (data.recommendation.change) {
    checkProse(data.recommendation.change.adminSide, "", "recommendation.change.adminSide", findings);
    checkProse(data.recommendation.change.userSide, "", "recommendation.change.userSide", findings);
    recEntries.push({ path: "recommendation.change", text: [data.recommendation.change.adminSide, data.recommendation.change.userSide].filter(Boolean).join(" ") });
  }
  addPseudo("recommendation", "Recommendation", recEntries);

  // The flow gates report screenId plus content[n]; map back to the field path.
  function mapPath(issue) {
    var m = /content\[(\d+)\]/.exec(issue.path || "");
    var list = pathsByScreen[issue.screenId] || [];
    return (m && list[Number(m[1])]) || issue.screenId;
  }
  function screenOf(issue) {
    return approachIds[issue.screenId] ? issue.screenId : "";
  }
  flowGates.findTerminologyIssues(pseudo).forEach(function (t) {
    findings.push(finding("P1", "terminology", screenOf(t), mapPath(t), t.value, t.found, t.suggestion));
  });
  flowGates.findAvoidWords(pseudo).forEach(function (a) {
    findings.push(finding("P1", "avoid-word", screenOf(a), mapPath(a), a.value, a.found, a.suggestion));
  });
  return { findings: findings };
}

module.exports = { validateProposal: validateProposal, extractText: extractText };

if (require.main === module) {
  if (process.argv.indexOf("--help") !== -1) {
    process.stdout.write(JSON.stringify({
      name: "validate-proposal",
      description: "Validate proposals/proposal-data.json (the document): schema, app slugs, bounds, research honesty, the recommendation's approach, balanced in-flow drawings, no script, no external loads, terminology and avoid-words over every text field, hard-coded colours, toggle targets, em dashes, flow screen templates and entities.",
      flags: [
        { name: "--json", description: "Print { findings } as JSON instead of the table" },
        { name: "--help", description: "Show this help" },
      ],
    }, null, 2) + "\n");
    process.exit(0);
  }
  if (process.argv.length < 3) {
    process.stderr.write("Usage: validate-proposal.js <proposal-data.json> [--json]\n");
    process.exit(1);
  }
  var data;
  try {
    data = JSON.parse(fs.readFileSync(path.resolve(process.argv[2]), "utf8"));
  } catch (e) {
    process.stderr.write("Error reading " + process.argv[2] + ": " + e.message + "\n");
    process.exit(1);
  }
  var result = validateProposal(data);
  var p0 = result.findings.filter(function (f) { return f.severity === "P0"; }).length;
  if (process.argv.indexOf("--json") !== -1) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } else {
    result.findings.forEach(function (f) {
      var where = (f.screen ? 'approach "' + f.screen + '" ' : "") + f.path;
      var tail = f.found ? ': found "' + f.found + '"' + (f.suggestion ? ", " + f.suggestion : "") : ": " + f.value;
      process.stdout.write(f.severity + " [" + f.check + "] " + where + tail + "\n");
    });
    var counts = ["P0", "P1", "P2"].map(function (s) {
      return s + " " + result.findings.filter(function (f) { return f.severity === s; }).length;
    }).join(", ");
    process.stdout.write(result.findings.length + " findings (" + counts + ")\n");
  }
  process.exit(p0 > 0 ? 1 : 0);
}
