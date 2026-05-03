"use strict";

var fs = require("fs");
var path = require("path");
var astWalk = require("./foundations-parser/ast-walk.js");
var extractors = require("./foundations-parser/extractors.js");
var statusEmoji = require("./foundations-parser/status-emoji.js");

function applyStatusToRows(rows, sectionNumber, logger) {
  return rows.map(function (row) {
    var copy = {};
    var status = null;
    var keys = Object.keys(row);
    var statusColRaw = null;
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var v = row[k];
      if (k.toLowerCase() === "status") {
        statusColRaw = v;
        var parsed = statusEmoji.extractStatus.fromValueCell(v);
        status = parsed.status;
        // fromValueCell returns status===null both for recognized null-status emojis
        // (e.g. ✅ "current") and for completely unrecognized content. Distinguish
        // them by checking whether the cell had a known emoji at all.
        var emojiRecognized =
          statusEmoji.extractStatus(String(v).trim()) !== null ||
          Object.prototype.hasOwnProperty.call(
            statusEmoji.extractStatus.STATUS_MAP,
            String(v).trim(),
          );
        // If there's leftover text after the emoji, preserve it as status_note.
        if (parsed.value && parsed.value.length > 0) {
          copy.status_note = parsed.value;
        }
        if (!emojiRecognized) {
          // Mark as unrecognized so the warn logic below can fire.
          statusColRaw = v;
        } else {
          statusColRaw = null; // suppress warn for recognized emojis
        }
        continue;
      }
      copy[k] = v;
    }
    if (status) copy.status = status;
    // Warn if a status column was present with unrecognized content and no preserved note.
    if (statusColRaw && status === null && !copy.status_note && logger) {
      logger.warn(
        "Section '" +
          sectionNumber +
          "' row had unrecognized status cell: '" +
          statusColRaw +
          "'",
      );
    }
    return copy;
  });
}

function buildSectionPayload(contentTokens, sectionNumber, logger) {
  var payload = { rows: [], lists: [], code: [], description: null };
  var descLines = [];

  for (var i = 0; i < contentTokens.length; i++) {
    var token = contentTokens[i];
    if (token.type === "table") {
      var rows = extractors.extractTable(token);
      payload.rows = payload.rows.concat(
        applyStatusToRows(rows, sectionNumber, logger),
      );
    } else if (token.type === "list") {
      payload.lists.push(extractors.extractList(token));
    } else if (token.type === "code") {
      var fb = extractors.extractFencedBlock(token);
      if (fb) payload.code.push(fb);
    } else if (token.type === "paragraph") {
      var prose = extractors.extractProse(token);
      if (prose) descLines.push(prose);
    }
  }
  payload.description = descLines.length ? descLines.join("\n\n") : null;

  // Drop empty buckets to keep JSON clean.
  if (payload.rows.length === 0) delete payload.rows;
  if (payload.lists.length === 0) delete payload.lists;
  if (payload.code.length === 0) delete payload.code;
  if (payload.description === null) delete payload.description;

  return payload;
}

function deriveFromMarkdown(mdSource, parserMap, opts) {
  opts = opts || {};
  var logger = opts.logger || { warn: function () {} };
  var tokens = astWalk.parseMarkdown(mdSource);
  var headings = astWalk.findNumberedHeadings(tokens);
  var output = {};

  for (var i = 0; i < headings.length; i++) {
    var heading = headings[i];
    var target = parserMap[heading.number];
    if (!target) {
      logger.warn(
        "Numbered heading '" +
          heading.number +
          " " +
          heading.text +
          "' has no parser map entry; skipping.",
      );
      continue;
    }
    var content = astWalk.sliceSectionContent(tokens, heading);
    var payload = buildSectionPayload(content, heading.number, logger);

    if (!output[target.file]) output[target.file] = {};
    if (target.key) {
      if (output[target.file][target.key]) {
        logger.warn(
          "Section '" +
            heading.number +
            "' overwrites existing output at " +
            target.file +
            ":" +
            target.key +
            " (multiple sections mapped to same target)",
        );
      }
      output[target.file][target.key] = payload;
    } else {
      Object.assign(output[target.file], payload);
    }
  }
  return output;
}

function addMetaHeader(payload) {
  var meta = {
    auto_generated: true,
    source: "docs/foundations.md",
    do_not_edit: "Edit the source MD; CI regenerates this file.",
  };
  // Place _meta first by constructing a new object key-by-key.
  var out = { _meta: meta };
  var keys = Object.keys(payload);
  for (var i = 0; i < keys.length; i++) {
    out[keys[i]] = payload[keys[i]];
  }
  return out;
}

function writeOutputs(output, outputDir) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  var written = [];
  var files = Object.keys(output);
  for (var i = 0; i < files.length; i++) {
    var name = files[i];
    var payload = addMetaHeader(output[name]);
    var dest = path.join(outputDir, name);
    fs.writeFileSync(dest, JSON.stringify(payload, null, 2) + "\n");
    written.push(dest);
  }
  return written;
}

function parseArgs(argv) {
  var args = {};
  for (var i = 2; i < argv.length; i++) {
    var a = argv[i];
    if (a === "--check") args.check = true;
    else if (a === "--md") args.md = argv[++i];
    else if (a === "--map") args.map = argv[++i];
    else if (a === "--out") args.out = argv[++i];
  }
  return args;
}

function defaultPaths() {
  var pluginRoot = path.resolve(__dirname, "..", "..");
  return {
    md: path.join(pluginRoot, "docs", "foundations.md"),
    map: path.join(
      pluginRoot,
      "scripts",
      "foundations",
      "foundations.parser.json",
    ),
    out: path.join(pluginRoot, "docs", "generated", "foundations"),
  };
}

function loadParserMap(mapPath) {
  var raw = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
  // Strip _comment* keys so they don't accidentally match a heading number.
  var clean = {};
  Object.keys(raw).forEach(function (k) {
    if (k.indexOf("_") === 0) return;
    clean[k] = raw[k];
  });
  return clean;
}

function runCli(argv) {
  var args = parseArgs(argv);
  var defaults = defaultPaths();
  var mdPath = args.md || defaults.md;
  var mapPath = args.map || defaults.map;
  var outDir = args.out || defaults.out;

  var md = fs.readFileSync(mdPath, "utf-8");
  var parserMap = loadParserMap(mapPath);

  var output = deriveFromMarkdown(md, parserMap, {
    logger: {
      warn: function (m) {
        console.warn("[derive-foundations] " + m);
      },
    },
  });

  if (args.check) {
    var drifts = [];
    var files = Object.keys(output);
    for (var i = 0; i < files.length; i++) {
      var name = files[i];
      var expected =
        JSON.stringify(addMetaHeader(output[name]), null, 2) + "\n";
      var dest = path.join(outDir, name);
      var actual = fs.existsSync(dest) ? fs.readFileSync(dest, "utf-8") : "";
      if (actual !== expected) drifts.push(name);
    }
    if (drifts.length === 0) {
      console.log("[derive-foundations] no drift");
      return 0;
    }
    console.error(
      "[derive-foundations] drift detected in: " + drifts.join(", "),
    );
    console.error("Run `npm run derive:foundations` to regenerate.");
    return 1;
  }

  var written = writeOutputs(output, outDir);
  console.log(
    "[derive-foundations] wrote " + written.length + " files to " + outDir,
  );
  return 0;
}

if (require.main === module) {
  process.exit(runCli(process.argv));
}

module.exports = {
  deriveFromMarkdown,
  buildSectionPayload,
  applyStatusToRows,
  addMetaHeader,
  writeOutputs,
  runCli,
  parseArgs,
};
