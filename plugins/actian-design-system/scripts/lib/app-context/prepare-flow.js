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

// Archetype fallback: when no app pattern matches a screen name AND the
// recipe ranker itself finds no archetype (no-match or a tie), pick by
// keyword so every screen still gets a skeleton. First category whose
// words overlap the screen-name tokens wins; order is the priority.
var FALLBACK_ARCHETYPES = [
  { words: ["list", "table", "browse", "catalog", "results"], archetype: "table-list" },
  { words: ["create", "new", "setup", "edit", "configure", "wizard", "form", "settings"], archetype: "form-create" },
  { words: ["review", "confirm", "summary"], archetype: "composition-form-with-footer" },
  { words: ["dashboard", "overview", "home"], archetype: "dashboard" },
];

function fallbackArchetype(name) {
  var toks = tokens(name);
  for (var i = 0; i < FALLBACK_ARCHETYPES.length; i++) {
    var cat = FALLBACK_ARCHETYPES[i];
    for (var t = 0; t < toks.length; t++) {
      if (cat.words.indexOf(toks[t]) !== -1) return cat.archetype;
    }
  }
  return "detail-view";
}

// A rule name as it appears in the registry carries the Figma node id
// suffix ("Show Avatar#14797:1"). The screen-generator agent authors props
// by their plain name, matching the established convention documented at
// validate-flow-data.js's hasOverride() (a required-override prop AND a
// default-true boolean are both accepted under either the exact hashed
// name or the base name before "#").
function stripPropId(name) {
  return String(name).replace(/#[\d:]+$/, "");
}

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
  // A caller that already knows the archetype id (the keyword fallback
  // above) passes no status at all; only reject a status that says the
  // ranker itself found no usable winner ("no-match" / "tie").
  if (sel.status && sel.status !== "decisive" && sel.status !== "weak") return null;
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
    var archetype = loadArchetype(sel);
    if (!archetype) {
      // Applies whenever the ranker found nothing usable, whether or not a
      // pattern matched by name (a matched pattern's own tags can still
      // rank to a tie or no-match -- e.g. "Activity timeline", "Discussion
      // threads" among Studio's patterns), so every screen gets a skeleton.
      archetype = loadArchetype({ archetype: fallbackArchetype(s.name) });
    }
    var rawPropertyRules = rules.inspectSlugs(components);
    var propertyRules = {};
    Object.keys(rawPropertyRules).forEach(function (slug) {
      var r = rawPropertyRules[slug];
      propertyRules[slug] = {
        // Plain names for both lists: validate-flow-data.js's hasOverride()
        // accepts the base name before "#" as satisfying an override, and
        // that same tolerance now covers the default-true-boolean-unset
        // check too (the DS leaf renderer itself reads these booleans by
        // their plain name, e.g. ds-html-map.js's
        // props["Leading icon show"] -- the suffixed form was never what
        // actually got read at render time).
        required: r.required.map(stripPropId),
        defaultTrueBooleans: r.defaultTrueBooleans.map(stripPropId),
      };
    });
    return {
      name: s.name,
      template: s.template,
      pattern: p ? { slug: p.slug, label: p.label } : null,
      archetype: archetype,
      pageRecipe: p ? loadPageRecipe(patterns.selectPageRecipe(p.slug, app)) : null,
      components: components,
      propertyRules: propertyRules,
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

// Per-screen slice of a full brief: everything a single author agent needs
// and nothing it doesn't. glossary.patterns drops the whole app's pattern
// catalog down to just this screen's match (or empty), which is most of the
// context-size saving over handing every agent the full brief.
function sliceBrief(brief, n) {
  var idx = n - 1;
  var screen = brief.screens[idx];
  var slug = screen && screen.pattern ? screen.pattern.slug : null;
  var patternsForScreen = slug
    ? brief.glossary.patterns.filter(function (pat) { return pat.slug === slug; })
    : [];
  return {
    app: brief.app,
    entity: brief.entity,
    index: n,
    total: brief.screens.length,
    glossary: {
      chrome: brief.glossary.chrome,
      useCases: brief.glossary.useCases,
      entityProperties: brief.glossary.entityProperties,
      relationships: brief.glossary.relationships,
      entityPatterns: brief.glossary.entityPatterns,
      entityComponents: brief.glossary.entityComponents,
      patterns: patternsForScreen,
    },
    join: brief.join,
    labels: brief.labels,
    screen: screen,
  };
}

var USAGE = "usage: prepare-flow.js --app <app> [--entity <slug>] --screen-list <file> [-o <out>] | --list-entities\n";

function main(argv) {
  var args = argv.slice();
  function take(flag) { var i = args.indexOf(flag); return i !== -1 && i + 1 < args.length ? args[i + 1] : null; }
  if (args.indexOf("--list-entities") !== -1) {
    properties.listEntities().forEach(function (name) { process.stdout.write(name + "\n"); });
    return 0;
  }
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
    var briefDir = path.join(path.dirname(out), ".brief");
    fs.mkdirSync(briefDir, { recursive: true });
    fs.readdirSync(briefDir).forEach(function (f) {
      if (f.endsWith(".json")) fs.unlinkSync(path.join(briefDir, f));
    });
    var sliceCount = 0;
    for (var n = 1; n <= brief.screens.length; n++) {
      fs.writeFileSync(path.join(briefDir, n + ".json"), JSON.stringify(sliceBrief(brief, n), null, 2));
      sliceCount++;
    }
    process.stderr.write("prepare-flow: wrote " + out + " (" + screens.length + " screens, " + sliceCount + " slices)\n");
  } else {
    process.stdout.write(json + "\n");
  }
  return 0;
}

module.exports = { prepareFlow: prepareFlow, pickPattern: pickPattern, tokens: tokens, sliceBrief: sliceBrief, main: main };

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
