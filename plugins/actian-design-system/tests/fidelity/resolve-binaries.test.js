// tests/fidelity/resolve-binaries.test.js
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var R = require("../../scripts/fidelity/resolve-binaries");

test("resolveBinary returns first candidate that exists", function () {
  var exists = function (p) {
    return p === "chromium";
  };
  assert.equal(
    R.resolveBinary(["google-chrome", "chromium", "chrome"], {
      exists: exists,
    }),
    "chromium",
  );
});

test("resolveBinary returns null when none exist", function () {
  assert.equal(
    R.resolveBinary(["a", "b"], {
      exists: function () {
        return false;
      },
    }),
    null,
  );
});

test("resolveChrome prefers CHROME_BIN env override", function () {
  var got = R.resolveChrome({
    env: { CHROME_BIN: "/custom/chrome" },
    exists: function (p) {
      return p === "/custom/chrome";
    },
  });
  assert.equal(got, "/custom/chrome");
});

test("resolveImageMagick returns a {cmd, mode} or null", function () {
  var got = R.resolveImageMagick({
    exists: function (p) {
      return p === "compare";
    },
  });
  assert.deepEqual(got, { cmd: "compare", mode: "im6" });
  var got7 = R.resolveImageMagick({
    exists: function (p) {
      return p === "magick";
    },
  });
  assert.deepEqual(got7, { cmd: "magick", mode: "im7" });
  assert.equal(
    R.resolveImageMagick({
      exists: function () {
        return false;
      },
    }),
    null,
  );
});

test("requireAll throws a setup message naming the missing binary", function () {
  assert.throws(function () {
    R.requireAll({ chrome: null, imagemagick: { cmd: "magick", mode: "im7" } });
  }, /brew install|Chrome/i);
});

test("requireAll throws naming BOTH tools when both are missing", function () {
  assert.throws(
    function () {
      R.requireAll({ chrome: null, imagemagick: null });
    },
    function (err) {
      return /Chrome/i.test(err.message) && /brew install/i.test(err.message);
    },
  );
});

test("requireAll returns the resolved object when both present", function () {
  var resolved = {
    chrome: "/x/chrome",
    imagemagick: { cmd: "magick", mode: "im7" },
  };
  assert.equal(R.requireAll(resolved), resolved);
});

test("resolveAll composes chrome + imagemagick into one shape", function () {
  var got = R.resolveAll({
    env: {},
    exists: function (p) {
      return p === "compare";
    },
  });
  assert.deepEqual(got, {
    chrome: null,
    imagemagick: { cmd: "compare", mode: "im6" },
  });
});
