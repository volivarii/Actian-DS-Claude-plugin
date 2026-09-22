#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var { validate } = require("../helpers/validate-cli.js");

describe("missing-required-override", function () {
  var button = function (props) {
    return { meta: { feature: "T", app: "Studio" },
      screens: [{ name: "S1", template: "studio", content: [
        { type: "INSTANCE", ref: "fmButton", variant: "Type=Primary, Size=md, Shape=Regular, State=Default", props: props } ] }] };
  };
  it("plain Label satisfies Label#1411:32", function () {
    var r = validate(button({ Label: "Save changes", "👁 Leading Icon": false, "👁 Trailing Icon": false }));
    assert.doesNotMatch(r.out, /missing-required-override/);
  });
  it("no label at all is still a P0 (the check can fail)", function () {
    var r = validate(button({ "👁 Leading Icon": false, "👁 Trailing Icon": false }));
    assert.match(r.out, /P0 \[missing-required-override\]/);
  });
});
