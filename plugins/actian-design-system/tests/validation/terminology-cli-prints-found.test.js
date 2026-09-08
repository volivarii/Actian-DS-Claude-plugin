#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var { validate } = require("../helpers/validate-cli.js");

describe("terminology-cli-prints-found", function () {
  var flow = function (text) {
    return {
      meta: { feature: "T", app: "Studio" },
      screens: [
        {
          name: "S1",
          template: "studio",
          content: [{ type: "TEXT", content: text }],
        },
      ],
    };
  };

  it("prints the found word and the suggested fix on a terminology line", function () {
    var r = validate(flow("Browse every dataset"));
    assert.match(r.out, /found "dataset".*use "data product"/i);
  });

  it("leaves the printed line unchanged when the finding has no found word", function () {
    var r = validate(flow("Page Title"));
    assert.match(r.out, /P0 \[placeholder-text\]/);
    assert.doesNotMatch(r.out, /\(found/);
  });
});
