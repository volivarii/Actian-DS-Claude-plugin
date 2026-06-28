#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var PATHS = require(path.join(__dirname, "..", "paths.js"));

// Optional injection seam (testing): a pre-loaded context object (used as-is)
// or a path string. Production omits → reads PATHS.appContext. Mirrors
// resolve-relationships.js loadAppContext().
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

// Sentence-case a space-separated property name: "use case" → "Use case".
// Property names are phrases, not hyphenated slugs — so this capitalizes the
// first character only (Actian sentence-case content rule), unlike
// resolve-relationships.humanizeSlug.
function humanizeName(name) {
  if (typeof name !== "string") return "";
  var s = name.trim();
  if (s.length === 0) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Entity properties as a uniform [{name,label,type,states?,example?}]. The
// substrate `properties` array is MIXED: bare field-name strings AND typed
// objects ({name,type,states}/{name,type,example}). Strings become
// {name,label,type:"string"}; objects keep type/states/example (typed shape
// carried forward for S3c rendering). Invalid entries are dropped.
function resolveProperties(entityName, ctx) {
  var key = normalizeEntity(entityName);
  if (!key) return [];
  var data = loadAppContext(ctx);
  if (!data || !data.entities || !data.entities[key]) return [];
  var props = data.entities[key].properties;
  if (!Array.isArray(props)) return [];
  var out = [];
  props.forEach(function (p) {
    if (typeof p === "string") {
      if (p.length === 0) return;
      out.push({ name: p, label: humanizeName(p), type: "string" });
      return;
    }
    if (p && typeof p === "object" && typeof p.name === "string" && p.name.length > 0) {
      var entry = {
        name: p.name,
        label: humanizeName(p.name),
        type: typeof p.type === "string" && p.type ? p.type : "string",
      };
      if (Array.isArray(p.states)) entry.states = p.states.slice();
      if (typeof p.example === "string") entry.example = p.example;
      out.push(entry);
    }
  });
  return out;
}

function listEntities(ctx) {
  var data = loadAppContext(ctx);
  if (!data || !data.entities) return [];
  return Object.keys(data.entities);
}

module.exports = {
  resolveProperties: resolveProperties,
  normalizeEntity: normalizeEntity,
  humanizeName: humanizeName,
  listEntities: listEntities,
};

// Thin CLI: `resolve-properties.js --entity data-product`
// → { entity, properties }. Parity with resolve-relationships.js --entity.
if (require.main === module) {
  var args = process.argv.slice(2);
  var idx = args.indexOf("--entity");
  if (idx !== -1 && args[idx + 1]) {
    var ent = args[idx + 1];
    var key = normalizeEntity(ent);
    var known = listEntities().indexOf(key) !== -1;
    process.stdout.write(
      JSON.stringify({ entity: key, properties: resolveProperties(ent) }, null, 2) + "\n",
    );
    process.exit(known ? 0 : 1);
  }
  process.stderr.write("usage: resolve-properties.js --entity <slug>\n");
  process.exit(2);
}
