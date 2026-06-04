"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("node:fs");
var os = require("node:os");
var path = require("node:path");
var cp = require("node:child_process");

var SCRIPT = path.resolve(
  __dirname,
  "../../scripts/renderers/assemble-preview.js",
);
var FIXTURE = path.join(__dirname, "fixtures", "refresh-probe.flow.json");

function render(extraArgs) {
  var out = path.join(
    os.tmpdir(),
    "csw-refresh-" +
      process.pid +
      "-" +
      extraArgs.join("_").replace(/[^a-z0-9]/gi, "") +
      ".html",
  );
  var args = [SCRIPT, FIXTURE, "--type", "flow", "-o", out].concat(extraArgs);
  var r = cp.spawnSync(process.execPath, args, { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  var html = fs.readFileSync(out, "utf8");
  fs.unlinkSync(out);
  return html;
}

describe("assemble-preview --refresh", function () {
  it("injects a self-contained meta-refresh + JS reload at the given interval", function () {
    var html = render(["--refresh", "2"]);
    assert.match(
      html,
      /<meta http-equiv="refresh" content="2">/,
      "meta-refresh present",
    );
    assert.match(
      html,
      /setTimeout\(function\(\)\{location\.reload\(\);\}, 2000\)/,
      "JS reload fallback present at 2000ms",
    );
  });

  it("injects nothing when the flag is absent (default)", function () {
    // Use --no-annotations to isolate the refresh seam from annotation-layer.js
    // (which contains its own location.reload() for mtime-based hot-reload).
    var html = render(["--no-annotations"]);
    assert.doesNotMatch(
      html,
      /http-equiv="refresh"/,
      "no meta-refresh by default",
    );
    assert.doesNotMatch(
      html,
      /location\.reload\(\)/,
      "no JS reload by default",
    );
  });

  it("treats 0 / non-positive / non-numeric as off", function () {
    ["0", "-1", "abc"].forEach(function (v) {
      var html = render(["--refresh", v, "--no-annotations"]);
      assert.doesNotMatch(
        html,
        /http-equiv="refresh"/,
        "refresh=" + v + " injects no meta",
      );
      assert.doesNotMatch(
        html,
        /location\.reload\(\)/,
        "refresh=" + v + " injects no JS",
      );
    });
  });

  it("changes ONLY the reload lines vs the no-flag render (deterministic seam)", function () {
    var plain = render(["--no-annotations"]).split("\n");
    var refreshed = render(["--refresh", "3", "--no-annotations"]).split("\n");
    var added = refreshed.filter(function (line) {
      return plain.indexOf(line) === -1;
    });
    // Only the two injected lines are new.
    assert.equal(
      added.length,
      2,
      "exactly two lines added, got: " + JSON.stringify(added),
    );
    assert.ok(
      added.some(function (l) {
        return /http-equiv="refresh"/.test(l);
      }),
    );
    assert.ok(
      added.some(function (l) {
        return /location\.reload\(\)/.test(l);
      }),
    );
  });
});
