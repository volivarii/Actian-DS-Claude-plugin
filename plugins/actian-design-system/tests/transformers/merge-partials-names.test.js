"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("node:fs");
var os = require("node:os");
var path = require("node:path");
var cp = require("node:child_process");

// merge-partials-names.test.js — the incremental flow merge matches a
// partial's screen name to the screen-list entry even when the partial's
// name still carries the agent's own "Screen N: " prefix, and the merged
// output carries the screen list's (plain) name, not the partial's.

var SCRIPT = path.resolve(
  __dirname,
  "../../scripts/transformers/merge-partials.js",
);

function mk() {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "merge-names-"));
  fs.mkdirSync(path.join(dir, ".partial"), { recursive: true });
  return dir;
}
function writeList(dir, list) {
  var lp = path.join(dir, "screen-list.json");
  fs.writeFileSync(lp, JSON.stringify(list));
  return lp;
}
function runIncremental(dir, listPath) {
  var out = path.join(dir, "flow-data.json");
  var r = cp.spawnSync(
    process.execPath,
    [
      SCRIPT,
      "--type",
      "flow",
      "--incremental",
      "--screen-list",
      listPath,
      "--partials-dir",
      path.join(dir, ".partial"),
      "--output",
      out,
    ],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(fs.readFileSync(out, "utf8"));
}

describe("merge-partials --incremental: tolerant name matching", function () {
  it('a partial named "Screen 2: Data product detail" fills the list entry "Data product detail" and carries the list name', function () {
    var dir = mk();
    fs.writeFileSync(
      path.join(dir, ".partial", "p1.json"),
      JSON.stringify({
        _index: 1,
        meta: { feature: "Cat" },
        screens: [
          {
            name: "Screen 2: Data product detail",
            template: "studio",
            content: [{ type: "TEXT", content: "Body", size: 16 }],
          },
        ],
      }),
    );
    var lp = writeList(dir, {
      meta: { feature: "Cat" },
      screens: [
        { name: "Data products", template: "studio" },
        { name: "Data product detail", template: "studio" },
      ],
    });
    var res = runIncremental(dir, lp);
    assert.equal(res.screens.length, 2);
    assert.equal(res.screens[0].name, "Data products");
    assert.equal(res.screens[0].status, "pending");
    assert.equal(res.screens[1].name, "Data product detail");
    assert.ok(
      !("status" in res.screens[1]),
      "matched screen carries no pending status",
    );
    assert.deepEqual(res.screens[1].content, [
      { type: "TEXT", content: "Body", size: 16 },
    ]);
  });

  it("tolerates a period or dash separator and extra spacing, case-insensitively", function () {
    var dir = mk();
    fs.writeFileSync(
      path.join(dir, ".partial", "p1.json"),
      JSON.stringify({
        _index: 1,
        meta: { feature: "Cat" },
        screens: [
          { name: "screen 03 -   Review", template: "studio", content: [] },
        ],
      }),
    );
    var lp = writeList(dir, {
      meta: { feature: "Cat" },
      screens: [{ name: "Review", template: "studio" }],
    });
    var res = runIncremental(dir, lp);
    assert.equal(res.screens.length, 1);
    assert.equal(res.screens[0].name, "Review");
    assert.ok(!("status" in res.screens[0]));
  });

  it("a partial named exactly like the list entry still matches (regression)", function () {
    var dir = mk();
    fs.writeFileSync(
      path.join(dir, ".partial", "p1.json"),
      JSON.stringify({
        _index: 1,
        meta: { feature: "Cat" },
        screens: [{ name: "Data products", template: "studio", content: [] }],
      }),
    );
    var lp = writeList(dir, {
      meta: { feature: "Cat" },
      screens: [{ name: "Data products", template: "studio" }],
    });
    var res = runIncremental(dir, lp);
    assert.equal(res.screens[0].name, "Data products");
    assert.ok(!("status" in res.screens[0]));
  });
});
