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

test("requireAll throws a Chrome setup message when chrome is missing", function () {
  assert.throws(function () {
    R.requireAll({ chrome: null });
  }, /Chrome/i);
});

test("requireAll returns the resolved object when chrome is present", function () {
  var resolved = { chrome: "/x/chrome" };
  assert.equal(R.requireAll(resolved), resolved);
});

test("resolveAll returns just the chrome path (no system image tool needed)", function () {
  var got = R.resolveAll({
    env: {},
    exists: function (p) {
      return p === "chrome";
    },
  });
  assert.deepEqual(got, { chrome: "chrome" });
});
