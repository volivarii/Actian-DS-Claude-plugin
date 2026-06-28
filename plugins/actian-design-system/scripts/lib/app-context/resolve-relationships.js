#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var PATHS = require(path.join(__dirname, "..", "paths.js"));

// Optional injection seam (testing): a pre-loaded context object (used as-is)
// or a path string. Production omits → reads PATHS.appContext. Mirrors
// resolve-patterns.js loadAppContext().
function loadAppContext(ctx) {
  if (ctx && typeof ctx === "object") return ctx;
  var p = ctx && typeof ctx === "string" ? ctx : PATHS.appContext;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

function normalizeEntity(name) {
  if (typeof name !== "string") return "";
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

// "glossary-item" → "Glossary item"; "lineage" → "Lineage"
function humanizeSlug(slug) {
  if (typeof slug !== "string") return "";
  var words = slug.split("-").filter(function (w) {
    return w.length > 0;
  });
  if (words.length === 0) return "";
  return words
    .map(function (w, i) {
      return i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w;
    })
    .join(" ");
}

// Entity relationships as [{relationship, relatedEntity, label}]. A
// relationships{} value may be a related-entity slug string OR an array of
// slugs (flattened to one entry per related entity).
function resolveRelationships(entityName, ctx) {
  var key = normalizeEntity(entityName);
  if (!key) return [];
  var data = loadAppContext(ctx);
  if (!data || !data.entities || !data.entities[key]) return [];
  var rels = data.entities[key].relationships;
  if (!rels || typeof rels !== "object" || Array.isArray(rels)) return [];
  var out = [];
  Object.keys(rels).forEach(function (relName) {
    var v = rels[relName];
    var targets = Array.isArray(v) ? v : [v];
    targets.forEach(function (t) {
      if (typeof t !== "string" || t.length === 0) return;
      out.push({
        relationship: relName,
        relatedEntity: t,
        label: humanizeSlug(t),
      });
    });
  });
  return out;
}

function listEntities(ctx) {
  var data = loadAppContext(ctx);
  if (!data || !data.entities) return [];
  return Object.keys(data.entities);
}

module.exports = {
  resolveRelationships: resolveRelationships,
  normalizeEntity: normalizeEntity,
  humanizeSlug: humanizeSlug,
  listEntities: listEntities,
};

// Thin CLI: `resolve-relationships.js --entity catalog-object`
// → { entity, relationships }. Parity with resolve-patterns.js --app.
if (require.main === module) {
  var args = process.argv.slice(2);
  var idx = args.indexOf("--entity");
  if (idx !== -1 && args[idx + 1]) {
    var ent = args[idx + 1];
    var key = normalizeEntity(ent);
    var known = listEntities().indexOf(key) !== -1;
    process.stdout.write(
      JSON.stringify(
        { entity: key, relationships: resolveRelationships(ent) },
        null,
        2,
      ) + "\n",
    );
    process.exit(known ? 0 : 1);
  }
  process.stderr.write("usage: resolve-relationships.js --entity <slug>\n");
  process.exit(2);
}
