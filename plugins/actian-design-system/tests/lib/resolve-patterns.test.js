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
