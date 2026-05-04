#!/usr/bin/env node
"use strict";

// Verifies the --no-prompt flag parser used by skills with interactive gates
// (/generate-flow, /design-audit, /convert-to-hifi). The parser strips the
// flag and reports whether it was present, so callers can decide whether to
// run the gate prose or skip with defaults.
//
// Covered cases:
//   1. Flag absent → noPrompt=false, args unchanged
//   2. Flag at end of args → noPrompt=true, flag removed
//   3. Flag in middle of args → noPrompt=true, flag removed in place
//   4. Flag at start → noPrompt=true, flag removed
//   5. Multiple occurrences → noPrompt=true, all occurrences removed
//   6. Empty args → noPrompt=false, empty args
//   7. Only --no-prompt → noPrompt=true, empty args
//   8. Flag adjacent to value-bearing flags doesn't disturb them

var { describe, it } = require("node:test");
var assert = require("node:assert");

var parseNoPrompt = require("../../scripts/lib/parse-no-prompt.js");

describe("parse-no-prompt", function () {
  it("absent → noPrompt=false, args returned unchanged", function () {
    var result = parseNoPrompt(["foo", "bar", "--variants", "3"]);
    assert.strictEqual(result.noPrompt, false);
    assert.deepStrictEqual(result.remainingArgs, ["foo", "bar", "--variants", "3"]);
  });

  it("at end → noPrompt=true, flag removed", function () {
    var result = parseNoPrompt(["foo", "bar", "--no-prompt"]);
    assert.strictEqual(result.noPrompt, true);
    assert.deepStrictEqual(result.remainingArgs, ["foo", "bar"]);
  });

  it("in middle → noPrompt=true, flag removed in place", function () {
    var result = parseNoPrompt(["foo", "--no-prompt", "bar"]);
    assert.strictEqual(result.noPrompt, true);
    assert.deepStrictEqual(result.remainingArgs, ["foo", "bar"]);
  });

  it("at start → noPrompt=true, flag removed", function () {
    var result = parseNoPrompt(["--no-prompt", "foo", "bar"]);
    assert.strictEqual(result.noPrompt, true);
    assert.deepStrictEqual(result.remainingArgs, ["foo", "bar"]);
  });

  it("multiple occurrences → noPrompt=true, all removed", function () {
    var result = parseNoPrompt(["--no-prompt", "foo", "--no-prompt", "bar", "--no-prompt"]);
    assert.strictEqual(result.noPrompt, true);
    assert.deepStrictEqual(result.remainingArgs, ["foo", "bar"]);
  });

  it("empty args → noPrompt=false, empty args", function () {
    var result = parseNoPrompt([]);
    assert.strictEqual(result.noPrompt, false);
    assert.deepStrictEqual(result.remainingArgs, []);
  });

  it("only --no-prompt → noPrompt=true, empty args", function () {
    var result = parseNoPrompt(["--no-prompt"]);
    assert.strictEqual(result.noPrompt, true);
    assert.deepStrictEqual(result.remainingArgs, []);
  });

  it("preserves value-bearing flags adjacent to --no-prompt", function () {
    var result = parseNoPrompt(["--variants", "3", "--no-prompt", "--ref", "https://figma.com/x"]);
    assert.strictEqual(result.noPrompt, true);
    assert.deepStrictEqual(result.remainingArgs, ["--variants", "3", "--ref", "https://figma.com/x"]);
  });

  it("does not match partial / prefixed variants", function () {
    var result = parseNoPrompt(["--no-prompts", "--noPrompt", "--no-prompt-extra"]);
    assert.strictEqual(result.noPrompt, false);
    assert.deepStrictEqual(result.remainingArgs, ["--no-prompts", "--noPrompt", "--no-prompt-extra"]);
  });

  it("does not mutate the input array", function () {
    var input = ["foo", "--no-prompt", "bar"];
    var snapshot = input.slice();
    parseNoPrompt(input);
    assert.deepStrictEqual(input, snapshot);
  });
});
