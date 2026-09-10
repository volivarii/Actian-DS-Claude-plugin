#!/usr/bin/env node
"use strict";
// prepare-flow.js: one brief per flow. Joins the four app-context resolvers,
// the recipe selectors and the property-rules inspector so the author agent
// reads one JSON instead of the app-context prose, the captures and the
// registries. Step 3.5 of generate-flow runs this once.
var fs = require("fs");
var path = require("path");
var chrome = require("./resolve-chrome.js");
var patterns = require("./resolve-patterns.js");
var properties = require("./resolve-properties.js");
var relationships = require("./resolve-relationships.js");
var rules = require("../../validation/component-property-rules.js");

var STOP = { the: 1, a: 1, an: 1, of: 1, to: 1, for: 1, with: 1, and: 1, in: 1, on: 1 };
var RECIPES_DIR = path.join(__dirname, "..", "..", "..", "recipes", "flow");

function tokens(name) {
  return String(name || "").toLowerCase().split(/[^a-z]+/).filter(function (t) {
    return t.length >= 3 && !STOP[t];
  });
}

function pickPattern(name, appPatterns) {
  var toks = tokens(name);
  var best = null, bestScore = 0;
  for (var i = 0; i < appPatterns.length; i++) {
    var p = appPatterns[i];
    var tags = patterns.patternTags(p, p.slug).map(String);
    var label = String(p.label || "").toLowerCase();
    var score = 0;
    for (var t = 0; t < toks.length; t++) {
      if (tags.indexOf(toks[t]) !== -1) score++;
      if (label.indexOf(toks[t]) !== -1) score++;
    }
    if (score > bestScore) { best = p; bestScore = score; }
  }
  return best;
}

function loadArchetype(sel) {
  if (!sel || typeof sel.archetype !== "string") return null;
  if (sel.status !== "decisive" && sel.status !== "weak") return null;
  try {
    var idx = JSON.parse(fs.readFileSync(path.join(RECIPES_DIR, "_index.json"), "utf8"));
    var row = idx.filter(function (r) { return r.archetype === sel.archetype; })[0];
    if (!row) return null;
    var recipe = JSON.parse(fs.readFileSync(path.join(RECIPES_DIR, row.file), "utf8"));
    return { archetype: sel.archetype, file: row.file, skeleton: recipe.skeleton || null, slots: recipe.slots || null };
  } catch (e) {
    return null;
  }
}

function loadPageRecipe(slug) {
  if (!slug) return null;
  var all = patterns.loadPageRecipes();
  var r = all.filter(function (x) { return x && x.slug === slug; })[0];
  if (!r) return null;
  return { slug: r.slug, label: r.label, slots: r.slots || null, renderNotes: r.renderNotes || [], skeleton: r.skeleton || null };
}

function uniq(list) {
  var seen = {}, out = [];
  list.forEach(function (x) { if (x && !seen[x]) { seen[x] = 1; out.push(x); } });
  return out;
}

function prepareFlow(options) {
  var app = options.app;
  var entity = options.entity || null;
  var ctx = options.ctx;
  var chromeOut = chrome.resolveChrome(app);
  var appPatterns = patterns.resolvePatterns(app, ctx) || [];
  var useCases = patterns.resolveUseCases(app, ctx) || [];
  var entityProperties = entity ? properties.resolveProperties(entity, ctx) || [] : [];
  var rels = entity ? relationships.resolveRelationships(entity, ctx) || [] : [];
  var entityPatterns = entity ? patterns.resolveEntityPatterns(entity, ctx) || [] : [];
  var entityComponents = entity ? patterns.resolveEntityComponents(entity, ctx) || [] : [];
  var join = entity ? patterns.entityJoinState(ctx) : null;

  var labels = uniq(
    (chromeOut && chromeOut.sidebar ? chromeOut.sidebar.map(function (s) { return s.label; }) : [])
      .concat(chromeOut && chromeOut.header ? [chromeOut.header.type] : [])
      .concat(entityProperties.map(function (p) { return p.label; }))
      .concat(rels.map(function (r) { return r.label; }))
  );

  var screens = (options.screens || []).map(function (s) {
    var p = pickPattern(s.name, appPatterns);
    var sel = p ? patterns.selectRecipe(patterns.patternTags(p, p.slug)) : patterns.selectRecipe(tokens(s.name));
    var components = p ? uniq(p.components || []) : [];
    return {
      name: s.name,
      template: s.template,
      pattern: p ? { slug: p.slug, label: p.label } : null,
      archetype: loadArchetype(sel),
      pageRecipe: p ? loadPageRecipe(patterns.selectPageRecipe(p.slug, app)) : null,
      components: components,
      propertyRules: rules.inspectSlugs(components),
    };
  });

  return {
    app: app,
    entity: entity,
    glossary: {
      chrome: chromeOut,
      patterns: appPatterns,
      useCases: useCases,
      entityProperties: entityProperties,
      relationships: rels,
      entityPatterns: entityPatterns,
      entityComponents: entityComponents,
    },
    join: join,
    labels: labels,
    screens: screens,
  };
}

var USAGE = "usage: prepare-flow.js --app <app> [--entity <slug>] --screen-list <file> [-o <out>]\n";

function main(argv) {
  var args = argv.slice();
  function take(flag) { var i = args.indexOf(flag); return i !== -1 && i + 1 < args.length ? args[i + 1] : null; }
  var app = take("--app"), entity = take("--entity"), list = take("--screen-list"), out = take("-o");
  if (!app || !list) { process.stderr.write(USAGE); return 1; }
  var screens;
  try {
    screens = JSON.parse(fs.readFileSync(list, "utf8")).screens || [];
  } catch (e) {
    process.stderr.write("prepare-flow: cannot read " + list + ": " + e.message + "\n");
    return 1;
  }
  var brief = prepareFlow({ app: app, entity: entity, screens: screens });
  var json = JSON.stringify(brief, null, 2);
  if (out) {
    fs.writeFileSync(out, json);
    process.stderr.write("prepare-flow: wrote " + out + " (" + screens.length + " screens)\n");
  } else {
    process.stdout.write(json + "\n");
  }
  return 0;
}

module.exports = { prepareFlow: prepareFlow, pickPattern: pickPattern, tokens: tokens, main: main };

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
