"use strict";

var STATUS_MAP = {
  "✅": null,            // current — no flag emitted
  "⚠️": "proposed",
  "❌": "deprecated",
  "🚧": "in-progress",
};

// Match a leading status emoji (with optional surrounding whitespace) at the
// start of a string. Capture group 1 is the emoji, group 2 is the remainder.
var LEADING_EMOJI_RE = /^\s*(✅|⚠️|❌|🚧)\s*(.*?)\s*$/;

function extractStatus(s) {
  var trimmed = String(s).trim();
  if (Object.prototype.hasOwnProperty.call(STATUS_MAP, trimmed)) {
    return STATUS_MAP[trimmed];
  }
  return null;
}

extractStatus.fromValueCell = function (s) {
  var m = LEADING_EMOJI_RE.exec(String(s));
  if (m && Object.prototype.hasOwnProperty.call(STATUS_MAP, m[1])) {
    return { value: m[2], status: STATUS_MAP[m[1]] };
  }
  return { value: String(s).trim(), status: null };
};

extractStatus.STATUS_MAP = STATUS_MAP;

module.exports = { extractStatus };
