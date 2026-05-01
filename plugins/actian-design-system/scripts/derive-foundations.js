"use strict";

var astWalk = require("./foundations-parser/ast-walk.js");
var extractors = require("./foundations-parser/extractors.js");
var statusEmoji = require("./foundations-parser/status-emoji.js");

function applyStatusToRows(rows) {
  return rows.map(function (row) {
    var copy = {};
    var status = null;
    var keys = Object.keys(row);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var v = row[k];
      if (k === "Status") {
        status = statusEmoji.extractStatus(v);
        continue;
      }
      copy[k] = v;
    }
    if (status) copy.status = status;
    return copy;
  });
}

function buildSectionPayload(contentTokens) {
  var payload = { rows: [], lists: [], code: [], description: null };
  var descLines = [];

  for (var i = 0; i < contentTokens.length; i++) {
    var token = contentTokens[i];
    if (token.type === "table") {
      var rows = extractors.extractTable(token);
      payload.rows = payload.rows.concat(applyStatusToRows(rows));
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
        "Numbered heading '" + heading.number + " " + heading.text +
        "' has no parser map entry; skipping."
      );
      continue;
    }
    var content = astWalk.sliceSectionContent(tokens, heading);
    var payload = buildSectionPayload(content);

    if (!output[target.file]) output[target.file] = {};
    if (target.key) output[target.file][target.key] = payload;
    else Object.assign(output[target.file], payload);
  }
  return output;
}

module.exports = { deriveFromMarkdown, buildSectionPayload, applyStatusToRows };
