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
        ["decisive", "tie", "no-match"].indexOf(p.recipe.status) !== -1,
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

  it("--app <unknown> exits 1", function () {
    assert.throws(function () {
      execFileSync(NODE, [CLI, "--app", "nope"], {
        encoding: "utf8",
        stdio: "pipe",
      });
    });
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
