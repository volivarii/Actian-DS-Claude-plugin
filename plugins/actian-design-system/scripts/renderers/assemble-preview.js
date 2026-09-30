#!/usr/bin/env node
"use strict";

/**
 * assemble-preview.js: writes the design proposal document as one
 * self-contained HTML file from proposals/proposal-data.json.
 *
 * Usage:
 *   assemble-preview.js <proposal-data.json> --type proposal -o <output.html> [--fragment]
 *
 * The document (the answer, the terrain, the decision table, the briefing, one
 * block per decision in decisions[], what is still open, what this changes, the
 * latitude line) is assemble-proposal.js's; this file reads the input, calls it
 * and writes the result atomically.
 *
 * Output: a single self-contained HTML file with all CSS and data inlined.
 * Logs:   progress messages to stderr.
 */

var fs = require("fs");
var path = require("path");

var TYPES = ["proposal"];
var USAGE = "Usage: assemble-preview.js <proposal-data.json> --type proposal -o <output.html> [--fragment]\n";

function parseArgs(argv) {
  var args = { input: null, type: null, output: null, fragment: false };
  var positionals = [];
  for (var i = 2; i < argv.length; i++) {
    var arg = argv[i];
    if (arg === "--type" && i + 1 < argv.length) args.type = argv[++i];
    else if ((arg === "-o" || arg === "--output") && i + 1 < argv.length) args.output = argv[++i];
    else if (arg === "--fragment") args.fragment = true;
    else if (arg.charAt(0) !== "-") positionals.push(arg);
  }
  if (positionals.length > 0) args.input = positionals[0];
  return args;
}

// Write atomically (tmp sibling + rename): a browser reload or a Cowork panel
// watch must never catch a half-written file. Falls back to a direct write.
function writeOutput(outputPath, html) {
  var outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  var tmpPath = outputPath + ".tmp";
  try {
    fs.writeFileSync(tmpPath, html, "utf8");
    fs.renameSync(tmpPath, outputPath);
  } catch (e) {
    process.stderr.write("WARN: atomic rename failed (" + e.message + "); writing directly.\n");
    fs.writeFileSync(outputPath, html, "utf8");
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch (e2) {
      /* ignore */
    }
  }
  var size = Buffer.byteLength(html, "utf8");
  process.stderr.write("Done: " + outputPath + " (" + (size / 1024).toFixed(1) + " KB)\n");
}

function main() {
  var args = parseArgs(process.argv);

  if (process.argv.indexOf("--help") !== -1) {
    process.stdout.write(
      JSON.stringify(
        {
          name: "assemble-preview",
          description: "Assembles the design proposal document as one self-contained HTML file.",
          flags: [
            { name: "--type", required: true, description: "proposal (the design proposal document)" },
            { name: "-o", required: true, description: "Output HTML file path" },
            { name: "--output", required: true, description: "Alias for -o" },
            {
              name: "--fragment",
              required: false,
              description: "Emit the document without its <!doctype>/<head>/<body> wrapper, for a host that supplies its own (an Artifact publish).",
            },
          ],
          types: TYPES,
        },
        null,
        2,
      ) + "\n",
    );
    process.exit(0);
  }

  if (!args.input) {
    process.stderr.write("ERROR: Missing input JSON file.\n" + USAGE);
    process.exit(1);
  }
  if (!args.type) {
    process.stderr.write("ERROR: Missing --type argument.\n" + USAGE);
    process.exit(1);
  }
  if (!args.output) {
    process.stderr.write("ERROR: Missing -o / --output argument.\n" + USAGE);
    process.exit(1);
  }
  if (TYPES.indexOf(args.type) === -1) {
    process.stderr.write('ERROR: Unknown type "' + args.type + '". Must be one of: ' + TYPES.join(", ") + ".\n");
    process.exit(1);
  }

  process.stderr.write("Reading data: " + args.input + "\n");
  if (!fs.existsSync(args.input)) {
    process.stderr.write("ERROR: Input file not found: " + args.input + "\n");
    process.exit(1);
  }
  var proposalData = JSON.parse(fs.readFileSync(args.input, "utf8"));
  var assembleProposal = require("./assemble-proposal.js").assembleProposal;
  try {
    writeOutput(args.output, assembleProposal(proposalData, { fragment: args.fragment }));
  } catch (e) {
    process.stderr.write("ERROR: " + e.message + "\n");
    process.exit(1);
  }
}

// Only run main() when executed directly, not when required by tests.
if (require.main === module) {
  main();
}

module.exports = { parseArgs: parseArgs, writeOutput: writeOutput };
