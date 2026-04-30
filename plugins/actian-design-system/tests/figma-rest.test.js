#!/usr/bin/env node
"use strict";

var { describe, it, beforeEach, afterEach } = require("node:test");
var assert = require("node:assert");

// Path manipulation: require fresh each time because module caches a
// reference to globalThis.fetch and process.env at load.
function loadFreshRest() {
  delete require.cache[require.resolve("../scripts/figma-rest.js")];
  return require("../scripts/figma-rest.js");
}

// Capture original env / fetch so each test can restore.
var ORIG_ENV = process.env.FIGMA_PAT;
var ORIG_FETCH = globalThis.fetch;

function mockFetch(handler) {
  globalThis.fetch = handler;
}

function restoreFetch() {
  globalThis.fetch = ORIG_FETCH;
}

function jsonResponse(status, body) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status: status,
    headers: {
      get: function () { return null; },
    },
    json: function () { return Promise.resolve(body); },
    text: function () { return Promise.resolve(JSON.stringify(body)); },
  });
}

describe("figma-rest", function () {
  beforeEach(function () {
    process.env.FIGMA_PAT = "test-pat-12345";
  });

  afterEach(function () {
    if (ORIG_ENV === undefined) delete process.env.FIGMA_PAT;
    else process.env.FIGMA_PAT = ORIG_ENV;
    restoreFetch();
  });

  describe("auth", function () {
    it("sends X-Figma-Token header from FIGMA_PAT", function () {
      var capturedHeaders = null;
      mockFetch(function (url, opts) {
        capturedHeaders = opts && opts.headers;
        return jsonResponse(200, { meta: { component_sets: [] } });
      });
      var rest = loadFreshRest();
      return rest.getComponentSets("abc").then(function () {
        assert.strictEqual(capturedHeaders["X-Figma-Token"], "test-pat-12345");
      });
    });

    it("throws when FIGMA_PAT is missing", function () {
      delete process.env.FIGMA_PAT;
      var rest = loadFreshRest();
      return rest.getComponentSets("abc").then(
        function () { assert.fail("should have thrown"); },
        function (err) {
          assert.match(err.message, /FIGMA_PAT/);
        }
      );
    });
  });

  describe("URL construction", function () {
    it("getFile defaults to depth=1", function () {
      var capturedUrl = null;
      mockFetch(function (url) {
        capturedUrl = url;
        return jsonResponse(200, { document: { children: [] } });
      });
      var rest = loadFreshRest();
      return rest.getFile("filekey123").then(function () {
        assert.match(capturedUrl, /\/v1\/files\/filekey123\?depth=1/);
      });
    });

    it("getFile with explicit depth=0 omits the depth param (full tree)", function () {
      var capturedUrl = null;
      mockFetch(function (url) {
        capturedUrl = url;
        return jsonResponse(200, { document: {} });
      });
      var rest = loadFreshRest();
      return rest.getFile("filekey123", { depth: 0 }).then(function () {
        assert.ok(capturedUrl.indexOf("depth=") === -1, "depth param should be absent for full-tree fetch");
      });
    });

    it("getNode includes ids query param", function () {
      var capturedUrl = null;
      mockFetch(function (url) {
        capturedUrl = url;
        return jsonResponse(200, { nodes: {} });
      });
      var rest = loadFreshRest();
      return rest.getNode("filekey123", "12685:19373").then(function () {
        assert.match(capturedUrl, /\/v1\/files\/filekey123\/nodes\?ids=12685(%3A|:)19373/);
      });
    });

    it("getStyles, getComponents, getComponentSets target correct endpoints", function () {
      var calls = [];
      mockFetch(function (url) {
        calls.push(url);
        return jsonResponse(200, { meta: {} });
      });
      var rest = loadFreshRest();
      return Promise.all([
        rest.getStyles("k"),
        rest.getComponents("k"),
        rest.getComponentSets("k"),
      ]).then(function () {
        assert.match(calls[0], /\/v1\/files\/k\/styles$/);
        assert.match(calls[1], /\/v1\/files\/k\/components$/);
        assert.match(calls[2], /\/v1\/files\/k\/component_sets$/);
      });
    });
  });

  describe("response handling", function () {
    it("returns parsed JSON on 200", function () {
      mockFetch(function () { return jsonResponse(200, { foo: "bar" }); });
      var rest = loadFreshRest();
      return rest.getComponentSets("k").then(function (data) {
        assert.deepStrictEqual(data, { foo: "bar" });
      });
    });

    it("throws on 403 (no retry)", function () {
      var calls = 0;
      mockFetch(function () {
        calls++;
        return jsonResponse(403, { err: "Invalid token" });
      });
      var rest = loadFreshRest();
      return rest.getComponentSets("k").then(
        function () { assert.fail("should have thrown"); },
        function (err) {
          assert.strictEqual(calls, 1, "should NOT retry on 403");
          assert.match(err.message, /403/);
        }
      );
    });

    it("throws on 404 (no retry)", function () {
      var calls = 0;
      mockFetch(function () {
        calls++;
        return jsonResponse(404, { err: "Not found" });
      });
      var rest = loadFreshRest();
      return rest.getComponentSets("k").then(
        function () { assert.fail("should have thrown"); },
        function (err) {
          assert.strictEqual(calls, 1);
          assert.match(err.message, /404/);
        }
      );
    });
  });

  describe("retry logic", function () {
    it("retries 5xx up to 3 times then throws", function () {
      var calls = 0;
      mockFetch(function () {
        calls++;
        return jsonResponse(500, { err: "Internal error" });
      });
      var rest = loadFreshRest();
      // Disable real backoff for fast test
      rest._setBackoffDelays([0, 0, 0]);
      return rest.getComponentSets("k").then(
        function () { assert.fail("should have thrown"); },
        function (err) {
          assert.strictEqual(calls, 4, "1 initial attempt + 3 retries = 4 calls");
          assert.match(err.message, /500/);
        }
      );
    });

    it("retries 5xx and succeeds on 3rd attempt", function () {
      var calls = 0;
      mockFetch(function () {
        calls++;
        if (calls < 3) return jsonResponse(503, { err: "Unavailable" });
        return jsonResponse(200, { ok: true });
      });
      var rest = loadFreshRest();
      rest._setBackoffDelays([0, 0, 0]);
      return rest.getComponentSets("k").then(function (data) {
        assert.strictEqual(calls, 3);
        assert.deepStrictEqual(data, { ok: true });
      });
    });

    it("retries 429 once with backoff then throws if still 429", function () {
      var calls = 0;
      mockFetch(function () {
        calls++;
        return jsonResponse(429, { err: "Rate limited" });
      });
      var rest = loadFreshRest();
      rest._setBackoffDelays([0, 0, 0]);
      return rest.getComponentSets("k").then(
        function () { assert.fail("should have thrown"); },
        function (err) {
          assert.ok(calls >= 2, "should retry on 429 at least once, got " + calls + " calls");
          assert.match(err.message, /429/);
        }
      );
    });
  });
});
