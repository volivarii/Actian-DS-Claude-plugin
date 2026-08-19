#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var PATHS = require(path.join(__dirname, "..", "paths.js"));

// Optional injection seam (testing): `ctx` may be a pre-loaded context object
// (used as-is) or a path string. Production calls omit it → reads
// PATHS.appContext. Mirrors resolve-chrome.js loadAppContext().
function loadAppContext(ctx) {
  if (ctx && typeof ctx === "object") return ctx;
  var p = ctx && typeof ctx === "string" ? ctx : PATHS.appContext;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

function normalizeApp(appName) {
  if (typeof appName !== "string") return "";
  return appName.trim().toLowerCase();
}

// "search-filtered-table" → ["search","filtered","table"]
function slugTags(slug) {
  if (typeof slug !== "string") return [];
  return slug
    .toLowerCase()
    .split("-")
    .filter(function (t) {
      return t.length > 0;
    });
}

// A pattern's tags, authored where the substrate has them and derived from the
// slug where it does not. Splitting the slug was the ONLY source until knowledge
// #560 authored real ones, which made the join a naming coincidence: 11 of the 25
// Studio patterns shared no word with any recipe, and `faceted-browse` reached
// `table-list` and `browse-search` on the single word "browse" with nothing to
// separate them. The fallback stays for a pattern authored before tags existed.
function tagsWithSource(pattern, slug) {
  var t = (pattern && pattern.tags) || [];
  var authored = (Array.isArray(t) ? t : []).filter(function (x) {
    return typeof x === "string" && x.length > 0;
  });
  // Filter FIRST, then decide. Deciding on `tags.length` and filtering afterwards
  // meant `tags: ["", ""]` reported itself as authored and scored on nothing at
  // all, which is the one outcome worse than falling back.
  if (authored.length) return { tags: authored, source: "authored" };
  return { tags: slugTags(slug), source: "slug" };
}

function patternTags(pattern, slug) {
  return tagsWithSource(pattern, slug).tags;
}

// Recipe archetype -> tags[], mirroring loadRecipeTags in validate-flow-data.js,
// including its injection seam so a test never reads the shipped index.
var _recipeCache = null;
function loadRecipes(recipeIndex) {
  // An explicitly supplied index is used as given, and a malformed one degrades
  // the same way a malformed file does. Without the Array check on this path too,
  // the seam is only half a seam: a caller passing an object reaches .filter and
  // throws, which is the failure this guard exists to prevent on the other path.
  if (recipeIndex !== undefined && recipeIndex !== null) {
    return Array.isArray(recipeIndex) ? recipeIndex : [];
  }
  if (_recipeCache) return _recipeCache;
  var idx;
  try {
    idx = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "..", "..", "recipes", "flow", "_index.json"),
        "utf8",
      ),
    );
  } catch (e) {
    // Deliberately NOT cached. Caching [] on a transient read failure would make
    // every pattern in the run report no-match, silently, for the process
    // lifetime. Degrade for this call and let the next one try again.
    return [];
  }
  // The Array guard that validate-flow-data.js keeps and this dropped: an index
  // that parsed to an object would reach .filter and throw a TypeError out of
  // resolvePatterns, taking down the whole glossary build rather than degrading.
  if (!Array.isArray(idx)) return [];
  _recipeCache = idx;
  return _recipeCache;
}

// Compositions are a different branch of the pipeline, not a stronger recipe.
// screen-generator.md defines a single recipe as an entry WITHOUT
// `kind: composition`, and flow-data.schema.json says `matchedRecipe` is null
// when tier 2 is a composition. Ranking over them was wrong twice: it invited the
// generator to set matchedRecipe to a value the schema forbids, and because the
// two compositions carry 6 and 9 tags against 5 for every base recipe, overlap
// size favoured them on volume alone. Excluding them moves Studio from 6 ties to
// 2; four of those six were a composition sharing a single tag.
function isSelectable(r) {
  return r && r.archetype && r.kind !== "composition";
}

// Every recipe sharing at least one tag, strongest overlap first.
//
// RANKING, not intersecting. The old join asked "does this recipe share a tag",
// which is a yes/no over a set, so two recipes sharing one word each were
// indistinguishable and the caller took whichever came first. Overlap SIZE is
// what separates them: with authored tags `faceted-browse` scores browse-search 4
// and table-list 1, where the boolean join scored both 1. Ties are sorted by
// archetype so the order is stable rather than index-order, but a tie is still
// reported as a tie: a stable arbitrary pick is still arbitrary.
function normalizeTags(tags) {
  var seen = Object.create(null);
  var out = [];
  (Array.isArray(tags) ? tags : []).forEach(function (x) {
    if (typeof x !== "string") return;
    var k = x.trim().toLowerCase();
    // Normalized and deduped. Case matters because validate-flow-data.js
    // lowercases both sides of this same vocabulary, so an authored "Table"
    // would score no-match here while the validator still saw an overlap, and
    // nothing in the substrate validates tag casing. Deduped because the score
    // is an overlap COUNT: ["search","search"] would otherwise score 2 against a
    // recipe sharing one tag and beat a genuine two-tag rival.
    if (!k || seen[k]) return;
    seen[k] = true;
    out.push(k);
  });
  return out;
}

function rankRecipes(tags, recipeIndex) {
  var want = normalizeTags(tags);
  return loadRecipes(recipeIndex)
    .filter(isSelectable)
    .map(function (r) {
      var rt = normalizeTags(r.tags);
      return {
        archetype: r.archetype,
        score: want.filter(function (x) {
          return rt.indexOf(x) >= 0;
        }).length,
      };
    })
    .filter(function (r) {
      return r.score > 0;
    })
    .sort(function (a, b) {
      return b.score - a.score || (a.archetype < b.archetype ? -1 : 1);
    });
}

// The decision WITH its ambiguity, so neither a tie nor a miss can pass silently.
// Both were invisible before: a tie resolved to whichever recipe came first, and
// 11 of 25 patterns matched nothing with no warning anywhere.
function selectRecipe(tags, recipeIndex) {
  var ranked = rankRecipes(tags, recipeIndex);
  if (!ranked.length) {
    return { archetype: null, score: 0, status: "no-match", candidates: [] };
  }
  var top = ranked[0].score;
  var atTop = ranked.filter(function (r) {
    return r.score === top;
  });
  if (atTop.length > 1) {
    return { archetype: null, score: top, status: "tie", candidates: atTop };
  }
  return {
    archetype: ranked[0].archetype,
    score: top,
    // ONE shared tag is a coincidence, which is the whole complaint this change
    // answers; relabelling it "decisive" would just move the defect. On the
    // shipped substrate 8 of Studio's 17 sole winners rest on a single word,
    // including metamodel-designer (a split drag-drop editor) reaching
    // data-visualization on "canvas" alone. Reported as weak so the generator
    // knows to read the pattern description rather than take the archetype.
    status: top >= 2 ? "decisive" : "weak",
    candidates: ranked.slice(0, 3),
  };
}

function resolvePatterns(appName, ctx, recipeIndex) {
  var key = normalizeApp(appName);
  if (!key) return [];
  var data = loadAppContext(ctx);
  if (!data || !data.patterns) return [];
  var out = [];
  Object.keys(data.patterns).forEach(function (slug) {
    var p = data.patterns[slug] || {};
    var apps = Array.isArray(p.apps) ? p.apps : [];
    if (apps.indexOf(key) === -1) return;
    // One call, so the tags and the source they are labelled with cannot
    // disagree. Computing the label from its own copy of the condition is how a
    // pattern ends up reported as "authored" while scoring on slug words.
    var t = tagsWithSource(p, slug);
    out.push({
      slug: slug,
      label: p.label || "",
      description: p.description || "",
      tags: t.tags,
      // Where the tags came from, so an untagged pattern reads as a gap in the
      // substrate rather than silently scoring on its slug words.
      tagSource: t.source,
      recipe: selectRecipe(t.tags, recipeIndex),
    });
  });
  return out;
}

function resolveUseCases(appName, ctx) {
  var key = normalizeApp(appName);
  if (!key) return [];
  var data = loadAppContext(ctx);
  if (!data || !data.apps || !data.apps[key]) return [];
  var uc = data.apps[key].useCases;
  return Array.isArray(uc) ? uc : [];
}

function listApps(ctx) {
  var data = loadAppContext(ctx);
  if (!data || !data.apps) return [];
  return Object.keys(data.apps);
}

module.exports = {
  resolvePatterns: resolvePatterns,
  resolveUseCases: resolveUseCases,
  normalizeApp: normalizeApp,
  listApps: listApps,
  slugTags: slugTags,
  patternTags: patternTags,
  tagsWithSource: tagsWithSource,
  normalizeTags: normalizeTags,
  isSelectable: isSelectable,
  rankRecipes: rankRecipes,
  selectRecipe: selectRecipe,
};

// Thin CLI: `resolve-patterns.js --app studio` → { app, patterns, useCases }.
// Parity with resolve-chrome.js --app.
if (require.main === module) {
  var args = process.argv.slice(2);
  var appIdx = args.indexOf("--app");
  if (appIdx !== -1 && args[appIdx + 1]) {
    var app = args[appIdx + 1];
    var key = normalizeApp(app);
    var known = listApps().indexOf(key) !== -1;
    var pats = resolvePatterns(app);
    process.stdout.write(
      JSON.stringify(
        { app: key, patterns: pats, useCases: resolveUseCases(app) },
        null,
        2,
      ) + "\n",
    );
    // Ambiguity to stderr, so stdout stays a parseable object while a tie or a
    // miss stops being silent. Both were invisible before: a tie resolved to
    // whichever recipe came first, and 11 of 25 Studio patterns matched nothing
    // with no warning anywhere in the pipeline.
    var by = function (s) {
      return pats.filter(function (p) {
        return p.recipe.status === s;
      });
    };
    var ties = by("tie");
    var misses = by("no-match");
    var weak = by("weak");
    var untagged = pats.filter(function (p) {
      return p.tagSource !== "authored";
    });
    if (ties.length || misses.length || untagged.length || weak.length) {
      process.stderr.write(
        "recipe selection for " + key + ": " + by("decisive").length + " decisive, " +
          weak.length + " weak, " + ties.length + " tied, " +
          misses.length + " unmatched\n",
      );
      weak.forEach(function (p) {
        process.stderr.write(
          "  weak     " + p.slug + " -> " + p.recipe.archetype +
            " (one shared tag; read the pattern description before taking it)\n",
        );
      });
      ties.forEach(function (p) {
        process.stderr.write(
          "  tie      " + p.slug + " -> " +
            p.recipe.candidates
              .map(function (c) {
                return c.archetype + "(" + c.score + ")";
              })
              .join(" ") + "\n",
        );
      });
      misses.forEach(function (p) {
        process.stderr.write("  no match " + p.slug + "\n");
      });
      untagged.forEach(function (p) {
        process.stderr.write(
          "  untagged " + p.slug + " (scoring on slug words; author tags in the substrate)\n",
        );
      });
    }
    process.exit(known ? 0 : 1);
  }
  process.stderr.write("usage: resolve-patterns.js --app <name>\n");
  process.exit(2);
}
