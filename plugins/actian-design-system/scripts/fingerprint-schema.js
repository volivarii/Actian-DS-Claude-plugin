"use strict";

var fs = require("fs");
var path = require("path");

var RECIPE_IDS = (function loadRecipeIds() {
  var p = path.join(__dirname, "..", "recipes", "flow", "_index.json");
  var idx = JSON.parse(fs.readFileSync(p, "utf8"));
  var ids = [];
  for (var i = 0; i < idx.length; i++) {
    if (idx[i] && typeof idx[i].archetype === "string") {
      ids.push(idx[i].archetype);
    }
  }
  return ids;
})();

var DENSITY_ENUM = ["high", "medium", "low"];

function validateFingerprint(obj) {
  var errors = [];
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    errors.push("fingerprint must be an object");
    return { valid: false, errors: errors };
  }
  if ("density" in obj && DENSITY_ENUM.indexOf(obj.density) === -1) {
    errors.push("density must be one of: " + DENSITY_ENUM.join(", "));
  }
  if ("hierarchy_depth" in obj) {
    var d = obj.hierarchy_depth;
    if (typeof d !== "number" || !Number.isInteger(d) || d < 1 || d > 8) {
      errors.push("hierarchy_depth must be integer in 1..8");
    }
  }
  if ("primary_components" in obj) {
    if (!Array.isArray(obj.primary_components)) {
      errors.push("primary_components must be array");
    } else {
      for (var i = 0; i < obj.primary_components.length; i++) {
        if (typeof obj.primary_components[i] !== "string") {
          errors.push("primary_components[" + i + "] must be string");
        }
      }
    }
  }
  if (
    "layout_archetype" in obj &&
    RECIPE_IDS.indexOf(obj.layout_archetype) === -1
  ) {
    errors.push("layout_archetype must be one of: " + RECIPE_IDS.join(", "));
  }
  return { valid: errors.length === 0, errors: errors };
}

module.exports = {
  RECIPE_IDS: RECIPE_IDS,
  validateFingerprint: validateFingerprint,
};
