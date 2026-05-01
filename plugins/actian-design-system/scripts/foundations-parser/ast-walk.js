"use strict";

var marked = require("marked");

function parseMarkdown(source) {
  return marked.lexer(String(source));
}

// Match leading numbering like "1.", "2.1", "2.10", etc. The trailing
// dot after a single number is optional (so "1. Foo" and "1 Foo" both work,
// matching Mathieu's existing MD style).
var NUMBERED_HEADING_RE = /^(\d+(?:\.\d+)*)\.?\s+(.+?)\s*$/;

function findNumberedHeadings(tokens) {
  var out = [];
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    if (token.type !== "heading") continue;
    if (token.depth !== 2 && token.depth !== 3) continue;
    var match = NUMBERED_HEADING_RE.exec(String(token.text || ""));
    if (!match) continue;
    out.push({
      number: match[1],
      text: match[2],
      depth: token.depth,
      tokenIndex: i,
    });
  }
  return out;
}

module.exports.parseMarkdown = parseMarkdown;
module.exports.findNumberedHeadings = findNumberedHeadings;
