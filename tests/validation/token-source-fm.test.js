#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var { validate, flowWithText } = require("../helpers/validate-cli.js");

describe("validate-flow-data: token source", function () {
  it("an FM token defined in fm-base.css is not a finding", function () {
    var r = validate(flowWithText("var(--fm-text-tertiary)"));
    assert.doesNotMatch(r.out, /\[token\].*--fm-text-tertiary/);
  });
  it("an undefined FM token is still a finding (the check can fail)", function () {
    var r = validate(flowWithText("var(--fm-not-a-token)"));
    assert.match(r.out, /\[token\].*--fm-not-a-token/);
  });
});
