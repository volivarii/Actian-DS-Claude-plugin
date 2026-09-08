"use strict";

function deriveScreenId(feature, index) {
  var slug = String(feature == null ? "" : feature)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) slug = "screen";
  return slug + "-" + (index + 1);
}

function stampScreenIds(data) {
  if (!data || !Array.isArray(data.screens)) return;
  var feature = (data.meta && data.meta.feature) || "";
  var usedIds = {};
  for (var j = 0; j < data.screens.length; j++) {
    var existing = data.screens[j];
    if (existing && existing.id) usedIds[existing.id] = true;
  }
  for (var i = 0; i < data.screens.length; i++) {
    var s = data.screens[i];
    if (!s) continue;
    if (s.id) continue;
    var k = i;
    var candidate = deriveScreenId(feature, k);
    while (usedIds[candidate]) {
      k++;
      candidate = deriveScreenId(feature, k);
    }
    s.id = candidate;
    usedIds[candidate] = true;
  }
}

module.exports = { deriveScreenId, stampScreenIds };
