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

// Words that end in a period without ending a sentence. It cannot be exhaustive, and the
// point is not to be: a naive split on every period turns "See Fig. 2 for the shape." into
// two fragments that are each non-empty, trimmed and terminated, so they pass every gate
// downstream and the corruption never surfaces. The common cases stop being silent, and
// the CLI prints the resulting count so an author can see one it did not catch.
var NOT_A_SENTENCE_END =
  /(?:^|\s)(?:[A-Z]|e\.g|i\.e|etc|vs|cf|al|Fig|No|Vol|Dr|Mr|Mrs|Ms|St|Inc|Ltd|Co|Corp|Jr|Sr|approx|dept|est)\.$/;

// One fact per sentence. Keeps the terminator, so joining the result with a
// single space reproduces the paragraph exactly; the test asserts that.
function sentences(text) {
  // Already an array: a hand-edited or half-migrated file. String() on an array joins with
  // a bare comma and no space, which then does not split at all and ships as one glued fact.
  if (Array.isArray(text)) return text.slice();
  var parts = String(text == null ? "" : text).trim().split(/(?<=[.!?])\s+/);
  var merged = [];
  parts.forEach(function (part) {
    var prev = merged.length ? merged[merged.length - 1] : null;
    if (prev !== null && NOT_A_SENTENCE_END.test(prev)) merged[merged.length - 1] = prev + " " + part;
    else merged.push(part);
  });
  return merged.map(function (s) { return s.trim(); }).filter(Boolean);
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

// NOT_A_SENTENCE_END is exported because validate-proposal.js needs the same rule to count
// the sentences in a decision's question. Two regexes would disagree on the first
// abbreviation either of them met, and this one is the codebase's sentence boundary.
module.exports = { convert: convert, isOldShape: isOldShape, NOT_A_SENTENCE_END: NOT_A_SENTENCE_END };

if (require.main === module) {
  var args = process.argv.slice(2);
  if (!args.length || args.indexOf("--help") !== -1) {
    process.stdout.write("Usage: proposal-approaches-to-decisions.js <proposal-data.json> [-o <out.json>]\n");
    process.exit(args.length ? 0 : 1);
  }
  var inPath = path.resolve(args[0]);
  var oi = args.indexOf("-o");
  var outPath = oi !== -1 && args[oi + 1] ? path.resolve(args[oi + 1]) : inPath;
  if (outPath !== inPath && fs.existsSync(outPath)) {
    process.stderr.write(outPath + " already exists; remove it or convert in place by dropping -o\n");
    process.exit(1);
  }
  var src = JSON.parse(fs.readFileSync(inPath, "utf8"));
  if (!isOldShape(src)) {
    process.stderr.write(inPath + " is already in the decisions[] shape; nothing to do\n");
    process.exit(0);
  }
  var converted = convert(src);
  fs.writeFileSync(outPath, JSON.stringify(converted, null, 2) + "\n");
  process.stdout.write(
    "Converted " + inPath + " to " + outPath + ".\n" +
    "context.product split into " + converted.context.product.length + " facts; read them, a period\n" +
    "inside an abbreviation this does not know would have split one fact into two.\n" +
    "Three fields are empty because the old shape never carried them, and are yours to write:\n" +
    "  decisions[0].pick.reasons[].criterionId  which comparison row each reason argues from\n" +
    "  decisions[0].pick.cost                   what this pick costs\n" +
    "  latitude                                 how much of this is fixed\n" +
    "Run validate-proposal.js next; it names each one.\n"
  );
}
