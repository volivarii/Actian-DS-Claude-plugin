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

// Words dropped when deriving R (a screen's name with the entity's own words
// subtracted) in the entity-aware routing below. Distinct from STOP: STOP
// feeds tag/label scoring and stays conservative, this list is local to the
// collection-vs-detail decision.
var ENTITY_ROUTING_STOP = { the: 1, a: 1, of: 1, all: 1, page: 1, view: 1 };

// R made entirely of these words names the entity's own detail page.
var DETAIL_WORDS = { detail: 1, overview: 1, general: 1 };

// A token ending in "s" (not "ss") also names its singular ("products" /
// "product", "details" / "detail"). A blunt trailing-s strip, not real
// pluralisation, but good enough for the word forms screen names use.
function singularize(t) {
  if (t.length > 1 && t.charAt(t.length - 1) === "s" && t.charAt(t.length - 2) !== "s") {
    return t.slice(0, -1);
  }
  return t;
}

// The plain split-and-filter, one token per word, in name order. tokens()
// below augments this with singular forms for tag/label scoring; the
// entity-aware routing uses this unaugmented form directly (see
// canonicalWords) so a plural/singular pair collapses to one word instead
// of surviving a set difference as two.
function baseTokens(name) {
  return String(name || "").toLowerCase().split(/[^a-z]+/).filter(function (t) {
    return t.length >= 3 && !STOP[t];
  });
}

// Archetype fallback: when no app pattern matches a screen name AND the
// recipe ranker itself finds no archetype (no-match or a tie), pick by
// keyword so every screen still gets a skeleton. First category whose
// words overlap the screen-name tokens wins; order is the priority.
var FALLBACK_ARCHETYPES = [
  { words: ["list", "table", "browse", "catalog", "results"], archetype: "table-list" },
  { words: ["create", "new", "setup", "edit", "configure", "wizard", "form", "settings"], archetype: "form-create" },
  { words: ["confirm", "success", "done", "complete", "detail", "details", "overview"], archetype: "detail-view" },
  { words: ["review", "summary"], archetype: "composition-form-with-footer" },
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
  // No keyword hit at all: a name whose last original word is plural (ends
  // in "s", not "ss") reads as a collection with nothing else to go on
  // ("Data products", "Access requests"). Anything else stays detail-view.
  var base = baseTokens(name);
  var last = base.length ? base[base.length - 1] : "";
  if (last.length > 1 && last.charAt(last.length - 1) === "s" && last.charAt(last.length - 2) !== "s") {
    return "table-list";
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
  var base = baseTokens(name);
  var seen = {};
  var out = [];
  base.forEach(function (t) {
    if (!seen[t]) {
      seen[t] = 1;
      out.push(t);
    }
    var s = singularize(t);
    if (s !== t && s.length >= 3 && !seen[s]) {
      seen[s] = 1;
      out.push(s);
    }
  });
  return out;
}

// Canonical (singularised, deduped) content words of a name: one entry per
// word, not the plural-plus-singular pair tokens() carries for scoring. The
// entity-aware routing below needs one form per word so a plain set
// difference against the entity's own words (also canonical) actually
// empties out when the whole name is just the entity's name.
function canonicalWords(name) {
  var seen = {};
  var out = [];
  baseTokens(name).forEach(function (t) {
    var c = singularize(t);
    if (!seen[c]) {
      seen[c] = 1;
      out.push(c);
    }
  });
  return out;
}

// The first of an entity's own patterns (resolveEntityPatterns's plain
// {slug,label,apps,components} objects) whose tags include one of wantTags.
// patternTags falls back to the slug's own words when the substrate carries
// no authored tags on that shape, so this still works on an unauthored
// pattern.
function firstEntityPatternByTag(entityPatterns, wantTags) {
  for (var i = 0; i < entityPatterns.length; i++) {
    var p = entityPatterns[i];
    var tags = patterns.patternTags(p, p.slug);
    for (var w = 0; w < wantTags.length; w++) {
      if (tags.indexOf(wantTags[w]) !== -1) return p;
    }
  }
  return null;
}

// A screen named after the entity itself, before the exact-label pass and
// the scoring ever run. R is the name's words with the entity's own words
// and a short stoplist removed:
//   R empty            -> the entity's collection page (browse/list/search).
//   R subset of DETAIL_WORDS -> the entity's detail page.
//   otherwise          -> null, entity routing does not apply; the caller
//                          falls through to pickPattern as today.
// A collection/detail decision that finds no tagged entityPatterns entry
// still returns a decision (archetypeId set, pattern left for the caller to
// treat as null) rather than falling through -- an entity-named screen with
// an unauthored pattern set should not silently drop back to the raw name
// scoring, which is the coincidence this task removes.
function routeEntityScreen(name, entitySlug, entityPatterns) {
  var E = canonicalWords(entitySlug);
  var R = canonicalWords(name).filter(function (t) {
    return E.indexOf(t) === -1 && !ENTITY_ROUTING_STOP[t];
  });
  if (R.length === 0) {
    var collection = firstEntityPatternByTag(entityPatterns, ["browse", "list", "search"]);
    return collection ? { pattern: collection } : { archetypeId: "table-list" };
  }
  var isDetail = R.every(function (t) {
    return !!DETAIL_WORDS[t];
  });
  if (isDetail) {
    var detail = firstEntityPatternByTag(entityPatterns, ["detail"]);
    return detail ? { pattern: detail } : { archetypeId: "detail-view" };
  }
  return null;
}

// Whitespace-normalised, case-insensitive label equality. A screen name is
// frequently authored as the pattern's own label verbatim (the designer
// copied it from the pattern catalog); that is a certain match and must win
// outright, before scoring ever runs -- otherwise a pattern with a heavier
// tag vocabulary on a shared word can outscore the pattern the name actually
// names (e.g. "Access request management" naming access-request-management
// exactly, while access-request-workflow's authored "request" tag alone
// scores higher under the tag/label weighting below).
function normalizeLabel(s) {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// Score = 2 per tag hit (an authored/derived pattern tag exactly matching a
// name token) + 1 per whole-word label hit (the label carries the token as
// its own word, not merely as a substring -- "data" no longer drags in
// "data-profiling-sampling" just because both strings contain "data").
// Below 2, nothing scored highly enough to justify a match: null, same as no
// candidates at all. On a tie, a pattern the entity itself names in its own
// patterns[] (entityPatternSlugs, default empty) wins over one the name
// alone happens to score equally -- entity ownership is a stronger signal
// than generic word overlap. An exact label match (above) always wins first.
function pickPattern(name, appPatterns, entityPatternSlugs) {
  var normName = normalizeLabel(name);
  for (var e = 0; e < appPatterns.length; e++) {
    if (normalizeLabel(appPatterns[e].label) === normName) return appPatterns[e];
  }

  var entitySlugs = {};
  (entityPatternSlugs || []).forEach(function (s) { entitySlugs[s] = 1; });
  var toks = tokens(name);
  var best = null, bestScore = 0;
  for (var i = 0; i < appPatterns.length; i++) {
    var p = appPatterns[i];
    var tags = patterns.patternTags(p, p.slug).map(String);
    var label = String(p.label || "").toLowerCase();
    var score = 0;
    for (var t = 0; t < toks.length; t++) {
      if (tags.indexOf(toks[t]) !== -1) score += 2;
      if (new RegExp("\\b" + toks[t] + "\\b").test(label)) score += 1;
    }
    if (score > bestScore) {
      best = p; bestScore = score;
    } else if (score > 0 && score === bestScore && best && entitySlugs[p.slug] && !entitySlugs[best.slug]) {
      best = p;
    }
  }
  return bestScore >= 2 ? best : null;
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

// True when word (case-insensitive, whole word) appears in ANY entry of a
// use case's audience, not just audience[0]. Studio's two use cases both
// carry "Data steward" as audience[0] (the shared persona), so a word that
// only names the differing role -- "architect" or "engineer" -- lives in
// audience[1] ("Data architect" / "Data engineer") and would never match if
// this only read audience[0]. The caller walks useCases in order and keeps
// the first hit, so "steward" still yields useCases[0], same as Gate 3's own
// default when the prompt names no audience keyword.
function matchesUseCaseAudience(uc, word) {
  var audience = (uc && Array.isArray(uc.audience)) ? uc.audience : [];
  var re = new RegExp("\\b" + word.toLowerCase() + "\\b");
  for (var i = 0; i < audience.length; i++) {
    if (re.test(String(audience[i]).toLowerCase())) return true;
  }
  return false;
}

function prepareFlow(options) {
  var app = options.app;
  var entity = options.entity || null;
  var ctx = options.ctx;
  var chromeOut = chrome.resolveChrome(app);
  var appPatterns = patterns.resolvePatterns(app, ctx) || [];
  var useCases = patterns.resolveUseCases(app, ctx) || [];
  if (options.useCase) {
    var matchedUseCase = null;
    for (var u = 0; u < useCases.length; u++) {
      if (matchesUseCaseAudience(useCases[u], options.useCase)) {
        matchedUseCase = useCases[u];
        break;
      }
    }
    if (matchedUseCase) {
      useCases = [matchedUseCase];
    } else {
      process.stderr.write("prepare-flow: no use case matches " + options.useCase + ", keeping all\n");
    }
  }
  var entityProperties = entity ? properties.resolveProperties(entity, ctx) || [] : [];
  var rels = entity ? relationships.resolveRelationships(entity, ctx) || [] : [];
  var entityPatterns = entity ? patterns.resolveEntityPatterns(entity, ctx) || [] : [];
  var entityComponents = entity ? patterns.resolveEntityComponents(entity, ctx) || [] : [];
  var join = entity ? patterns.entityJoinState(ctx) : null;
  var entityPatternSlugs = entityPatterns.map(function (p) { return p.slug; });

  var labels = uniq(
    (chromeOut && chromeOut.sidebar ? chromeOut.sidebar.map(function (s) { return s.label; }) : [])
      .concat(chromeOut && chromeOut.header ? [chromeOut.header.type] : [])
      .concat(entityProperties.map(function (p) { return p.label; }))
      .concat(rels.map(function (r) { return r.label; }))
  );

  var screens = (options.screens || []).map(function (s) {
    // Entity-aware routing runs first (Task 13): a screen named after the
    // entity itself ("Data products", "Data product details") reaches the
    // entity's own collection or detail pattern, not whatever the raw name
    // happens to overlap. route is null when entity routing does not apply
    // (no entity, or the name is not just the entity's own words), in which
    // case the exact-label pass and the scoring below run as today.
    var route = entity ? routeEntityScreen(s.name, entity, entityPatterns) : null;
    var p = route && route.pattern ? route.pattern : null;
    if (!route) {
      p = pickPattern(s.name, appPatterns, entityPatternSlugs);
    }
    // No raw-token ranker on the no-pattern branch: an unmatched screen goes
    // straight to the keyword table (fallbackArchetype below), never to
    // patterns.selectRecipe(tokens(s.name)) -- that ranker matching on a
    // single generic word ("data") was the routing defect this task closes.
    var sel = p ? patterns.selectRecipe(patterns.patternTags(p, p.slug)) : null;
    var components = p ? uniq(p.components || []) : [];
    var archetype =
      route && !p && route.archetypeId ? loadArchetype({ archetype: route.archetypeId }) : loadArchetype(sel);
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

var USAGE = "usage: prepare-flow.js --app <app> [--entity <slug>] [--use-case <audience>] --screen-list <file> [-o <out>] | --list-entities\n";

function main(argv) {
  var args = argv.slice();
  function take(flag) { var i = args.indexOf(flag); return i !== -1 && i + 1 < args.length ? args[i + 1] : null; }
  if (args.indexOf("--list-entities") !== -1) {
    properties.listEntities().forEach(function (name) { process.stdout.write(name + "\n"); });
    return 0;
  }
  var app = take("--app"), entity = take("--entity"), list = take("--screen-list"), out = take("-o"), useCase = take("--use-case");
  if (!app || !list) { process.stderr.write(USAGE); return 1; }
  var screens;
  try {
    screens = JSON.parse(fs.readFileSync(list, "utf8")).screens || [];
  } catch (e) {
    process.stderr.write("prepare-flow: cannot read " + list + ": " + e.message + "\n");
    return 1;
  }
  var brief = prepareFlow({ app: app, entity: entity, screens: screens, useCase: useCase });
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
