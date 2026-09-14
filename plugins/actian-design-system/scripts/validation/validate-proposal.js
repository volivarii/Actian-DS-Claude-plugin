#!/usr/bin/env node
"use strict";

/**
 * validate-proposal.js: findings for proposals/proposal-data.json (the
 * document shape) before it is assembled. Same table shape and exit
 * convention as validate-flow-data.js (any P0 exits 1). Terminology and
 * avoid-word rules are NOT re-implemented: every text field is handed to the
 * flow validator's exported gates, so the rules stay single-sourced.
 *
 * Checks: old-shape (P0), retired-key (P0), schema (P0), bounds (P0),
 * app-unknown (P0 on meta.apps and on an anchor, P1 on screens[].app),
 * research (P0), stage (P0 on a field an evaluation must not carry, a question
 * that is not one, or a repeated question; P1 on an ungrounded evaluation with
 * nothing open), pick (P0: an optionId or a criterionId that names nothing in
 * its OWN decision, and an empty cost), breadboard (P0 on a connection naming
 * nothing, P1 when absent across apps), unbalanced (P0), script (P0),
 * external-load (P0), decision (P1), option-width (P1), latitude (P1),
 * template-unknown (P1), entity-unknown (P1), hardcoded-color (P1),
 * in-flow (P1), toggle-target (P1), terminology (P1), avoid-word (P1),
 * em-dash (P2).
 *
 * Two things the check list above does not say on its own.
 *
 * SOME of the bounds below are also schema minItems/maxItems. Where they are,
 * the schema runs first and returns, so the line here never fires and exists
 * only as a net for a future schema relaxation; where they are not, the line
 * here is the only gate. Which is which is NOT written out in prose: an
 * earlier version of this comment enumerated them, was wrong about three, and
 * went stale again inside an hour. The constants carry a "// also schema"
 * marker instead, and validate-proposal.test.js reads those markers against
 * the schema in both directions, so adding a bound to one side without the
 * other turns the suite red.
 *
 * terminology and avoid-word run over every text field, the rationale prose
 * included (answer, latitude, pick.cost, pick.reasons[].text, blocker). They
 * are P1 because on rationale prose the right answer is often to keep the
 * word: "the recommendation stands" is English, not the product's Suggestion.
 * No regex separates a product noun from its ordinary sense, and these do not
 * try. They point; the author rules and says so.
 *
 * A file carrying meta.stage "evaluation" is the partial /design-proposal --evaluate
 * writes: the framing, the scope and the decisions named but not answered. It is read
 * against proposal-evaluation.schema.json, and every check that reads an option, a
 * comparison, a pick, a drawing or a closing line is skipped, because an evaluation
 * carries none of them. An absent stage means proposal, so every document written
 * before this stage existed is read exactly as it was.
 *
 * Usage: validate-proposal.js <proposal-data.json> [--json] [--help]
 */

var fs = require("fs");
var path = require("path");
var PATHS = require("../lib/paths");
var validateSchema = require("./validate-schema.js");
var flowGates = require("./validate-flow-data.js");
var extractUnbalancedTag = require("../renderers/assemble-proposal.js").extractUnbalancedTag;
var isOldShape = require("../migrations/proposal-approaches-to-decisions.js").isOldShape;
var NOT_A_SENTENCE_END = require("../migrations/proposal-approaches-to-decisions.js").NOT_A_SENTENCE_END;

var SCHEMA_DIR = path.join(__dirname, "..", "..", "schemas");
var ARCHETYPES_PATH = path.join(__dirname, "..", "..", "recipes", "flow", "_index.json");
var MAX_DECISIONS = 4;   // also schema maxItems
var MAX_OPTIONS = 4;     // also schema maxItems
var MIN_OPTIONS = 2;     // also schema minItems
var MAX_CRITERIA = 6;    // also schema maxItems
var MIN_CRITERIA = 3;
var RETIRED_KEYS = ["approaches", "comparison", "recommendation"];
var MAX_SCOPE = 4;       // also schema maxItems
var MAX_OPEN_QUESTIONS = 4; // also schema maxItems
var MAX_FINDINGS = 5;
var MAX_REASONS = 4;
var MIN_REASONS = 2;     // also schema minItems
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

// What a proposal may carry and an evaluation may not is the difference between the two
// schemas, so it is read from them rather than restated here. A list written out by hand
// is a claim about another file, and this file has already shipped one of those that was
// wrong about three of six entries. Add a field to the proposal schema and the evaluation
// rejects it the day it lands, with nobody remembering to come back to this line.
function forbiddenAtEvaluation() {
  var pr = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, "proposal-data.schema.json"), "utf8"));
  var ev = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, "proposal-evaluation.schema.json"), "utf8"));
  function extra(a, b) {
    return Object.keys(a.properties || {}).filter(function (k) { return !(b.properties || {})[k]; });
  }
  return {
    root: extra(pr, ev),
    decision: extra(pr.properties.decisions.items, ev.properties.decisions.items),
  };
}

// The codebase has one sentence-boundary rule and it stays one. A second regex here
// would disagree with the converter's on the first abbreviation either of them met,
// and that rule exists because a naive split turned one fact into two, silently.
function sentenceCount(text) {
  var parts = String(text || "").split(/(?<=[.?!])\s+/);
  var n = 0;
  parts.forEach(function (part, i) {
    if (!part.trim()) return;
    if (i < parts.length - 1 && NOT_A_SENTENCE_END.test(part)) return;
    n += 1;
  });
  return n;
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
  // A pre-decisions file fails the schema a dozen ways. Say the one true thing instead.
  if (isOldShape(data)) {
    findings.push(finding("P0", "old-shape", "", "approaches", "this file predates decisions[]; its approaches, comparison and recommendation become decisions[0]", "approaches", "run scripts/migrations/proposal-approaches-to-decisions.js on it, then write the three fields it leaves empty"));
    return { findings: findings };
  }
  // Half converted: decisions[] is there AND a retired top-level key is still beside it.
  // isOldShape does not catch that by design, and the schema sets no additionalProperties,
  // so without this the file validates clean while the assembler reads only decisions[].
  var retired = RETIRED_KEYS.filter(function (k) { return data && data[k] !== undefined; });
  if (retired.length) {
    findings.push(finding("P0", "retired-key", "", retired.join(", "), "half converted: top-level " + retired.join(", ") + " sits beside decisions[], and nothing downstream reads it", retired.join(", "), "delete the retired key" + (retired.length > 1 ? "s" : "") + "; decisions[] is the only shape the assembler reads"));
    return { findings: findings };
  }
  // Which contract this file answers to, read once. Absent stage means proposal, so every
  // document written before the evaluation stage existed is read exactly as it was.
  var stage = (data.meta && data.meta.stage) || "proposal";
  var schemaFile = stage === "evaluation" ? "proposal-evaluation.schema.json" : "proposal-data.schema.json";
  var schema = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, schemaFile), "utf8"));
  var errors = validateSchema(data, schema).filter(function (e) { return e.indexOf("(warning)") === -1; });
  errors.forEach(function (e) { findings.push(finding("P0", "schema", "", "", e)); });
  if (errors.length) return { findings: findings };

  // The gates that only exist at the evaluation stage. meta.stage is a claim about where
  // the file is in the pipeline, and the resume reads it to skip the ticket read and the
  // product read, so a half-filled evaluation is a file lying about where it is.
  if (stage === "evaluation") {
    var forbidden = forbiddenAtEvaluation();
    forbidden.root.forEach(function (key) {
      if (data[key] !== undefined)
        findings.push(finding("P0", "stage", "", key, "an evaluation carries no " + key, "", 'drop it, or set meta.stage to "proposal" and finish the file'));
    });
    data.decisions.forEach(function (d, di) {
      forbidden.decision.forEach(function (key) {
        if (d[key] !== undefined)
          findings.push(finding("P0", "stage", "", "decisions[" + di + "]." + key, "an evaluation carries no " + key, "", 'drop it, or set meta.stage to "proposal" and finish the file'));
      });
    });
    // An evaluation names the questions a ticket forces, and nothing else. A statement, a
    // question with its answer attached, and the same question twice are each a pick that
    // arrived without its work, which is the one thing this stage exists to stop.
    var seenQ = Object.create(null);
    data.decisions.forEach(function (d, di) {
      var q = String(d.question || "").trim();
      var qkey = q.toLowerCase().replace(/\s+/g, " ");
      if (q.slice(-1) !== "?")
        findings.push(finding("P0", "stage", "", "decisions[" + di + "].question", "does not end in a question mark", q, "an evaluation names questions; a statement is a pick without its work"));
      if (sentenceCount(q) > 1)
        findings.push(finding("P0", "stage", "", "decisions[" + di + "].question", "is more than one sentence", q, "one question per decision; two sentences is two decisions or a question with its answer attached"));
      if (seenQ[qkey] !== undefined)
        findings.push(finding("P0", "stage", "", "decisions[" + di + "].question", "repeats the question in decisions[" + seenQ[qkey] + "]", "decisions[" + seenQ[qkey] + "]", "two decisions that ask the same thing are one decision"));
      else seenQ[qkey] = di;
    });
    // Where this came from. Both schemas share one source definition, verbatim, and it
    // declares no required members, so requiring these three there would require them of
    // every proposal ever written. The rule is the evaluation's alone, so it lives here.
    ["system", "id", "body"].forEach(function (key) {
      if (!String((data.source || {})[key] || "").trim())
        findings.push(finding("P0", "stage", "", "source." + key, "the evaluation does not say which ticket it read", "", "an evaluation claims what a ticket forces, and cannot make that claim without naming the ticket"));
    });
    // The product read found no capture, and the evaluation still leaves nothing open.
    // Advisory, because the right answer is sometimes that the gap does not matter here.
    if (String(data.context.gap || "").trim() && !(data.openQuestions || []).length)
      findings.push(finding("P1", "stage", "", "openQuestions", "the product read found no capture and the evaluation leaves nothing open", "", "name what the gap leaves unresolved, or say in chat why it does not"));
  }

  var ctx = loadApps();
  var apps = ctx.apps || {};
  var entities = ctx.entities || {};
  var appList = Object.keys(apps).join(", ");
  var archetypes = loadArchetypes();
  // Every lookup map in this file is keyed by a string an author wrote, so a plain object
  // hands back Object.prototype's members as if the author had declared them: a decision
  // asking "Constructor" reported "repeats decisions[function Object() { [native code] }]",
  // and one decision with id "constructor" reported a duplicate of itself.
  var idSeen = Object.create(null); // html ids are document-wide: id -> the option it first appeared in

  // pseudo screens for the flow gates: one per option plus the document-level ones,
  // the latter prefixed "doc:" (a colon the option id pattern forbids) so an option
  // id such as "context" can never collide with a document-level pseudo screen id.
  var pseudo = { meta: { feature: data.meta.title }, screens: [] };
  var pathsByScreen = {};
  var optionIds = Object.create(null);
  function addPseudo(id, name, entries) {
    pathsByScreen[id] = entries.map(function (e) { return e.path; });
    pseudo.screens.push({ id: id, name: name, content: entries.map(function (e) { return { type: "TEXT", content: String(e.text == null ? "" : e.text) }; }) });
  }

  data.meta.apps.forEach(function (a, i) {
    if (!apps[a]) findings.push(finding("P0", "app-unknown", "", "meta.apps[" + i + "]", a, a, "one of " + appList));
  });
  checkProse(data.meta.title, "", "meta.title", findings);
  // An evaluation has named the decisions and nothing else, so every check that reads an
  // option, a comparison, a pick, a drawing or a closing line has nothing to read. Skipped
  // as a block: guarding field by field would leave each check looking like it ran.
  if (stage === "proposal") {
    checkProse(data.answer, "", "answer", findings);
    checkProse(data.latitude, "", "latitude", findings);
    if (!String(data.latitude || "").trim())
      findings.push(finding("P1", "latitude", "", "latitude", "the document does not say how much of it is fixed", "", "one line: what the team has latitude on and what it does not"));
  }

  // context
  checkProse(data.context.question, "", "context.question", findings);
  data.context.product.forEach(function (f, i) { checkProse(f, "", "context.product[" + i + "]", findings); });
  checkProse(data.context.gap, "", "context.gap", findings);
  addPseudo("doc:context", "Context", [{ path: "context.question", text: data.context.question }]
    .concat(data.context.product.map(function (f, i) { return { path: "context.product[" + i + "]", text: f }; }))
    .concat([{ path: "context.gap", text: data.context.gap || "" }]));

  // scope
  ["goals", "nonGoals"].forEach(function (key) {
    var lines = data.scope[key];
    if (lines.length > MAX_SCOPE)
      findings.push(finding("P0", "bounds", "", "scope." + key, lines.length + " entries; at most " + MAX_SCOPE));
    lines.forEach(function (line, i) { checkProse(line, "", "scope." + key + "[" + i + "]", findings); });
  });
  addPseudo("doc:scope", "Scope", data.scope.goals.map(function (g, i) {
    return { path: "scope.goals[" + i + "]", text: g };
  }).concat(data.scope.nonGoals.map(function (n, i) {
    return { path: "scope.nonGoals[" + i + "]", text: n };
  })));

  // research
  if (data.research.ran === false && !data.research.skippedBecause)
    findings.push(finding("P0", "research", "", "research.skippedBecause", "research did not run and says not why", "", "set skippedBecause (--no-research, the request said skip research, no web search in this session)"));
  if (data.research.findings.length > MAX_FINDINGS)
    findings.push(finding("P0", "bounds", "", "research.findings", data.research.findings.length + " findings; at most " + MAX_FINDINGS));
  if (data.research.ran === false && data.research.findings.length > 0)
    findings.push(finding("P1", "research", "", "research.findings", "findings present while ran is false; they are not rendered", "", "set ran true or empty the findings"));
  if (data.research.ran === true && data.research.findings.length === 0)
    findings.push(finding("P1", "research", "", "research.findings", "ran is true and nothing was found; the document draws the heading over an empty list", "", "set ran false with a skippedBecause, or record what the research found"));
  data.research.findings.forEach(function (f, i) { checkProse(f.claim, "", "research.findings[" + i + "].claim", findings); });
  addPseudo("doc:research", "Research", data.research.findings.map(function (f, i) { return { path: "research.findings[" + i + "].claim", text: f.claim }; }));

  // An evaluation has named the decisions and nothing else, so every check that reads an
  // option, a comparison, a pick, a drawing or a closing line has nothing to read. Skipped
  // as a block: guarding field by field would leave each check looking like it ran.
  if (stage === "proposal") {
    // breadboard: the connections have to resolve against the places in the same board.
    // proposal-breadboard.js throws on a reference that does not, so every case it throws
    // on is reported here first: an author reads a finding, never a stack trace. A written
    // affordance suffix is always checked, whatever number it carries, exactly as the
    // renderer checks it: "place/0" is a suffix an author meant, not an absent one.
    if (data.breadboard) {
      var placeIds = Object.create(null);
      data.breadboard.places.forEach(function (pl, i) {
        if (placeIds[pl.id] !== undefined) findings.push(finding("P0", "bounds", "", "breadboard.places[" + i + "].id", "duplicate place id " + pl.id));
        placeIds[pl.id] = (pl.affordances || []).length;
        if (!apps[pl.app]) findings.push(finding("P1", "app-unknown", "", "breadboard.places[" + i + "].app", pl.app, pl.app, "one of " + appList));
        checkProse(pl.name, "", "breadboard.places[" + i + "].name", findings);
        (pl.affordances || []).forEach(function (af, j) { checkProse(af, "", "breadboard.places[" + i + "].affordances[" + j + "]", findings); });
      });
      // Two places on the same row and col are one cell to the renderer, and a connection
      // touching that cell has nowhere to go. So is a connection whose ends are the same
      // place, which is how a copied entry reads. Both throw in layout(); neither was
      // screened here, so the validator said the file was clean and the assembler died
      // naming an internal module.
      var cellOf = Object.create(null);
      data.breadboard.places.forEach(function (pl, i) {
        var cell = (pl.row === undefined ? i : pl.row) + "," + (pl.col === undefined ? 0 : pl.col);
        if (cellOf[cell] !== undefined)
          findings.push(finding("P0", "breadboard", "", "breadboard.places[" + i + "]", "shares row and col with " + cellOf[cell], cell, "give every place its own row and col; two boxes in one cell have no route between them"));
        else cellOf[cell] = pl.id;
        if ((pl.row !== undefined && pl.row < 0) || (pl.col !== undefined && pl.col < 0))
          findings.push(finding("P0", "breadboard", "", "breadboard.places[" + i + "]", "row or col is negative, which lays the box outside the drawing", pl.row + "," + pl.col, "row and col count from 0"));
      });
      (data.breadboard.connections || []).forEach(function (c, i) {
        var cp = "breadboard.connections[" + i + "]";
        if (c.from != null && c.to != null && String(c.from).split("/")[0] === String(c.to).split("/")[0])
          findings.push(finding("P0", "breadboard", "", cp, "leaves and arrives at the same place", String(c.from), "a connection joins two places; delete it or name the other end"));
        ["from", "to"].forEach(function (side) {
          var raw = String(c[side] == null ? "" : c[side]);
          var slash = raw.indexOf("/");
          var id = slash === -1 ? raw : raw.slice(0, slash);
          var aff = slash === -1 ? 0 : Number(raw.slice(slash + 1));
          if (placeIds[id] === undefined) {
            findings.push(finding("P0", "breadboard", "", cp + "." + side, raw + " names no place", raw, "one of " + Object.keys(placeIds).join(", ")));
          } else if (slash !== -1 && !(aff >= 1 && aff <= placeIds[id])) {
            findings.push(finding("P0", "breadboard", "", cp + "." + side, raw + " names affordance " + raw.slice(slash + 1) + " of " + placeIds[id], raw, "a 1-based index into that place's affordances"));
          } else if (side === "to" && slash !== -1) {
            findings.push(finding("P1", "breadboard", "", cp + ".to", "an arrow arrives at a place, not at an affordance", raw, "name the place"));
          }
        });
        checkProse(c.label, "", cp + ".label", findings);
      });
      addPseudo("doc:breadboard", "Breadboard", data.breadboard.places.map(function (pl, i) {
        return { path: "breadboard.places[" + i + "]", text: pl.name + ". " + (pl.affordances || []).join(". ") };
      }));
    } else if (data.meta.apps.length > 1) {
      findings.push(finding("P1", "breadboard", "", "breadboard", "the ticket spans " + data.meta.apps.length + " apps and the document draws no terrain", "", "add breadboard { places, connections }; a cross-app shape is what prose fails on"));
    }
  }

  // decisions
  var decisionIds = Object.create(null);
  if (data.decisions.length > MAX_DECISIONS)
    findings.push(finding("P0", "bounds", "", "decisions", data.decisions.length + " decisions; at most " + MAX_DECISIONS));
  data.decisions.forEach(function (d, di) {
    var dp = "decisions[" + di + "]";
    if (decisionIds[d.id]) findings.push(finding("P0", "bounds", "", dp + ".id", "duplicate decision id " + d.id));
    decisionIds[d.id] = true;
    checkProse(d.question, "", dp + ".question", findings);
    // The question is this decision's heading, its line in the answer, and the first
    // column of the table. It went through checkProse alone, so em dashes and hex were
    // caught and terminology and avoid-words were not, while this file said in three
    // places that those gates run over every text field.
    addPseudo("doc:question:" + d.id, "Decision question", [{ path: dp + ".question", text: d.question }]);

    // An evaluation has named the decisions and nothing else, so every check that reads an
    // option, a comparison, a pick, a drawing or a closing line has nothing to read. Skipped
    // as a block: guarding field by field would leave each check looking like it ran.
    if (stage === "proposal") {
      // blocker moved inside the guard with the rest of the pick's prose. It sat outside,
      // which read as "gate its prose at both stages" and was not that: checkProse caught an
      // em dash there at either stage while the terminology and avoid-word scanner, fed by
      // the addPseudo below, only ran at the proposal stage. A blocker in an evaluation is a
      // P0 now, so the split had no reachable case left, only a misleading shape.
      checkProse(d.blocker, "", dp + ".blocker", findings);
      if (d.options.length < MIN_OPTIONS)
        findings.push(finding("P1", "decision", "", dp + ".options", d.options.length + " option; a decision with one option is a statement", "", "give it a second option, or fold it into another decision's cost"));
      if (d.options.length > MAX_OPTIONS)
        findings.push(finding("P0", "bounds", "", dp + ".options", d.options.length + " options; at most " + MAX_OPTIONS));

      var seenHere = Object.create(null);
      var widths = [];
      d.options.forEach(function (o, oi) {
        var op = dp + ".options[" + oi + "]";
        if (seenHere[o.id]) findings.push(finding("P0", "bounds", o.id, op + ".id", "duplicate option id " + o.id + " in decision " + d.id));
        seenHere[o.id] = true;
        optionIds[o.id] = true;
        widths.push(Number(o.screen.width));
        if (!apps[o.anchor.app]) findings.push(finding("P0", "app-unknown", o.id, op + ".anchor.app", o.anchor.app, o.anchor.app, "one of " + appList));
        if (o.screen.width < MIN_WIDTH || o.screen.width > MAX_WIDTH)
          findings.push(finding("P0", "bounds", o.id, op + ".screen.width", "width " + o.screen.width + " outside " + MIN_WIDTH + " to " + MAX_WIDTH));
        checkFragment(o.screen.html, o.id, op + ".screen.html", findings);
        var toggles = stripComments(o.screen.html).match(/data-toggle\s*=\s*"([^"]+)"/g) || [];
        toggles.forEach(function (t) {
          var id = t.replace(/^.*"([^"]+)"$/, "$1");
          if (!new RegExp('\\sid\\s*=\\s*"' + id + '"').test(stripComments(o.screen.html)))
            findings.push(finding("P1", "toggle-target", o.id, op + ".screen.html", 'data-toggle="' + id + '" has no id="' + id + '" in the same drawing', id, "add the id or drop the toggle"));
        });
        (stripComments(o.screen.html).match(/\sid\s*=\s*"([^"]+)"/g) || []).forEach(function (t) {
          var id = t.replace(/^.*"([^"]+)"$/, "$1");
          if (idSeen[id]) findings.push(finding("P1", "toggle-target", o.id, op + ".screen.html", id, id, 'id "' + id + '" also appears in option "' + idSeen[id] + '"; ids are document-wide, rename one'));
          else idSeen[id] = o.id;
        });
        (o.screen.notes || []).forEach(function (n, ni) { checkProse(n, o.id, op + ".screen.notes[" + ni + "]", findings); });
        if (o.screens.length > MAX_FLOW_SCREENS)
          findings.push(finding("P0", "bounds", o.id, op + ".screens", o.screens.length + " screens; at most " + MAX_FLOW_SCREENS));
        o.screens.forEach(function (sc, j) {
          var sp = op + ".screens[" + j + "]";
          if (archetypes.length && archetypes.indexOf(sc.template) === -1)
            findings.push(finding("P1", "template-unknown", o.id, sp + ".template", sc.template, sc.template, "one of " + archetypes.join(", ")));
          if (!apps[sc.app]) findings.push(finding("P1", "app-unknown", o.id, sp + ".app", sc.app, sc.app, "one of " + appList));
          if (sc.entity != null && !entities[sc.entity])
            findings.push(finding("P1", "entity-unknown", o.id, sp + ".entity", sc.entity, sc.entity, "an app-context entity slug, or null"));
          checkProse(sc.note, o.id, sp + ".note", findings);
        });
        checkProse(o.name, o.id, op + ".name", findings);
        checkProse(o.whatItIs, o.id, op + ".whatItIs", findings);
        checkProse(o.breaksWhen, o.id, op + ".breaksWhen", findings);
        checkProse(o.verdict, o.id, op + ".verdict", findings);
        checkProse(extractText(o.screen.html), o.id, op + ".screen.html", findings);
        addPseudo(o.id, o.name, [
          { path: op + ".screen.html", text: extractText(o.screen.html) },
          { path: op + ".whatItIs", text: o.whatItIs },
          { path: op + ".breaksWhen", text: o.breaksWhen },
          { path: op + ".verdict", text: o.verdict },
          { path: op + ".name", text: o.name },
        ]);
      });
      if (widths.length > 1 && Math.min.apply(null, widths) !== Math.max.apply(null, widths))
        findings.push(finding("P1", "option-width", "", dp + ".options", "declared widths " + widths.join(", ") + " differ", "", "the renderer equalises them to the widest, capped at the row budget; declare one width unless you mean the drawings to differ"));

      // comparison, scoped to this decision
      var critHere = Object.create(null);
      var compEntries = [];
      if (d.comparison.criteria.length > MAX_CRITERIA)
        findings.push(finding("P0", "bounds", "", dp + ".comparison.criteria", d.comparison.criteria.length + " criteria; at most " + MAX_CRITERIA));
      if (d.comparison.criteria.length < MIN_CRITERIA)
        findings.push(finding("P1", "decision", "", dp + ".comparison.criteria", d.comparison.criteria.length + " criteria; three to six", "", "a table of one or two rows does not separate the options, which is what it is for"));
      d.comparison.criteria.forEach(function (c, ci) {
        var cp = dp + ".comparison.criteria[" + ci + "]";
        if (critHere[c.id]) findings.push(finding("P0", "bounds", "", cp + ".id", "duplicate criterion id " + c.id + " in decision " + d.id));
        critHere[c.id] = true;
        checkProse(c.label, "", cp + ".label", findings);
        var texts = [c.label];
        Object.keys(d.comparison.cells || {}).forEach(function (oid) {
          var cell = (d.comparison.cells[oid] || {})[c.id];
          if (!cell) return;
          if (TONES.indexOf(cell.tone) === -1)
            findings.push(finding("P0", "bounds", oid, dp + ".comparison.cells." + oid + "." + c.id + ".tone", "tone " + JSON.stringify(cell.tone) + " is not one of " + TONES.join(", ")));
          checkProse(cell.text, oid, dp + ".comparison.cells." + oid + "." + c.id + ".text", findings);
          texts.push(cell.text);
        });
        compEntries.push({ path: cp, text: texts.join(". ") });
      });
      Object.keys(d.comparison.cells || {}).forEach(function (oid) {
        if (!seenHere[oid]) { findings.push(finding("P0", "bounds", oid, dp + ".comparison.cells." + oid, "cells for an option that is not in this decision")); return; }
        Object.keys(d.comparison.cells[oid] || {}).forEach(function (cid) {
          if (!critHere[cid]) findings.push(finding("P0", "bounds", oid, dp + ".comparison.cells." + oid + "." + cid, "cell for a criterion that is not in this decision"));
        });
      });
      addPseudo("doc:comparison-" + di, "Comparison " + (di + 1), compEntries);

      // pick: every cross-reference resolves inside THIS decision, never a sibling's
      var pk = dp + ".pick";
      if (!seenHere[d.pick.optionId])
        findings.push(finding("P0", "pick", "", pk + ".optionId", d.pick.optionId + " names no option in decision " + d.id, d.pick.optionId, "one of " + Object.keys(seenHere).join(", ")));
      if (!String(d.pick.cost || "").trim())
        findings.push(finding("P0", "pick", "", pk + ".cost", "the pick does not say what it costs", "", "one line: the risk, the debt or the work this choice takes on"));
      if (d.pick.reasons.length > MAX_REASONS)
        findings.push(finding("P0", "bounds", "", pk + ".reasons", d.pick.reasons.length + " reasons; at most " + MAX_REASONS));
      if (d.pick.reasons.length < MIN_REASONS)
        findings.push(finding("P1", "pick", "", pk + ".reasons", d.pick.reasons.length + " reason; two to four", "", "a single reason is an assertion"));
      var recEntries = [];
      d.pick.reasons.forEach(function (r, ri) {
        var rp = pk + ".reasons[" + ri + "]";
        if (!critHere[r.criterionId])
          findings.push(finding("P0", "pick", "", rp + ".criterionId", r.criterionId + " names no criterion in decision " + d.id, r.criterionId, "one of " + Object.keys(critHere).join(", ") + "; a reason that names none is taste, or belongs in cost"));
        checkProse(r.text, "", rp + ".text", findings);
        recEntries.push({ path: rp, text: r.text });
      });
      checkProse(d.pick.cost, "", pk + ".cost", findings);
      recEntries.push({ path: pk + ".cost", text: d.pick.cost });
      if (d.blocker) recEntries.push({ path: dp + ".blocker", text: d.blocker });
      addPseudo("doc:pick-" + di, "Pick " + (di + 1), recEntries);
    }
  });

  // openQuestions: optional, bounded, prose-checked. Absence is honest; invention is not.
  var openQuestions = data.openQuestions || [];
  if (openQuestions.length > MAX_OPEN_QUESTIONS)
    findings.push(finding("P0", "bounds", "", "openQuestions", openQuestions.length + " entries; at most " + MAX_OPEN_QUESTIONS));
  openQuestions.forEach(function (q, i) { checkProse(q.text, "", "openQuestions[" + i + "].text", findings); });
  if (openQuestions.length)
    addPseudo("doc:open-questions", "Open questions", openQuestions.map(function (q, i) {
      return { path: "openQuestions[" + i + "].text", text: q.text };
    }));

  // An evaluation has named the decisions and nothing else, so every check that reads an
  // option, a comparison, a pick, a drawing or a closing line has nothing to read. Skipped
  // as a block: guarding field by field would leave each check looking like it ran.
  if (stage === "proposal") {
    // change: a proposal that changes nothing anywhere is not a proposal
    if (!String(data.change.adminSide || "").trim() && !String(data.change.userSide || "").trim())
      findings.push(finding("P0", "bounds", "", "change", "neither side of the change says anything", "", "fill adminSide, userSide, or both"));
    checkProse(data.change.adminSide, "", "change.adminSide", findings);
    checkProse(data.change.userSide, "", "change.userSide", findings);
    addPseudo("doc:change", "What this changes", [
      { path: "change.adminSide", text: data.change.adminSide || "" },
      { path: "change.userSide", text: data.change.userSide || "" },
      { path: "answer", text: data.answer },
      { path: "latitude", text: data.latitude || "" },
    ]);
  }

  // The flow gates report screenId plus content[n]; map back to the field path.
  function mapPath(issue) {
    var m = /content\[(\d+)\]/.exec(issue.path || "");
    var list = pathsByScreen[issue.screenId] || [];
    return (m && list[Number(m[1])]) || issue.screenId;
  }
  function screenOf(issue) {
    return optionIds[issue.screenId] ? issue.screenId : "";
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
      description: "Validate proposals/proposal-data.json (the document): the pre-decisions shape and half-converted leftovers, schema, app slugs, bounds, research honesty, every pick cross-reference resolved inside its OWN decision (optionId and each reason's criterionId) and a cost that says something, breadboard connections that name a place and an affordance that exist, a latitude line, balanced in-flow drawings, no script, no external loads, terminology and avoid-words over every text field, hard-coded colours, toggle targets, em dashes, flow screen templates and entities.",
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
      var where = (f.screen ? 'option "' + f.screen + '" ' : "") + f.path;
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
