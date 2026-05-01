"use strict";

function cellText(cell) {
  if (!cell) return "";
  // marked keeps backticks in cell.text (e.g. "`--zen-color-blue-500`").
  // When the cell contains a single codespan inline token, use its pre-stripped
  // .text instead so callers receive the unwrapped value.
  if (
    Array.isArray(cell.tokens) &&
    cell.tokens.length === 1 &&
    cell.tokens[0].type === "codespan"
  ) {
    return String(cell.tokens[0].text || "").trim();
  }
  return String(cell.text || "").trim();
}

function extractTable(tableToken) {
  if (!tableToken || tableToken.type !== "table") return [];
  if (!Array.isArray(tableToken.header) || !Array.isArray(tableToken.rows))
    return [];
  if (tableToken.rows.length === 0) return [];

  var headers = tableToken.header.map(cellText);

  var out = [];
  for (var r = 0; r < tableToken.rows.length; r++) {
    var dataRow = tableToken.rows[r];
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = dataRow[c] ? cellText(dataRow[c]) : "";
    }
    out.push(obj);
  }
  return out;
}

function extractFencedBlock(codeToken) {
  if (!codeToken || codeToken.type !== "code") return null;
  var lang = codeToken.lang ? String(codeToken.lang).toLowerCase() : null;
  // marked may leave lang as empty string for fences with no language tag
  if (lang === "") lang = null;
  return {
    lang: lang,
    value: typeof codeToken.text === "string" ? codeToken.text : "",
  };
}

module.exports = { extractTable, cellText, extractFencedBlock };
module.exports.extractFencedBlock = extractFencedBlock;

// Walk inline tokens (codespan, em, strong, text, link, etc.) and return
// concatenated text, stripping backticks/asterisks/underscores along the way.
// marked stores inline structure in token.tokens; the leaves carry .text.
function inlineText(tokens) {
  if (!Array.isArray(tokens)) return "";
  var parts = [];
  for (var i = 0; i < tokens.length; i++) {
    var t = tokens[i];
    if (t.type === "text" && typeof t.text === "string") {
      // text tokens may themselves have nested inline tokens (e.g. inside a list item)
      if (Array.isArray(t.tokens) && t.tokens.length > 0) {
        parts.push(inlineText(t.tokens));
      } else {
        parts.push(t.text);
      }
    } else if (t.type === "codespan" && typeof t.text === "string") {
      parts.push(t.text);
    } else if (Array.isArray(t.tokens)) {
      // strong, em, link, etc. — recurse into their children
      parts.push(inlineText(t.tokens));
    } else if (typeof t.text === "string") {
      parts.push(t.text);
    }
  }
  return parts.join("");
}

function extractList(listToken) {
  if (!listToken || listToken.type !== "list") return [];
  if (!Array.isArray(listToken.items)) return [];
  var out = [];
  for (var i = 0; i < listToken.items.length; i++) {
    var item = listToken.items[i];
    // List items contain block-level tokens (often a single paragraph).
    // Drill into item.tokens to find paragraph(s) and concatenate their text.
    var text = "";
    if (Array.isArray(item.tokens)) {
      for (var j = 0; j < item.tokens.length; j++) {
        var inner = item.tokens[j];
        if (inner.type === "text" || inner.type === "paragraph") {
          // Both expose .tokens with inline children
          text += inlineText(inner.tokens || []);
        }
      }
    }
    if (!text && typeof item.text === "string") {
      // Fallback: use raw text but strip basic markers
      text = item.text.replace(/[`*_]/g, "");
    }
    out.push(text.trim());
  }
  return out;
}

function extractProse(paragraphToken) {
  if (!paragraphToken || paragraphToken.type !== "paragraph") return "";
  if (Array.isArray(paragraphToken.tokens)) {
    return inlineText(paragraphToken.tokens).trim();
  }
  return String(paragraphToken.text || "").trim();
}

module.exports.extractList = extractList;
module.exports.extractProse = extractProse;
module.exports.inlineText = inlineText;
