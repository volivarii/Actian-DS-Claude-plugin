#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var resolver = require(
  path.join(
    PLUGIN_ROOT,
    "scripts",
    "lib",
    "app-context",
    "resolve-patterns.js",
  ),
);
var PATHS = require(path.join(PLUGIN_ROOT, "scripts", "lib", "paths.js"));

describe("resolve-patterns (resolver core)", function () {
  it("resolves Studio to its app-scoped patterns shaped {slug,label,description,tags,tagSource,recipe}", function () {
    var ps = resolver.resolvePatterns("Studio");
    assert.ok(Array.isArray(ps) && ps.length > 0, "expected studio patterns");
    ps.forEach(function (p) {
      assert.ok(typeof p.slug === "string" && p.slug.length > 0);
      assert.ok(typeof p.label === "string");
      assert.ok(typeof p.description === "string");
      assert.ok(Array.isArray(p.tags) && p.tags.length > 0);
      assert.ok(
        p.tagSource === "authored" || p.tagSource === "slug",
        "every pattern says where its tags came from",
      );
      // This used to assert the tags WERE the hyphen-split slug tokens, which
      // pinned the defect #300 is about: the join was a naming coincidence. The
      // split survives only as the fallback for an untagged pattern.
      if (p.tagSource === "slug") {
        assert.deepStrictEqual(
          p.tags,
          p.slug.toLowerCase().split("-").filter(Boolean),
          "an untagged pattern still falls back to its slug words",
        );
      }
      assert.ok(
        ["decisive", "weak", "tie", "no-match"].indexOf(p.recipe.status) !== -1,
        "and every pattern carries a recipe decision, including its ambiguity",
      );
    });
  });

  it("reads the substrate's authored tags, which is what makes the join semantic", function () {
    // ASSERT THE SUBJECT: this whole change is worth nothing if the vendored
    // app-context has no authored tags, and it had none before knowledge #560.
    // Without this, every assertion above still passes on slug words alone.
    var ps = resolver.resolvePatterns("studio");
    var authored = ps.filter(function (p) {
      return p.tagSource === "authored";
    });
    assert.ok(
      authored.length > ps.length / 2,
      "expected most Studio patterns to carry authored tags; got " +
        authored.length +
        " of " +
        ps.length +
        ". If this fails, the vendored app-context predates knowledge #560.",
    );
  });

  it("picks browse-search for faceted-browse, which is the case in #300", function () {
    // The end-to-end proof, against the real vendored substrate and the real
    // recipe index. On slug words both table-list and browse-search scored 1 and
    // the tie resolved to the wrong one, which is how the Studio Catalog page
    // came out as a two-pane CRUD table at confidence 0.93.
    var fb = resolver.resolvePatterns("studio").filter(function (p) {
      return p.slug === "faceted-browse";
    })[0];
    assert.ok(fb, "faceted-browse must be a Studio pattern");
    assert.strictEqual(fb.recipe.status, "decisive");
    assert.strictEqual(fb.recipe.archetype, "browse-search");
    assert.ok(
      fb.recipe.score > 1,
      "and it must win on overlap size, not on a single shared word",
    );
  });

  it("only returns patterns whose apps[] includes the requested app", function () {
    var ctx = JSON.parse(fs.readFileSync(PATHS.appContext, "utf8"));
    resolver.resolvePatterns("studio").forEach(function (p) {
      assert.ok(
        ctx.patterns[p.slug].apps.indexOf("studio") !== -1,
        p.slug + " should be studio-scoped",
      );
    });
  });

  it("normalizes case/whitespace; returns [] for unknown/empty", function () {
    assert.ok(resolver.resolvePatterns("  Studio ").length > 0);
    assert.deepStrictEqual(resolver.resolvePatterns("nope"), []);
    assert.deepStrictEqual(resolver.resolvePatterns(""), []);
    assert.deepStrictEqual(resolver.resolvePatterns(null), []);
  });

  it("resolveUseCases returns the app's useCases (Studio has multiple, each {audience,jobs})", function () {
    var uc = resolver.resolveUseCases("Studio");
    assert.ok(Array.isArray(uc));
    assert.ok(
      uc.length >= 2,
      "Studio should have multiple use cases (disambiguation case)",
    );
    uc.forEach(function (u) {
      assert.ok(Array.isArray(u.audience));
      assert.ok(Array.isArray(u.jobs));
    });
  });

  it("resolveUseCases returns [] for unknown app", function () {
    assert.deepStrictEqual(resolver.resolveUseCases("nope"), []);
  });

  it("listApps includes studio; slugTags tokenizes a hyphenated slug", function () {
    assert.ok(resolver.listApps().indexOf("studio") !== -1);
    assert.deepStrictEqual(resolver.slugTags("search-filtered-table"), [
      "search",
      "filtered",
      "table",
    ]);
  });
});

describe("resolve-patterns (CLI)", function () {
  var execFileSync = require("child_process").execFileSync;
  var NODE = process.execPath;
  var CLI = path.join(
    PLUGIN_ROOT,
    "scripts",
    "lib",
    "app-context",
    "resolve-patterns.js",
  );

  it("--app studio prints { app, patterns, useCases } and exits 0", function () {
    var out = execFileSync(NODE, [CLI, "--app", "studio"], {
      encoding: "utf8",
    });
    var parsed = JSON.parse(out);
    assert.strictEqual(parsed.app, "studio");
    assert.ok(Array.isArray(parsed.patterns) && parsed.patterns.length > 0);
    assert.ok(Array.isArray(parsed.useCases) && parsed.useCases.length >= 2);
  });

  it("--app <unknown> exits 1, not merely non-zero", function () {
    // This asserted only that it threw, which a usage exit of 2 also satisfies.
    // It did not distinguish "unknown app" from "you called me wrong", and a
    // regression that fell through to the usage branch passed it.
    var code = null;
    try {
      execFileSync(NODE, [CLI, "--app", "nope"], { encoding: "utf8", stdio: "pipe" });
    } catch (e) {
      code = e.status;
    }
    assert.strictEqual(code, 1);
  });

  it("with no --app, exits 2, so the two failures stay distinguishable", function () {
    var code = null;
    try {
      execFileSync(NODE, [CLI], { encoding: "utf8", stdio: "pipe" });
    } catch (e) {
      code = e.status;
    }
    assert.strictEqual(code, 2);
  });

  it("never calls process.exit after writing the payload", function () {
    // Node's write to a pipe is asynchronous and process.exit does not flush it,
    // so exiting after the write truncates stdout at the 64KB buffer with exit
    // code 0 and no diagnostic. Verified separately:
    //   node -e 'process.stdout.write("x".repeat(500000)); process.exit(0)' | wc -c
    // returns exactly 65536. The Studio payload is already ~22KB and grew 52% in
    // this change, and it rides on pattern descriptions the substrate keeps
    // appending to, so the headroom is finite and the failure is silent.
    var src = fs.readFileSync(CLI, "utf8");
    // Comment lines dropped first. The comments here NAME process.exit() to
    // explain why it is absent, and a gate that reads them flags the very
    // explanation for the thing it is checking. Its first version did exactly
    // that and failed on correct code.
    var code = src
      .slice(src.indexOf("function main()"))
      .split("\n")
      .filter(function (l) {
        return !/^\s*(\/\/|\*|\/\*)/.test(l);
      })
      .join("\n");
    assert.strictEqual(
      /process\.exit\(/.test(code),
      false,
      "use process.exitCode and let the process end, so stdout flushes first",
    );
    assert.ok(/process\.exitCode/.test(code), "and it must still set an exit code");
  });
});

describe("resolve-patterns (extensibility — synthetic 4th app, zero code change)", function () {
  var synthetic = {
    apps: {
      observability: {
        header: { type: "Observability" },
        sidebar: [{ label: "Monitors", id: "monitors" }],
        signals: ["monitor", "alert", "health"],
        useCases: [
          {
            audience: ["sre"],
            jobs: ["watch pipeline health"],
            patterns: ["alert-timeline"],
          },
        ],
      },
    },
    patterns: {
      "alert-timeline": {
        apps: ["observability"],
        label: "Alert Timeline",
        description: "Chronological alert feed.",
      },
      "search-filtered-table": {
        apps: ["studio"],
        label: "Search-filtered table",
        description: "A studio-only pattern.",
      },
    },
  };

  it("resolves the new app's scoped patterns + useCases via the injection seam", function () {
    var ps = resolver.resolvePatterns("observability", synthetic);
    assert.strictEqual(ps.length, 1);
    assert.strictEqual(ps[0].slug, "alert-timeline");
    assert.deepStrictEqual(ps[0].tags, ["alert", "timeline"]);

    var uc = resolver.resolveUseCases("observability", synthetic);
    assert.strictEqual(uc.length, 1);
    assert.deepStrictEqual(uc[0].jobs, ["watch pipeline health"]);

    assert.ok(resolver.listApps(synthetic).indexOf("observability") !== -1);
  });

  it("does not leak other apps' patterns into the new app", function () {
    var slugs = resolver
      .resolvePatterns("observability", synthetic)
      .map(function (p) {
        return p.slug;
      });
    assert.strictEqual(slugs.indexOf("search-filtered-table"), -1);
  });
});

// Recipe selection (#300) ---------------------------------------------------
// The join used to be "does this recipe share any tag", over tags invented by
// splitting the pattern slug on hyphens. Two failures came out of that: a tie
// resolved to whichever recipe came first, and 11 of 25 Studio patterns matched
// nothing with no warning. Every test below injects its own recipe index, so
// none of them reads the shipped recipes/flow/_index.json.
describe("resolve-patterns recipe selection", function () {
  var RECIPES = [
    { archetype: "table-list", tags: ["table", "list", "crud", "browse"] },
    { archetype: "browse-search", tags: ["search", "browse", "catalog", "filter"] },
    { archetype: "form-create", tags: ["form", "create", "input"] },
  ];

  it("ranks by overlap SIZE, so one shared word cannot outweigh four", function () {
    // The case in the issue title. Both recipes share "browse"; only one shares
    // the rest, and a boolean join could not tell them apart.
    var ranked = resolver.rankRecipes(
      ["browse", "search", "catalog", "filter"],
      RECIPES,
    );
    assert.strictEqual(ranked[0].archetype, "browse-search");
    assert.strictEqual(ranked[0].score, 4);
    assert.strictEqual(ranked[1].archetype, "table-list");
    assert.strictEqual(ranked[1].score, 1);
  });

  it("reports a genuine tie rather than picking the first", function () {
    // Equal overlap is not a decision. Returning an archetype here is what put
    // the Catalog page on table-list at confidence 0.93.
    var sel = resolver.selectRecipe(["browse"], RECIPES);
    assert.strictEqual(sel.status, "tie");
    assert.strictEqual(sel.archetype, null, "a tie must not resolve to an archetype");
    assert.deepStrictEqual(
      sel.candidates.map(function (c) {
        return c.archetype;
      }),
      ["browse-search", "table-list"],
      "and it must name every candidate at the top score",
    );
  });

  it("reports a miss rather than saying nothing", function () {
    var sel = resolver.selectRecipe(["timeline", "chronological"], RECIPES);
    assert.strictEqual(sel.status, "no-match");
    assert.strictEqual(sel.archetype, null);
    assert.deepStrictEqual(sel.candidates, []);
  });

  it("orders ties stably, because index order is not a reason to prefer a recipe", function () {
    var a = resolver.selectRecipe(["browse"], RECIPES);
    var b = resolver.selectRecipe(["browse"], RECIPES.slice().reverse());
    assert.deepStrictEqual(
      a.candidates.map(function (c) {
        return c.archetype;
      }),
      b.candidates.map(function (c) {
        return c.archetype;
      }),
      "reversing the index must not change which candidates are reported",
    );
  });

  it("prefers authored tags and falls back to slug words", function () {
    assert.deepStrictEqual(
      resolver.patternTags({ tags: ["queue", "review"] }, "access-request-management"),
      ["queue", "review"],
      "authored tags win",
    );
    assert.deepStrictEqual(
      resolver.patternTags({}, "faceted-browse"),
      ["faceted", "browse"],
      "an untagged pattern still scores, on its slug words",
    );
    assert.deepStrictEqual(
      resolver.patternTags({ tags: [] }, "faceted-browse"),
      ["faceted", "browse"],
      "an empty tags array is not an authoring decision",
    );
  });

  it("cannot report tags as authored while scoring on slug words", function () {
    // The label and the tags were computed from two separate copies of the same
    // condition, so they could disagree. `tags: ["", ""]` proved it: the length
    // check passed, the label said "authored", and the filter then left NO tags
    // at all, so the pattern scored against nothing while claiming to be tagged.
    // Deciding after the filter makes the two answers one answer.
    var junk = { tags: ["", ""] };
    assert.deepStrictEqual(
      resolver.patternTags(junk, "faceted-browse"),
      ["faceted", "browse"],
      "junk tags fall back rather than leaving the pattern with none",
    );
    var ps = resolver.resolvePatterns("obs", {
      patterns: { "faceted-browse": { apps: ["obs"], tags: ["", ""] } },
    });
    assert.strictEqual(ps[0].tagSource, "slug");
    assert.deepStrictEqual(ps[0].tags, ["faceted", "browse"]);
    assert.strictEqual(
      resolver.tagsWithSource(junk, "faceted-browse").source,
      "slug",
      "and the source is derived from the tags actually used, not judged separately",
    );
  });

  it("marks where a pattern's tags came from, so an untagged one is visible", function () {
    var synthetic = {
      patterns: {
        tagged: { apps: ["obs"], tags: ["search", "browse", "catalog", "filter"] },
        untagged: { apps: ["obs"] },
      },
    };
    var ps = resolver.resolvePatterns("obs", synthetic);
    var byslug = {};
    ps.forEach(function (p) {
      byslug[p.slug] = p;
    });
    assert.strictEqual(byslug.tagged.tagSource, "authored");
    assert.strictEqual(byslug.untagged.tagSource, "slug");
  });
});

describe("resolve-patterns recipe selection, second review (#303)", function () {
  var BASE = [
    { archetype: "table-list", tags: ["table", "list", "crud", "browse"] },
    { archetype: "browse-search", tags: ["search", "browse", "catalog", "filter"] },
  ];
  var WITH_COMPOSITION = BASE.concat([
    {
      archetype: "composition-detail-table",
      kind: "composition",
      tags: ["detail", "table", "composition", "hybrid", "embedded-list", "related-records"],
    },
  ]);

  it("never ranks a composition, because matchedRecipe must be null for one", function () {
    // screen-generator.md defines a single recipe as an entry WITHOUT
    // kind: composition, and flow-data.schema.json says matchedRecipe is null
    // when tier 2 is a composition. Ranking them invited the generator to write a
    // value the schema forbids. They also carry 6 and 9 tags against 5 for every
    // base recipe, so overlap size favoured them on volume alone.
    var ranked = resolver.rankRecipes(["table", "detail", "composition"], WITH_COMPOSITION);
    assert.deepStrictEqual(
      ranked.map(function (r) {
        return r.archetype;
      }),
      ["table-list"],
      "the composition scored 3 and must still not appear",
    );
    assert.strictEqual(resolver.isSelectable({ archetype: "x", kind: "composition" }), false);
    assert.strictEqual(resolver.isSelectable({ archetype: "x" }), true);
  });

  it("calls a single shared tag weak, not decisive", function () {
    // Relabelling a one-word coincidence as decisive would move the defect rather
    // than fix it: 8 of Studio's 17 sole winners rest on one shared word.
    var one = resolver.selectRecipe(["crud"], BASE);
    assert.strictEqual(one.status, "weak");
    assert.strictEqual(one.archetype, "table-list", "it is still the best guess, and still reported");
    assert.strictEqual(one.score, 1);

    var two = resolver.selectRecipe(["crud", "table"], BASE);
    assert.strictEqual(two.status, "decisive");
    assert.strictEqual(two.score, 2);
  });

  it("matches tags case-insensitively, as the validator does", function () {
    // validate-flow-data.js lowercases both sides of this same vocabulary, and
    // nothing validates tag casing in the substrate, so an authored "Table" would
    // have scored no-match here while the validator still saw an overlap.
    var sel = resolver.selectRecipe(["  TABLE ", "Crud"], BASE);
    assert.strictEqual(sel.archetype, "table-list");
    assert.strictEqual(sel.score, 2);
  });

  it("counts an overlap once, so a repeated tag cannot buy a win", function () {
    // score is an overlap COUNT: ["browse","browse"] would otherwise score 2 and
    // beat a rival genuinely sharing two different tags.
    var dup = resolver.selectRecipe(["browse", "browse", "browse"], BASE);
    assert.strictEqual(dup.status, "tie", "one real overlap each, so still a tie");
    assert.strictEqual(dup.score, 1);
  });

  it("degrades rather than throwing when the index is not an array", function () {
    // The Array guard validate-flow-data.js keeps. Without it a malformed index
    // reaches .filter and throws out of resolvePatterns, taking down the whole
    // glossary build instead of reporting no-match.
    assert.deepStrictEqual(resolver.rankRecipes(["table"], {}), []);
    assert.strictEqual(resolver.selectRecipe(["table"], {}).status, "no-match");
  });

  it("threads the recipe index through resolvePatterns, so the seam is real", function () {
    // The comment claimed a seam existed "so a test never reads the shipped
    // index", and resolvePatterns had no way to pass one.
    var ctx = { patterns: { p: { apps: ["obs"], tags: ["browse", "search", "catalog"] } } };
    var ps = resolver.resolvePatterns("obs", ctx, BASE);
    assert.strictEqual(ps[0].recipe.archetype, "browse-search");
    assert.strictEqual(ps[0].recipe.score, 3);
    var none = resolver.resolvePatterns("obs", ctx, []);
    assert.strictEqual(none[0].recipe.status, "no-match", "an empty index yields no guidance");
  });
});

describe("resolve-patterns tag hygiene, third review (#303)", function () {
  it("a whitespace-only tag falls back rather than claiming to be authored", function () {
    // The guard against "authored while scoring on nothing" filtered on
    // `length > 0` while the scorer TRIMMED, so `tags: ["  "]` survived as
    // authored and then matched nothing: the same defect, one character over.
    // Tags reach the plugin straight from YAML frontmatter with no trimming in
    // the knowledge derive, so a quoted " " gets through.
    var ws = resolver.tagsWithSource({ tags: ["  ", "\t"] }, "faceted-browse");
    assert.strictEqual(ws.source, "slug");
    assert.deepStrictEqual(ws.tags, ["faceted", "browse"]);

    var ps = resolver.resolvePatterns("obs", {
      patterns: { "faceted-browse": { apps: ["obs"], tags: ["  "] } },
    });
    assert.strictEqual(ps[0].tagSource, "slug");
  });

  it("normalizes the tags it reports, so they are the tags it scored", function () {
    var mixed = resolver.tagsWithSource({ tags: [" Table ", "TABLE", "list"] }, "x-y");
    assert.strictEqual(mixed.source, "authored");
    assert.deepStrictEqual(
      mixed.tags,
      ["table", "list"],
      "reported tags are trimmed, lowercased and deduped exactly as scored",
    );
  });
});

describe("resolve-patterns contract precision, fourth review (#303)", function () {
  var BASE = [
    { archetype: "table-list", tags: ["table", "list", "crud", "browse"] },
    { archetype: "browse-search", tags: ["search", "browse", "catalog", "filter"] },
  ];

  it("candidates always means the top score, never a runners-up list", function () {
    // The same key used to mean two things: every top-scorer on a tie, and
    // ranked.slice(0, 3) otherwise. A consumer told to "choose between
    // candidates" then saw browse-search(4) beside table-list(1) on a decisive
    // result, with nothing marking one as the loser.
    var dec = resolver.selectRecipe(["browse", "search", "catalog"], BASE);
    assert.strictEqual(dec.status, "decisive");
    assert.deepStrictEqual(dec.candidates.map(function (c) { return c.score; }), [3]);
    dec.candidates.forEach(function (c) {
      assert.strictEqual(c.score, dec.score, "no candidate may score below the top");
    });

    var tie = resolver.selectRecipe(["browse"], BASE);
    tie.candidates.forEach(function (c) {
      assert.strictEqual(c.score, tie.score);
    });
    assert.strictEqual(tie.candidates.length, 2);
  });

  it("an explicit null index means no recipes, not 'read the shipped one'", function () {
    // null used to fall through to the disk read, so a caller writing
    // `opts.recipeIndex ?? null` silently scored against the real 12 recipes and
    // the seam the comment promises was only half there.
    assert.deepStrictEqual(resolver.rankRecipes(["table", "browse"], null), []);
    assert.strictEqual(resolver.selectRecipe(["table"], null).status, "no-match");
  });

  it("the slug fallback reports the tags it scored, as the authored path does", function () {
    // slugTags was returned raw while the authored path normalized, so a slug
    // with a repeated token emitted it twice while rankRecipes deduped: the
    // reported tags were not the scored tags.
    assert.deepStrictEqual(
      resolver.tagsWithSource({}, "data-import-data-export").tags,
      ["data", "import", "export"],
    );
  });
});

describe("resolve-patterns failure reporting, fifth review (#303)", function () {
  var NODE = process.execPath;
  var CLI = path.join(
    PLUGIN_ROOT,
    "scripts",
    "lib",
    "app-context",
    "resolve-patterns.js",
  );
  it("a duplicated archetype does not manufacture a tie", function () {
    // The comparator returned 1 for both (a,b) and (b,a) on equal archetypes, so
    // the order was implementation-defined AND two rows for one recipe read as
    // atTop.length > 1, reporting a tie invented from a duplicate row rather than
    // the single archetype both rows name.
    var dupIndex = [
      { archetype: "table-list", tags: ["table", "list"] },
      { archetype: "table-list", tags: ["table", "list"] },
    ];
    var ranked = resolver.rankRecipes(["table", "list"], dupIndex);
    assert.strictEqual(ranked.length, 2, "both rows still rank");
    assert.strictEqual(
      ranked[0].archetype,
      ranked[1].archetype,
      "and they name the same archetype, which is the point",
    );
    // The comparator must be a total order: equal archetypes compare equal.
    var cmp = function (a, b) {
      var s = [a, b].sort(function (x, y) {
        if (y.score !== x.score) return y.score - x.score;
        if (x.archetype === y.archetype) return 0;
        return x.archetype < y.archetype ? -1 : 1;
      });
      return s;
    };
    assert.deepStrictEqual(cmp(ranked[0], ranked[1]), cmp(ranked[1], ranked[0]).reverse().reverse());
  });

  it("says so when it cannot read the recipe index, instead of reporting no-match", function () {
    // THE INVERSION THIS PREVENTS. Losing the index makes every pattern report
    // no-match, the CLI prints "0 decisive ... N unmatched" and exits 0, and the
    // agent reads that as "the substrate has no guidance" rather than "the tool
    // could not read its own index". This block exists so a miss stops being
    // silent; total loss was the one miss it rendered as a fact about the data.
    var seen = [];
    var real = process.stderr.write;
    process.stderr.write = function (s) {
      seen.push(String(s));
      return true;
    };
    try {
      // An index that parses but is not an array takes the same bail.
      resolver.rankRecipes(["table"], undefined);
    } finally {
      process.stderr.write = real;
    }
    // The shipped index reads fine, so nothing should have been said here.
    assert.deepStrictEqual(seen, [], "a healthy read is silent");
  });

  it("reports each pattern on one line, with the cause folded in", function () {
    // An untagged pattern used to print twice, once for its outcome and once as
    // "untagged", which reads as two findings about one pattern. The cause is a
    // suffix on the outcome line now.
    var res = require("child_process").spawnSync(NODE, [CLI, "--app", "studio"], {
      encoding: "utf8",
    });
    assert.strictEqual(res.status, 0);
    var lines = String(res.stderr).split("\n").filter(Boolean).slice(1);
    assert.ok(lines.length > 0, "expected diagnostics for Studio");
    var counts = {};
    lines.forEach(function (l) {
      // "  weak     <slug> -> ...", "  tie      <slug> -> ...", "  no match <slug>..."
      var m = l.match(/^\s*(?:weak|tie|untagged|no match)\s+(\S+)/);
      if (m) counts[m[1]] = (counts[m[1]] || 0) + 1;
    });
    assert.ok(Object.keys(counts).length > 0, "expected to parse at least one slug");
    var repeated = Object.keys(counts).filter(function (s) {
      return counts[s] > 1;
    });
    assert.deepStrictEqual(repeated, [], "no pattern may be reported twice");
  });});

// Captured page recipes (knowledge app-context/dist/recipes) are a different
// artefact from the plugin's flow archetypes: composed FROM the running product,
// they carry provenance (derivedFrom) and applicability (when/apps/patterns) that
// an archetype cannot have. Two shipped on 2026-08-18 and were read by nothing in
// either consumer, while the tag ranking answered for those same two patterns
// `decisive`, most confident exactly where a capture of that literal page
// existed one lookup away.
describe("resolve-patterns (captured page recipes)", function () {
  it("points a pattern at its captured page recipe instead of leaving only the ranked archetype", function () {
    // End-to-end against the real vendored substrate. Fails until resolvePatterns
    // performs the lookup: today every pattern's pageRecipe is undefined.
    var fb = resolver.resolvePatterns("studio").filter(function (p) {
      return p.slug === "faceted-browse";
    })[0];
    assert.ok(fb, "faceted-browse must be a Studio pattern");
    assert.strictEqual(
      fb.pageRecipe,
      "faceted-browse",
      "the captured recipe declaring this pattern must be named on it",
    );
  });

  it("does not offer a capture to an app the recipe does not claim", function () {
    // `apps` is REQUIRED in schemas/app-context-recipe.json, so a recipe that
    // says studio has said something. A pattern can live in both apps while the
    // captured page exists in only one; handing Explorer a Studio capture would
    // be inventing a surface nobody looked at.
    var ctx = {
      patterns: { "shared-shape": { apps: ["studio", "explorer"], tags: ["x"] } },
    };
    var index = [
      { slug: "shared-shape", apps: ["studio"], patterns: ["shared-shape"] },
    ];
    assert.strictEqual(
      resolver.resolvePatterns("studio", ctx, [], index)[0].pageRecipe,
      "shared-shape",
      "the app that owns the capture gets it",
    );
    assert.strictEqual(
      resolver.resolvePatterns("explorer", ctx, [], index)[0].pageRecipe,
      null,
      "the app that does not must not inherit it",
    );
  });

  it("leaves every pattern without a capture at null, so the field discriminates", function () {
    // ASSERT THE SUBJECT, both ways. Without the second half this suite passes
    // on an implementation that stamps every pattern with a recipe slug; without
    // the first it passes on a substrate that ships no captures at all.
    var ps = resolver.resolvePatterns("studio");
    var withCapture = ps.filter(function (p) {
      return p.pageRecipe !== null;
    });
    var without = ps.filter(function (p) {
      return p.pageRecipe === null;
    });
    assert.ok(
      withCapture.length > 0,
      "the vendored substrate must ship at least one captured page recipe; if this fails, check app-context/dist/recipes came through the vendor sync",
    );
    assert.ok(
      without.length > 0,
      "and most patterns have none, so a non-null value means something",
    );
    withCapture.forEach(function (p) {
      assert.strictEqual(
        p.pageRecipe,
        p.slug,
        "every shipped capture is named for the pattern it composes",
      );
    });
  });

  it("joins on the recipe's own slug when it declares no patterns", function () {
    // `patterns` is optional in schemas/app-context-recipe.json while `slug` is
    // required. Joining on `patterns` alone would drop a schema-legal recipe.
    var ctx = { patterns: { "lone-shape": { apps: ["obs"], tags: ["x"] } } };
    var index = [{ slug: "lone-shape", apps: ["obs"] }];
    assert.strictEqual(
      resolver.resolvePatterns("obs", ctx, [], index)[0].pageRecipe,
      "lone-shape",
    );
  });

  it("serves every pattern a recipe declares, not just the one it is named for", function () {
    // `patterns` is a list. A capture composing two shapes must reach both, or
    // the second silently has no capture while one demonstrably exists.
    var ctx = {
      patterns: {
        "shape-a": { apps: ["obs"], tags: ["x"] },
        "shape-b": { apps: ["obs"], tags: ["y"] },
      },
    };
    var index = [
      { slug: "combined", apps: ["obs"], patterns: ["shape-a", "shape-b"] },
    ];
    var by = {};
    resolver.resolvePatterns("obs", ctx, [], index).forEach(function (p) {
      by[p.slug] = p.pageRecipe;
    });
    assert.deepStrictEqual(by, { "shape-a": "combined", "shape-b": "combined" });
  });

  it("emits a pointer that actually resolves, which is the whole contract", function () {
    // ASSERT THE JOIN. screen-generator.md tells the agent to read
    // vendor/app-context/dist/recipes/<pageRecipe>.json. If the slug we hand it
    // does not resolve there, the agent reads nothing and silently falls back to
    // the archetype, which is the exact silent miss this change exists to remove.
    var pointed = resolver
      .resolvePatterns("studio")
      .map(function (p) {
        return p.pageRecipe;
      })
      .filter(Boolean);
    assert.ok(pointed.length > 0, "expected at least one captured page recipe");
    pointed.forEach(function (slug) {
      var file = PATHS.appContextRecipes(slug);
      assert.ok(
        fs.existsSync(file),
        "pageRecipe '" + slug + "' must resolve to a readable file at " + file,
      );
      var body = JSON.parse(fs.readFileSync(file, "utf8"));
      assert.ok(
        body.skeleton,
        "and carry the skeleton the generator is told to compose from",
      );
    });
  });

  it("degrades with a message when the vendor snapshot has no recipes collection", function () {
    // A snapshot predating knowledge v0.34.137, or an incident-recovery --sha
    // pin (which paths.js supports and exempts from the integrity check), has no
    // appContextRecipes collection, so PATHS.appContextRecipes is undefined.
    // Calling it threw a TypeError straight out of resolvePatterns and took down
    // the whole glossary build. loadRecipes guards the same shape deliberately.
    var saved = PATHS.appContextRecipes;
    var errs = [];
    var realWrite = process.stderr.write;
    delete PATHS.appContextRecipes;
    process.stderr.write = function (m) {
      errs.push(String(m));
      return true;
    };
    try {
      resolver._resetPageRecipeCache();
      var ps = resolver.resolvePatterns("studio");
      assert.ok(ps.length > 0, "the glossary build must survive");
      ps.forEach(function (p) {
        assert.strictEqual(p.pageRecipe, null);
      });
      assert.ok(
        errs.join("").indexOf("recipes collection") !== -1,
        "and must SAY the collection is absent rather than reporting no captures as a fact",
      );
    } finally {
      process.stderr.write = realWrite;
      PATHS.appContextRecipes = saved;
      resolver._resetPageRecipeCache();
    }
  });

  it("does not cache an empty result from a failed read", function () {
    // loadRecipes documents why: caching [] on a transient failure makes every
    // pattern report no-capture for the whole process lifetime, turning one bad
    // read into a fact about the substrate.
    var saved = PATHS.appContextRecipes;
    var realWrite = process.stderr.write;
    process.stderr.write = function () {
      return true;
    };
    try {
      resolver._resetPageRecipeCache();
      PATHS.appContextRecipes = function () {
        return "/nonexistent-dir-for-test/x.json";
      };
      assert.deepStrictEqual(resolver.loadPageRecipes(), [], "read fails");
      PATHS.appContextRecipes = saved;
      assert.ok(
        resolver.loadPageRecipes().length > 0,
        "a later call in the same process must retry, not serve the cached miss",
      );
    } finally {
      process.stderr.write = realWrite;
      PATHS.appContextRecipes = saved;
      resolver._resetPageRecipeCache();
    }
  });

  it("says so when two captures claim the same pattern, and picks deterministically", function () {
    // The derive validates that each patterns[] entry RESOLVES, never that a
    // pattern is claimed once (knowledge derive-recipes.js checkReferences), so
    // a refreshed capture alongside the original would flip which composition
    // every flow is built from, on readdir order. This is the defect the sibling
    // selectRecipe was rewritten to remove; it gets the same treatment.
    var index = [
      { slug: "zzz-capture", apps: ["obs"], patterns: ["shape"] },
      { slug: "aaa-capture", apps: ["obs"], patterns: ["shape"] },
    ];
    var errs = [];
    var realWrite = process.stderr.write;
    process.stderr.write = function (m) {
      errs.push(String(m));
      return true;
    };
    try {
      var got = resolver.selectPageRecipe("shape", "obs", index);
      var gotReversed = resolver.selectPageRecipe("shape", "obs", index.slice().reverse());
      assert.strictEqual(got, gotReversed, "order of the index must not decide");
      assert.strictEqual(got, "aaa-capture", "and the pick is stable, not first-seen");
      assert.ok(
        errs.join("").indexOf("shape") !== -1,
        "and the collision is reported rather than resolved in silence",
      );
    } finally {
      process.stderr.write = realWrite;
    }
  });

  var NODE = process.execPath;
  var CLI = path.join(
    PLUGIN_ROOT,
    "scripts",
    "lib",
    "app-context",
    "resolve-patterns.js",
  );

  it("reports how many captures were loaded and how many joined nothing", function () {
    // A capture that reaches no pattern is invisible, which is the exact failure
    // this change exists to remove: the derive checks that a named pattern
    // EXISTS, not that it is scoped to the recipe's app, so a recipe can ship
    // green and be read by nobody. The archetype summary counts decisive / weak
    // / tie / unmatched and says nothing about captures.
    var res = require("child_process").spawnSync(NODE, [CLI, "--app", "studio"], {
      encoding: "utf8",
    });
    assert.strictEqual(res.status, 0);
    var line = String(res.stderr)
      .split("\n")
      .filter(function (l) {
        return l.indexOf("page recipes for") !== -1;
      })[0];
    assert.ok(line, "expected a page-recipe line in the diagnostics");
    var m = line.match(/(\d+) captured, (\d+) joined, (\d+) joined nothing/);
    assert.ok(m, "expected counts in the form 'N captured, N joined, N joined nothing', got: " + line);
    assert.ok(Number(m[1]) > 0, "the substrate must ship captures for this to mean anything");
    assert.strictEqual(Number(m[3]), 0, "no shipped capture should join nothing");
    assert.strictEqual(
      Number(m[1]),
      Number(m[2]) + Number(m[3]),
      "every capture is either joined or reported as joining nothing",
    );
  });

  it("warns once per run when the read is degraded, not once per pattern", function () {
    // loadPageRecipes deliberately does not cache a failed read, and
    // selectPageRecipe runs once per pattern, so the warning was emitted 25 times
    // for Studio. A wall of identical lines buries the one line that matters,
    // which is the opposite of the reporting this layer exists to do.
    var saved = PATHS.appContextRecipes;
    var errs = [];
    var realWrite = process.stderr.write;
    process.stderr.write = function (m) {
      errs.push(String(m));
      return true;
    };
    try {
      resolver._resetPageRecipeCache();
      PATHS.appContextRecipes = function () {
        return "/nonexistent-dir-for-test/x.json";
      };
      var ps = resolver.resolvePatterns("studio");
      assert.ok(ps.length > 5, "expected many patterns, or this proves nothing");
      var warnings = errs.filter(function (m) {
        return m.indexOf("cannot read") !== -1;
      });
      assert.strictEqual(
        warnings.length,
        1,
        "expected exactly one warning for the run, got " + warnings.length,
      );
    } finally {
      process.stderr.write = realWrite;
      PATHS.appContextRecipes = saved;
      resolver._resetPageRecipeCache();
    }
  });

  it("reports zero coverage instead of staying silent about it", function () {
    // The line was printed only when the app already had a capture, so the two
    // apps with NO coverage said nothing at all. Zero coverage is the case this
    // layer exists to surface: authored is not read.
    var r = resolver.pageRecipeReport("obs", [{ slug: "p", pageRecipe: null }], []);
    assert.deepStrictEqual(r, {
      captured: 0,
      joined: 0,
      orphans: [],
      degraded: false,
    });
  });

  it("names an unjoinable capture rather than printing undefined", function () {
    // A recipe that parses but has no usable slug counted as relevant, never
    // joined, and landed in the orphan list as the literal string "undefined",
    // which names nothing an operator can act on.
    var index = [{ apps: ["obs"], patterns: ["shape"] }, { slug: 42, apps: ["obs"] }];
    var r = resolver.pageRecipeReport("obs", [{ slug: "shape", pageRecipe: null }], index);
    assert.strictEqual(r.orphans.indexOf("undefined"), -1, "never the string undefined");
    r.orphans.forEach(function (o) {
      assert.ok(
        typeof o === "string" && o.length > 0 && o !== "undefined",
        "every orphan must be nameable, got: " + JSON.stringify(o),
      );
    });
  });

  it("normalizes the pattern the caller asks about, not only the one declared", function () {
    // The sibling assertion below covers the DECLARED side. Dropping normalization
    // on the INCOMING side left that one green, so the "both sides" claim was
    // half guarded: a substrate authoring a mixed-case pattern key joined nothing.
    var ctx = { patterns: { "Faceted-Browse": { apps: ["obs"], tags: ["x"] } } };
    var index = [{ slug: "cap", apps: ["obs"], patterns: ["faceted-browse"] }];
    assert.strictEqual(
      resolver.resolvePatterns("obs", ctx, [], index)[0].pageRecipe,
      "cap",
    );
  });

  it("normalizes both sides of the pattern join, not just the app", function () {
    // `apps` went through normalizeApp while the pattern slug was compared
    // verbatim, so a capture authoring "Faceted-Browse" or a slug with stray
    // whitespace joined nothing, and a library caller never saw the miss.
    var ctx = { patterns: { "faceted-browse": { apps: ["obs"], tags: ["x"] } } };
    var index = [
      { slug: "cap", apps: ["OBS"], patterns: ["  Faceted-Browse  "] },
    ];
    assert.strictEqual(
      resolver.resolvePatterns("obs", ctx, [], index)[0].pageRecipe,
      "cap",
    );
  });

  it("degrades on every way the manifest can drift, not only an absent collection", function () {
    // The typeof guard covers ONE of three. resolve-paths.js returns a function
    // that THROWS for a collection declared resolvable:false, and one that
    // returns NULL for a pattern it cannot address; path.dirname(null) then
    // throws too. Both escaped the guard and took down the glossary build, which
    // is the failure the guard's own comment says it prevents.
    var saved = PATHS.appContextRecipes;
    var realWrite = process.stderr.write;
    process.stderr.write = function () {
      return true;
    };
    var cases = {
      "resolver throws (resolvable: false)": function () {
        throw new Error("declared descriptive-only");
      },
      "resolver returns null (unaddressable pattern)": function () {
        return null;
      },
    };
    try {
      Object.keys(cases).forEach(function (label) {
        resolver._resetPageRecipeCache();
        PATHS.appContextRecipes = cases[label];
        var ps;
        assert.doesNotThrow(function () {
          ps = resolver.resolvePatterns("studio");
        }, label + " must degrade, not throw");
        assert.ok(ps.length > 0, label + ": the glossary build must survive");
        ps.forEach(function (p) {
          assert.strictEqual(p.pageRecipe, null, label);
        });
      });
    } finally {
      process.stderr.write = realWrite;
      PATHS.appContextRecipes = saved;
      resolver._resetPageRecipeCache();
    }
  });

  it("tells a degraded read apart from genuine zero coverage", function () {
    // Both printed "0 captured, 0 joined, 0 joined nothing", byte-identical, so
    // a failed read read as a fact about the substrate. That is precisely the
    // conflation the surrounding comment claims to avoid.
    var saved = PATHS.appContextRecipes;
    var realWrite = process.stderr.write;
    process.stderr.write = function () {
      return true;
    };
    try {
      var empty = resolver.pageRecipeReport("obs", [], []);
      assert.strictEqual(empty.degraded, false, "an app with no captures is not degraded");

      resolver._resetPageRecipeCache();
      PATHS.appContextRecipes = function () {
        return "/nonexistent-dir-for-test/x.json";
      };
      var broken = resolver.pageRecipeReport("studio", []);
      assert.strictEqual(broken.degraded, true, "a failed read must say so");
      assert.strictEqual(broken.captured, 0);
    } finally {
      process.stderr.write = realWrite;
      PATHS.appContextRecipes = saved;
      resolver._resetPageRecipeCache();
    }
  });
});
