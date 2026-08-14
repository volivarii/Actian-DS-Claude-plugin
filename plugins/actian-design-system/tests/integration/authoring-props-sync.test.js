// tests/integration/authoring-props-sync.test.js
//
// Gate: the built-leaf props section of references/generate-flow/ds-components-authoring.md
// is GENERATED from the substrate's render contract
// (vendor/components/render/dist/render-contract.json), the same way the
// vocabulary table above it is generated from the registry + BUILT_SLUGS.
//
// It exists because that section had gone stale in the way a reader cannot
// detect. Its prose said "the following 19 slugs have real HTML leaf renderers"
// while the vocabulary table in the same file correctly marked 58, and it
// documented 45 (slug, prop) bindings against the 177 the renderer exposes. The
// screen generator therefore knew a component could be rendered but not what to
// call any of its content, and a prop name the renderer does not read is not an
// error: it renders an empty slot. Nine of the affected components are the ones
// an app screen needs most (side-nav, toolbar, stepper, notification, popover,
// drawer, calendar, tooltip, the lineage nodes).
//
// Every assertion below is derived on both sides. None pins a slug list or a
// count, which is the failure this whole change exists to remove.
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var gen = require("../../scripts/renderers/render-authoring-props.js");
var PATHS = require("../../scripts/lib/paths.js");

function contract() {
  return JSON.parse(fs.readFileSync(PATHS.components.render.contract, "utf8"));
}

test("the built-leaf props section is in sync with the render contract", function () {
  var md = fs.readFileSync(gen.MD_PATH, "utf8");
  var regenerated = gen.replaceProps(md, gen.renderPropRows());
  assert.equal(
    regenerated,
    md,
    "Stale built-leaf props section, regenerate and commit:\n" +
      "  node scripts/renderers/render-authoring-props.js",
  );
});

test("every slug the renderer implements has a row", function () {
  var slugs = Object.keys(contract().slugs).sort();
  var rows = gen.renderPropRows();
  var rowSlugs = rows
    .map(function (r) {
      return (r.match(/^\| `([a-z0-9-]+)`/) || [])[1];
    })
    .filter(Boolean)
    .sort();
  assert.deepEqual(
    rowSlugs,
    slugs,
    "the section must cover exactly the renderable slugs, no more and no fewer",
  );
});

test("a prop's stated default is the one the contract publishes", function () {
  var c = contract().slugs;
  var withDefault = null;
  Object.keys(c).forEach(function (slug) {
    c[slug].props.forEach(function (p) {
      if (!withDefault && p.default) withDefault = { slug: slug, prop: p };
    });
  });
  assert.ok(withDefault, "the contract publishes at least one default");
  var row = gen.renderPropRows().find(function (r) {
    return r.indexOf("| `" + withDefault.slug + "`") === 0;
  });
  assert.ok(row, "the slug has a row");
  assert.ok(
    row.indexOf(withDefault.prop.default) !== -1,
    "the row must carry the contract's default verbatim for " +
      withDefault.slug +
      "." +
      withDefault.prop.name,
  );
});

test("a value the renderer cannot distinguish is called out on its row", function () {
  var c = contract().slugs;
  var found = null;
  Object.keys(c).forEach(function (slug) {
    var v = c[slug].variants || {};
    Object.keys(v).forEach(function (axis) {
      var aliases = Object.keys(v[axis].rendersAs || {});
      if (!found && aliases.length) {
        found = { slug: slug, value: aliases[0], target: v[axis].rendersAs[aliases[0]] };
      }
    });
  });
  assert.ok(found, "the contract records at least one indistinguishable value");
  var row = gen.renderPropRows().find(function (r) {
    return r.indexOf("| `" + found.slug + "`") === 0;
  });
  assert.ok(
    row.indexOf(found.value) !== -1 && row.indexOf(found.target) !== -1,
    "an author choosing " +
      found.value +
      " gets " +
      found.target +
      "'s rendering, and the row must say so",
  );
});

test("no prose in the file contradicts the contract about what is renderable", function () {
  // The specific sentence this replaces was "The following 19 slugs have real
  // HTML leaf renderers", sitting directly beneath a table that correctly listed
  // 58. Any count asserted about renderable slugs must now match the contract.
  var md = fs.readFileSync(gen.MD_PATH, "utf8");
  var total = Object.keys(contract().slugs).length;
  var re = /(\d+)\s+slugs?\s+have\s+real\s+HTML\s+leaf\s+renderers/g;
  var m;
  while ((m = re.exec(md)) !== null) {
    assert.equal(
      Number(m[1]),
      total,
      "the file claims " +
        m[1] +
        " renderable slugs; the contract publishes " +
        total,
    );
  }
});

test("the generated block is delimited, so hand-authored guidance survives regeneration", function () {
  // The worked examples below the block carry semantics the contract cannot know
  // ("use Critical for destructive actions"). Regeneration must not eat them.
  var md = fs.readFileSync(gen.MD_PATH, "utf8");
  assert.ok(md.indexOf(gen.BEGIN) !== -1, "begin marker present");
  assert.ok(md.indexOf(gen.END) !== -1, "end marker present");
  assert.ok(
    md.indexOf(gen.END) > md.indexOf(gen.BEGIN),
    "markers are ordered",
  );
  var handAuthored = md.slice(md.indexOf(gen.END));
  assert.match(
    handAuthored,
    /### `button`/,
    "the worked examples must live outside the generated block",
  );
});
