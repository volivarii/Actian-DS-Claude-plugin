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
