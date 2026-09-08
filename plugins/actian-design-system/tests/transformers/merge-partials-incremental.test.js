"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("node:fs");
var os = require("node:os");
var path = require("node:path");
var cp = require("node:child_process");

var SCRIPT = path.resolve(
  __dirname,
  "../../scripts/transformers/merge-partials.js",
);

function mk() {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "csw-incr-"));
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

describe("merge-partials --incremental (flow skeleton-fill)", function () {
  it("0 partials -> all screens pending, in list order, meta from list", function () {
    var dir = mk();
    var lp = writeList(dir, {
      meta: { feature: "Cat" },
      screens: [
        { name: "A", template: "studio" },
        { name: "B", template: "studio" },
      ],
    });
    var res = runIncremental(dir, lp);
    assert.equal(res.screens.length, 2);
    assert.equal(res.screens[0].name, "A");
    assert.equal(res.screens[0].status, "pending");
    assert.equal(res.screens[1].name, "B");
    assert.equal(res.screens[1].status, "pending");
    assert.equal(res.meta.feature, "Cat");
  });

  it("subset present -> present ready (no status), missing pending, list order kept", function () {
    var dir = mk();
    fs.writeFileSync(
      path.join(dir, ".partial", "p1.json"),
      JSON.stringify({
        _index: 1,
        meta: { feature: "Cat" },
        screens: [
          {
            name: "B",
            template: "studio",
            content: [{ type: "TEXT", content: "Body B", size: 16 }],
          },
        ],
      }),
    );
    var lp = writeList(dir, {
      meta: { feature: "Cat" },
      screens: [
        { name: "A", template: "studio" },
        { name: "B", template: "studio" },
      ],
    });
    var res = runIncremental(dir, lp);
    assert.equal(res.screens[0].name, "A");
    assert.equal(res.screens[0].status, "pending");
    assert.equal(res.screens[1].name, "B");
    assert.ok(
      !("status" in res.screens[1]),
      "ready screen carries no status field",
    );
    assert.deepEqual(res.screens[1].content, [
      { type: "TEXT", content: "Body B", size: 16 },
    ]);
  });

  it("all present -> parity with the non-incremental merge (same screens, no status)", function () {
    var dir = mk();
    var sA = {
      name: "A",
      template: "studio",
      content: [{ type: "TEXT", content: "Body A", size: 16 }],
    };
    var sB = {
      name: "B",
      template: "studio",
      content: [{ type: "TEXT", content: "Body B", size: 16 }],
    };
    fs.writeFileSync(
      path.join(dir, ".partial", "p0.json"),
      JSON.stringify({ _index: 0, meta: { feature: "Cat" }, screens: [sA] }),
    );
    fs.writeFileSync(
      path.join(dir, ".partial", "p1.json"),
      JSON.stringify({ _index: 1, screens: [sB] }),
    );
    var lp = writeList(dir, {
      meta: { feature: "Cat" },
      screens: [
        { name: "A", template: "studio" },
        { name: "B", template: "studio" },
      ],
    });
    var incr = runIncremental(dir, lp);

    var out2 = path.join(dir, "full.json");
    var r2 = cp.spawnSync(
      process.execPath,
      [
        SCRIPT,
        "--type",
        "flow",
        "--partials-dir",
        path.join(dir, ".partial"),
        "--output",
        out2,
      ],
      { encoding: "utf8" },
    );
    assert.equal(r2.status, 0, r2.stderr);
    var full = JSON.parse(fs.readFileSync(out2, "utf8"));
    assert.deepEqual(
      incr.screens,
      full.screens,
      "incremental(all present) screens == non-incremental merge screens",
    );
  });

  it("dies cleanly on malformed screen-list JSON (no raw stack)", function () {
    var dir = mk();
    var lp = path.join(dir, "screen-list.json");
    fs.writeFileSync(lp, "{ not valid json");
    var out = path.join(dir, "flow-data.json");
    var r = cp.spawnSync(
      process.execPath,
      [
        SCRIPT,
        "--type",
        "flow",
        "--incremental",
        "--screen-list",
        lp,
        "--partials-dir",
        path.join(dir, ".partial"),
        "--output",
        out,
      ],
      { encoding: "utf8" },
    );
    assert.notEqual(r.status, 0, "exits non-zero on bad JSON");
    assert.match(
      r.stderr,
      /cannot parse screen-list JSON/,
      "clean die message, not a raw stack",
    );
  });
});
