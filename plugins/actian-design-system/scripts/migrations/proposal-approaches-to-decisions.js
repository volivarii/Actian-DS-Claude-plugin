#!/usr/bin/env node
"use strict";

/**
 * proposal-approaches-to-decisions.js: converts a proposals/proposal-data.json
 * written before decisions[] into the current shape. The old document is a
 * single-decision document exactly, so the structure moves mechanically:
 * approaches become the decision's options, the comparison and the
 * recommendation move inside it, the product paragraph splits on its sentence
 * boundaries, and the first sentence of the old summary becomes the answer.
 *
 * Three fields the old shape never carried are written empty, not guessed:
 * which criterion each reason argues from, what the pick costs, and the
 * latitude line. validate-proposal.js then names each one to the author, which
 * is the point: a plausible invention would ship unread.
 *
 * No side effects at load. Usage: proposal-approaches-to-decisions.js <file> [-o out]
 */

var fs = require("fs");
var path = require("path");

function isOldShape(data) {
  return !!(data && Array.isArray(data.approaches) && !Array.isArray(data.decisions));
}

// One fact per sentence. Keeps the terminator, so joining the result with a
// single space reproduces the paragraph exactly; the test asserts that.
function sentences(text) {
  return String(text == null ? "" : text)
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
}

function pickKeys(src, keys) {
  var out = {};
  keys.forEach(function (k) { if (src[k] !== undefined) out[k] = src[k]; });
  return out;
}

function convert(data) {
  if (!isOldShape(data)) return data;
  var rec = data.recommendation || {};
  var out = {};
  out.meta = data.meta;
  out.answer = sentences(rec.summary)[0] || "";
  if (data.source) out.source = data.source;
  out.context = {
    question: data.context.question,
    product: sentences(data.context.product),
    sources: data.context.sources,
  };
  if (data.context.gap) out.context.gap = data.context.gap;
  out.scope = data.scope;
  out.research = data.research;
  if (data.breadboard) out.breadboard = data.breadboard;
  out.decisions = [{
    id: "the-decision",
    question: data.context.question,
    options: data.approaches.map(function (a) {
      return pickKeys(a, ["id", "name", "anchor", "whatItIs", "breaksWhen", "verdict", "screen", "screens"]);
    }),
    comparison: data.comparison,
    pick: {
      optionId: rec.approachId,
      reasons: (rec.reasons || []).map(function (r) {
        return { criterionId: "", text: r.title + ". " + r.why };
      }),
      cost: "",
    },
  }];
  if (data.openQuestions && data.openQuestions.length) out.openQuestions = data.openQuestions;
  out.change = rec.change || {};
  out.latitude = "";
  return out;
}

module.exports = { convert: convert, isOldShape: isOldShape };

if (require.main === module) {
  var args = process.argv.slice(2);
  if (!args.length || args.indexOf("--help") !== -1) {
    process.stdout.write("Usage: proposal-approaches-to-decisions.js <proposal-data.json> [-o <out.json>]\n");
    process.exit(args.length ? 0 : 1);
  }
  var inPath = path.resolve(args[0]);
  var oi = args.indexOf("-o");
  var outPath = oi !== -1 && args[oi + 1] ? path.resolve(args[oi + 1]) : inPath;
  var src = JSON.parse(fs.readFileSync(inPath, "utf8"));
  if (!isOldShape(src)) {
    process.stderr.write(inPath + " is already in the decisions[] shape; nothing to do\n");
    process.exit(0);
  }
  fs.writeFileSync(outPath, JSON.stringify(convert(src), null, 2) + "\n");
  process.stdout.write(
    "Converted " + inPath + " to " + outPath + ".\n" +
    "Three fields are empty because the old shape never carried them, and are yours to write:\n" +
    "  decisions[0].pick.reasons[].criterionId  which comparison row each reason argues from\n" +
    "  decisions[0].pick.cost                   what this pick costs\n" +
    "  latitude                                 how much of this is fixed\n" +
    "Run validate-proposal.js next; it names each one.\n"
  );
}
