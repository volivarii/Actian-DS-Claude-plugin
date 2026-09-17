"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");

var look = require(
  path.join(__dirname, "..", "..", "scripts", "renderers", "look.js"),
);

describe("look.buildLookHtml (pure)", function () {
  it("builds a side-by-side page with both images and a three-line structure prompt", function () {
    var html = look.buildLookHtml({
      renderPng: "look-1.png",
      againstPng: "captures/faceted-browse.png",
      title: "Catalog",
    });
    assert.match(html, /<img[^>]+src="look-1\.png"/);
    assert.match(html, /<img[^>]+src="captures\/faceted-browse\.png"/);
    assert.match(html, /What differs in structure, three lines/);
  });

  it("labels the render as design system components and the product as page structure", function () {
    var html = look.buildLookHtml({
      renderPng: "a.png",
      againstPng: "b.png",
      title: "X",
    });
    assert.match(html, /<h2>Render \(design system components\)<\/h2>/);
    assert.match(html, /<h2>Product \(page structure\)<\/h2>/);
  });

  it("says appearance differences are not differences", function () {
    var html = look.buildLookHtml({
      renderPng: "a.png",
      againstPng: "b.png",
      title: "X",
    });
    assert.match(html, /Ignore colour, type, spacing and component styling/);
    assert.match(html, /added or changed on purpose/);
  });

  it("escapes the title so it cannot break out of the page", function () {
    var html = look.buildLookHtml({
      renderPng: "a.png",
      againstPng: "b.png",
      title: "<script>alert(1)</script>",
    });
    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  });
});

describe("look.main (CLI)", function () {
  it("exits 1 with the usage line when a required arg is missing", function () {
    var written = "";
    var realWrite = process.stderr.write;
    process.stderr.write = function (s) {
      written += s;
      return true;
    };
    var code;
    try {
      code = look.main(["flow.json", "--screen", "1", "-o", "/tmp/look-out"]);
    } finally {
      process.stderr.write = realWrite;
    }
    assert.strictEqual(code, 1);
    assert.match(written, /usage: look\.js/);
  });

  it("exits 1 when the input is not a .json path (no ?screen=n on the share HTML)", function () {
    var written = "";
    var realWrite = process.stderr.write;
    process.stderr.write = function (s) {
      written += s;
      return true;
    };
    var code;
    try {
      code = look.main([
        "flow-share.html",
        "--screen",
        "1",
        "--against",
        "against.png",
        "-o",
        "/tmp/look-out",
      ]);
    } finally {
      process.stderr.write = realWrite;
    }
    assert.strictEqual(code, 1);
    assert.match(written, /flow-data \.json path/);
  });

  it("exits 2 with the resolver's message when Chrome is absent", function () {
    var fakeResolveBinaries = {
      resolveAll: function () {
        return { chrome: null };
      },
      requireAll: function () {
        throw new Error(
          "[fidelity] missing required tool:\n  - Chrome/Chromium (set CHROME_BIN, or install Google Chrome)",
        );
      },
    };
    var written = "";
    var realWrite = process.stderr.write;
    process.stderr.write = function (s) {
      written += s;
      return true;
    };
    var code;
    try {
      code = look.main(
        [
          "flow.json",
          "--screen",
          "1",
          "--against",
          "against.png",
          "-o",
          "/tmp/look-out",
        ],
        { resolveBinaries: fakeResolveBinaries },
      );
    } finally {
      process.stderr.write = realWrite;
    }
    assert.strictEqual(code, 2);
    assert.match(written, /missing required tool/);
    assert.match(written, /Chrome\/Chromium/);
  });
});

describe("look.renderScreenFragment", function () {
  it("renders screen n (1-based) as an HTML fragment", function () {
    var flowData = {
      meta: {},
      screens: [
        {
          name: "One",
          template: "bare",
          content: [{ type: "TEXT", content: "First" }],
        },
        {
          name: "Two",
          template: "bare",
          content: [{ type: "TEXT", content: "Second" }],
        },
      ],
    };
    var out = look.renderScreenFragment(flowData, 2);
    assert.match(out.html, /Second/);
    assert.strictEqual(out.screen.name, "Two");
  });

  it("throws on an out-of-range screen index", function () {
    var flowData = {
      meta: {},
      screens: [{ name: "One", template: "bare", content: [] }],
    };
    assert.throws(function () {
      look.renderScreenFragment(flowData, 5);
    }, /out of range/);
  });

  it("renders a layered screen over its base, looked up by id", function () {
    var flowData = {
      meta: {},
      screens: [
        {
          id: "catalog",
          name: "Catalog",
          template: "bare",
          content: [{ type: "TEXT", content: "Base content" }],
        },
        {
          id: "toast",
          name: "Toast",
          layer: { kind: "toast", over: "catalog" },
          content: [{ type: "TEXT", content: "Published" }],
        },
      ],
    };
    var out = look.renderScreenFragment(flowData, 2);
    assert.match(out.html, /screen--layered/);
    assert.match(out.html, /Base content/);
    assert.match(out.html, /Published/);
  });
});

describe("look.captureScreens", function () {
  var fs = require("fs");

  it("pairs a faceted-browse screen with the vendored product screenshot under src/recipes/captures", function () {
    var pairs = look.captureScreens({
      screens: [
        { name: "Catalog", pageRecipe: { slug: "faceted-browse" } },
        { name: "Selected", pageRecipe: null },
      ],
    });
    assert.strictEqual(pairs.length, 1);
    assert.strictEqual(pairs[0].n, 1);
    assert.strictEqual(pairs[0].slug, "faceted-browse");
    assert.match(
      pairs[0].against,
      /app-context[\/\\]src[\/\\]recipes[\/\\]captures[\/\\]faceted-browse\.png$/,
    );
    assert.ok(fs.existsSync(pairs[0].against), "the screenshot exists on disk");
  });

  it("skips a recipe with no screenshot and one whose screenshot file is missing", function () {
    var pairs = look.captureScreens(
      {
        screens: [
          { pageRecipe: { slug: "no-shot" } },
          { pageRecipe: { slug: "gone" } },
          { pageRecipe: { slug: "here" } },
        ],
      },
      {
        readRecipe: function (slug) {
          return slug === "no-shot"
            ? { derivedFrom: {} }
            : { derivedFrom: { screenshot: "captures/" + slug + ".png" } };
        },
        srcDir: function () {
          return "/recipes";
        },
        exists: function (p) {
          return p === path.join("/recipes", "captures", "here.png");
        },
      },
    );
    assert.deepStrictEqual(pairs, [
      {
        n: 3,
        slug: "here",
        against: path.join("/recipes", "captures", "here.png"),
      },
    ]);
  });

  it("warns and skips when a recipe cannot be read, instead of silently skipping it", function () {
    var warnings = [];
    var pairs = look.captureScreens(
      { screens: [{ pageRecipe: { slug: "broken" } }] },
      {
        readRecipe: function () {
          throw new Error("boom");
        },
        srcDir: function () {
          return "/recipes";
        },
        exists: function () {
          return true;
        },
        warn: function (msg) {
          warnings.push(msg);
        },
      },
    );
    assert.deepStrictEqual(pairs, []);
    assert.strictEqual(warnings.length, 1);
    assert.match(
      warnings[0],
      /look: screen 1: cannot read recipe broken: boom/,
    );
  });
});

describe("look.main --brief", function () {
  var fs = require("fs");
  var os = require("os");

  function captureStdout(fn) {
    var out = "";
    var real = process.stdout.write;
    process.stdout.write = function (s) {
      out += s;
      return true;
    };
    try {
      return { code: fn(), out: out };
    } finally {
      process.stdout.write = real;
    }
  }

  function tmpFiles(brief, flow) {
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "look-brief-"));
    fs.writeFileSync(path.join(dir, ".brief.json"), JSON.stringify(brief));
    fs.writeFileSync(path.join(dir, "flow-data.json"), JSON.stringify(flow));
    return dir;
  }

  var neverChrome = {
    resolveAll: function () {
      throw new Error("Chrome must not be resolved when nothing qualifies");
    },
    requireAll: function () {},
  };

  it("exits 0 and says so when no screen composes from a capture with a screenshot", function () {
    var dir = tmpFiles(
      { screens: [{ pageRecipe: null }] },
      { meta: {}, screens: [{ name: "A", template: "bare", content: [] }] },
    );
    var r = captureStdout(function () {
      return look.main(
        [
          path.join(dir, "flow-data.json"),
          "--brief",
          path.join(dir, ".brief.json"),
          "-o",
          path.join(dir, "look"),
        ],
        { resolveBinaries: neverChrome },
      );
    });
    assert.strictEqual(r.code, 0);
    assert.match(
      r.out,
      /look: no screen composes from a capture with a screenshot/,
    );
  });

  it("renders each qualifying screen and names the capture it is compared against", function () {
    var dir = tmpFiles(
      { screens: [{ pageRecipe: { slug: "faceted-browse" } }] },
      {
        meta: {},
        screens: [
          {
            name: "Catalog",
            template: "bare",
            content: [{ type: "TEXT", content: "Catalog" }],
          },
        ],
      },
    );
    var fakeChrome = {
      resolveAll: function () {
        return { chrome: "/fake/chrome" };
      },
      requireAll: function () {},
    };
    var fakeRenderLeaf = {
      screenshot: function (o) {
        fs.writeFileSync(o.outPng, "");
      },
    };
    var outDir = path.join(dir, "look");
    var r = captureStdout(function () {
      return look.main(
        [
          path.join(dir, "flow-data.json"),
          "--brief",
          path.join(dir, ".brief.json"),
          "-o",
          outDir,
        ],
        {
          resolveBinaries: fakeChrome,
          renderLeaf: fakeRenderLeaf,
        },
      );
    });
    assert.strictEqual(r.code, 0);
    assert.ok(fs.existsSync(path.join(outDir, "look-1.png")));
    assert.ok(fs.existsSync(path.join(outDir, "look-1.html")));
    assert.match(
      r.out,
      /look: wrote .*look-1\.png and .*look-1\.html against .*faceted-browse\.png/,
    );
  });
});
