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
  for (var i = 0; i < data.screens.length; i++) {
    var s = data.screens[i];
    if (!s) continue;
    if (s.id) continue;
    s.id = deriveScreenId(feature, i);
  }
}

module.exports = { deriveScreenId, stampScreenIds };
