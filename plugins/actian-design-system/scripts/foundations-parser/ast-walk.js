"use strict";

var marked = require("marked");

function parseMarkdown(source) {
  return marked.lexer(String(source));
}

module.exports = { parseMarkdown };
