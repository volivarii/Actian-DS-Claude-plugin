// scripts/renderers/html-renderers/anatomy-variant-key.js
// Pure helpers shared by the assemble-time anatomy builder (ds-anatomy-map.js)
// and the fs-free interpreter (ds-html-map.js) so both compute the SAME
// composite key for a delegated slug + variant. No requires (leaf module).
"use strict";

// Slice 1 delegates the tag family to the variant-aware anatomy render.
// Widening later = broadening this predicate; no other change needed.
function isDelegated(slug) {
  return typeof slug === "string" && slug.indexOf("tag-") === 0;
}

// slug + a deterministic, sorted encoding of the variant object.
// Both call sites pass the SAME node's variant, so the keys match without
// either side needing the sidecar's variantDefaults.
function anatomyVariantKey(slug, variant) {
  if (!variant || typeof variant !== "object") return slug;
  var keys = Object.keys(variant).sort();
  if (!keys.length) return slug;
  var parts = [];
  for (var i = 0; i < keys.length; i++) parts.push(keys[i] + "=" + variant[keys[i]]);
  return slug + "|" + parts.join(",");
}

module.exports = { isDelegated: isDelegated, anatomyVariantKey: anatomyVariantKey };
