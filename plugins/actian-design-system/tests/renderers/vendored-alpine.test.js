"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");

var ALPINE = path.join(
  __dirname,
  "..",
  "..",
  "templates",
  "vendor",
  "alpinejs-3.14.9.min.js",
);

test("vendored Alpine exists and is non-trivial", function () {
  assert.ok(fs.existsSync(ALPINE), "alpinejs-3.14.9.min.js is vendored");
  var src = fs.readFileSync(ALPINE, "utf8");
  assert.ok(
    src.length > 20000,
    "looks like a real minified Alpine build (>20KB)",
  );
  assert.ok(/Alpine/.test(src), "contains the Alpine global marker");
});

test("vendored Alpine has no external <script>/<link> of its own", function () {
  var src = fs.readFileSync(ALPINE, "utf8");
  // It is a JS file, not HTML — it must not load remote resources.
  // Alpine's own source legitimately contains "<script>" inside a string literal
  // warning message. The real risk is a <script src="…"> or <link href="…"> that
  // would trigger a network fetch, so we check for those specifically.
  assert.ok(
    /<script[^>]+src=/i.test(src) === false,
    "no remote script src= tags",
  );
  assert.ok(
    /<link[^>]+href=/i.test(src) === false,
    "no remote link href= tags",
  );
});
