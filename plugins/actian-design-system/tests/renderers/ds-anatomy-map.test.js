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
    id: "9:1",
    layout: {
      axis: "row",
      gap: "8px",
      padding: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
    },
    children: [{ kind: "text", text: "Label", id: "9:2" }],
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
      return null;
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

  it("non-override slug with good anatomy + sidecar bindings → map[slug] carries per-node token facts", function () {
    // Inject a fake sidecar byNodeId map for 'spinner' to prove the join is
    // wired through the map layer (root container + text child).
    var anatomyLoader = function (slug) {
      return GOOD_ANATOMY;
    };
    var tokenBindingsLoader = function (slug) {
      if (slug === "spinner")
        return {
          byNodeId: {
            "9:1": [
              {
                property: "background-color",
                token: "--zen-color-primary-500",
                grade: "semantic",
              },
            ],
            "9:2": [
              {
                property: "color",
                token: "--zen-color-text-default",
                grade: "semantic",
              },
            ],
          },
        };
      return null;
    };
    var map = buildDsAnatomyMap(["spinner"], {
      anatomyLoader: anatomyLoader,
      tokenBindingsLoader: tokenBindingsLoader,
    });
    assert.ok("spinner" in map, "spinner must be in map");
    assert.ok(
      map["spinner"].indexOf(
        "background-color:var(--zen-color-primary-500)",
      ) !== -1,
      "map entry must carry the root node's token fact",
    );
    assert.ok(
      map["spinner"].indexOf("color:var(--zen-color-text-default)") !== -1,
      "map entry must carry the text node's token fact",
    );
  });

  it("non-override slug whose anatomy loader returns null → EXCLUDED from map", function () {
    var anatomyLoader = function () {
      return null;
    };
    var tokenBindingsLoader = function () {
      return null;
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
        return null;
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
        return null;
      },
    });
    assert.ok(
      "spinner" in map,
      "spinner included when not in custom builtSlugs",
    );
  });
});
