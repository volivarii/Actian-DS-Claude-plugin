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

// Section 2.9 (Motion) needs a structured payload — tokens grouped by category
// (duration / easing / delay) and named patterns indexed by slug — so the
// brief renderer can look up `patterns.drawer` etc. The generic
// rows/lists/code/description shape collapses this structure.
function isBoldOnlyParagraph(token) {
  if (!token || token.type !== "paragraph" || !Array.isArray(token.tokens))
    return false;
  var significant = token.tokens.filter(function (t) {
    if (t.type === "text") return String(t.text || "").trim().length > 0;
    return true;
  });
  return significant.length === 1 && significant[0].type === "strong";
}

// marked emits HTML-encoded entities in inline text (e.g. `&quot;`, `&amp;`).
// We need decoded strings for slug + display.
function decodeHtmlEntities(s) {
  return String(s || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function slugifyPatternName(name) {
  // Decode HTML entities first so "&quot;" doesn't leak into the slug.
  // Trim quotes and "The " prefix; drop content in parens and after em-dash.
  var s = decodeHtmlEntities(name)
    .replace(/^The\s+/i, "")
    .replace(/["“”]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/—.*$/, "")
    .trim()
    .toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return s;
}

// Bold-paragraph labels that look like patterns but are actually sub-sections
// of the *previous* pattern. Currently only "Logic & Accessibility" qualifies
// (it's nested under the Anchor Motion pattern in foundations.md). Add new
// names here if more sub-section conventions emerge.
function isPatternSubsectionLabel(decodedName) {
  return /^\s*logic\s*&\s*accessibility\s*$/i.test(decodedName);
}

function buildMotionPayload(contentTokens, logger) {
  var payload = { description: null, tokens: {}, patterns: {} };
  var introLines = [];
  var mode = "intro"; // intro | duration | easing | delay | guide
  var currentPatternSlug = null;

  function ensureTokenBucket(key) {
    if (!payload.tokens[key]) payload.tokens[key] = {};
    return payload.tokens[key];
  }

  for (var i = 0; i < contentTokens.length; i++) {
    var tok = contentTokens[i];

    if (tok.type === "heading" && tok.depth === 4) {
      var h = String(tok.text || "")
        .toLowerCase()
        .trim();
      if (h === "duration") mode = "duration";
      else if (h === "easing") mode = "easing";
      else if (h === "delay") mode = "delay";
      else if (h === "component motion guide") {
        mode = "guide";
        currentPatternSlug = null;
      } else {
        // Unknown h4 — stay in current mode but reset pattern context
        currentPatternSlug = null;
      }
      continue;
    }

    if (mode === "intro" && tok.type === "paragraph") {
      var prose = extractors.extractProse(tok);
      if (prose) introLines.push(prose);
      continue;
    }

    if (mode === "duration" || mode === "easing" || mode === "delay") {
      var bucket = ensureTokenBucket(mode);
      if (tok.type === "table") {
        var rows = extractors.extractTable(tok);
        bucket.rows = applyStatusToRows(rows, "2.9", logger);
      } else if (tok.type === "paragraph") {
        var p = extractors.extractProse(tok);
        if (p)
          bucket.description = bucket.description
            ? bucket.description + "\n\n" + p
            : p;
      }
      continue;
    }

    if (mode === "guide") {
      if (tok.type === "paragraph") {
        if (isBoldOnlyParagraph(tok)) {
          var rawName = extractors.extractProse(tok).trim();
          var name = decodeHtmlEntities(rawName);
          // "Logic & Accessibility" and similar are sub-section labels of the
          // current pattern, not new patterns. Mark a pending key so the next
          // list/table attaches under the right field.
          if (isPatternSubsectionLabel(name) && currentPatternSlug) {
            payload.patterns[currentPatternSlug]._pendingSubsection =
              "logic_and_accessibility";
            continue;
          }
          var slug = slugifyPatternName(rawName);
          if (!slug) {
            logger.warn(
              "Section '2.9' pattern paragraph '" +
                name +
                "' produced empty slug; skipping",
            );
            currentPatternSlug = null;
            continue;
          }
          if (payload.patterns[slug]) {
            logger.warn(
              "Section '2.9' duplicate pattern slug '" +
                slug +
                "' — keeping first",
            );
            currentPatternSlug = null;
            continue;
          }
          payload.patterns[slug] = { name: name, phases: [] };
          currentPatternSlug = slug;
          continue;
        }
        // Non-bold paragraph inside guide — note for current pattern, or guide intro
        var notesText = decodeHtmlEntities(extractors.extractProse(tok));
        if (notesText && currentPatternSlug) {
          var pat = payload.patterns[currentPatternSlug];
          if (!pat.notes) pat.notes = [];
          pat.notes.push(notesText);
        }
        continue;
      }
      if (tok.type === "table" && currentPatternSlug) {
        payload.patterns[currentPatternSlug].phases =
          extractors.extractTable(tok);
        continue;
      }
      if (tok.type === "list" && currentPatternSlug) {
        var listItems = extractors.extractList(tok).map(decodeHtmlEntities);
        var pendingKey =
          payload.patterns[currentPatternSlug]._pendingSubsection ||
          "logic_and_accessibility";
        payload.patterns[currentPatternSlug][pendingKey] = listItems;
        delete payload.patterns[currentPatternSlug]._pendingSubsection;
        continue;
      }
      // hr, blockquote, etc. — ignore inside guide
    }
  }

  if (introLines.length) payload.description = introLines.join("\n\n");
  if (!payload.description) delete payload.description;
  if (Object.keys(payload.tokens).length === 0) delete payload.tokens;
  if (Object.keys(payload.patterns).length === 0) delete payload.patterns;
  return payload;
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
    var payload =
      heading.number === "2.9"
        ? buildMotionPayload(content, logger)
        : buildSectionPayload(content, heading.number, logger);

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
  buildMotionPayload,
  slugifyPatternName,
  applyStatusToRows,
  addMetaHeader,
  writeOutputs,
  runCli,
  parseArgs,
};
