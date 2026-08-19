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

function tagsWithSource(pattern, slug) {
  // normalizeTags, not a second filter of its own. Filtering on `x.length > 0`
  // here while normalizeTags TRIMMED meant a whitespace-only tag survived as
  // authored and then scored against nothing: exactly the defect this function
  // was written to close, reproduced one character over. Tags reach this file
  // straight from YAML frontmatter with no trimming in the knowledge derive, so a
  // quoted " " gets through. One normalizer, one answer.
  var authored = normalizeTags(pattern && pattern.tags);
  // Filter FIRST, then decide. Deciding on `tags.length` and filtering afterwards
  // meant `tags: ["", ""]` reported itself as authored and scored on nothing at
  // all, which is the one outcome worse than falling back.
  if (authored.length) return { tags: authored, source: "authored" };
  // Normalized on this path too, or the reported tags are not the scored tags: a
  // slug with a repeated token emits it twice while rankRecipes dedupes.
  return { tags: normalizeTags(slugTags(slug)), source: "slug" };
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
  if (recipeIndex !== undefined) {
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
    // Say so. Without this the whole point of the change inverts: losing the
    // recipe index makes every pattern report no-match, the CLI prints
    // "0 decisive, 0 weak, 0 tied, N unmatched" and exits 0, and the agent reads
    // that as "the substrate has no guidance for any of these" rather than "the
    // tool could not read its own index". This block exists so a miss stops being
    // silent; total loss was the one miss it rendered as a fact about the data.
    process.stderr.write(
      "resolve-patterns: cannot read recipes/flow/_index.json (" + e.message +
        "). Every pattern will report no-match, which is a TOOL failure, not an " +
        "absence of guidance.\n",
    );
    // Deliberately NOT cached. Caching [] on a transient read failure would make
    // every pattern in the run report no-match for the process lifetime.
    return [];
  }
  // The Array guard that validate-flow-data.js keeps and this dropped: an index
  // that parsed to an object would reach .filter and throw a TypeError out of
  // resolvePatterns, taking down the whole glossary build rather than degrading.
  if (!Array.isArray(idx)) {
    process.stderr.write(
      "resolve-patterns: recipes/flow/_index.json did not parse to an array. " +
        "Every pattern will report no-match, which is a TOOL failure, not an " +
        "absence of guidance.\n",
    );
    return [];
  }
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

// ---------------------------------------------------------------------------
// Captured page recipes: a different artefact from the flow archetypes above.
//
// An archetype is a generic shape the plugin owns. A page recipe is a shape
// COMPOSED FROM the running product and owned by the substrate, carrying
// provenance (`derivedFrom` names the surface, the capture date and the product
// build) and applicability (`when`, `apps`, `patterns`) that an archetype cannot
// have, because nobody captured it from anything.
//
// The join is DECLARED rather than scored: a recipe names the pattern(s) it
// composes, so this is a lookup and never a ranking. (One inference remains, and
// it is marked as such where it lives: `patterns` is optional in the schema, so a
// capture that omits it falls back to joining on its own slug.) That matters
// because the ranking was
// most confident exactly where it was most wrong. `faceted-browse` and
// `asset-detail-360` are the only two patterns with a capture, and both resolved
// `decisive` to a generic archetype while a capture of that literal page sat
// unread in the same vendor tree (9 instances with 3 placeholders offered in
// place of 34 with none).
// ---------------------------------------------------------------------------

// Injection seam mirrors loadRecipes: an array is used as-is, undefined reads the
// vendored tree. The directory comes from the manifest via PATHS rather than a
// literal, so moving the collection moves this with it.
var _pageRecipeCache = null;
// The degraded-read warning is emitted once per RUN. loadPageRecipes is called
// once per pattern and deliberately does not cache a failure, so without this
// Studio printed the same line 25 times, burying the one line that matters.
var _pageRecipeWarned = false;
// Whether the last unloaded read FAILED, as opposed to finding nothing. Both
// yield zero captures, and only one of them is a fact about the substrate.
var _pageRecipeDegraded = false;
function warnOnce(message) {
  if (_pageRecipeWarned) return;
  _pageRecipeWarned = true;
  process.stderr.write(message);
}
function loadPageRecipes(pageRecipeIndex) {
  if (pageRecipeIndex !== undefined) {
    return Array.isArray(pageRecipeIndex) ? pageRecipeIndex : [];
  }
  if (_pageRecipeCache) return _pageRecipeCache;
  // Three ways the manifest can drift, all of which used to escape and take the
  // whole glossary build down with them. A snapshot predating knowledge
  // v0.34.137 declares no collection at all, so PATHS.appContextRecipes is
  // undefined. resolve-paths.js returns a resolver that THROWS for a collection
  // declared `resolvable: false`, and one that returns NULL for a pattern it
  // cannot address, which then makes path.dirname throw in turn. Locating the
  // directory is therefore guarded as one operation.
  var dir;
  try {
    if (typeof PATHS.appContextRecipes !== "function") {
      throw new Error("this vendor snapshot declares no recipes collection");
    }
    var probe = PATHS.appContextRecipes("_");
    if (typeof probe !== "string" || !probe) {
      throw new Error("the recipes collection cannot address a member");
    }
    dir = path.dirname(probe);
  } catch (e) {
    _pageRecipeDegraded = true;
    warnOnce(
      "resolve-patterns: cannot locate the captured page recipes (" + e.message +
        "); none will be offered. That is a SNAPSHOT or MANIFEST problem, not " +
        "an absence of captures.\n",
    );
    return [];
  }
  var files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    // SAY SO rather than returning []: an unreadable directory and a substrate
    // with no captures both yield "no page recipe" on every pattern, and only
    // one of them is a fact about the product.
    _pageRecipeDegraded = true;
    warnOnce(
      "resolve-patterns: cannot read " + dir + " (" + e.message +
        "); no captured page recipes will be offered\n",
    );
    // Deliberately NOT cached, matching loadRecipes: caching [] on a transient
    // read failure would make every pattern report no-capture for the rest of
    // the process, turning one bad read into a fact about the substrate.
    return [];
  }
  var out = [];
  files
    .filter(function (f) {
      return /\.json$/.test(f);
    })
    .forEach(function (f) {
      try {
        out.push(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
      } catch (e) {
        process.stderr.write(
          "resolve-patterns: skipping unparseable page recipe " + f +
            " (" + e.message + ")\n",
        );
      }
    });
  _pageRecipeCache = out;
  return _pageRecipeCache;
}

// Trim + lowercase, so the pattern side of the join is compared on the same
// footing as the app side. Comparing slugs verbatim while normalizing apps meant
// a capture authoring "Faceted-Browse" joined nothing, and a library caller of
// resolvePatterns never saw the miss because only the CLI prints orphans.
function normalizeSlug(x) {
  return typeof x === "string" ? x.trim().toLowerCase() : "";
}

// Which app-context patterns a recipe composes.
// `patterns` is the declared link and wins. It is OPTIONAL in
// schemas/app-context-recipe.json while `slug` is required, so a schema-legal
// recipe that omits it still joins on its own slug instead of reaching nothing.
function patternSlugsFor(r) {
  if (!r) return [];
  var declared = (Array.isArray(r.patterns) ? r.patterns : [])
    .map(normalizeSlug)
    .filter(Boolean);
  if (declared.length) return declared;
  // FALLBACK, and it is an inference rather than a declared join: `patterns` is
  // optional in the schema while `slug` is required, so a schema-legal capture
  // that omits it would otherwise reach nothing. Named as a fallback wherever
  // this join is described, because a capture named for an unrelated pattern
  // would claim it on nothing more than a matching filename.
  return [normalizeSlug(r.slug)].filter(Boolean);
}

// The captured recipe's slug for this pattern, or null.
//
// A slug rather than the body: the manifest resolves recipes one at a time on
// purpose (a single recipe exceeds 1400 lines), so handing back a pointer keeps a
// 25-pattern answer from carrying every capture's skeleton to read one.
//
// Scoped by the recipe's own `apps`, which the schema requires: a pattern can
// live in both apps while the captured page exists in only one, and handing
// Explorer a Studio capture would be inventing a surface nobody looked at. A
// recipe listing no app matches nothing, which is what a schema-invalid recipe
// deserves; the derive validates `apps` before anything reaches dist.
function selectPageRecipe(patternSlug, app, pageRecipeIndex) {
  if (typeof patternSlug !== "string" || !patternSlug) return null;
  var key = normalizeApp(app);
  var hits = loadPageRecipes(pageRecipeIndex)
    .filter(function (r) {
      if (patternSlugsFor(r).indexOf(normalizeSlug(patternSlug)) === -1) return false;
      return (Array.isArray(r.apps) ? r.apps : []).some(function (a) {
        return normalizeApp(a) === key;
      });
    })
    .map(function (r) {
      return r && typeof r.slug === "string" ? r.slug : "";
    })
    .filter(Boolean)
    .sort();
  if (!hits.length) return null;
  // The derive validates that every patterns[] entry RESOLVES, never that a
  // pattern is claimed only ONCE, so two captures of the same shape ship green.
  // Taking the first match made readdir order decide which composition every
  // flow is built from. Sorted so the pick is stable, and reported either way:
  // this is the same defect the sibling selectRecipe was rewritten to remove,
  // where "a tie resolved to whichever recipe came first".
  if (hits.length > 1) {
    process.stderr.write(
      "resolve-patterns: " + hits.length + " captures claim pattern '" +
        patternSlug + "' for app '" + key + "' (" + hits.join(", ") +
        "); taking '" + hits[0] + "'. One shape, one capture.\n",
    );
  }
  return hits[0];
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
      if (b.score !== a.score) return b.score - a.score;
      // A TOTAL order. Returning 1 for both (a,b) and (b,a) when the archetypes
      // are equal left the order implementation-defined, and two rows for one
      // archetype (a bad merge of _index.json) then read as atTop.length > 1,
      // manufacturing a tie out of a duplicate row instead of flagging it.
      if (a.archetype === b.archetype) return 0;
      return a.archetype < b.archetype ? -1 : 1;
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
    // candidates is ALWAYS every entry at the top score, never a runners-up list.
    // It used to be ranked.slice(0, 3) here and top-scorers on a tie, so the same
    // key meant two things: a consumer told to "choose between candidates" saw,
    // on a decisive result, browse-search(4) sitting beside table-list(1) with
    // nothing marking one as the loser.
    // ONE shared tag is a coincidence, which is the whole complaint this change
    // answers; relabelling it "decisive" would just move the defect. On the
    // shipped substrate 8 of Studio's 17 sole winners rest on a single word,
    // including metamodel-designer (a split drag-drop editor) reaching
    // data-visualization on "canvas" alone. Reported as weak so the generator
    // knows to read the pattern description rather than take the archetype.
    status: top >= 2 ? "decisive" : "weak",
    candidates: atTop,
  };
}

// Capture coverage for one app: how many captures claim it, how many reached a
// pattern, and the name of each that reached none. A capture that joins nothing
// is the failure this layer exists to remove and is otherwise invisible, because
// the derive validates that a named pattern EXISTS but not that it is scoped to
// the recipe's app.
function pageRecipeReport(app, patterns, pageRecipeIndex) {
  var key = normalizeApp(app);
  var relevant = loadPageRecipes(pageRecipeIndex).filter(function (r) {
    return (Array.isArray(r && r.apps) ? r.apps : []).some(function (a) {
      return normalizeApp(a) === key;
    });
  });
  var reached = Object.create(null);
  (Array.isArray(patterns) ? patterns : []).forEach(function (p) {
    if (p && p.pageRecipe) reached[p.pageRecipe] = true;
  });
  // A capture whose slug is missing or not a string never joins and cannot be
  // named by it. Reporting the raw value printed the literal "undefined", which
  // names nothing an operator can act on.
  var rows = relevant.map(function (r, i) {
    var slug = r && typeof r.slug === "string" && r.slug ? r.slug : "";
    return {
      slug: slug,
      label: slug || "(capture #" + (i + 1) + " has no usable slug)",
    };
  });
  var orphans = rows
    .filter(function (row) {
      return !row.slug || !reached[row.slug];
    })
    .map(function (row) {
      return row.label;
    });
  return {
    captured: relevant.length,
    joined: relevant.length - orphans.length,
    orphans: orphans,
    // "0 captured" from a failed read and "0 captured" from an app with no
    // coverage printed the same line. An injected index is never degraded.
    degraded: pageRecipeIndex === undefined ? _pageRecipeDegraded : false,
  };
}

function resolvePatterns(appName, ctx, recipeIndex, pageRecipeIndex) {
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
      // The captured composition for this pattern when one exists, else null.
      // Kept BESIDE the ranked archetype rather than overwriting it: `recipe` is
      // the plugin's own guess and stays readable as such, while this is the
      // substrate's answer. Precedence is stated once, in screen-generator.md.
      pageRecipe: selectPageRecipe(slug, key, pageRecipeIndex),
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
  loadPageRecipes: loadPageRecipes,
  pageRecipeReport: pageRecipeReport,
  // Test seam: the cache is process-lifetime, and a test that swaps the vendor
  // tree underneath it would otherwise read the previous run's answer.
  _resetPageRecipeCache: function () {
    _pageRecipeCache = null;
    _pageRecipeWarned = false;
    _pageRecipeDegraded = false;
  },
  patternSlugsFor: patternSlugsFor,
  selectPageRecipe: selectPageRecipe,
};

// Thin CLI: `resolve-patterns.js --app studio` → { app, patterns, useCases }.
// Parity with resolve-chrome.js --app.
function main() {
  var args = process.argv.slice(2);
  var appIdx = args.indexOf("--app");
  if (appIdx !== -1 && args[appIdx + 1]) {
    var app = args[appIdx + 1];
    var key = normalizeApp(app);
    var known = listApps().indexOf(key) !== -1;
    var pats = resolvePatterns(app);
    // Printed for every KNOWN app, including at zero coverage. Suppressing the
    // line when the app had no capture silenced exactly the case this layer
    // exists to surface, and collapsed "no captures for this app" into the same
    // silence as "the collection could not be read at all".
    if (known) {
      var rep = pageRecipeReport(key, pats);
      process.stderr.write(
        "page recipes for " + key + ": " + rep.captured + " captured, " +
          rep.joined + " joined, " + rep.orphans.length + " joined nothing" +
          (rep.orphans.length ? " (" + rep.orphans.join(", ") + ")" : "") +
          (rep.degraded ? " [READ FAILED: this is not a fact about the substrate]" : "") +
          "\n",
      );
      pats
        .filter(function (p) {
          return p.pageRecipe;
        })
        .forEach(function (p) {
          process.stderr.write(
            "  capture  " + p.slug + " -> " + p.pageRecipe +
              " (composed from the product; outranks archetype " +
              (p.recipe.archetype || "none") + ")\n",
          );
        });
    }
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
    // The cause is a suffix on whatever line the pattern already prints, never a
    // line of its own. Folding it onto `no match` alone was half the rule: an
    // untagged pattern whose slug words happen to score still printed twice, once
    // as weak or tie and again as untagged.
    // A capture changes the answer wherever the archetype choice is uncertain,
    // so it is named on every line that prints, not only on `no match`. Both
    // shipped captures sit on `decisive` patterns, which print no line at all,
    // so the annotation was dead code where it was.
    var captured = function (p) {
      return p.pageRecipe
        ? " [captured page recipe: " + p.pageRecipe + " -- prefer it]"
        : "";
    };
    var cause = function (p) {
      return p.tagSource !== "authored" ? " [untagged: scoring on slug words]" : "";
    };
    if (ties.length || misses.length || untagged.length || weak.length) {
      process.stderr.write(
        "recipe selection for " + key + ": " + by("decisive").length + " decisive, " +
          weak.length + " weak, " + ties.length + " tied, " +
          misses.length + " unmatched\n",
      );
      weak.forEach(function (p) {
        process.stderr.write(
          "  weak     " + p.slug + " -> " + p.recipe.archetype +
            " (one shared tag; read the pattern description before taking it)" + cause(p) + "\n",
        );
      });
      ties.forEach(function (p) {
        process.stderr.write(
          "  tie      " + p.slug + " -> " +
            p.recipe.candidates
              .map(function (c) {
                return c.archetype + "(" + c.score + ")";
              })
              .join(" ") + cause(p) + "\n",
        );
      });
      misses.forEach(function (p) {
        // "no match" means no ARCHETYPE shares a tag. Once a pattern can carry a
        // capture that is no longer the same as "no guidance exists", and the
        // unannotated line would send a reader looking for a shape we already
        // hold. Reachable as soon as a capture lands on an unranked pattern.
        process.stderr.write(
          "  no match " + p.slug + cause(p) + captured(p) + "\n",
        );
      });
      // Only a pattern that printed no line above needs one of its own, which is
      // an untagged pattern that resolved decisively.
      untagged
        .filter(function (p) {
          return p.recipe.status === "decisive";
        })
        .forEach(function (p) {
          process.stderr.write(
            "  untagged " + p.slug + " -> " + p.recipe.archetype +
              " (decisive, but on slug words; author tags in the substrate)\n",
          );
        });
    }
    // NOT process.exit(). stdout is a pipe whenever the skill captures this, and
    // Node's write to a pipe is asynchronous, so exiting truncates it at the 64KB
    // buffer with exit code 0 and no diagnostic. This payload is already 22KB for
    // Studio, up 52% in this change, and it rides on pattern descriptions the
    // substrate keeps appending to. Setting the code and letting the process end
    // naturally flushes first.
    process.exitCode = known ? 0 : 1;
    return;
  }
  process.stderr.write("usage: resolve-patterns.js --app <name>\n");
  process.exitCode = 2;
}

// A function, not a bare `if` block, so the --app branch can return without
// falling through to the usage message, and without process.exit truncating the
// payload it just wrote.
if (require.main === module) main();
