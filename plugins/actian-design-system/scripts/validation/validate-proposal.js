#!/usr/bin/env node
"use strict";

/**
 * validate-proposal.js: findings for proposals/proposal-data.json before the
 * board is assembled. Same table shape and exit convention as
 * validate-flow-data.js (P0 exits 1). Terminology and avoid-word rules are
 * NOT re-implemented: visible text is extracted from each fragment and handed
 * to the flow validator's exported gates, so the rules stay single-sourced.
 *
 * Checks: schema (P0), app-unknown (P0), bounds (P0), unbalanced (P0),
 * script (P0), external-load (P0), terminology (P1), avoid-word (P1),
 * hardcoded-color (P1), toggle-target (P1), em-dash (P2).
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
var MAX_SCREENS = 8;
var MIN_WIDTH = 240;
var MAX_WIDTH = 720;
var EM_DASH = "\u2014"; // written as an escape so no source line carries the character

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

function finding(severity, check, screen, p, value, found, suggestion) {
  var f = { severity: severity, check: check, screen: screen, path: p, value: value };
  if (found !== undefined) f.found = found;
  if (suggestion !== undefined) f.suggestion = suggestion;
  return f;
}

function validateProposal(data) {
  var findings = [];
  var schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  var errors = validateSchema(data, schema).filter(function (e) { return e.indexOf("(warning)") === -1; });
  errors.forEach(function (e) { findings.push(finding("P0", "schema", "", "", e)); });
  if (errors.length) return { findings: findings };

  var apps = {};
  try { apps = JSON.parse(fs.readFileSync(PATHS.appContext, "utf8")).apps || {}; } catch (e) { apps = {}; }
  var screens = data.screens;
  if (screens.length > MAX_SCREENS) findings.push(finding("P0", "bounds", "", "screens", screens.length + " screens; a board holds at most " + MAX_SCREENS));
  var seen = {};

  // One pseudo screen per real screen (content[0] = fragment text, content[1] = caption) plus one for the recommendation.
  var pseudo = { meta: { feature: data.meta.title }, screens: [] };
  screens.forEach(function (s, i) {
    var sp = "screens[" + i + "]";
    if (seen[s.id]) findings.push(finding("P0", "bounds", s.id, sp + ".id", "duplicate id " + s.id));
    seen[s.id] = true;
    if (s.width !== undefined && (s.width < MIN_WIDTH || s.width > MAX_WIDTH)) findings.push(finding("P0", "bounds", s.id, sp + ".width", "width " + s.width + " outside " + MIN_WIDTH + " to " + MAX_WIDTH));
    if (!apps[s.app]) findings.push(finding("P0", "app-unknown", s.id, sp + ".app", s.app, s.app, "one of " + Object.keys(apps).join(", ")));
    var bad = extractUnbalancedTag(s.html);
    if (bad) findings.push(finding("P0", "unbalanced", s.id, sp + ".html", "<" + bad + "> opened and closed a different number of times"));
    if (/<script\b/i.test(s.html)) findings.push(finding("P0", "script", s.id, sp + ".html", "<script> in a fragment", "<script", "use data-toggle for clicks"));
    else if (/\son[a-z]+\s*=/i.test(s.html)) findings.push(finding("P0", "script", s.id, sp + ".html", "inline event handler", "on*=", "use data-toggle for clicks"));
    else if (/javascript:/i.test(s.html)) findings.push(finding("P0", "script", s.id, sp + ".html", "javascript: URL", "javascript:", "use data-toggle for clicks"));
    var ext = s.html.match(/\b(?:src|href)\s*=\s*["']?(?:https?:)?\/\/[^"'\s>]*/i);
    if (ext) findings.push(finding("P0", "external-load", s.id, sp + ".html", ext[0], ext[0], "the board is offline; inline the asset or drop it"));
    styleSources(s.html).forEach(function (css) {
      var colours = css.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(/g) || [];
      colours.forEach(function (c) { findings.push(finding("P1", "hardcoded-color", s.id, sp + ".html", c, c, "use a --fm-* variable (references/ds-rules/fm-css-reference.md)")); });
    });
    var toggles = s.html.match(/data-toggle\s*=\s*"([^"]+)"/g) || [];
    toggles.forEach(function (t) {
      var id = t.replace(/^.*"([^"]+)"$/, "$1");
      if (!new RegExp('\\sid\\s*=\\s*"' + id + '"').test(s.html)) findings.push(finding("P1", "toggle-target", s.id, sp + ".html", "data-toggle=\"" + id + "\" has no id=\"" + id + "\" in the same screen", id, "add the id or drop the toggle"));
    });
    var text = extractText(s.html);
    if (text.indexOf(EM_DASH) !== -1) findings.push(finding("P2", "em-dash", s.id, sp + ".html", "em dash in visible text", EM_DASH, "use a colon, comma or period"));
    if (s.caption && s.caption.indexOf(EM_DASH) !== -1) findings.push(finding("P2", "em-dash", s.id, sp + ".caption", "em dash in caption", EM_DASH, "use a colon, comma or period"));
    pseudo.screens.push({ id: s.id, name: s.name, content: [
      { type: "TEXT", content: text },
      { type: "TEXT", content: s.caption || "" }
    ] });
  });
  if (data.meta.title.indexOf(EM_DASH) !== -1) findings.push(finding("P2", "em-dash", "", "meta.title", "em dash in title", EM_DASH, "use a colon, comma or period"));
  if (data.meta.recommendation && extractText(data.meta.recommendation).indexOf(EM_DASH) !== -1) findings.push(finding("P2", "em-dash", "", "meta.recommendation", "em dash in recommendation", EM_DASH, "use a colon, comma or period"));

  if (data.meta.recommendation) pseudo.screens.push({ id: "meta.recommendation", name: "Recommendation", content: [{ type: "TEXT", content: extractText(data.meta.recommendation) }] });

  // The flow validator reports screenId plus content[0] or content[1]; map back to html, caption or the recommendation.
  function mapPath(issue) {
    if (issue.screenId === "meta.recommendation") return "meta.recommendation";
    var m = /content\[(\d)\]/.exec(issue.path || "");
    var idx = 0;
    for (var i = 0; i < pseudo.screens.length; i++) if (pseudo.screens[i].id === issue.screenId) idx = i;
    return "screens[" + idx + "]." + (m && m[1] === "1" ? "caption" : "html");
  }
  function screenOf(issue) { return issue.screenId === "meta.recommendation" ? "" : issue.screenId; }
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
      description: "Validate proposals/proposal-data.json: schema, app slugs, bounds, balanced fragments, no script, no external loads, terminology, avoid-words, hard-coded colours, toggle targets, em dashes.",
      flags: [
        { name: "--json", description: "Print { findings } as JSON instead of the table" },
        { name: "--help", description: "Show this help" }
      ]
    }, null, 2) + "\n");
    process.exit(0);
  }
  if (process.argv.length < 3) {
    process.stderr.write("Usage: validate-proposal.js <proposal-data.json> [--json]\n");
    process.exit(1);
  }
  var data;
  try { data = JSON.parse(fs.readFileSync(path.resolve(process.argv[2]), "utf8")); }
  catch (e) { process.stderr.write("Error reading " + process.argv[2] + ": " + e.message + "\n"); process.exit(1); }
  var result = validateProposal(data);
  var p0 = result.findings.filter(function (f) { return f.severity === "P0"; }).length;
  if (process.argv.indexOf("--json") !== -1) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } else {
    result.findings.forEach(function (f) {
      var where = (f.screen ? 'screen "' + f.screen + '" ' : "") + f.path;
      var tail = f.found ? ': found "' + f.found + '"' + (f.suggestion ? ", " + f.suggestion : "") : ": " + f.value;
      process.stdout.write(f.severity + " [" + f.check + "] " + where + tail + "\n");
    });
    var counts = ["P0", "P1", "P2"].map(function (s) { return s + " " + result.findings.filter(function (f) { return f.severity === s; }).length; }).join(", ");
    process.stdout.write(result.findings.length + " findings (" + counts + ")\n");
  }
  process.exit(p0 > 0 ? 1 : 0);
}
