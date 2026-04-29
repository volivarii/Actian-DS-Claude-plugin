#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var fs = require("fs");
var derive = require("../scripts/derive-scope.js");

function load(name) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8"),
  );
}

describe("deriveScope", function () {
  it("single-screen edit → single-unit:<id>", function () {
    var before = load("refine-before.json");
    var after = load("refine-after-single.json");
    assert.strictEqual(
      derive.deriveScope(before, after),
      "single-unit:notification-preferences-2",
    );
  });

  it("two-screen edit → multi-unit:[id1,id2]", function () {
    var before = load("refine-before.json");
    var after = load("refine-after-multi.json");
    assert.strictEqual(
      derive.deriveScope(before, after),
      "multi-unit:[notification-preferences-2,notification-preferences-3]",
    );
  });

  it("no-op (deep-equal) → null", function () {
    var data = load("refine-before.json");
    var copy = JSON.parse(JSON.stringify(data));
    assert.strictEqual(derive.deriveScope(data, copy), null);
  });

  it("screen reorder, content unchanged → null (id-keyed, not positional)", function () {
    var before = load("refine-before.json");
    var after = JSON.parse(JSON.stringify(before));
    after.screens = [after.screens[2], after.screens[0], after.screens[1]];
    assert.strictEqual(derive.deriveScope(before, after), null);
  });

  it("screen deleted → that id appears in scope", function () {
    var before = load("refine-before.json");
    var after = JSON.parse(JSON.stringify(before));
    after.screens.splice(1, 1);
    assert.strictEqual(
      derive.deriveScope(before, after),
      "single-unit:notification-preferences-2",
    );
  });

  it("screen added → that id appears in scope", function () {
    var before = load("refine-before.json");
    var after = JSON.parse(JSON.stringify(before));
    after.screens.push({
      id: "notification-preferences-4",
      name: "New",
      content: [],
    });
    assert.strictEqual(
      derive.deriveScope(before, after),
      "single-unit:notification-preferences-4",
    );
  });

  it("all screens changed → full", function () {
    var before = load("refine-before.json");
    var after = JSON.parse(JSON.stringify(before));
    after.screens.forEach(function (s) {
      s.content[0].props.title = s.name + " updated";
    });
    assert.strictEqual(derive.deriveScope(before, after), "full");
  });

  it("screens missing id field → skipped (defensive)", function () {
    var before = { screens: [{ id: "a" }, {}] };
    var after = { screens: [{ id: "a" }, { name: "x" }] };
    assert.strictEqual(derive.deriveScope(before, after), null);
  });

  it("empty inputs → null", function () {
    assert.strictEqual(derive.deriveScope(null, null), null);
    assert.strictEqual(derive.deriveScope({}, {}), null);
    assert.strictEqual(derive.deriveScope({ screens: [] }, { screens: [] }), null);
  });
});
