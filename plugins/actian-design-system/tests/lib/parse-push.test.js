#!/usr/bin/env node
"use strict";

// Verifies the --push / --no-push flag parser used by /generate-flow to
// decide whether to push the generated flow to Figma. The default is no
// push (HTML deliverable only); --push opts in explicitly; --no-push wins
// ties when both flags are present.
//
// Covered cases:
//   1. Neither flag → push=false, explicit=false
//   2. --push only → push=true, explicit=true
//   3. --no-push only → push=false, explicit=true
//   4. Both flags → push=false, explicit=true (--no-push wins)
//   5. Flags anywhere in argv (start, middle, end)
//   6. Unrelated args don't trigger either flag
//   7. Empty args → push=false, explicit=false
//   8. Partial / prefixed variants don't match
//   9. Does not mutate the input array

var { describe, it } = require("node:test");
var assert = require("node:assert");

var parsePush = require("../../scripts/lib/parse-push.js");

describe("parse-push", function () {
  it("neither flag → push=false, explicit=false", function () {
    var result = parsePush(["foo", "bar", "--variants", "3"]);
    assert.strictEqual(result.push, false);
    assert.strictEqual(result.explicit, false);
  });

  it("--push only → push=true, explicit=true", function () {
    var result = parsePush(["foo", "--push", "bar"]);
    assert.strictEqual(result.push, true);
    assert.strictEqual(result.explicit, true);
  });

  it("--no-push only → push=false, explicit=true", function () {
    var result = parsePush(["foo", "--no-push", "bar"]);
    assert.strictEqual(result.push, false);
    assert.strictEqual(result.explicit, true);
  });

  it("both flags → push=false, explicit=true (--no-push wins ties)", function () {
    var result = parsePush(["--push", "--no-push"]);
    assert.strictEqual(result.push, false);
    assert.strictEqual(result.explicit, true);
  });

  it("both flags in opposite order → push=false, explicit=true (--no-push still wins)", function () {
    var result = parsePush(["--no-push", "--push"]);
    assert.strictEqual(result.push, false);
    assert.strictEqual(result.explicit, true);
  });

  it("--push at start of args", function () {
    var result = parsePush(["--push", "foo", "bar"]);
    assert.strictEqual(result.push, true);
    assert.strictEqual(result.explicit, true);
  });

  it("--push at end of args", function () {
    var result = parsePush(["foo", "bar", "--push"]);
    assert.strictEqual(result.push, true);
    assert.strictEqual(result.explicit, true);
  });

  it("--no-push at start of args", function () {
    var result = parsePush(["--no-push", "foo", "bar"]);
    assert.strictEqual(result.push, false);
    assert.strictEqual(result.explicit, true);
  });

  it("--no-push at end of args", function () {
    var result = parsePush(["foo", "bar", "--no-push"]);
    assert.strictEqual(result.push, false);
    assert.strictEqual(result.explicit, true);
  });

  it("unrelated flags don't trigger push", function () {
    var result = parsePush(["--no-prompt", "--share", "--refresh", "--variants", "3"]);
    assert.strictEqual(result.push, false);
    assert.strictEqual(result.explicit, false);
  });

  it("empty args → push=false, explicit=false", function () {
    var result = parsePush([]);
    assert.strictEqual(result.push, false);
    assert.strictEqual(result.explicit, false);
  });

  it("only --push → push=true, explicit=true", function () {
    var result = parsePush(["--push"]);
    assert.strictEqual(result.push, true);
    assert.strictEqual(result.explicit, true);
  });

  it("only --no-push → push=false, explicit=true", function () {
    var result = parsePush(["--no-push"]);
    assert.strictEqual(result.push, false);
    assert.strictEqual(result.explicit, true);
  });

  it("does not match partial / prefixed variants of --push", function () {
    var result = parsePush(["--pusher", "--push-to-figma", "--pushes"]);
    assert.strictEqual(result.push, false);
    assert.strictEqual(result.explicit, false);
  });

  it("does not match partial / prefixed variants of --no-push", function () {
    var result = parsePush(["--no-pusher", "--no-push-to-figma", "--noPush"]);
    assert.strictEqual(result.push, false);
    assert.strictEqual(result.explicit, false);
  });

  it("preserves value-bearing flags adjacent to --push", function () {
    var result = parsePush(["--variants", "3", "--push", "--ref", "https://figma.com/x"]);
    assert.strictEqual(result.push, true);
    assert.strictEqual(result.explicit, true);
  });

  it("does not mutate the input array", function () {
    var input = ["foo", "--push", "bar"];
    var snapshot = input.slice();
    parsePush(input);
    assert.deepStrictEqual(input, snapshot);
  });
});
