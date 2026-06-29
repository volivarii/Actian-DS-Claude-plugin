"use strict";

// ds-anatomy-map.test.js — Tests for the ds-anatomy-map helpers.
// Verifies: collectDsSlugs (content-shaped traversal), buildDsAnatomyMap
// (override exclusion, anatomy+binding integration, null-anatomy exclusion).

var { describe, it } = require("node:test");
var assert = require("node:assert");

var {
  buildDsAnatomyMap,
  collectDsSlugs,
} = require("../../scripts/renderers/ds-anatomy-map.js");

// Minimal anatomy data fixture (quality.ratio = 0.9, has a root node)
var GOOD_ANATOMY = {
  quality: { ratio: 0.9 },
  root: {
    kind: "container",
    layout: {
      axis: "row",
      gap: "8px",
      padding: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
    },
    children: [{ kind: "text", text: "Label" }],
  },
};

describe("collectDsSlugs", function () {
  it("collects dsSlugs from real content-shaped screens (screens[].content)", function () {
    // Real flow-data carries nodes under screens[].content, NOT .frames.
    var data = {
      screens: [
        {
          name: "Screen 1",
          content: [
            { dsSlug: "actian-data-intelligence" },
            {
              dsSlug: "card-for-items",
              children: [{ dsSlug: "avatar" }],
            },
          ],
        },
        { name: "Screen 2", content: [{ dsSlug: "spinner" }] },
      ],
    };
    var slugs = collectDsSlugs(data);
    assert.deepEqual(slugs.sort(), [
      "actian-data-intelligence",
      "avatar",
      "card-for-items",
      "spinner",
    ]);
  });

  it("dedupes slugs that appear on multiple screens/nodes", function () {
    var data = {
      screens: [
        { content: [{ dsSlug: "spinner" }, { dsSlug: "spinner" }] },
        { content: [{ dsSlug: "spinner" }] },
      ],
    };
    assert.deepEqual(collectDsSlugs(data), ["spinner"]);
  });

  it("returns [] for empty / missing data without throwing", function () {
    assert.deepEqual(collectDsSlugs(null), []);
    assert.deepEqual(collectDsSlugs({}), []);
    assert.deepEqual(collectDsSlugs({ screens: [] }), []);
    assert.deepEqual(collectDsSlugs({ screens: [{}] }), []);
  });
});

describe("buildDsAnatomyMap", function () {
  it("override slug is EXCLUDED from the map", function () {
    // 'button' is in BUILT_SLUGS → must be excluded even if anatomy loader has it
    var anatomyLoader = function (slug) {
      return GOOD_ANATOMY;
    };
    var tokenBindingsLoader = function () {
      return [];
    };
    var map = buildDsAnatomyMap(["button", "spinner"], {
      anatomyLoader: anatomyLoader,
      tokenBindingsLoader: tokenBindingsLoader,
    });
    assert.ok(!("button" in map), "override slug must be excluded from map");
    assert.ok(
      "spinner" in map,
      "non-override slug with good anatomy is included",
    );
  });

  it("non-override slug with good anatomy + token binding → map[slug] contains bound cssVar", function () {
    // Inject a fake token binding for 'spinner' to prove the binding seam is wired
    var anatomyLoader = function (slug) {
      return GOOD_ANATOMY;
    };
    var tokenBindingsLoader = function (slug) {
      if (slug === "spinner")
        return [{ token: "--zen-color-primary-500", context: "background" }];
      return [];
    };
    var map = buildDsAnatomyMap(["spinner"], {
      anatomyLoader: anatomyLoader,
      tokenBindingsLoader: tokenBindingsLoader,
    });
    assert.ok("spinner" in map, "spinner must be in map");
    assert.ok(
      map["spinner"].indexOf("background:var(--zen-color-primary-500)") !== -1,
      "map entry must contain the bound cssVar (background:var(--zen-color-primary-500))",
    );
  });

  it("non-override slug whose anatomy loader returns null → EXCLUDED from map", function () {
    var anatomyLoader = function () {
      return null;
    };
    var tokenBindingsLoader = function () {
      return [];
    };
    var map = buildDsAnatomyMap(["spinner"], {
      anatomyLoader: anatomyLoader,
      tokenBindingsLoader: tokenBindingsLoader,
    });
    assert.ok(!("spinner" in map), "null anatomy → slug excluded from map");
  });

  it("empty slug list returns empty map", function () {
    var map = buildDsAnatomyMap([], {
      anatomyLoader: function () {
        return GOOD_ANATOMY;
      },
      tokenBindingsLoader: function () {
        return [];
      },
    });
    assert.deepEqual(map, {});
  });

  it("can override BUILT_SLUGS list via opts.builtSlugs", function () {
    // With a custom builtSlugs that excludes 'spinner', spinner should be included
    var map = buildDsAnatomyMap(["spinner"], {
      builtSlugs: [],
      anatomyLoader: function () {
        return GOOD_ANATOMY;
      },
      tokenBindingsLoader: function () {
        return [];
      },
    });
    assert.ok(
      "spinner" in map,
      "spinner included when not in custom builtSlugs",
    );
  });
});
